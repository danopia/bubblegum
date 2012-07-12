var express = require('express')
  , utils = require('./utils')

  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)

  , sockets = []
  , profiles = {};

server.listen(4200);

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.htm');
});

io.sockets.on('connection', function (socket) {
  var address = socket.handshake.address
    , ip = address.address;
  console.log("New socket connection from " + address.address + ":" + address.port);
  sockets.push(socket);
  
  socket.profile = profiles[ip];
  if (socket.profile) {
    socket.profile.clients.push(socket);
  } else {
    profiles[ip] = socket.profile = {
      clients: [socket],
      services: [],
      account: ip,
      ident: ip.split('.').map(function(byte){return ((Number(byte)<15)?'0':'') + Number(byte).toString(16)}).join('')
    }
  }

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
  
  socket.on('logout', function (e) {
    socket.emit('logout');
    socket.emit('dialog', {action: 'open', id: 'auth', data: require('./data/authorize')});
  });
  
  socket.emit('logout');
  socket.emit('dialog', {action: 'open', id: 'auth', data: require('./data/authorize')});
  
  socket.on('dialog', function (e) {
    if (e.action == 'submit') {
      if (e.fields.user == 'danopia') {
        socket.emit('dialog', {action: 'close', id: 'auth'});
        var profile = require('./profiles/danopia');
        profile.emailmd5 = require('crypto').createHash('md5').update(profile.email).digest('hex');
        socket.emit('login', profile);
      } else {
        socket.emit('dialog', {action: 'flash', id: 'auth', message: 'Invalid username or password.'});
        socket.emit('dialog', {action: 'unlock', id: 'auth'});
      }
    } else if (e.action == 'load') {
      socket.emit('dialog', {action: 'open', id: e.id, data: {heading: 'add new service', pages: [
        require('./protocols/irc').addpage,
        {"name":"fb","title":"facebook","fields":[["username", "user"],["password", "pass", {type: 'password'}]]}]}});
    }
  });

});
