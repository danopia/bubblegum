var express = require('express')
  , http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var sockets = [];

server.listen(4200);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.htm');
});

app.get('/*', function (req, res) {
  res.sendfile(__dirname + '/public/' + req.params[0]);
});

io.sockets.on('connection', function (socket) {
  sockets.push(socket);

  socket.conns = {};

  socket.on('start', function (data) {
    var protocol = require('./protocols/' + data);
    conn = protocol.start(socket, function(name, event) {
      socket.emit('event', [data, name, event]);
    });
    socket.conns[data] = conn;
  });

  socket.on('event', function (data) {
    var conn = socket.conns[data[0]];
    if (conn) { conn[data[1]](data[2]) };
  });
});
