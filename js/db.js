/**
 * db.js — Camada de acesso ao IndexedDB
 */
const TaskDB = (() => {
  const DB_NAME = 'FCEUXTaskDB';
  const DB_VERSION = 1;
  const STORE = 'tasks';
  let db = null;

  function open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) {
          const s = d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          s.createIndex('priority', 'priority', { unique: false });
          s.createIndex('done', 'done', { unique: false });
          s.createIndex('category', 'category', { unique: false });
          s.createIndex('dueDate', 'dueDate', { unique: false });
          s.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function _s(mode) {
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  function add(task) {
    return new Promise((res, rej) => {
      const r = _s('readwrite').add(task);
      r.onsuccess = () => res(r.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }

  function update(task) {
    return new Promise((res, rej) => {
      const r = _s('readwrite').put(task);
      r.onsuccess = () => res();
      r.onerror = (e) => rej(e.target.error);
    });
  }

  function remove(id) {
    return new Promise((res, rej) => {
      const r = _s('readwrite').delete(id);
      r.onsuccess = () => res();
      r.onerror = (e) => rej(e.target.error);
    });
  }

  function getAll() {
    return new Promise((res, rej) => {
      const r = _s('readonly').getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = (e) => rej(e.target.error);
    });
  }

  function clear() {
    return new Promise((res, rej) => {
      const r = _s('readwrite').clear();
      r.onsuccess = () => res();
      r.onerror = (e) => rej(e.target.error);
    });
  }

  async function migrateFromLocalStorage() {
    try {
      const old = localStorage.getItem('fceux_tasks');
      if (!old) return;
      const arr = JSON.parse(old);
      for (const t of arr) {
        await add({
          text: t.text,
          priority: t.priority || t.pr || 'media',
          done: t.done || false,
          date: t.date || '',
          description: t.description || '',
          dueDate: t.dueDate || '',
          category: t.category || '',
          createdAt: t.createdAt || new Date().toISOString()
        });
      }
      localStorage.removeItem('fceux_tasks');
      console.log('[DB] Migracao concluida:', arr.length, 'tarefas');
    } catch (e) {
      console.error('[DB] Erro migracao:', e);
    }
  }

  return { open, add, update, remove, getAll, clear, migrateFromLocalStorage };
})();