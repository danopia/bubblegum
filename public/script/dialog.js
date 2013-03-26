$.Dialog = function (key, title) {
  this.$dom = $('<article class="dialog dialog-'+key+'"/>');
  this.$dom.append($('<h2/>', {text: title}), '<form/>');

  var self = this;
  this.$dom.find('form').submit(function (e) {
    self.onsubmit(e);
  });
};

$.Dialog.prototype.layout = function (layout) {
  var $inner = this.$dom.find('form');
  $inner.html(''); // TODO

  var i, item, $p;
  for (i in layout) {
    item = layout[i];
    $p = $('<p/>').appendTo($inner);

    if (typeof item == 'string') {
      $p.text(item);
    } else {
      switch (item[0]) {
      case 'field':
        $p.append(
          $('<label/>', {text: item[1].label || item[1].name}),
          $('<input/>', {type: item[1].type || 'text', name: item[1].name})
        );
        break;

      default:
        $p.append($('<'+item[0]+'/>', item[1]));
      };
    };
  };
};

$.Dialog.prototype.appendTo = function (ui) {
  ui.$dom.append(this.$dom);
};

$.Dialog.prototype.submit = function (handler) {
  if (handler) {
    this._submit = handler;
    return this;
  } else {
    return this._submit;
  };
};

$.Dialog.prototype.onsubmit = function (e) {
  e.preventDefault();

  var values = {};
  $.each($(e.target).serializeArray(), function(i, field) {
    values[field.name] = field.value;
  });

  if (this.submit()) {
    this.submit()(values);
  };
};
