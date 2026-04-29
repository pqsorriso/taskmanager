/**
 * commands.js — Paleta de comandos rápidos (/)
 * Depende de: tasks.js, ui.js, views.js, pomodoro.js
 */
const Commands = (() => {
  const overlay = document.getElementById('cmdOverlay');
  const input = document.getElementById('cmdInput');
  const results = document.getElementById('cmdResults');
  let activeIdx = 0;
  let filteredCmds = [];

  const allCommands = [
    { icon: '➕', label: 'Nova tarefa', shortcut: '', action: () => { close(); document.getElementById('taskInput').focus(); } },
    { icon: '▼', label: 'Campos extras', shortcut: '', action: () => { close(); document.getElementById('btnToggleExtra').click(); } },
    { icon: '📊', label: 'Estatísticas', shortcut: '', action: () => { close(); document.getElementById('btnStats').click(); } },
    { icon: '📜', label: 'Histórico', shortcut: '', action: () => { close(); document.getElementById('btnHistory').click(); } },
    { icon: '🍅', label: 'Pomodoro', shortcut: '', action: () => { close(); document.getElementById('btnPomo').click(); } },
    { icon: '📤', label: 'Exportar tarefas', shortcut: '', action: () => { close(); TaskManager.exportJSON(); } },
    { icon: '📥', label: 'Importar tarefas', shortcut: '', action: () => { close(); document.getElementById('btnImport').click(); } },
    { icon: '🗑', label: 'Limpar concluídas', shortcut: '', action: () => { close(); TaskManager.clearDone(); } },
    { icon: '☰', label: 'View: Lista', shortcut: '', action: () => { close(); Views.setView('list'); document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active')); document.querySelector('.view-btn[data-view="list"]').classList.add('active'); } },
    { icon: '▦', label: 'View: Kanban', shortcut: '', action: () => { close(); Views.setView('kanban'); document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active')); document.querySelector('.view-btn[data-view="kanban"]').classList.add('active'); } },
    { icon: '📅', label: 'View: Calendário', shortcut: '', action: () => { close(); Views.setView('calendar'); document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active')); document.querySelector('.view-btn[data-view="calendar"]').classList.add('active'); } },
    { icon: '📋', label: 'Filtro: Todas', shortcut: '', action: () => { close(); TaskManager.setFilter('all'); } },
    { icon: '⏳', label: 'Filtro: Pendentes', shortcut: '', action: () => { close(); TaskManager.setFilter('pending'); } },
    { icon: '✅', label: 'Filtro: Concluídas', shortcut: '', action: () => { close(); TaskManager.setFilter('completed'); } },
    { icon: '🔴', label: 'Filtro: Alta', shortcut: '', action: () => { close(); TaskManager.setFilter('alta'); } },
    { icon: '🟡', label: 'Filtro: Média', shortcut: '', action: () => { close(); TaskManager.setFilter('media'); } },
    { icon: '🟢', label: 'Filtro: Baixa', shortcut: '', action: () => { close(); TaskManager.setFilter('baixa'); } },
    { icon: '⚡', label: 'Ordem: Prioridade', shortcut: '', action: () => { close(); TaskManager.setSort('priority'); } },
    { icon: '📅', label: 'Ordem: Vence ↑', shortcut: '', action: () => { close(); TaskManager.setSort('due_asc'); } },
    { icon: '🕐', label: 'Ordem: Recente', shortcut: '', action: () => { close(); TaskManager.setSort('created_desc'); } },
    { icon: '🔤', label: 'Ordem: A-Z', shortcut: '', action: () => { close(); TaskManager.setSort('alpha'); } },
    { icon: '📖', label: 'Ajuda', shortcut: 'F1', action: () => { close(); TaskUI.openHelp(); } },
    { icon: '📝', label: 'Bloco de notas', shortcut: '', action: () => { close(); if (typeof Notepad !== 'undefined') Notepad.open(); } },
    { icon: '─', label: 'Minimizar', shortcut: '', action: () => { close(); document.getElementById('btnMin').click(); } },
    { icon: '□', label: 'Maximizar', shortcut: '', action: () => { close(); document.getElementById('btnMax').click(); } },
    { icon: '🟢', label: 'Modo Matrix (screensaver)', shortcut: '', action: () => { close(); if (typeof Matrix !== 'undefined') Matrix.start(); } },
    { icon: '🎯', label: 'Modo Foco', shortcut: '', action: () => { close(); if (typeof FocusMode !== 'undefined') FocusMode.open(); } },
    { icon: '🖨️', label: 'Imprimir lista', shortcut: '', action: () => { close(); if (typeof PrintView !== 'undefined') PrintView.print(); } },
    { icon: '😊', label: 'Falar com mascote', shortcut: '', action: () => { close(); if (typeof Mascot !== 'undefined') { Mascot.setState('celebrate', 3000); } } },
    { icon: '🤖', label: 'Personalizar mascote', shortcut: '', action: () => { close(); if (typeof Mascot !== 'undefined') Mascot.openConfig(); } },
    { icon: '⏳', label: 'Countdown / Deadlines', shortcut: '', action: () => { close(); if (typeof Countdown !== 'undefined') Countdown.open(); } },
    { icon: '🎨', label: 'Trocar tema', shortcut: '', action: () => { close(); if (typeof Config !== 'undefined') Config.open(); } },
    { icon: 'ℹ️', label: 'Sobre / About', shortcut: '', action: () => { close(); document.getElementById('aboutOverlay').classList.add('visible'); } },
    { icon: '🏆', label: 'Conquistas / Badges', shortcut: '', action: () => { close(); if (typeof Badges !== 'undefined') Badges.open(); } },
    { icon: '👋', label: 'Tour / Onboarding', shortcut: '', action: () => { close(); if (typeof Onboarding !== 'undefined') Onboarding.show(); } },
    { icon: '💾', label: 'Restaurar backup', shortcut: '', action: () => { close(); if (typeof Backup !== 'undefined') Backup.restore(); } },
    { icon: '🤖', label: 'Conversar com PIXEL', shortcut: '', action: () => { close(); if (typeof PixelAI !== 'undefined') PixelAI.open(); } },
    { icon: '🕵️', label: 'Modo Boss (Ctrl+B)', shortcut: 'Ctrl+B', action: () => { close(); BossMode.toggle(); } },
    { icon: '📊', label: 'Relatório Semanal', shortcut: '', action: () => { close(); Weekly.open(); } },
  ];

  function open() {
    input.value = '';
    activeIdx = 0;
    filterCommands('');
    overlay.classList.add('visible');
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    overlay.classList.remove('visible');
    input.value = '';
  }

  function filterCommands(query) {
    const q = query.toLowerCase();
    filteredCmds = q ? allCommands.filter(c => c.label.toLowerCase().includes(q)) : allCommands;
    activeIdx = 0;
    renderResults();
  }

  function renderResults() {
    results.innerHTML = '';
    filteredCmds.forEach((cmd, i) => {
      const item = document.createElement('div');
      item.className = 'cmd-item' + (i === activeIdx ? ' active' : '');
      item.innerHTML =
        '<span class="cmd-icon">' + cmd.icon + '</span>' +
        '<span class="cmd-label">' + cmd.label + '</span>' +
        (cmd.shortcut ? '<span class="cmd-shortcut">' + cmd.shortcut + '</span>' : '');
      item.addEventListener('click', () => cmd.action());
      item.addEventListener('mouseenter', () => {
        activeIdx = i;
        renderResults();
      });
      results.appendChild(item);
    });
  }

  function executeActive() {
    if (filteredCmds[activeIdx]) filteredCmds[activeIdx].action();
  }

  // Events
  input.addEventListener('input', () => filterCommands(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = (activeIdx + 1) % filteredCmds.length;
      renderResults();
      const active = results.querySelector('.active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = (activeIdx - 1 + filteredCmds.length) % filteredCmds.length;
      renderResults();
      const active = results.querySelector('.active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeActive();
    } else if (e.key === 'Escape') {
      close();
    }
  });

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Global shortcut: / or Ctrl+K
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
      open();
    }
  });

  function init() {}

  return { init, open, close };
})();