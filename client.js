module.exports = function (socket) {
  var self = this;
  
  this.socket = socket;
  this.address = socket.handshake.address;
  this.ip = this.address.address;

  this.dialogs = {};
  this.dialogIds = [];

  socket.client = this;
  
  socket.on('dialog', function (pkt) {
    if (pkt.action == 'submit') {
      var dialog = self.dialogs[pkt.id];
      dialog.onSubmit(self, pkt);
    } else {
      // TODO
      self.socket.emit('dialog', {action: 'open', id: pkt.id, data: {heading: 'add new service', pages: [
        require('./protocols/irc').addpage,
        {"name":"fb","title":"facebook","fields":[["username", "user"],["password", "pass", {type: 'password'}]]}]}});
    };
  });

  console.log("New socket connection from " +
              this.address.address + ":" + this.address.port);
}

module.exports.prototype.openDialog = function (dialog) {
  if (this.dialogs[dialog.id]) {
    socket.emit('dialog', {action: 'close', id: dialog.id});
    this.dialogIds = this.dialogIds.splice(this.dialogIds.indexOf(dialog.id), 1);
  }

  this.dialogs[dialog.id] = dialog;
  this.dialogIds.push(dialog.id);
  
  this.socket.emit('dialog', {
    action: 'open',
    id: dialog.id,
    data: {
      heading: dialog.heading,
      pages: dialog.pages}});
};
