(function () {
  var tb = document.getElementById('themeBtn');
  if (tb && window.nsTheme) tb.addEventListener('click', function () { window.nsTheme.toggle(); });
})();
