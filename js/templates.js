/**
 * templates.js — Templates de tarefa reutilizáveis
 * Salva no localStorage
 * Depende de: tasks.js, db.js
 */
const Templates = (() => {
  const STORAGE_KEY = 'fceux_templates';
  const overlay = document.getElementById('templateOverlay');
  const saveOverlay = document.getElementById('saveTemplateOverlay');
  let templates = [];

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) templates = JSON.parse(saved);
    } catch (e) {}
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }

  function open() {
    load();
    renderList();
    if (overlay) overlay.classList.add('visible');
  }

  function close() {
    if (overlay) overlay.classList.remove('visible');
  }

  function renderList() {
    const body = document.getElementById('templateBody');
    if (!body) return;

    if (!templates.length) {
      body.innerHTML = '<div class="template-empty">📄 Nenhum template criado<br><br>Crie um template para reutilizar tarefas com subtarefas prontas!</div>';
      return;
    }

    body.innerHTML = '';
    templates.forEach((tpl, i) => {
      const card = document.createElement('div');
      card.className = 'template-card';

      const subsCount = tpl.subtasks ? tpl.subtasks.length : 0;
      card.innerHTML =
        '<div class="tc-name">' + escHtml(tpl.name) + '</div>' +
        '<div class="tc-desc">📋 ' + escHtml(tpl.text) + '</div>' +
        '<div class="tc-meta">' +
          '<span class="p-' + tpl.priority + '">' + tpl.priority.toUpperCase() + '</span>' +
          (tpl.category ? '<span>📁 ' + tpl.category + '</span>' : '') +
          '<span>📋 ' + subsCount + ' subtarefa(s)</span>' +
        '</div>' +
        '<div class="tc-actions">' +
          '<button class="tc-btn" data-action="use" data-i="' + i + '">▶ Usar</button>' +
          '<button class="tc-btn" data-action="edit" data-i="' + i + '">✏️ Editar</button>' +
          '<button class="tc-btn danger" data-action="delete" data-i="' + i + '">🗑</button>' +
        '</div>';

      body.appendChild(card);
    });

    body.querySelectorAll('.tc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.i);
        const action = btn.dataset.action;

        if (action === 'use') useTemplate(idx);
        else if (action === 'edit') editTemplate(idx);
        else if (action === 'delete') deleteTemplate(idx);
      });
    });
  }

  async function useTemplate(idx) {
    const tpl = templates[idx];
    if (!tpl) return;

    const now = new Date();
    const date = String(now.getDate()).padStart(2, '0') + '/' +
                 String(now.getMonth() + 1).padStart(2, '0') + '/' +
                 now.getFullYear();

    const task = {
      text: tpl.text,
      priority: tpl.priority || 'media',
      done: false,
      date: date,
      description: tpl.description || '',
      dueDate: '',
      dueTime: '',
      category: tpl.category || '',
      createdAt: now.toISOString(),
      subtasks: tpl.subtasks ? tpl.subtasks.map(s => ({ text: s, done: false })) : [],
      tags: tpl.tags ? tpl.tags.slice() : [],
      project: 'Geral',
      recurrence: tpl.recurrence || '',
      comments: [],
      attachments: [],
      status: 'todo',
      dependencies: [],
      timeSpent: 0,
      pinned: false
    };

    const id = await TaskDB.add(task);
    task.id = id;

    await TaskManager.loadAll();
    TaskManager.render();
    close();

    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📄 TEMPLATE', '"' + tpl.name + '" aplicado!', 'success', 3000);
    }
  }

  function deleteTemplate(idx) {
    if (!confirm('Excluir template "' + templates[idx].name + '"?')) return;
    templates.splice(idx, 1);
    save();
    renderList();
  }

  function editTemplate(idx) {
    const tpl = templates[idx];
    openSaveModal(tpl, idx);
  }

  // === SAVE MODAL ===
  function openSaveModal(tpl, editIdx) {
    const nameInput = document.getElementById('templateNameInput');
    const descInput = document.getElementById('templateDescInput');

    if (nameInput) nameInput.value = tpl ? tpl.name : '';
    if (descInput) descInput.value = tpl ? (tpl.text || '') : '';

    if (saveOverlay) {
      saveOverlay.dataset.editIdx = editIdx !== undefined ? editIdx : '-1';
      saveOverlay.classList.add('visible');
    }
    if (nameInput) setTimeout(() => nameInput.focus(), 50);
  }

  function closeSaveModal() {
    if (saveOverlay) saveOverlay.classList.remove('visible');
  }

  function saveTemplate() {
    const nameInput = document.getElementById('templateNameInput');
    const descInput = document.getElementById('templateDescInput');

    const name = nameInput ? nameInput.value.trim() : '';
    const text = descInput ? descInput.value.trim() : '';
    if (!name) { alert('Nome é obrigatório!'); return; }

    const tpl = {
      name: name,
      text: text || name,
      priority: 'media',
      category: '',
      subtasks: [],
      tags: [],
      description: '',
      recurrence: ''
    };

    const editIdx = saveOverlay ? Number(saveOverlay.dataset.editIdx) : -1;
    if (editIdx >= 0) {
      templates[editIdx] = tpl;
    } else {
      templates.push(tpl);
    }

    save();
    closeSaveModal();
    renderList();

    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📄 TEMPLATE', '"' + name + '" salvo!', 'success', 3000);
    }
  }

  function saveFromCurrentTask() {
    const selId = TaskManager.getSelectedId();
    if (!selId) {
      alert('Selecione uma tarefa primeiro!');
      return;
    }
    const t = TaskManager.getTaskById(selId);
    if (!t) return;

    openSaveModal({
      name: t.text,
      text: t.text,
      priority: t.priority,
      category: t.category,
      subtasks: t.subtasks ? t.subtasks.map(s => s.text) : [],
      tags: t.tags || [],
      description: t.description || ''
    });
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Binds — todos protegidos
  const btnTemplates = document.getElementById('btnTemplates');
  if (btnTemplates) btnTemplates.addEventListener('click', open);

  const templateCloseBtn = document.getElementById('templateCloseBtn');
  if (templateCloseBtn) templateCloseBtn.addEventListener('click', close);

  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const templateNewBtn = document.getElementById('templateNewBtn');
  if (templateNewBtn) templateNewBtn.addEventListener('click', () => openSaveModal(null));

  const templateSaveCurrentBtn = document.getElementById('templateSaveCurrentBtn');
  if (templateSaveCurrentBtn) templateSaveCurrentBtn.addEventListener('click', saveFromCurrentTask);

  const templateSaveConfirm = document.getElementById('templateSaveConfirm');
  if (templateSaveConfirm) templateSaveConfirm.addEventListener('click', saveTemplate);

  const templateSaveCancel = document.getElementById('templateSaveCancel');
  if (templateSaveCancel) templateSaveCancel.addEventListener('click', closeSaveModal);

  if (saveOverlay) saveOverlay.addEventListener('click', (e) => { if (e.target === saveOverlay) closeSaveModal(); });

  return { open, close };
})();