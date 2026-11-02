const ticketModal = document.getElementById('ticketModal');
const programSelect = document.getElementById('ticket-program');
const dateInput = document.getElementById('ticket-date');
const timeInput = document.getElementById('ticket-time');
const countInput = document.getElementById('ticket-count');
const totalOutput = document.getElementById('ticket-total');
const successAlert = document.getElementById('ticket-success');
const ticketForm = document.getElementById('ticketForm');

function updateTotal() {
  const price = Number(programSelect.selectedOptions[0].dataset.price);
  totalOutput.textContent = price * Number(countInput.value || 0) + ' руб.';
}

ticketModal.addEventListener('show.bs.modal', (event) => {
  const data = event.relatedTarget ? event.relatedTarget.dataset : {};
  ticketForm.reset();
  successAlert.classList.add('d-none');
  if (data.program) {
    programSelect.value = data.program;
    dateInput.value = data.date;
    timeInput.value = data.time;
  } else {
    dateInput.value = new Date().toISOString().slice(0, 10);
    timeInput.value = '12:00';
  }
  updateTotal();
});

programSelect.addEventListener('change', updateTotal);
countInput.addEventListener('input', updateTotal);

ticketForm.addEventListener('submit', (event) => {
  event.preventDefault();
  successAlert.classList.remove('d-none');
});
