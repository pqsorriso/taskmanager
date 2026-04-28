/**
 * countdown.js — Countdown widget para deadlines
 */
const Countdown = (() => {
  const STORAGE_KEY = 'fceux_countdowns';
  const overlay = document.getElementById('countdownOverlay');
  let countdowns = [];

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) countdowns = JSON.parse(saved);
    } catch (e) {}
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(countdowns)); }

  function open() {
    load();
    renderList();
    if (overlay) overlay.classList.add('visible');
  }

  function close() { if (overlay) overlay.classList.remove('visible'); }

  function add(name, date) {
    if (!name || !date) return;
    countdowns.push({ name: name, date: date, id: Date.now() });
    save();
    renderList();
  }

  function remove(id) {
    countdowns = countdowns.filter(c => c.id !== id);
    save();
    renderList();
  }

  function getTimeLeft(dateStr) {
    const now = new Date();
    const target = new Date(dateStr + 'T23:59:59');
    const diff = target - now;

    if (diff <= 0) return { text: 'CONCLUÍDO!', status: 'done' };

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    if (days === 0) return { text: hours + 'h ' + mins + 'min', status: 'urgent' };
    if (days === 1) return { text: '1 dia ' + hours + 'h', status: 'urgent' };
    if (days <= 3) return { text: days + ' dias ' + hours + 'h', status: 'urgent' };
    return { text: days + ' dias', status: 'normal' };
  }

  function renderList() {
    const body = document.getElementById('countdownBody');
    if (!body) return;

    if (!countdowns.length) {
      body.innerHTML = '<div class="cd-empty">⏳ Nenhum countdown<br><br>Adicione deadlines importantes!</div>';
      return;
    }

    body.innerHTML = '';
    countdowns.sort((a, b) => a.date.localeCompare(b.date));

    countdowns.forEach(cd => {
      const tl = getTimeLeft(cd.date);
      const item = document.createElement('div');
      item.className = 'cd-item';
      item.innerHTML =
        '<span class="cd-item-del" data-id="' + cd.id + '">🗑</span>' +
        '<div class="cd-item-title">' + escHtml(cd.name) + '</div>' +
        '<div class="cd-item-time ' + tl.status + '">⏳ ' + tl.text + '</div>' +
        '<div class="cd-item-date">📅 ' + formatDate(cd.date) + '</div>';
      body.appendChild(item);
    });

    body.querySelectorAll('.cd-item-del').forEach(btn => {
      btn.addEventListener('click', () => remove(Number(btn.dataset.id)));
    });
  }

  function formatDate(d) {
    const dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' +
           String(dt.getMonth() + 1).padStart(2, '0') + '/' +
           dt.getFullYear();
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Binds
  const btnCountdown = document.getElementById('btnCountdown');
  if (btnCountdown) btnCountdown.addEventListener('click', open);

  const cdClose = document.getElementById('countdownCloseBtn');
  if (cdClose) cdClose.addEventListener('click', close);

  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const cdAddBtn = document.getElementById('cdAddBtn');
  if (cdAddBtn) {
    cdAddBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('cdNameInput');
      const dateInput = document.getElementById('cdDateInput');
      if (nameInput && dateInput) {
        add(nameInput.value.trim(), dateInput.value);
        nameInput.value = '';
        dateInput.value = '';
      }
    });
  }

  function init() {
    load();
    // Atualizar countdowns a cada minuto
    setInterval(() => {
      if (overlay && overlay.classList.contains('visible')) renderList();
    }, 60000);
  }

  return { init, open, close };
})();