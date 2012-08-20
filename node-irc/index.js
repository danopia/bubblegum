var net  = require('net'),
    util = require('util'),

    Event = require('./event').Event;

exports.Connection = function(host, port) {
  net.Socket.call(this);

  this.host = host;
  this.port = port || 6667;

  this.channels = [];

  this.buffer = '';

  this.on('data', this.handleBuffer);
}
util.inherits(exports.Connection, net.Socket);

exports.Connection.prototype.handleBuffer = function(data) {
  this.buffer += data;

  var i;
  while ((i = this.buffer.indexOf("\r\n")) != -1) {
    this.handleLine(this.buffer.substring(0, i));
    this.buffer = this.buffer.substring(i + 2);
  }
};

exports.Connection.prototype.handleLine = function(line) {
  console.log('<< ' + line);
  this.emit('event', new Event(line, this));
};

exports.Connection.prototype.send = function(command, params) {
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

exports.Connection.prototype.message = curry('privmsg');
exports.Connection.prototype.notice = curry('notice');
exports.Connection.prototype.join = curry('join');
exports.Connection.prototype.quit = curry('quit');
