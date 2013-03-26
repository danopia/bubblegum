var fs   = require('fs'),
    path = require('path'),
    net  = require('net');

var socket = path.join('/run', 'user', process.env.USER, 'bubblegum', 'irc');

var conns = {};
function fetchConn (deets) {
  if (conns[deets.guid]) {
    return conns[deets.guid];
  } else {
    deets.status = 'connecting';
          server.c && server.c.write(JSON.stringify({guid: deets.guid, status: deets.status}) + '\n');
    deets.sock = net.connect(deets.port || 6667, deets.server, function () {
      console.log('Connected to', deets.server);
      
      deets.sock.write('NICK ' + deets.nick + '\r\n');
      deets.sock.write('USER bubblegum * * :A loyal Bubblegum beta-tester :3\r\n');
      deets.status = 'authing';
          server.c && server.c.write(JSON.stringify({guid: deets.guid, status: deets.status}) + '\n');
    });
    
    var buffer = '';
    deets.sock.on('data', function (block) {
      buffer += block.replace(/\r/g, '');
      while (buffer.indexOf('\n') >= 0) {
        var line = buffer.slice(0, buffer.indexOf('\n'));
        buffer = buffer.slice(buffer.indexOf('\n') + 1);
        
        console.log(deets.nick, '@', deets.server, '<<', line);
        
        if (line.indexOf(' 001 ') > 0) {
          deets.sock.write('JOIN ' + deets.channels.join(',') + '\r\n');
          deets.status = 'ready';
          server.c && server.c.write(JSON.stringify({guid: deets.guid, status: deets.status}) + '\n');
        } else if (line.indexOf('PING') === 0) {
          deets.sock.write(line.replace('PING', 'PONG'));
        };
        
        server.c && server.c.write(JSON.stringify({guid: deets.guid, line: line}) + '\n');
      };
    }).setEncoding('utf8');
    
    deets.sock.on('end', function () {
      console.log('Disconnected from', deets.server);
    });
    
    return (conns[deets.guid] = deets);
  };
};

var server;
fs.unlink(socket, function (err) {
  server = net.createServer(function (c)  {
    console.log('master connected');
    server.c = c;
    
    c.on('end', function () {
      server.c = null;
      console.log('master disconnected');
    });
    
    var buffer = '';
    c.on('data', function (block) {
      buffer += block;
      while (buffer.indexOf('\n') >= 0) {
        var line = buffer.slice(0, buffer.indexOf('\n'));
        buffer = buffer.slice(buffer.indexOf('\n') + 1);
        
        var msg = JSON.parse(line);
        console.log('master sent', msg);
       
        if (msg.welcome == 'hey') {
          c.write(JSON.stringify({welcome: 'hey', protocols: ['irc']}) + '\n');
        } else if (msg.prep) {
          var conn = fetchConn(msg.prep);
          c.write(JSON.stringify({guid: conn.guid, status: conn.status}) + '\n');
        } else if (msg.refresh) {
          var conn = conns[msg.refresh];
          c.write(JSON.stringify({guid: conn.guid, status: conn.status}) + '\n');
        } else if (msg.guid) {
          var conn = conns[msg.guid];
          conn.sock.write(msg.line + '\r\n');
        };
      };
    }).setEncoding('utf8');
    
  }).listen(socket, function () {
    console.log('ready for master');
  });
});

