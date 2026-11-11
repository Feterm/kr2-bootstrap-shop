(function () {
  const KEY = 'orbita-theme-v1';
  const root = document.documentElement;
  const saved = localStorage.getItem(KEY);
  const initial = saved === 'dark' || saved === 'light' ? saved :
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function apply(theme, animate) {
    if (animate) {
      document.body.classList.add('orbita-theme-transition');
      window.setTimeout(() => document.body.classList.remove('orbita-theme-transition'), 750);
    }
    root.setAttribute('data-orbita-theme', theme);
    localStorage.setItem(KEY, theme);
    const button = document.getElementById('orbita-theme-toggle');
    if (button) {
      button.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      button.title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    }
  }

  apply(initial, false);
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.getAttribute('data-orbita-theme') || initial, false);
    const button = document.getElementById('orbita-theme-toggle');
    if (button) button.addEventListener('click', () => {
      const next = root.getAttribute('data-orbita-theme') === 'dark' ? 'light' : 'dark';
      apply(next, true);
    });
  });
})();