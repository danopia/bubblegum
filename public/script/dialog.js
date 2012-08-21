$.Dialog = function (id, data) {
  var self = this;
  self.id = id;
  self.data = data;
  
  self.$dom = $('<div/>').attr('id', 'dialog-' + self.id).addClass('dialog');
  self.$dom.append(              $('<h2/>').text(self.data.heading));
  self.$dom.append(              $('<section/>').addClass('active modal').append($('<form/>')));
  self.$dom.append(self.$links = $('<p/>').addClass('links'));

  $.each(self.data.pages, function (i, page) {
    if (i > 0) self.$links.append(' | ');
    
    page.$link = $('<a/>').attr('href', '#').text(page.title).attr('data-id', i);
    page.$span = $('<span/>').text(page.title).attr('data-id', i);
    self.$links.append(page.$link);
  });
  
  self.$links.on('click', 'a', function (e) {
    e.preventDefault();
    self.switchTo($(e.target).attr('data-id'));
  });
  
  self.$dom.find('form').submit(function (e) {
    e.preventDefault();
    
    var values = {};
    $.each($(e.target).serializeArray(), function(i, field) {
      values[field.name] = field.value;
    });
    
    self.lock();
    $.socket.emit('dialog', {action: 'submit', id: self.id, page: self.page.name, fields: values});
  });
};

$.Dialog.prototype.show = function () {
  $('body').append(this.$dom);
  this.$links.find('a:first').click();
}
  
$.Dialog.prototype.close = function () {
  this.$dom.animate({height: 0, opacity: 0, 'margin-top': 0},
                    function () { $(this).remove(); });
};

$.Dialog.prototype.switchTo = function (id) {
  if (this.page) this.page.$span.replaceWith(this.page.$link);
  this.page = this.data.pages[id];
  this.page.$link.replaceWith(this.page.$span);
  
  var $form = this.$dom.find('form').empty();

  $.each(this.page.fields, function (i, field) {
    var $p = $('<p/>');

    if (field[2] && field[2].type == 'submit') {
      $p.append($('<input/>').attr({type: 'submit', name: field[1], value: field[0]}));
    } else if (field[1]) {
      $p.append($('<label/>').text(field[0]).attr('for', field[1]));
      $p.append($('<input/>').attr({type: (field[2] ? field[2].type : null) || 'text', name: field[1]}));
    } else {
      $p.html(field[0]);
    }
    
    $form.append($p);
  });
  
  $form.find(':input:first').focus();
  
  this.$dom.css({'margin-top': -this.$dom.innerHeight() / 2});
};

$.Dialog.prototype.lock = function () {
  this.$dom.find('input').attr('disabled', true);
  this.$dom.find('form').append($('<div/>').addClass('pulser').fadeIn(100));
};

$.Dialog.prototype.flash = function (e) {
  var $p = $('<p/>').addClass('flash').text(e.message);
  this.$dom.prepend($p);
  $p.css({top: -$p.innerHeight() - 20});
  
  setTimeout(function () {
    $p.fadeOut(function () { $(this).remove(); });
  }, 2500);
};

$.Dialog.prototype.unlock = function () {
  var $pulser = this.$dom.find('.pulser');
  $pulser.fadeOut(100, function () { $pulser.remove(); });
  this.$dom.find('input').attr('disabled', null);
};
