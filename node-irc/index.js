var Server  = require('./server').Server,
    Channel = require('./channel').Channel,

    events  = require('events'),
    util    = require('util');

exports.Client = function(nick) {
  events.EventEmitter.call(this);

  this.nick = nick;
  this.servers = [];
}
util.inherits(exports.Client, events.EventEmitter);

exports.Client.prototype.connect = function(host, port) {
  var server = new Server(host, port, this.eventHandler);
  server.nick = this.nick;
  server.client = this;
  server.connect(port || 6667, host);

  this.servers.push(server);
  return server;
}

exports.Client.prototype.eventHandler = function(event) {
  console.log(event);
  this.client.emit('packet', event);
  this.client.emit(event.command, event);
}
