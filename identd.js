var net = require('net')
  , util = require('util')
  , spawn = require('child_process').spawn

  , server = new net.Server();

exports.entries = {};

exports.register = function (socket, user) {
  var addr = socket.address()
    , local = [addr.address, addr.port]
    , remote = [socket.remoteAddress, socket.remotePort]
    , str = util.format('%s:%s->%s:%s', local[0], local[1], remote[0], remote[1]);
  
  exports.entries[str] = user;
  
  socket.on('close', function (had_error) {
    util.log(util.format('identd: Outgoing socket %s for %s removed', str, user));
    delete exports.entries[str];
  });
  
  util.log(util.format('identd: Outgoing socket %s registered for %s', str, user));
}

// '192.168.1.11:34015->91.189.89.76:443'
exports.lookupOwner = function (str, callback) {
  util.log(util.format('identd: Looking up %s...', str));
  
  var user = exports.entries[str];
  if (user) {
    util.log(util.format('identd: Lookup of %s resolved natively to %s', str, user));
    callback(user, 'native');
    return;
  }
  
  var lsof = spawn('lsof', ['-nP', '-iTCP']);
  var lsof = spawn('sudo', ['lsof', '-nP', '-iTCP']);
  var grep = spawn('grep', [str]);

  lsof.stdout.on('data', function (data) {
    grep.stdin.write(data);
  });

  lsof.on('exit', function (code) {
    process.nextTick(function () {
      grep.stdin.end();
    });
  });

  grep.stdout.on('data', function (data) {
    var fields = data.toString().trim().split(/ +/);
    user = fields[2];
    util.log(util.format('identd: Lookup of %s resolved to UNIX user %s (running %s)', str, user, fields[0]));
    callback(user, 'unix');
  });

  grep.on('exit', function (code) {
    if (!user) {
      util.log(util.format('identd: Lookup of %s failed', str));
      callback(null, null);
    }
  });
}

server.listen(11300, function () {
  console.log("identd running on 11300");
});

server.on('connection', function (socket) {
  var localAddr = socket.address().address
    , remoteAddr = socket.remoteAddress;

  socket.on('data', function (data) {
    var parts = data.toString().split(",").map(function (part) {
      return Number(part.trim());
    });
    
    var str = util.format('%s:%s->%s:%s', localAddr, parts[0], remoteAddr, parts[1]);
    exports.lookupOwner(str, function (user, method) {
      if (user) {
        socket.write([parts.join(','), 'USERID', 'UNIX', user].join(':') + "\n");
      } else {
        socket.write([parts.join(','), 'ERROR', 'NO-USER'].join(':') + "\n");
      }
    });
  });
  
  socket.setTimeout(60000, function () {
    socket.end();
  });
});

