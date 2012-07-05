var util = require('util');

exports.getTimestamp = function() {
  var date = new Date();
  return util.format('[%d:%d:%d]', date.getHours(), date.getMinutes(), date.getSeconds());
}

