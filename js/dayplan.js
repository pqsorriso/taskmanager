/**
 * dayplan.js — Planejamento do dia + Resumo do dia + Dica do dia
 * Mostra ao abrir de manhã e resumo às 18h
 */
var DayPlan = (function() {
  var PLAN_KEY = 'fceux_dayplan';
  var SUMMARY_KEY = 'fceux_daysummary';
  var popup = document.getElementById('dayplanPopup');
  var tipShown = false;

  var tips = [
    '💡 Use linguagem natural: "reunião amanhã 14h alta trabalho"',
    '💡 Ctrl+N abre tarefa rápida sem sair do que está fazendo',
    '💡 / ou Ctrl+K abre a paleta de comandos',
    '💡 Clique 2x no PIXEL pra conversar com a IA',
    '💡 Arraste o PIXEL pela tela — ele fica onde você quiser',
    '💡 Tarefas com ★ ficam fixas no topo da lista',
    '💡 Use o Pomodoro (🍅) pra manter o foco — 25min de concentração',
    '💡 Exporte seus dados (📤 EXPORT) regularmente como backup',
    '💡 Shift+Click seleciona múltiplas tarefas de uma vez',
    '💡 Tarefas recorrentes pulam fins de semana automaticamente',
    '💡 A auto-escala sobe prioridade quando o prazo se aproxima',
    '💡 O Countdown mostra alertas nos 5 min finais com fogos!',
    '💡 Ctrl+B ativa o Modo Boss — tela fake de planilha 😎',
    '💡 Duplo-clique numa tarefa abre o editor completo',
    '💡 Hábitos com meta > 1 viram contadores (ex: 8 copos de água)',
    '💡 O PIXEL evolui com seu nível — chega a ganhar uma coroa! 👑',
    '💡 Pet BYTE aparece no nível 5 e evolui até dragão no nível 10! 🐉',
    '💡 Conquistas (🏆 BADGES) desbloqueiam conforme você usa o app',
    '💡 O desafio diário muda todo dia — complete pra XP extra!',
    '💡 Modo Foco (🎯) esconde tudo e mostra só suas tarefas',
  ];

  var motivations = [
    '"O segredo de progredir é começar." — Mark Twain',
    '"Foco não é dizer sim. É dizer não pras outras coisas." — Steve Jobs',
    '"Cada tarefa concluída é um passo rumo ao objetivo."',
    '"Disciplina é a ponte entre metas e conquistas."',
    '"Não espere por motivação. Crie disciplina."',
    '"O melhor momento pra começar foi ontem. O segundo melhor é agora."',
    '"Pequenos progressos diários levam a grandes resultados."',
    '"Você não precisa ser perfeito. Precisa ser consistente."',
    '"Produtividade não é fazer mais. É fazer o que importa."',
    '"Seu futuro eu agradece o esforço de hoje."',
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function getTodayStr() { return new Date().toISOString().slice(0, 10); }

  function getGreeting() {
    var h = new Date().getHours();
    if (h >= 5 && h < 12) return '☀️ Bom dia!';
    if (h >= 12 && h < 18) return '🌤️ Boa tarde!';
    if (h >= 18 && h < 22) return '🌙 Boa noite!';
    return '🌃 Boa madrugada!';
  }

  // === PLANEJAMENTO DO DIA ===
  function showDayPlan() {
    var today = getTodayStr();
    var shown = localStorage.getItem(PLAN_KEY);
    if (shown === today) return;

    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var pending = tasks.filter(function(t) { return !t.done; });
    var todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    var overdue = pending.filter(function(t) {
      return t.dueDate && new Date(t.dueDate + 'T00:00:00') < todayDate;
    });
    var dueToday = pending.filter(function(t) { return t.dueDate === today; });
    var alta = pending.filter(function(t) { return t.priority === 'alta'; });

    var habits = [];
    try { habits = JSON.parse(localStorage.getItem('fceux_habits') || '[]'); } catch(e) {}

    var streak = 0;
    if (typeof Gamification !== 'undefined') {
      streak = Gamification.getLevelInfo().streak;
    }

    var greeting = document.getElementById('dpGreeting');
    var stats = document.getElementById('dpStats');
    var motivation = document.getElementById('dpMotivation');

    if (greeting) greeting.textContent = getGreeting();

    if (stats) {
      var html = '📋 <b>' + pending.length + '</b> tarefas pendentes\n';
      if (dueToday.length > 0) html += '⚠️ <b>' + dueToday.length + '</b> vencem HOJE\n';
      if (overdue.length > 0) html += '🚨 <b>' + overdue.length + '</b> atrasadas\n';
      if (alta.length > 0) html += '🔴 <b>' + alta.length + '</b> prioridade alta\n';
      if (habits.length > 0) html += '🎯 <b>' + habits.length + '</b> hábitos pra marcar\n';
      if (streak > 0) html += '🔥 Streak: <b>' + streak + '</b> dias — não quebre!\n';
      html += '\n🤖 PIXEL está pronto pra te ajudar!';
      stats.innerHTML = html.replace(/\n/g, '<br>');
    }

    if (motivation) motivation.textContent = pick(motivations);

    if (popup) popup.classList.add('visible');
    localStorage.setItem(PLAN_KEY, today);

    if (typeof Sounds !== 'undefined') Sounds.notification();
  }

  var dpDismiss = document.getElementById('dpDismiss');
  if (dpDismiss) {
    dpDismiss.addEventListener('click', function() {
      if (popup) popup.classList.remove('visible');
    });
  }

  // === RESUMO DO DIA (18h) ===
  function checkDaySummary() {
    var now = new Date();
    var h = now.getHours();
    var today = getTodayStr();
    var shown = localStorage.getItem(SUMMARY_KEY);

    var endHour = 18;
    if (typeof Workdays !== 'undefined') {
      var wh = Workdays.getWorkHours();
      if (wh && wh.end) endHour = parseInt(wh.end.split(':')[0]) || 18;
    }
    if (h >= endHour && shown !== today) {
      showDaySummary();
      localStorage.setItem(SUMMARY_KEY, today);
    }
  }

  function showDaySummary() {
    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var today = getTodayStr();
    var doneToday = tasks.filter(function(t) {
      if (!t.done) return false;
      if (t.completedAt && t.completedAt.startsWith(today)) return true;
      if (t.createdAt && t.createdAt.startsWith(today)) return true;
      return false;
    });

    var score = 'F';
    var emoji = '😢';
    if (doneToday.length >= 10) { score = 'S'; emoji = '🏆'; }
    else if (doneToday.length >= 7) { score = 'A'; emoji = '🔥'; }
    else if (doneToday.length >= 5) { score = 'B'; emoji = '⭐'; }
    else if (doneToday.length >= 3) { score = 'C'; emoji = '👍'; }
    else if (doneToday.length >= 1) { score = 'D'; emoji = '💪'; }

    var msg = emoji + ' RESUMO DO DIA\n\n' +
      '✅ Tarefas concluídas: ' + doneToday.length + '\n' +
      '📊 Nota: ' + score + '\n\n';

    if (score === 'S') msg += '🏆 INSANO! Dia PERFEITO!';
    else if (score === 'A') msg += '🔥 Dia EXCELENTE! Continue assim!';
    else if (score === 'B') msg += '⭐ Bom dia! Acima da média!';
    else if (score === 'C') msg += '👍 Dia OK! Amanhã pode ser melhor!';
    else if (score === 'D') msg += '💪 Pelo menos fez algo! Amanhã com tudo!';
    else msg += '😴 Dia fraco... mas amanhã é novo!';

    if (typeof Notifications !== 'undefined') {
      Notifications.showToast(emoji + ' RESUMO', 'Nota: ' + score + ' — ' + doneToday.length + ' tarefas', 'info', 8000);
    }

    if (typeof Mascot !== 'undefined') {
      if (score === 'S' || score === 'A') Mascot.setState('celebrate', 5000);
      else if (score === 'D' || score === 'F') Mascot.setState('sad', 3000);
    }

    // Mostrar no chat do PIXEL
    if (typeof PixelAI !== 'undefined') {
      PixelAI.open();
      setTimeout(function() {
        var chatBody = document.getElementById('pixelChatBody');
        if (chatBody) {
          var msgEl = document.createElement('div');
          msgEl.className = 'pixel-msg bot';
          msgEl.innerHTML = '<span class="pm-icon">🤖</span>' + msg.replace(/\n/g, '<br>');
          chatBody.appendChild(msgEl);
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      }, 500);
    }
  }

  // === DICA DO DIA ===
  function getDailyTip() {
    var today = getTodayStr();
    var seed = today.split('-').reduce(function(a, b) { return a + parseInt(b); }, 0);
    return tips[seed % tips.length];
  }

  function showTipInDashbar() {
    var tipEl = document.getElementById('dashbarTip');
    if (tipEl) {
      tipEl.textContent = getDailyTip();
      tipEl.title = getDailyTip();
    }
  }

  // === PIXEL REAGE A DIGITAÇÃO ===
  function initTypingReaction() {
    var taskInput = document.getElementById('taskInput');
    if (!taskInput) return;

    var typingTimer = null;
    taskInput.addEventListener('input', function() {
      if (typeof Mascot !== 'undefined') {
        Mascot.setState('focus', 0);
      }
      if (typingTimer) clearTimeout(typingTimer);
      typingTimer = setTimeout(function() {
        if (typeof Mascot !== 'undefined') {
          Mascot.evaluateState();
        }
      }, 2000);
    });
  }

  function init() {
    // Planejamento do dia após 3 segundos
    setTimeout(showDayPlan, 3000);

    // Dica do dia na dashbar
    setTimeout(showTipInDashbar, 2000);

    // Verificar resumo a cada 5 minutos
    setInterval(checkDaySummary, 300000);

    // PIXEL reage a digitação
    initTypingReaction();
  }

  return { init: init, showDayPlan: showDayPlan, getDailyTip: getDailyTip };
})();