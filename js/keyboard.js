/**
 * keyboard.js — Atalhos de teclado
 * Depende de: tasks.js, ui.js
 */
(function () {
  var taskInput = document.getElementById('taskInput');
  var searchInput = document.getElementById('searchInput');
  var helpModal = document.getElementById('helpModal');
  var editOverlay = document.getElementById('editOverlay');

  function isHelpOpen() {
    return helpModal && helpModal.classList.contains('visible');
  }

  function isEditOpen() {
    return editOverlay && editOverlay.classList.contains('visible');
  }

  document.addEventListener('keydown', function (e) {
    var tag = document.activeElement.tagName;
    if (document.activeElement === taskInput) return;
    if (document.activeElement === searchInput) return;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;

    // F1 — Help
    if (e.key === 'F1') {
      e.preventDefault();
      if (isHelpOpen()) TaskUI.closeHelp();
      else TaskUI.openHelp();
      return;
    }

    // Escape — fechar modais
    if (e.key === 'Escape') {
      if (isEditOpen()) TaskUI.closeEdit();
      else if (isHelpOpen()) TaskUI.closeHelp();
      return;
    }

    // Ctrl+Z — Undo
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      TaskManager.performUndo();
      return;
    }

    // Ctrl+N — Quick Add
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      if (typeof QuickAdd !== 'undefined') QuickAdd.open();
      return;
    }

    // Ctrl+K ou / — Command Palette
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey)) {
      e.preventDefault();
      if (typeof Commands !== 'undefined') Commands.open();
      return;
    }

    // Se edit aberto, não processar
    if (isEditOpen()) return;

    var rows = Array.from(document.querySelectorAll('.task-row'));
    if (!rows.length) return;

    var selId = TaskManager.getSelectedId();
    var idx = -1;
    for (var i = 0; i < rows.length; i++) {
      if (Number(rows[i].dataset.id) === selId) { idx = i; break; }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var next = idx < rows.length - 1 ? idx + 1 : 0;
      rows[next].click();
      rows[next].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      var prev = idx > 0 ? idx - 1 : rows.length - 1;
      rows[prev].click();
      rows[prev].scrollIntoView({ block: 'nearest' });
    } else if (e.key === ' ' && selId) {
      e.preventDefault();
      TaskManager.toggleTask(selId);
    } else if (e.key === 'Delete' && selId) {
      e.preventDefault();
      var el = null;
      for (var j = 0; j < rows.length; j++) {
        if (Number(rows[j].dataset.id) === selId) { el = rows[j]; break; }
      }
      if (el) TaskManager.deleteTask(selId, el);
    } else if (e.key === 'Enter' && selId) {
      e.preventDefault();
      TaskUI.openEdit(selId);
    }
  });
})();