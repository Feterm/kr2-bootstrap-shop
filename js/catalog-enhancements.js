// Интерактивные функции каталога планетария «Орбита».
(function () {
  const cards = Array.from(document.querySelectorAll('[data-program-card]'));
  if (!window.ORBITA) return;
  const programs = window.ORBITA.programs;
  const FAVORITES = 'orbita-favorites-v1';
  const COMPARE = 'orbita-compare-v1';
  const RECENT = 'orbita-recent-v1';
  const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const getId = card => Number(card.dataset.programCard);
  const getCard = id => cards.find(card => getId(card) === Number(id));
  const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cols = cards.map(card => card.closest('.program-col'));
  const search = document.getElementById('program-search');
  const category = document.getElementById('program-category');
  const age = document.getElementById('program-age');
  const sort = document.getElementById('program-sort');
  const results = document.getElementById('program-results-count');
  const favoritesCount = document.getElementById('favorites-count');
  const compareCount = document.getElementById('compare-count');
  const compareButton = document.getElementById('open-compare');

  function refreshBadges() {
    const favorites = read(FAVORITES), compared = read(COMPARE).slice(0,3);
    if (favoritesCount) favoritesCount.textContent = favorites.length;
    if (compareCount) compareCount.textContent = compared.length + '/3';
    if (compareButton) compareButton.disabled = compared.length < 2;
    cards.forEach(card => {
      const id = getId(card), fav = card.querySelector('.favorite-toggle'), cmp = card.querySelector('.compare-toggle');
      if (fav) { const active = favorites.includes(id); fav.setAttribute('aria-pressed', String(active)); fav.classList.toggle('btn-danger',active); fav.classList.toggle('btn-outline-danger',!active); fav.textContent = active ? '♥ В избранном' : '♡ В избранное'; }
      if (cmp) { const active = compared.includes(id); cmp.setAttribute('aria-pressed',String(active)); cmp.classList.toggle('btn-secondary',active); cmp.classList.toggle('btn-outline-secondary',!active); cmp.textContent = active ? '✓ Выбрано' : '＋ Сравнить'; }
    });
  }

  function applyFilters() {
    const q = (search?.value || '').trim().toLocaleLowerCase('ru');
    const cat = category?.value || '', minAge = Number(age?.value || 0), mode = sort?.value || 'default';
    let visible = [];
    cards.forEach((card, i) => {
      const p = programs[getId(card)];
      const match = (!q || (p.title + ' ' + p.short + ' ' + p.text).toLocaleLowerCase('ru').includes(q)) &&
        (!cat || p.category === cat) && (!minAge || p.age >= minAge);
      cols[i].classList.toggle('d-none', !match);
      if (match) visible.push({col:cols[i],p});
    });
    const compare = { 'price-asc':(a,b)=>a.p.price-b.p.price, 'price-desc':(a,b)=>b.p.price-a.p.price, 'age-asc':(a,b)=>a.p.age-b.p.age, 'duration-asc':(a,b)=>a.p.min-b.p.min };
    if (compare[mode]) visible.sort(compare[mode]).forEach(x => x.col.parentElement.appendChild(x.col));
    else cols.forEach(col => col.parentElement.appendChild(col));
    if (results) results.textContent = 'Найдено программ: ' + visible.length;
  }
  [search,category,age,sort].forEach(el => el && el.addEventListener(el === search ? 'input' : 'change',applyFilters));
  document.getElementById('reset-program-filters')?.addEventListener('click',()=>{ if(search)search.value=''; if(category)category.value=''; if(age)age.value=''; if(sort)sort.value='default'; applyFilters(); });

  cards.forEach(card => {
    const id = getId(card);
    card.querySelector('.favorite-toggle')?.addEventListener('click',()=>{
      let list=read(FAVORITES); list=list.includes(id)?list.filter(x=>x!==id):[...list,id]; write(FAVORITES,list); refreshBadges();
    });
    card.querySelector('.compare-toggle')?.addEventListener('click',()=>{
      let list=read(COMPARE); if(list.includes(id)) list=list.filter(x=>x!==id); else if(list.length<3) list.push(id); else { alert('Можно сравнить не более трёх программ. Уберите одну из выбранных.'); return; }
      write(COMPARE,list); refreshBadges();
    });
    card.querySelectorAll('a[href*="product.html"]').forEach(a=>a.addEventListener('click',()=>remember(id)));
  });

  function remember(id) { let list=read(RECENT).filter(x=>x!==id); list.unshift(id); write(RECENT,list.slice(0,4)); }
  function renderRecent() {
    const section=document.getElementById('recently-viewed-section'), target=document.getElementById('recently-viewed-list');
    if(!section||!target)return;
    const list=read(RECENT).filter(id=>programs[id]).slice(0,4);
    section.classList.toggle('d-none',!list.length);
    target.innerHTML=list.map(id=>{const p=programs[id];return `<div class="col-6 col-md-3"><a class="recent-card card h-100 text-decoration-none" href="product.html?id=${id}"><img src="images/${safe(p.img)}" class="card-img-top" alt="${safe(p.title)}"><div class="card-body p-2"><strong class="small text-dark">${safe(p.title)}</strong><div class="small text-muted">${p.price} руб. · ${p.min} мин.</div></div></a></div>`}).join('');
  }
  document.getElementById('clear-recently-viewed')?.addEventListener('click',()=>{write(RECENT,[]);renderRecent();});

  function renderCompare() {
    const list=read(COMPARE).slice(0,3), wrap=document.getElementById('compare-table-wrap');
    if(!wrap)return;
    if(list.length<2){wrap.innerHTML='<p class="text-muted mb-0">Выберите минимум две программы для сравнения.</p>';return;}
    const rows=[['Стоимость',p=>p.price+' руб.'],['Продолжительность',p=>p.min+' мин.'],['Возрастное ограничение',p=>'От '+p.age+' лет'],['Категория',p=>p.category],['Формат',p=>p.format],['Расписание',p=>p.schedule]];
    wrap.innerHTML='<table class="table table-bordered table-striped align-middle"><thead><tr><th>Характеристика</th>'+list.map(id=>`<th>${safe(programs[id].title)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(([label,fn])=>'<tr><th>'+label+'</th>'+list.map(id=>'<td>'+safe(fn(programs[id]))+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
  }
  compareButton?.addEventListener('click',()=>{renderCompare();bootstrap.Modal.getOrCreateInstance(document.getElementById('compareModal')).show();});
  document.getElementById('compareModal')?.addEventListener('show.bs.modal',renderCompare);

  // Product page: remember selected program and expose favorite/compare controls there too.
  const params=new URLSearchParams(location.search), currentId=Number(params.get('id'));
  if(document.getElementById('product-root') && programs[currentId]) {
    remember(currentId);
    const title=document.querySelector('[data-p="title"]');
    if(title && !document.getElementById('product-personal-actions')) {
      const actions=document.createElement('div'); actions.id='product-personal-actions'; actions.className='d-flex gap-2 flex-wrap mt-3';
      actions.innerHTML='<button type="button" class="btn btn-outline-danger" id="product-favorite">♡ В избранное</button><button type="button" class="btn btn-outline-secondary" id="product-compare">＋ Добавить к сравнению</button><a class="btn btn-outline-primary" href="catalog.html">Вернуться в каталог</a>';
      title.insertAdjacentElement('afterend',actions);
      const sync=()=>{const fav=read(FAVORITES).includes(currentId),cmp=read(COMPARE).includes(currentId);const fb=document.getElementById('product-favorite'),cb=document.getElementById('product-compare');fb.textContent=fav?'♥ В избранном':'♡ В избранное';fb.className='btn '+(fav?'btn-danger':'btn-outline-danger');cb.textContent=cmp?'✓ Добавлено к сравнению':'＋ Добавить к сравнению';cb.className='btn '+(cmp?'btn-secondary':'btn-outline-secondary');};
      document.getElementById('product-favorite').addEventListener('click',()=>{let l=read(FAVORITES);write(FAVORITES,l.includes(currentId)?l.filter(x=>x!==currentId):[...l,currentId]);sync();});
      document.getElementById('product-compare').addEventListener('click',()=>{let l=read(COMPARE);if(l.includes(currentId))l=l.filter(x=>x!==currentId);else if(l.length<3)l.push(currentId);else{alert('Можно сравнить не более трёх программ.');return;}write(COMPARE,l);sync();});sync();
    }
  }
  refreshBadges(); renderRecent(); applyFilters();
})();
