/**
 * favicon.js — Favicon animado durante Pomodoro
 */
const Favicon = (() => {
  const defaultIcon = document.querySelector('link[rel="icon"]');
  let originalHref = defaultIcon ? defaultIcon.href : '';
  let animInterval = null;
  let frame = 0;

  function createIcon(emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Fundo
    ctx.fillStyle = '#000060';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#00e800';
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 16, 17);

    return canvas.toDataURL();
  }

  function startPomo() {
    const icons = ['🍅', '⏰'];
    frame = 0;
    if (animInterval) clearInterval(animInterval);
    animInterval = setInterval(() => {
      frame = (frame + 1) % icons.length;
      setIcon(createIcon(icons[frame]));
    }, 1000);
  }

  function startBreak() {
    setIcon(createIcon('☕'));
    if (animInterval) clearInterval(animInterval);
  }

  function stop() {
    if (animInterval) clearInterval(animInterval);
    animInterval = null;
    restore();
  }

  function setIcon(href) {
    if (!defaultIcon) return;
    defaultIcon.href = href;
  }

  function restore() {
    if (defaultIcon) defaultIcon.href = originalHref;
  }

  function init() {
    // Monitorar título pra detectar pomodoro
    let lastTitle = '';
    setInterval(() => {
      const title = document.title;
      if (title === lastTitle) return;
      lastTitle = title;

      if (title.includes('🍅')) startPomo();
      else if (title.includes('☕')) startBreak();
      else if (!title.includes('🎯')) stop();
    }, 1000);
  }

  return { init };
})();