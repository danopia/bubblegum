$(function() {
  $.socket = io.connect();
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
  
  $('#login form').submit(function (e) {
    e.preventDefault();
    var $form = $(e.target);
    
    $.socket.emit('login', [$form.find('[name=user]').val(), $form.find('[name=pass]').val()]);
    
    $form.find('input').attr('disabled', true);
    $form.append($('<div/>').addClass('pulser'));
    
    setTimeout(function () {
      $('#authorize').animate({height: '1px', opacity: 0, 'margin-top': '0'}, function () {
        $('#authorize').remove();
      });
      
      var $tab = $('<a/>').attr('href', '#').addClass('active')
        , $section = $('<li/>').append($tab)
        , $list = $('<ul/>').append($section);
      
      $tab.append($('<span/>'));
      $tab.append($(document.createTextNode('add service')));
      
      var $form = $('<form/>');
      $form.append($('<p/>').append($('<label/>').text('JSON object: ')).append($('<input/>').attr('name', 'json').attr('type', 'text').val('{}')));
      $form.append($('<p/>').append($('<input/>').attr('type', 'submit').val('add')));
      
      var $view = $('<section/>').addClass('active').addClass('view');
      $view.append($('<h1/>').text('add service to bubblegum'));
      $view.append($('<p/>').text('Please enter your account information to access it via Bubblegum.'));
      $view.append($form);
      
      $('#views').append($view);
      $view.css({opacity: 0}).animate({opacity: 1});
      $('#tabbar').append($tab).css({opacity: 0, left: '200px'}).animate({left: 0, opacity: 1});
      
      $('#status').append($('<img/>').attr('src', 'http://gravatar.com/avatar/8659be3fd35757561943aa00a28c8e0a?s=30'));
      $('#status').append($('<p/>').html('connected to <span>0</span> services'));
      $('#status').append($('<p/>').text('danopia | log out'));
      $('#status').css({opacity: 0}).animate({opacity: 1});
    }, 1000);
  });
  
  $('#login').css({width: '50%', 'margin-left': '25%', opacity: 0.5}).animate({width: '100%', 'margin-left': '0%', opacity: 1});
  
  $('#login [name=user]').focus();
});
