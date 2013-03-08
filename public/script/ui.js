$.UI = function (key) {
  this.children = [];
  this.$dom = $('<div class="ui" id="ui-'+key+'"/>');
  this.$bar = $('<header><h1>Bubblegum</h1></header>').appendTo(this.$dom);
};

$.UI.prototype.append = function (child) {
  child.appendTo(this);
  this.children.push(child);
  return this;
};

