/**
 * challenges.js — Desafios diários
 * Gera um desafio novo a cada dia
 */
const Challenges = (() => {
  const STORAGE_KEY = 'fceux_challenge';
  const bar = document.getElementById('challengeBar');
  let challenge = null;
  let dismissed = false;

  const templates = [
    { id: 'complete3',   text: 'Complete 3 tarefas',           icon: '✅', target: 3,  check: 'doneToday',    xp: 30 },
    { id: 'complete5',   text: 'Complete 5 tarefas',           icon: '🔥', target: 5,  check: 'doneToday',    xp: 50 },
    { id: 'complete7',   text: 'Complete 7 tarefas',           icon: '💪', target: 7,  check: 'doneToday',    xp: 80 },
    { id: 'alta2',       text: 'Complete 2 tarefas ALTA',      icon: '🔴', target: 2,  check: 'altaToday',    xp: 40 },
    { id: 'create5',     text: 'Crie 5 novas tarefas',         icon: '📝', target: 5,  check: 'createdToday', xp: 25 },
    { id: 'pomo1',       text: 'Complete 1 Pomodoro',          icon: '🍅', target: 1,  check: 'pomosToday',   xp: 35 },
    { id: 'pomo3',       text: 'Complete 3 Pomodoros',         icon: '🍅', target: 3,  check: 'pomosToday',   xp: 60 },
    { id: 'habit3',      text: 'Marque 3 hábitos',            icon: '🎯', target: 3,  check: 'habitsToday',  xp: 30 },
    { id: 'nooverdue',   text: 'Zero tarefas atrasadas',      icon: '⏰', target: 0,  check: 'overdue',      xp: 40 },
    { id: 'morning5',    text: 'Complete 5 tarefas antes 12h', icon: '☀️', target: 5,  check: 'doneMorning',  xp: 60 },
    { id: 'streak3',     text: 'Mantenha streak de 3 dias',    icon: '🔥', target: 3,  check: 'streak',       xp: 50 },
    { id: 'focus30',     text: '30 min de tempo focado',       icon: '⏱️', target: 30, check: 'focusMinutes', xp: 45 },
  ];

  function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date === getTodayStr()) {
          challenge = data;
          dismissed = data.dismissed || false;
          return;
        }
      }
    } catch (e) {}
    generateNew();
  }

  function save() {
    if (challenge) {
      challenge.dismissed = dismissed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
    }
  }

  function generateNew() {
    const today = getTodayStr();
    // Usar a data como seed pra todo mundo ter o mesmo desafio
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const idx = seed % templates.length;
    const tpl = templates[idx];

    challenge = {
      date: today,
      id: tpl.id,
      text: tpl.text,
      icon: tpl.icon,
      target: tpl.target,
      check: tpl.check,
      xp: tpl.xp,
      completed: false,
      dismissed: false,
      rewarded: false
    };

    dismissed = false;
    save();
  }

  function getProgress() {
    if (!challenge) return 0;
    const tasks = TaskManager.getAll();
    const today = getTodayStr();
    const now = new Date();

    switch (challenge.check) {
      case 'doneToday':
        return tasks.filter(t => t.done && t.createdAt && t.createdAt.startsWith(today)).length;

      case 'altaToday':
        return tasks.filter(t => t.done && t.priority === 'alta' && t.createdAt && t.createdAt.startsWith(today)).length;

      case 'createdToday':
        return tasks.filter(t => t.createdAt && t.createdAt.startsWith(today)).length;

      case 'pomosToday':
        return parseInt(localStorage.getItem('fceux_pomos_' + today) || '0');

      case 'habitsToday':
        try {
          const habits = JSON.parse(localStorage.getItem('fceux_habits') || '[]');
          let count = 0;
          habits.forEach(h => { if (h.days && h.days[today]) count++; });
          return count;
        } catch (e) { return 0; }

      case 'overdue':
        const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
        return tasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate + 'T00:00:00') < todayDate).length;

      case 'doneMorning':
        if (now.getHours() >= 12) {
          return tasks.filter(t => {
            if (!t.done || !t.createdAt || !t.createdAt.startsWith(today)) return false;
            return true;
          }).length;
        }
        return tasks.filter(t => t.done && t.createdAt && t.createdAt.startsWith(today)).length;

      case 'streak':
        if (typeof Gamification !== 'undefined') return Gamification.getLevelInfo().streak;
        return 0;

      case 'focusMinutes':
        let totalMin = 0;
        tasks.forEach(t => {
          if (t.timeSpent && t.createdAt && t.createdAt.startsWith(today)) {
            totalMin += Math.floor(t.timeSpent / 60);
          }
        });
        return totalMin;

      default:
        return 0;
    }
  }

  function update() {
    if (!challenge || dismissed) {
      if (bar) bar.classList.remove('visible');
      return;
    }

    const progress = getProgress();
    let isComplete = false;

    if (challenge.check === 'overdue') {
      isComplete = progress === 0;
    } else {
      isComplete = progress >= challenge.target;
    }

    const pct = challenge.check === 'overdue'
      ? (progress === 0 ? 100 : Math.max(0, 100 - progress * 25))
      : Math.min(100, Math.round((progress / challenge.target) * 100));

    // Atualizar DOM
    const iconEl = document.getElementById('challengeIcon');
    const nameEl = document.getElementById('challengeName');
    const rewardEl = document.getElementById('challengeReward');
    const fillEl = document.getElementById('challengeFill');
    const pctEl = document.getElementById('challengePct');

    if (iconEl) iconEl.textContent = challenge.icon;
    if (nameEl) nameEl.textContent = challenge.text;
    if (rewardEl) rewardEl.textContent = '+' + challenge.xp + ' XP';
    if (fillEl) fillEl.style.width = pct + '%';

    if (isComplete && !challenge.rewarded) {
      challenge.completed = true;
      challenge.rewarded = true;
      save();

      if (pctEl) { pctEl.textContent = '✅ COMPLETO!'; pctEl.className = 'challenge-pct challenge-complete'; }

      // Dar XP
      if (typeof Gamification !== 'undefined') {
        Gamification.addBonusXP(challenge.xp, 'Desafio: ' + challenge.text);
      }

      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🎯 DESAFIO COMPLETO!', challenge.text + ' → +' + challenge.xp + ' XP!', 'success', 6000);
      }

      if (typeof Mascot !== 'undefined') {
        Mascot.setState('celebrate', 4000);
        Mascot.showBubble && Mascot.showBubble('DESAFIO COMPLETO! 🎯🏆');
      }
    } else if (isComplete) {
      if (pctEl) { pctEl.textContent = '✅'; pctEl.className = 'challenge-pct challenge-complete'; }
    } else {
      if (pctEl) { pctEl.textContent = pct + '%'; pctEl.className = 'challenge-pct'; }
    }

    if (bar) bar.classList.add('visible');
  }

  // Binds
  const closeBtn = document.getElementById('challengeClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dismissed = true;
      save();
      if (bar) bar.classList.remove('visible');
    });
  }

  function init() {
    load();
    update();
    // Atualizar a cada 30 segundos
    setInterval(update, 30000);
  }

  return { init, update };
})();