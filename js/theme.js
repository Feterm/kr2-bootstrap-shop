(function () {
  'use strict';
  const KEY = 'orbita-theme-v1';
  const root = document.documentElement;
  const getSavedTheme = () => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (_) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  function updateButton(theme, animate) {
    const button = document.getElementById('orbita-theme-toggle');
    if (!button) return;
    button.setAttribute('aria-label', theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему');
    button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    button.title = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
    if (animate) {
      button.classList.remove('is-animating');
      void button.offsetWidth;
      button.classList.add('is-animating');
      window.setTimeout(() => button.classList.remove('is-animating'), 720);
    }
  }

  function setTheme(theme, animate) {
    root.setAttribute('data-orbita-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch (_) {}
    updateButton(theme, animate);
    if (animate) {
      document.body.classList.remove('orbita-theme-transition');
      void document.body.offsetWidth;
      document.body.classList.add('orbita-theme-transition');
      window.setTimeout(() => document.body.classList.remove('orbita-theme-transition'), 760);
    }
  }

  // Apply before paint (the tiny inline initializer in the head sets the same attribute).
  setTheme(root.getAttribute('data-orbita-theme') || getSavedTheme(), false);

  // Delegation works even if the header is rebuilt by another script.
  document.addEventListener('click', function (event) {
    const button = event.target.closest('#orbita-theme-toggle');
    if (!button) return;
    const current = root.getAttribute('data-orbita-theme') === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark', true);
  });

  // Keep the icon state in sync if the user returns to a page with browser back/forward cache.
  window.addEventListener('pageshow', () => updateButton(root.getAttribute('data-orbita-theme') || 'light', false));
})();