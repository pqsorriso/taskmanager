/**
 * views.js — Kanban, Calendar (month + week), View Toggle
 * Depende de: tasks.js, ui.js
 */
const Views = (() => {
  let currentView = 'list';
  let calYear, calMonth, calWeekStart;
  let calMode = 'month';

  const taskListEl = document.getElementById('taskList');
  const kanbanEl = document.getElementById('kanbanBoard');
  const calendarEl = document.getElementById('calendarView');
  const headerRow = document.querySelector('.header-row');
  const sortBar = document.querySelector('.sort-bar');

  function init() {
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();

    // Week start = monday of current week
    calWeekStart = new Date(now);
    const day = calWeekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    calWeekStart.setDate(calWeekStart.getDate() + diff);
    calWeekStart.setHours(0, 0, 0, 0);

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setView(btn.dataset.view);
      });
    });

    // Calendar nav
    document.getElementById('calPrev').addEventListener('click', () => {
      if (calMode === 'month') {
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        renderCalendar();
      } else {
        calWeekStart.setDate(calWeekStart.getDate() - 7);
        renderWeek();
      }
    });

    document.getElementById('calNext').addEventListener('click', () => {
      if (calMode === 'month') {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCalendar();
      } else {
        calWeekStart.setDate(calWeekStart.getDate() + 7);
        renderWeek();
      }
    });

    // Calendar view toggle (month/week)
    document.getElementById('calMonthBtn').addEventListener('click', () => {
      calMode = 'month';
      document.getElementById('calMonthBtn').classList.add('active');
      document.getElementById('calWeekBtn').classList.remove('active');
      document.getElementById('calGrid').style.display = '';
      document.getElementById('calWeekGrid').style.display = 'none';
      renderCalendar();
    });

    document.getElementById('calWeekBtn').addEventListener('click', () => {
      calMode = 'week';
      document.getElementById('calWeekBtn').classList.add('active');
      document.getElementById('calMonthBtn').classList.remove('active');
      document.getElementById('calGrid').style.display = 'none';
      document.getElementById('calWeekGrid').style.display = '';
      renderWeek();
    });
  }

  function setView(view) {
    currentView = view;

    taskListEl.style.display = 'none';
    kanbanEl.classList.remove('visible');
    calendarEl.classList.remove('visible');
    headerRow.style.display = 'none';
    sortBar.style.display = 'none';

    if (view === 'list') {
      taskListEl.style.display = '';
      headerRow.style.display = '';
      sortBar.style.display = '';
      TaskManager.render();
    } else if (view === 'kanban') {
      kanbanEl.classList.add('visible');
      renderKanban();
    } else if (view === 'calendar') {
      calendarEl.classList.add('visible');
      if (calMode === 'month') renderCalendar();
      else renderWeek();
    }
  }

  function getView() { return currentView; }

  // === KANBAN ===
  function renderKanban() {
    const tasks = TaskManager.getAll();
    const todo = tasks.filter(t => !t.done && t.status !== 'doing');
    const doing = tasks.filter(t => !t.done && t.status === 'doing');
    const done = tasks.filter(t => t.done);

    renderKanbanCol('kcBodyTodo', todo, 'kcTodo');
    renderKanbanCol('kcBodyDoing', doing, 'kcDoing');
    renderKanbanCol('kcBodyDone', done, 'kcDone');

    initKanbanDrag();
  }

  function renderKanbanCol(bodyId, tasks, countId) {
    const body = document.getElementById(bodyId);
    const count = document.getElementById(countId);
    body.innerHTML = '';
    count.textContent = tasks.length;

    tasks.forEach(t => {
      const card = document.createElement('div');
      card.className = 'kanban-card kc-' + t.priority;
      card.dataset.id = t.id;
      card.draggable = true;

      let dueHtml = '';
      if (t.dueDate) {
        const ds = dueStatusKanban(t.dueDate, t.done);
        dueHtml = '<span class="kc-due ' + ds + '">' + fmtDateKanban(t.dueDate) + '</span>';
      }

      card.innerHTML =
        '<div class="kc-title">' + escHtml(t.text) + '</div>' +
        '<div class="kc-meta">' +
          '<span class="kc-pri p-' + t.priority + '">' + t.priority.toUpperCase() + '</span>' +
          dueHtml +
        '</div>';

      card.addEventListener('dblclick', () => TaskUI.openEdit(t.id));
      body.appendChild(card);
    });
  }

  function initKanbanDrag() {
    const cards = document.querySelectorAll('.kanban-card');
    const cols = document.querySelectorAll('.kanban-col-body');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    cols.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const id = Number(e.dataTransfer.getData('text/plain'));
        const colStatus = col.parentElement.dataset.status;

        if (colStatus === 'done') {
          const t = TaskManager.getTaskById(id);
          if (t && !t.done) await TaskManager.toggleTask(id);
        } else if (colStatus === 'todo') {
          await TaskManager.saveEdit(id, { status: 'todo' });
          const t = TaskManager.getTaskById(id);
          if (t && t.done) { t.done = false; await TaskDB.update(t); }
        } else if (colStatus === 'doing') {
          await TaskManager.saveEdit(id, { status: 'doing' });
          const t = TaskManager.getTaskById(id);
          if (t && t.done) { t.done = false; await TaskDB.update(t); }
        }

        renderKanban();
      });
    });
  }

  // === CALENDAR MONTH ===
  function renderCalendar() {
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('calTitle').textContent = months[calMonth] + ' ' + calYear;

    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';

    ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(d => {
      const h = document.createElement('div');
      h.className = 'cal-day-header';
      h.textContent = d;
      grid.appendChild(h);
    });

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tasks = TaskManager.getAll();

    const prevDays = new Date(calYear, calMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      grid.appendChild(createDayCell(prevDays - i, true, null, tasks));
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, calMonth, d);
      const isToday = date.getTime() === today.getTime();
      const dateStr = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      grid.appendChild(createDayCell(d, false, dateStr, tasks, isToday));
    }

    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      grid.appendChild(createDayCell(i, true, null, tasks));
    }
  }

  function createDayCell(num, otherMonth, dateStr, tasks, isToday) {
    const cell = document.createElement('div');
    cell.className = 'cal-day clickable' + (otherMonth ? ' other-month' : '') + (isToday ? ' today' : '');

    let html = '<div class="cal-day-num">' + num + '</div>';

    if (dateStr && !otherMonth) {
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      dayTasks.slice(0, 4).forEach(t => {
        const cls = t.done ? 'done' : t.priority;
        html += '<span class="cal-task-dot ' + cls + '">' + escHtml(t.text.substring(0, 15)) + '</span>';
      });
      if (dayTasks.length > 4) {
        html += '<span class="cal-task-dot">+' + (dayTasks.length - 4) + ' mais</span>';
      }

      // Click to add task on this day
      cell.addEventListener('click', () => {
        openQuickAddWithDate(dateStr);
      });
    }

    cell.innerHTML = html;
    return cell;
  }

  // === CALENDAR WEEK ===
  function renderWeek() {
    const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const tasks = TaskManager.getAll();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(calWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    document.getElementById('calTitle').textContent =
      String(calWeekStart.getDate()).padStart(2, '0') + ' ' + months[calWeekStart.getMonth()] +
      ' — ' +
      String(weekEnd.getDate()).padStart(2, '0') + ' ' + months[weekEnd.getMonth()] + ' ' + weekEnd.getFullYear();

    const grid = document.getElementById('calWeekGrid');
    grid.innerHTML = '';

    for (let i = 0; i < 7; i++) {
      const date = new Date(calWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.getFullYear() + '-' +
                      String(date.getMonth() + 1).padStart(2, '0') + '-' +
                      String(date.getDate()).padStart(2, '0');
      const isToday = date.getTime() === today.getTime();

      const col = document.createElement('div');
      col.className = 'cal-week-col' + (isToday ? ' today' : '');

      const header = document.createElement('div');
      header.className = 'cal-week-header';
      header.innerHTML =
        '<div class="cw-day">' + dayNames[date.getDay()] + '</div>' +
        '<div class="cw-date">' + String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0') + '</div>';
      col.appendChild(header);

      const body = document.createElement('div');
      body.className = 'cal-week-body';

      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      dayTasks.forEach(t => {
        const task = document.createElement('div');
        task.className = 'cal-week-task ' + t.priority + (t.done ? ' done' : '');
        let taskHtml = escHtml(t.text.substring(0, 25));
        if (t.dueTime) {
          taskHtml = '<span class="cwt-time">⏰ ' + t.dueTime + '</span>' + taskHtml;
        }
        task.innerHTML = taskHtml;
        task.addEventListener('click', () => TaskUI.openEdit(t.id));
        body.appendChild(task);
      });

      // Add button
      const addBtn = document.createElement('div');
      addBtn.className = 'cal-week-add';
      addBtn.textContent = '+ adicionar';
      addBtn.addEventListener('click', () => {
        openQuickAddWithDate(dateStr);
      });
      body.appendChild(addBtn);

      col.appendChild(body);
      grid.appendChild(col);
    }
  }

  // === QUICK ADD WITH DATE ===
  function openQuickAddWithDate(dateStr) {
    if (typeof QuickAdd !== 'undefined') {
      QuickAdd.open();
      setTimeout(() => {
        document.getElementById('qaDue').value = dateStr;
      }, 100);
    }
  }

  // Helpers
  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function fmtDateKanban(d) {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  function dueStatusKanban(dueDate, done) {
    if (done || !dueDate) return '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    if (due < today) return 'overdue';
    if (due.getTime() === today.getTime()) return 'today';
    return '';
  }

  function refresh() {
    if (currentView === 'kanban') renderKanban();
    else if (currentView === 'calendar') {
      if (calMode === 'month') renderCalendar();
      else renderWeek();
    }
  }

  return { init, setView, getView, refresh, renderKanban, renderCalendar };
})();