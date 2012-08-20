var util = require('util');

exports.getTimestamp = function () {
  var date = new Date();
  return util.format('[%d:%d:%d]', date.getHours(), date.getMinutes(), date.getSeconds());
}

exports.decByteToHex = function (dec) {
  dec = Number(dec);
  return ((dec < 16) ? '0' : '') + dec.toString(16);
};

exports.ipToHex = function (ip) {
  return ip.split('.').map(decByteToHex).join('');
};
