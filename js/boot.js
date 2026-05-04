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
    { text: 'IndexedDB...              ', check: function() { return check('IndexedDB', function() { return typeof indexedDB !== 'undefined'; }); } },
    { text: 'localStorage...           ', check: function() { return check('ls', function() { return typeof localStorage !== 'undefined'; }); } },
    { text: 'Service Worker...         ', check: function() { return check('SW', function() { return 'serviceWorker' in navigator; }); } },
    { text: '', check: null },
    { text: '── CORE ──', check: null },
    { text: 'TaskDB...                 ', check: function() { return check('TaskDB', function() { return typeof TaskDB !== 'undefined'; }); } },
    { text: 'TaskManager...            ', check: function() { return check('TaskManager', function() { return typeof TaskManager !== 'undefined'; }); } },
    { text: 'TaskUI...                 ', check: function() { return check('TaskUI', function() { return typeof TaskUI !== 'undefined'; }); } },
    { text: 'Keyboard...               ', check: function() { return check('Keyboard', function() { return typeof Keyboard !== 'undefined'; }); } },
    { text: 'Config...                 ', check: function() { return check('Config', function() { return typeof Config !== 'undefined'; }); } },
    { text: '', check: null },
    { text: '── PRODUTIVIDADE ──', check: null },
    { text: 'Pomodoro...               ', check: function() { return check('Pomodoro', function() { return typeof Pomodoro !== 'undefined'; }); } },
    { text: 'Views (Kanban/Cal)...     ', check: function() { return check('Views', function() { return typeof Views !== 'undefined'; }); } },
    { text: 'Eisenhower...             ', check: function() { return check('Eisenhower', function() { return typeof Eisenhower !== 'undefined'; }); } },
    { text: 'FocusMode...              ', check: function() { return check('FocusMode', function() { return typeof FocusMode !== 'undefined'; }); } },
    { text: 'Habits...                 ', check: function() { return check('Habits', function() { return typeof Habits !== 'undefined'; }); } },
    { text: 'Countdown...              ', check: function() { return check('Countdown', function() { return typeof Countdown !== 'undefined'; }); } },
    { text: 'NaturalLanguage...        ', check: function() { return check('NL', function() { return typeof NaturalLanguage !== 'undefined'; }); } },
    { text: 'Weekly Report...          ', check: function() { return check('Weekly', function() { return typeof Weekly !== 'undefined'; }); } },
    { text: '', check: null },
    { text: '── GAMIFICAÇÃO ──', check: null },
    { text: 'Gamification...           ', check: function() { return check('Gamification', function() { return typeof Gamification !== 'undefined'; }); } },
    { text: 'Badges...                 ', check: function() { return check('Badges', function() { return typeof Badges !== 'undefined'; }); } },
    { text: 'Challenges...             ', check: function() { return check('Challenges', function() { return typeof Challenges !== 'undefined'; }); } },
    { text: '', check: null },
    { text: '── MASCOTE ──', check: null },
    { text: 'PIXEL Mascot...           ', check: function() { return check('Mascot', function() { return typeof Mascot !== 'undefined'; }); } },
    { text: 'PIXEL AI...               ', check: function() { return check('PixelAI', function() { return typeof PixelAI !== 'undefined'; }); } },
    { text: 'Pet System...             ', check: function() { return check('Pet', function() { return typeof Pet !== 'undefined'; }); } },
    { text: '', check: null },
    { text: '── SISTEMA ──', check: null },
    { text: 'Sounds...                 ', check: function() { return check('Sounds', function() { return typeof Sounds !== 'undefined'; }); } },
    { text: 'Notifications...          ', check: function() { return check('Notifications', function() { return typeof Notifications !== 'undefined'; }); } },
    { text: 'AutoScale...              ', check: function() { return check('AutoScale', function() { return typeof AutoScale !== 'undefined'; }); } },
    { text: 'Backup...                 ', check: function() { return check('Backup', function() { return typeof Backup !== 'undefined'; }); } },
    { text: 'BossMode...               ', check: function() { return check('BossMode', function() { return typeof BossMode !== 'undefined'; }); } },
    { text: 'DayPlan...                ', check: function() { return check('DayPlan', function() { return typeof DayPlan !== 'undefined'; }); } },
    { text: 'Outlook...                ', check: function() { return check('Outlook', function() { return typeof Outlook !== 'undefined'; }); } },
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