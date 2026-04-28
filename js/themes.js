/**
 * themes.js — Sistema de temas
 */
const Themes = (() => {
  const STORAGE_KEY = 'fceux_theme';
  let currentTheme = 'dark';

  const themes = {
    dark: { name: 'FCEUX Dark', class: '' },
    matrix: { name: 'Matrix Green', class: 'theme-matrix' },
    cyberpunk: { name: 'Cyberpunk', class: 'theme-cyberpunk' },
    ocean: { name: 'Ocean Blue', class: 'theme-ocean' }
  };

  function load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && themes[saved]) currentTheme = saved;
  }

  function save() { localStorage.setItem(STORAGE_KEY, currentTheme); }

  function apply(theme) {
    if (!themes[theme]) return;
    // Remover todas as classes de tema
    Object.values(themes).forEach(t => {
      if (t.class) document.body.classList.remove(t.class);
    });
    // Aplicar novo tema
    currentTheme = theme;
    if (themes[theme].class) document.body.classList.add(themes[theme].class);
    save();
  }

  function getCurrent() { return currentTheme; }
  function getAll() { return themes; }

  function init() {
    load();
    apply(currentTheme);
  }

  return { init, apply, getCurrent, getAll };
})();