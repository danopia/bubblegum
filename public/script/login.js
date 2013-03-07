var dia = new $.Dialog('login', 'Welcome to Bubblegum');
dia.layout([
  ['p', {text: 'Please log in.'}],
  ['field', {label: 'username', name: 'user'}],
  ['field', {label: 'password', name: 'pass', type: 'password'}],
  ['button', {text: 'log in'}]]);

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

