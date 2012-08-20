var express = require('express')
  , utils = require('./utils')

  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)

  , Client = require('./client')
  , db = require('./db')

  , sockets = [];

server.listen(80, function () {
  console.log('Listening on http://localhost/');
});

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.htm');
});

io.sockets.on('connection', function (socket) {
  sockets.push(socket);
  var client = new Client(socket);

  /*
  socket.on('addservice', function (data) {
    var servid = socket.profile.services.length;
    var protocol = require('./protocols/' + data.protocol);
    socket.emit('addservice', [servid, data.protocol, data.server, data.nick]);
    service = protocol.start(socket, data, function(name, tab, event) {
      socket.profile.clients.forEach(function (client) {
        client.emit('event', [servid, tab, name, event, utils.getTimestamp()]);
      });
    });
    socket.profile.services[servid] = service;
  });

  socket.on('event', function (data) {
    var service = socket.profile.services[data[0]];
    if (service) service[data[1]](data[2]);
  });
  
  socket.profile.services.forEach(function (service, servid) {
    socket.emit('addservice', [servid, service.data.protocol, service.data.server, service.data.nick]);
    service.sendTabs(servid, socket);
  });
  */
  
  socket.on('logout', function (e) {
    socket.emit('logout');
    client.openDialog(require('./authDialog'));
  });
  
  socket.emit('logout');
  client.openDialog(require('./authDialog'));
});
