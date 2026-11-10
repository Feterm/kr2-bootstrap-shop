// Демонстрационная проверка свободных мест. Данные сохраняются в LocalStorage браузера.
(function () {
  const form = document.getElementById('ticketForm');
  const program = document.getElementById('ticket-program');
  const date = document.getElementById('ticket-date');
  const time = document.getElementById('ticket-time');
  const count = document.getElementById('ticket-count');
  const box = document.getElementById('seat-availability');
  const success = document.getElementById('ticket-success');
  if (!form || !program || !date || !time || !count || !box) return;

  const STORAGE_KEY = 'orbita-seat-reservations-v1';
  const CAPACITY = 30;
  const read = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) { return {}; } };
  const key = () => [program.value, date.value, time.value].join('|');
  const reserved = () => Number(read()[key()] || 0);
  const available = () => Math.max(0, CAPACITY - reserved());

  function updateAvailability() {
    const free = available();
    const requested = Math.max(1, Number(count.value || 1));
    box.className = 'alert mt-3 mb-3 ' + (free === 0 ? 'alert-danger' : free <= 5 ? 'alert-warning' : 'alert-light border');
    box.innerHTML = '<strong>Свободные места:</strong> ' + free + ' из ' + CAPACITY +
      (free === 0 ? '<div class="small mt-1">На этот сеанс мест не осталось. Выберите другое время.</div>' :
      '<div class="small mt-1">' + (requested > free ? 'На выбранное количество билетов мест недостаточно.' : 'Можно забронировать ' + Math.min(free, 10) + ' билетов.') + '</div>');
    count.max = String(Math.min(10, free));
    if (requested > free && free > 0) count.value = String(free);
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = free === 0;
  }

  [program, date, time, count].forEach(el => el.addEventListener('change', updateAvailability));
  count.addEventListener('input', updateAvailability);
  const modal = document.getElementById('ticketModal');
  if (modal) modal.addEventListener('shown.bs.modal', updateAvailability);

  // Capture phase ensures the capacity check runs before the demo confirmation handler.
  form.addEventListener('submit', function (event) {
    const requested = Number(count.value || 0);
    const free = available();
    if (!date.value || !time.value || requested < 1 || requested > free) {
      event.preventDefault(); event.stopImmediatePropagation(); updateAvailability();
      box.classList.remove('alert-light'); box.classList.add('alert-danger');
      return;
    }
    const reservations = read();
    reservations[key()] = Number(reservations[key()] || 0) + requested;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    updateAvailability();
    if (success) success.textContent = 'Заявка оформлена! Забронировано мест: ' + requested + '. Это демонстрационная бронь в браузере.';
  }, true);
  updateAvailability();
})();
