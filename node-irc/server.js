var net  = require('net'),
    util = require('util'),

    Event = require('./event').Event;

exports.Server = function(host, port, handler) {
  net.Socket.call(this);

  this.host = host;
  this.port = port || 6667;
  this.handler = handler;

  this.channels = [];

  this.buffer = '';

  this.on('data', this.handleBuffer);
  this.on('connect', this.handleConnection);
}
util.inherits(exports.Server, net.Socket);

exports.Server.prototype.handleBuffer = function(data) {
  this.buffer += data;

  var i;
  while ((i = this.buffer.indexOf("\r\n")) != -1) {
    this.handleLine(this.buffer.substring(0, i));
    this.buffer = this.buffer.substring(i + 2);
  }
};

exports.Server.prototype.handleLine = function(line) {
  console.log('<< ' + line);
  this.handler(new Event(line, this));
};

exports.Server.prototype.handleConnection = function() {
  console.log('connected');
  this.send('NICK', [this.nick]);
  this.send('USER', [this.nick, '*', '*', 'Node.JS-powered IRC client']);
};

exports.Server.prototype.send = function(command, params) {
  if (params && params.length > 0) {
    var last = params[params.length - 1];
    if (last.indexOf(' ') != -1 || last[0] == ':') {
      params.push(':' + params.pop());
    }

    this.write(command.toUpperCase() + ' ' + params.join(' ') + "\r\n");
    console.log('>> ' + command.toUpperCase() + ' ' + params.join(' '));
  } else {
    this.write(command.toUpperCase() + "\r\n");
    console.log('>> ' + command.toUpperCase());
  }
}


var curry = function(command) {
  return function() {
    this.send(command, Array.prototype.slice.call(arguments));
  };
}

exports.Server.prototype.message = curry('privmsg');
exports.Server.prototype.notice = curry('notice');
exports.Server.prototype.join = curry('join');
exports.Server.prototype.quit = curry('quit');