/**
 * tasks.js — CRUD, render, filtros, busca, agrupamento, favoritos, duplicar, confetti
 * Depende de: db.js
 */
const TaskManager = (() => {
  let tasks = [];
  let currentFilter = 'all';
  let selectedId = null;
  let searchQuery = '';
  let currentSort = 'priority';
  let currentProject = 'all';
  let currentGroup = 'none';
  let undoStack = [];
  let undoTimeout = null;
  let saveTimer = null;

  const taskInput = document.getElementById('taskInput');
  const priSel = document.getElementById('priSel');
  const taskList = document.getElementById('taskList');
  const descInput = document.getElementById('descInput');
  const dueInput = document.getElementById('dueInput');
  const catSel = document.getElementById('catSel');
  const searchInput = document.getElementById('searchInput');

  // === HELPERS ===
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function getPending() { return tasks.filter(t => !t.done).length; }
  function getAll() { return tasks; }

  function fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' +
           String(dt.getMonth() + 1).padStart(2, '0') + '/' +
           dt.getFullYear();
  }

  function dueStatus(dueDate, dueTime) {
    if (!dueDate) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');

    // Se hoje NÃO é dia de trabalho, não marcar como atrasada
      if (typeof Workdays !== 'undefined' && typeof Workdays.isTodayWorkday === 'function' && !Workdays.isTodayWorkday()) {
      if (due.getTime() === today.getTime()) return 'today';
      if (due < today) {
      if (typeof Workdays.isWorkday === 'function' && !Workdays.isWorkday(dueDate)) return '';
      }
    }

    if (due < today) return 'overdue';
    if (due.getTime() === today.getTime()) {
      if (dueTime) {
        const now = new Date();
        const [h, m] = dueTime.split(':').map(Number);
        const dueDateTime = new Date();
        dueDateTime.setHours(h, m, 0, 0);
        const diffMin = (dueDateTime - now) / 60000;
        if (diffMin < 0) return 'overdue';
        if (diffMin <= 60) return 'urgent';
      }
      return 'today';
    }
    return '';
  }

  function showSaved() {
    const el = document.getElementById('saveIndicator');
    if (!el) return;
    el.classList.add('visible');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => el.classList.remove('visible'), 1500);
  }

  // === CONFETTI ===
  function showConfetti() {
    if (typeof Config !== 'undefined' && !Config.get('confetti')) return;
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#ff4444', '#ffff00', '#00cc66', '#00aaff', '#ff88ff', '#ffaa00'];
    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = (Math.random() * 30) + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 2500);
  }

  // === RENDER ===
  function render() {
    let filtered = tasks.filter(t => {
      if (currentFilter === 'pending') return !t.done;
      if (currentFilter === 'completed') return t.done;
      if (['alta', 'media', 'baixa'].includes(currentFilter)) return t.priority === currentFilter;
      return true;
    });

    // Filtro de projeto
    if (currentProject !== 'all') {
      filtered = filtered.filter(t => (t.project || 'Geral') === currentProject);
    }

    // Filtro de busca
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.text.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }

    // Ordenação
    const po = { alta: 0, media: 1, baixa: 2 };
    filtered.sort((a, b) => {
      // Pinados primeiro
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (a.done !== b.done) return a.done ? 1 : -1;

      switch (currentSort) {
        case 'priority':
          return po[a.priority] - po[b.priority];
        case 'due_asc':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        case 'due_desc':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return b.dueDate.localeCompare(a.dueDate);
        case 'created_asc':
          return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'created_desc':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'alpha':
          return a.text.localeCompare(b.text);
        default:
          return po[a.priority] - po[b.priority];
      }
    });

    taskList.innerHTML = '';

    if (!filtered.length) {
      taskList.innerHTML = '<div class="empty-state"><div class="big">-- VAZIO --</div>NENHUMA TAREFA ENCONTRADA</div>';
      updateStats();
    if (typeof DashBar !== 'undefined') DashBar.update();
      return;
    }

    // Agrupamento
    if (currentGroup !== 'none') {
      renderGrouped(filtered);
      return;
    }

    filtered.forEach((t, i) => {
      renderTaskRow(t, i, taskList);
    });

    // Bind checkboxes
    document.querySelectorAll('.task-check').forEach(c => {
      c.addEventListener('click', () => {
        c.classList.add('just-checked');
        setTimeout(() => c.classList.remove('just-checked'), 300);
        toggleTask(Number(c.dataset.id));
      });
    });

    // Bind delete
    document.querySelectorAll('.task-del').forEach(d => {
      d.addEventListener('click', () => deleteTask(Number(d.dataset.id), d.closest('.task-row')));
    });

    // Bind pin/star
    document.querySelectorAll('.task-star').forEach(s => {
      s.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = Number(s.dataset.id);
        const t = tasks.find(x => x.id === id);
        if (!t) return;
        t.pinned = !t.pinned;
        await TaskDB.update(t);
        render();
        showSaved();
      });
    });

    // Bind subtask expand checkboxes
    document.querySelectorAll('.subtask-expand-item').forEach(item => {
      item.addEventListener('click', async () => {
        const taskId = Number(item.dataset.taskId);
        const subIdx = Number(item.dataset.subIdx);
        const task = tasks.find(x => x.id === taskId);
        if (!task || !task.subtasks || !task.subtasks[subIdx]) return;

        task.subtasks[subIdx].done = !task.subtasks[subIdx].done;
        await TaskDB.update(task);

        const check = item.querySelector('.se-check');
        if (check) {
          check.classList.add('just-checked');
          setTimeout(() => check.classList.remove('just-checked'), 300);
        }

        const allDone = task.subtasks.every(s => s.done);
        if (allDone && !task.done) {
          if (typeof Notifications !== 'undefined') {
            Notifications.showToast('📋 SUBTAREFAS', 'Todas concluídas! Completar "' + task.text + '"?', 'success', 5000);
          }
        }

        showSaved();
        render();
      });
    });

    // Drag & Drop
    initDragDrop();

    updateStats();
  }

  // === RENDER TASK ROW (reutilizável) ===
  function renderTaskRow(t, i, container) {
    const row = document.createElement('div');
    row.className = 'task-row' + (t.done ? ' completed' : '') + (t.id === selectedId ? ' selected' : '') + (t.pinned ? ' pinned-row' : '');
    row.style.animationDelay = i * 0.03 + 's';
    row.dataset.id = t.id;

    const ds = t.done ? '' : dueStatus(t.dueDate, t.dueTime);
    const dc = ds ? ' ' + ds : '';
    let dd = t.dueDate ? fmtDate(t.dueDate) : '—';
    if (t.dueTime) dd += ' ' + t.dueTime;

    // Contador de dias restantes
    if (t.dueDate && !t.done) {
      const todayD = new Date();
      todayD.setHours(0, 0, 0, 0);
      const dueD = new Date(t.dueDate + 'T00:00:00');
      const diffDays = Math.ceil((dueD - todayD) / 86400000);
      if (diffDays === 0) dd += ' (hoje)';
      else if (diffDays === 1) dd += ' (amanhã)';
      else if (diffDays > 1 && diffDays <= 7) dd += ' (' + diffDays + 'd)';
      else if (diffDays < 0) dd += ' (' + Math.abs(diffDays) + 'd atrás)';
    }

    const cat = t.category ? t.category.toUpperCase().substring(0, 6) : '—';

    row.innerHTML =
      '<div class="drag-handle" draggable="true">⠿</div>' +
      '<div class="task-star' + (t.pinned ? ' pinned' : '') + '" data-id="' + t.id + '">' + (t.pinned ? '★' : '☆') + '</div>' +
      '<div class="task-check' + (t.done ? ' checked' : '') + '" data-id="' + t.id + '">' + (t.done ? '[X]' : '[ ]') + '</div>' +
      '<div class="task-text-cell">' + esc(t.text) + '</div>' +
      '<div class="task-cat-cell">' + esc(cat) + '</div>' +
      '<div class="task-priority-cell p-' + t.priority + '">' + t.priority.toUpperCase() + '</div>' +
      '<div class="task-due-cell' + dc + '">' + dd + '</div>' +
      '<div class="task-date-cell">' + t.date + '</div>' +
      '<div class="task-del" data-id="' + t.id + '">[DEL]</div>';

    // Click to select
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('task-check') || e.target.classList.contains('task-del') || e.target.classList.contains('drag-handle') || e.target.classList.contains('task-star')) return;
      if (e.shiftKey) return;
      selectedId = t.id;
      document.querySelectorAll('.task-row').forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      document.getElementById('selInfo').textContent = '> ' + t.text;

      // Expandir descrição e subtarefas
      document.querySelectorAll('.task-desc-row').forEach(d => d.classList.remove('visible'));
      document.querySelectorAll('.subtask-expand').forEach(d => d.classList.remove('visible'));

      if (t.description) {
        const dr = row.nextElementSibling;
        if (dr && dr.classList.contains('task-desc-row')) dr.classList.add('visible');
      }

      const stExpand = document.querySelector('.subtask-expand[data-task-id="' + t.id + '"]');
      if (stExpand) stExpand.classList.add('visible');
    });

    // Double-click to edit
    row.addEventListener('dblclick', () => TaskUI.openEdit(t.id));
    container.appendChild(row);

    // === BADGES ===

    // Subtask progress
    if (t.subtasks && t.subtasks.length > 0) {
      const stDone = t.subtasks.filter(s => s.done).length;
      const stTotal = t.subtasks.length;
      const stPct = Math.round((stDone / stTotal) * 100);
      const textCell = row.querySelector('.task-text-cell');
      if (textCell) {
        const prog = document.createElement('div');
        prog.className = 'subtask-progress';
        prog.innerHTML =
          '<div class="subtask-bar"><div class="subtask-bar-fill" style="width:' + stPct + '%"></div></div>' +
          '<span class="subtask-count">' + stDone + '/' + stTotal + '</span>';
        textCell.appendChild(prog);
      }
    }

    // Tags
    if (t.tags && t.tags.length > 0) {
      const textCell2 = row.querySelector('.task-text-cell');
      if (textCell2) {
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-container';
        t.tags.forEach(tag => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = '#' + tag;
          tagDiv.appendChild(span);
        });
        textCell2.appendChild(tagDiv);
      }
    }

    // Recurrence badge
    if (t.recurrence) {
      const recLabels = {
        daily: '🔄 Diária',
        weekdays: '🔄 Úteis',
        weekly: '🔄 Semanal',
        biweekly: '🔄 Quinzenal',
        monthly: '🔄 Mensal'
      };
      const textCell3 = row.querySelector('.task-text-cell');
      if (textCell3) {
        const badge = document.createElement('span');
        badge.className = 'task-recurrence-badge';
        badge.textContent = recLabels[t.recurrence] || '';
        textCell3.appendChild(badge);
      }
    }

    // Comments badge
    if (t.comments && t.comments.length > 0) {
      const textCell4 = row.querySelector('.task-text-cell');
      if (textCell4) {
        const cBadge = document.createElement('span');
        cBadge.className = 'comment-count-badge';
        cBadge.textContent = '💬' + t.comments.length;
        textCell4.appendChild(cBadge);
      }
    }

    // Attachments badge
    if (t.attachments && t.attachments.length > 0) {
      const textCell5 = row.querySelector('.task-text-cell');
      if (textCell5) {
        const aBadge = document.createElement('span');
        aBadge.className = 'attachment-count-badge';
        aBadge.textContent = '📎' + t.attachments.length;
        textCell5.appendChild(aBadge);
      }
    }

    // Status "Fazendo" badge
    if (t.status === 'doing' && !t.done) {
      const textCell6 = row.querySelector('.task-text-cell');
      if (textCell6) {
        const sBadge = document.createElement('span');
        sBadge.className = 'status-doing-badge';
        sBadge.textContent = '⚡ FAZENDO';
        textCell6.appendChild(sBadge);
      }
    }

    // Dependency badges
    if (t.dependencies && t.dependencies.length > 0 && !t.done) {
      const allDepsDone = t.dependencies.every(depId => {
        const dep = tasks.find(x => x.id === depId);
        return dep && dep.done;
      });

      if (!allDepsDone) {
        row.classList.add('blocked-task');
        const textCell7 = row.querySelector('.task-text-cell');
        if (textCell7) {
          const dBadge = document.createElement('span');
          dBadge.className = 'dep-badge blocked';
          dBadge.textContent = '🔒 BLOQUEADA';
          textCell7.appendChild(dBadge);
        }
      }
    }

    // Time tracking badge
    if (t.timeSpent && t.timeSpent > 0) {
    // Estimate badge
      if (t.estimate && t.estimate > 0) {
        const textCellEst = row.querySelector('.task-text-cell');
        if (textCellEst) {
          const estH = Math.floor(t.estimate / 60);
          const estM = t.estimate % 60;
          const estStr = estH > 0 ? estH + 'h' + (estM > 0 ? estM + 'm' : '') : estM + 'min';
          const estBadge = document.createElement('span');
          estBadge.className = 'estimate-badge';
          estBadge.textContent = '📏 ' + estStr;

          // Eficiência se tem tempo gasto
          if (t.timeSpent && t.timeSpent > 0 && t.done) {
            const realMin = Math.floor(t.timeSpent / 60);
            const pct = Math.round((t.estimate / Math.max(realMin, 1)) * 100);
            const effBadge = document.createElement('span');
            if (pct >= 120) { effBadge.className = 'efficiency-badge great'; effBadge.textContent = '⚡ ' + pct + '%'; }
            else if (pct >= 80) { effBadge.className = 'efficiency-badge good'; effBadge.textContent = '✅ ' + pct + '%'; }
            else if (pct >= 50) { effBadge.className = 'efficiency-badge slow'; effBadge.textContent = '🐢 ' + pct + '%'; }
            else { effBadge.className = 'efficiency-badge over'; effBadge.textContent = '⏰ ' + pct + '%'; }
            textCellEst.appendChild(effBadge);
          }

          textCellEst.appendChild(estBadge);
        }
      }

      // Reminder badge
      if (t.reminders && t.reminders.length > 0) {
        const activeReminders = t.reminders.filter(r => !r.fired).length;
        if (activeReminders > 0) {
          const textCellRem = row.querySelector('.task-text-cell');
          if (textCellRem) {
            const remBadge = document.createElement('span');
            remBadge.className = 'reminder-badge';
            remBadge.textContent = '⏰ ' + activeReminders;
            textCellRem.appendChild(remBadge);
          }
        }
      }

      // Auto-escalated badge
      if (t.autoEscalated) {
        const textCellEsc = row.querySelector('.task-text-cell');
        if (textCellEsc) {
          const escBadge = document.createElement('span');
          escBadge.className = 'escalate-badge';
          escBadge.textContent = '🔺 auto';
          escBadge.title = 'Prioridade escalou automaticamente (era ' + (t.originalPriority || '?') + ')';
          textCellEsc.appendChild(escBadge);
        }
      }
      const textCellTime = row.querySelector('.task-text-cell');
      if (textCellTime) {
        const h = Math.floor(t.timeSpent / 3600);
        const m = Math.floor((t.timeSpent % 3600) / 60);
        const timeStr = h > 0 ? h + 'h' + String(m).padStart(2, '0') : m + 'min';
        const tBadge = document.createElement('span');
        tBadge.className = 'time-badge';
        tBadge.textContent = '⏱ ' + timeStr;
        textCellTime.appendChild(tBadge);
      }
    }

    // Skip badge for recurring on non-workdays
    if (t.recurrence && !t.done && t.dueDate) {
      if (typeof Workdays !== 'undefined' && !Workdays.isWorkday(t.dueDate)) {
        const textCellSkip = row.querySelector('.task-text-cell');
        if (textCellSkip) {
          const skipBadge = document.createElement('span');
          skipBadge.className = 'skip-badge';
          skipBadge.textContent = '📆 Dia não-útil';
          textCellSkip.appendChild(skipBadge);
        }
      }
    }

    // Description row
    if (t.description) {
      const dr = document.createElement('div');
      dr.className = 'task-desc-row';
      dr.textContent = '📝 ' + t.description;
      container.appendChild(dr);
    }

    // Subtask expand row
    if (t.subtasks && t.subtasks.length > 0) {
      const stRow = document.createElement('div');
      stRow.className = 'subtask-expand';
      stRow.dataset.taskId = t.id;

      const stDoneCount = t.subtasks.filter(s => s.done).length;
      const stTotalCount = t.subtasks.length;

      let stHtml = '<div class="subtask-expand-header">' +
        '<span>📋 Subtarefas</span>' +
        '<span class="se-progress">' + stDoneCount + '/' + stTotalCount + ' concluídas</span>' +
        '</div>';

      t.subtasks.forEach((st, si) => {
        const connector = si === t.subtasks.length - 1 ? '└──' : '├──';
        stHtml += '<div class="subtask-expand-item" data-task-id="' + t.id + '" data-sub-idx="' + si + '">' +
          '<span class="se-line">' + connector + '</span>' +
          '<span class="se-check ' + (st.done ? 'done' : '') + '">' + (st.done ? '[X]' : '[ ]') + '</span>' +
          '<span class="se-text ' + (st.done ? 'done' : '') + '">' + esc(st.text) + '</span>' +
          '</div>';
      });

      stRow.innerHTML = stHtml;
      container.appendChild(stRow);
    }
  }

  // === RENDER GROUPED ===
  function renderGrouped(filtered) {
    const groups = {};

    filtered.forEach(t => {
      let key;
      switch (currentGroup) {
        case 'priority':
          key = t.priority.toUpperCase();
          break;
        case 'category':
          key = t.category ? t.category.toUpperCase() : 'SEM CATEGORIA';
          break;
        case 'project':
          key = t.project || 'Geral';
          break;
        case 'status':
          if (t.done) key = '✅ CONCLUÍDA';
          else if (t.status === 'doing') key = '⚡ FAZENDO';
          else key = '📋 A FAZER';
          break;
        case 'due':
          if (!t.dueDate) key = '📅 SEM DATA';
          else {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const due = new Date(t.dueDate + 'T00:00:00');
            if (due < today) key = '🔴 ATRASADA';
            else if (due.getTime() === today.getTime()) key = '🟡 HOJE';
            else {
              const diff = Math.ceil((due - today) / 86400000);
              if (diff <= 7) key = '🟢 ESTA SEMANA';
              else if (diff <= 30) key = '🔵 ESTE MÊS';
              else key = '⚪ FUTURO';
            }
          }
          break;
        default:
          key = 'OUTROS';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    taskList.innerHTML = '';

    Object.keys(groups).forEach(key => {
      const items = groups[key];

      const header = document.createElement('div');
      header.className = 'group-header';
      header.innerHTML =
        '<span>' + key + '</span>' +
        '<span>' +
          '<span class="gh-count">' + items.length + ' tarefa(s)</span> ' +
          '<span class="gh-toggle">▼</span>' +
        '</span>';

      const groupContainer = document.createElement('div');
      groupContainer.className = 'group-container';

      header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        groupContainer.style.display = header.classList.contains('collapsed') ? 'none' : '';
      });

      taskList.appendChild(header);
      taskList.appendChild(groupContainer);

      items.forEach((t, i) => {
        renderTaskRow(t, i, groupContainer);
      });
    });

    // Bind checkboxes
    document.querySelectorAll('.task-check').forEach(c => {
      c.addEventListener('click', () => {
        c.classList.add('just-checked');
        setTimeout(() => c.classList.remove('just-checked'), 300);
        toggleTask(Number(c.dataset.id));
      });
    });

    // Bind delete
    document.querySelectorAll('.task-del').forEach(d => {
      d.addEventListener('click', () => deleteTask(Number(d.dataset.id), d.closest('.task-row')));
    });

    // Bind pin/star
    document.querySelectorAll('.task-star').forEach(s => {
      s.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = Number(s.dataset.id);
        const t = tasks.find(x => x.id === id);
        if (!t) return;
        t.pinned = !t.pinned;
        await TaskDB.update(t);
        render();
        showSaved();
      });
    });

    // Bind subtask expand checkboxes
    document.querySelectorAll('.subtask-expand-item').forEach(item => {
      item.addEventListener('click', async () => {
        const taskId = Number(item.dataset.taskId);
        const subIdx = Number(item.dataset.subIdx);
        const task = tasks.find(x => x.id === taskId);
        if (!task || !task.subtasks || !task.subtasks[subIdx]) return;
        task.subtasks[subIdx].done = !task.subtasks[subIdx].done;
        await TaskDB.update(task);
        showSaved();
        render();
      });
    });

    updateStats();
  }

  function updateStats() {
    document.getElementById('sTotal').textContent = tasks.length;
    document.getElementById('sPend').textContent = getPending();
    document.getElementById('sDone').textContent = tasks.filter(t => t.done).length;
  }

  // === ADD TASK ===
  async function addTask() {
    let text = taskInput.value.trim();
    if (!text) { taskInput.focus(); return; }

  // Linguagem natural
    let nlResult = null;
    if (typeof NaturalLanguage !== 'undefined') {
      nlResult = NaturalLanguage.parse(text);
      if (nlResult.detected.length > 0) {
        text = nlResult.text || text;
      }
    }
    const now = new Date();
    const date = String(now.getDate()).padStart(2, '0') + '/' +
                 String(now.getMonth() + 1).padStart(2, '0') + '/' +
                 now.getFullYear();
    const task = {
      text: text,
      priority: (nlResult && nlResult.priority) || priSel.value,
      done: false,
      date: date,
      description: descInput ? descInput.value.trim() : '',
      dueDate: (nlResult && nlResult.dueDate) || (dueInput ? dueInput.value : ''),
      dueTime: (nlResult && nlResult.dueTime) || (document.getElementById('dueTimeInput') ? document.getElementById('dueTimeInput').value : ''),
      category: (nlResult && nlResult.category) || (catSel ? catSel.value : ''),
      createdAt: now.toISOString(),
      subtasks: [],
      tags: [],
      project: document.getElementById('projSel') ? (document.getElementById('projSel').value || 'Geral') : 'Geral',
      recurrence: document.getElementById('recurrenceSel') ? document.getElementById('recurrenceSel').value : '',
      comments: [],
      attachments: [],
      status: 'todo',
      dependencies: [],
      timeSpent: 0,
      pinned: false,
      estimate: (nlResult && nlResult.estimate) || 0,
      reminders: [],
      autoEscalated: false,
      originalPriority: ''
    };
    const id = await TaskDB.add(task);
    task.id = id;
    tasks.unshift(task);

    // Clear inputs
    taskInput.value = '';
    if (descInput) descInput.value = '';
    if (dueInput) dueInput.value = '';
    if (catSel) catSel.value = '';
    const dueTimeInput = document.getElementById('dueTimeInput');
    if (dueTimeInput) dueTimeInput.value = '';
    const recSel = document.getElementById('recurrenceSel');
    if (recSel) recSel.value = '';
    const projSel = document.getElementById('projSel');
    if (projSel) projSel.value = '';
    taskInput.focus();
    if (typeof NaturalLanguage !== 'undefined') NaturalLanguage.hidePreview();

    render();
    taskList.scrollTo({ top: 0, behavior: 'smooth' });
    showSaved();
    if (typeof Projects !== 'undefined') Projects.renderBar();
  }

  // === TOGGLE TASK ===
  async function toggleTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    // Check dependencies before completing
    if (!t.done && t.dependencies && t.dependencies.length > 0) {
      const allDepsDone = t.dependencies.every(depId => {
        const dep = tasks.find(x => x.id === depId);
        return dep && dep.done;
      });
      if (!allDepsDone) {
        if (typeof Notifications !== 'undefined') {
          Notifications.showToast('🔒 BLOQUEADA', 'Complete as dependências primeiro!', 'danger', 3000);
        }
        return;
      }
    }

    t.done = !t.done;
    if (t.done) {
      t.completedAt = new Date().toISOString();
      // Verificar se foi concluída em atraso
      if (t.dueDate) {
        var now = new Date();
        var todayStr = now.toISOString().slice(0, 10);
        var wasLate = false;
        if (t.dueDate < todayStr) {
          wasLate = true;
        } else if (t.dueDate === todayStr && t.dueTime) {
          var parts = t.dueTime.split(':');
          var dueDateTime = new Date();
          dueDateTime.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
          if (now > dueDateTime) wasLate = true;
        }
        t.completedLate = wasLate;
      } else {
        t.completedLate = false;
      }
    } else {
      t.completedAt = '';
      t.completedLate = false;
    }
    await TaskDB.update(t);

    // Gamification XP
    if (t.done && typeof Gamification !== 'undefined') {
      Gamification.taskCompleted(t.priority);
    }

    // Animação + confetti
    if (t.done) {
      showConfetti();
      // Animação na row
      var row = document.querySelector('.task-row[data-id="' + id + '"]') || document.querySelector('.task-check[data-id="' + id + '"]');
      if (row) {
        var taskRow = row.closest('.task-row');
        if (taskRow) {
          taskRow.classList.add('completing');
          // Sparkles
          var sparkles = ['✨', '⭐', '💪', '✅', '🎉'];
          for (var s = 0; s < 3; s++) {
            var spark = document.createElement('div');
            spark.className = 'task-complete-sparkle';
            spark.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            spark.style.left = (Math.random() * 80 + 10) + '%';
            spark.style.top = '0';
            spark.style.animationDelay = (s * 0.15) + 's';
            taskRow.style.position = 'relative';
            taskRow.appendChild(spark);
            setTimeout(function() { spark.remove(); }, 1200);
          }
          setTimeout(function() { taskRow.classList.remove('completing'); }, 700);
        }
      }
    }
    if (t.done && typeof Sounds !== 'undefined') Sounds.complete();

    // Mascote reage
    if (t.done && typeof Mascot !== 'undefined') {
      Mascot.onTaskCompleted(t.priority);
    }

    if (t.done && typeof Pet !== 'undefined') {
      Pet.onTaskCompleted();
    }

    // Se completou e tem recorrência, criar próxima
    if (t.done && t.recurrence) {
      let baseDue = t.dueDate;
      if (!baseDue) {
        const today = new Date();
        baseDue = today.getFullYear() + '-' +
                  String(today.getMonth() + 1).padStart(2, '0') + '-' +
                  String(today.getDate()).padStart(2, '0');
      }

      const nextDue = calcNextDate(baseDue, t.recurrence);
      if (nextDue) {
        const now = new Date();
        const date = String(now.getDate()).padStart(2, '0') + '/' +
                     String(now.getMonth() + 1).padStart(2, '0') + '/' +
                     now.getFullYear();

        const newTask = {
          text: t.text,
          priority: t.originalPriority || t.priority,
          done: false,
          date: date,
          description: t.description || '',
          dueDate: nextDue,
          dueTime: t.dueTime || '',
          category: t.category || '',
          createdAt: now.toISOString(),
          subtasks: t.subtasks ? t.subtasks.map(s => ({ text: s.text, done: false })) : [],
          tags: t.tags ? t.tags.slice() : [],
          recurrence: t.recurrence,
          project: t.project || 'Geral',
          comments: [],
          attachments: t.attachments || [],
          status: 'todo',
          dependencies: [],
          timeSpent: 0,
          pinned: false,
          autoEscalated: false,
          originalPriority: '',
        };

        const newId = await TaskDB.add(newTask);
        newTask.id = newId;
        tasks.unshift(newTask);

        if (typeof Notifications !== 'undefined') {
          Notifications.showToast(
            '🔄 RECORRENTE',
            '"' + t.text + '" reagendada para ' + fmtDate(nextDue),
            'info',
            4000
          );
        }

        if (typeof Projects !== 'undefined') Projects.renderBar();
      }
    }

    render();
    showSaved();
    if (typeof Badges !== 'undefined') Badges.check();
    if (typeof Views !== 'undefined') Views.refresh();
    if (typeof MyDay !== 'undefined') MyDay.renderBar();
  }

  // === CALC NEXT DATE (recurrence) ===
  function calcNextDate(currentDue, recurrence) {
    let base;
    if (currentDue) {
      base = new Date(currentDue + 'T00:00:00');
    } else {
      base = new Date();
    }

    switch (recurrence) {
      case 'daily':
        base.setDate(base.getDate() + 1);
        if (typeof Workdays !== 'undefined') {
          let safety = 0;
          while (!Workdays.isWorkday(base) && safety < 10) {
            base.setDate(base.getDate() + 1);
            safety++;
          }
        }
        break;
      case 'weekdays':
        do {
          base.setDate(base.getDate() + 1);
        } while (base.getDay() === 0 || base.getDay() === 6);
        if (typeof Workdays !== 'undefined') {
          let safety = 0;
          while (!Workdays.isWorkday(base) && safety < 10) {
            base.setDate(base.getDate() + 1);
            safety++;
          }
        }
        break;
      case 'weekly':
        base.setDate(base.getDate() + 7);
        break;
      case 'biweekly':
        base.setDate(base.getDate() + 14);
        break;
      case 'monthly':
        base.setMonth(base.getMonth() + 1);
        break;
      default:
        return null;
    }

    return base.getFullYear() + '-' +
           String(base.getMonth() + 1).padStart(2, '0') + '-' +
           String(base.getDate()).padStart(2, '0');
  }

  // === DELETE TASK ===
  async function deleteTask(id, el) {
    const task = tasks.find(x => x.id === id);
    if (!task) return;

    const backup = JSON.parse(JSON.stringify(task));

    // Salvar na lixeira
    if (typeof Archive !== 'undefined') Archive.trashTask(task);

    el.style.animation = 'row-out 0.25s ease forwards';
    setTimeout(async () => {
      await TaskDB.remove(id);
      tasks = tasks.filter(x => x.id !== id);
      if (selectedId === id) {
        selectedId = null;
        document.getElementById('selInfo').textContent = 'Nenhuma tarefa selecionada';
      }
      render();
      showSaved();
      showUndo(backup);
      if (typeof Sounds !== 'undefined') Sounds.deleteSound();
      if (typeof Mascot !== 'undefined') Mascot.onTaskDeleted();
      if (typeof Projects !== 'undefined') Projects.renderBar();
    }, 240);
  }

  // === SAVE EDIT ===
  async function saveEdit(id, data) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    Object.assign(t, data);
    await TaskDB.update(t);
    render();
    showSaved();
    if (typeof Sounds !== 'undefined') Sounds.addTask();
    if (typeof Projects !== 'undefined') Projects.renderBar();
  }

  // === DUPLICATE TASK ===
  async function duplicateTask(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;

    const now = new Date();
    const date = String(now.getDate()).padStart(2, '0') + '/' +
                 String(now.getMonth() + 1).padStart(2, '0') + '/' +
                 now.getFullYear();

    const copy = {
      text: t.text + ' (cópia)',
      priority: t.priority,
      done: false,
      date: date,
      description: t.description || '',
      dueDate: t.dueDate || '',
      dueTime: t.dueTime || '',
      category: t.category || '',
      createdAt: now.toISOString(),
      subtasks: t.subtasks ? t.subtasks.map(s => ({ text: s.text, done: false })) : [],
      tags: t.tags ? t.tags.slice() : [],
      project: t.project || 'Geral',
      recurrence: t.recurrence || '',
      comments: [],
      attachments: [],
      status: 'todo',
      dependencies: [],
      timeSpent: 0,
      pinned: false
    };

    const newId = await TaskDB.add(copy);
    copy.id = newId;
    tasks.unshift(copy);
    render();
    showSaved();

    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📋 DUPLICADA', '"' + t.text + '" copiada!', 'success', 3000);
    }
    if (typeof Projects !== 'undefined') Projects.renderBar();
  }

  // === FILTERS & SEARCH ===
  function setFilter(f) { currentFilter = f; render(); }
  function setSearch(q) { searchQuery = q; render(); }
  function setSort(s) { currentSort = s; render(); }
  function setProject(p) { currentProject = p; render(); }
  function setGroup(g) { currentGroup = g; render(); }

  // === CLEAR DONE ===
  async function clearDone() {
    const done = tasks.filter(t => t.done);
    if (!done.length) return;
    if (!confirm('Excluir ' + done.length + ' tarefas concluídas?')) return;

    // Arquivar concluídas
    if (typeof Archive !== 'undefined') {
      for (const t of done) Archive.archiveTask(t);
    }

    for (const t of done) await TaskDB.remove(t.id);
    tasks = tasks.filter(t => !t.done);
    render();
    showSaved();
    if (typeof Projects !== 'undefined') Projects.renderBar();
  }

  // === LOAD ===
  async function loadAll() { tasks = await TaskDB.getAll(); }

  // === SEED DEFAULTS ===
  async function seedDefaults() {
    const now = new Date();
    const today = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
    const todayISO = now.toISOString();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);

    function makeTask(text, priority, opts) {
      return Object.assign({
        text: text,
        priority: priority,
        done: false,
        date: today,
        description: '',
        dueDate: '',
        dueTime: '',
        category: '',
        createdAt: todayISO,
        subtasks: [],
        tags: [],
        project: 'Geral',
        recurrence: '',
        comments: [],
        attachments: [],
        status: 'todo',
        dependencies: [],
        timeSpent: 0,
        pinned: false,
        estimate: 0,
        reminders: [],
        autoEscalated: false,
        originalPriority: ''
      }, opts || {});
    }

    const defs = [
      makeTask('👋 Bem-vindo ao FCEUX Task Manager!', 'alta', {
        pinned: true,
        description: 'Este é seu gerenciador de tarefas com 115+ features! Explore os botões da toolbar, teste o Pomodoro 🍅, e clique no mascote PIXEL 🤖',
        subtasks: [
          { text: 'Marcar esta tarefa como concluída (Espaço)', done: false },
          { text: 'Criar uma tarefa nova no campo >> acima', done: false },
          { text: 'Abrir a paleta de comandos (tecla /)', done: false },
          { text: 'Clicar no PIXEL 2 vezes pra abrir o chat AI', done: false },
          { text: 'Abrir as configurações ⚙️', done: false }
        ],
        tags: ['tutorial', 'inicio']
      }),
      makeTask('🎯 Experimente o Modo Foco', 'media', {
        description: 'Selecione esta tarefa e clique em 🎯 FOCO na toolbar. Tela minimalista pra concentrar!',
        category: 'estudo',
        dueDate: tomorrowStr
      }),
      makeTask('🍅 Teste o Pomodoro Timer', 'media', {
        description: 'Clique em 🍅 POMO na toolbar. 25 min de foco → 5 min de pausa. A cada 4 pomos, pausa longa!',
        category: 'estudo',
        dueDate: tomorrowStr,
        estimate: 25
      }),
      makeTask('⌨️ Aprenda os atalhos do teclado', 'baixa', {
        description: 'F1 = Help | / = Comandos | Ctrl+N = Tarefa rápida | ↑↓ = Navegar | Espaço = Completar',
        category: 'estudo',
        tags: ['atalhos'],
        dueDate: nextWeekStr
      }),
      makeTask('🤖 Conheça o PIXEL, seu mascote!', 'baixa', {
        description: '1 clique = frase | 2 cliques = abrir PIXEL AI Chat! Converse com ele, peça sugestões, motivação e até piadas! 🤖💬',
        category: 'pessoal',
        tags: ['mascote', 'diversão']
      }),
      makeTask('📋 Tente a linguagem natural', 'media', {
        description: 'No campo >> digite: "estudar react amanhã 14h alta estudo" — o app detecta data, hora, prioridade e categoria automaticamente!',
        category: 'estudo',
        dueDate: tomorrowStr,
        estimate: 10
      })
    ];

    for (const t of defs) await TaskDB.add(t);
  }

  // === UNDO ===
  function showUndo(backup) {
    undoStack.push(backup);
    const bar = document.getElementById('undoBar');
    const fill = document.getElementById('undoTimerFill');
    const msg = document.getElementById('undoMsg');
    msg.textContent = 'Excluída: "' + backup.text.substring(0, 30) + (backup.text.length > 30 ? '...' : '') + '"';
    bar.classList.add('visible');
    fill.style.width = '100%';

    if (undoTimeout) clearTimeout(undoTimeout);
    const start = Date.now();
    const duration = 6000;

    function tick() {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 1 - elapsed / duration);
      fill.style.width = (remaining * 100) + '%';
      if (remaining > 0) {
        requestAnimationFrame(tick);
      } else {
        hideUndo();
      }
    }
    requestAnimationFrame(tick);

    undoTimeout = setTimeout(() => {
      hideUndo();
    }, duration);
  }

  function hideUndo() {
    document.getElementById('undoBar').classList.remove('visible');
    undoStack = [];
    if (undoTimeout) { clearTimeout(undoTimeout); undoTimeout = null; }
  }

  async function performUndo() {
    if (!undoStack.length) return;
    const backup = undoStack.pop();
    delete backup.id;
    const newId = await TaskDB.add(backup);
    backup.id = newId;
    tasks.unshift(backup);
    render();
    hideUndo();
    if (typeof Sounds !== 'undefined') Sounds.undo();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('↩ DESFEITO', '"' + backup.text + '" restaurada', 'success', 3000);
    }
  }

  // === EXPORT / IMPORT ===
  function exportJSON() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fceux_tasks_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importJSON(file) {
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported)) { alert('Arquivo inválido!'); return; }
      await TaskDB.clear();
      for (const t of imported) { delete t.id; await TaskDB.add(t); }
      await loadAll();
      render();
      alert('Importação concluída! ' + tasks.length + ' tarefas.');
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  }

  // === DRAG & DROP ===
  function initDragDrop() {
    const rows = document.querySelectorAll('.task-row');
    let draggedId = null;

    rows.forEach(row => {
      const handle = row.querySelector('.drag-handle');
      if (!handle) return;

      handle.addEventListener('dragstart', (e) => {
        draggedId = Number(row.dataset.id);
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedId);
      });

      handle.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        document.querySelectorAll('.task-row').forEach(r => {
          r.classList.remove('drag-over', 'drag-over-bottom');
        });
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = row.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        document.querySelectorAll('.task-row').forEach(r => {
          r.classList.remove('drag-over', 'drag-over-bottom');
        });
        if (e.clientY < mid) {
          row.classList.add('drag-over');
        } else {
          row.classList.add('drag-over-bottom');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over', 'drag-over-bottom');
      });

      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        const targetId = Number(row.dataset.id);
        if (draggedId === null || draggedId === targetId) return;

        const fromIdx = tasks.findIndex(t => t.id === draggedId);
        const toIdx = tasks.findIndex(t => t.id === targetId);
        if (fromIdx === -1 || toIdx === -1) return;

        const [moved] = tasks.splice(fromIdx, 1);
        const rect = row.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const insertIdx = e.clientY < mid ? toIdx : toIdx + 1;
        const adjustedIdx = fromIdx < toIdx ? insertIdx - 1 : insertIdx;
        tasks.splice(Math.max(0, adjustedIdx), 0, moved);

        for (let i = 0; i < tasks.length; i++) {
          tasks[i].sortOrder = i;
          await TaskDB.update(tasks[i]);
        }

        document.querySelectorAll('.task-row').forEach(r => {
          r.classList.remove('drag-over', 'drag-over-bottom', 'dragging');
        });

        draggedId = null;
        render();
      });
    });
  }

  // === BIND EVENTS ===
  document.getElementById('btnAdd').addEventListener('click', addTask);
  taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
  searchInput.addEventListener('input', () => setSearch(searchInput.value.trim()));

  // === MOVER TAREFA ENTRE PROJETOS ===
  async function moveToProject(taskId, project) {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    t.project = project;
    await TaskDB.update(t);
    render();
    showSaved();
    if (typeof Projects !== 'undefined') Projects.renderBar();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📂 MOVIDA', '"' + t.text + '" → ' + project, 'success', 3000);
    }
  }

  // === PUBLIC API ===
  return {
    render: render,
    addTask: addTask,
    toggleTask: toggleTask,
    deleteTask: deleteTask,
    saveEdit: saveEdit,
    duplicateTask: duplicateTask,
    setFilter: setFilter,
    setSearch: setSearch,
    setSort: setSort,
    setProject: setProject,
    setGroup: setGroup,
    clearDone: clearDone,
    loadAll: loadAll,
    seedDefaults: seedDefaults,
    exportJSON: exportJSON,
    importJSON: importJSON,
    performUndo: performUndo,
    getPending: getPending,
    getAll: getAll,
    moveToProject: moveToProject,
    getSelectedId: () => selectedId,
    getTaskById: (id) => tasks.find(t => t.id === id)
  };
})();