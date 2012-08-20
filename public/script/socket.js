$(function() {
  $.socket = io.connect();
  
  $.socket.on('login', function (profile) {
    $.profile = profile;
    $.ui = new $.UI(profile);
  });
  
  $.socket.on('logout', function () {
    if ($.ui) $.ui.close();
    delete $.ui;
  });

  var dialogs = {};
  $.socket.on('dialog', function (e) {
    switch (e.action) {
    case 'open':
      dialogs[e.id] = new $.Dialog(e.id, e.data)
      dialogs[e.id].show();
      break;
      
    case 'unlock':
      dialogs[e.id].unlock();
      break;
      
    case 'flash':
      dialogs[e.id].flash(e);
      break;
      
    case 'close':
      dialogs[e.id].close();
      //delete dialogs[e.id];
      break;

    };
  });
});

