var mongo = require('mongodb');

exports.server = new mongo.Server('127.0.0.1', 27017, {});
exports.db = new mongo.Db('bubblegum', exports.server);

exports.db.open(function (err) {
  console.log(err ? err : 'Connected to MongoDB');

  exports.accounts = new mongo.Collection(exports.db, 'accounts');
  exports.accounts.ensureIndex('user', {unique: true});
});
