// Новости и события: карточки, фильтр по рубрикам, «показать ещё», окно с полным текстом.
(function () {
  const D = window.ORBITA;
  const U = window.OrbitaUtil;
  const root = document.querySelector('[data-news-list]');
  if (!root) return;

  const TAG_COLORS = { 'Новинка': 'success', 'Событие': 'primary', 'Лекторий': 'info text-dark', 'Акция': 'danger', 'Школьникам': 'warning text-dark' };
  const limit = Number(root.dataset.limit) || 0;       // на главной — только свежие
  const pageSize = Number(root.dataset.page) || 6;      // на странице новостей — порциями
  const filtersBox = document.querySelector('[data-news-filters]');
  const moreBtn = document.querySelector('[data-news-more]');

  // Сначала предстоящие события (чем ближе, тем выше), потом свежие новости
  const items = D.news.map((n, i) => Object.assign({ i }, n)).sort((a, b) => a.daysAgo - b.daysAgo);
  let tag = 'Все';
  let visible = limit || pageSize;

  function dateText(n) {
    if (n.daysAgo < 0) return 'Скоро · ' + U.dateLabel(n.daysAgo).replace(/ \d{4}$/, '');
    if (n.daysAgo === 0) return 'Сегодня';
    return U.dateLabel(n.daysAgo);
  }

  function cardHTML(n) {
    const color = TAG_COLORS[n.tag] || 'secondary';
    return '<div class="col-12 col-md-6 col-lg-4">' +
      '<article class="card news-card h-100 shadow-sm">' +
      '<div class="news-img"><img src="images/' + n.img + '" class="card-img-top" alt="' + U.esc(n.title) + '" loading="lazy">' +
      '<span class="badge bg-' + color + ' news-tag">' + n.tag + '</span></div>' +
      '<div class="card-body d-flex flex-column">' +
      '<div class="small text-muted mb-2">' + (n.daysAgo < 0 ? '<span class="text-primary fw-semibold">' + dateText(n) + '</span>' : dateText(n)) + '</div>' +
      '<h3 class="h5 card-title">' + U.esc(n.title) + '</h3>' +
      '<p class="text-muted">' + U.esc(n.text) + '</p>' +
      '<button type="button" class="btn btn-outline-primary btn-sm mt-auto align-self-start" data-news-open="' + n.i + '">Читать полностью</button>' +
      '</div></article></div>';
  }

  function render() {
    const list = items.filter((n) => tag === 'Все' || n.tag === tag);
    root.innerHTML = list.slice(0, visible).map(cardHTML).join('') ||
      '<div class="col-12 text-muted">В этой рубрике пока нет новостей.</div>';
    if (moreBtn) {
      const left = list.length - visible;
      moreBtn.parentElement.classList.toggle('d-none', left <= 0);
      moreBtn.textContent = 'Показать ещё (' + Math.max(left, 0) + ')';
    }
  }

  if (filtersBox) {
    const tags = ['Все'].concat(Object.keys(TAG_COLORS));
    filtersBox.innerHTML = tags.map((t, k) =>
      '<button type="button" class="btn btn-sm news-filter' + (k === 0 ? ' active' : '') + '" data-tag="' + t + '">' + t + '</button>').join('');
    filtersBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tag]');
      if (!b) return;
      tag = b.dataset.tag;
      visible = pageSize;
      filtersBox.querySelectorAll('.news-filter').forEach((x) => x.classList.toggle('active', x === b));
      render();
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', () => { visible += pageSize; render(); });
  }

  // Окно с полным текстом
  const modalEl = document.createElement('div');
  modalEl.className = 'modal fade';
  modalEl.tabIndex = -1;
  modalEl.innerHTML =
    '<div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content overflow-hidden">' +
    '<img class="news-modal-img" alt="">' +
    '<div class="modal-header"><div><span class="badge mb-1"></span><div class="small text-muted"></div>' +
    '<h2 class="modal-title h4"></h2></div><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button></div>' +
    '<div class="modal-body"></div>' +
    '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>' +
    '<a class="btn btn-warning" href="catalog.html">Смотреть программы</a></div></div></div>';
  document.body.appendChild(modalEl);
  const modal = new bootstrap.Modal(modalEl);

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-news-open]');
    if (!b) return;
    const n = D.news[Number(b.dataset.newsOpen)];
    const img = modalEl.querySelector('img');
    img.src = 'images/' + n.img;
    img.alt = n.title;
    const badge = modalEl.querySelector('.badge');
    badge.className = 'badge mb-1 bg-' + (TAG_COLORS[n.tag] || 'secondary');
    badge.textContent = n.tag;
    modalEl.querySelector('.modal-header .small').textContent = dateText(n);
    modalEl.querySelector('.modal-title').textContent = n.title;
    modalEl.querySelector('.modal-body').textContent = n.full;
    modal.show();
  });

  render();
})();
