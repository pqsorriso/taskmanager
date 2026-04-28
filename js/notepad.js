/**
 * notepad.js — Bloco de notas rápidas
 * Salva no localStorage separado
 */
const Notepad = (() => {
  const STORAGE_KEY = 'fceux_notepad';
  const overlay = document.getElementById('notepadOverlay');
  const textarea = document.getElementById('notepadTextarea');
  const charCount = document.getElementById('notepadCharCount');

  function open() {
    if (textarea) textarea.value = localStorage.getItem(STORAGE_KEY) || '';
    updateCount();
    if (overlay) overlay.classList.add('visible');
    if (textarea) setTimeout(() => textarea.focus(), 50);
  }

  function close() {
    save();
    if (overlay) overlay.classList.remove('visible');
  }

  function save() {
    if (textarea) localStorage.setItem(STORAGE_KEY, textarea.value);
  }

  function clear() {
    if (!confirm('Limpar todas as anotações?')) return;
    if (textarea) textarea.value = '';
    save();
    updateCount();
  }

  function updateCount() {
    if (charCount && textarea) charCount.textContent = textarea.value.length + ' caracteres';
  }

  // Auto-save
  let autoSaveTimer = null;
  if (textarea) textarea.addEventListener('input', () => {
    updateCount();
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(save, 3000);
  });

  // Binds — proteger todos os getElementById
  const notepadCloseBtn = document.getElementById('notepadCloseBtn');
  if (notepadCloseBtn) notepadCloseBtn.addEventListener('click', close);

  const notepadClearBtn = document.getElementById('notepadClearBtn');
  if (notepadClearBtn) notepadClearBtn.addEventListener('click', clear);

  const btnNotepad = document.getElementById('btnNotepad');
  if (btnNotepad) btnNotepad.addEventListener('click', open);

  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  return { open, close };
})();