exports.id = 'welcome';
exports.heading = 'getting started';
exports.pages = [
  {"name":"intro",
   "title":"intro",
   "fields":[
    ["Welcome to Bubblegum!"],
    ["To get right to work, hit up the 'Add Service' button on the left."],
    ["You will be prompted for connection details. You can also switch"+
     "protocols with the little menu below the dialog."],
    ["To learn more about Bubblegum, try the menu below this dialog."],
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

exports.onSubmit = function (client, e) {}
