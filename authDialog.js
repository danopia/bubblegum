var bcrypt = require('bcrypt'),
    db = require('./db').accounts;

exports.id = 'auth';
exports.heading = 'welcome to bubblegum';
exports.pages = [
  {"name":"auth",
   "title":"log in",
   "fields":[
    ["username", "user"],
    ["password", "pass", {"type":"password"}]]},
  {"name":"create",
   "title":"register",
   "fields":[
    ["username", "user"],
    ["email address", "email"],
    ["password", "pass", {"type":"password"}],
    ["password (again)", "passconf", {"type":"password"}]]},
  {"name":"reset",
   "title":"recover password",
   "fields":[
    ["username", "user"]]}];

exports.onSubmit = function (client, e) {
  switch (e.page) {
  case 'auth':
    db.findOne({user: e.fields.user}, function (err, account) {
      bcrypt.compare(e.fields.pass, account ? account.passhash : '', function (err, same) {
        if (same) {
          client.socket.emit('dialog', {action: 'close', id: 'auth'});
          client.socket.emit('login', account);
          client.profile = account;
        } else {
          client.socket.emit('dialog', {action: 'flash', id: 'auth', message: 'Invalid username or password.'});
          client.socket.emit('dialog', {action: 'unlock', id: 'auth'});
        };
      });
    });
    break;
    
  case 'create':
    bcrypt.hash(e.fields.pass, 10, function (err, hash) {
      var account = {
        user: e.fields.user,
        passhash: hash,
        email: e.fields.email,
        emailmd5: require('crypto').createHash('md5').update(e.fields.email).digest('hex')
      };
      
      db.insert(account, {safe: true}, function (err, obj) {
        if (!err) {
          client.socket.emit('dialog', {action: 'close', id: 'auth'});
          client.socket.emit('login', account);
          client.profile = account;
        } else if (err.code == 11000) {
          client.socket.emit('dialog', {action: 'flash', id: 'auth', message: 'Username is already taken.'});
          client.socket.emit('dialog', {action: 'unlock', id: 'auth'});
        } else {
          client.socket.emit('dialog', {action: 'flash', id: 'auth', message: 'Unknown error occured.'});
          client.socket.emit('dialog', {action: 'unlock', id: 'auth'});
        };
      });
    });
    break;
  }
}