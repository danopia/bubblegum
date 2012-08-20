var Client = require('./../node-irc').Client,
    identd = require('./../identd');

exports.addpage =
  {"name":"irc",
   "title":"IRC",
   "fields":[
    ["server", "server"],
    ["nickname", "nick"],
    ["channels", "chans"]]};

exports.start = function(socket, data, callback) {
  var client = new Client(data.nick),
      server = client.connect(data.server);
  
  server.on('connect', function () {
    identd.register(server, socket.profile.ident);
  });
  
  data.tabs = {};
  data.tabCount = 0;
  data.labels = [];
  var getTab = function (label) {
    if (data.tabs[label])
      return data.tabs[label];
    
    var tab = data.tabs[label] = {
      label: label,
      view: data.tabCount
    }
    
    data.labels.push(label);
    
    data.tabCount++;
    
    callback('addtab', tab.view, tab);
    return tab;
  };
  
  
  client.on('PING', function(e) {
    e.server.send('pong', e.params);
  });

  client.on('001', function(e) {
    data.nick = e.params[0];
    callback('connect', -1, data.nick);
    
    data.channels.forEach(function (channel) {
      e.server.join(channel);
    });
  });
  
  client.on('JOIN', function(e) {
    var chan = (e.params[0][0] == ':') ? e.params[0].substr(1) : e.params[0];
    callback('join', getTab(chan).view, e.originNick);
  });

  /*
  client.on('353', function(e) {
    callback('names', [e.params[2], e.params[3]]);
  });
  */

  client.on('PRIVMSG', function(e) {
    var label = (e.params[0][0] == '#') ? e.params[0] : e.originNick;
    callback('message', getTab(label).view, [e.originNick, e.params[1]]);
  });

  return {
    data: data,
    
    message: function(info) {
      var target = data.labels[info[0]];
      server.message(target, info[1]);
      callback('ack', info[0], ['message', data.nick, info[1]]);
    },
    
    sendTabs: function(servid, socket) {
      data.labels.forEach(function (label) {
        var tab = data.tabs[label];
        socket.emit('event', [servid, tab.view, 'addtab', tab, '[XX:XX:XX]']);
      });
    }
  };
}
