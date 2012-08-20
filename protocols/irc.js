var Conn = require('./../node-irc').Connection,
    identd = require('./../identd');

exports.addpage =
  {"name":"irc",
   "title":"IRC",
   "fields":[
    ["server", "server"],
    ["nickname", "nick"],
    ["real name", "gecos"],
    ["channels", "chans"]]};

exports.start = function(socket, data, callback) {
  var conn = new Conn(data.server, data.port);
  
  conn.on('connect', function () {
    identd.register(conn, socket.profile.ident);
    conn.send('NICK', [data.nick]);
    conn.send('USER', [data.nick, '*', '*', data.gecos]);
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
  
  
  conn.on('PING', function(e) {
    e.conn.send('pong', e.params);
  });

  conn.on('001', function(e) {
    data.nick = e.params[0];
    callback('connect', -1, data.nick);
    
    data.channels.forEach(function (channel) {
      e.conn.join(channel);
    });
  });
  
  conn.on('JOIN', function(e) {
    var chan = (e.params[0][0] == ':') ? e.params[0].substr(1) : e.params[0];
    callback('join', getTab(chan).view, e.originNick);
  });

  /*
  conn.on('353', function(e) {
    callback('names', [e.params[2], e.params[3]]);
  });
  */

  conn.on('PRIVMSG', function(e) {
    var label = (e.params[0][0] == '#') ? e.params[0] : e.originNick;
    callback('message', getTab(label).view, [e.originNick, e.params[1]]);
  });

  return {
    data: data,
    
    message: function(info) {
      var target = data.labels[info[0]];
      conn.message(target, info[1]);
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
