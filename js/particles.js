/**
 * particles.js — Partículas de fundo (estrelas)
 */
const Particles = (() => {
  const canvas = document.getElementById('particlesCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [];
  let animFrame = null;
  let active = false;

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((canvas.width * canvas.height) / 15000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.005
      });
    }
  }

  function draw() {
    if (!ctx || !active) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      // Pulsar opacidade
      p.pulse += p.pulseSpeed;
      const alpha = p.opacity + Math.sin(p.pulse) * 0.15;

      // Cor baseada no tema
      const bodyClass = document.body.className;
      let color;
      if (bodyClass.includes('theme-matrix')) color = '0, 255, 0';
      else if (bodyClass.includes('theme-cyberpunk')) color = '200, 100, 255';
      else if (bodyClass.includes('theme-ocean')) color = '0, 180, 255';
      else color = '100, 150, 255';

      ctx.fillStyle = 'rgba(' + color + ',' + Math.max(0, Math.min(1, alpha)) + ')';

      // Desenhar estrela
      if (p.size > 1.5) {
        // Estrela maior = brilho
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.fillStyle = 'rgba(' + color + ',' + (alpha * 0.3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      // Mover
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    // Linhas de conexão entre partículas próximas
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const bodyClass2 = document.body.className;
          let lineColor;
          if (bodyClass2.includes('theme-matrix')) lineColor = '0, 255, 0';
          else if (bodyClass2.includes('theme-cyberpunk')) lineColor = '200, 100, 255';
          else if (bodyClass2.includes('theme-ocean')) lineColor = '0, 180, 255';
          else lineColor = '100, 150, 255';

          ctx.strokeStyle = 'rgba(' + lineColor + ',' + (0.08 * (1 - dist / 100)) + ')';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    animFrame = requestAnimationFrame(draw);
  }

  function start() {
    if (active) return;
    active = true;
    resize();
    createParticles();
    draw();
  }

  function stop() {
    active = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function init() {
    if (!canvas) return;
    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
    if (typeof Config !== 'undefined' && Config.get('particles') === false) return;
    start();
  }

  return { init, start, stop };
})();