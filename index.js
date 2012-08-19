var express = require('express')
  , mongo = require('mongodb')
  , bcrypt = require('bcrypt')
  , utils = require('./utils')

  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , db = new mongo.Db('bubblegum', new mongo.Server("127.0.0.1", 27017, {}))

  , sockets = []
  , profiles = {};

server.listen(80, function () {
  console.log('Listening on http://localhost/');
});

db.open(function (err) {
  console.log(err ? err : 'Connected to MongoDB');

  var coll = new mongo.Collection(db, 'accounts');
  coll.ensureIndex('user', {unique: true});
});

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
      switch (e.page) {
      case 'auth':
        var coll = new mongo.Collection(db, 'accounts');
        coll.findOne({user: e.fields.user}, function (err, account) {
          bcrypt.compare(e.fields.pass, account ? account.passhash : '', function (err, same) {
            if (same) {
              socket.emit('dialog', {action: 'close', id: 'auth'});
              socket.emit('login', account);
            } else {
              socket.emit('dialog', {action: 'flash', id: 'auth', message: 'Invalid username or password.'});
              socket.emit('dialog', {action: 'unlock', id: 'auth'});
            };
          });
        });
        break;
        
      case 'create':
        bcrypt.hash(e.fields.pass, 10, function (err, hash) {
          var account = {
            user: e.fields.user,
            passhash: hash,
            email: e.fields.email,
            emailmd5: require('crypto').createHash('md5').update(e.fields.email).digest('hex')
          };
            
          var coll = new mongo.Collection(db, 'accounts');
          coll.insert(account, {safe: true}, function (err, obj) {
            if (!err) {
              socket.emit('dialog', {action: 'close', id: 'auth'});
              socket.emit('login', account);
            } else if (err.code == 11000) {
              socket.emit('dialog', {action: 'flash', id: 'auth', message: 'Username is already taken.'});
              socket.emit('dialog', {action: 'unlock', id: 'auth'});
            } else {
              socket.emit('dialog', {action: 'flash', id: 'auth', message: 'Unknown error occured.'});
              socket.emit('dialog', {action: 'unlock', id: 'auth'});
            };
          });
        });
        break;
      }
    } else if (e.action == 'load') {
      socket.emit('dialog', {action: 'open', id: e.id, data: {heading: 'add new service', pages: [
        require('./protocols/irc').addpage,
        {"name":"fb","title":"facebook","fields":[["username", "user"],["password", "pass", {type: 'password'}]]}]}});
    }
  });

});
