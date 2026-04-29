/**
 * mascot.js — Mascote Pixel Robot COMPLETO
 * 8 funcionalidades: diálogos contextuais, personalização, evolução,
 * mini-game, humor por horário, reação a clima, nome customizável, arrastar
 */
const Mascot = (() => {
  const canvas = document.getElementById('mascotCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const bubble = document.getElementById('mascotBubble');
  const container = document.getElementById('mascotContainer');
  const nameLabel = document.getElementById('mascotNameLabel');

  const STORAGE_KEY = 'fceux_mascot';
  let currentState = 'idle';
  let stateTimeout = null;
  let bubbleTimeout = null;
  let lastInteraction = Date.now();
  let blinkTimer = null;
  let isBlinking = false;
  let clickCount = 0;
  let clickTimer = null;
  let isFloating = false;

  // Configurações personalizáveis
  let config = {
    name: 'PIXEL',
    colorScheme: 'blue',
    accessory: 'none',
    position: null // { x, y } se arrastado
  };

  // Esquemas de cor
  const colorSchemes = {
    blue:   { main: '#4488cc', light: '#66aaee', dark: '#336699', outline: '#224466', head: '#5599dd', headL: '#77bbff', headD: '#4488cc' },
    red:    { main: '#cc4444', light: '#ee6666', dark: '#993333', outline: '#442222', head: '#dd5555', headL: '#ff7777', headD: '#cc4444' },
    green:  { main: '#44aa44', light: '#66cc66', dark: '#338833', outline: '#224422', head: '#55bb55', headL: '#77dd77', headD: '#44aa44' },
    purple: { main: '#8844cc', light: '#aa66ee', dark: '#663399', outline: '#332244', head: '#9955dd', headL: '#bb77ff', headD: '#8844cc' },
    orange: { main: '#cc8844', light: '#eeaa66', dark: '#996633', outline: '#443322', head: '#dd9955', headL: '#ffbb77', headD: '#cc8844' },
    pink:   { main: '#cc4488', light: '#ee66aa', dark: '#993366', outline: '#442233', head: '#dd5599', headL: '#ff77bb', headD: '#cc4488' },
    cyan:   { main: '#44aacc', light: '#66ccee', dark: '#338899', outline: '#224444', head: '#55bbdd', headL: '#77ddff', headD: '#44aacc' },
    gold:   { main: '#ccaa44', light: '#eecc66', dark: '#998833', outline: '#444422', head: '#ddbb55', headL: '#ffdd77', headD: '#ccaa44' },
  };

  // Evolução por nível
  const evolutions = [
    { level: 1,  name: 'Básico',    icon: '🤖', desc: 'Robô simples' },
    { level: 3,  name: 'Bronze',    icon: '🥉', desc: 'Antena melhorada' },
    { level: 5,  name: 'Prata',     icon: '🥈', desc: 'Armadura leve' },
    { level: 7,  name: 'Ouro',      icon: '🥇', desc: 'Armadura dourada' },
    { level: 10, name: 'Lenda',     icon: '👑', desc: 'Coroa + aura' },
  ];

  // Acessórios
  const accessories = [
    { id: 'none',      label: 'Nenhum' },
    { id: 'hat',       label: '🎩 Chapéu' },
    { id: 'cap',       label: '🧢 Boné' },
    { id: 'glasses',   label: '🕶️ Óculos' },
    { id: 'crown',     label: '👑 Coroa' },
    { id: 'antenna2',  label: '📡 Antena+' },
    { id: 'scarf',     label: '🧣 Cachecol' },
    { id: 'headphone', label: '🎧 Headphone' },
    { id: 'helmet',    label: '⛑️ Capacete' },
    { id: 'mask',      label: '😷 Máscara' },
    { id: 'monocle',   label: '🧐 Monóculo' },
  ];

  // Cores fixas
  const F = {
    antBase: '#667788', antTip: '#ffcc00', antGlow: '#ffee66',
    eyeGreen: '#00ff44', eyeGreenD: '#00cc33',
    eyeRed: '#ff3333', eyeRedD: '#cc0000',
    eyeBlue: '#33aaff', eyeBlueD: '#0088dd',
    eyeYellow: '#ffee00', eyeYellowD: '#ddcc00',
    eyeStar: '#ffdd00', eyeOff: '#113322', eyeWhite: '#ffffff',
    mouthHappy: '#00dd88', mouthSad: '#ff6666', mouthNeutral: '#00aa66',
    heart: '#ff4466', heartB: '#ff6688',
    fire1: '#ff2200', fire2: '#ff6600', fire3: '#ffaa00', fire4: '#ffdd44',
    tear: '#44bbff', sweat: '#66ddff', spark: '#ffffaa', sparkB: '#ffffff',
    note: '#00ffaa', shadow: '#112233',
    coffee: '#884422', coffeeCup: '#eeeeee', coffeeSmoke: '#aabbcc',
    crown: '#ffcc00', crownGem: '#ff4444',
    tomatoR: '#ee3322', tomatoG: '#44aa22',
    speedLine: '#aaccee', excl: '#ff4444', zzz: '#aaccee',
  };

  function getColors() { return colorSchemes[config.colorScheme] || colorSchemes.blue; }
  function getEvoLevel() {
    if (typeof Gamification === 'undefined') return 1;
    return Gamification.getLevelInfo().level;
  }

  // === LOAD / SAVE ===
  function loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) config = Object.assign(config, JSON.parse(saved));
    } catch (e) {}
    if (nameLabel) nameLabel.textContent = config.name;
  }

  function saveConfig() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  // === PIXEL DRAWING ===
  function px(x, y, color) { if (!ctx) return; ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
  function rect(x, y, w, h, color) { if (!ctx) return; ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function clear() { if (!ctx) return; ctx.clearRect(0, 0, 32, 32); }

  // === DRAW ROBOT BASE ===
  function drawRobotBase(c) {
    if (!c) c = getColors();
    const evo = getEvoLevel();

    // Antena
    px(15, 5, F.antBase); px(16, 5, F.antBase);
    px(15, 4, F.antBase); px(16, 4, F.antBase);
    px(15, 3, F.antBase); px(16, 3, F.antBase);
    px(14, 2, F.antGlow); px(15, 2, F.antTip); px(16, 2, F.antTip); px(17, 2, F.antGlow);
    px(15, 1, F.antGlow); px(16, 1, F.antGlow);

    // Evolução antena
    if (evo >= 3) { px(14, 1, F.antTip); px(17, 1, F.antTip); }
    if (evo >= 5) { px(13, 0, F.spark); px(18, 0, F.spark); }

    // Cabeça
    for (let x = 9; x <= 22; x++) px(x, 6, c.outline);
    for (let y = 7; y <= 14; y++) {
      px(8, y, c.outline); px(23, y, c.outline);
      for (let x = 9; x <= 22; x++) px(x, y, y === 7 ? c.headL : c.head);
    }
    for (let x = 9; x <= 22; x++) px(x, 15, c.outline);
    rect(10, 8, 12, 6, c.headD);
    rect(11, 9, 10, 4, c.head);
    px(10, 12, c.headL); px(21, 12, c.headL);

    // Corpo
    for (let x = 10; x <= 21; x++) px(x, 16, c.outline);
    for (let y = 17; y <= 24; y++) {
      px(9, y, c.outline); px(22, y, c.outline);
      for (let x = 10; x <= 21; x++) px(x, y, y === 17 ? c.light : c.main);
    }
    for (let x = 10; x <= 21; x++) px(x, 25, c.outline);

    // Placa peitoral
    rect(12, 18, 8, 5, c.dark);
    rect(13, 19, 6, 3, c.main);

    // Evolução armadura
    if (evo >= 5) {
      px(10, 17, F.spark); px(21, 17, F.spark);
      px(10, 24, F.spark); px(21, 24, F.spark);
    }
    if (evo >= 7) {
      for (let x = 10; x <= 21; x++) { if (x % 2 === 0) px(x, 16, F.crown); }
      px(9, 17, F.crown); px(22, 17, F.crown);
    }

    rect(10, 24, 12, 1, c.dark);

    // Braços
    rect(6, 17, 3, 2, c.outline); rect(6, 19, 3, 5, c.main); rect(6, 19, 3, 1, c.light);
    rect(6, 24, 3, 1, c.outline); rect(6, 24, 3, 2, c.dark);
    rect(23, 17, 3, 2, c.outline); rect(23, 19, 3, 5, c.main); rect(23, 19, 3, 1, c.light);
    rect(23, 24, 3, 1, c.outline); rect(23, 24, 3, 2, c.dark);

    // Pernas
    rect(11, 26, 3, 3, c.dark); rect(11, 26, 3, 1, c.outline);
    rect(18, 26, 3, 3, c.dark); rect(18, 26, 3, 1, c.outline);
    rect(10, 29, 5, 2, c.outline); rect(11, 29, 3, 1, c.main);
    rect(17, 29, 5, 2, c.outline); rect(18, 29, 3, 1, c.main);
    rect(10, 31, 5, 1, F.shadow); rect(17, 31, 5, 1, F.shadow);

    // Evolução aura (nível 10)
    if (evo >= 10) {
      const auraColor = 'rgba(255,220,0,0.3)';
      ctx.fillStyle = auraColor;
      ctx.fillRect(6, 5, 1, 22); ctx.fillRect(25, 5, 1, 22);
      ctx.fillRect(7, 3, 18, 1); ctx.fillRect(7, 28, 18, 1);
    }

    // Acessório
    drawAccessory(c);
  }

  function drawAccessory(c) {
    switch (config.accessory) {
      case 'hat':
        rect(9, 3, 14, 3, '#222222');
        rect(8, 6, 16, 1, '#333333');
        rect(11, 1, 10, 2, '#222222');
        break;
      case 'cap':
        rect(8, 5, 10, 2, '#cc2222');
        rect(6, 6, 5, 1, '#cc2222');
        rect(10, 4, 8, 1, '#cc2222');
        break;
      case 'glasses':
        rect(10, 9, 4, 3, '#333333'); rect(11, 10, 2, 1, '#aaddff');
        rect(18, 9, 4, 3, '#333333'); rect(19, 10, 2, 1, '#aaddff');
        rect(14, 10, 4, 1, '#333333');
        break;
      case 'crown':
        px(11, 4, F.crown); px(13, 4, F.crown); px(15, 3, F.crown);
        px(16, 3, F.crown); px(18, 4, F.crown); px(20, 4, F.crown);
        rect(11, 5, 10, 1, F.crown);
        px(15, 4, F.crownGem); px(16, 4, F.crownGem);
        break;
      case 'antenna2':
        px(10, 4, F.antBase); px(10, 3, F.antBase); px(10, 2, F.antTip);
        px(9, 1, F.antGlow); px(11, 1, F.antGlow);
        px(21, 4, F.antBase); px(21, 3, F.antBase); px(21, 2, F.antTip);
        px(20, 1, F.antGlow); px(22, 1, F.antGlow);
        break;
      case 'scarf':
        rect(8, 15, 16, 2, '#cc3333');
        rect(7, 16, 3, 4, '#cc3333');
        px(7, 20, '#aa2222'); px(8, 20, '#aa2222');
        break;
      case 'headphone':
        rect(7, 6, 18, 2, '#333333');
        rect(6, 7, 3, 4, '#444444');
        rect(23, 7, 3, 4, '#444444');
        px(7, 8, '#666666'); px(24, 8, '#666666');
        break;
      case 'helmet':
        rect(8, 3, 16, 4, '#ddaa00');
        rect(9, 2, 14, 1, '#ddaa00');
        rect(10, 7, 12, 1, '#cc9900');
        px(9, 7, '#ddaa00'); px(22, 7, '#ddaa00');
        // Visor
        rect(11, 5, 10, 2, '#66ccff');
        break;
      case 'mask':
        rect(10, 11, 12, 4, '#ffffff');
        rect(11, 12, 10, 2, '#dddddd');
        // Linhas
        px(13, 12, '#bbbbbb'); px(15, 12, '#bbbbbb');
        px(17, 12, '#bbbbbb'); px(19, 12, '#bbbbbb');
        break;
      case 'monocle':
        // Monóculo no olho direito
        rect(17, 8, 5, 5, 'transparent');
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(19.5, 10.5, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        // Corrente
        px(21, 13, '#ffcc00'); px(22, 14, '#ffcc00'); px(22, 15, '#ffcc00');
        break;
    }
  }

  function drawEyes(lc, rc, ld, rd) {
    rect(11, 9, 3, 3, lc); px(11, 9, ld || lc); px(13, 11, ld || lc); px(12, 9, F.eyeWhite);
    rect(18, 9, 3, 3, rc); px(18, 9, rd || rc); px(20, 11, rd || rc); px(19, 9, F.eyeWhite);
  }

  function drawClosedEyes() { rect(11, 10, 3, 1, F.eyeOff); rect(18, 10, 3, 1, F.eyeOff); }

  function drawMouth(s) {
    if (s === 'happy') { px(13, 13, F.mouthHappy); rect(14, 13, 4, 1, F.mouthHappy); px(18, 13, F.mouthHappy); px(13, 12, F.mouthHappy); px(18, 12, F.mouthHappy); }
    else if (s === 'big') { rect(13, 12, 6, 2, F.mouthHappy); px(12, 12, F.mouthHappy); px(19, 12, F.mouthHappy); }
    else if (s === 'sad') { rect(14, 13, 4, 1, F.mouthSad); px(13, 12, F.mouthSad); px(18, 12, F.mouthSad); }
    else if (s === 'open') { rect(14, 12, 4, 2, F.shadow); px(15, 12, F.mouthHappy); px(16, 12, F.mouthHappy); }
    else if (s === 'neutral') { rect(14, 13, 4, 1, F.mouthNeutral); }
    else if (s === 'sleep') { rect(14, 13, 4, 1, getColors().headD); }
  }

  function drawHeart() {
    px(14, 20, F.heart); px(15, 19, F.heart); px(16, 19, F.heart); px(17, 20, F.heart);
    px(15, 20, F.heartB); px(16, 20, F.heartB); px(15, 21, F.heart); px(16, 21, F.heart);
  }

  // === ESTADOS DE DESENHO ===
  function drawIdle() { clear(); drawRobotBase(); if (isBlinking) drawClosedEyes(); else drawEyes(F.eyeGreen, F.eyeGreen, F.eyeGreenD, F.eyeGreenD); drawMouth('happy'); drawHeart(); px(26, 5, F.note); px(27, 4, F.note); }
  function drawSleep() { clear(); drawRobotBase(); drawClosedEyes(); drawMouth('sleep'); px(25, 4, F.zzz); px(26, 3, F.zzz); px(27, 2, F.zzz); px(28, 1, F.zzz); }
  function drawCelebrate() { clear(); drawRobotBase(); drawEyes(F.eyeStar, F.eyeStar, F.eyeYellowD, F.eyeYellowD); drawMouth('big'); drawHeart(); rect(5, 14, 3, 2, getColors().main); rect(4, 12, 3, 2, getColors().light); rect(24, 14, 3, 2, getColors().main); rect(25, 12, 3, 2, getColors().light); px(3, 8, F.sparkB); px(28, 8, F.sparkB); px(2, 5, F.spark); px(29, 5, F.spark); }
  function drawWorry() { clear(); drawRobotBase(); drawEyes(F.eyeRed, F.eyeRed, F.eyeRedD, F.eyeRedD); drawMouth('sad'); px(24, 8, F.sweat); px(24, 9, F.sweat); px(25, 9, F.sweat); px(27, 4, F.excl); px(27, 5, F.excl); px(27, 7, F.excl); }
  function drawFire() { clear(); px(5, 20, F.fire1); px(4, 19, F.fire2); px(3, 18, F.fire3); px(3, 17, F.fire4); px(26, 20, F.fire1); px(27, 19, F.fire2); px(28, 18, F.fire3); px(12, 30, F.fire1); px(19, 30, F.fire1); drawRobotBase(); drawEyes(F.eyeYellow, F.eyeYellow, F.eyeYellowD, F.eyeYellowD); drawMouth('open'); }
  function drawCoffee() { clear(); drawRobotBase(); if (isBlinking) drawClosedEyes(); else drawEyes(F.eyeGreen, F.eyeGreen, F.eyeGreenD, F.eyeGreenD); drawMouth('neutral'); rect(24, 22, 4, 3, F.coffeeCup); rect(24, 21, 4, 1, F.coffee); px(25, 19, F.coffeeSmoke); px(26, 18, F.coffeeSmoke); }
  function drawFocus() { clear(); drawRobotBase(); drawEyes(F.eyeBlue, F.eyeBlue, F.eyeBlueD, F.eyeBlueD); px(9, 10, F.eyeBlue); px(8, 10, F.eyeBlue); px(22, 10, F.eyeBlue); px(23, 10, F.eyeBlue); drawMouth('neutral'); drawHeart(); }
  function drawSad() { clear(); drawRobotBase(); drawEyes(F.eyeBlue, F.eyeBlue, F.eyeBlueD, F.eyeBlueD); drawMouth('sad'); px(12, 12, F.tear); px(12, 13, F.tear); px(12, 14, F.tear); px(19, 12, F.tear); px(19, 13, F.tear); }
  function drawRun() { clear(); drawRobotBase(); drawEyes(F.eyeYellow, F.eyeYellow, F.eyeYellowD, F.eyeYellowD); drawMouth('open'); px(2, 18, F.speedLine); px(1, 18, F.speedLine); px(3, 20, F.speedLine); px(2, 22, F.speedLine); px(28, 4, F.excl); px(28, 5, F.excl); px(28, 7, F.excl); }
  function drawLevelUp() { clear(); drawRobotBase(); drawEyes(F.eyeStar, F.eyeStar, F.eyeYellowD, F.eyeYellowD); drawMouth('big'); px(11, 4, F.crown); px(13, 4, F.crown); px(15, 3, F.crown); px(16, 3, F.crown); px(18, 4, F.crown); px(20, 4, F.crown); rect(11, 5, 10, 1, F.crown); px(4, 6, F.sparkB); px(27, 6, F.sparkB); }
  function drawPomo() { clear(); drawRobotBase(); if (isBlinking) drawClosedEyes(); else drawEyes(F.eyeGreen, F.eyeGreen, F.eyeGreenD, F.eyeGreenD); drawMouth('neutral'); drawHeart(); rect(24, 22, 3, 3, F.tomatoR); px(25, 21, F.tomatoG); px(25, 20, F.tomatoG); }
  function drawWink() { clear(); drawRobotBase(); rect(11, 10, 3, 1, F.eyeOff); rect(18, 9, 3, 3, F.eyeGreen); px(19, 9, F.eyeWhite); drawMouth('happy'); drawHeart(); px(8, 9, F.sparkB); }
  function drawRain() { clear(); drawRobotBase(); if (isBlinking) drawClosedEyes(); else drawEyes(F.eyeBlue, F.eyeBlue, F.eyeBlueD, F.eyeBlueD); drawMouth('neutral'); rect(8, 2, 16, 2, '#667788'); rect(7, 4, 18, 1, '#556677'); px(10, 6, F.tear); px(14, 7, F.tear); px(20, 6, F.tear); px(24, 7, F.tear); }

  const drawFns = { idle: drawIdle, sleep: drawSleep, celebrate: drawCelebrate, worry: drawWorry, fire: drawFire, coffee: drawCoffee, focus: drawFocus, sad: drawSad, run: drawRun, levelup: drawLevelUp, pomo: drawPomo, think: drawIdle, rain: drawRain };

  function redraw() { (drawFns[currentState] || drawIdle)(); }

  // === BLINK ===
  function startBlink() {
    blinkTimer = setInterval(() => {
      if (['idle', 'coffee', 'pomo', 'rain'].includes(currentState)) {
        isBlinking = true; redraw();
        setTimeout(() => { isBlinking = false; redraw(); }, 150);
      }
    }, 3000 + Math.random() * 2000);
  }

  // === FRASES ===
  const phrases = {
    idle: ['Bora produzir! 💪', 'Tô aqui contigo! ⭐', 'Foco! 🎯', 'Beep boop! 🤖', 'Sistema online! ✅', 'Modo turbo! ⚡', 'Vamos lá! 🚀'],
    sleep: ['Zzz... standby... 💤', 'Me acorda! 😴', 'Bateria 100%... 🔋'],
    worry: ['ALERTA! ⚠️', 'Bora resolver! 💪', 'Erro 404: tempo! 🚨'],
    fire: ['TURBO MODE! 🔥', 'Streak insano! ⚡', 'OVERCLOCKED! 🔥🔥'],
    celebrate: ['TASK COMPLETE! ✅', '+XP! ⭐', 'Arrasou! 💪', 'Beep boop! 🎉'],
    focus: ['CPU 100%! 🎯', 'Zero distrações! 🔒', 'Processando... 🤖'],
    coffee: ['Recarregando... ☕', 'Coffee.exe ☕', 'Bateria: carregando...'],
    sad: ['Saudades... 😢', 'Volta logo! 🥺', 'Bateria fraca... 🔋'],
    pomo: ['Tick tock! ⏰', 'Timer ativo! 🍅', 'Processando tarefa... ⏱️'],
    rain: ['Chuva! Guarda-chuva! ☂️', 'Dia chuvoso em Joinville 🌧️', 'Cozy coding! 🌧️☕'],
    morning: ['Bom dia! ☀️', 'Café primeiro? ☕', 'Dia novo, tarefas novas!'],
    afternoon: ['Boa tarde! 🌤️', 'Metade do dia! 💪', 'Continue focado!'],
    evening: ['Boa noite! 🌙', 'Quase hora de descansar...', 'Último sprint! 🏃'],
    night: ['Ainda acordado? 😴', 'Vai dormir! 🌙', 'Madrugador ou atrasado? 🤔']
  };

  const emotes = {
    celebrate: ['🎉', '⭐', '✨', '💪', '🏆'], fire: ['🔥', '💥', '⚡'],
    levelup: ['⭐', '🏆', '🎉', '✨'], coffee: ['☕'], worry: ['💦', '⚠️']
  };

  // === ESTADO ===
  function setState(state, duration) {
    if (stateTimeout) clearTimeout(stateTimeout);
    currentState = state;
    lastInteraction = Date.now();
    if (canvas) canvas.className = 'mascot-canvas ' + state;
    redraw();
    if (emotes[state]) showEmote(emotes[state][Math.floor(Math.random() * emotes[state].length)]);
    if (duration) stateTimeout = setTimeout(() => evaluateState(), duration);
  }

  function showEmote(emoji) {
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'mascot-emote';
    el.textContent = emoji;
    el.style.right = (Math.random() * 20 - 10) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  function showBubble(text) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('visible');
    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(() => bubble.classList.remove('visible'), 4000);
  }

  function getPhrase(state) {
    const list = phrases[state] || phrases.idle;
    return list[Math.floor(Math.random() * list.length)];
  }

  // === 1. DIÁLOGOS CONTEXTUAIS ===
  function contextualDialog() {
    const tasks = TaskManager.getAll();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

    // Tarefa vence amanhã
    const dueTomorrow = tasks.filter(t => !t.done && t.dueDate === tomorrowStr);
    if (dueTomorrow.length > 0) {
      showBubble('⚠️ "' + dueTomorrow[0].text.substring(0, 20) + '..." vence AMANHÃ!');
      return true;
    }

    // Tarefas atrasadas
    const overdue = tasks.filter(t => !t.done && t.dueDate && t.dueDate < todayStr);
    if (overdue.length > 0) {
      showBubble('🚨 ' + overdue.length + ' tarefa(s) atrasada(s)!');
      return true;
    }

    // Produtividade do dia
    const doneToday = tasks.filter(t => t.done && t.createdAt && t.createdAt.startsWith(todayStr)).length;
    if (doneToday >= 5) {
      showBubble('🔥 ' + doneToday + ' tarefas hoje! Tá ON FIRE!');
      return true;
    }
    if (doneToday >= 3) {
      showBubble('⭐ Já fez ' + doneToday + ' hoje! Boa!');
      return true;
    }

    return false;
  }

  // === 5. HUMOR POR HORÁRIO ===
  function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    if (h >= 18 && h < 22) return 'evening';
    return 'night';
  }

  // === 6. REAÇÕES AO CLIMA ===
  function checkWeather() {
    const weatherDesc = document.getElementById('weatherDesc');
    if (!weatherDesc) return false;
    const desc = weatherDesc.textContent.toLowerCase();
    if (desc.includes('chuva') || desc.includes('rain') || desc.includes('thunder') || desc.includes('drizzle')) {
      return 'rain';
    }
    return false;
  }

  // === AVALIAÇÃO AUTOMÁTICA ===
  function evaluateState() {
    const tasks = TaskManager.getAll();
    const pending = tasks.filter(t => !t.done);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdue = pending.filter(t => t.dueDate && new Date(t.dueDate + 'T00:00:00') < today).length;

    // Pomodoro/Foco ativo
    if (document.title.includes('🍅') || document.title.includes('🎯')) {
      setState(document.title.includes('☕') ? 'coffee' : 'pomo'); return;
    }

    // Clima
    const weather = checkWeather();
    if (weather === 'rain' && currentState === 'idle') { setState('rain'); return; }

    // Gamification
    if (typeof Gamification !== 'undefined' && Gamification.getLevelInfo().streak >= 7) { setState('fire'); return; }

    // Problemas
    if (overdue >= 3) { setState('worry'); return; }
    if (pending.length === 0) { setState('sleep'); return; }
    if (pending.length > 10) { setState('run'); return; }

    // Inatividade
    if ((Date.now() - lastInteraction) / 60000 > 30) { setState('sleep'); return; }

    setState('idle');
  }

  // === EVENTOS ===
  function onTaskCompleted(priority) {
    lastInteraction = Date.now(); setState('celebrate', 3000);
    showBubble(getPhrase('celebrate'));
    if (priority === 'alta') { setTimeout(() => showEmote('💪'), 500); setTimeout(() => showEmote('🔥'), 1000); }
  }
  function onTaskDeleted() { lastInteraction = Date.now(); setState('worry', 2000); }
  function onLevelUp() {
    lastInteraction = Date.now(); setState('levelup', 5000);
    showBubble('LEVEL UP! UPGRADE! 🏆⭐');
    setTimeout(() => showEmote('⭐'), 300); setTimeout(() => showEmote('🏆'), 600); setTimeout(() => showEmote('🎉'), 900);
  }
  function onPomodoroStart() { lastInteraction = Date.now(); setState('pomo'); showBubble(getPhrase('pomo')); }
  function onPomodoroBreak() { lastInteraction = Date.now(); setState('coffee'); showBubble(getPhrase('coffee')); }
  function onPomodoroEnd() { lastInteraction = Date.now(); setState('celebrate', 3000); showBubble('Pomodoro concluído! 🍅✅'); }
  function onFocusMode() { lastInteraction = Date.now(); setState('focus'); showBubble(getPhrase('focus')); }

  // === 4. MINI GAME — Click Speed ===
  let gameActive = false;
  let gameScore = 0;
  let gameTimer = null;
  let gameTimeLeft = 10;

  function startGame() {
    const overlay = document.getElementById('mascotGameOverlay');
    if (!overlay) return;
    gameActive = true;
    gameScore = 0;
    gameTimeLeft = 10;

    document.getElementById('mgScore').textContent = '0';
    document.getElementById('mgTimer').textContent = '10s';
    document.getElementById('mgResult').textContent = '';
    document.getElementById('mgInstruction').textContent = 'Clique no alvo o máximo que puder!';

    overlay.classList.add('visible');

    gameTimer = setInterval(() => {
      gameTimeLeft--;
      document.getElementById('mgTimer').textContent = gameTimeLeft + 's';
      if (gameTimeLeft <= 0) endGame();
    }, 1000);
  }

  function endGame() {
    clearInterval(gameTimer);
    gameActive = false;
    const result = document.getElementById('mgResult');
    let msg = '';
    let xpBonus = 0;

    if (gameScore >= 50) { msg = '🏆 LENDÁRIO! ' + gameScore + ' cliques!'; xpBonus = 50; }
    else if (gameScore >= 35) { msg = '🔥 INSANO! ' + gameScore + ' cliques!'; xpBonus = 30; }
    else if (gameScore >= 20) { msg = '⭐ ÓTIMO! ' + gameScore + ' cliques!'; xpBonus = 15; }
    else if (gameScore >= 10) { msg = '👍 BOM! ' + gameScore + ' cliques!'; xpBonus = 5; }
    else { msg = '😅 ' + gameScore + ' cliques. Tente de novo!'; }

    if (xpBonus > 0 && typeof Gamification !== 'undefined') {
      Gamification.taskCompleted('baixa');
      msg += ' +' + xpBonus + ' XP!';
    }

    result.textContent = msg;
    document.getElementById('mgInstruction').textContent = 'Jogo terminado!';
    showBubble(msg);
  }

  // Game binds
  const mgTarget = document.getElementById('mgTarget');
  if (mgTarget) {
    mgTarget.addEventListener('click', () => {
      if (!gameActive) return;
      gameScore++;
      document.getElementById('mgScore').textContent = gameScore;
      mgTarget.style.transform = 'scale(0.85)';
      setTimeout(() => { mgTarget.style.transform = ''; }, 80);
      // Mover alvo aleatoriamente
      mgTarget.style.marginLeft = (Math.random() * 60 - 30) + 'px';
      mgTarget.style.marginTop = (Math.random() * 40 - 20) + 'px';
    });
  }

  const mgClose = document.getElementById('mgClose');
  if (mgClose) mgClose.addEventListener('click', () => {
    clearInterval(gameTimer);
    gameActive = false;
    document.getElementById('mascotGameOverlay').classList.remove('visible');
  });

  // === CLIQUE NO MASCOTE ===
  function onClick() {
    lastInteraction = Date.now();
    clickCount++;

    if (typeof Badges !== 'undefined') Badges.trackMascotClick();

    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 2000);

    // 10 cliques rápidos = mini game!
    if (clickCount >= 10) {
      clickCount = 0;
      startGame();
      return;
    }

    // 2 cliques = abrir chat
    if (clickCount === 2) {
      if (typeof PixelAI !== 'undefined') PixelAI.open();
      clickCount = 0;
      return;
    }

    // 4 cliques = abrir personalização
    if (clickCount === 4) {
      openConfig();
      clickCount = 0;
      return;
    }

    // Diálogo contextual (50% chance)
    if (Math.random() > 0.5 && contextualDialog()) {
      // já mostrou diálogo contextual
    } else {
      // Frase por horário ou estado
      const tod = getTimeOfDay();
      if (Math.random() > 0.7 && phrases[tod]) {
        showBubble(getPhrase(tod));
      } else {
        showBubble(getPhrase(currentState));
      }
    }

    showEmote('💬');
    const prev = currentState;
    drawWink();
    setTimeout(() => { (drawFns[prev] || drawIdle)(); }, 400);
  }

  // === 8. ARRASTAR PELA TELA ===
  let isDragging = false;
  let dragOffX = 0, dragOffY = 0;

  function initDrag() {
    if (!container) return;

    container.addEventListener('mousedown', (e) => {
      if (e.target.id === 'mascotResetPos') return;
      if (e.button !== 0) return;
      // Precisa segurar 500ms pra arrastar (evitar conflito com clique)
      const startX = e.clientX, startY = e.clientY;
      let moved = false;

      function onMove(ev) {
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        if (dx > 5 || dy > 5) {
          moved = true;
          if (!isDragging) {
            isDragging = true;
            const rect = container.getBoundingClientRect();
            dragOffX = e.clientX - rect.left;
            dragOffY = e.clientY - rect.top;
            container.classList.add('floating', 'dragging');
            container.style.left = rect.left + 'px';
            container.style.top = rect.top + 'px';
            isFloating = true;
          }
          container.style.left = (ev.clientX - dragOffX) + 'px';
          container.style.top = (ev.clientY - dragOffY) + 'px';
        }
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        container.classList.remove('dragging');
        isDragging = false;
        if (moved) {
          config.position = { x: parseInt(container.style.left), y: parseInt(container.style.top) };
          saveConfig();
        }
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Botão resetar posição
    const resetBtn = document.getElementById('mascotResetPos');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.remove('floating');
        container.style.left = '';
        container.style.top = '';
        container.style.position = '';
        isFloating = false;
        config.position = null;
        saveConfig();
      });
    }

    // Restaurar posição salva
    if (config.position) {
      container.classList.add('floating');
      container.style.left = config.position.x + 'px';
      container.style.top = config.position.y + 'px';
      isFloating = true;
    }
  }

  // === 2/7. PERSONALIZAÇÃO + NOME ===
  function openConfig() {
    const overlay = document.getElementById('mascotConfigOverlay');
    if (!overlay) return;

    // Nome
    const nameInput = document.getElementById('mcNameInput');
    if (nameInput) nameInput.value = config.name;

    // Cores
    const colorsDiv = document.getElementById('mcColors');
    if (colorsDiv) {
      colorsDiv.innerHTML = '';
      Object.keys(colorSchemes).forEach(key => {
        const btn = document.createElement('div');
        btn.className = 'mc-color-btn' + (config.colorScheme === key ? ' active' : '');
        btn.style.background = colorSchemes[key].main;
        btn.addEventListener('click', () => {
          config.colorScheme = key;
          colorsDiv.querySelectorAll('.mc-color-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          updatePreview();
        });
        colorsDiv.appendChild(btn);
      });
    }

    // Acessórios
    const accDiv = document.getElementById('mcAccessories');
    if (accDiv) {
      accDiv.innerHTML = '';
      accessories.forEach(acc => {
        const btn = document.createElement('button');
        btn.className = 'mc-acc-btn' + (config.accessory === acc.id ? ' active' : '');
        btn.textContent = acc.label;
        btn.addEventListener('click', () => {
          config.accessory = acc.id;
          accDiv.querySelectorAll('.mc-acc-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          updatePreview();
        });
        accDiv.appendChild(btn);
      });
    }

    // Evolução
    const evoDiv = document.getElementById('mcEvolution');
    if (evoDiv) {
      evoDiv.innerHTML = '';
      const currentLevel = getEvoLevel();
      evolutions.forEach(evo => {
        const stage = document.createElement('div');
        stage.className = 'mc-evo-stage';
        if (currentLevel >= evo.level) stage.classList.add('current');
        else stage.classList.add('locked');
        stage.innerHTML = '<span class="evo-icon">' + evo.icon + '</span>Nv.' + evo.level + '<br>' + evo.name;
        evoDiv.appendChild(stage);
      });
    }

    updatePreview();
    overlay.classList.add('visible');
  }

  function closeConfig() {
    const overlay = document.getElementById('mascotConfigOverlay');
    if (overlay) overlay.classList.remove('visible');
  }

  function updatePreview() {
    const previewCanvas = document.getElementById('mascotPreviewCanvas');
    if (!previewCanvas) return;
    const pctx = previewCanvas.getContext('2d');
    const origCtx = ctx;
    // Temporariamente trocar o contexto
    // Usar funções de desenho direto no preview
    pctx.clearRect(0, 0, 32, 32);

    // Desenhar no preview manualmente
    const c = colorSchemes[config.colorScheme] || colorSchemes.blue;

    // Simplesmente redesenhar o principal e copiar
    redraw();
    pctx.drawImage(canvas, 0, 0);
  }

  function savePersonalization() {
    const nameInput = document.getElementById('mcNameInput');
    if (nameInput) config.name = nameInput.value.trim() || 'PIXEL';
    if (nameLabel) nameLabel.textContent = config.name;
    saveConfig();
    redraw();
    closeConfig();
    showBubble('Personalização salva! 🎨');
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('🤖 ' + config.name, 'Personalização atualizada!', 'success', 3000);
    }
  }

  // Config binds
  const configClose = document.getElementById('mascotConfigClose');
  if (configClose) configClose.addEventListener('click', closeConfig);

  const configOverlay = document.getElementById('mascotConfigOverlay');
  if (configOverlay) configOverlay.addEventListener('click', (e) => { if (e.target === configOverlay) closeConfig(); });

  const mcSaveBtn = document.getElementById('mcSaveBtn');
  if (mcSaveBtn) mcSaveBtn.addEventListener('click', savePersonalization);

  // === INIT ===
  function init() {
    if (!canvas || !ctx) return;

    loadConfig();

    if (container) container.addEventListener('click', (e) => {
      if (isDragging) return;
      if (e.target.id === 'mascotResetPos') return;
      onClick();
    });

    drawIdle();
    startBlink();
    initDrag();

    // Avaliar estado a cada 30 segundos
    setInterval(evaluateState, 30000);

    // Diálogos contextuais a cada 10 minutos
    setInterval(() => {
      if (['idle', 'rain'].includes(currentState)) contextualDialog();
    }, 600000);

    // Frase por horário a cada 5 minutos
    setInterval(() => {
      if (['idle', 'sleep'].includes(currentState)) {
        const tod = getTimeOfDay();
        if (Math.random() > 0.5 && phrases[tod]) showBubble(getPhrase(tod));
        else showBubble(getPhrase(currentState));
      }
    }, 300000);

    // Verificar clima a cada 15 minutos
    setInterval(() => {
      if (currentState === 'idle') {
        const weather = checkWeather();
        if (weather === 'rain') setState('rain');
      }
    }, 900000);

    // Verificar inatividade longa
    const lastVisit = localStorage.getItem('fceux_mascot_lastvisit');
    const now = new Date().toISOString().slice(0, 10);
    if (lastVisit) {
      const days = Math.floor((Date.now() - new Date(lastVisit + 'T00:00:00').getTime()) / 86400000);
      if (days >= 3) { setState('sad', 5000); showBubble('Saudades! ' + days + ' dias! 😢'); }
    }
    localStorage.setItem('fceux_mascot_lastvisit', now);

    // Saudação por horário na primeira vez
    setTimeout(() => {
      const tod = getTimeOfDay();
      showBubble(getPhrase(tod));
    }, 3000);

    setTimeout(evaluateState, 2000);
  }

  return {
    init, setState, evaluateState,
    onTaskCompleted, onTaskDeleted, onLevelUp,
    onPomodoroStart, onPomodoroBreak, onPomodoroEnd, onFocusMode,
    openConfig
  };
})();