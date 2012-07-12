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
});

