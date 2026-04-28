/**
 * dashbar.js — Mini Dashboard Bar
 * Mostra resumo do dia + frase motivacional
 */
const DashBar = (() => {
  const quotes = [
    'Foco é poder.',
    'Uma tarefa de cada vez.',
    'Progresso, não perfeição.',
    'Comece pelo mais difícil.',
    'Disciplina supera motivação.',
    'Pequenos passos, grandes resultados.',
    'Feito é melhor que perfeito.',
    'O segredo é começar.',
    'Consistência é a chave.',
    'Hoje é dia de produzir.',
    'Menos conversa, mais ação.',
    'Seu futuro agradece seu esforço.',
    'Cada tarefa concluída é uma vitória.',
    'Não deixe pra amanhã.',
    'A excelência é um hábito.',
    'Trabalhe enquanto eles dormem.',
    'Resultados exigem persistência.',
    'Planeje, execute, conquiste.',
    'O tempo não espera ninguém.',
    'Faça acontecer.',
    'Ação gera motivação.',
    'Você é capaz de mais.',
    'Um passo à frente do ontem.',
    'Produtividade é liberdade.',
    'Acredite no processo.',
    'O difícil se torna fácil com prática.',
    'Transforme planos em ações.',
    'Quem organiza, conquista.',
    'Sem desculpas, só resultados.',
    'A jornada é o destino.'
  ];

  let currentQuoteIdx = 0;
  let quoteInterval = null;

  function getTodayStr() {
    const now = new Date();
    return now.getFullYear() + '-' +
           String(now.getMonth() + 1).padStart(2, '0') + '-' +
           String(now.getDate()).padStart(2, '0');
  }

  function update() {
    const tasks = TaskManager.getAll();
    const today = getTodayStr();

    // Tarefas de hoje (criadas hoje ou com vencimento hoje)
    const todayTasks = tasks.filter(t =>
      (t.dueDate === today) ||
      (t.createdAt && t.createdAt.startsWith(today))
    );

    // Remover duplicatas
    const uniqueIds = new Set();
    const uniqueTodayTasks = todayTasks.filter(t => {
      if (uniqueIds.has(t.id)) return false;
      uniqueIds.add(t.id);
      return true;
    });

    const todayDone = uniqueTodayTasks.filter(t => t.done).length;
    const todayTotal = uniqueTodayTasks.length;
    const pct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

    // Atrasadas
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(t => {
      if (t.done || !t.dueDate) return false;
      return new Date(t.dueDate + 'T00:00:00') < now;
    }).length;

    // Tempo focado hoje
    let timeTodaySeconds = 0;
    tasks.forEach(t => {
      if (t.timeSpent && t.createdAt && t.createdAt.startsWith(today)) {
        timeTodaySeconds += t.timeSpent;
      }
    });
    const timeH = Math.floor(timeTodaySeconds / 3600);
    const timeM = Math.floor((timeTodaySeconds % 3600) / 60);
    const timeStr = timeH > 0 ? timeH + 'h' + String(timeM).padStart(2, '0') + 'm' : timeM + 'min';

    // Atualizar DOM
    const dbTodayDone = document.getElementById('dbTodayDone');
    const dbTodayTotal = document.getElementById('dbTodayTotal');
    const dbTodayPct = document.getElementById('dbTodayPct');
    const dbTodayFill = document.getElementById('dbTodayFill');
    const dbStreak = document.getElementById('dbStreak');
    const dbLevel = document.getElementById('dbLevel');
    const dbTimeToday = document.getElementById('dbTimeToday');
    const dbOverdue = document.getElementById('dbOverdue');

    if (dbTodayDone) dbTodayDone.textContent = todayDone;
    if (dbTodayTotal) dbTodayTotal.textContent = todayTotal;
    if (dbTodayPct) dbTodayPct.textContent = pct + '%';

    if (dbTodayFill) {
      dbTodayFill.style.width = pct + '%';
      dbTodayFill.className = 'db-progress-fill';
      if (pct < 30) dbTodayFill.classList.add('low');
      else if (pct < 70) dbTodayFill.classList.add('medium');
    }

    // Gamification
    if (typeof Gamification !== 'undefined') {
      const info = Gamification.getLevelInfo();
      if (dbStreak) dbStreak.textContent = '🔥 ' + info.streak;
      if (dbLevel) dbLevel.textContent = '⭐ Nv.' + info.level;
    }

    if (dbTimeToday) dbTimeToday.textContent = timeStr;
    if (dbOverdue) dbOverdue.textContent = overdue;
  }

  function rotateQuote() {
    currentQuoteIdx = Math.floor(Math.random() * quotes.length);
    const dbQuote = document.getElementById('dbQuote');
    if (dbQuote) dbQuote.textContent = '💬 "' + quotes[currentQuoteIdx] + '"';
  }

  function init() {
    // Primeira frase aleatória
    rotateQuote();

    // Trocar frase a cada 30 segundos
    quoteInterval = setInterval(rotateQuote, 30000);

    // Atualizar dados a cada 5 segundos
    setInterval(update, 5000);

    // Primeira atualização
    update();
  }

  return { init, update };
})();