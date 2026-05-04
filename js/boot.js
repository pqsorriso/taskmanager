/**
 * boot.js — Loading screen com verificação REAL dos módulos
 * Cada linha testa se o módulo existe e funciona
 */
const BootScreen = (() => {
  const screen = document.getElementById('loadingScreen');
  const bootLog = document.getElementById('bootLog');
  const pWrap = document.getElementById('progressWrap');
  const pFill = document.getElementById('progressFill');
  const pText = document.getElementById('progressText');
  const pressStart = document.getElementById('pressStart');

  let readyCallback = null;
  let bootDone = false;
  let okCount = 0;
  let failCount = 0;

  function check(name, condition) {
    var ok = false;
    try { ok = condition(); } catch (e) { ok = false; }
    if (ok) okCount++;
    else failCount++;
    return ok;
  }

  const modules = [
    { text: 'FCEUX Task Manager BIOS v2.6.6', check: null },
    { text: 'Copyright (C) 2026 Gustavo Nogueira — GM Joinville', check: null },
    { text: '', check: null },
    { text: 'Verificando memória...                    640K', check: null },
    { text: 'Detectando IndexedDB...                   ', check: function() { return check('IndexedDB', function() { return typeof indexedDB !== 'undefined'; }); } },
    { text: 'Detectando localStorage...                ', check: function() { return check('localStorage', function() { return typeof localStorage !== 'undefined'; }); } },
    { text: 'Detectando Service Worker...               ', check: function() { return check('SW', function() { return 'serviceWorker' in navigator; }); } },
    { text: 'Carregando TaskDB...                      ', check: function() { return check('TaskDB', function() { return typeof TaskDB !== 'undefined' && typeof TaskDB.open === 'function'; }); } },
    { text: 'Carregando TaskManager...                 ', check: function() { return check('TaskManager', function() { return typeof TaskManager !== 'undefined' && typeof TaskManager.getAll === 'function'; }); } },
    { text: 'Carregando UI Manager...                  ', check: function() { return check('UI', function() { return typeof UI !== 'undefined'; }); } },
    { text: 'Carregando Keyboard...                    ', check: function() { return check('Keyboard', function() { return typeof Keyboard !== 'undefined'; }); } },
    { text: 'Inicializando Notifications...            ', check: function() { return check('Notifications', function() { return typeof Notifications !== 'undefined'; }); } },
    { text: 'Inicializando Projects...                 ', check: function() { return check('Projects', function() { return typeof Projects !== 'undefined'; }); } },
    { text: 'Inicializando Views (Kanban/Calendar)...  ', check: function() { return check('Views', function() { return typeof Views !== 'undefined'; }); } },
    { text: 'Inicializando Pomodoro Timer...           ', check: function() { return check('Pomodoro', function() { return typeof Pomodoro !== 'undefined' && typeof Pomodoro.init === 'function'; }); } },
    { text: 'Inicializando Notepad...                  ', check: function() { return check('Notepad', function() { return typeof Notepad !== 'undefined'; }); } },
    { text: 'Inicializando Commands...                 ', check: function() { return check('Commands', function() { return typeof Commands !== 'undefined'; }); } },
    { text: 'Inicializando MultiSelect...              ', check: function() { return check('MultiSelect', function() { return typeof MultiSelect !== 'undefined'; }); } },
    { text: 'Inicializando Weather...                  ', check: function() { return check('Weather', function() { return typeof Weather !== 'undefined'; }); } },
    { text: 'Inicializando Templates...                ', check: function() { return check('Templates', function() { return typeof Templates !== 'undefined'; }); } },
    { text: 'Inicializando QuickAdd...                 ', check: function() { return check('QuickAdd', function() { return typeof QuickAdd !== 'undefined'; }); } },
    { text: 'Inicializando Workdays...                 ', check: function() { return check('Workdays', function() { return typeof Workdays !== 'undefined'; }); } },
    { text: 'Inicializando Archive...                  ', check: function() { return check('Archive', function() { return typeof Archive !== 'undefined'; }); } },
    { text: 'Inicializando MyDay...                    ', check: function() { return check('MyDay', function() { return typeof MyDay !== 'undefined'; }); } },
    { text: 'Inicializando Gamification...             ', check: function() { return check('Gamification', function() { return typeof Gamification !== 'undefined' && typeof Gamification.getLevelInfo === 'function'; }); } },
    { text: 'Inicializando Habit Tracker...            ', check: function() { return check('Habits', function() { return typeof Habits !== 'undefined'; }); } },
    { text: 'Inicializando Config...                   ', check: function() { return check('Config', function() { return typeof Config !== 'undefined' && typeof Config.get === 'function'; }); } },
    { text: 'Inicializando Eisenhower Matrix...        ', check: function() { return check('Eisenhower', function() { return typeof Eisenhower !== 'undefined'; }); } },
    { text: 'Inicializando Matrix Screensaver...       ', check: function() { return check('Matrix', function() { return typeof Matrix !== 'undefined'; }); } },
    { text: 'Inicializando DashBar...                  ', check: function() { return check('DashBar', function() { return typeof DashBar !== 'undefined'; }); } },
    { text: 'Inicializando Focus Mode...               ', check: function() { return check('FocusMode', function() { return typeof FocusMode !== 'undefined'; }); } },
    { text: 'Inicializando PrintView...                ', check: function() { return check('PrintView', function() { return typeof PrintView !== 'undefined'; }); } },
    { text: 'Inicializando Mascot PIXEL...             ', check: function() { return check('Mascot', function() { return typeof Mascot !== 'undefined' && typeof Mascot.setState === 'function'; }); } },
    { text: 'Inicializando Themes...                   ', check: function() { return check('Themes', function() { return typeof Themes !== 'undefined'; }); } },
    { text: 'Inicializando Countdown Timer...          ', check: function() { return check('Countdown', function() { return typeof Countdown !== 'undefined'; }); } },
    { text: 'Inicializando Tooltip...                  ', check: function() { return check('Tooltip', function() { return typeof Tooltip !== 'undefined'; }); } },
    { text: 'Inicializando Favicon...                  ', check: function() { return check('Favicon', function() { return typeof Favicon !== 'undefined'; }); } },
    { text: 'Inicializando Challenges...               ', check: function() { return check('Challenges', function() { return typeof Challenges !== 'undefined'; }); } },
    { text: 'Inicializando Particles...                ', check: function() { return check('Particles', function() { return typeof Particles !== 'undefined'; }); } },
    { text: 'Inicializando Pet System...               ', check: function() { return check('Pet', function() { return typeof Pet !== 'undefined'; }); } },
    { text: 'Inicializando Natural Language...         ', check: function() { return check('NaturalLanguage', function() { return typeof NaturalLanguage !== 'undefined'; }); } },
    { text: 'Inicializando Reminders...                ', check: function() { return check('Reminders', function() { return typeof Reminders !== 'undefined'; }); } },
    { text: 'Inicializando AutoScale...                ', check: function() { return check('AutoScale', function() { return typeof AutoScale !== 'undefined'; }); } },
    { text: 'Inicializando Sound Engine...             ', check: function() { return check('Sounds', function() { return typeof Sounds !== 'undefined' && typeof Sounds.complete === 'function'; }); } },
    { text: 'Inicializando Badges System...            ', check: function() { return check('Badges', function() { return typeof Badges !== 'undefined' && typeof Badges.check === 'function'; }); } },
    { text: 'Inicializando Onboarding...               ', check: function() { return check('Onboarding', function() { return typeof Onboarding !== 'undefined'; }); } },
    { text: 'Inicializando Backup System...            ', check: function() { return check('Backup', function() { return typeof Backup !== 'undefined'; }); } },
    { text: 'Inicializando PIXEL AI...                 ', check: function() { return check('PixelAI', function() { return typeof PixelAI !== 'undefined' && typeof PixelAI.open === 'function'; }); } },
    { text: 'Inicializando Boss Mode...                ', check: function() { return check('BossMode', function() { return typeof BossMode !== 'undefined'; }); } },
    { text: 'Inicializando Day Planner...              ', check: function() { return check('DayPlan', function() { return typeof DayPlan !== 'undefined'; }); } },
    { text: 'Inicializando Weekly Report...            ', check: function() { return check('Weekly', function() { return typeof Weekly !== 'undefined'; }); } },
    { text: '', check: null },
    { text: 'RESULTADO_FINAL', check: null },
  ];

  let lineIndex = 0;

  function addLine() {
    if (lineIndex >= modules.length) {
      startProgress();
      return;
    }

    var mod = modules[lineIndex];

    // Linha final de resultado
    if (mod.text === 'RESULTADO_FINAL') {
      var totalModules = okCount + failCount;
      var el = document.createElement('div');
      el.className = 'boot-line';

      if (failCount === 0) {
        var span = document.createElement('span');
        span.className = 'ok';
        span.textContent = '[ALL OK]';
        el.appendChild(document.createTextNode(totalModules + ' módulos carregados. 130+ features. '));
        el.appendChild(span);
      } else {
        el.appendChild(document.createTextNode(okCount + '/' + totalModules + ' módulos OK. '));
        var failSpan = document.createElement('span');
        failSpan.className = 'fail';
        failSpan.textContent = '[' + failCount + ' FAIL]';
        el.appendChild(failSpan);
      }

      bootLog.appendChild(el);
      bootLog.scrollTop = bootLog.scrollHeight;
      lineIndex++;
      setTimeout(addLine, 100);
      return;
    }

    var el = document.createElement('div');
    el.className = 'boot-line';

    if (mod.check) {
      var result = mod.check();
      var parts = mod.text;
      el.appendChild(document.createTextNode(parts));

      var span = document.createElement('span');
      if (result) {
        span.className = 'ok';
        span.textContent = '[OK]';
      } else {
        span.className = 'fail';
        span.textContent = '[FAIL]';
      }
      el.appendChild(span);
    } else {
      el.textContent = mod.text;
    }

    bootLog.appendChild(el);
    bootLog.scrollTop = bootLog.scrollHeight;
    lineIndex++;

    setTimeout(addLine, 50 + Math.random() * 60);
  }

  function startProgress() {
    if (pWrap) pWrap.style.display = 'block';
    var progress = 0;

    var interval = setInterval(function() {
      progress += Math.random() * 15 + 5;
      if (progress > 100) progress = 100;

      if (pFill) pFill.style.width = progress + '%';
      if (pText) {
        if (progress < 30) pText.textContent = 'Carregando dados... ' + Math.round(progress) + '%';
        else if (progress < 60) pText.textContent = 'Renderizando interface... ' + Math.round(progress) + '%';
        else if (progress < 90) pText.textContent = 'Inicializando mascote... ' + Math.round(progress) + '%';
        else pText.textContent = 'Sistema pronto! ' + Math.round(progress) + '%';
      }

      if (progress >= 100) {
        clearInterval(interval);
        if (pText) pText.textContent = failCount === 0 ? '✅ Todos os sistemas operacionais!' : '⚠️ Sistema iniciado com ' + failCount + ' aviso(s)';
        showPressStart();
      }
    }, 120);
  }

  function showPressStart() {
    if (pressStart) pressStart.style.display = 'block';
    bootDone = true;

    setTimeout(function() {
      if (bootDone) finishBoot();
    }, 8000);
  }

  function finishBoot() {
    if (!bootDone) return;
    bootDone = false;

    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(function() {
        screen.classList.add('hidden');
        if (readyCallback) readyCallback();
      }, 600);
    } else {
      if (readyCallback) readyCallback();
    }
  }

  function onReady(cb) {
    readyCallback = cb;
  }

  document.addEventListener('keydown', function(e) {
    if (bootDone && !e.repeat) finishBoot();
  });

  document.addEventListener('click', function(e) {
    if (bootDone && e.target.closest('#loadingScreen')) finishBoot();
  });

  setTimeout(addLine, 500);

  return { onReady: onReady };
})();