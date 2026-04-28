/**
 * quickadd.js — Popup de tarefa rápida (Ctrl+N)
 * Depende de: tasks.js, db.js
 */
const QuickAdd = (() => {
  const overlay = document.getElementById('quickaddOverlay');
  const input = document.getElementById('qaInput');

  function open() {
    if (input) input.value = '';
    const qaPri = document.getElementById('qaPri');
    if (qaPri) qaPri.value = 'media';
    const qaDue = document.getElementById('qaDue');
    if (qaDue) qaDue.value = '';
    const qaCat = document.getElementById('qaCat');
    if (qaCat) qaCat.value = '';
    const qaDueTime = document.getElementById('qaDueTime');
    if (qaDueTime) qaDueTime.value = '';
    if (overlay) overlay.classList.add('visible');
    if (input) setTimeout(() => input.focus(), 50);
  }

  function close() {
    if (overlay) overlay.classList.remove('visible');
    if (input) input.value = '';
  }

  async function submit() {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const now = new Date();
    const date = String(now.getDate()).padStart(2, '0') + '/' +
                 String(now.getMonth() + 1).padStart(2, '0') + '/' +
                 now.getFullYear();

    const qaPri = document.getElementById('qaPri');
    const qaDue = document.getElementById('qaDue');
    const qaDueTime = document.getElementById('qaDueTime');
    const qaCat = document.getElementById('qaCat');

    const task = {
      text: text,
      priority: qaPri ? qaPri.value : 'media',
      done: false,
      date: date,
      description: '',
      dueDate: qaDue ? qaDue.value : '',
      dueTime: qaDueTime ? qaDueTime.value : '',
      category: qaCat ? qaCat.value : '',
      createdAt: now.toISOString(),
      subtasks: [],
      tags: [],
      project: 'Geral',
      recurrence: '',
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
      Notifications.showToast('⚡ RÁPIDA', '"' + text + '" adicionada!', 'success', 2500);
    }
    if (typeof Projects !== 'undefined') Projects.renderBar();
  }

  // Events — protegidos
  const qaSubmit = document.getElementById('qaSubmit');
  if (qaSubmit) qaSubmit.addEventListener('click', submit);

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      if (e.key === 'Escape') close();
    });
  }

  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return { open, close };
})();