exports.Event = function(line, server) {
  var x;

  this.line = line;

  if (line[0] == ':') {
    x = line.indexOf(' ');
    this.parseSource(line.substring(1, x));
    line = line.substring(x + 1);
  }

  x = line.indexOf(' ');
  this.command = line.substring(0, x);
  line = line.substring(x + 1);

  x = line.indexOf(' :');
  if (x != -1) {
    this.params = line.substring(0, x).split(' ');
    this.params.push(line.substring(x + 2));
  } else {
    this.params = line.split(' ');
  }

  Object.defineProperty(this, 'server', {
    enumerable: false,
    value: server
  });
}

exports.Event.prototype.parseSource = function(raw) {
  var x = raw.split('!');

  this.origin = raw;
  this.originNick = x[0];

  if (x[1]) {
    x = x[1].split('@');
    this.originUser = x[0];
    this.originHost = x[1];
  }
}

exports.Event.prototype.reply = function(message) {
  this.server.message(this.originNick, message);
}