(function () {
  const modalEl = document.getElementById('orbitaSearchModal');
  if (!modalEl || !window.bootstrap) return;
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const input = document.getElementById('orbitaSearchInput');
  const results = document.getElementById('orbitaSearchResults');
  const index = window.ORBITA_SEARCH_INDEX || [];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function render(query) {
    const q = query.trim().toLocaleLowerCase('ru');
    if (!q) {
      results.innerHTML = '<p class="text-muted mb-0">Введите запрос, чтобы найти программы, услуги и разделы сайта.</p>';
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean);
    const matches = index.map(item => {
      const haystack = (item.title + ' ' + item.excerpt + ' ' + item.page).toLocaleLowerCase('ru');
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? (item.title.toLocaleLowerCase('ru').includes(term) ? 3 : 1) : 0), 0);
      return { item, score };
    }).filter(x => x.score > 0).sort((a,b) => b.score-a.score).slice(0,10);

    if (!matches.length) {
      results.innerHTML = '<div class="orbita-search-empty"><strong>Ничего не найдено</strong><p class="mb-0 mt-1">Попробуйте другое название или более короткий запрос.</p></div>';
      return;
    }
    results.innerHTML = matches.map(({item}) =>
      `<a class="orbita-search-result" href="${escapeHTML(item.url)}"><span class="orbita-search-result-title">${escapeHTML(item.title)}</span><span class="orbita-search-result-excerpt">${escapeHTML(item.excerpt)}</span><small>${escapeHTML(item.page.replace('.html',''))}</small></a>`
    ).join('');
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-orbita-search-open]');
    if (trigger) {
      modal.show();
      window.setTimeout(() => input.focus(), 180);
    }
  });
  input.addEventListener('input', () => render(input.value));
  modalEl.addEventListener('shown.bs.modal', () => input.focus());
  modalEl.addEventListener('hidden.bs.modal', () => { input.value=''; render(''); });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); modal.show(); window.setTimeout(() => input.focus(), 180);
    }
  });
})();