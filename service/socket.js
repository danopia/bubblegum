var path = require('path'),
    net  = require('net');


exports.unixPath = function (name) {
  return path.join('/run', 'user', process.env.USER, 'bubblegum', name);
};

exports.unixConnect = function (name) {
  return net.connect(exports.unixPath(name));
};


exports.banner = function (sock, obj) {
  sock.on('connect', function () {
    sock.send(obj);
  });
};


var lineIn = function (block) {
  this.buffer += block.replace(/\r/g, '');
  
  var index, line;
  while ((index = this.buffer.indexOf('\n')) >= 0) {
    line = this.buffer.slice(0, index);
    this.buffer = this.buffer.slice(index + 1);

    console.log('<<', line);
    this.emit('line', line);
  };
}, lineOut = function (line) {
  var clean = line.replace(/[\r\n]/g, '');
  
  console.log('>>', clean);
  this.write(clean + '\r\n');
};

exports.line = function (sock) {
  sock.buffer = '';
  
  sock.on('data', lineIn).setEncoding('utf8');
  sock.send = lineOut;
};


var jsonIn = function (line) {
  this.emit('json', JSON.parse(line));
}, jsonOut = function (obj) {
  var clean = JSON.stringify(obj);
  
  console.log('>>', clean);
  this.write(clean + '\r\n');
};

exports.json = function (sock) {
  exports.line(sock);
  
  sock.on('line', jsonIn).setEncoding('utf8');
  sock.send = jsonOut;
};

