/**
 * focusmode.js — Modo Foco DIFERENCIADO
 * Tela minimalista com tempo personalizável, sem ciclos
 * Foco = sessão única na tarefa selecionada
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
  let totalTime = 25 * 60;
  let taskId = null;
  let taskName = '';
  let sessionCount = 0;
  let showingTimePicker = false;

  const quotes = [
    'Foco é poder.', 'Uma tarefa de cada vez.', 'Progresso, não perfeição.',
    'Disciplina supera motivação.', 'Feito é melhor que perfeito.',
    'O segredo é começar.', 'Consistência é a chave.', 'Faça acontecer.',
    'Ação gera motivação.', 'Sem desculpas, só resultados.',
    'Excelência é um hábito.', 'Menos é mais. Foque no essencial.',
    'Cada minuto focado conta.', 'Distrações são inimigas do progresso.',
    'Foco total, resultado total.'
  ];

  var presetTimes = [
    { label: '15 min', minutes: 15 },
    { label: '25 min', minutes: 25 },
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '60 min', minutes: 60 },
    { label: '90 min', minutes: 90 }
  ];

  function open() {
    var selId = typeof TaskManager !== 'undefined' ? TaskManager.getSelectedId() : null;
    if (selId) {
      taskId = selId;
      var t = TaskManager.getTaskById(selId);
      if (t) {
        taskName = t.text;
        taskText.textContent = t.text;
        renderSubtasks(t);

        // Se tarefa tem estimativa, usar como tempo
        if (t.estimate && t.estimate > 0 && !running) {
          timeLeft = t.estimate * 60;
          totalTime = timeLeft;
        }
      }
    } else {
      taskId = null;
      taskName = '';
      taskText.textContent = 'Selecione uma tarefa antes de focar';
      subtasksEl.innerHTML = '';
    }

    if (!running) {
      showTimePicker();
    }

    updateStats();
    randomQuote();
    updateDisplay();
    overlay.classList.add('visible');
    if (typeof Mascot !== 'undefined') Mascot.onFocusMode();
  }

  function close() {
    overlay.classList.remove('visible');
    hideTimePicker();
    if (!running) {
      document.title = 'FCEUX Task Manager v2.6.6';
    }
  }

  // === SELETOR DE TEMPO ===
  function showTimePicker() {
    hideTimePicker();
    showingTimePicker = true;

    var picker = document.createElement('div');
    picker.id = 'focusTimePicker';
    picker.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:12px 0;animation:row-fade-in 0.3s ease';

    presetTimes.forEach(function(pt) {
      var btn = document.createElement('button');
      btn.style.cssText = 'background:rgba(0,0,40,0.8);border:1px solid rgba(0,100,200,0.3);color:var(--text-cyan);font-family:var(--font-main);font-size:13px;padding:8px 16px;cursor:pointer;border-radius:4px;transition:all 0.15s;min-width:60px';
      btn.textContent = pt.label;
      btn.addEventListener('mouseover', function() {
        btn.style.borderColor = 'rgba(0,170,255,0.5)';
        btn.style.background = 'rgba(0,80,160,0.3)';
      });
      btn.addEventListener('mouseout', function() {
        btn.style.borderColor = 'rgba(0,100,200,0.3)';
        btn.style.background = 'rgba(0,0,40,0.8)';
      });
      btn.addEventListener('click', function() {
        selectTime(pt.minutes);
      });
      picker.appendChild(btn);
    });

    // Custom
    var customBtn = document.createElement('button');
    customBtn.style.cssText = 'background:rgba(0,0,40,0.8);border:1px solid rgba(0,100,200,0.3);color:#cc88ff;font-family:var(--font-main);font-size:13px;padding:8px 12px;cursor:pointer;border-radius:4px;transition:all 0.15s';
    customBtn.textContent = '⏱️ Custom';
    customBtn.addEventListener('click', function() {
      var input = document.createElement('input');
      input.type = 'number';
      input.min = '1';
      input.max = '180';
      input.value = '25';
      input.placeholder = 'min';
      input.style.cssText = 'background:var(--bg-input);border:1px solid var(--text-cyan);padding:6px;font-family:var(--font-main);font-size:14px;color:var(--text-cyan);outline:none;width:60px;text-align:center;border-radius:4px';

      var okBtn = document.createElement('button');
      okBtn.style.cssText = 'background:rgba(0,150,80,0.4);border:1px solid rgba(0,200,100,0.5);color:var(--pri-baixa);font-family:var(--font-main);font-size:13px;padding:6px 14px;cursor:pointer;border-radius:4px;margin-left:6px';
      okBtn.textContent = 'OK';
      okBtn.addEventListener('click', function() {
        var val = parseInt(input.value) || 25;
        val = Math.max(1, Math.min(180, val));
        selectTime(val);
      });

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          var val = parseInt(input.value) || 25;
          val = Math.max(1, Math.min(180, val));
          selectTime(val);
        }
      });

      customBtn.replaceWith(input);
      picker.appendChild(okBtn);
      input.focus();
    });
    picker.appendChild(customBtn);

    // Inserir após o phaseEl
    var parent = phaseEl.parentNode;
    if (parent) {
      parent.insertBefore(picker, phaseEl.nextSibling);
    }
  }

  function hideTimePicker() {
    showingTimePicker = false;
    var picker = document.getElementById('focusTimePicker');
    if (picker) picker.remove();
  }

  function selectTime(minutes) {
    timeLeft = minutes * 60;
    totalTime = timeLeft;
    hideTimePicker();
    updateDisplay();
    phaseEl.textContent = 'FOCO — ' + minutes + ' min';
    if (typeof Sounds !== 'undefined') Sounds.click();
  }

  function renderSubtasks(t) {
    subtasksEl.innerHTML = '';
    if (!t.subtasks || !t.subtasks.length) return;

    t.subtasks.forEach(function(st, i) {
      var item = document.createElement('div');
      item.className = 'focus-subtask' + (st.done ? ' done' : '');
      item.innerHTML =
        '<span class="fs-check">' + (st.done ? '✅' : '⬜') + '</span>' +
        '<span>' + escHtml(st.text) + '</span>';

      item.addEventListener('click', async function() {
        st.done = !st.done;
        var task = TaskManager.getTaskById(taskId);
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
      if (timeLeft <= 0) {
        timeLeft = 25 * 60;
        totalTime = timeLeft;
      }
      phaseEl.textContent = 'FOCO — ' + Math.ceil(totalTime / 60) + ' min';
      timerEl.classList.remove('break', 'warning');
    }
    hideTimePicker();
    running = true;
    paused = false;
    document.getElementById('focusStartBtn').textContent = '▶ RODANDO';

    interval = setInterval(function() {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 60) {
        timerEl.classList.add('warning');
      }

      if (timeLeft <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);
  }

  function togglePause() {
    if (!running) return;
    if (paused) {
      paused = false;
      document.getElementById('focusPauseBtn').textContent = '⏸ PAUSAR';
      document.getElementById('focusStartBtn').textContent = '▶ RODANDO';
      interval = setInterval(function() {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 60) {
          timerEl.classList.add('warning');
        }
        if (timeLeft <= 0) {
          clearInterval(interval);
          onComplete();
        }
      }, 1000);
    } else {
      paused = true;
      clearInterval(interval);
      document.getElementById('focusPauseBtn').textContent = '▶ RETOMAR';
      document.getElementById('focusStartBtn').textContent = '⏸ PAUSADO';
    }
  }

  function reset() {
    clearInterval(interval);
    running = false;
    paused = false;
    timeLeft = totalTime;
    timerEl.classList.remove('break', 'warning');
    phaseEl.textContent = 'FOCO';
    document.getElementById('focusStartBtn').textContent = '▶ INICIAR';
    document.getElementById('focusPauseBtn').textContent = '⏸ PAUSAR';
    updateDisplay();
    document.title = 'FCEUX Task Manager v2.6.6';
    showTimePicker();
  }

  // === SESSÃO CONCLUÍDA ===
  function onComplete() {
    running = false;
    paused = false;
    sessionCount++;
    var durationMin = Math.ceil(totalTime / 60);

    playAlarm();

    // XP baseado no tempo
    var xpGain = Math.max(10, Math.round(durationMin * 0.6));
    if (typeof Gamification !== 'undefined') {
      Gamification.addBonusXP(xpGain, 'Foco ' + durationMin + ' min');
    }

    // Atualizar tempo gasto na tarefa
    if (taskId) {
      var task = typeof TaskManager !== 'undefined' ? TaskManager.getTaskById(taskId) : null;
      if (task) {
        task.timeSpent = (task.timeSpent || 0) + (totalTime);
        TaskDB.update(task);
      }
    }

    // Notificação
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('🎯 FOCO COMPLETO!', durationMin + ' min de foco! +' + xpGain + ' XP', 'success', 6000);
    }

    // Mascote
    if (typeof Mascot !== 'undefined') {
      Mascot.setState('celebrate', 5000);
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎯 Foco concluído!', { body: durationMin + ' minutos de concentração!' });
    }

    // Tela de conclusão
    if (typeof SessionComplete !== 'undefined') {
      SessionComplete.showFocusComplete(taskName || 'Sessão de foco', durationMin);
    }

    // Atualizar display
    timerEl.textContent = '00:00';
    phaseEl.textContent = '✅ CONCLUÍDO!';
    timerEl.classList.remove('warning');
    document.getElementById('focusStartBtn').textContent = '▶ NOVO';
    document.title = '✅ Foco concluído! — FCEUX Task Manager';

    // Badges
    if (typeof Badges !== 'undefined') Badges.check();
    if (typeof Challenges !== 'undefined') Challenges.update();

    updateDots();
    updateStats();
  }

  function updateDisplay() {
    var min = Math.floor(timeLeft / 60);
    var sec = timeLeft % 60;
    var mm = String(min).padStart(2, '0');
    var ss = String(sec).padStart(2, '0');
    timerEl.textContent = mm + ':' + ss;

    if (running && !paused) {
      document.title = '🎯 ' + mm + ':' + ss + ' — Modo Foco';
    }
  }

  function updateDots() {
    if (!dotsEl) return;
    var dots = dotsEl.querySelectorAll('.focus-dot');
    dots.forEach(function(dot, i) {
      dot.classList.remove('completed', 'active');
      if (i < sessionCount) dot.classList.add('completed');
      if (i === sessionCount && running) dot.classList.add('active');
    });
  }

  function updateStats() {
    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var today = new Date().toISOString().slice(0, 10);
    var doneToday = tasks.filter(function(t) {
      if (!t.done) return false;
      if (t.completedAt && t.completedAt.startsWith(today)) return true;
      if (t.createdAt && t.createdAt.startsWith(today)) return true;
      return false;
    }).length;

    var el1 = document.getElementById('focusDoneToday');
    if (el1) el1.textContent = doneToday;

    if (typeof Gamification !== 'undefined') {
      var info = Gamification.getLevelInfo();
      var el2 = document.getElementById('focusStreak');
      if (el2) el2.textContent = '🔥 ' + info.streak;
      var el3 = document.getElementById('focusXP');
      if (el3) el3.textContent = info.xp;
    }
  }

  function randomQuote() {
    var el = document.getElementById('focusQuote');
    if (el) el.textContent = '💬 "' + quotes[Math.floor(Math.random() * quotes.length)] + '"';
  }

  function playAlarm() {
    if (typeof Config !== 'undefined' && !Config.get('pomoSound')) return;
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
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

  function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Binds
  var closeBtn = document.getElementById('focusClose');
  if (closeBtn) closeBtn.addEventListener('click', close);

  var startBtn = document.getElementById('focusStartBtn');
  if (startBtn) startBtn.addEventListener('click', function() {
    if (!running && timeLeft <= 0) {
      // Novo ciclo
      timeLeft = totalTime;
      showTimePicker();
      phaseEl.textContent = 'FOCO';
      timerEl.classList.remove('warning');
      updateDisplay();
      return;
    }
    start();
  });

  var pauseBtn = document.getElementById('focusPauseBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

  var resetBtn = document.getElementById('focusResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', reset);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('visible')) {
      close();
    }
  });

  return { open: open, close: close };
})();