/**
 * eisenhower.js — Matriz de Eisenhower
 * Q1: Urgente + Importante (alta + vence em breve)
 * Q2: Importante, não urgente (alta + vence longe)
 * Q3: Urgente, não importante (média/baixa + vence em breve)
 * Q4: Nem urgente, nem importante (baixa + sem prazo)
 */
const Eisenhower = (() => {
  const overlay = document.getElementById('eisenhowerOverlay');

  function open() {
    render();
    overlay.classList.add('visible');
  }

  function close() { overlay.classList.remove('visible'); }

  function render() {
    const tasks = TaskManager.getAll().filter(t => !t.done);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q1 = [], q2 = [], q3 = [], q4 = [];

    tasks.forEach(t => {
      const isImportant = t.priority === 'alta';
      let isUrgent = false;

      if (t.dueDate) {
        const due = new Date(t.dueDate + 'T00:00:00');
        const diff = Math.ceil((due - today) / 86400000);
        isUrgent = diff <= 3;
      }

      if (isImportant && isUrgent) q1.push(t);
      else if (isImportant && !isUrgent) q2.push(t);
      else if (!isImportant && isUrgent) q3.push(t);
      else q4.push(t);
    });

    renderQuadrant('eisQ1', q1);
    renderQuadrant('eisQ2', q2);
    renderQuadrant('eisQ3', q3);
    renderQuadrant('eisQ4', q4);
  }

  function renderQuadrant(id, tasks) {
    const el = document.getElementById(id);
    // Manter título
    const title = el.querySelector('.eis-quadrant-title');
    el.innerHTML = '';
    el.appendChild(title);

    if (!tasks.length) {
      const empty = document.createElement('div');
      empty.className = 'eis-empty';
      empty.textContent = '— vazio —';
      el.appendChild(empty);
      return;
    }

    tasks.forEach(t => {
      const item = document.createElement('div');
      item.className = 'eis-task';

      let dueStr = '';
      if (t.dueDate) {
        const due = new Date(t.dueDate + 'T00:00:00');
        const today2 = new Date();
        today2.setHours(0, 0, 0, 0);
        const diff = Math.ceil((due - today2) / 86400000);
        if (diff === 0) dueStr = '(hoje)';
        else if (diff === 1) dueStr = '(amanhã)';
        else if (diff < 0) dueStr = '(' + Math.abs(diff) + 'd atrás)';
        else dueStr = '(' + diff + 'd)';
      }

      item.innerHTML = '• ' + escHtml(t.text.substring(0, 35)) +
        (dueStr ? '<span class="eis-due">' + dueStr + '</span>' : '');

      item.addEventListener('click', () => {
        close();
        TaskUI.openEdit(t.id);
      });

      el.appendChild(item);
    });
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Binds
  document.getElementById('btnEisenhower').addEventListener('click', open);
  document.getElementById('eisenhowerCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return { open, close };
})();