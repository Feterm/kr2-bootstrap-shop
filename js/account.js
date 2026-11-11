(function () {
  const USERS_KEY = 'orbita-users-v1';
  const SESSION_KEY = 'orbita-session-v1';
  const FAVORITES_KEY = 'orbita-favorites-v1';
  const RECENT_KEY = 'orbita-recent-v1';
  const BOOKINGS_KEY = 'orbita-bookings-v1';
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (_) { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const hash = async value => {
    if (window.crypto && crypto.subtle) {
      const bytes = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2,'0')).join('');
    }
    return btoa(unescape(encodeURIComponent(value)));
  };
  const $ = id => document.getElementById(id);
  const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const auth = $('accountAuth'), dashboard = $('accountDashboard');
  if (!auth || !dashboard) return;

  function currentUser() {
    const email = localStorage.getItem(SESSION_KEY);
    return email ? read(USERS_KEY, []).find(u => u.email === email) : null;
  }
  function showError(id, message) {
    const box = $(id); box.textContent = message; box.classList.remove('d-none');
  }
  function renderList(id, items, empty, formatter) {
    const el = $(id);
    el.innerHTML = items.length ? items.map(formatter).join('') : `<p class="text-muted mb-0">${empty}</p>`;
  }
  function render() {
    const user = currentUser();
    auth.classList.toggle('d-none', !!user);
    dashboard.classList.toggle('d-none', !user);
    if (!user) return;
    $('accountWelcomeName').textContent = 'Здравствуйте, ' + user.name + '!';
    $('accountWelcomeEmail').textContent = user.email;
    $('profileName').value = user.name;
    const favorites = read(FAVORITES_KEY, []);
    const recent = read(RECENT_KEY, []);
    const bookings = read(BOOKINGS_KEY, []).filter(x => x.email === user.email);
    $('statFavorites').textContent = favorites.length;
    $('statRecent').textContent = recent.length;
    $('statBookings').textContent = bookings.length;
    $('statTickets').textContent = bookings.reduce((sum,x) => sum + Number(x.count || 0), 0);
    const programs = (window.ORBITA && window.ORBITA.programs) || [];
    const programName = id => {
      const p = programs[id] || programs[String(id)];
      return p ? p.title : 'Программа №' + id;
    };
    renderList('accountFavorites', favorites, 'Пока нет избранных программ.', id => `<a class="account-list-item" href="product.html?id=${encodeURIComponent(id)}">${safe(programName(id))}<span>Открыть →</span></a>`);
    renderList('accountRecent', recent, 'История просмотров пока пуста.', id => `<a class="account-list-item" href="product.html?id=${encodeURIComponent(id)}">${safe(programName(id))}<span>Открыть →</span></a>`);
    renderList('accountBookings', bookings.slice().reverse(), 'Бронирований пока нет. Выберите сеанс в афише.', item => `<div class="account-booking"><div><strong>${safe(item.program || 'Сеанс планетария')}</strong><small>${safe(item.date || '')} · ${safe(item.time || '')}</small></div><span>${Number(item.count || 0)} билет(ов)</span></div>`);
  }

  $('accountRegisterForm').addEventListener('submit', async event => {
    event.preventDefault();
    $('registerError').classList.add('d-none');
    const name = $('registerName').value.trim();
    const email = $('registerEmail').value.trim().toLowerCase();
    const password = $('registerPassword').value;
    const users = read(USERS_KEY, []);
    if (users.some(u => u.email === email)) return showError('registerError', 'Аккаунт с такой почтой уже существует.');
    users.push({name,email,passwordHash:await hash(password),createdAt:new Date().toISOString()});
    write(USERS_KEY, users);
    localStorage.setItem(SESSION_KEY,email);
    render();
  });
  $('accountLoginForm').addEventListener('submit', async event => {
    event.preventDefault();
    $('loginError').classList.add('d-none');
    const email = $('loginEmail').value.trim().toLowerCase();
    const passwordHash = await hash($('loginPassword').value);
    const user = read(USERS_KEY, []).find(u => u.email === email && u.passwordHash === passwordHash);
    if (!user) return showError('loginError', 'Не удалось войти. Проверьте почту и пароль.');
    localStorage.setItem(SESSION_KEY,email);
    render();
  });
  $('accountLogout').addEventListener('click', () => { localStorage.removeItem(SESSION_KEY); render(); });
  $('saveProfile').addEventListener('click', () => {
    const users=read(USERS_KEY,[]), email=localStorage.getItem(SESSION_KEY), user=users.find(u=>u.email===email);
    if (!user) return;
    const name=$('profileName').value.trim();
    if (name.length<2) return;
    user.name=name; write(USERS_KEY,users); $('profileSaved').classList.remove('d-none'); render();
  });
  render();
})();