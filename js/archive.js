/**
 * archive.js — Arquivo morto + Lixeira
 * Tarefas concluídas vão pro arquivo
 * Tarefas deletadas vão pra lixeira (30 dias)
 * Depende de: tasks.js, db.js
 */
const Archive = (() => {
  const ARCHIVE_KEY = 'fceux_archive';
  const TRASH_KEY = 'fceux_trash';
  const TRASH_DAYS = 30;

  let archive = [];
  let trash = [];
  let currentTab = 'archive';

  const overlay = document.getElementById('archiveOverlay');

  function load() {
    try {
      const a = localStorage.getItem(ARCHIVE_KEY);
      if (a) archive = JSON.parse(a);
      const t = localStorage.getItem(TRASH_KEY);
      if (t) trash = JSON.parse(t);
    } catch (e) {}
    cleanExpiredTrash();
  }

  function save() {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive));
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  }

  function cleanExpiredTrash() {
    const cutoff = Date.now() - (TRASH_DAYS * 24 * 60 * 60 * 1000);
    const before = trash.length;
    trash = trash.filter(t => t.deletedAt && t.deletedAt > cutoff);
    if (trash.length !== before) save();
  }

  // Arquivar tarefa concluída
  function archiveTask(task) {
    const copy = JSON.parse(JSON.stringify(task));
    copy.archivedAt = Date.now();
    archive.unshift(copy);
    save();
  }

  // Mover tarefa pra lixeira
  function trashTask(task) {
    const copy = JSON.parse(JSON.stringify(task));
    copy.deletedAt = Date.now();
    trash.unshift(copy);
    save();
  }

  // Restaurar do arquivo
  async function restoreFromArchive(idx) {
    const task = archive[idx];
    if (!task) return;
    delete task.archivedAt;
    task.done = false;
    const newId = await TaskDB.add(task);
    task.id = newId;
    archive.splice(idx, 1);
    save();
    await TaskManager.loadAll();
    TaskManager.render();
    renderContent();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📦 RESTAURADA', '"' + task.text + '" voltou para pendentes', 'success', 3000);
    }
  }

  // Restaurar da lixeira
  async function restoreFromTrash(idx) {
    const task = trash[idx];
    if (!task) return;
    delete task.deletedAt;
    const newId = await TaskDB.add(task);
    task.id = newId;
    trash.splice(idx, 1);
    save();
    await TaskManager.loadAll();
    TaskManager.render();
    renderContent();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('🗑 RESTAURADA', '"' + task.text + '" voltou da lixeira', 'success', 3000);
    }
  }

  // Deletar permanentemente
  function permanentDelete(type, idx) {
    if (type === 'archive') {
      archive.splice(idx, 1);
    } else {
      trash.splice(idx, 1);
    }
    save();
    renderContent();
  }

  // === UI ===
  function open() {
    load();
    currentTab = 'archive';
    document.querySelectorAll('.archive-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.archive-tab[data-atab="archive"]').classList.add('active');
    renderContent();
    overlay.classList.add('visible');
  }

  function close() { overlay.classList.remove('visible'); }

  function renderContent() {
    const body = document.getElementById('archiveBody');
    const items = currentTab === 'archive' ? archive : trash;
    const count = document.getElementById('archiveCount');

    if (!items.length) {
      body.innerHTML = '<div class="archive-empty">' +
        (currentTab === 'archive' ? '📦 Arquivo vazio' : '🗑 Lixeira vazia') +
        '</div>';
      count.textContent = '0 itens';
      return;
    }

    body.innerHTML = '';
    items.forEach((t, i) => {
      const item = document.createElement('div');
      item.className = 'archive-item';

      let dateInfo = '';
      if (currentTab === 'archive' && t.archivedAt) {
        dateInfo = 'Arquivada em ' + fmtTimestamp(t.archivedAt);
      } else if (currentTab === 'trash' && t.deletedAt) {
        const daysLeft = Math.ceil((t.deletedAt + TRASH_DAYS * 86400000 - Date.now()) / 86400000);
        dateInfo = 'Deletada em ' + fmtTimestamp(t.deletedAt);
        if (daysLeft > 0) {
          dateInfo += '<div class="trash-timer">⏳ Expira em ' + daysLeft + ' dia(s)</div>';
        }
      }

      const icon = currentTab === 'archive' ? '📦' : '🗑';

      item.innerHTML =
        '<span class="ai-icon">' + icon + '</span>' +
        '<div class="ai-body">' +
          '<div class="ai-title">' + escHtml(t.text) + '</div>' +
          '<div class="ai-meta">' +
            '<span class="p-' + t.priority + '">' + t.priority.toUpperCase() + '</span>' +
            (t.category ? ' · ' + t.category : '') +
            (t.project && t.project !== 'Geral' ? ' · 📂' + t.project : '') +
          '</div>' +
          '<div class="ai-date">' + dateInfo + '</div>' +
        '</div>' +
        '<div class="ai-actions">' +
          '<button class="ai-btn" data-action="restore" data-i="' + i + '">↩ Restaurar</button>' +
          '<button class="ai-btn danger" data-action="delete" data-i="' + i + '">✕</button>' +
        '</div>';

      body.appendChild(item);
    });

    // Bind buttons
    body.querySelectorAll('.ai-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.i);
        if (btn.dataset.action === 'restore') {
          if (currentTab === 'archive') restoreFromArchive(idx);
          else restoreFromTrash(idx);
        } else {
          if (confirm('Excluir permanentemente?')) {
            permanentDelete(currentTab, idx);
          }
        }
      });
    });

    count.textContent = items.length + ' iten(s)';
  }

  function fmtTimestamp(ts) {
    const d = new Date(ts);
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' +
           d.getFullYear() + ' ' +
           String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0');
  }

  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Binds
  document.getElementById('btnArchive').addEventListener('click', open);
  document.getElementById('archiveCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  document.querySelectorAll('.archive-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.archive-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.atab;
      renderContent();
    });
  });

  document.getElementById('archiveEmptyBtn').addEventListener('click', () => {
    const items = currentTab === 'archive' ? archive : trash;
    if (!items.length) return;
    const label = currentTab === 'archive' ? 'arquivo' : 'lixeira';
    if (!confirm('Esvaziar ' + label + '? (' + items.length + ' itens serão removidos permanentemente)')) return;
    if (currentTab === 'archive') archive = [];
    else trash = [];
    save();
    renderContent();
  });

  function init() { load(); }

  return {
    init: init,
    archiveTask: archiveTask,
    trashTask: trashTask,
    open: open,
    getArchive: () => archive,
    getTrash: () => trash
  };
})();