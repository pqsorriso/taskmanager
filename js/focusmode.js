/**
 * focusmode.js — Modo Foco
 * Tela minimalista com tarefa atual e timer
 */
const FocusMode = (() => {
  const overlay = document.getElementById('focusOverlay');
  const taskText = document.getElementById('focusTaskText');
  const timerEl = document.getElementById('focusTimer');
  const phaseEl = document.getElementById('focusPhase');
  const subtasksEl = document.getElementById('focusSubtasks');
  const dotsEl = document.getElementById('focusDots');

  let running = false;
  let paused = false;
  let interval = null;
  let timeLeft = 25 * 60;
  let isBreak = false;
  let completedPomos = 0;
  let taskId = null;

  const quotes = [
    'Foco é poder.', 'Uma tarefa de cada vez.', 'Progresso, não perfeição.',
    'Disciplina supera motivação.', 'Feito é melhor que perfeito.',
    'O segredo é começar.', 'Consistência é a chave.', 'Faça acontecer.',
    'Ação gera motivação.', 'Sem desculpas, só resultados.'
  ];

  function open() {
    const selId = TaskManager.getSelectedId();
    if (selId) {
      taskId = selId;
      const t = TaskManager.getTaskById(selId);
      if (t) {
        taskText.textContent = t.text;
        renderSubtasks(t);
      }
    } else {
      taskId = null;
      taskText.textContent = 'Selecione uma tarefa antes de focar';
      subtasksEl.innerHTML = '';
    }

    updateStats();
    randomQuote();
    overlay.classList.add('visible');
    if (typeof Mascot !== 'undefined') Mascot.onFocusMode();
  }

  function close() {
    overlay.classList.remove('visible');
    if (!running) {
      document.title = 'FCEUX Task Manager v2.6.6';
    }
  }

  function renderSubtasks(t) {
    subtasksEl.innerHTML = '';
    if (!t.subtasks || !t.subtasks.length) return;

    t.subtasks.forEach((st, i) => {
      const item = document.createElement('div');
      item.className = 'focus-subtask' + (st.done ? ' done' : '');
      item.innerHTML =
        '<span class="fs-check">' + (st.done ? '✅' : '⬜') + '</span>' +
        '<span>' + escHtml(st.text) + '</span>';

      item.addEventListener('click', async () => {
        st.done = !st.done;
        const task = TaskManager.getTaskById(taskId);
        if (task) {
          task.subtasks[i].done = st.done;
          await TaskDB.update(task);
          renderSubtasks(task);
          TaskManager.render();
        }
      });

      subtasksEl.appendChild(item);
    });
  }

  function start() {
    if (running && !paused) return;
    if (!running) {
      const workMin = typeof Config !== 'undefined' ? (Config.get('pomoFocus') || 25) : 25;
      timeLeft = workMin * 60;
      isBreak = false;
      phaseEl.textContent = 'FOCO';
      timerEl.classList.remove('break', 'warning');
    }
    running = true;
    paused = false;
    document.getElementById('focusStartBtn').textContent = '▶ RODANDO';

    interval = setInterval(() => {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 60 && !isBreak) {
        timerEl.classList.add('warning');
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        onPhaseEnd();
      }
    }, 1000);
  }

  function togglePause() {
    if (!running) return;
    if (paused) {
      paused = false;
      document.getElementById('focusPauseBtn').textContent = '⏸ PAUSAR';
      start();
    } else {
      paused = true;
      clearInterval(interval);
      document.getElementById('focusPauseBtn').textContent = '▶ RETOMAR';
    }
  }

  function reset() {
    clearInterval(interval);
    running = false;
    paused = false;
    isBreak = false;
    const workMin = typeof Config !== 'undefined' ? (Config.get('pomoFocus') || 25) : 25;
    timeLeft = workMin * 60;
    timerEl.classList.remove('break', 'warning');
    phaseEl.textContent = 'FOCO';
    document.getElementById('focusStartBtn').textContent = '▶ INICIAR';
    document.getElementById('focusPauseBtn').textContent = '⏸ PAUSAR';
    updateDisplay();
    document.title = 'FCEUX Task Manager v2.6.6';
  }

  function onPhaseEnd() {
    playAlarm();

    if (!isBreak) {
      completedPomos++;
      updateDots();

      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🍅 FOCO', 'Sessão concluída! Pausa.', 'success', 5000);
      }

      isBreak = true;
      const breakMin = typeof Config !== 'undefined' ? (Config.get('pomoPause') || 5) : 5;
      timeLeft = breakMin * 60;
      phaseEl.textContent = 'PAUSA';
      timerEl.classList.remove('warning');
      timerEl.classList.add('break');
      running = false;
      document.getElementById('focusStartBtn').textContent = '▶ PAUSAR';
    } else {
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🍅 FOCO', 'Pausa acabou! Volta ao foco.', 'info', 5000);
      }

      isBreak = false;
      const workMin = typeof Config !== 'undefined' ? (Config.get('pomoFocus') || 25) : 25;
      timeLeft = workMin * 60;
      phaseEl.textContent = 'FOCO';
      timerEl.classList.remove('break', 'warning');
      running = false;
      document.getElementById('focusStartBtn').textContent = '▶ INICIAR';
    }

    randomQuote();
    updateDisplay();
  }

  function updateDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const mm = String(min).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');
    timerEl.textContent = mm + ':' + ss;

    if (running && !paused) {
      document.title = (isBreak ? '☕ ' : '🎯 ') + mm + ':' + ss + ' — Modo Foco';
    }
  }

  function updateDots() {
    const dots = dotsEl.querySelectorAll('.focus-dot');
    dots.forEach((dot, i) => {
      dot.classList.remove('completed', 'active');
      if (i < completedPomos) dot.classList.add('completed');
      if (i === completedPomos && running) dot.classList.add('active');
    });
  }

  function updateStats() {
    const tasks = TaskManager.getAll();
    const today = new Date().toISOString().slice(0, 10);
    const doneToday = tasks.filter(t => t.done && t.createdAt && t.createdAt.startsWith(today)).length;

    const el1 = document.getElementById('focusDoneToday');
    if (el1) el1.textContent = doneToday;

    if (typeof Gamification !== 'undefined') {
      const info = Gamification.getLevelInfo();
      const el2 = document.getElementById('focusStreak');
      if (el2) el2.textContent = '🔥 ' + info.streak;
      const el3 = document.getElementById('focusXP');
      if (el3) el3.textContent = info.xp;
    }
  }

  function randomQuote() {
    const el = document.getElementById('focusQuote');
    if (el) el.textContent = '💬 "' + quotes[Math.floor(Math.random() * quotes.length)] + '"';
  }

  function playAlarm() {
    if (typeof Config !== 'undefined' && !Config.get('pomoSound')) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [800, 1000, 800, 1000, 800];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.15);
      });
    } catch (e) {}
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Binds
  document.getElementById('focusClose').addEventListener('click', close);
  document.getElementById('focusStartBtn').addEventListener('click', start);
  document.getElementById('focusPauseBtn').addEventListener('click', togglePause);
  document.getElementById('focusResetBtn').addEventListener('click', reset);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('visible')) {
      close();
    }
  });

  return { open, close };
})();