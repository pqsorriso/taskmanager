/**
 * tooltip.js — Tooltip detalhado ao hover nas tarefas
 */
const Tooltip = (() => {
  let tooltipEl = null;
  let hideTimer = null;

  function create() {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'task-tooltip';
    tooltipEl.id = 'taskTooltip';
    document.body.appendChild(tooltipEl);
  }

  function show(taskId, x, y) {
    const t = TaskManager.getTaskById(taskId);
    if (!t) return;

    let html = '<div class="tt-title">' + escHtml(t.text) + '</div>';

    // Info
    html += '<div class="tt-row"><span class="tt-label">PRI:</span><span class="tt-value p-' + t.priority + '">' + t.priority.toUpperCase() + '</span></div>';

    if (t.category) html += '<div class="tt-row"><span class="tt-label">CAT:</span><span class="tt-value">' + t.category + '</span></div>';

    if (t.project && t.project !== 'Geral') html += '<div class="tt-row"><span class="tt-label">PROJ:</span><span class="tt-value">' + t.project + '</span></div>';

    if (t.dueDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const due = new Date(t.dueDate + 'T00:00:00');
      const diff = Math.ceil((due - today) / 86400000);
      let dueStr = formatDate(t.dueDate);
      if (diff === 0) dueStr += ' (HOJE)';
      else if (diff === 1) dueStr += ' (amanhã)';
      else if (diff > 1) dueStr += ' (' + diff + 'd)';
      else if (diff < 0) dueStr += ' (' + Math.abs(diff) + 'd atrás)';
      if (t.dueTime) dueStr += ' ' + t.dueTime;
      html += '<div class="tt-row"><span class="tt-label">VENCE:</span><span class="tt-value">' + dueStr + '</span></div>';
    }

    if (t.status === 'doing') html += '<div class="tt-row"><span class="tt-label">STATUS:</span><span class="tt-value" style="color:#ffaa00">⚡ FAZENDO</span></div>';

    if (t.timeSpent && t.timeSpent > 0) {
      const h = Math.floor(t.timeSpent / 3600);
      const m = Math.floor((t.timeSpent % 3600) / 60);
      const timeStr = h > 0 ? h + 'h' + String(m).padStart(2, '0') + 'min' : m + 'min';
      html += '<div class="tt-row"><span class="tt-label">TEMPO:</span><span class="tt-value">⏱ ' + timeStr + '</span></div>';
    }

    if (t.recurrence) {
      const recLabels = { daily: 'Diária', weekdays: 'Úteis', weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal' };
      html += '<div class="tt-row"><span class="tt-label">REPETE:</span><span class="tt-value">🔄 ' + (recLabels[t.recurrence] || '') + '</span></div>';
    }

    // Descrição
    if (t.description) {
      html += '<div class="tt-desc">📝 ' + escHtml(t.description) + '</div>';
    }

    // Subtarefas
    if (t.subtasks && t.subtasks.length > 0) {
      const done = t.subtasks.filter(s => s.done).length;
      html += '<div class="tt-subs"><span style="color:#006688">📋 Subtarefas (' + done + '/' + t.subtasks.length + '):</span>';
      t.subtasks.slice(0, 5).forEach(s => {
        html += '<div class="tt-sub ' + (s.done ? 'done' : '') + '">' + (s.done ? '✅' : '⬜') + ' ' + escHtml(s.text) + '</div>';
      });
      if (t.subtasks.length > 5) html += '<div class="tt-sub">... +' + (t.subtasks.length - 5) + ' mais</div>';
      html += '</div>';
    }

    // Tags
    if (t.tags && t.tags.length > 0) {
      html += '<div class="tt-tags">';
      t.tags.forEach(tag => { html += '<span class="tag">#' + escHtml(tag) + '</span>'; });
      html += '</div>';
    }

    tooltipEl.innerHTML = html;

    // Posicionar
    const maxX = window.innerWidth - 340;
    const maxY = window.innerHeight - tooltipEl.offsetHeight - 20;
    tooltipEl.style.left = Math.min(x + 15, maxX) + 'px';
    tooltipEl.style.top = Math.min(y + 10, maxY) + 'px';
    tooltipEl.classList.add('visible');
  }

  function hide() {
    if (tooltipEl) tooltipEl.classList.remove('visible');
  }

  function formatDate(d) {
    const dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0') + '/' + dt.getFullYear();
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function init() {
    create();

    document.getElementById('taskList').addEventListener('mouseover', (e) => {
      const row = e.target.closest('.task-row');
      if (!row) return;
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (typeof Config !== 'undefined' && !Config.get('tooltips')) return;
        const id = Number(row.dataset.id);
        const rect = row.getBoundingClientRect();
        show(id, rect.right, rect.top);
      }, 600);
    });

    document.getElementById('taskList').addEventListener('mouseout', (e) => {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, 200);
    });
  }

  return { init };
})();