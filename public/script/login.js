var dia = new $.Dialog('login', 'Please sign in');
dia.layout([
  ['field', {label: 'username', name: 'user'}],
  ['field', {label: 'password', name: 'pass', type: 'password'}],
  ['button', {text: 'get chatting'}]]);

dia.submit(function (data) {
  var dia = new $.Dialog('addservice', 'Add a Service');
  dia.layout([
    ['p', {text: 'IRC only right now.'}],
    ['field', {name: 'server'}],
    ['field', {name: 'nick'}],
    ['button', {text: 'connect'}]]);

  dia.submit(function (data) {
    console.log('Form:', data);
  });

  var ui = new $.UI('main').append(dia);
  $.window.setUI(ui);
});

var ui = new $.UI('login').append(dia);
$.window.setUI(ui);

