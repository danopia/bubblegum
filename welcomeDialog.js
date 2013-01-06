exports.id = 'welcome';
exports.heading = 'getting started';
exports.pages = [
  {"name":"intro",
   "title":"intro",
   "fields":[
    ["Welcome to Bubblegum!"],
    ["Get right to it and add an instant messaging account."],
    ['add service', 'add', {type: 'submit'}],
    ["You will be prompted for connection details. You can also switch " +
     "protocols with the menu below the dialog."],
    ["Or, to learn more about Bubblegum, try the menu below this dialog."],
    ["Go ahead, I don't bite."]]},
  {"name":"goals",
   "title":"goals",
   "fields":[
    ["username", "user"],
    ["email address", "email"],
    ["password", "pass", {"type":"password"}],
    ["password (again)", "passconf", {"type":"password"}]]},
  {"name":"protocols",
   "title":"protocols",
   "fields":[
    ["username", "user"]]}];

exports.onSubmit = function (client, e) {
  switch (e.page) {
  case 'intro':
    client.socket.emit('dialog', {action: 'close', id: 'welcome'});
    client.openDialog(require('./welcomeDialog'));
    break;
  }
}
