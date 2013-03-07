$.window = {};
$.window.$dom = $('body');

$.window.setUI = function (ui) {
  if ($.window.ui) {
    $.window.ui.active = false;
    $.window.ui.$dom.detach();
  };

  $.window.$dom.append(ui.$dom);
  $.window.ui = ui;
  $.window.ui.active = true;
};

$('#preload').remove();