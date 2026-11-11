const ticketModal = document.getElementById('ticketModal');
const programSelect = document.getElementById('ticket-program');
const dateInput = document.getElementById('ticket-date');
const timeInput = document.getElementById('ticket-time');
const countInput = document.getElementById('ticket-count');
const totalOutput = document.getElementById('ticket-total');
const successAlert = document.getElementById('ticket-success');
const ticketForm = document.getElementById('ticketForm');

function updateTotal() {
  if (!programSelect || !countInput || !totalOutput) return;
  const price = Number(programSelect.selectedOptions[0]?.dataset.price || 0);
  totalOutput.textContent = price * Number(countInput.value || 0) + ' руб.';
}

if (ticketModal && ticketForm && programSelect && dateInput && timeInput && countInput && successAlert) {
  ticketModal.addEventListener('show.bs.modal', (event) => {
    const data = event.relatedTarget ? event.relatedTarget.dataset : {};
    ticketForm.reset();
    successAlert.classList.add('d-none');
    const productId = new URLSearchParams(location.search).get('id');
    if (data.program) {
      programSelect.value = data.program;
      dateInput.value = data.date || window.localISO(new Date());
      timeInput.value = data.time || '12:00';
    } else {
      if (data.p === 'buy' && productId && programSelect.querySelector('option[value="' + productId + '"]')) programSelect.value = productId;
      dateInput.value = window.localISO(new Date());
      timeInput.value = '12:00';
    }
    updateTotal();
  });

  programSelect.addEventListener('change', updateTotal);
  countInput.addEventListener('input', updateTotal);

  ticketForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = programSelect.selectedOptions[0];
    const bookings = (() => {
      try { return JSON.parse(localStorage.getItem('orbita-bookings-v1') || '[]'); }
      catch (_) { return []; }
    })();
    const sessionEmail = localStorage.getItem('orbita-session-v1');
    bookings.push({
      id: 'ORB-' + Date.now(),
      email: sessionEmail || '',
      program: selected ? selected.textContent.trim() : 'Сеанс планетария',
      programId: programSelect.value,
      date: dateInput.value,
      time: timeInput.value,
      count: Number(countInput.value || 1),
      total: Number(selected?.dataset.price || 0) * Number(countInput.value || 1),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('orbita-bookings-v1', JSON.stringify(bookings));
    successAlert.classList.remove('d-none');
    successAlert.textContent = 'Заявка оформлена! Информация о демонстрационной брони сохранена в личном кабинете этого браузера.';
  });
}
