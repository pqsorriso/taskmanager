/**
 * themes.js — Sistema de temas (8 temas)
 */
const Themes = (() => {
  const STORAGE_KEY = 'fceux_theme';
  let currentTheme = 'dark';

  const themes = {
    dark:      { name: '🌙 FCEUX Dark',    class: '' },
    matrix:    { name: '💚 Matrix Green',   class: 'theme-matrix' },
    cyberpunk: { name: '💜 Cyberpunk',      class: 'theme-cyberpunk' },
    ocean:     { name: '🌊 Ocean Blue',     class: 'theme-ocean' },
    dracula:   { name: '🧛 Dracula',        class: 'theme-dracula' },
    nord:      { name: '❄️ Nord',           class: 'theme-nord' },
    sunset:    { name: '🌅 Sunset',         class: 'theme-sunset' },
    light:     { name: '☀️ Light Mode',     class: 'theme-light' }
  };

  function load() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && themes[saved]) currentTheme = saved;
  }

  function save() { localStorage.setItem(STORAGE_KEY, currentTheme); }

  function apply(theme) {
    if (!themes[theme]) return;
    Object.values(themes).forEach(function(t) {
      if (t.class) document.body.classList.remove(t.class);
    });
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

  return { init: init, apply: apply, getCurrent: getCurrent, getAll: getAll };
})();