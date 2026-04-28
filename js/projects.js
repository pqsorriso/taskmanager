/**
 * projects.js — Sistema de projetos/listas
 * Depende de: db.js, tasks.js
 */
const Projects = (() => {
  const STORAGE_KEY = 'fceux_projects';
  let projects = ['Geral'];
  let currentProject = 'all';

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) projects = JSON.parse(saved);
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch (e) {}
  }

  function getAll() { return projects; }
  function getCurrent() { return currentProject; }

  function add(name) {
    name = name.trim();
    if (!name || projects.includes(name)) return false;
    projects.push(name);
    save();
    renderBar();
    updateProjSelect();
    return true;
  }

  function remove(name) {
    if (name === 'Geral') return;
    projects = projects.filter(p => p !== name);
    save();
    if (currentProject === name) {
      currentProject = 'all';
      TaskManager.setProject('all');
    }
    renderBar();
    updateProjSelect();
  }

  function setCurrent(proj) {
    currentProject = proj;
    TaskManager.setProject(proj);
    renderBar();
  }

  function renderBar() {
    const bar = document.getElementById('projectBar');
    if (!bar) return;
    bar.innerHTML = '';

    const allTab = document.createElement('div');
    allTab.className = 'project-tab' + (currentProject === 'all' ? ' active' : '');
    allTab.dataset.project = 'all';
    allTab.textContent = '📁 TODAS';
    allTab.addEventListener('click', () => setCurrent('all'));
    bar.appendChild(allTab);

    const allTasks = TaskManager.getAll();
    projects.forEach(p => {
      const count = allTasks.filter(t => (t.project || 'Geral') === p && !t.done).length;
      const tab = document.createElement('div');
      tab.className = 'project-tab' + (currentProject === p ? ' active' : '');
      tab.dataset.project = p;
      tab.innerHTML =
        '📂 ' + escHtml(p) +
        ' <span class="pt-count">' + count + '</span>' +
        (p !== 'Geral' ? ' <span class="pt-del" title="Excluir projeto">✕</span>' : '');

      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('pt-del')) {
          if (confirm('Excluir projeto "' + p + '"? As tarefas serão movidas para "Geral".')) {
            const tasks = TaskManager.getAll();
            tasks.forEach(async t => {
              if (t.project === p) {
                t.project = 'Geral';
                await TaskDB.update(t);
              }
            });
            remove(p);
            TaskManager.render();
          }
          return;
        }
        setCurrent(p);
      });

      bar.appendChild(tab);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'project-add-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Novo projeto';
    addBtn.addEventListener('click', openInput);
    bar.appendChild(addBtn);
  }

  function updateProjSelect() {
    const sel = document.getElementById('projSel');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Geral —</option>';
    projects.forEach(p => {
      if (p === 'Geral') return;
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      sel.appendChild(opt);
    });

    // Atualizar select do edit modal também
    const editProject = document.getElementById('editProject');
    if (editProject) {
      const currentVal = editProject.value;
      editProject.innerHTML = '<option value="Geral">Geral</option>';
      projects.forEach(p => {
        if (p === 'Geral') return;
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        editProject.appendChild(opt);
      });
      editProject.value = currentVal;
    }
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Project input modal
  const overlay = document.getElementById('projectInputOverlay');
  const nameInput = document.getElementById('projectNameInput');

  function openInput() {
    if (overlay) overlay.classList.add('visible');
    if (nameInput) nameInput.focus();
  }

  function closeInput() {
    if (overlay) overlay.classList.remove('visible');
    if (nameInput) nameInput.value = '';
  }

  // Binds
  const confirmBtn = document.getElementById('projectConfirmBtn');
  const cancelBtn = document.getElementById('projectCancelBtn');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const name = nameInput ? nameInput.value.trim() : '';
      if (name && add(name)) closeInput();
    });
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeInput);

  if (overlay) {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeInput(); });
  }

  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const name = nameInput.value.trim();
        if (name && add(name)) closeInput();
      }
      if (e.key === 'Escape') closeInput();
    });
  }

  function init() {
    load();
    renderBar();
    updateProjSelect();
  }

  return { init, getAll, getCurrent, add, remove, renderBar, updateProjSelect };
})();