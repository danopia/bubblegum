$.authorize = {
  open: function (e) {
    var data = this.data = e.data;
    
    var $links;
    this.$dom = $('<div/>').attr('id', 'authorize');
    this.$dom.append(         $('<h2/>').text(data.heading));
    this.$dom.append(         $('<section/>').addClass('active modal').append($('<form/>')));
    this.$dom.append($links = $('<p/>').addClass('links'));
    
    $.each(data.pages, function (i, page) {
      if (i > 0) $links.append(' | ');
      
      page.$link = $('<a/>').attr('href', '#').text(page.title).attr('data-id', i);
      page.$span = $('<span/>').text(page.title).attr('data-id', i);
      $links.append(page.$link);
    });
    
    $links.on('click', 'a', function (e) {
      e.preventDefault();
      $.authorize.switchTo($(e.target).attr('data-id'));
    });
    
    this.$dom.find('form').submit(function (e) {
      e.preventDefault();
      
      var values = {};
      $.each($(e.target).serializeArray(), function(i, field) {
        values[field.name] = field.value;
      });
      
      $.authorize.lock();
      $.socket.emit('dialog', {action: 'submit', id: 'auth', page: $.authorize.page.name, fields: values});
    });
    
    $('body').append(this.$dom);
    
    $links.find('a:first').click();
  },
  
  close: function () {
    this.$dom.animate({height: 0, opacity: 0, 'margin-top': 0}, function () { $(this).remove(); });
  },
  
  switchTo: function (id) {
    if (this.page) this.page.$span.replaceWith(this.page.$link);
    this.page = this.data.pages[id];
    this.page.$link.replaceWith(this.page.$span);
    
    var $form = this.$dom.find('form').empty();
    
    $.each(this.page.fields, function (i, field) {
      var $p = $('<p/>');
      $p.append($('<label/>').text(field[0]).attr('for', field[1]));
      $p.append($('<input/>').attr({type: (field[2] ? field[2].type : null) || 'text', name: field[1]}));
      $form.append($p);
    });
    
    $form.append($('<p/>').append($('<input/>').attr('type', 'submit').val(this.page.title)));
    $form.find(':input:first').focus();
    
    this.$dom.css({'margin-top': -this.$dom.innerHeight() / 2});
  },
  
  lock: function () {
    this.$dom.find('input').attr('disabled', true);
    this.$dom.find('form').append($('<div/>').addClass('pulser').fadeIn(100));
  },
  
  flash: function (e) {
    var $p = $('<p/>').addClass('flash').text(e.message);
    this.$dom.prepend($p);
    $p.css({top: -$p.innerHeight() - 20});
    
    setTimeout(function () {
      $p.fadeOut(function () { $(this).remove(); });
    }, 2500);
  },
  
  unlock: function () {
    var $pulser = this.$dom.find('.pulser');
    $pulser.fadeOut(100, function () { $pulser.remove(); });
    this.$dom.find('input').attr('disabled', null);
  }
};

$(function () {
  $.socket.on('dialog', function (e) {
    $.authorize[e.action](e);
  });
});
