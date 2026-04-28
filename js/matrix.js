/**
 * matrix.js — Screensaver estilo Matrix
 * Ativa após 5 minutos ocioso ou pelo comando /matrix
 */
const Matrix = (() => {
  const screen = document.getElementById('matrixScreen');
  const canvas = document.getElementById('matrixCanvas');
  const ctx = canvas.getContext('2d');

  let active = false;
  let animFrame = null;
  let idleTimer = null;
  let columns = [];
  const IDLE_TIME = 5 * 60 * 1000; // 5 minutos

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function start() {
    if (active) return;
    active = true;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const colCount = Math.floor(canvas.width / fontSize);
    columns = [];
    for (let i = 0; i < colCount; i++) {
      columns[i] = Math.floor(Math.random() * -canvas.height / fontSize);
    }

    screen.classList.add('visible');
    draw(fontSize);
  }

  function draw(fontSize) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f0';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < columns.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = columns[i] * fontSize;

      // Primeiro caractere mais brilhante
      if (Math.random() > 0.98) {
        ctx.fillStyle = '#fff';
      } else if (Math.random() > 0.9) {
        ctx.fillStyle = '#0f0';
      } else {
        ctx.fillStyle = '#0a0';
      }

      ctx.fillText(char, x, y);
      ctx.fillStyle = '#0f0';

      if (y > canvas.height && Math.random() > 0.975) {
        columns[i] = 0;
      }
      columns[i]++;
    }

    animFrame = requestAnimationFrame(() => draw(fontSize));
  }

  function stop() {
    if (!active) return;
    active = false;
    screen.classList.remove('visible');
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;
    resetIdleTimer();
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      // Não ativar se tem pomodoro rodando ou música tocando
      if (typeof Pomodoro !== 'undefined' && document.title.includes('🍅')) return;
    // (música removida)
      start();
    }, IDLE_TIME);
  }

  function init() {
    // Parar ao clicar ou pressionar tecla
    screen.addEventListener('click', stop);
    document.addEventListener('keydown', (e) => {
      if (active) {
        e.preventDefault();
        stop();
        return;
      }
    });

    // Resetar timer de ociosidade com atividade
    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      document.addEventListener(evt, () => {
        if (!active) resetIdleTimer();
      });
    });

    // Resize
    window.addEventListener('resize', () => {
      if (active) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });

    resetIdleTimer();
  }

  return { init, start, stop };
})();