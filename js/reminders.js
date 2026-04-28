/**
 * reminders.js — Lembretes programados
 * Verifica a cada 30 segundos se algum lembrete venceu
 */
const Reminders = (() => {
  const popup = document.getElementById('reminderPopup');
  let checkInterval = null;

  function playReminderSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [600, 800, 600, 800, 1000, 800, 600];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.06;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.12);
      });
    } catch (e) {}
  }

  function checkReminders() {
    const tasks = TaskManager.getAll();
    const now = new Date();

    tasks.forEach(t => {
      if (t.done || !t.reminders || !t.reminders.length) return;

      t.reminders.forEach((rem, i) => {
        if (rem.fired) return;

        const remTime = new Date(rem.datetime);
        if (now >= remTime) {
          // Disparar lembrete!
          rem.fired = true;
          TaskDB.update(t);

          showReminderPopup(t, rem);
          playReminderSound();

          // Notificação browser
          if (typeof Notifications !== 'undefined') {
            Notifications.showToast('⏰ LEMBRETE', t.text, 'warn', 10000);
          }

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Lembrete — FCEUX', {
              body: t.text,
              icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA'
            });
          }

          // Mascote reage
          if (typeof Mascot !== 'undefined') {
            Mascot.setState('worry', 3000);
          }
        }
      });
    });
  }

  function showReminderPopup(task, rem) {
    if (!popup) return;

    const rpTask = document.getElementById('rpTask');
    const rpTime = document.getElementById('rpTime');

    if (rpTask) rpTask.textContent = task.text;
    if (rpTime) {
      const d = new Date(rem.datetime);
      rpTime.textContent = 'Programado para: ' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ' — ' +
        String(d.getDate()).padStart(2, '0') + '/' +
        String(d.getMonth() + 1).padStart(2, '0');
    }

    popup.classList.add('visible');
  }

  // Dismiss
  const rpDismiss = document.getElementById('rpDismiss');
  if (rpDismiss) {
    rpDismiss.addEventListener('click', () => {
      popup.classList.remove('visible');
    });
  }

  function init() {
    // Verificar a cada 30 segundos
    checkInterval = setInterval(checkReminders, 30000);
    // Verificar imediatamente
    setTimeout(checkReminders, 5000);
  }

  return { init };
})();