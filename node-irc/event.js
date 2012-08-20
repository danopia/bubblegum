exports.Event = function(line, conn) {
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

  Object.defineProperty(this, 'conn', {
    enumerable: false,
    value: conn
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
  this.conn.message(this.originNick, message);
}
