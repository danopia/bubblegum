$.UI = function (key) {
  this.children = [];
  this.$dom = $('<div class="ui" id="ui-'+key+'"/>');
};

$.UI.prototype.append = function (child) {
  child.appendTo(this);
  this.children.push(child);
  return this;
};

