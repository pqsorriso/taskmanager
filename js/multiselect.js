/**
 * multiselect.js — Seleção múltipla com Shift+Click
 * Depende de: tasks.js
 */
const MultiSelect = (() => {
  let selectedIds = [];
  const bar = document.getElementById('multiActionsBar');

  function init() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.addEventListener('click', (e) => {
      if (!e.shiftKey) return;

      const row = e.target.closest('.task-row');
      if (!row) return;
      if (e.target.classList.contains('task-check') || e.target.classList.contains('task-del') || e.target.classList.contains('drag-handle') || e.target.classList.contains('task-star')) return;

      e.preventDefault();
      const id = Number(row.dataset.id);

      if (selectedIds.includes(id)) {
        selectedIds = selectedIds.filter(x => x !== id);
        row.classList.remove('multi-selected');
      } else {
        selectedIds.push(id);
        row.classList.add('multi-selected');
      }

      updateBar();
    });

    // Complete selected
    const multiComplete = document.getElementById('multiComplete');
    if (multiComplete) {
      multiComplete.addEventListener('click', async () => {
        for (const id of selectedIds) {
          await TaskManager.toggleTask(id);
        }
        clearSelection();
      });
    }

    // Delete selected
    const multiDelete = document.getElementById('multiDelete');
    if (multiDelete) {
      multiDelete.addEventListener('click', async () => {
        if (!confirm('Excluir ' + selectedIds.length + ' tarefas selecionadas?')) return;
        for (const id of selectedIds) {
          const t = TaskManager.getTaskById(id);
          if (t && typeof Archive !== 'undefined') Archive.trashTask(t);
          await TaskDB.remove(id);
        }
        await TaskManager.loadAll();
        TaskManager.render();
        clearSelection();
      });
    }

    // Close
    const multiClose = document.getElementById('multiClose');
    if (multiClose) multiClose.addEventListener('click', clearSelection);

    // Escape to clear
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && selectedIds.length > 0) {
        clearSelection();
      }
    });
  }

  function updateBar() {
    const countEl = document.getElementById('multiCount');
    if (countEl) countEl.textContent = selectedIds.length;
    if (selectedIds.length > 0) {
      if (bar) bar.classList.add('visible');
    } else {
      if (bar) bar.classList.remove('visible');
    }
  }

  function clearSelection() {
    selectedIds = [];
    document.querySelectorAll('.task-row.multi-selected').forEach(r => r.classList.remove('multi-selected'));
    if (bar) bar.classList.remove('visible');
  }

  function getSelected() { return selectedIds; }

  return { init, clearSelection, getSelected };
})();