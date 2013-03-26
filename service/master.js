var fs   = require('fs'),
    path = require('path'),
    net  = require('net');

var root = path.join('/run', 'user', process.env.USER, 'bubblegum');

var protos = {};
var conns = {};
function gotProto (proto, module) {
  console.log('Installing handler for', proto);
  protos[proto] = {
    module: module,
    build: function (conn) {
      module.sock.write(JSON.stringify({prep: conn}) + '\n');
      conns[conn.guid] = conn;
      
      conn.module = module;
      conn.clients = [];
      conn.add = function (client) {
        conn.clients.push(client);
      };
    }
  };
};

var profiles = {};
function loadProfile (profile, client) {
  if (profiles[profile.guid]) {
    profile = profiles[profile.guid];
    
    profile.conns.forEach(function (c, i) {
      if (c.add) {
        c.add(client);
        client.guids.push(c.guid);
        protos[c.protocol].module.sock.write(JSON.stringify({refresh: c.guid}) + '\n');
        //client.write(JSON.stringify({guid: c.guid, status: 'existing'}) + '\n');
      };
    });
  } else {
    profile = profiles[profile.guid] = JSON.parse(JSON.stringify(profile));
    
    profile.conns.forEach(function (c, i) {
      if (protos[c.protocol]) {
        protos[c.protocol].build(c);
        c.add(client);
        client.guids.push(c.guid);
        //client.write(JSON.stringify({guid: c.guid, status: 'new'}) + '\n');
        protos[c.protocol].module.sock.write(JSON.stringify({refresh: c.guid}) + '\n');
      };
    });
  };
};

var modules = {};
function sighting (name) {
  if (name == 'master') return;
  if (modules[name]) return;
  
  fs.stat(path.join(root, name), function (err, stat) {
    if (err) return;
    
    modules[name] = {};
    console.log('Connecting to', name);
    modules[name].sock = net.connect(path.join(root, name), function () {
      modules[name].sock.write(JSON.stringify({welcome: 'hey'}) + '\n');
    });
    
    var buffer = '';
    modules[name].sock.on('data', function (block) {
      buffer += block;
      while (buffer.indexOf('\n') >= 0) {
        var line = buffer.slice(0, buffer.indexOf('\n'));
        buffer = buffer.slice(buffer.indexOf('\n') + 1);
        
        var msg = JSON.parse(line);
        console.log(name, 'sent', msg);
        
        if (msg.welcome == 'hey') {
          msg.protocols.forEach(function (proto) {
            gotProto(proto, modules[name]);
          });
        } else if (msg.guid) {
          var conn = conns[msg.guid];
          conn.clients.forEach(function (client) {
            client.write(JSON.stringify(msg) + '\n');
          });
        };
      };
    }).setEncoding('utf8');
    
    modules[name].sock.on('end', function () {
      console.log('Disconnected from', name);
      modules[name] = false;
    });
  });
};

fs.mkdir(root, function (err) {
  if (err && err.errno != 47) {
    console.log('Error grabbing', root);
    throw err;
  };
  
  console.log('Running out of', root);
  
  fs.watch(root, { persistent: false }, function (event, filename) {
    sighting(filename);
  });
  
  fs.unlink(path.join(root, 'master'));
  
  fs.readdir(root, function (err, files) {
    files.forEach(sighting);
  });
  
  var server = net.createServer(function (c)  {
    console.log('client connected');
    
    c.on('end', function () {
      console.log('client disconnected', c.guids);
      c.guids.forEach(function (guid) {
        var conn = conns[guid];
        
        if (conn.clients.indexOf(c) >= 0) {
          conn.clients.splice(conn.clients.indexOf(c), 1);
        };
      });
    });
    
    var buffer = '';
    c.guids = [];
    c.on('data', function (block) {
      buffer += block;
      while (buffer.indexOf('\n') >= 0) {
        var line = buffer.slice(0, buffer.indexOf('\n'));
        buffer = buffer.slice(buffer.indexOf('\n') + 1);
        
        var msg = JSON.parse(line);
        console.log('client sent', msg);
        
        if (msg.welcome == 'hey') {
          c.session = msg.session;
          c.write(JSON.stringify({welcome: 'hey', protocols: Object.keys(protos)}) + '\n');
        } else if (msg.auth && msg.username == 'danopia') {
          var profile = {
            guid: 'danopia',
            conns: [
              {protocol: 'irc', server: 'irc.tenthbit.net', channels: ['#bubblegum'], nick: 'danogum', guid: 'deadbeef'}
            ]
          };
          
          loadProfile(profile, c);
        } else if (msg.guid) {
          var conn = conns[msg.guid];
          conn.module.sock.write(JSON.stringify(msg) + '\n');
        };
      };
    }).setEncoding('utf8');
  }).listen(path.join(root, 'master'), function () {
    console.log('server bound');
  });
});

