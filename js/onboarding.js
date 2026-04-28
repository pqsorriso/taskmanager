/**
 * onboarding.js — Tour guiado primeira vez
 */
const Onboarding = (() => {
  const STORAGE_KEY = 'fceux_onboarded';
  const overlay = document.getElementById('onboardingOverlay');
  let step = 0;

  const steps = [
    { icon: '🤖', title: 'Bem-vindo ao FCEUX!', text: 'O gerenciador de tarefas mais completo do mundo. 110+ features, zero dependências, 100% gratuito.\n\nVamos fazer um tour rápido?' },
    { icon: '📋', title: 'Criando Tarefas', text: 'Digite no campo >> e clique ADD.\n\nUse linguagem natural:\n"reunião amanhã 14h alta trabalho"\n\nO app detecta data, hora, prioridade e categoria automaticamente!' },
    { icon: '⭐', title: 'Favoritos & Organização', text: '★ Clique na estrela pra fixar no topo\n📂 Use projetos pra organizar\n📋 Arraste pelo ⠿ pra reordenar\n🔍 Busque, filtre e agrupe' },
    { icon: '👁️', title: 'Visualizações', text: '☰ Lista — visão padrão\n▦ Kanban — A Fazer → Fazendo → Feito\n📅 Calendário — mês e semana\n🎯 Eisenhower — urgente vs importante' },
    { icon: '🍅', title: 'Produtividade', text: '🍅 Pomodoro com mini timer flutuante\n🎯 Modo Foco — tela minimalista\n⏱ Time Tracking em cada tarefa\n📏 Estimativa vs tempo real\n⏳ Countdown pra deadlines' },
    { icon: '🎮', title: 'Gamificação', text: '⭐ Ganhe XP completando tarefas\n🔥 Mantenha seu streak diário\n🏆 Desbloqueie 30+ conquistas\n🎯 Desafios diários com bônus XP\n🤖 PIXEL evolui com seu nível!' },
    { icon: '🤖', title: 'Mascote PIXEL', text: 'Seu companheiro robô!\n\n1 clique = frase motivacional\n3 cliques = personalizar\n10 cliques rápidos = mini-game!\n\nEle reage às suas ações, clima e horário.' },
    { icon: '⌨️', title: 'Atalhos', text: 'Ctrl+N — Tarefa rápida\n/ ou Ctrl+K — Paleta de comandos\nF1 — Help completo\n↑↓ — Navegar\nEspaço — Completar\nShift+Click — Seleção múltipla' },
    { icon: '🚀', title: 'Tudo pronto!', text: 'Você tem 110+ features à disposição.\n\nDica: explore o menu ⚙️ CONFIG pra personalizar temas, sons e muito mais.\n\nBoa produtividade! 💪' },
  ];

  function show() {
    step = 0;
    renderStep();
    if (overlay) overlay.classList.add('visible');
  }

  function hide() {
    if (overlay) overlay.classList.remove('visible');
    localStorage.setItem(STORAGE_KEY, 'true');
  }

  function renderStep() {
    const s = steps[step];
    const icon = document.getElementById('obIcon');
    const title = document.getElementById('obTitle');
    const text = document.getElementById('obText');
    const dots = document.getElementById('obDots');
    const nextBtn = document.getElementById('obNext');

    if (icon) icon.textContent = s.icon;
    if (title) title.textContent = s.title;
    if (text) text.innerHTML = s.text.replace(/\n/g, '<br>');

    if (dots) {
      dots.innerHTML = '';
      steps.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'ob-dot';
        if (i < step) dot.classList.add('done');
        if (i === step) dot.classList.add('active');
        dots.appendChild(dot);
      });
    }

    if (nextBtn) {
      nextBtn.textContent = step === steps.length - 1 ? 'Começar! 🚀' : 'Próximo →';
    }
  }

  function next() {
    step++;
    if (step >= steps.length) {
      hide();
      if (typeof Sounds !== 'undefined') Sounds.startup();
      return;
    }
    if (typeof Sounds !== 'undefined') Sounds.click();
    renderStep();
  }

  // Binds
  const obNext = document.getElementById('obNext');
  if (obNext) obNext.addEventListener('click', next);

  const obSkip = document.getElementById('obSkip');
  if (obSkip) obSkip.addEventListener('click', hide);

  function init() {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setTimeout(show, 1500);
    }
  }

  return { init, show };
})();