(function () {
  var t = null; try { t = localStorage.getItem('cr-theme'); } catch (e) {}
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
})();
