var sock = require('./socket'),
    fs   = require('fs'),
    net  = require('net');

var conns = {};
function fetchConn (deets) {
  if (conns[deets.guid]) {
    return conns[deets.guid];
  } else {
    deets.status = 'connecting';
    server.c && server.c.send({guid: deets.guid, status: deets.status});
    
    deets.sock = net.connect(deets.port || 6667, deets.server, function () {
      console.log('Connected to', deets.server);
      
      deets.sock.send('NICK ' + deets.nick);
      deets.sock.send('USER bubblegum * * :A loyal Bubblegum beta-tester :3');
      
      deets.status = 'authing';
      server.c && server.c.send({guid: deets.guid, status: deets.status});
    });
    sock.line(deets.sock);
    
    deets.sock.on('line', function (line) {
      if (line.indexOf(' 001 ') > 0) {
        deets.sock.send('JOIN ' + deets.channels.join(','));
        deets.status = 'ready';
        server.c && server.c.send({guid: deets.guid, status: deets.status});
      } else if (line.indexOf('PING') === 0) {
        deets.sock.send(line.replace('PING', 'PONG'));
      };
      
      server.c && server.c.send({guid: deets.guid, line: line});
    });
    
    deets.sock.on('end', function () {
      console.log('Disconnected from', deets.server);
    });
    
    return (conns[deets.guid] = deets);
  };
};

var server;
fs.unlink(sock.unixPath('irc'), function (err) {
  server = net.createServer(function (c)  {
    console.log('master connected');
    sock.json(c);
    server.c = c;
    
    c.on('end', function () {
      server.c = null;
      console.log('master disconnected');
    });
    
    c.on('json', function (msg) {
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
    });
    
  }).listen(sock.unixPath('irc'), function () {
    console.log('ready for master');
  });
});

