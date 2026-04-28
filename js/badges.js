/**
 * badges.js — Sistema de conquistas/badges
 * 30+ conquistas colecionáveis
 */
const Badges = (() => {
  const STORAGE_KEY = 'fceux_badges';
  const overlay = document.getElementById('badgesOverlay');
  let unlocked = {};

  const allBadges = [
    // Tarefas
    { id: 'first_task',      icon: '🌟', name: 'Primeira Tarefa',     desc: 'Criou sua primeira tarefa',           check: (s) => s.totalCreated >= 1 },
    { id: 'task_10',         icon: '📋', name: 'Organizador',         desc: 'Criou 10 tarefas',                    check: (s) => s.totalCreated >= 10 },
    { id: 'task_50',         icon: '📚', name: 'Produtivo',           desc: 'Criou 50 tarefas',                    check: (s) => s.totalCreated >= 50 },
    { id: 'task_100',        icon: '🗂️', name: 'Centenário',         desc: 'Criou 100 tarefas',                   check: (s) => s.totalCreated >= 100 },
    { id: 'task_500',        icon: '🏗️', name: 'Construtor',         desc: 'Criou 500 tarefas',                   check: (s) => s.totalCreated >= 500 },

    // Completar
    { id: 'complete_1',      icon: '✅', name: 'Iniciante',           desc: 'Completou primeira tarefa',            check: (s) => s.totalDone >= 1 },
    { id: 'complete_10',     icon: '💪', name: 'Dedicado',            desc: 'Completou 10 tarefas',                check: (s) => s.totalDone >= 10 },
    { id: 'complete_50',     icon: '🔥', name: 'Incansável',          desc: 'Completou 50 tarefas',                check: (s) => s.totalDone >= 50 },
    { id: 'complete_100',    icon: '⚡', name: 'Imbatível',           desc: 'Completou 100 tarefas',               check: (s) => s.totalDone >= 100 },
    { id: 'complete_5_day',  icon: '🎯', name: 'Dia Produtivo',      desc: 'Completou 5 tarefas em um dia',        check: (s) => s.doneToday >= 5 },
    { id: 'complete_10_day', icon: '💥', name: 'Máquina',             desc: 'Completou 10 tarefas em um dia',       check: (s) => s.doneToday >= 10 },

    // Streak
    { id: 'streak_3',        icon: '🔥', name: 'Aquecendo',           desc: '3 dias de streak',                    check: (s) => s.streak >= 3 },
    { id: 'streak_7',        icon: '🔥', name: 'Pegando Fogo',        desc: '7 dias de streak',                    check: (s) => s.streak >= 7 },
    { id: 'streak_14',       icon: '🔥', name: 'Imparável',           desc: '14 dias de streak',                   check: (s) => s.streak >= 14 },
    { id: 'streak_30',       icon: '🔥', name: 'Lendário',            desc: '30 dias de streak',                   check: (s) => s.streak >= 30 },

    // Nível
    { id: 'level_3',         icon: '⭐', name: 'Praticante',          desc: 'Atingiu nível 3',                     check: (s) => s.level >= 3 },
    { id: 'level_5',         icon: '⭐', name: 'Veterano',            desc: 'Atingiu nível 5',                     check: (s) => s.level >= 5 },
    { id: 'level_7',         icon: '⭐', name: 'Mestre',              desc: 'Atingiu nível 7',                     check: (s) => s.level >= 7 },
    { id: 'level_10',        icon: '👑', name: 'Lenda',               desc: 'Atingiu nível 10',                    check: (s) => s.level >= 10 },

    // Pomodoro
    { id: 'pomo_1',          icon: '🍅', name: 'Primeiro Pomodoro',   desc: 'Completou 1 pomodoro',                check: (s) => s.pomos >= 1 },
    { id: 'pomo_10',         icon: '🍅', name: 'Focado',              desc: 'Completou 10 pomodoros',              check: (s) => s.pomos >= 10 },
    { id: 'pomo_50',         icon: '🍅', name: 'Zen Master',          desc: 'Completou 50 pomodoros',              check: (s) => s.pomos >= 50 },

    // Horário
    { id: 'early_bird',      icon: '🌅', name: 'Madrugador',         desc: 'Completou tarefa antes das 7h',        check: (s) => s.earlyBird },
    { id: 'night_owl',       icon: '🦉', name: 'Coruja',              desc: 'Completou tarefa depois das 23h',      check: (s) => s.nightOwl },
    { id: 'weekend',         icon: '📅', name: 'Fim de Semana',       desc: 'Completou tarefa no sábado ou domingo', check: (s) => s.weekend },

    // Especiais
    { id: 'all_alta',        icon: '🔴', name: 'Herói',               desc: 'Completou 10 tarefas ALTA',           check: (s) => s.altaDone >= 10 },
    { id: 'speed_demon',     icon: '⚡', name: 'Speed Demon',         desc: 'Completou tarefa em menos de 5 min',   check: (s) => s.speedDemon },
    { id: 'habit_7',         icon: '🎯', name: 'Disciplinado',        desc: '7 dias seguidos de hábitos',           check: (s) => s.habitStreak >= 7 },
    { id: 'zero_overdue',    icon: '✨', name: 'Perfeito',            desc: 'Zero tarefas atrasadas por 7 dias',    check: (s) => s.zeroDays >= 7 },
    { id: 'mascot_click',    icon: '🤖', name: 'Amigo do PIXEL',     desc: 'Clicou no mascote 50 vezes',           check: (s) => s.mascotClicks >= 50 },
    { id: 'first_backup',    icon: '💾', name: 'Precavido',           desc: 'Fez o primeiro backup/export',         check: (s) => s.backups >= 1 },
  ];

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) unlocked = JSON.parse(saved);
    } catch (e) {}
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked)); }

  function getStats() {
    const tasks = TaskManager.getAll();
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();

    let stats = {
      totalCreated: tasks.length,
      totalDone: tasks.filter(t => t.done).length,
      doneToday: tasks.filter(t => t.done && t.createdAt && t.createdAt.startsWith(today)).length,
      streak: 0,
      level: 1,
      pomos: parseInt(localStorage.getItem('fceux_pomos_total') || '0'),
      earlyBird: now.getHours() < 7,
      nightOwl: now.getHours() >= 23,
      weekend: now.getDay() === 0 || now.getDay() === 6,
      altaDone: tasks.filter(t => t.done && t.priority === 'alta').length,
      speedDemon: false,
      habitStreak: 0,
      zeroDays: parseInt(localStorage.getItem('fceux_zero_overdue_days') || '0'),
      mascotClicks: parseInt(localStorage.getItem('fceux_mascot_clicks') || '0'),
      backups: parseInt(localStorage.getItem('fceux_backup_count') || '0'),
    };

    if (typeof Gamification !== 'undefined') {
      const info = Gamification.getLevelInfo();
      stats.streak = info.streak;
      stats.level = info.level;
    }

    // Speed demon check
    tasks.forEach(t => {
      if (t.done && t.timeSpent && t.timeSpent > 0 && t.timeSpent < 300) {
        stats.speedDemon = true;
      }
    });

    return stats;
  }

  function check() {
    const stats = getStats();
    let newUnlocks = [];

    allBadges.forEach(b => {
      if (unlocked[b.id]) return;
      if (b.check(stats)) {
        unlocked[b.id] = { date: new Date().toISOString().slice(0, 10) };
        newUnlocks.push(b);
      }
    });

    if (newUnlocks.length > 0) {
      save();
      newUnlocks.forEach((b, i) => {
        setTimeout(() => showUnlockPopup(b), i * 3000);
      });
    }
  }

  function showUnlockPopup(badge) {
    const popup = document.getElementById('badgeUnlockPopup');
    if (!popup) return;

    document.getElementById('bupIcon').textContent = badge.icon;
    document.getElementById('bupName').textContent = badge.name;
    document.getElementById('bupDesc').textContent = badge.desc;

    popup.classList.add('visible');

    if (typeof Sounds !== 'undefined') Sounds.badge();

    setTimeout(() => popup.classList.remove('visible'), 5000);
  }

  function open() {
    load();
    check();
    renderList();
    if (overlay) overlay.classList.add('visible');
  }

  function close() { if (overlay) overlay.classList.remove('visible'); }

  function renderList() {
    const body = document.getElementById('badgesBody');
    if (!body) return;

    const total = allBadges.length;
    const got = Object.keys(unlocked).length;

    let html = '<div class="badges-stats">' +
      '<div class="badges-stat"><div class="bs-val">' + got + '/' + total + '</div><div class="bs-lbl">DESBLOQUEADAS</div></div>' +
      '<div class="badges-stat"><div class="bs-val">' + Math.round((got / total) * 100) + '%</div><div class="bs-lbl">PROGRESSO</div></div>' +
      '</div>';

    html += '<div class="badge-grid">';
    allBadges.forEach(b => {
      const isUnlocked = !!unlocked[b.id];
      html += '<div class="badge-card ' + (isUnlocked ? 'unlocked' : 'locked') + '">' +
        '<div class="badge-icon">' + (isUnlocked ? b.icon : '🔒') + '</div>' +
        '<div class="badge-name">' + b.name + '</div>' +
        '<div class="badge-desc">' + b.desc + '</div>' +
        (isUnlocked ? '<div class="badge-date">📅 ' + unlocked[b.id].date + '</div>' : '<div class="badge-locked-text">Bloqueada</div>') +
        '</div>';
    });
    html += '</div>';

    body.innerHTML = html;
  }

  // Incrementar contadores
  function trackMascotClick() {
    const c = parseInt(localStorage.getItem('fceux_mascot_clicks') || '0') + 1;
    localStorage.setItem('fceux_mascot_clicks', String(c));
  }

  function trackBackup() {
    const c = parseInt(localStorage.getItem('fceux_backup_count') || '0') + 1;
    localStorage.setItem('fceux_backup_count', String(c));
  }

  function trackPomo() {
    const c = parseInt(localStorage.getItem('fceux_pomos_total') || '0') + 1;
    localStorage.setItem('fceux_pomos_total', String(c));
  }

  // Binds
  const btnBadges = document.getElementById('btnBadges');
  if (btnBadges) btnBadges.addEventListener('click', open);

  const badgesCloseBtn = document.getElementById('badgesCloseBtn');
  if (badgesCloseBtn) badgesCloseBtn.addEventListener('click', close);

  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const bupDismiss = document.getElementById('bupDismiss');
  if (bupDismiss) bupDismiss.addEventListener('click', () => {
    document.getElementById('badgeUnlockPopup').classList.remove('visible');
  });

  function init() {
    load();
    setTimeout(check, 5000);
    setInterval(check, 60000);
  }

  return { init, check, open, close, trackMascotClick, trackBackup, trackPomo };
})();