var sock   = require('./socket');
var socket = sock.unixConnect('master');
sock.json(socket);
sock.banner(socket, {welcome: 'hey', session: 'test'});

socket.on('json', function (msg) {
  if (msg.welcome == 'hey') {
    socket.send({auth: {username: 'danopia', password: 'asdf'}});
  } else if (msg.status == 'ready' && msg.guid == 'deadbeef') {
    socket.send({guid: msg.guid, line: 'PRIVMSG #bubblegum :im here!'});
  };
});

socket.on('end', function () {
  console.log('Disconnected from upstream');
});

