// Актуальные даты на сайте: считаются в браузере, бэкенд не нужен.
(function () {
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const pad = (n) => String(n).padStart(2, '0');

  // Локальная дата в формате YYYY-MM-DD (toISOString даёт UTC и может сдвинуть день)
  function localISO(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function addDays(date, days) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
  }

  window.localISO = localISO;

  function updateSchedule() {
    const now = new Date();
    const tabs = document.querySelectorAll('.schedule-days .nav-link');

    tabs.forEach((tab, i) => {
      const date = addDays(now, i);
      const spans = tab.querySelectorAll('span');
      if (spans.length === 2) {
        spans[0].textContent = i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : WEEKDAYS_SHORT[date.getDay()];
        spans[1].textContent = date.getDate() + ' ' + MONTHS_SHORT[date.getMonth()];
      }

      const panel = document.getElementById('day-' + i);
      if (!panel) return;

      const heading = panel.querySelector('h3');
      if (heading) {
        heading.textContent = WEEKDAYS[date.getDay()] + ', ' + date.getDate() + ' ' + MONTHS_GEN[date.getMonth()];
      }

      panel.querySelectorAll('[data-date]').forEach((btn) => {
        btn.dataset.date = localISO(date);

        // Сегодняшние сеансы, которые уже начались, закрываем для покупки
        if (i === 0) {
          const [h, m] = btn.dataset.time.split(':').map(Number);
          const started = h * 60 + m <= now.getHours() * 60 + now.getMinutes();
          btn.disabled = started;
          btn.textContent = started ? 'Сеанс начался' : 'Купить билет';
          btn.classList.toggle('btn-warning', !started);
          btn.classList.toggle('btn-outline-secondary', started);
        }
      });
    });
  }

  function updateClock() {
    const now = new Date();
    const text =
      now.getDate() + ' ' + MONTHS_GEN[now.getMonth()] + ' ' + now.getFullYear() + ', ' +
      WEEKDAYS_SHORT[now.getDay()] + ', ' +
      pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    document.querySelectorAll('[data-live-clock]').forEach((el) => {
      el.textContent = text;
    });
  }

  function updateStatic() {
    const now = new Date();

    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = now.getFullYear();
    });

    // Новости: «N дней назад» относительно сегодняшнего дня
    document.querySelectorAll('[data-days-ago]').forEach((el) => {
      const d = addDays(now, -Number(el.dataset.daysAgo));
      el.textContent = d.getDate() + ' ' + MONTHS_GEN[d.getMonth()];
    });

    // В полях даты нельзя выбрать прошедший день
    document.querySelectorAll('input[type="date"]').forEach((input) => {
      input.min = localISO(now);
    });

    // «Открыто сейчас» по графику 10:00–20:00
    const open = now.getHours() >= 10 && now.getHours() < 20;
    document.querySelectorAll('[data-open-status]').forEach((el) => {
      el.textContent = open ? 'Сейчас открыто' : 'Сейчас закрыто';
      el.classList.toggle('bg-success', open);
      el.classList.toggle('bg-secondary', !open);
    });
  }

  updateStatic();
  updateSchedule();
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(() => { updateSchedule(); updateStatic(); }, 60000);
})();
