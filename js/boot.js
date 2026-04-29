/**
 * boot.js — Loading screen estilo NES/BIOS
 * Simula inicialização do sistema
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

  const lines = [
    { text: 'FCEUX Task Manager BIOS v2.6.6', cls: '' },
    { text: 'Copyright (C) 2026 Gustavo Nogueira — GM Joinville', cls: '' },
    { text: '', cls: '' },
    { text: 'Verificando memória...                    640K', cls: '' },
    { text: 'Detectando IndexedDB...                   [OK]', cls: 'ok' },
    { text: 'Carregando Service Worker...               [OK]', cls: 'ok' },
    { text: 'Inicializando módulo de tarefas...         [OK]', cls: 'ok' },
    { text: 'Inicializando interface...                 [OK]', cls: 'ok' },
    { text: 'Inicializando Pomodoro Timer...            [OK]', cls: 'ok' },
    { text: 'Inicializando Kanban Board...              [OK]', cls: 'ok' },
    { text: 'Inicializando Calendar View...             [OK]', cls: 'ok' },
    { text: 'Inicializando Eisenhower Matrix...         [OK]', cls: 'ok' },
    { text: 'Inicializando Gamification...              [OK]', cls: 'ok' },
    { text: 'Inicializando Habit Tracker...             [OK]', cls: 'ok' },
    { text: 'Inicializando PIXEL AI...                  [OK]', cls: 'ok' },
    { text: 'Inicializando Pet System...                [OK]', cls: 'ok' },
    { text: 'Inicializando Linguagem Natural...         [OK]', cls: 'ok' },
    { text: 'Inicializando Auto-Escala...               [OK]', cls: 'ok' },
    { text: 'Inicializando Countdown Timer...           [OK]', cls: 'ok' },
    { text: 'Inicializando Badges System...             [OK]', cls: 'ok' },
    { text: 'Inicializando Sound Engine...              [OK]', cls: 'ok' },
    { text: 'Inicializando Particle System...           [OK]', cls: 'ok' },
    { text: 'Inicializando Backup System...             [OK]', cls: 'ok' },
    { text: 'Carregando configurações...                [OK]', cls: 'ok' },
    { text: '', cls: '' },
    { text: '41 módulos carregados. 120+ features ativas.', cls: 'ok' },
    { text: 'Todos os sistemas operacionais.', cls: 'ok' },
  ];

  let lineIndex = 0;

  function addLine() {
    if (lineIndex >= lines.length) {
      startProgress();
      return;
    }

    const line = lines[lineIndex];
    const el = document.createElement('div');
    el.className = 'boot-line';

    if (line.cls) {
      const parts = line.text.split(/(\[.*?\])/);
      parts.forEach(part => {
        if (part.match(/^\[.*\]$/)) {
          const span = document.createElement('span');
          span.className = line.cls;
          span.textContent = part;
          el.appendChild(span);
        } else {
          el.appendChild(document.createTextNode(part));
        }
      });
    } else {
      el.textContent = line.text;
    }

    bootLog.appendChild(el);
    bootLog.scrollTop = bootLog.scrollHeight;
    lineIndex++;

    setTimeout(addLine, 80 + Math.random() * 80);
  }

  function startProgress() {
    if (pWrap) pWrap.style.display = 'block';
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress > 100) progress = 100;

      if (pFill) pFill.style.width = progress + '%';
      if (pText) pText.textContent = 'Carregando módulos... ' + Math.round(progress) + '%';

      if (progress >= 100) {
        clearInterval(interval);
        if (pText) pText.textContent = 'Sistema pronto!';
        showPressStart();
      }
    }, 150);
  }

  function showPressStart() {
    if (pressStart) pressStart.style.display = 'block';
    bootDone = true;

    // Auto-start após 8 segundos
    setTimeout(() => {
      if (bootDone) finishBoot();
    }, 8000);
  }

  function finishBoot() {
    if (!bootDone) return;
    bootDone = false;

    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(() => {
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

  // Pular boot com qualquer tecla ou clique
  document.addEventListener('keydown', (e) => {
    if (bootDone && !e.repeat) finishBoot();
  });

  document.addEventListener('click', (e) => {
    if (bootDone && e.target.closest('#loadingScreen')) finishBoot();
  });

  // Iniciar boot
  setTimeout(addLine, 500);

  return { onReady: onReady };
})();