/**
 * matrix.js — Screensaver estilo Matrix
 * Ativa após X minutos ocioso ou pelo comando /matrix
 * Configurável: ativar/desativar + tempo de inatividade
 */
const Matrix = (() => {
  const screen = document.getElementById('matrixScreen');
  const canvas = document.getElementById('matrixCanvas');
  const ctx = canvas.getContext('2d');

  let active = false;
  let enabled = true;
  let animFrame = null;
  let idleTimer = null;
  let columns = [];
  let idleTime = 5 * 60 * 1000;

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function start() {
    if (active) return;
    active = true;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var fontSize = 14;
    var colCount = Math.floor(canvas.width / fontSize);
    columns = [];
    for (var i = 0; i < colCount; i++) {
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

    for (var i = 0; i < columns.length; i++) {
      var char = chars[Math.floor(Math.random() * chars.length)];
      var x = i * fontSize;
      var y = columns[i] * fontSize;

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

    animFrame = requestAnimationFrame(function() { draw(fontSize); });
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
    if (!enabled) return;
    idleTimer = setTimeout(function() {
      if (typeof Pomodoro !== 'undefined' && document.title.includes('🍅')) return;
      if (typeof FocusMode !== 'undefined' && document.querySelector('.focus-overlay.visible')) return;
      start();
    }, idleTime);
  }

  function enable(minutes) {
    enabled = true;
    idleTime = (minutes || 5) * 60 * 1000;
    resetIdleTimer();
  }

  function disable() {
    enabled = false;
    if (idleTimer) clearTimeout(idleTimer);
    stop();
  }

  function setIdleMinutes(minutes) {
    idleTime = Math.max(1, Math.min(60, minutes)) * 60 * 1000;
    resetIdleTimer();
  }

  function isEnabled() { return enabled; }

  function init() {
    // Carregar config
    if (typeof Config !== 'undefined') {
      var matrixEnabled = Config.get('matrix');
      if (matrixEnabled === false) {
        enabled = false;
      }
      var matrixMin = Config.get('matrixTime');
      if (matrixMin && matrixMin > 0) {
        idleTime = matrixMin * 60 * 1000;
      }
    }

    screen.addEventListener('click', stop);
    document.addEventListener('keydown', function(e) {
      if (active) {
        e.preventDefault();
        stop();
        return;
      }
    });

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(function(evt) {
      document.addEventListener(evt, function() {
        if (!active) resetIdleTimer();
      });
    });

    window.addEventListener('resize', function() {
      if (active) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });

    if (enabled) resetIdleTimer();
  }

  return {
    init: init,
    start: start,
    stop: stop,
    enable: enable,
    disable: disable,
    setIdleMinutes: setIdleMinutes,
    isEnabled: isEnabled
  };
})();
