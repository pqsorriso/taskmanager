/**
 * myday.js — "Meu Dia" — Foco do dia
 * Selecionar até 5 tarefas como prioridade do dia
 */
const MyDay = (() => {
  const STORAGE_KEY = 'fceux_myday';
  const MAX_TASKS = 5;
  let mydayIds = [];
  let lastDate = '';

  const bar = document.getElementById('mydayBar');
  const tasksContainer = document.getElementById('mydayTasks');
  const progress = document.getElementById('mydayProgress');
  const selectorOverlay = document.getElementById('mydaySelectorOverlay');

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        mydayIds = data.ids || [];
        lastDate = data.date || '';
      }
    } catch (e) {}

    // Reset se mudou o dia
    const today = new Date().toISOString().slice(0, 10);
    if (lastDate !== today) {
      mydayIds = [];
      lastDate = today;
      save();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ids: mydayIds,
      date: lastDate
    }));
  }

  function init() {
    load();
    renderBar();

    document.getElementById('mydayAddBtn').addEventListener('click', openSelector);
    document.getElementById('mydaySelectorClose').addEventListener('click', closeSelector);
    selectorOverlay.addEventListener('click', (e) => { if (e.target === selectorOverlay) closeSelector(); });
  }

  function renderBar() {
    tasksContainer.innerHTML = '';
    const allTasks = TaskManager.getAll();
    let doneCount = 0;

    if (!mydayIds.length) {
      tasksContainer.innerHTML = '<span style="color:#004060;font-size:11px">Nenhuma tarefa selecionada para hoje</span>';
      progress.textContent = '0/0';
      return;
    }

    mydayIds.forEach(id => {
      const t = allTasks.find(x => x.id === id);
      if (!t) return;

      if (t.done) doneCount++;

      const chip = document.createElement('div');
      chip.className = 'myday-chip' + (t.done ? ' done' : '');
      chip.innerHTML =
        '<span class="mc-check">' + (t.done ? '✅' : '⬜') + '</span>' +
        '<span>' + escHtml(t.text.substring(0, 25)) + '</span>' +
        '<span class="mc-remove" data-id="' + id + '">✕</span>';

      chip.querySelector('.mc-check').addEventListener('click', async (e) => {
        e.stopPropagation();
        await TaskManager.toggleTask(id);
        renderBar();
      });

      chip.querySelector('.mc-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromDay(id);
      });

      tasksContainer.appendChild(chip);
    });

    const total = mydayIds.length;
    progress.textContent = doneCount + '/' + total;
    if (doneCount === total && total > 0) {
      progress.textContent += ' 🎉';
    }
  }

  function addToDay(id) {
    if (mydayIds.includes(id)) return;
    if (mydayIds.length >= MAX_TASKS) {
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('⭐ MEU DIA', 'Máximo de ' + MAX_TASKS + ' tarefas por dia!', 'warn', 3000);
      }
      return;
    }
    mydayIds.push(id);
    save();
    renderBar();
  }

  function removeFromDay(id) {
    mydayIds = mydayIds.filter(x => x !== id);
    save();
    renderBar();
  }

  function isInDay(id) {
    return mydayIds.includes(id);
  }

  // Selector
  function openSelector() {
    const body = document.getElementById('mydaySelectorBody');
    body.innerHTML = '';
    const allTasks = TaskManager.getAll().filter(t => !t.done);

    if (!allTasks.length) {
      body.innerHTML = '<div style="text-align:center;padding:20px;color:#004060">Nenhuma tarefa pendente</div>';
      selectorOverlay.classList.add('visible');
      return;
    }

    allTasks.forEach(t => {
      const isSelected = mydayIds.includes(t.id);
      const item = document.createElement('div');
      item.className = 'myday-sel-item';
      item.innerHTML =
        '<span class="msi-check ' + (isSelected ? 'selected' : '') + '">' + (isSelected ? '⭐' : '☆') + '</span>' +
        '<span class="msi-text">' + escHtml(t.text) + '</span>' +
        '<span class="msi-pri p-' + t.priority + '">' + t.priority.toUpperCase() + '</span>';

      item.addEventListener('click', () => {
        if (isSelected) {
          removeFromDay(t.id);
        } else {
          addToDay(t.id);
        }
        openSelector(); // Re-render
      });

      body.appendChild(item);
    });

    selectorOverlay.classList.add('visible');
  }

  function closeSelector() {
    selectorOverlay.classList.remove('visible');
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  return { init, renderBar, addToDay, removeFromDay, isInDay };
})();