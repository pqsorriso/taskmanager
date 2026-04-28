/**
 * backup.js — Backup automático + tratamento de erros
 */
const Backup = (() => {
  const STORAGE_KEY = 'fceux_autobackup';
  const LAST_KEY = 'fceux_lastbackup';
  const badge = document.getElementById('backupBadge');

  function autoBackup() {
    try {
      const tasks = TaskManager.getAll();
      if (!tasks.length) return;

      const backup = {
        date: new Date().toISOString(),
        tasks: tasks,
        version: 'v2.6.6'
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
      localStorage.setItem(LAST_KEY, backup.date);

      // Badge visual
      if (badge) {
        badge.classList.add('visible');
        setTimeout(() => badge.classList.remove('visible'), 2000);
      }

      if (typeof Badges !== 'undefined') Badges.trackBackup();
    } catch (e) {
      console.warn('[Backup] Erro:', e);
    }
  }

  function restore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        alert('Nenhum backup automático encontrado.');
        return;
      }

      const backup = JSON.parse(saved);
      const date = new Date(backup.date);
      const dateStr = String(date.getDate()).padStart(2, '0') + '/' +
                      String(date.getMonth() + 1).padStart(2, '0') + '/' +
                      date.getFullYear() + ' ' +
                      String(date.getHours()).padStart(2, '0') + ':' +
                      String(date.getMinutes()).padStart(2, '0');

      if (!confirm('Restaurar backup de ' + dateStr + '?\n(' + backup.tasks.length + ' tarefas)\n\nISTO VAI SUBSTITUIR TODOS OS DADOS ATUAIS!')) return;

      TaskDB.clear().then(async () => {
        for (const t of backup.tasks) {
          delete t.id;
          await TaskDB.add(t);
        }
        await TaskManager.loadAll();
        TaskManager.render();

        if (typeof Notifications !== 'undefined') {
          Notifications.showToast('💾 RESTAURADO', 'Backup de ' + dateStr + ' restaurado!', 'success', 5000);
        }
      });
    } catch (e) {
      alert('Erro ao restaurar: ' + e.message);
    }
  }

  function getLastBackup() {
    return localStorage.getItem(LAST_KEY) || 'Nunca';
  }

  // === TRATAMENTO DE ERROS GLOBAL ===
  function initErrorHandler() {
    window.addEventListener('error', (e) => {
      console.error('[FCEUX Error]', e.message, e.filename, e.lineno);
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('⚠️ ERRO', 'Algo deu errado. O app pode estar instável.', 'danger', 5000);
      }
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('[FCEUX Promise Error]', e.reason);
    });
  }

  function init() {
    initErrorHandler();

    // Backup automático a cada 30 minutos
    setInterval(autoBackup, 30 * 60 * 1000);

    // Primeiro backup após 5 minutos
    setTimeout(autoBackup, 5 * 60 * 1000);
  }

  return { init, autoBackup, restore, getLastBackup };
})();