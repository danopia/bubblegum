var css = document.createElement('link');
css.rel = 'stylesheet';
css.href = 'style/index.css';
document.head.appendChild(css);

setTimeout(function () {
  var sources = [
    'jquery-1.9.1.min',
    'window',
    'ui',
    'dialog',
    'login'];

  var i, tag;
  for (i in sources) {
    tag = document.createElement('script');
    tag.type = 'text/javascript';
    tag.async = false;
    tag.src = 'script/' + sources[i] + '.js';
    document.head.appendChild(tag);
  };
}, 5);

