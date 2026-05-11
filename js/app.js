/**
 * app.js — Ponto de entrada
 */
(async function () {
  await TaskDB.open();
  await TaskDB.migrateFromLocalStorage();
  await TaskManager.loadAll();

  if (TaskManager.getAll().length === 0) {
    await TaskManager.seedDefaults();
    await TaskManager.loadAll();
  }

  TaskManager.render();

  const dbInfo = document.getElementById('dbInfo');
  if (dbInfo) dbInfo.textContent =
    'DB: IndexedDB | ' + TaskManager.getAll().length + ' registros';

  BootScreen.onReady(function () {
    document.getElementById('appWrapper').classList.add('visible');
    Notifications.init();
    Projects.init();
    Views.init();
    Pomodoro.init();
    Commands.init();
    MultiSelect.init();
    Weather.init();
    Workdays.init();
    Archive.init();
    MyDay.init();
    Gamification.init();
    Config.init();
    Matrix.init();
    DashBar.init();
    Mascot.init();
    Themes.init();
    Countdown.init();
    Tooltip.init();
    Favicon.init();
    Challenges.init();
    Particles.init();
    Pet.init();
    Reminders.init();
    AutoScale.init();
    Badges.init();
    Backup.init();
    Onboarding.init();
    PixelAI.init();
    DayPlan.init();
    PixelPatterns.init();

    // Auto-refresh a cada 60s pra atualizar overdue por horário
    setInterval(function() {
      TaskManager.render();
    }, 60000);
  });

  // Som de startup após boot
  if (typeof Sounds !== 'undefined') {
    setTimeout(() => Sounds.startup(), 500);
  }

  window.addEventListener('beforeunload', (e) => {
    const pending = TaskManager.getPending();
    if (pending > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(function (err) {
      console.log('[PWA] SW registration failed:', err);
    });
  }
})();