$.UI = function (profile) {
  this.profile = profile;
  
  this.$nav = $('<navigation/>').append($('<ul/>').addClass('root'));
  this.$nav.css({left: 200}).animate({left: 0});
  this.$dom = $('<div/>').addClass('app').append(this.$nav);
  $('body').append(this.$dom.fadeIn());
  
  var $logout = $('<a/>').text('log out').attr('href', '#');
  $logout.click(function (e) {
    e.preventDefault();
    $.socket.emit('logout');
  });
  
  this.$status = $('<div/>').attr('id', 'status');
  this.$status.append($('<img/>').attr('src', 'http://gravatar.com/avatar/' + profile.emailmd5 + '?s=30'));
  this.$status.append($('<p/>').append('connected to ', $('<span/>').text('0'), ' services'));
  this.$status.append($('<p/>').append($('<span/>').text(profile.user), ' | ', $logout));
  $('header').append(this.$status.fadeIn());
  
  this.rebuildTabs(profile.services);
}

$.UI.prototype.rebuildTabs = function (services) {
    var $root = this.$nav.find('ul.root').empty();
    
    var $tab = $('<a/>').attr('href', '#').addClass('active')
      , $section = $('<li/>').append($tab);
    
    $root.append($section);
    
    $tab.append($('<span/>'));
    $tab.append($(document.createTextNode('add service')));
    
    $tab.click(function (e) {
      $.socket.emit('dialog', {action: 'load', id: 'addservice'});
    });
    
    var ui = this;
    $.each(services, function (i, service) {
      ui.addService(service);
    });
    
  };
  
  $.UI.prototype.addService= function (service) {
    var $tab = $('<a/>').attr('href', '#')
      , $list = $('<ul/>')
      , $section = $('<li/>').append($tab, $list);
      
    service.tabGroup = $section;
    
    this.$nav.find('ul.root>li:last').before($section);
    
    $tab.append($('<span/>'));
    $tab.append($(document.createTextNode(service.name)));
    
    var ui = this;
    $.each(service.views, function (i, view) {
      ui.addView(service, view);
    });
  }
  
  $.UI.prototype.addView= function (service, view) {
    var $tab = $('<a/>').attr('href', '#')
      , $section = $('<li/>').append($tab);
    
    service.tabGroup.find('ul').append($section);
    
    $tab.append($('<span/>').text(view.unread));
    $tab.append($(document.createTextNode(view.label || view.name)));
  }
  
  $.UI.prototype.close= function () {
    this.$nav.animate({left: 200});
    this.$dom   .fadeOut(function () { $(this).remove(); });
    this.$status.fadeOut(function () { $(this).remove(); });
  }

$(function() {
  $.tab = $('a.active');
  $.view = $('section.active');
  
  $.views = {};
  $.getView = function(servid, tabid) {
    if (!$.views[servid])
      $.views[servid] = {};
    
    if ($.views[servid][tabid])
      return $.views[servid][tabid];
    
    var $tab = $.views[servid][tabid] = $('<section/>').addClass('view')
      , $form = $('<form/>').append($('<input/>').attr('type', 'text'));
    
    $tab.append($('<h3/>').addClass('topic'));
    $tab.append($('<ul/>').addClass('scrollback'));
    $tab.append($form.addClass('sendmsg'));
    
    $tab.attr('data-service', servid);
    $tab.attr('data-viewid', tabid);
    
    $('body').append($tab);
    console.log($.views);
    return $tab;
  };
  
  $.socket.on('connect', function() {
    // ready
  });
  
  $.socket.on('addservice', function(data) {
    var $section = $('<li/>')
      , $tab = $('<a/>').attr('href', '#');
    
    $tab.append($('<span/>').text(data[3]));
    $tab.append($(document.createTextNode(data[2])));
    
    $section.append($tab);
    $section.append($('<ul/>'));
    
    $tab.attr('data-viewid', -1);
    $tab.attr('data-service', data[0]);
    $section.attr('data-service', data[0]);
    $section.attr('data-protocol', data[1]);
    
    console.log($section);
    
    $('#tabbar>ul>li:last').before($section);
  });

  $.socket.on('event', function(data) {
    var $section = $('#tabbar li[data-service=' + data[0] + ']');
    
    if (data[2] == 'addtab') {
      var $tab = $('<a/>').attr('href', '#')
        , $item = $('<li/>').append($tab);
      
      $tab.append($('<span/>'));
      $tab.append($(document.createTextNode(data[3].label)));
      
      $tab.attr('data-service', data[0]);
      $tab.attr('data-viewid', data[1]);
      $tab.attr('data-unread', 0);
      $section.find('ul').append($item);
    }
    
    var $tab = $section.find('a[data-viewid=' + data[1] + ']');
    var $view = $.getView(data[0], data[1]);
      
    console.log(data);
    if (data[2] == 'connect') {
      logLine($view, data[4], '***', 'Connected. Now logging in...');
    } else if (data[2] == 'join') {
      logLine($view, data[4], '*', data[3] + ' joined');
    //} else if (data[2] == 'names') {
    //  logLine($view, data[4], '***', 'users on ' + data[3][0] + ': ' + data[3][1]);
    } else if (data[2] == 'message') {
      logLine($view, data[4], data[3][0], data[3][1]);
    }
  });
  
  $('navigation').on('click', 'a', function(e) {
    $.tab.removeClass('active');
    $.view.removeClass('active');
    
    $.tab = $(e.currentTarget);
    if ($.tab.attr('id') == 'addservicetab')
      $.view = $('#addserviceview');
    else
      $.view = $.getView($.tab.attr('data-service'), $.tab.attr('data-viewid'));
    
    $.tab.addClass('active');
    $.view.addClass('active');
    
    var $span = $.tab.find('span');
    if ($.tab.hasClass('mention')) {
      $.tab.removeClass('mention');
      $span.text('');
    }
    if ($.tab.hasClass('unread')) {
      $.tab.removeClass('unread');
      $.tab.attr('data-unread', 0);
      $span.text('');
    }
  });
  
  $('#addserviceview form').submit(function(e) {
    e.preventDefault();
    
    var json = JSON.parse($(e.target).find('input[name=json]').val());
    $.socket.emit('addservice', json);
  });
  
  logLine = function($view, time, nick, message) {
    if ($view != $.view) {
      var $tab = $('#tabbar a[data-service=' + $view.attr('data-service') + '][data-viewid=' + $view.attr('data-viewid') + ']');
      
      if (!$tab.hasClass('unread'))
        $tab.addClass('unread');
      
      var unread = Number($tab.attr('data-unread')) + 1;
      $tab.attr('data-unread', unread);
      $tab.find('span').text(unread);
    }
    
    var $line = $('<li/>');
    $line.append($('<span/>').addClass('stamp').text(time));
    $line.append($('<span/>').addClass('nick').text(nick));
    $line.append($('<p/>').addClass('message').text(message));  
    $view.find('ul.scrollback').append($line);
  }

  $('body').on('submit', 'form.sendmsg', function(event) {
    event.preventDefault();

    var $input = $(event.target).find('input');
    logLine($.view, '[pending.]', 'you', $input.val());
    $.socket.emit('event', [$.tab.attr('data-service'), 'message', [$.tab.attr('data-viewid'), $input.val()]]);
    $input.val('');
  });
});
