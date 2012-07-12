$.authorize = {
  pages: [],
  
  init: function (title) {
    if (this.$dom)
      this.$dom.remove();
    
    this.$title = $('<h2/>').text(title);
    this.$section = $('<section/>').addClass('active modal');
    this.$links = $('<p/>').addClass('links');
    
    this.buildLinks();
    
    this.$dom = $('<div/>').attr('id', 'authorize');
    this.$dom.append(this.$title, this.$section, this.$links);
    
    $('body').append(this.$dom);
  },
  
  buildLinks: function () {
    this.$links.empty();

    for (var i = 0; i < this.pages.length; i++) {
      if (i > 0)
        this.$links.append(' | ');
      
      var page = this.pages[i];
      
      if (page == this.page)
        this.$links.append($('<span/>').text(page.title));
      else
        this.$links.append($('<a/>').attr('href', '#').text(page.title).attr('data-id', i));
    }
    
    this.$links.on('click', 'a', function (e) {
      e.preventDefault();
      
      var page = $.authorize.pages[$(e.target).attr('data-id')];
      $.authorize.switchTo(page);
    });
  },
  
  close: function () {
    this.$dom.animate({height: 0, opacity: 0, 'margin-top': 0}, function () {
      this.$dom.remove();
    });
    
    delete this.$dom;
  },
  
  addPage: function (title, builder) {
    this.pages.push({title: title, builder: builder});
    
    if (this.$links)
      this.buildLinks();
  },
  
  switchTo: function (page) {
    this.page = page;
    this.buildLinks();
    
    this.form.setup(this.$section);
    page.builder(this.form);
    
    this.$dom.css({'margin-top': -$.authorize.$dom.innerHeight() / 2});
  },
  
  form: {
    setup: function ($section) {
      this.$form = $('<form/>');
      
      $section.empty();
      $section.append(this.$form);
    },
  
    lock: function () {
      this.$form.find('input').attr('disabled', true);
      this.$form.append($('<div/>').addClass('pulser'));
    },
    
    unlock: function () {
      var $pulser = this.$form.find('.pulser');
      $pulser.animate({opacity: 0}, function () {
        $pulser.remove();
      });
      
      this.$form.find('input').attr('disabled', null);
    },
      
    field: function (label, name, type) {
      var $p = $('<p/>');
      $p.append($('<label/>').text(label).attr('for', name));
      $p.append($('<input/>').attr({type: type || 'text', name: name}));
      this.$form.append($p);
    },
    
    button: function (label) {
      this.$form.append($('<p/>').append($('<input/>').attr('type', 'submit').val(label)));
    },
    
    submit: function (callback) {
      this.$form.submit(function (e) {
        e.preventDefault();
        
        $.authorize.form.lock();
        
        var values = {};
        $.each($(e.target).serializeArray(), function(i, field) {
          values[field.name] = field.value;
        });

        callback(values, $(e.target));
      });
    }
  }
};

$.authorize.addPage('log in', function (form) {
  form.field('username', 'user');
  form.field('password', 'pass', 'password');
  form.button('log in');
  
  form.submit(function (fields) {
    $.uplink.account('login', fields);
  });
});

$.authorize.addPage('register', function (form) {
  form.field('username', 'user');
  form.field('email address', 'email');
  form.field('password', 'pass', 'password');
  form.field('password again', 'passconf', 'password');
  form.button('create account');
  
  form.submit(function (fields) {
    if (fields.pass != fields.passconf) {
      form.unlock();
      return;
    }
    
    $.uplink.account('register', fields);
  });
});

$.authorize.addPage('recover password', function (form) {
  form.field('username', 'user');
  form.button('recover password');
  
  form.submit(function (fields) {
    $.uplink.account('recover', fields);
  });
});

$(function () {
  $.authorize.init('welcome to bubblegum');
  $.authorize.switchTo($.authorize.pages[0]);
});
