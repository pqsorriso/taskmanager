/**
 * ui.js — Interface, Modais, Controles
 * Depende de: tasks.js, db.js
 */
const TaskUI = (() => {
  // === ELEMENTOS ===
  const helpModal = document.getElementById('helpModal');
  const editOverlay = document.getElementById('editOverlay');
  const statsOverlay = document.getElementById('statsOverlay');
  const historyOverlay = document.getElementById('historyOverlay');

  let editingId = null;
  let tempSubtasks = [];
  let tempTags = [];
  let tempComments = [];
  let tempAttachments = [];
  let tempDependencies = [];
  let activeTimerTask = null;
  let timerInterval = null;
  let tempReminders = [];

  // ============================================
  // === HELP MODAL ===
  // ============================================
  function openHelp() { if (helpModal) helpModal.classList.add('visible'); }
  function closeHelp() { if (helpModal) helpModal.classList.remove('visible'); }

  const helpCloseX = document.getElementById('helpCloseX');
  if (helpCloseX) helpCloseX.addEventListener('click', closeHelp);
  const helpOk = document.getElementById('helpOk');
  if (helpOk) helpOk.addEventListener('click', closeHelp);
  if (helpModal) helpModal.addEventListener('click', (e) => { if (e.target === helpModal) closeHelp(); });

  // ============================================
  // === EDIT MODAL ===
  // ============================================
  function openEdit(id) {
    const t = TaskManager.getTaskById(id);
    if (!t) return;
    editingId = id;

    document.getElementById('editText').value = t.text;
    document.getElementById('editDesc').value = t.description || '';
    document.getElementById('editPri').value = t.priority;
    document.getElementById('editDue').value = t.dueDate || '';
    document.getElementById('editCat').value = t.category || '';

    const editDueTime = document.getElementById('editDueTime');
    if (editDueTime) editDueTime.value = t.dueTime || '';

    const editRecurrence = document.getElementById('editRecurrence');
    if (editRecurrence) editRecurrence.value = t.recurrence || '';

    const editProject = document.getElementById('editProject');
    if (editProject) editProject.value = t.project || 'Geral';

    const editStatus = document.getElementById('editStatus');
    if (editStatus) editStatus.value = t.status || 'todo';

    // Time tracking

    // Estimativa
    const editEstimate = document.getElementById('editEstimate');
    if (editEstimate) editEstimate.value = t.estimate || 0;

    // Lembretes
    tempReminders = t.reminders ? JSON.parse(JSON.stringify(t.reminders)) : [];
    renderReminders();
    const editTimeSpent = document.getElementById('editTimeSpent');
    if (editTimeSpent) editTimeSpent.value = formatTime(t.timeSpent || 0);
    const editTimerBtn = document.getElementById('editTimerBtn');
    if (editTimerBtn) editTimerBtn.textContent = activeTimerTask === id ? '⏸ Pausar' : '▶ Iniciar';

    // Subtasks
    tempSubtasks = t.subtasks ? JSON.parse(JSON.stringify(t.subtasks)) : [];
    renderSubtasks();

    // Tags
    tempTags = t.tags ? t.tags.slice() : [];
    renderTags();

    // Comments
    tempComments = t.comments ? JSON.parse(JSON.stringify(t.comments)) : [];
    renderComments();

    // Attachments
    tempAttachments = t.attachments ? JSON.parse(JSON.stringify(t.attachments)) : [];
    renderAttachments(tempAttachments);

    // Dependencies
    tempDependencies = t.dependencies ? t.dependencies.slice() : [];
    renderDependencies();

    editOverlay.classList.add('visible');
  }

  function closeEdit() {
    editOverlay.classList.remove('visible');
    if (timerInterval && activeTimerTask === editingId) {
      clearInterval(timerInterval);
      timerInterval = null;
      activeTimerTask = null;
    }
    editingId = null;
  }

  function saveEditForm() {
    if (!editingId) return;

    const data = {
      text: document.getElementById('editText').value.trim(),
      description: document.getElementById('editDesc').value.trim(),
      priority: document.getElementById('editPri').value,
      dueDate: document.getElementById('editDue').value,
      category: document.getElementById('editCat').value,
      subtasks: tempSubtasks,
      tags: tempTags,
      comments: tempComments,
      attachments: tempAttachments,
      dependencies: tempDependencies
    };

    const editDueTime = document.getElementById('editDueTime');
    if (editDueTime) data.dueTime = editDueTime.value;

    const editRecurrence = document.getElementById('editRecurrence');
    if (editRecurrence) data.recurrence = editRecurrence.value;

    const editProject = document.getElementById('editProject');
    if (editProject) data.project = editProject.value;

    const editStatus = document.getElementById('editStatus');
    if (editStatus) data.status = editStatus.value;
    
    const editEstimate = document.getElementById('editEstimate');
    if (editEstimate) data.estimate = parseInt(editEstimate.value) || 0;

    data.reminders = tempReminders;

    if (!data.text) { document.getElementById('editText').focus(); return; }

    TaskManager.saveEdit(editingId, data);
    closeEdit();
  }

  // Binds edit modal
  const editCloseBtn = document.getElementById('editCloseBtn');
  if (editCloseBtn) editCloseBtn.addEventListener('click', closeEdit);

  const editSaveBtn = document.getElementById('editSaveBtn');
  if (editSaveBtn) editSaveBtn.addEventListener('click', saveEditForm);

  const editCancelBtn = document.getElementById('editCancelBtn');
  if (editCancelBtn) editCancelBtn.addEventListener('click', closeEdit);

  if (editOverlay) editOverlay.addEventListener('click', (e) => { if (e.target === editOverlay) closeEdit(); });

  // ============================================
  // === SUBTASKS ===
  // ============================================
  function renderSubtasks() {
    const list = document.getElementById('editSubtasks');
    if (!list) return;
    list.innerHTML = '';

    tempSubtasks.forEach((st, i) => {
      const item = document.createElement('div');
      item.className = 'subtask-item';
      item.innerHTML =
        '<span class="st-check ' + (st.done ? 'done' : '') + '" data-i="' + i + '">' + (st.done ? '[X]' : '[ ]') + '</span>' +
        '<span class="st-text ' + (st.done ? 'done' : '') + '">' + escapeForEdit(st.text) + '</span>' +
        '<span class="st-del" data-i="' + i + '">✕</span>';
      list.appendChild(item);
    });

    list.querySelectorAll('.st-check').forEach(c => {
      c.addEventListener('click', () => {
        const idx = Number(c.dataset.i);
        tempSubtasks[idx].done = !tempSubtasks[idx].done;
        renderSubtasks();
      });
    });

    list.querySelectorAll('.st-del').forEach(d => {
      d.addEventListener('click', () => {
        tempSubtasks.splice(Number(d.dataset.i), 1);
        renderSubtasks();
      });
    });
  }

  const subtaskAddBtn = document.getElementById('subtaskAddBtn');
  const subtaskInput = document.getElementById('subtaskInput');
  if (subtaskAddBtn && subtaskInput) {
    subtaskAddBtn.addEventListener('click', () => {
      const text = subtaskInput.value.trim();
      if (!text) return;
      tempSubtasks.push({ text: text, done: false });
      subtaskInput.value = '';
      renderSubtasks();
    });

    subtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        subtaskAddBtn.click();
      }
    });
  }

  // ============================================
  // === TAGS ===
  // ============================================
  function renderTags() {
    const wrap = document.getElementById('editTagsWrap');
    if (!wrap) return;
    wrap.innerHTML = '';

    tempTags.forEach((tag, i) => {
      const el = document.createElement('span');
      el.className = 'edit-tag';
      el.innerHTML = '#' + escapeForEdit(tag) + ' <span class="tag-remove" data-i="' + i + '">✕</span>';
      wrap.appendChild(el);
    });

    wrap.querySelectorAll('.tag-remove').forEach(r => {
      r.addEventListener('click', () => {
        tempTags.splice(Number(r.dataset.i), 1);
        renderTags();
      });
    });
  }

  const tagAddBtn = document.getElementById('tagAddBtn');
  const tagInput = document.getElementById('tagInput');
  if (tagAddBtn && tagInput) {
    tagAddBtn.addEventListener('click', () => {
      const text = tagInput.value.trim().replace(/^#/, '');
      if (!text || tempTags.includes(text)) return;
      tempTags.push(text);
      tagInput.value = '';
      renderTags();
    });

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        tagAddBtn.click();
      }
    });
  }

  // ============================================
  // === COMMENTS ===
  // ============================================
  function renderComments() {
    const list = document.getElementById('editComments');
    if (!list) return;
    list.innerHTML = '';

    if (!tempComments.length) {
      list.innerHTML = '<div style="padding:6px;color:#999;font-size:11px;text-align:center;font-family:Segoe UI,sans-serif">Nenhum comentário</div>';
      return;
    }

    tempComments.forEach((c, i) => {
      const item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML =
        '<div class="comment-meta">' +
          '<span class="comment-date">' + (c.date || '') + '</span>' +
          '<span class="comment-del" data-i="' + i + '">✕</span>' +
        '</div>' +
        '<div class="comment-text">' + escapeForEdit(c.text) + '</div>';
      list.appendChild(item);
    });

    list.querySelectorAll('.comment-del').forEach(d => {
      d.addEventListener('click', () => {
        tempComments.splice(Number(d.dataset.i), 1);
        renderComments();
      });
    });
  }

  const commentAddBtn = document.getElementById('commentAddBtn');
  const commentInput = document.getElementById('commentInput');
  if (commentAddBtn && commentInput) {
    commentAddBtn.addEventListener('click', () => {
      const text = commentInput.value.trim();
      if (!text) return;
      const now = new Date();
      const date = String(now.getDate()).padStart(2, '0') + '/' +
                   String(now.getMonth() + 1).padStart(2, '0') + '/' +
                   now.getFullYear() + ' ' +
                   String(now.getHours()).padStart(2, '0') + ':' +
                   String(now.getMinutes()).padStart(2, '0');
      tempComments.push({ text: text, date: date });
      commentInput.value = '';
      renderComments();
    });
  }

  // ============================================
  // === ATTACHMENTS ===
  // ============================================
  function renderAttachments(atts) {
    tempAttachments = atts ? atts.slice() : [];
    const list = document.getElementById('editAttachments');
    if (!list) return;
    list.innerHTML = '';

    if (!tempAttachments.length) {
      list.innerHTML = '<div style="padding:6px;color:#999;font-size:11px;text-align:center;font-family:Segoe UI,sans-serif">Nenhum anexo</div>';
      return;
    }

    tempAttachments.forEach((att, i) => {
      const item = document.createElement('div');
      item.className = 'attachment-item';

      const icon = getFileIcon(att.type, att.name);
      const isImage = att.type && att.type.startsWith('image');

      let html =
        '<span class="att-icon">' + icon + '</span>' +
        '<span class="att-name att-clickable" data-i="' + i + '" title="Clique para abrir">' + escapeForEdit(att.name) + '</span>' +
        '<span class="att-size">' + formatFileSize(att.size) + '</span>' +
        '<span class="att-download" data-i="' + i + '" title="Baixar">⬇</span>' +
        '<span class="att-del" data-i="' + i + '">✕</span>';

      item.innerHTML = html;
      list.appendChild(item);

      // Preview de imagem
      if (isImage && att.data) {
        const preview = document.createElement('div');
        preview.className = 'att-preview';
        preview.innerHTML = '<img src="' + att.data + '" alt="' + escapeForEdit(att.name) + '" />';
        list.appendChild(preview);
      }
    });

    // Bind open
    list.querySelectorAll('.att-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.i);
        openAttachment(tempAttachments[idx]);
      });
    });

    // Bind download
    list.querySelectorAll('.att-download').forEach(dl => {
      dl.addEventListener('click', () => {
        const idx = Number(dl.dataset.i);
        downloadAttachment(tempAttachments[idx]);
      });
    });

    // Bind delete
    list.querySelectorAll('.att-del').forEach(d => {
      d.addEventListener('click', () => {
        tempAttachments.splice(Number(d.dataset.i), 1);
        renderAttachments(tempAttachments);
      });
    });
  }

  function getFileIcon(type, name) {
    if (!type && !name) return '📄';
    const ext = name ? name.split('.').pop().toLowerCase() : '';

    if (type) {
      if (type.startsWith('image')) return '🖼️';
      if (type.startsWith('video')) return '🎬';
      if (type.startsWith('audio')) return '🎵';
      if (type.includes('pdf')) return '📕';
      if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '📦';
      if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
      if (type.includes('presentation') || type.includes('powerpoint')) return '📙';
      if (type.includes('document') || type.includes('word')) return '📘';
      if (type.includes('text')) return '📝';
    }

    const iconMap = {
      pdf: '📕', doc: '📘', docx: '📘',
      xls: '📊', xlsx: '📊', csv: '📊',
      ppt: '📙', pptx: '📙',
      zip: '📦', rar: '📦', '7z': '📦',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️', webp: '🖼️',
      mp3: '🎵', wav: '🎵', ogg: '🎵',
      mp4: '🎬', avi: '🎬', mkv: '🎬',
      txt: '📝', md: '📝', json: '📝',
      html: '🌐', css: '🎨', js: '⚙️',
      exe: '💿', msi: '💿',
    };

    return iconMap[ext] || '📄';
  }

  function openAttachment(att) {
    if (!att.data) return;
    const isImage = att.type && att.type.startsWith('image');
    const isPdf = att.type && att.type.includes('pdf');
    const isText = att.type && att.type.startsWith('text');

    if (isImage || isPdf || isText) {
      const win = window.open('', '_blank');
      if (win) {
        if (isImage) {
          win.document.write(
            '<html><head><title>' + att.name + '</title>' +
            '<style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a}img{max-width:95%;max-height:95vh;object-fit:contain;border-radius:4px;box-shadow:0 4px 20px rgba(0,0,0,0.5)}</style></head>' +
            '<body><img src="' + att.data + '"/></body></html>'
          );
        } else {
          win.document.write(
            '<html><head><title>' + att.name + '</title></head>' +
            '<body><embed src="' + att.data + '" width="100%" height="100%" /></body></html>'
          );
        }
        win.document.close();
      }
    } else {
      downloadAttachment(att);
    }
  }

  function downloadAttachment(att) {
    if (!att.data) return;
    const a = document.createElement('a');
    a.href = att.data;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('⬇️ DOWNLOAD', att.name + ' baixado!', 'success', 2500);
    }
  }

  // Attachment file input
  const attFileBtn = document.getElementById('attFileBtn');
  const attFileInput = document.getElementById('attFileInput');
  if (attFileBtn && attFileInput) {
    attFileBtn.addEventListener('click', () => attFileInput.click());
    attFileInput.addEventListener('change', async () => {
      const files = attFileInput.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          alert('Arquivo "' + file.name + '" excede 5MB!');
          continue;
        }
        const data = await readFileAsDataURL(file);
        tempAttachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: data
        });
      }
      attFileInput.value = '';
      renderAttachments(tempAttachments);
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  // ============================================
  // === DEPENDENCIES ===
  // ============================================
  function renderDependencies() {
    const list = document.getElementById('editDeps');
    if (!list) return;
    list.innerHTML = '';

    const allTasks = TaskManager.getAll();

    if (!tempDependencies.length) {
      list.innerHTML = '<div style="padding:4px;color:#999;font-size:11px;font-family:Segoe UI,sans-serif">Nenhuma dependência</div>';
    } else {
      tempDependencies.forEach((depId, i) => {
        const dep = allTasks.find(x => x.id === depId);
        if (!dep) return;
        const item = document.createElement('div');
        item.className = 'dep-item';
        item.innerHTML =
          '<span class="dep-status ' + (dep.done ? 'done' : 'pending') + '">' + (dep.done ? '✅' : '⏳') + '</span>' +
          '<span class="dep-text">' + escapeForEdit(dep.text) + '</span>' +
          '<span class="dep-del" data-i="' + i + '">✕</span>';
        list.appendChild(item);
      });

      list.querySelectorAll('.dep-del').forEach(d => {
        d.addEventListener('click', () => {
          tempDependencies.splice(Number(d.dataset.i), 1);
          renderDependencies();
        });
      });
    }

    // Populate select
    const depSelect = document.getElementById('depSelect');
    if (depSelect) {
      depSelect.innerHTML = '<option value="">Selecionar tarefa...</option>';
      allTasks.forEach(t => {
        if (t.id === editingId || tempDependencies.includes(t.id)) return;
        if (t.done) return;
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.text.substring(0, 40) + (t.text.length > 40 ? '...' : '');
        depSelect.appendChild(opt);
      });
    }
  }

  const depAddBtn = document.getElementById('depAddBtn');
  const depSelect = document.getElementById('depSelect');
  if (depAddBtn && depSelect) {
    depAddBtn.addEventListener('click', () => {
      const val = Number(depSelect.value);
      if (!val) return;
      tempDependencies.push(val);
      depSelect.value = '';
      renderDependencies();
    });
  }

  // ============================================
  // === TIME TRACKING ===
  // ============================================
  const editTimerBtn = document.getElementById('editTimerBtn');
  if (editTimerBtn) {
    editTimerBtn.addEventListener('click', () => {
      if (!editingId) return;
      const t = TaskManager.getTaskById(editingId);
      if (!t) return;

      if (activeTimerTask === editingId) {
        // Stop timer
        clearInterval(timerInterval);
        activeTimerTask = null;
        timerInterval = null;
        editTimerBtn.textContent = '▶ Iniciar';
        if (typeof Notifications !== 'undefined') {
          Notifications.showToast('⏱ TIMER', 'Timer pausado para "' + t.text + '"', 'info', 2000);
        }
      } else {
        // Start timer
        if (timerInterval) clearInterval(timerInterval);
        activeTimerTask = editingId;
        if (!t.timeSpent) t.timeSpent = 0;

        editTimerBtn.textContent = '⏸ Pausar';

        timerInterval = setInterval(async () => {
          const task = TaskManager.getTaskById(activeTimerTask);
          if (!task) { clearInterval(timerInterval); return; }
          task.timeSpent = (task.timeSpent || 0) + 1;
          await TaskDB.update(task);
          const editTimeSpent = document.getElementById('editTimeSpent');
          if (editTimeSpent) editTimeSpent.value = formatTime(task.timeSpent);
        }, 1000);

        if (typeof Notifications !== 'undefined') {
          Notifications.showToast('⏱ TIMER', 'Contando tempo para "' + t.text + '"', 'success', 2000);
        }
      }
    });
  }

  function formatTime(seconds) {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  // ============================================
  // === DUPLICATE ===
  // ============================================
  const editDuplicateBtn = document.getElementById('editDuplicateBtn');
  if (editDuplicateBtn) {
    editDuplicateBtn.addEventListener('click', async () => {
      if (!editingId) return;
      await TaskManager.duplicateTask(editingId);
      closeEdit();
    });
  }

  // ============================================
  // === STATISTICS ===
  // ============================================
  function openStats() {
    const tasks = TaskManager.getAll();
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    const pending = tasks.filter(t => !t.done).length;
    const overdue = tasks.filter(t => {
      if (t.done || !t.dueDate) return false;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return new Date(t.dueDate + 'T00:00:00') < today;
    }).length;

    const alta = tasks.filter(t => !t.done && t.priority === 'alta').length;
    const media = tasks.filter(t => !t.done && t.priority === 'media').length;
    const baixa = tasks.filter(t => !t.done && t.priority === 'baixa').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const body = document.getElementById('statsBody');
    let html = '<div class="stats-grid">' +
      '<div class="stat-card"><div class="sc-val cyan">' + total + '</div><div class="sc-lbl">Total</div></div>' +
      '<div class="stat-card"><div class="sc-val green">' + done + '</div><div class="sc-lbl">Concluídas</div></div>' +
      '<div class="stat-card"><div class="sc-val yellow">' + pending + '</div><div class="sc-lbl">Pendentes</div></div>' +
      '<div class="stat-card"><div class="sc-val red">' + overdue + '</div><div class="sc-lbl">Atrasadas</div></div>' +
      '<div class="stat-card"><div class="sc-val blue">' + pct + '%</div><div class="sc-lbl">Progresso</div></div>' +
      '</div>';

    // Por prioridade
    html += '<div class="stats-section-title">POR PRIORIDADE</div>';
    const maxP = Math.max(alta, media, baixa, 1);
    html += '<div class="stats-bar-row"><span class="stats-bar-label">Alta</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:' + (alta / maxP * 100) + '%;background:var(--pri-alta)"></div></div><span class="stats-bar-val" style="color:var(--pri-alta)">' + alta + '</span></div>';
    html += '<div class="stats-bar-row"><span class="stats-bar-label">Média</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:' + (media / maxP * 100) + '%;background:var(--pri-media)"></div></div><span class="stats-bar-val" style="color:var(--pri-media)">' + media + '</span></div>';
    html += '<div class="stats-bar-row"><span class="stats-bar-label">Baixa</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:' + (baixa / maxP * 100) + '%;background:var(--pri-baixa)"></div></div><span class="stats-bar-val" style="color:var(--pri-baixa)">' + baixa + '</span></div>';

    // Por categoria
    html += '<div class="stats-section-title">POR CATEGORIA</div>';
    const cats = {};
    tasks.filter(t => !t.done).forEach(t => {
      const cat = t.category || 'sem categoria';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    const maxC = Math.max(...Object.values(cats), 1);
    Object.keys(cats).forEach(cat => {
      html += '<div class="stats-bar-row"><span class="stats-bar-label">' + cat + '</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:' + (cats[cat] / maxC * 100) + '%;background:var(--text-blue)"></div></div><span class="stats-bar-val">' + cats[cat] + '</span></div>';
    });

    // Gráfico semanal
    html += '<div class="stats-section-title">TAREFAS POR DIA (última semana)</div>';
    html += '<div class="chart-bars">';

    const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today2 = new Date();
    let maxDay = 1;
    const dayCounts = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today2);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = tasks.filter(t => t.done && t.createdAt && t.createdAt.startsWith(dateStr)).length;
      dayCounts.push({ day: dayNamesShort[d.getDay()], count: count });
      if (count > maxDay) maxDay = count;
    }

    dayCounts.forEach(dc => {
      const h = dc.count > 0 ? Math.max(10, Math.round((dc.count / maxDay) * 80)) : 2;
      html += '<div class="chart-bar-col">' +
        '<span class="chart-bar-val">' + dc.count + '</span>' +
        '<div class="chart-bar" style="height:' + h + 'px"></div>' +
        '<span class="chart-bar-label">' + dc.day + '</span>' +
        '</div>';
    });

    html += '</div>';

    // Gamification info
    if (typeof Gamification !== 'undefined') {
      const info = Gamification.getLevelInfo();
      html += '<div class="stats-section-title">GAMIFICAÇÃO</div>';
      html += '<div class="stats-grid">' +
        '<div class="stat-card"><div class="sc-val yellow">⭐ Nv.' + info.level + '</div><div class="sc-lbl">' + info.name + '</div></div>' +
        '<div class="stat-card"><div class="sc-val green">' + info.xp + '</div><div class="sc-lbl">XP Total</div></div>' +
        '<div class="stat-card"><div class="sc-val red">🔥 ' + info.streak + '</div><div class="sc-lbl">Streak</div></div>' +
        '</div>';
    }

    body.innerHTML = html;
    statsOverlay.classList.add('visible');
  }

  const statsCloseBtn = document.getElementById('statsCloseBtn');
  if (statsCloseBtn) statsCloseBtn.addEventListener('click', () => statsOverlay.classList.remove('visible'));
  if (statsOverlay) statsOverlay.addEventListener('click', (e) => { if (e.target === statsOverlay) statsOverlay.classList.remove('visible'); });

  const btnStats = document.getElementById('btnStats');
  if (btnStats) btnStats.addEventListener('click', openStats);

  // ============================================
  // === HISTORY ===
  // ============================================
  function openHistory() {
    const tasks = TaskManager.getAll().filter(t => t.done);
    const body = document.getElementById('historyBody');
    const count = document.getElementById('historyCount');

    if (!tasks.length) {
      body.innerHTML = '<div class="history-empty">📜 Nenhuma tarefa concluída</div>';
      count.textContent = '0 itens';
      historyOverlay.classList.add('visible');
      return;
    }

    // Group by date
    const groups = {};
    tasks.forEach(t => {
      const date = t.date || 'Sem data';
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });

    body.innerHTML = '';
    Object.keys(groups).forEach(date => {
      const items = groups[date];
      const group = document.createElement('div');
      group.className = 'history-date-group';
      group.innerHTML = '<div class="history-date-label"><span>📅 ' + date + '</span><span class="history-date-count">' + items.length + ' tarefa(s)</span></div>';

      items.forEach(t => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML =
          '<span class="hi-icon">✅</span>' +
          '<div class="hi-body">' +
            '<div class="hi-title">' + escapeForEdit(t.text) + '</div>' +
            '<div class="hi-meta">' +
              '<span class="hi-pri p-' + t.priority + '">' + t.priority.toUpperCase() + '</span>' +
              (t.category ? '<span class="hi-cat">' + t.category + '</span>' : '') +
              (t.project && t.project !== 'Geral' ? '<span class="hi-project">📂 ' + t.project + '</span>' : '') +
            '</div>' +
          '</div>';
        group.appendChild(item);
      });

      body.appendChild(group);
    });

    count.textContent = tasks.length + ' iten(s)';
    historyOverlay.classList.add('visible');
  }

  const historyCloseBtn = document.getElementById('historyCloseBtn');
  if (historyCloseBtn) historyCloseBtn.addEventListener('click', () => historyOverlay.classList.remove('visible'));
  if (historyOverlay) historyOverlay.addEventListener('click', (e) => { if (e.target === historyOverlay) historyOverlay.classList.remove('visible'); });

  const btnHistory = document.getElementById('btnHistory');
  if (btnHistory) btnHistory.addEventListener('click', openHistory);

  // ============================================
  // === FILTER MENU ITEMS ===
  // ============================================
  document.querySelectorAll('.menu-item[data-filter]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
      item.classList.add('active');
      TaskManager.setFilter(item.dataset.filter);
    });
  });

  // Help menu
  const helpMenuItem = document.querySelector('.menu-item[data-action="help"]');
  if (helpMenuItem) helpMenuItem.addEventListener('click', openHelp);

  // ============================================
  // === SORT BUTTONS ===
  // ============================================
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      TaskManager.setSort(btn.dataset.sort);
    });
  });

  // ============================================
  // === GROUP BUTTONS ===
  // ============================================
  document.querySelectorAll('.group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.group-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      TaskManager.setGroup(btn.dataset.group);
    });
  });

  // ============================================
  // === TOGGLE EXTRA ADD BAR ===
  // ============================================
  const btnToggleExtra = document.getElementById('btnToggleExtra');
  const addBarExtra = document.getElementById('addBarExtra');
  if (btnToggleExtra && addBarExtra) {
    btnToggleExtra.addEventListener('click', () => {
      addBarExtra.classList.toggle('visible');
      btnToggleExtra.textContent = addBarExtra.classList.contains('visible') ? '▲' : '▼';
    });
  }

  // ============================================
  // === CHAR COUNTER ===
  // ============================================
  const taskInput = document.getElementById('taskInput');
  const charCounter = document.getElementById('charCounter');
  if (taskInput && charCounter) {
    taskInput.addEventListener('input', () => {
      const len = taskInput.value.length;
      const max = 100;
      charCounter.textContent = len + '/' + max;
      charCounter.className = 'char-counter';
      if (len > max * 0.9) charCounter.classList.add('danger');
      else if (len > max * 0.7) charCounter.classList.add('warn');
    });
  }

  // ============================================
  // === TOOLBAR BUTTONS ===
  // ============================================
  const btnExport = document.getElementById('btnExport');
  if (btnExport) btnExport.addEventListener('click', () => TaskManager.exportJSON());

  const btnImport = document.getElementById('btnImport');
  const importInput = document.getElementById('importInput');
  if (btnImport && importInput) {
    btnImport.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', () => {
      if (importInput.files.length) {
        TaskManager.importJSON(importInput.files[0]);
        importInput.value = '';
      }
    });
  }

  const btnClearDone = document.getElementById('btnClearDone');
  if (btnClearDone) btnClearDone.addEventListener('click', () => TaskManager.clearDone());

  // ============================================
  // === UNDO ===
  // ============================================
  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn) undoBtn.addEventListener('click', () => TaskManager.performUndo());

  // ============================================
  // === WINDOW CONTROLS ===
  // ============================================
  const winMin = document.getElementById('winMin');
  const winMax = document.getElementById('winMax');
  const winClose = document.getElementById('winClose');
  const appWrapper = document.getElementById('appWrapper');
  const minimizedBar = document.getElementById('minimizedBar');
  const shutdownScreen = document.getElementById('shutdownScreen');

  if (winMin) {
    winMin.addEventListener('click', () => {
      if (appWrapper) appWrapper.style.display = 'none';
      if (minimizedBar) minimizedBar.classList.add('visible');
    });
  }

  // Restore from minimized
  const taskbarRestore = document.getElementById('taskbarRestore');
  if (taskbarRestore) {
    taskbarRestore.addEventListener('click', () => {
      if (appWrapper) appWrapper.style.display = 'flex';
      if (minimizedBar) minimizedBar.classList.remove('visible');
    });
  }

  if (winMax) {
    let maximized = false;
    winMax.addEventListener('click', () => {
      maximized = !maximized;
      if (maximized) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  if (winClose) {
    winClose.addEventListener('click', () => {
      if (!confirm('Deseja realmente fechar o sistema?')) return;

      const appW = document.getElementById('appWrapper');
      const sd = document.getElementById('shutdownScreen');
      const sdMsg = document.getElementById('shutdownMsg');

      // Esconder app
      if (appW) appW.style.display = 'none';

      // Mostrar tela de shutdown
      if (sd) {
        sd.classList.add('visible');
        if (sdMsg) sdMsg.classList.remove('visible');

        // Após 2 segundos, tentar fechar a aba
        setTimeout(() => {
          window.close();

          // Se não conseguiu fechar (navegador bloqueia), mostrar mensagem
          setTimeout(() => {
            if (sdMsg) {
              sdMsg.textContent = 'Feche esta aba do navegador para sair';
              sdMsg.classList.add('visible');
            }

            // Clique restaura o app caso queira voltar
            sd.addEventListener('click', () => {
              sd.classList.remove('visible');
              if (sdMsg) sdMsg.classList.remove('visible');
              if (appW) appW.style.display = 'flex';
            });
          }, 1500);
        }, 2000);
      }
    });
  }

  // Taskbar clock
    function updateClock() {
    const now = new Date();
    const time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

    const clock = document.getElementById('clockDisplay');
    if (clock) clock.textContent = time;

    const tbClock = document.getElementById('taskbarClock');
    if (tbClock) tbClock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ============================================
  // === WELCOME MESSAGE ===
  // ============================================
  function showWelcome() {
    const welcomed = localStorage.getItem('fceux_welcomed');
    if (welcomed) return;
    localStorage.setItem('fceux_welcomed', 'true');

    setTimeout(() => {
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast(
          '👋 BEM-VINDO!',
          'FCEUX Task Manager v2.6.6 — Pressione F1 para ver o Help completo!',
          'info',
          8000
        );
      }
    }, 2000);
  }

  // ============================================
  // === BEFORE UNLOAD ===
  // ============================================
  window.addEventListener('beforeunload', (e) => {
    const pending = TaskManager.getPending();
    if (pending > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ============================================
  // === HELPERS ===
  // ============================================
  function escapeForEdit(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0B';
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + 'KB';
    return (bytes / 1048576).toFixed(1) + 'MB';
  }

  // === REMINDERS ===
  function renderReminders() {
    const list = document.getElementById('editReminders');
    if (!list) return;
    list.innerHTML = '';

    if (!tempReminders.length) {
      list.innerHTML = '<div style="padding:4px;color:#999;font-size:11px;font-family:Segoe UI,sans-serif">Nenhum lembrete</div>';
      return;
    }

    tempReminders.forEach((rem, i) => {
      const item = document.createElement('div');
      item.className = 'reminder-item';
      const d = new Date(rem.datetime);
      const dateStr = String(d.getDate()).padStart(2, '0') + '/' +
                      String(d.getMonth() + 1).padStart(2, '0') + ' ' +
                      String(d.getHours()).padStart(2, '0') + ':' +
                      String(d.getMinutes()).padStart(2, '0');
      item.innerHTML =
        '<span class="rem-time">⏰ ' + dateStr + '</span>' +
        (rem.fired ? '<span style="color:#00cc66;font-size:10px">✅ disparado</span>' : '') +
        '<span class="rem-del" data-i="' + i + '">✕</span>';
      list.appendChild(item);
    });

    list.querySelectorAll('.rem-del').forEach(d => {
      d.addEventListener('click', () => {
        tempReminders.splice(Number(d.dataset.i), 1);
        renderReminders();
      });
    });
  }

  const reminderAddBtn = document.getElementById('reminderAddBtn');
  const reminderInput = document.getElementById('reminderInput');
  if (reminderAddBtn && reminderInput) {
    reminderAddBtn.addEventListener('click', () => {
      const val = reminderInput.value;
      if (!val) return;
      tempReminders.push({ datetime: val, fired: false });
      reminderInput.value = '';
      renderReminders();
    });
  }

  // === ABOUT ===
  const aboutCloseBtn = document.getElementById('aboutCloseBtn');
  if (aboutCloseBtn) aboutCloseBtn.addEventListener('click', () => {
    document.getElementById('aboutOverlay').classList.remove('visible');
  });

  const aboutOverlay = document.getElementById('aboutOverlay');
  if (aboutOverlay) aboutOverlay.addEventListener('click', (e) => {
    if (e.target === aboutOverlay) aboutOverlay.classList.remove('visible');
  });

  const btnAbout = document.getElementById('btnAbout');
  if (btnAbout) btnAbout.addEventListener('click', () => {
    document.getElementById('aboutOverlay').classList.add('visible');
  });

  // === PUBLIC API ===
  return {
    openEdit: openEdit,
    closeEdit: closeEdit,
    openHelp: openHelp,
    closeHelp: closeHelp,
    openStats: openStats,
    showWelcome: showWelcome
  };
})();