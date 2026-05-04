/**
 * autoscale.js — Auto-escala de prioridade
 * Tarefas média → alta quando faltam 2 dias pro vencimento
 * Tarefas baixa → média quando faltam 3 dias
 */
const AutoScale = (() => {
  const STORAGE_KEY = 'fceux_autoscale_log';
  let scaledToday = [];

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date === new Date().toISOString().slice(0, 10)) {
          scaledToday = data.ids || [];
        } else {
          scaledToday = [];
        }
      }
    } catch (e) {}
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      ids: scaledToday
    }));
  }

  async function check() {
    // Verificar se auto-escala está ativado
    if (typeof Config !== 'undefined' && !Config.get('autoScale')) return;

    const tasks = TaskManager.getAll();
    var today = new Date().toISOString().slice(0, 10);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let changed = false;

    for (const t of tasks) {
      if (t.done || !t.dueDate) continue;
      if (scaledToday.includes(t.id)) continue;

      const due = new Date(t.dueDate + 'T00:00:00');
      const daysLeft = Math.ceil((due - today) / 86400000);

      let newPriority = null;
      let reason = '';

      // Média → Alta quando faltam 2 dias ou menos
      const scaleMedia = typeof Config !== 'undefined' ? (Config.get('scaleMedia') || 2) : 2;
      const scaleBaixa = typeof Config !== 'undefined' ? (Config.get('scaleBaixa') || 3) : 3;

      // Não escalar tarefas recorrentes diárias/úteis
      if (t.recurrence === 'daily' || t.recurrence === 'weekdays') continue;

      if (t.priority === 'media' && daysLeft <= scaleMedia && daysLeft >= 0) {
        newPriority = 'alta';
        reason = 'Faltam ' + daysLeft + ' dia(s)!';
      }

      // Baixa → Média quando faltam 3 dias ou menos
      if (t.priority === 'baixa' && daysLeft <= scaleBaixa && daysLeft >= 0) {
        newPriority = 'media';
        reason = 'Faltam ' + daysLeft + ' dia(s)!';
      }

      // Qualquer → Alta quando está atrasada
      if (daysLeft < 0 && t.priority !== 'alta') {
        newPriority = 'alta';
        reason = 'Atrasada ' + Math.abs(daysLeft) + ' dia(s)!';
      }

      if (newPriority) {
        const oldPri = t.priority;
        t.priority = newPriority;
        t.autoEscalated = true;
        t.originalPriority = t.originalPriority || oldPri;
        await TaskDB.update(t);
        scaledToday.push(t.id);
        changed = true;

        if (typeof Notifications !== 'undefined') {
          Notifications.showToast(
            '🔺 AUTO-ESCALA',
            '"' + t.text.substring(0, 25) + '..." → ' + newPriority.toUpperCase() + ' (' + reason + ')',
            'warn',
            5000
          );
        }
      }
    }

    if (changed) {
      save();
      TaskManager.render();
    }
  }

  function init() {
    load();
    // Verificar ao iniciar
    setTimeout(check, 3000);
    // Verificar a cada 15 minutos
    setInterval(check, 900000);
  }

  return { init, check };
})();