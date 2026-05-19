/**
 * pomodoro.js — Timer Pomodoro COMPLETO
 * Mini timer, pausa longa, histórico, badges, notificação browser
 */
const Pomodoro = (() => {
  const overlay = document.getElementById('pomoOverlay');
  const timerEl = document.getElementById('pomoTimer');
  const phaseEl = document.getElementById('pomoPhase');
  const dotsEl = document.getElementById('pomoDots');
  const taskNameEl = document.getElementById('pomoTaskName');

  // Mini timer
  const mini = document.getElementById('pomoMini');
  const miniTime = document.getElementById('pomoMiniTime');
  const miniPhase = document.getElementById('pomoMiniPhase');
  const miniTask = document.getElementById('pomoMiniTask');
  const miniIcon = document.getElementById('pomoMiniIcon');
  const miniFill = document.getElementById('pomoMiniFill');

  const HISTORY_KEY = 'fceux_pomo_history';
  const TODAY_KEY = 'fceux_pomos_today';
  const TOTAL_KEY = 'fceux_pomos_total';

  let running = false;
  let paused = false;
  let interval = null;
  let timeLeft = 25 * 60;
  let totalTime = 25 * 60;
  let isBreak = false;
  let isLongBreak = false;
  let completedPomos = 0;
  let currentTaskId = null;
  let currentTaskName = '';
  let sessionPomos = 0; // Pomos na sessão atual (reset a cada 4)

  function getConfig(key, fallback) {
    if (typeof Config !== 'undefined') return Config.get(key) || fallback;
    return fallback;
  }

  function getWorkMin() { return getConfig('pomoFocus', 25); }
  function getBreakMin() { return getConfig('pomoPause', 5); }
  function getLongBreakMin() { return getConfig('pomoLongBreak', 15); }
  function getLongBreakInterval() { return getConfig('pomoLongInterval', 4); }

  function playAlarm() {
    if (typeof Config !== 'undefined' && !Config.get('pomoSound')) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = isLongBreak
        ? [523, 659, 784, 1047, 1319, 1568]  // Fanfarra pra pausa longa
        : [800, 1000, 800, 1000, 800];        // Normal

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

  function sendBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect fill="%23000060" width="64" height="64" rx="8"/%3E%3Ctext x="32" y="46" text-anchor="middle" font-size="36"%3E🍅%3C/text%3E%3C/svg%3E',
          tag: 'fceux-pomo',
          requireInteraction: true
        });
      } catch (e) {}
    }
  }

  // === HISTÓRICO ===
  function getTodayStr() { return new Date().toISOString().slice(0, 10); }

  function addToHistory(type) {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history.push({
        date: getTodayStr(),
        time: new Date().toISOString(),
        type: type, // 'focus' ou 'break'
        duration: type === 'focus' ? getWorkMin() : (isLongBreak ? getLongBreakMin() : getBreakMin()),
        task: currentTaskName || ''
      });
      // Manter só últimos 30 dias
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const filtered = history.filter(h => h.date >= cutoffStr);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch (e) {}
  }

  function trackPomoCount() {
    const today = getTodayStr();

    // Hoje
    const todayData = JSON.parse(localStorage.getItem(TODAY_KEY) || '{}');
    if (todayData.date !== today) {
      todayData.date = today;
      todayData.count = 0;
    }
    todayData.count++;
    localStorage.setItem(TODAY_KEY, JSON.stringify(todayData));

    // Total
    const total = parseInt(localStorage.getItem(TOTAL_KEY) || '0') + 1;
    localStorage.setItem(TOTAL_KEY, String(total));

    // Rastrear pra badges
    if (typeof Badges !== 'undefined') Badges.trackPomo();
  }

  function getTodayPomos() {
    try {
      const data = JSON.parse(localStorage.getItem(TODAY_KEY) || '{}');
      if (data.date === getTodayStr()) return data.count || 0;
      return 0;
    } catch (e) { return 0; }
  }

  function getTotalPomos() {
    return parseInt(localStorage.getItem(TOTAL_KEY) || '0');
  }

  function getWeekPomos() {
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStr = weekAgo.toISOString().slice(0, 10);
      return history.filter(h => h.type === 'focus' && h.date >= weekStr).length;
    } catch (e) { return 0; }
  }

  // === INIT ===
  function init() {
    document.getElementById('btnPomo').addEventListener('click', open);
    document.getElementById('pomoClose').addEventListener('click', close);
    document.getElementById('pomoStart').addEventListener('click', start);
    document.getElementById('pomoPause').addEventListener('click', togglePause);
    document.getElementById('pomoReset').addEventListener('click', reset);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Mini timer — clicar abre o modal
    if (mini) mini.addEventListener('click', (e) => {
      if (e.target.id === 'pomoMiniClose') return;
      open();
    });

    const pomoMiniClose = document.getElementById('pomoMiniClose');
    if (pomoMiniClose) pomoMiniClose.addEventListener('click', (e) => {
      e.stopPropagation();
      open();
    });

    // Pedir permissão de notificação
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function open() {
    const selId = TaskManager.getSelectedId();
    if (selId && !currentTaskId) {
      const t = TaskManager.getTaskById(selId);
      if (t) {
        currentTaskId = selId;
        currentTaskName = t.text;
      }
    }

    if (currentTaskName) {
      taskNameEl.textContent = '📋 ' + currentTaskName;
    } else {
      taskNameEl.textContent = 'Nenhuma tarefa selecionada';
    }

    // Atualizar info de pomos
    updatePomoInfo();

    overlay.classList.add('visible');
  }

  function close() {
    overlay.classList.remove('visible');
    if (running) showMini();
  }

  function updatePomoInfo() {
    updateDots();

    const todayEl = document.getElementById('pomoTodayCount');
    const weekEl = document.getElementById('pomoWeekCount');
    const totalEl = document.getElementById('pomoTotalCount');

    if (todayEl) todayEl.textContent = getTodayPomos();
    if (weekEl) weekEl.textContent = getWeekPomos();
    if (totalEl) totalEl.textContent = getTotalPomos();
  }

  function start() {
    if (running && !paused) return;
    if (!running) {
      timeLeft = getWorkMin() * 60;
      totalTime = timeLeft;
      isBreak = false;
      isLongBreak = false;
      phaseEl.textContent = 'FOCO';
      timerEl.classList.remove('break', 'warning', 'long-break');
    }
    running = true;
    paused = false;
    document.getElementById('pomoStart').textContent = '▶ RODANDO';

    // Mascote
    if (typeof Mascot !== 'undefined') Mascot.onPomodoroStart();

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

    if (!overlay.classList.contains('visible')) showMini();
  }

  function togglePause() {
    if (!running) return;
    if (paused) {
      paused = false;
      document.getElementById('pomoPause').textContent = '⏸ PAUSAR';
      start();
    } else {
      paused = true;
      clearInterval(interval);
      document.getElementById('pomoPause').textContent = '▶ RETOMAR';
      updateMini();
    }
  }

  function reset() {
    clearInterval(interval);
    running = false;
    paused = false;
    isBreak = false;
    isLongBreak = false;
    timeLeft = getWorkMin() * 60;
    totalTime = timeLeft;
    timerEl.classList.remove('break', 'warning', 'long-break');
    phaseEl.textContent = 'FOCO';
    document.getElementById('pomoStart').textContent = '▶ INICIAR';
    document.getElementById('pomoPause').textContent = '⏸ PAUSAR';
    updateDisplay();
    document.title = 'FCEUX Task Manager v3.0';
    hideMini();
  }

  function onPhaseEnd() {
    playAlarm();

    if (!isBreak) {
      // === FOCO CONCLUÍDO ===
      completedPomos++;
      sessionPomos++;
      updateDots();
      trackPomoCount();
      addToHistory('focus');

      // Checar badges
      if (typeof Badges !== 'undefined') Badges.check();

      // Checar desafios
      if (typeof Challenges !== 'undefined') Challenges.update();

      // Som
      if (typeof Sounds !== 'undefined') Sounds.complete();

      // Verificar se é hora da pausa longa
      const longInterval = getLongBreakInterval();
      if (sessionPomos >= longInterval) {
        isLongBreak = true;
        sessionPomos = 0;
      } else {
        isLongBreak = false;
      }

      // Toast
      if (typeof Notifications !== 'undefined') {
        if (isLongBreak) {
          Notifications.showToast('🍅 POMODORO', '🎉 ' + longInterval + ' pomos completos! Pausa longa merecida!', 'success', 6000);
        } else {
          Notifications.showToast('🍅 POMODORO', 'Foco concluído! Hora da pausa.', 'success', 5000);
        }
      }

      // Notificação browser
      if (isLongBreak) {
        sendBrowserNotification('🍅 PAUSA LONGA!', longInterval + ' pomodoros completos! Descanse ' + getLongBreakMin() + ' min.');
      } else {
        sendBrowserNotification('🍅 Foco concluído!', 'Hora da pausa de ' + getBreakMin() + ' min.');
      }

      // Mascote
      if (typeof Mascot !== 'undefined') Mascot.onPomodoroBreak();

      // Gamificação — XP por pomodoro
      if (typeof Gamification !== 'undefined') {
        Gamification.addBonusXP(15, 'Pomodoro completo');
      }

      // Tela de conclusão
      if (typeof SessionComplete !== 'undefined') {
        SessionComplete.showPomoComplete(currentTaskName, getWorkMin());
      }

      // Iniciar pausa
      isBreak = true;
      const breakMin = isLongBreak ? getLongBreakMin() : getBreakMin();
      timeLeft = breakMin * 60;
      totalTime = timeLeft;
      phaseEl.textContent = isLongBreak ? '☕ PAUSA LONGA' : 'PAUSA';
      timerEl.classList.remove('warning');
      timerEl.classList.add('break');
      if (isLongBreak) timerEl.classList.add('long-break');
      running = false;
      document.getElementById('pomoStart').textContent = isLongBreak ? '☕ DESCANSAR' : '▶ PAUSAR';

    } else {
      // === PAUSA CONCLUÍDA ===
      addToHistory('break');

      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🍅 POMODORO', 'Pausa acabou! Volta ao foco.', 'info', 5000);
      }

      sendBrowserNotification('🍅 Pausa acabou!', 'Hora de voltar ao foco!');

      if (typeof Mascot !== 'undefined') Mascot.onPomodoroEnd();

      isBreak = false;
      isLongBreak = false;
      timeLeft = getWorkMin() * 60;
      totalTime = timeLeft;
      phaseEl.textContent = 'FOCO';
      timerEl.classList.remove('break', 'warning', 'long-break');
      running = false;
      document.getElementById('pomoStart').textContent = '▶ INICIAR';
    }

    updateDisplay();
    updateMini();
  }

  function updateDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const mm = String(min).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');
    timerEl.textContent = mm + ':' + ss;

    if (running && !paused) {
      document.title = (isBreak ? '☕ ' : '🍅 ') + mm + ':' + ss + ' — FCEUX Task Manager';
    }

    updateMini();
  }

  function updateDots() {
    const dots = dotsEl.querySelectorAll('.pomo-dot');
    const longInterval = getLongBreakInterval();
    dots.forEach((dot, i) => {
      dot.classList.remove('completed', 'active');
      if (i < (sessionPomos % longInterval)) dot.classList.add('completed');
      if (i === (sessionPomos % longInterval) && running) dot.classList.add('active');
    });
  }

  // === MINI TIMER ===
  function showMini() {
    if (mini) mini.classList.add('visible');
    updateMini();
  }

  function hideMini() {
    if (mini) mini.classList.remove('visible');
  }

  function updateMini() {
    if (!mini || !mini.classList.contains('visible')) return;

    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    const mm = String(min).padStart(2, '0');
    const ss = String(sec).padStart(2, '0');

    if (miniTime) {
      miniTime.textContent = mm + ':' + ss;
      miniTime.className = 'pomo-mini-time';
      if (isBreak) miniTime.classList.add('break');
      else if (timeLeft <= 60) miniTime.classList.add('warning');
    }

    if (miniPhase) {
      if (paused) miniPhase.textContent = '⏸ PAUSADO';
      else if (isLongBreak) miniPhase.textContent = '☕ PAUSA LONGA';
      else if (isBreak) miniPhase.textContent = 'PAUSA';
      else miniPhase.textContent = 'FOCO #' + (completedPomos + 1);
    }

    if (miniIcon) miniIcon.textContent = isBreak ? '☕' : '🍅';

    if (miniTask) {
      miniTask.textContent = currentTaskName
        ? currentTaskName
        : 'Hoje: ' + getTodayPomos() + ' 🍅';
    }

    if (miniFill) {
      const pct = totalTime > 0 ? Math.round((timeLeft / totalTime) * 100) : 0;
      miniFill.style.width = pct + '%';
      miniFill.className = 'pomo-mini-progress-fill';
      if (isBreak) miniFill.classList.add('break');
    }
  }

  // === API PÚBLICA ===
  return {
    init,
    getTodayPomos,
    getTotalPomos,
    getWeekPomos
  };
})();