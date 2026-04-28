/**
 * habits.js — Habit Tracker
 * Rastrear hábitos diários com streak
 */
const Habits = (() => {
  const STORAGE_KEY = 'fceux_habits';
  let habits = [];
  const overlay = document.getElementById('habitOverlay');
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) habits = JSON.parse(saved);
    } catch (e) {}
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); }

  function todayKey() { return new Date().toISOString().slice(0, 10); }

  function open() {
    load();
    renderHabits();
    overlay.classList.add('visible');
  }

  function close() { overlay.classList.remove('visible'); }

  function renderHabits() {
    const body = document.getElementById('habitBody');
    if (!habits.length) {
      body.innerHTML = '<div class="habit-empty">🎯 Nenhum hábito criado<br><br>Adicione hábitos como: beber água, exercício, leitura...</div>';
      return;
    }

    body.innerHTML = '';
    habits.forEach((h, i) => {
      const item = document.createElement('div');
      item.className = 'habit-item';

      const streak = calcStreak(h);
      const weekDays = getLast7Days();
      const weekDone = weekDays.filter(d => h.log && h.log[d]).length;
      const pct = Math.round((weekDone / 7) * 100);

      let weekHtml = '<div class="habit-week">';
      weekDays.forEach(dateStr => {
        const d = new Date(dateStr + 'T00:00:00');
        const isToday = dateStr === todayKey();
        const isDone = h.log && h.log[dateStr];
        weekHtml += '<div class="habit-day' + (isDone ? ' done' : '') + (isToday ? ' today' : '') + '" data-hi="' + i + '" data-date="' + dateStr + '">' +
          '<span class="hd-name">' + dayNames[d.getDay()] + '</span>' +
          '<span class="hd-check">' + (isDone ? '✓' : '·') + '</span>' +
          '</div>';
      });
      weekHtml += '</div>';

      item.innerHTML =
        '<div class="habit-top">' +
          '<span class="habit-name">' + escHtml(h.name) + '</span>' +
          '<span class="habit-streak">' + (streak > 0 ? '🔥 ' + streak + ' dia(s)' : '') + '</span>' +
        '</div>' +
        weekHtml +
        '<div class="habit-bar">' +
          '<span>' + weekDone + '/7 esta semana</span>' +
          '<div class="habit-bar-track"><div class="habit-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<span>' + pct + '%</span>' +
        '</div>' +
        '<div class="habit-actions">' +
          '<button class="habit-act-btn danger" data-action="delete" data-i="' + i + '">🗑 Excluir</button>' +
        '</div>';

      body.appendChild(item);
    });

    // Bind day clicks
    body.querySelectorAll('.habit-day').forEach(day => {
      day.addEventListener('click', () => {
        const hi = Number(day.dataset.hi);
        const date = day.dataset.date;
        toggleDay(hi, date);
      });
    });

    // Bind delete
    body.querySelectorAll('.habit-act-btn[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.i);
        if (confirm('Excluir hábito "' + habits[idx].name + '"?')) {
          habits.splice(idx, 1);
          save();
          renderHabits();
        }
      });
    });
  }

  function toggleDay(habitIdx, dateStr) {
    const h = habits[habitIdx];
    if (!h) return;
    if (!h.log) h.log = {};
    h.log[dateStr] = !h.log[dateStr];
    save();
    renderHabits();
  }

  function addHabit(name) {
    if (!name) return;
    habits.push({ name: name, log: {}, createdAt: new Date().toISOString() });
    save();
    renderHabits();
  }

  function calcStreak(h) {
    if (!h.log) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(today);

    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (h.log[key]) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function getLast7Days() {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Binds
  document.getElementById('btnHabits').addEventListener('click', open);
  document.getElementById('habitCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.getElementById('habitAddBtn').addEventListener('click', () => {
    const input = document.getElementById('habitInput');
    addHabit(input.value.trim());
    input.value = '';
  });
  document.getElementById('habitInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { addHabit(e.target.value.trim()); e.target.value = ''; }
  });

  return { open, close };
})();