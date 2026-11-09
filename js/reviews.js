// Отзывы (генерируются из данных детерминированно: у каждой программы и услуги свой набор),
// карточки программ с рейтингом, страница программы.
(function () {
  const D = window.ORBITA;
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const PAGE = 6;

  const util = {
    dateLabel(daysAgo) {
      const n = new Date();
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() - daysAgo);
      return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    },
    esc(s) {
      return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    },
    plural(n, one, few, many) {
      const m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return one;
      if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
      return many;
    }
  };
  window.OrbitaUtil = util;

  const NAMES = ['Анна', 'Дмитрий', 'Мария', 'Сергей', 'Елена', 'Алексей', 'Ольга', 'Андрей', 'Наталья', 'Иван', 'Татьяна', 'Максим', 'Екатерина', 'Павел', 'Юлия', 'Николай', 'Ирина', 'Владимир', 'Светлана', 'Артём', 'Виктория', 'Михаил', 'Полина', 'Денис', 'Алёна', 'Роман', 'Дарья', 'Игорь', 'Валерия', 'Константин'];
  const LETTERS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ';
  const GOOD_END = ['Обязательно придём ещё.', 'Рекомендуем всем, кто сомневается.', 'Спасибо команде «Орбиты»!', 'Хорошее соотношение цены и впечатлений.', 'Уже записались на следующую программу.', 'Персонал очень приветливый.', 'Купол и звук — отдельное удовольствие.', 'Билеты брали заранее — и не пожалели.', 'Твёрдая пятёрка.', 'Советуем попробовать.'];
  const BAD_END = ['Из минусов — в зале было прохладно.', 'Хотелось бы чуть больше времени на вопросы.', 'Немного тесно в гардеробе, но это мелочи.', 'Звук местами был тише, чем хотелось бы.', 'Билеты лучше брать заранее, на месте очередь.', 'Для самых маленьких чуть сложновато.'];
  const COLORS = ['#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#198754', '#20c997', '#0dcaf0', '#6610f2'];

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const cache = {};
  function reviewsFor(key) {
    if (cache[key]) return cache[key];
    let seed = 0;
    for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
    seed += 1234;
    const rand = rng(seed);
    const pick = (arr) => arr[Math.floor(rand() * arr.length)];
    const pool = D.reviewText[key];
    const count = D.reviewCounts[key];
    const usedText = new Set(), usedName = new Set();
    const list = [];
    let days = 0;

    for (let i = 0; i < count; i++) {
      const r = rand();
      const rating = r < 0.64 ? 5 : r < 0.9 ? 4 : 3;
      let text = '', tries = 0;
      do {
        text = (rating === 3 ? 'В целом неплохо. ' : '') + pick(pool.o) + ' ' + pick(pool.d) + ' ' + (rating === 3 ? pick(BAD_END) : pick(GOOD_END));
        tries++;
      } while (usedText.has(text) && tries < 40);
      usedText.add(text);

      let name = '';
      do { name = pick(NAMES) + ' ' + LETTERS[Math.floor(rand() * LETTERS.length)] + '.'; } while (usedName.has(name));
      usedName.add(name);

      days += 1 + Math.floor(rand() * (300 / count));
      list.push({ name, rating, text, days, color: COLORS[Math.floor(rand() * COLORS.length)] });
    }
    cache[key] = list;
    return list;
  }

  function stats(key) {
    const list = reviewsFor(key);
    const dist = [0, 0, 0, 0, 0, 0];
    let sum = 0;
    list.forEach((r) => { dist[r.rating]++; sum += r.rating; });
    return { count: list.length, avg: sum / list.length, dist };
  }

  const stars = (n) => '&#9733;'.repeat(n) + '&#9734;'.repeat(5 - n);

  function reviewHTML(r) {
    return '<article class="review-item">' +
      '<div class="review-avatar" style="background:' + r.color + '">' + util.esc(r.name[0]) + '</div>' +
      '<div class="flex-grow-1">' +
      '<div class="d-flex flex-wrap justify-content-between gap-1">' +
      '<strong>' + util.esc(r.name) + '</strong><span class="small text-muted">' + util.dateLabel(r.days) + '</span></div>' +
      '<div class="review-stars-sm" aria-label="Оценка ' + r.rating + ' из 5">' + stars(r.rating) + '</div>' +
      '<p class="mb-0">' + util.esc(r.text) + '</p></div></article>';
  }

  function renderReviews(el, key) {
    const s = stats(key);
    const list = reviewsFor(key);
    let shown = 0;
    const bars = [5, 4, 3, 2, 1].map((n) =>
      '<div class="d-flex align-items-center gap-2 small"><span class="text-nowrap">' + n + ' &#9733;</span>' +
      '<div class="progress flex-grow-1" style="height:8px"><div class="progress-bar bg-warning" style="width:' + (s.dist[n] / s.count * 100) + '%"></div></div>' +
      '<span class="text-muted" style="min-width:1.5rem">' + s.dist[n] + '</span></div>').join('');

    el.innerHTML =
      '<div class="reviews-summary row g-3 align-items-center mb-4">' +
      '<div class="col-12 col-sm-4 text-center"><div class="display-4 fw-bold lh-1">' + s.avg.toFixed(1).replace('.', ',') + '</div>' +
      '<div class="review-stars-sm fs-5">' + stars(Math.round(s.avg)) + '</div>' +
      '<div class="small text-muted">' + s.count + ' ' + util.plural(s.count, 'отзыв', 'отзыва', 'отзывов') + '</div></div>' +
      '<div class="col-12 col-sm-8">' + bars + '</div></div>' +
      '<div class="review-list"></div>' +
      '<div class="text-center mt-3"><button type="button" class="btn btn-outline-primary">Показать ещё</button></div>';

    const box = el.querySelector('.review-list');
    const more = el.querySelector('button');
    function next() {
      box.insertAdjacentHTML('beforeend', list.slice(shown, shown + PAGE).map(reviewHTML).join(''));
      shown = Math.min(list.length, shown + PAGE);
      more.parentElement.classList.toggle('d-none', shown >= list.length);
      more.textContent = 'Показать ещё (' + (list.length - shown) + ')';
    }
    more.addEventListener('click', next);
    next();
  }

  function ratingBadge(key) {
    const s = stats(key);
    return '<span class="rating-chip" title="' + s.count + ' отзывов">&#9733; ' + s.avg.toFixed(1).replace('.', ',') +
      ' <span class="text-muted">· ' + s.count + ' ' + util.plural(s.count, 'отзыв', 'отзыва', 'отзывов') + '</span></span>';
  }

  // ---- Страница программы ----
  const params = new URLSearchParams(location.search);
  const productRoot = document.getElementById('product-root');
  if (productRoot) {
    let id = Number(params.get('id'));
    if (!D.programs[id]) id = 1;
    const p = D.programs[id];
    const set = (sel, html) => { const e = document.querySelector(sel); if (e) e.innerHTML = html; };

    document.title = p.title + ' — Орбита';
    set('[data-p="crumb"]', 'Сеанс «' + util.esc(p.title) + '»');
    const img = document.querySelector('[data-p="img"]');
    img.src = 'images/' + p.img;
    img.alt = p.title;
    const badge = document.querySelector('[data-p="badge"]');
    if (p.badge) { badge.className = 'badge bg-' + p.badge[1] + ' mb-3'; badge.textContent = p.badge[0]; } else { badge.remove(); }
    set('[data-p="title"]', util.esc(p.title));
    set('[data-p="lead"]', util.esc(p.text));
    set('[data-p="price"]', p.price + ' руб.');
    set('[data-p="rating"]', ratingBadge('p' + id));
    set('[data-p="rows"]',
      [['Категория', p.category], ['Цена', p.price + ' руб.'], ['Наличие мест', 'Есть'], ['Формат', p.format],
       ['Длительность', p.min + ' минут'], ['Возраст', 'от ' + p.age + ' лет'], ['Язык', 'Русский'],
       ['Расписание', p.schedule], ['Вместимость зала', '80 мест']]
        .map((r) => '<tr><th scope="row">' + r[0] + '</th><td>' + util.esc(r[1]) + '</td></tr>').join(''));
    const target = document.querySelector('[data-reviews="auto"]');
    renderReviews(target, 'p' + id);
    set('[data-p="reviews-count"]', String(stats('p' + id).count));
    // «Купить билет» с предустановленной программой
    const buy = document.querySelector('[data-p="buy"]');
    if (buy) buy.dataset.program = String(id);
  }

  // ---- Услуги: отзывы в раскрывающихся блоках ----
  document.querySelectorAll('[data-reviews^="s"]').forEach((el) => {
    const key = el.dataset.reviews;
    renderReviews(el, key);
  });
  document.querySelectorAll('[data-review-toggle]').forEach((btn) => {
    const key = btn.dataset.reviewToggle;
    const s = stats(key);
    btn.innerHTML = '&#9733; ' + s.avg.toFixed(1).replace('.', ',') + ' · Отзывы (' + s.count + ')';
  });
  const m = location.hash.match(/^#service-(\d)$/);
  if (m && document.getElementById('sr-' + m[1]) && window.bootstrap) {
    new bootstrap.Collapse(document.getElementById('sr-' + m[1]), { toggle: false }).show();
  }

  // ---- Карточки программ: «Подробнее» ведёт на нужную программу + рейтинг ----
  document.querySelectorAll('.card .card-title').forEach((h) => {
    const id = Object.keys(D.programs).find((k) => D.programs[k].title === h.textContent.trim());
    if (!id) return;
    const card = h.closest('.card');
    const link = card.querySelector('a[href^="product.html"]');
    if (link) link.href = 'product.html?id=' + id;
    const price = card.querySelector('.fw-bold.fs-5');
    if (price) price.insertAdjacentHTML('beforebegin', '<div class="mb-1">' + ratingBadge('p' + id) + '</div>');
  });
})();
