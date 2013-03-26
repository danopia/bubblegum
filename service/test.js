var path = require('path'),
    net  = require('net');

var master = path.join('/run', 'user', process.env.USER, 'bubblegum', 'master');
var socket = net.connect(master, function () {
  console.log('Connected to upstream');
  socket.write(JSON.stringify({welcome: 'hey', session: 'test'}) + '\n');
});


var buffer = '';
socket.on('data', function (block) {
  buffer += block;
  while (buffer.indexOf('\n') >= 0) {
    var line = buffer.slice(0, buffer.indexOf('\n'));
    buffer = buffer.slice(buffer.indexOf('\n') + 1);
    
    var msg = JSON.parse(line);
    console.log('upstream sent', msg);
    
    if (msg.welcome == 'hey') {
      socket.write(JSON.stringify({auth: true, username: 'danopia', password: 'asdf'}) + '\n');
    } else if (msg.status == 'ready') {
      //socket.write(JSON.stringify({guid: 'deadbeef', line: 'PRIVMSG #bubblegum :im here!'}) + '\n');
      socket.write(JSON.stringify({guid: 'deadbeef', line: 'PRIVMSG #offtopic :this code is so fucking ugly and i dont even care'}) + '\n');
    };
  };
}).setEncoding('utf8');

socket.on('end', function () {
  console.log('Disconnected from upstream');
});

