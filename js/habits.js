/**
 * habits.js — Habit Tracker COMPLETO
 * Meta diária, ícones, categorias, lembretes, stats, XP, drag, edit
 */
const Habits = (() => {
  const STORAGE_KEY = 'fceux_habits';
  let habits = [];
  const overlay = document.getElementById('habitOverlay');
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  let dragIdx = null;

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
    if (overlay) overlay.classList.add('visible');
    checkReminders();
  }

  function close() { if (overlay) overlay.classList.remove('visible'); }

  function renderHabits() {
    const body = document.getElementById('habitBody');
    if (!body) return;

    if (!habits.length) {
      body.innerHTML = '<div class="habit-empty">🎯 Nenhum habito criado<br><br>Adicione habitos como:<br>💧 Beber 8 copos de agua<br>🏃 Exercicio 30 min<br>📖 Ler 20 paginas<br>🧘 Meditar 10 min</div>';
      return;
    }

    body.innerHTML = '';
    habits.forEach(function(h, i) {
      var item = document.createElement('div');
      item.className = 'habit-item';
      item.draggable = true;
      item.dataset.idx = i;

      var streak = calcStreak(h);
      var weekDays = getLast7Days();
      var goal = h.goal || 1;
      var weekDone = weekDays.filter(function(d) { return getDayCount(h, d) >= goal; }).length;
      var pct = Math.round((weekDone / 7) * 100);
      var todayCount = getDayCount(h, todayKey());

      var catHtml = h.category ? '<span class="habit-category cat-' + h.category + '">' + getCatLabel(h.category) + '</span>' : '';

      var metaHtml = '<div class="habit-meta">';
      if (goal > 1) metaHtml += '<span class="hm-goal">🎯 ' + todayCount + '/' + goal + ' hoje</span>';
      if (h.reminder) metaHtml += '<span class="hm-reminder">⏰ ' + h.reminder + '</span>';
      metaHtml += '<span class="hm-xp">⭐ +' + getXPReward(h) + ' XP</span>';
      metaHtml += '</div>';

      var weekHtml = '<div class="habit-week">';
      weekDays.forEach(function(dateStr) {
        var d = new Date(dateStr + 'T00:00:00');
        var isToday = dateStr === todayKey();
        var count = getDayCount(h, dateStr);
        var isDone = count >= goal;
        weekHtml += '<div class="habit-day' + (isDone ? ' done' : '') + (isToday ? ' today' : '') + '" data-hi="' + i + '" data-date="' + dateStr + '">' +
          '<span class="hd-name">' + dayNames[d.getDay()] + '</span>' +
          '<span class="hd-check">' + (isDone ? '✓' : (count > 0 ? count : '·')) + '</span>' +
          (goal > 1 ? '<span class="hd-count">' + count + '/' + goal + '</span>' : '') +
          '</div>';
      });
      weekHtml += '</div>';

      item.innerHTML =
        '<div class="habit-top">' +
          '<span class="habit-drag-handle" title="Arrastar">⠿</span>' +
          '<span class="habit-icon" data-i="' + i + '" title="Trocar icone">' + (h.icon || '🎯') + '</span>' +
          '<span class="habit-name editable" data-i="' + i + '" title="Duplo-clique pra editar">' + escHtml(h.name) + '</span>' +
          catHtml +
          '<span class="habit-streak">' + (streak > 0 ? '🔥 ' + streak + 'd' : '') + '</span>' +
        '</div>' +
        metaHtml +
        weekHtml +
        '<div class="habit-bar">' +
          '<span>' + weekDone + '/7</span>' +
          '<div class="habit-bar-track"><div class="habit-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<span>' + pct + '%</span>' +
        '</div>' +
        '<div class="habit-actions">' +
          (goal > 1 ? '<button class="habit-act-btn" data-action="increment" data-i="' + i + '">+1</button>' : '') +
          '<button class="habit-act-btn" data-action="stats" data-i="' + i + '">📊</button>' +
          '<button class="habit-act-btn" data-action="edit" data-i="' + i + '">✏️</button>' +
          '<button class="habit-act-btn danger" data-action="delete" data-i="' + i + '">🗑</button>' +
        '</div>';

      body.appendChild(item);

      item.addEventListener('dragstart', function(e) {
        dragIdx = i;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', function() {
        item.classList.remove('dragging');
        dragIdx = null;
      });

      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      item.addEventListener('drop', function(e) {
        e.preventDefault();
        if (dragIdx === null || dragIdx === i) return;
        var moved = habits.splice(dragIdx, 1)[0];
        habits.splice(i, 0, moved);
        save();
        renderHabits();
      });
    });

    body.querySelectorAll('.habit-day').forEach(function(day) {
      day.addEventListener('click', function() {
        var hi = Number(day.dataset.hi);
        var date = day.dataset.date;
        toggleDay(hi, date);
      });
    });

    body.querySelectorAll('.habit-act-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var idx = Number(btn.dataset.i);
        var action = btn.dataset.action;
        if (action === 'delete') deleteHabit(idx);
        else if (action === 'stats') showHabitStats(idx);
        else if (action === 'edit') editHabit(idx);
        else if (action === 'increment') incrementToday(idx);
      });
    });

    body.querySelectorAll('.habit-name.editable').forEach(function(el) {
      el.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        editHabitName(Number(el.dataset.i));
      });
    });

    body.querySelectorAll('.habit-icon').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        cycleIcon(Number(el.dataset.i));
      });
    });
  }

  function getDayCount(h, dateStr) {
    if (!h.log) return 0;
    var val = h.log[dateStr];
    if (typeof val === 'number') return val;
    if (val === true) return 1;
    return 0;
  }

  function setDayCount(h, dateStr, count) {
    if (!h.log) h.log = {};
    h.log[dateStr] = count;
  }

  function toggleDay(habitIdx, dateStr) {
    var h = habits[habitIdx];
    if (!h) return;
    var goal = h.goal || 1;
    var current = getDayCount(h, dateStr);

    if (goal === 1) {
      setDayCount(h, dateStr, current >= 1 ? 0 : 1);
    } else {
      // Para metas > 1, só incrementa no dia de hoje
      if (dateStr === todayKey()) {
        if (current >= goal) {
          setDayCount(h, dateStr, 0);
        } else {
          setDayCount(h, dateStr, current + 1);
        }
      } else {
        // Dias passados: toggle simples
        setDayCount(h, dateStr, current >= goal ? 0 : goal);
      }
    }

    var newCount = getDayCount(h, dateStr);
    if (newCount >= goal && current < goal) {
      grantXP(h);
      if (typeof Sounds !== 'undefined') Sounds.complete();
      if (typeof Mascot !== 'undefined') Mascot.onTaskCompleted('baixa');
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🎯 HABITO', (h.icon || '') + ' ' + h.name + ' — Meta atingida!', 'success', 3000);
      }
    }

    save();
    renderHabits();
  }

  function incrementToday(idx) {
    var h = habits[idx];
    if (!h) return;
    var today = todayKey();
    var goal = h.goal || 1;
    var current = getDayCount(h, today);

    if (current >= goal) return;

    setDayCount(h, today, current + 1);

    if (current + 1 >= goal) {
      grantXP(h);
      if (typeof Sounds !== 'undefined') Sounds.complete();
      if (typeof Mascot !== 'undefined') Mascot.onTaskCompleted('baixa');
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🎯 HABITO', (h.icon || '') + ' ' + h.name + ' — Meta atingida!', 'success', 3000);
      }
    }

    save();
    renderHabits();
  }

  function getXPReward(h) {
    var base = 5;
    var goal = h.goal || 1;
    return base + (goal > 1 ? goal * 2 : 0);
  }

  function grantXP(h) {
    if (typeof Gamification !== 'undefined') {
      var xp = getXPReward(h);
      Gamification.addBonusXP(xp, (h.icon || '🎯') + ' ' + h.name);
    }
  }

  function editHabitName(idx) {
    var h = habits[idx];
    if (!h) return;
    var nameEls = document.querySelectorAll('.habit-name.editable');
    var nameEl = nameEls[idx];
    if (!nameEl) return;

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'habit-edit-input';
    input.value = h.name;
    input.maxLength = 30;

    nameEl.replaceWith(input);
    input.focus();
    input.select();

    function finishEdit() {
      var newName = input.value.trim();
      if (newName) h.name = newName;
      save();
      renderHabits();
    }

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') finishEdit();
      if (e.key === 'Escape') renderHabits();
    });
  }

  function editHabit(idx) {
    var h = habits[idx];
    if (!h) return;

    var newGoal = prompt('Meta diaria para "' + h.name + '":\n(1 = toggle simples, 2+ = contador)', h.goal || 1);
    if (newGoal === null) return;
    h.goal = Math.max(1, parseInt(newGoal) || 1);

    var newReminder = prompt('Horario de lembrete (HH:MM):\n(vazio = sem lembrete)', h.reminder || '');
    if (newReminder !== null) h.reminder = newReminder.trim();

    var cats = ['', 'saude', 'fitness', 'produtividade', 'estudo', 'pessoal'];
    var currentCat = cats.indexOf(h.category || '');
    var newCat = prompt('Categoria (0-5):\n0=Nenhuma, 1=Saude, 2=Fitness, 3=Produtividade, 4=Estudo, 5=Pessoal', currentCat >= 0 ? currentCat : 0);
    if (newCat !== null) {
      var catIdx = parseInt(newCat);
      if (catIdx >= 0 && catIdx < cats.length) h.category = cats[catIdx];
    }

    save();
    renderHabits();
  }

  function cycleIcon(idx) {
    var icons = ['🎯', '💧', '🏃', '📖', '🧘', '💊', '🥗', '😴', '📝', '🚶', '🎸', '🧹', '💰', '📵', '✅'];
    var h = habits[idx];
    if (!h) return;
    var current = icons.indexOf(h.icon || '🎯');
    h.icon = icons[(current + 1) % icons.length];
    save();
    renderHabits();
  }

  function deleteHabit(idx) {
    if (!confirm('Excluir habito "' + habits[idx].name + '"?')) return;
    habits.splice(idx, 1);
    save();
    renderHabits();
  }

  function addHabit(name) {
    if (!name) return;

    var iconSel = document.getElementById('habitIconSel');
    var catSel = document.getElementById('habitCatSel');
    var goalInput = document.getElementById('habitGoalInput');
    var reminderInput = document.getElementById('habitReminderInput');

    habits.push({
      name: name,
      icon: iconSel ? iconSel.value : '🎯',
      category: catSel ? catSel.value : '',
      goal: goalInput ? (parseInt(goalInput.value) || 1) : 1,
      reminder: reminderInput ? reminderInput.value : '',
      log: {},
      createdAt: new Date().toISOString()
    });

    save();
    renderHabits();

    if (goalInput) goalInput.value = '';
    if (reminderInput) reminderInput.value = '';
    if (catSel) catSel.value = '';
    if (iconSel) iconSel.value = '🎯';

    if (typeof Sounds !== 'undefined') Sounds.addTask();
  }

  function showHabitStats(idx) {
    var h = habits[idx];
    if (!h) return;
    var body = document.getElementById('habitBody');
    if (!body) return;

    var streak = calcStreak(h);
    var bestStreak = calcBestStreak(h);
    var totalDays = calcTotalDays(h);
    var successRate = calcSuccessRate(h);
    var goal = h.goal || 1;

    var html = '<div style="padding:8px">';
    html += '<button class="habit-act-btn" id="habitStatsBack" style="margin-bottom:10px">← Voltar</button>';
    html += '<div class="habit-stats-title">' + (h.icon || '🎯') + ' ' + escHtml(h.name) + ' — Estatisticas</div>';

    html += '<div class="habit-stats-grid">';
    html += '<div class="habit-stat-card"><div class="hs-val">🔥 ' + streak + '</div><div class="hs-lbl">STREAK ATUAL</div></div>';
    html += '<div class="habit-stat-card"><div class="hs-val">🏆 ' + bestStreak + '</div><div class="hs-lbl">MELHOR STREAK</div></div>';
    html += '<div class="habit-stat-card"><div class="hs-val">📅 ' + totalDays + '</div><div class="hs-lbl">DIAS FEITOS</div></div>';
    html += '<div class="habit-stat-card"><div class="hs-val">' + successRate + '%</div><div class="hs-lbl">TAXA SUCESSO</div></div>';
    html += '<div class="habit-stat-card"><div class="hs-val">⭐ ' + (totalDays * getXPReward(h)) + '</div><div class="hs-lbl">XP TOTAL</div></div>';
    html += '<div class="habit-stat-card"><div class="hs-val">' + (goal > 1 ? goal + '/dia' : 'Toggle') + '</div><div class="hs-lbl">META</div></div>';
    html += '</div>';

    html += '<div class="habit-stats-title">📅 Ultimos 30 dias</div>';
    html += '<div class="habit-month-grid">';

    dayNames.forEach(function(d) {
      html += '<div style="text-align:center;font-size:8px;color:#006688">' + d.charAt(0) + '</div>';
    });

    var today = new Date();
    var start = new Date(today);
    start.setDate(start.getDate() - 29);

    var startDay = start.getDay();
    for (var s = 0; s < startDay; s++) {
      html += '<div class="habit-month-cell empty"></div>';
    }

    for (var j = 0; j < 30; j++) {
      var d = new Date(start);
      d.setDate(d.getDate() + j);
      var key = d.toISOString().slice(0, 10);
      var count = getDayCount(h, key);
      var isDone = count >= goal;
      var isToday = key === todayKey();
      html += '<div class="habit-month-cell' + (isDone ? ' done' : '') + (isToday ? ' today' : '') + '" title="' + key + ': ' + count + '/' + goal + '"></div>';
    }

    html += '</div>';

    html += '<div class="habit-stats-title">📊 Ultimas 4 semanas</div>';
    var weeks = [];
    for (var w = 3; w >= 0; w--) {
      var wcount = 0;
      for (var wd = 0; wd < 7; wd++) {
        var date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + wd));
        var wkey = date.toISOString().slice(0, 10);
        if (getDayCount(h, wkey) >= goal) wcount++;
      }
      weeks.push(wcount);
    }

    html += '<div style="height:60px;display:flex;align-items:flex-end;gap:8px;justify-content:center;margin-bottom:10px">';
    weeks.forEach(function(wv, wi) {
      var height = Math.max(4, (wv / 7) * 50);
      var label = wi === 3 ? 'Esta' : (3 - wi) + ' sem';
      html += '<div style="text-align:center">' +
        '<div style="color:var(--text-cyan);font-size:10px;margin-bottom:2px">' + wv + '/7</div>' +
        '<div style="width:30px;height:' + height + 'px;background:var(--pri-baixa);border-radius:2px;margin:0 auto"></div>' +
        '<div style="color:#006688;font-size:8px;margin-top:2px">' + label + '</div>' +
        '</div>';
    });
    html += '</div>';

    html += '</div>';

    body.innerHTML = html;

    document.getElementById('habitStatsBack').addEventListener('click', renderHabits);
  }

  function calcStreak(h) {
    if (!h.log) return 0;
    var goal = h.goal || 1;
    var streak = 0;
    var d = new Date();
    d.setHours(0, 0, 0, 0);

    while (true) {
      var key = d.toISOString().slice(0, 10);
      if (getDayCount(h, key) >= goal) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function calcBestStreak(h) {
    if (!h.log) return 0;
    var goal = h.goal || 1;
    var keys = Object.keys(h.log).sort();
    if (!keys.length) return 0;

    var best = 0;
    var current = 0;
    var prevDate = null;

    keys.forEach(function(key) {
      if (getDayCount(h, key) >= goal) {
        if (prevDate) {
          var prev = new Date(prevDate + 'T00:00:00');
          var curr = new Date(key + 'T00:00:00');
          var diff = (curr - prev) / 86400000;
          if (diff === 1) {
            current++;
          } else {
            current = 1;
          }
        } else {
          current = 1;
        }
        if (current > best) best = current;
        prevDate = key;
      } else {
        current = 0;
        prevDate = null;
      }
    });

    return best;
  }

  function calcTotalDays(h) {
    if (!h.log) return 0;
    var goal = h.goal || 1;
    return Object.keys(h.log).filter(function(k) { return getDayCount(h, k) >= goal; }).length;
  }

  function calcSuccessRate(h) {
    if (!h.log || !h.createdAt) return 0;
    var goal = h.goal || 1;
    var start = new Date(h.createdAt);
    start.setHours(0, 0, 0, 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var totalDays = Math.max(1, Math.ceil((today - start) / 86400000) + 1);
    var doneDays = Object.keys(h.log).filter(function(k) { return getDayCount(h, k) >= goal; }).length;
    return Math.round((doneDays / totalDays) * 100);
  }

  function getLast7Days() {
    var days = [];
    var today = new Date();
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  function getCatLabel(cat) {
    var labels = { saude: '🏥 Saude', fitness: '💪 Fitness', produtividade: '⚡ Prod', estudo: '📚 Estudo', pessoal: '🌟 Pessoal' };
    return labels[cat] || '';
  }

  function checkReminders() {
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    var nowTime = hh + ':' + mm;
    var today = todayKey();

    habits.forEach(function(h) {
      if (!h.reminder || h.reminder !== nowTime) return;
      var goal = h.goal || 1;
      if (getDayCount(h, today) >= goal) return;

      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🎯 HABITO', (h.icon || '') + ' Hora de: ' + h.name + '!', 'warn', 8000);
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎯 Habito — FCEUX', { body: (h.icon || '') + ' ' + h.name });
      }
    });
  }

  function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  var btnHabits = document.getElementById('btnHabits');
  if (btnHabits) btnHabits.addEventListener('click', open);

  var habitCloseBtn = document.getElementById('habitCloseBtn');
  if (habitCloseBtn) habitCloseBtn.addEventListener('click', close);

  if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

  var habitAddBtn = document.getElementById('habitAddBtn');
  if (habitAddBtn) {
    habitAddBtn.addEventListener('click', function() {
      var input = document.getElementById('habitInput');
      if (input) { addHabit(input.value.trim()); input.value = ''; }
    });
  }

  var habitInput = document.getElementById('habitInput');
  if (habitInput) {
    habitInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { addHabit(e.target.value.trim()); e.target.value = ''; }
    });
  }

  function init() {
    load();
    setInterval(checkReminders, 60000);
  }

  return { init: init, open: open, close: close };
})();