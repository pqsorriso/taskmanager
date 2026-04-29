/**
 * pixelai.js — Cérebro do PIXEL
 * IA simulada que analisa tarefas, hábitos, produtividade
 * e conversa com o usuário de forma inteligente
 */
var PixelAI = (function() {
  var overlay = document.getElementById('pixelChatOverlay');
  var chatBody = document.getElementById('pixelChatBody');
  var chatInput = document.getElementById('pixelChatInput');
  var messages = [];
  var lastProactive = 0;
  var personality = 'friendly';

  // === CONTEXTO ===
  function getContext() {
    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var now = new Date();
    var today = now.toISOString().slice(0, 10);
    var hour = now.getHours();

    var pending = tasks.filter(function(t) { return !t.done; });
    var doneToday = tasks.filter(function(t) { return t.done && t.createdAt && t.createdAt.startsWith(today); });
    var todayDate = new Date(); todayDate.setHours(0,0,0,0);

    var overdue = pending.filter(function(t) {
      return t.dueDate && new Date(t.dueDate + 'T00:00:00') < todayDate;
    });

    var dueToday = pending.filter(function(t) { return t.dueDate === today; });

    var tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowStr = tomorrow.toISOString().slice(0, 10);
    var dueTomorrow = pending.filter(function(t) { return t.dueDate === tomorrowStr; });

    var altaPending = pending.filter(function(t) { return t.priority === 'alta'; });

    var streak = 0;
    var level = 1;
    var xp = 0;
    if (typeof Gamification !== 'undefined') {
      var info = Gamification.getLevelInfo();
      streak = info.streak;
      level = info.level;
      xp = info.xp || 0;
    }

    var habits = [];
    try { habits = JSON.parse(localStorage.getItem('fceux_habits') || '[]'); } catch(e) {}

    var habitsToday = 0;
    var habitsTotal = habits.length;
    habits.forEach(function(h) {
      var goal = h.goal || 1;
      var val = h.log && h.log[today];
      var count = typeof val === 'number' ? val : (val === true ? 1 : 0);
      if (count >= goal) habitsToday++;
    });

    var totalPomos = parseInt(localStorage.getItem('fceux_pomos_total') || '0');

    var timeOfDay = 'dia';
    if (hour >= 5 && hour < 12) timeOfDay = 'manha';
    else if (hour >= 12 && hour < 14) timeOfDay = 'almoco';
    else if (hour >= 14 && hour < 18) timeOfDay = 'tarde';
    else if (hour >= 18 && hour < 22) timeOfDay = 'noite';
    else timeOfDay = 'madrugada';

    var dayOfWeek = now.getDay();
    var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    var productivity = 'baixa';
    if (doneToday.length >= 10) productivity = 'insana';
    else if (doneToday.length >= 7) productivity = 'alta';
    else if (doneToday.length >= 4) productivity = 'boa';
    else if (doneToday.length >= 2) productivity = 'media';

    return {
      tasks: tasks,
      pending: pending,
      doneToday: doneToday,
      overdue: overdue,
      dueToday: dueToday,
      dueTomorrow: dueTomorrow,
      altaPending: altaPending,
      streak: streak,
      level: level,
      xp: xp,
      habits: habits,
      habitsToday: habitsToday,
      habitsTotal: habitsTotal,
      totalPomos: totalPomos,
      hour: hour,
      timeOfDay: timeOfDay,
      isWeekend: isWeekend,
      productivity: productivity,
      totalDone: tasks.filter(function(t) { return t.done; }).length,
      totalTasks: tasks.length
    };
  }

  // === RESPOSTAS ===
  function processMessage(text) {
    var lower = text.toLowerCase().trim();
    var ctx = getContext();

    // Saudações
    if (matches(lower, ['oi', 'olá', 'ola', 'hey', 'eai', 'e ai', 'fala', 'salve', 'bom dia', 'boa tarde', 'boa noite'])) {
      return greeting(ctx);
    }

    // Como estou / meu dia / produtividade
    if (matches(lower, ['como estou', 'meu dia', 'meu progresso', 'produtividade', 'como foi', 'resumo', 'status'])) {
      return dailyReport(ctx);
    }

    // O que fazer / sugestão
    if (matches(lower, ['o que fazer', 'sugestão', 'sugestao', 'sugira', 'recomendar', 'prioridade', 'por onde começo', 'por onde começar', 'qual tarefa'])) {
      return suggest(ctx);
    }

    // Cansado / desmotivado
    if (matches(lower, ['cansado', 'cansada', 'exausto', 'exausta', 'desmotivado', 'desmotivada', 'preguiça', 'preguica', 'sem energia', 'tédio', 'tedio'])) {
      return tired(ctx);
    }

    // Motivação
    if (matches(lower, ['motiv', 'animo', 'energia', 'força', 'forca', 'inspir', 'me ajuda', 'ajuda'])) {
      return motivate(ctx);
    }

    // Streak
    if (matches(lower, ['streak', 'sequência', 'sequencia', 'dias seguidos', 'consecutivo'])) {
      return streakInfo(ctx);
    }

    // Urgentes / vencem hoje
    if (matches(lower, ['urgente', 'vence hoje', 'vencem hoje', 'atrasad', 'prazo', 'deadline'])) {
      return urgentTasks(ctx);
    }

    // Hábitos
    if (matches(lower, ['hábito', 'habito', 'habits', 'rotina'])) {
      return habitsInfo(ctx);
    }

    // Pomodoro
    if (matches(lower, ['pomodoro', 'pomo', 'foco', 'concentr', 'timer'])) {
      return pomoInfo(ctx);
    }

    // Piada
    if (matches(lower, ['piada', 'humor', 'engraçado', 'engracado', 'rir', 'riso', 'joke', 'funny'])) {
      return joke();
    }

    // Quem é você / sobre
    if (matches(lower, ['quem é você', 'quem é vc', 'quem e voce', 'quem e vc', 'sobre você', 'sobre voce', 'seu nome', 'o que você faz', 'o que vc faz'])) {
      return aboutMe(ctx);
    }

    // Obrigado
    if (matches(lower, ['obrigado', 'obrigada', 'valeu', 'thanks', 'vlw', 'tmj'])) {
      return thanks(ctx);
    }

    // Nível / XP
    if (matches(lower, ['nível', 'nivel', 'level', 'xp', 'experiência', 'experiencia', 'pontos'])) {
      return levelInfo(ctx);
    }

    // Estatísticas
    if (matches(lower, ['estatística', 'estatistica', 'stats', 'números', 'numeros', 'dados'])) {
      return stats(ctx);
    }

    // Ajuda / funcionalidades
    if (matches(lower, ['ajuda', 'help', 'como usar', 'funcionalidade', 'feature', 'o que posso', 'comandos'])) {
      return helpInfo();
    }

    // Tchau
    if (matches(lower, ['tchau', 'bye', 'até', 'ate mais', 'fui', 'flw'])) {
      return goodbye(ctx);
    }

    // Estressado
    if (matches(lower, ['estresse', 'stress', 'ansio', 'nervos', 'preocup', 'pressão', 'pressao'])) {
      return stressed(ctx);
    }

    // Feliz / comemorando
    if (matches(lower, ['feliz', 'contente', 'ótimo', 'otimo', 'incrível', 'incrivel', 'demais', 'top'])) {
      return happy(ctx);
    }

    // Clima
    if (matches(lower, ['clima', 'tempo', 'chuva', 'sol', 'frio', 'calor'])) {
      return weatherChat(ctx);
    }

    // Não entendi
    return notUnderstood(ctx);
  }

  function matches(text, keywords) {
    for (var i = 0; i < keywords.length; i++) {
      if (text.indexOf(keywords[i]) >= 0) return true;
    }
    return false;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // === DIÁLOGOS ===
  function greeting(ctx) {
    var greetings = {
      manha: [
        '☀️ Bom dia! Pronto pra mais um dia produtivo?\n\n📊 Você tem ' + ctx.pending.length + ' tarefas pendentes.' + (ctx.dueToday.length > 0 ? '\n⚠️ ' + ctx.dueToday.length + ' vencem HOJE!' : ''),
        '🌅 Bom dia, chefe! Seus sistemas estão operacionais!\n\n' + (ctx.streak > 0 ? '🔥 Streak: ' + ctx.streak + ' dias. Não quebre!' : 'Bora começar o streak hoje? 💪'),
        '☀️ Dia novo, bugs novos... quer dizer, TAREFAS novas! 😅\n\nVocê tem ' + ctx.pending.length + ' pendentes. Vamos resolver?'
      ],
      almoco: [
        '🍽️ Hora do almoço! Como está a manhã?\n\n📊 Até agora: ' + ctx.doneToday.length + ' tarefas concluídas. ' + (ctx.doneToday.length >= 3 ? 'Nada mal! 👍' : 'Bora acelerar na volta! 💪'),
        '🍔 Almoço! Recarregue as baterias!\n\nDica: não pense em trabalho agora. Descanse 100% e volta com força! 🔋'
      ],
      tarde: [
        '🌤️ Boa tarde! Sprint da tarde!\n\n📊 Feitas hoje: ' + ctx.doneToday.length + ' | Pendentes: ' + ctx.pending.length + (ctx.dueToday.length > 0 ? '\n⚠️ ' + ctx.dueToday.length + ' ainda vencem hoje!' : ''),
        '⚡ Tarde é hora de meter bronca!\n\n' + (ctx.altaPending.length > 0 ? '🔴 ' + ctx.altaPending.length + ' tarefas ALTA prioridade esperando!' : 'Sem urgências! Continue no ritmo! 🎯')
      ],
      noite: [
        '🌙 Boa noite! Ainda trabalhando?\n\n📊 Hoje: ' + ctx.doneToday.length + ' tarefas feitas. ' + (ctx.doneToday.length >= 5 ? 'Dia INCRÍVEL! 🏆' : 'Bom trabalho! 👍') + '\n\nNão esqueça de descansar! 😴',
        '🌙 Hey! Quase hora de descansar!\n\n' + (ctx.overdue.length > 0 ? '⚠️ Mas tem ' + ctx.overdue.length + ' atrasadas... resolve amanhã cedo!' : 'Tudo em dia! Pode dormir tranquilo! ✅')
      ],
      madrugada: [
        '🦉 Madrugada?! Você é noturno mesmo!\n\n' + (ctx.pending.length > 0 ? 'Tem ' + ctx.pending.length + ' pendentes... mas agora é hora de DORMIR! 😴' : 'Tudo limpo! Agora DORME! 💤'),
        '🌃 Ei, são ' + ctx.hour + 'h! Seu processador precisa descansar!\n\nDica: dormir bem = produtividade amanhã. Vai lá! 😴🔋'
      ]
    };

    return pick(greetings[ctx.timeOfDay] || greetings.tarde);
  }

  function dailyReport(ctx) {
    var report = '📊 RELATÓRIO DO DIA\n\n';
    report += '✅ Concluídas hoje: ' + ctx.doneToday.length + '\n';
    report += '📋 Pendentes: ' + ctx.pending.length + '\n';

    if (ctx.overdue.length > 0) report += '🚨 Atrasadas: ' + ctx.overdue.length + '\n';
    if (ctx.dueToday.length > 0) report += '⚠️ Vencem hoje: ' + ctx.dueToday.length + '\n';
    if (ctx.dueTomorrow.length > 0) report += '📅 Vencem amanhã: ' + ctx.dueTomorrow.length + '\n';
    if (ctx.altaPending.length > 0) report += '🔴 Prioridade alta: ' + ctx.altaPending.length + '\n';

    report += '\n';

    if (ctx.streak > 0) report += '🔥 Streak: ' + ctx.streak + ' dias\n';
    report += '⭐ Nível: ' + ctx.level + '\n';

    if (ctx.habitsTotal > 0) {
      report += '🎯 Hábitos: ' + ctx.habitsToday + '/' + ctx.habitsTotal + ' hoje\n';
    }

    report += '\n';

    // Nota do dia
    if (ctx.productivity === 'insana') report += '🏆 PRODUTIVIDADE: INSANA! Você é uma máquina!';
    else if (ctx.productivity === 'alta') report += '🔥 PRODUTIVIDADE: ALTA! Dia excelente!';
    else if (ctx.productivity === 'boa') report += '👍 PRODUTIVIDADE: BOA! Continue assim!';
    else if (ctx.productivity === 'media') report += '💪 PRODUTIVIDADE: OK! Ainda dá tempo de acelerar!';
    else report += '🐢 PRODUTIVIDADE: BAIXA. Bora mudar isso? 💪';

    return report;
  }

  function suggest(ctx) {
    // Priorizar atrasadas
    if (ctx.overdue.length > 0) {
      var task = ctx.overdue[0];
      return '🚨 URGENTE!\n\n"' + task.text + '" está ATRASADA!\n\nSugiro começar por ela agora. ' +
        (task.estimate ? 'Estimativa: ' + task.estimate + 'min. ' : '') +
        'Que tal um Pomodoro focado? 🍅';
    }

    // Vencem hoje
    if (ctx.dueToday.length > 0) {
      var todayTask = ctx.dueToday[0];
      return '⚠️ VENCE HOJE!\n\n"' + todayTask.text + '"' +
        (todayTask.dueTime ? ' às ' + todayTask.dueTime : '') +
        '\n\nMelhor resolver logo! Comece agora e marque como feita. Você consegue! 💪';
    }

    // Alta prioridade
    if (ctx.altaPending.length > 0) {
      var altaTask = ctx.altaPending[0];
      return '🔴 ALTA PRIORIDADE\n\n"' + altaTask.text + '"\n\nEssa deveria ser sua próxima ação. ' +
        'Foco total! 🎯\n\nDica: use o Pomodoro (25min) pra não se distrair.';
    }

    // Sem urgências
    if (ctx.pending.length > 0) {
      var nextTask = ctx.pending[0];
      return '✅ Sem urgências! Boa notícia!\n\nSugestão: que tal avançar em "' + nextTask.text + '"?\n\n' +
        (ctx.habitsToday < ctx.habitsTotal ? '🎯 E não esqueça dos hábitos! Faltam ' + (ctx.habitsTotal - ctx.habitsToday) + '.' : 'Todos os hábitos em dia! 🎯');
    }

    return '🎉 INCRÍVEL! Zero tarefas pendentes!\n\nVocê zerou a lista! Opções:\n' +
      '📝 Criar novas tarefas\n🎯 Revisar hábitos\n📖 Estudar algo novo\n☕ Tomar um café merecido!';
  }

  function tired(ctx) {
    var responses = [
      '☕ Entendo! Todo mundo precisa de uma pausa.\n\n' +
        'Você já fez ' + ctx.doneToday.length + ' tarefas hoje — ' + (ctx.doneToday.length >= 3 ? 'isso é ÓTIMO!' : 'e tudo bem!') +
        '\n\nSugestão:\n1. ☕ Café/água\n2. 🚶 5min de alongamento\n3. 🎵 Música pra relaxar\n4. 🍅 Depois, 1 Pomodoro curto (15min)',

      '😴 Normal! Seu processador precisa resfriar!\n\n' +
        'Fato: pausas aumentam produtividade em 25%!\n\n' +
        'Que tal a técnica 5-5-5?\n✋ 5 respirações profundas\n🚶 5 min de pé\n💧 5 goles de água\n\nDepois volta com tudo! 🔋',

      '🔋 Bateria baixa detectada!\n\nProtocolo de recarga:\n' +
        '1. Feche os olhos 2 minutos\n2. Alongue pescoço e ombros\n3. Beba água\n4. ' +
        (ctx.hour >= 14 ? 'Evite café agora, vai atrapalhar o sono!' : 'Um cafezinho cai bem! ☕') +
        '\n\nVocê não é uma máquina... mas eu sou! 🤖😄'
    ];
    return pick(responses);
  }

  function motivate(ctx) {
    var motivations = [
      '💪 ESCUTA AQUI!\n\nVocê já completou ' + ctx.totalDone + ' tarefas TOTAL nesse app!\n' +
        (ctx.streak > 0 ? 'Tem um streak de ' + ctx.streak + ' DIAS!\n' : '') +
        'Nível ' + ctx.level + '!\n\nIsso não é sorte. É DISCIPLINA. Continue! 🔥',

      '🏆 Sabe quem não desiste? VOCÊ!\n\n' +
        'Enquanto outros só reclamam, você tá aqui ORGANIZANDO, FAZENDO, EVOLUINDO.\n\n' +
        ctx.pending.length + ' tarefas pendentes? Pfff, você resolve isso fácil! 💪\n\n' +
        '"O sucesso não é acidente. É trabalho duro." — Pelé ⚽',

      '🔥 MODO TURBO ATIVADO!\n\n' +
        'Fatos sobre VOCÊ:\n' +
        '✅ ' + ctx.totalDone + ' tarefas concluídas\n' +
        '📅 ' + ctx.doneToday.length + ' só hoje\n' +
        '⭐ Nível ' + ctx.level + '\n' +
        (ctx.streak > 0 ? '🔥 ' + ctx.streak + ' dias de streak\n' : '') +
        '\nVocê é IMPARÁVEL! Mais uma tarefa? 🎯',

      '🚀 "Não é sobre ter tempo. É sobre fazer tempo."\n\n' +
        'Você tá fazendo acontecer, mano! Cada tarefa concluída é um passo.\n' +
        (ctx.pending.length <= 3 ? '\nE olha, só faltam ' + ctx.pending.length + '! Tá quase zerado!' : '\nBora reduzir essas ' + ctx.pending.length + ' pendentes!') +
        '\n\n💪 Eu acredito em você! (E olha que sou só um robô!)',

      '⭐ PIXEL acredita em você!\n\n' +
        '"A diferença entre ordinário e extraordinário é aquele pequeno extra."\n\n' +
        'Você já fez o ordinário. Agora faz o EXTRA!\n' +
        'Mais 1 tarefa. Só mais 1. Vai! 🔥'
    ];
    return pick(motivations);
  }

  function streakInfo(ctx) {
    if (ctx.streak === 0) {
      return '🔥 Streak: 0 dias\n\nVocê ainda não começou! Complete pelo menos 1 tarefa hoje pra iniciar seu streak.\n\n' +
        'Streak = dias seguidos completando tarefas.\nBônus: +20% XP no dia 3, +50% no dia 7! 🏆';
    }
    if (ctx.streak < 3) {
      return '🔥 Streak: ' + ctx.streak + ' dia(s)!\n\nBom começo! Continue completando tarefas todo dia.\n\n' +
        'Meta: chegar a 3 dias pra ganhar bônus de +20% XP! 💪';
    }
    if (ctx.streak < 7) {
      return '🔥 Streak: ' + ctx.streak + ' dias! FOGO!\n\nVocê já tem bônus de +20% XP!\n\n' +
        'Meta: chegar a 7 dias pra bônus de +50% XP e badge "Pegando Fogo"! 🏆\n\nFaltam ' + (7 - ctx.streak) + ' dias!';
    }
    if (ctx.streak < 14) {
      return '🔥🔥 Streak: ' + ctx.streak + ' dias! INSANO!\n\nBônus ativo: +50% XP!\n\n' +
        'Você é dedicado demais! Meta: 14 dias pra badge "Imparável"!\n\nFaltam ' + (14 - ctx.streak) + ' dias! 🏆';
    }
    return '🔥🔥🔥 Streak: ' + ctx.streak + ' DIAS! LENDÁRIO!\n\nVocê é uma MÁQUINA de produtividade!\n\n' +
      '+50% XP ativo! Não quebre por NADA! 💪🏆\n\n' +
      (ctx.streak >= 30 ? '🏆 30+ DIAS! Você desbloqueou a badge LENDÁRIO!' : 'Meta: ' + (30 - ctx.streak) + ' dias pra badge "Lendário"!');
  }

  function urgentTasks(ctx) {
    if (ctx.overdue.length === 0 && ctx.dueToday.length === 0) {
      return '✅ ZERO urgências! Tudo em dia!\n\n' +
        (ctx.dueTomorrow.length > 0 ? '📅 Mas ' + ctx.dueTomorrow.length + ' vencem amanhã:\n' +
        ctx.dueTomorrow.slice(0, 3).map(function(t) { return '  • ' + t.text; }).join('\n') +
        '\n\nAdiante o que puder!' : 'Nenhuma tarefa vence nos próximos dias. Relaxa! 😎');
    }

    var response = '';
    if (ctx.overdue.length > 0) {
      response += '🚨 ATRASADAS (' + ctx.overdue.length + '):\n';
      ctx.overdue.slice(0, 5).forEach(function(t) {
        response += '  🔴 ' + t.text + ' (venceu ' + t.dueDate + ')\n';
      });
      response += '\n';
    }

    if (ctx.dueToday.length > 0) {
      response += '⚠️ VENCEM HOJE (' + ctx.dueToday.length + '):\n';
      ctx.dueToday.slice(0, 5).forEach(function(t) {
        response += '  🟡 ' + t.text + (t.dueTime ? ' às ' + t.dueTime : '') + '\n';
      });
      response += '\n';
    }

    response += '💪 Foco nessas primeiro!';
    return response;
  }

  function habitsInfo(ctx) {
    if (ctx.habitsTotal === 0) {
      return '🎯 Você não tem hábitos cadastrados!\n\nHábitos são poderosos! Sugestões:\n' +
        '💧 Beber 8 copos de água\n🏃 30 min de exercício\n📖 Ler 20 páginas\n🧘 Meditar 10 min\n\n' +
        'Clique em 🎯 HABITS pra começar!';
    }

    var response = '🎯 HÁBITOS DE HOJE\n\n';
    response += 'Progresso: ' + ctx.habitsToday + '/' + ctx.habitsTotal;
    response += ctx.habitsToday === ctx.habitsTotal ? ' ✅ COMPLETO!\n\n' : '\n\n';

    ctx.habits.forEach(function(h) {
      var goal = h.goal || 1;
      var today = new Date().toISOString().slice(0, 10);
      var val = h.log && h.log[today];
      var count = typeof val === 'number' ? val : (val === true ? 1 : 0);
      var done = count >= goal;
      response += (done ? '✅' : '⬜') + ' ' + (h.icon || '🎯') + ' ' + h.name;
      if (goal > 1) response += ' (' + count + '/' + goal + ')';
      response += '\n';
    });

    if (ctx.habitsToday < ctx.habitsTotal) {
      response += '\n💪 Faltam ' + (ctx.habitsTotal - ctx.habitsToday) + '! Bora completar!';
    } else {
      response += '\n🏆 Todos os hábitos concluídos! Disciplina pura! 🔥';
    }

    return response;
  }

  function pomoInfo(ctx) {
    return '🍅 POMODORO\n\n' +
      'Total de pomodoros: ' + ctx.totalPomos + '\n\n' +
      'Técnica Pomodoro:\n' +
      '1. 🍅 25 min de FOCO total\n' +
      '2. ☕ 5 min de pausa\n' +
      '3. Repete 4x\n' +
      '4. ☕☕ 15 min de pausa longa\n\n' +
      'Clique em 🍅 POMO pra começar!\n\n' +
      'Dica: selecione uma tarefa antes de iniciar — o timer fica vinculado a ela! 🎯';
  }

  function joke() {
    var jokes = [
      '😂 Por que o programador usa óculos?\nPorque ele não consegue C#! 🤓',
      '😂 O que o robô disse pro outro?\n"Você me dá um curto-circuito!" ⚡❤️',
      '😂 Bug não é defeito.\nÉ feature não documentada! 🐛✨',
      '😂 Quantos programadores precisa pra trocar uma lâmpada?\nNenhum. É problema de hardware! 💡',
      '😂 Por que 0 e 1 são amigos?\nPorque são bit-nários! 🤖',
      '😂 Minha namorada me deixou...\nEla disse que eu amo mais o git do que ela.\nEu tentei fazer commit mas ela já tinha dado push! 💔',
      '😂 Qual o café favorito do Java?\n☕ JavaScript!\nNão, pera... 🤔',
      '😂 Como robôs fazem exercício?\nCircuit training! ⚡🏋️',
      '😂 Erro 404: piada engraçada não encontrada.\nMas eu tentei! 🤖😅',
      '😂 Eu ia contar uma piada de UDP...\nMas talvez você não receba! 📡',
      '😂 Sabe qual o animal mais antigo?\nA zebra. Porque é em preto e branco! 🦓',
      '😂 Debug é como ser detetive...\nnum crime onde VOCÊ é o assassino! 🔍🔪'
    ];
    return pick(jokes);
  }

  function aboutMe(ctx) {
    return '🤖 Eu sou o PIXEL!\n\n' +
      'Seu assistente robô com IA do FCEUX Task Manager.\n\n' +
      '📊 O que eu faço:\n' +
      '• Analiso suas tarefas e produtividade\n' +
      '• Sugiro o que fazer primeiro\n' +
      '• Dou relatórios do seu dia\n' +
      '• Motivo quando você tá cansado\n' +
      '• Conto piadas (ruins) 😅\n' +
      '• Reajo a tudo que acontece no app\n\n' +
      '💬 Como interagir comigo:\n' +
      '• 1 clique = frase motivacional\n' +
      '• 2 cliques = abrir este chat\n' +
      '• 🎨 Personalizar = botão acima\n' +
      '• 🎮 Mini-game = botão acima\n\n' +
      'Fui criado em Joinville/SC com ❤️ por Gustavo Nogueira.\n' +
      'Meu objetivo: te ajudar a ser produtivo! 💪🤖';
  }

  function thanks(ctx) {
    var responses = [
      '😊 De nada! Tô aqui pra isso! Se precisar, é só chamar! 🤖💪',
      '🤖❤️ Obrigado VOCÊ por me usar! Juntos somos imparáveis!',
      '😊 Tmj! Bora produzir! Se precisar de algo, manda ver! 🚀',
      '🤖 Fico feliz em ajudar! Meus circuitos se aquecem de alegria! ⚡😊',
      '💪 Sempre! Pra isso que eu fui programado! Beep boop! 🤖'
    ];
    return pick(responses);
  }

  function levelInfo(ctx) {
    var levels = ['', 'Aprendiz', 'Iniciante', 'Praticante', 'Dedicado', 'Veterano', 'Experiente', 'Mestre', 'Grão-Mestre', 'Épico', 'Lenda'];
    var levelName = levels[ctx.level] || 'Nível ' + ctx.level;

    return '⭐ NÍVEL ' + ctx.level + ' — ' + levelName + '\n\n' +
      'XP Total: ' + ctx.xp + '\n' +
      '🔥 Streak: ' + ctx.streak + ' dias\n' +
      '✅ Tarefas feitas: ' + ctx.totalDone + '\n' +
      '🍅 Pomodoros: ' + ctx.totalPomos + '\n\n' +
      (ctx.level < 10 ? 'Próximo nível: ' + levels[ctx.level + 1] + '\nContinue completando tarefas pra subir! 💪' :
        '👑 NÍVEL MÁXIMO! Você é uma LENDA! 🏆');
  }

  function stats(ctx) {
    return '📊 ESTATÍSTICAS GERAIS\n\n' +
      '📋 Total de tarefas: ' + ctx.totalTasks + '\n' +
      '✅ Concluídas: ' + ctx.totalDone + '\n' +
      '📌 Pendentes: ' + ctx.pending.length + '\n' +
      '🚨 Atrasadas: ' + ctx.overdue.length + '\n' +
      '🔴 Alta prioridade: ' + ctx.altaPending.length + '\n\n' +
      '📅 Hoje: ' + ctx.doneToday.length + ' feitas\n' +
      '🔥 Streak: ' + ctx.streak + ' dias\n' +
      '⭐ Nível: ' + ctx.level + '\n' +
      '🍅 Pomodoros: ' + ctx.totalPomos + '\n' +
      '🎯 Hábitos: ' + ctx.habitsToday + '/' + ctx.habitsTotal + ' hoje\n\n' +
      'Produtividade: ' + ctx.productivity.toUpperCase() + ' ' +
      (ctx.productivity === 'insana' ? '🏆' : ctx.productivity === 'alta' ? '🔥' : ctx.productivity === 'boa' ? '👍' : '💪');
  }

  function helpInfo() {
    return '🤖 COMO POSSO TE AJUDAR?\n\nPergunte-me sobre:\n\n' +
      '📊 "Como estou hoje?" — Relatório do dia\n' +
      '🎯 "O que fazer agora?" — Sugestão de tarefa\n' +
      '😴 "Estou cansado" — Dicas de pausa\n' +
      '💪 "Me motive" — Motivação\n' +
      '🔥 "Meu streak" — Info do streak\n' +
      '⏰ "Urgentes" — Tarefas que vencem hoje\n' +
      '🎯 "Hábitos" — Status dos hábitos\n' +
      '🍅 "Pomodoro" — Info sobre foco\n' +
      '⭐ "Meu nível" — XP e nível\n' +
      '📊 "Estatísticas" — Números gerais\n' +
      '😂 "Piada" — Humor nerd\n' +
      '🤖 "Quem é você?" — Sobre mim\n\n' +
      'Ou simplesmente converse! Eu entendo bastante coisa! 😊';
  }

  function goodbye(ctx) {
    var responses = [
      '👋 Até mais! ' + (ctx.pending.length > 0 ? 'Não esquece das ' + ctx.pending.length + ' pendentes! 😉' : 'Tá tudo em dia! 🏆') + '\n\nEstarei aqui quando precisar! 🤖',
      '👋 Falou! Vai descansar?\n\n' + (ctx.doneToday.length >= 3 ? 'Dia bem produtivo! Descansa merecido! 😊' : 'Amanhã a gente pega firme! 💪') + '\n\nBeep boop! 🤖💤',
      '🤖 Entrando em modo standby...\n\nMas meus sensores continuam ativos! Se precisar, é só clicar em mim! 👋💙'
    ];
    return pick(responses);
  }

  function stressed(ctx) {
    return '😰 Ei, calma!\n\n' +
      'Respira fundo. 4 segundos inspira... 4 segura... 4 expira...\n\n' +
      (ctx.overdue.length > 0 ? 'Sei que tem ' + ctx.overdue.length + ' atrasadas, mas entrar em pânico não resolve.\n\n' : '') +
      'Estratégia anti-stress:\n' +
      '1. 📝 Liste as 3 mais importantes\n' +
      '2. 🎯 Foque APENAS na primeira\n' +
      '3. 🍅 Pomodoro de 15 min\n' +
      '4. ✅ Marque como feita\n' +
      '5. 🎉 Celebre!\n\n' +
      'Uma de cada vez. Você consegue! 💪🤖';
  }

  function happy(ctx) {
    var responses = [
      '🎉 QUE BOM! Adoro ver você assim!\n\n' +
        'Aproveita essa energia positiva! ' +
        (ctx.pending.length > 0 ? 'Que tal resolver mais ' + Math.min(3, ctx.pending.length) + ' tarefas enquanto tá nessa vibe? 🚀' : 'Lista zerada + feliz = PERFEIÇÃO! 🏆'),
      '😊 ISSO! Essa energia é contagiante!\n\nMeus circuitos tão vibrando de alegria! ⚡🤖\n\n' +
        (ctx.streak > 0 ? 'Streak de ' + ctx.streak + ' dias + bom humor = IMBATÍVEL! 🔥' : 'Bora transformar esse mood em produtividade! 💪'),
      '🎉 *PIXEL faz dancinha de robô* 🤖💃\n\nSua felicidade é meu combustível!\n\n' +
        'Dado aleatório: sorrir aumenta produtividade em 12%! Então continue sorrindo! 😊📈'
    ];
    return pick(responses);
  }

  function weatherChat(ctx) {
    var weatherDesc = document.getElementById('weatherDesc');
    var weatherTemp = document.getElementById('weatherTemp');

    if (weatherDesc && weatherTemp) {
      var desc = weatherDesc.textContent;
      var temp = weatherTemp.textContent;
      return '🌤️ Clima atual: ' + desc + ' ' + temp + '\n\n' +
        (desc.toLowerCase().indexOf('chuva') >= 0 ?
          '☂️ Tá chovendo! Perfeito pra ficar focado no trabalho com um café! ☕🤖' :
          desc.toLowerCase().indexOf('sol') >= 0 || desc.toLowerCase().indexOf('clear') >= 0 ?
          '☀️ Dia bonito! Mas não se distraia! Foco primeiro, sol depois! 😎' :
          '🌤️ Clima ok! Dia perfeito pra ser produtivo! 💪');
    }

    return '🤖 Não consigo ver o clima agora.\n\nVerifique no widget de clima do app! Se não aparece, configure sua cidade em ⚙️ CONFIG.';
  }

  function notUnderstood(ctx) {
    var responses = [
      '🤔 Hmm, não entendi bem...\n\nTenta perguntar de outro jeito! Ou clique nos botões rápidos acima.\n\nDigite "ajuda" pra ver o que eu sei fazer! 🤖',
      '🤖 *processando*... *processando*... Erro 404: contexto não encontrado! 😅\n\nMas posso te ajudar com:\n📊 Produtividade\n🎯 Sugestões\n💪 Motivação\n😂 Piadas\n\nO que prefere?',
      '🤔 Meus circuitos não processaram isso...\n\nMas sou bom em:\n• Analisar suas tarefas\n• Dar sugestões\n• Motivar\n• Contar piadas ruins 😂\n\nTenta "como estou hoje?" ou "o que fazer agora?"',
      '🤖 Beep boop? Não entendi!\n\nSou um robô simples mas esperto! 😊\nDigite "ajuda" pra ver tudo que sei fazer!'
    ];
    return pick(responses);
  }

  // === UI ===
  function addMessage(text, type) {
    var now = new Date();
    var time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    var msg = document.createElement('div');
    msg.className = 'pixel-msg ' + type;

    if (type === 'bot') {
      msg.innerHTML = '<span class="pm-icon">🤖</span>' + escHtml(text).replace(/\n/g, '<br>') + '<div class="pm-time">' + time + '</div>';
    } else {
      msg.innerHTML = escHtml(text).replace(/\n/g, '<br>') + '<div class="pm-time">' + time + '</div>';
    }

    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'pixel-typing';
    typing.id = 'pixelTyping';
    typing.textContent = '🤖 PIXEL está digitando...';
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function hideTyping() {
    var typing = document.getElementById('pixelTyping');
    if (typing) typing.remove();
  }

  function send() {
    var text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    if (typeof Sounds !== 'undefined') Sounds.click();

    // Simular tempo de "pensar"
    showTyping();
    var delay = 500 + Math.random() * 1000;

    setTimeout(function() {
      hideTyping();
      var response = processMessage(text);
      addMessage(response, 'bot');
      if (typeof Sounds !== 'undefined') Sounds.notification();

      // Mascote reage
      if (typeof Mascot !== 'undefined') {
        if (text.toLowerCase().indexOf('piada') >= 0) Mascot.setState('celebrate', 3000);
        else if (text.toLowerCase().indexOf('cansado') >= 0) Mascot.setState('coffee', 3000);
        else if (text.toLowerCase().indexOf('motiv') >= 0) Mascot.setState('fire', 3000);
      }
    }, delay);
  }

  function open() {
    if (overlay) overlay.classList.add('visible');
    if (chatBody && chatBody.children.length === 0) {
      // Mensagem de boas-vindas
      var ctx = getContext();
      addMessage(greeting(ctx), 'bot');
    }
    if (chatInput) chatInput.focus();
  }

  function close() { if (overlay) overlay.classList.remove('visible'); }

  function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // === PROATIVO — PIXEL inicia conversa ===
  function proactiveCheck() {
    var now = Date.now();
    if (now - lastProactive < 1800000) return; // 30 min mínimo entre proativas

    var ctx = getContext();

    // Tarefa atrasada
    if (ctx.overdue.length > 0 && Math.random() > 0.5) {
      lastProactive = now;
      if (typeof Mascot !== 'undefined') {
        Mascot.setState('worry', 3000);
      }
      showProactiveBubble('🚨 Tem ' + ctx.overdue.length + ' atrasada(s)! Clica em mim pra ver!');
      return;
    }

    // Sem atividade
    if (ctx.doneToday.length === 0 && ctx.hour >= 10 && Math.random() > 0.6) {
      lastProactive = now;
      showProactiveBubble('😴 Zero tarefas hoje? Bora mudar isso! Clica em mim!');
      return;
    }

    // Hábitos pendentes
    if (ctx.habitsTotal > 0 && ctx.habitsToday < ctx.habitsTotal && ctx.hour >= 18 && Math.random() > 0.5) {
      lastProactive = now;
      showProactiveBubble('🎯 Faltam ' + (ctx.habitsTotal - ctx.habitsToday) + ' hábitos hoje!');
      return;
    }

    // Parabéns
    if (ctx.doneToday.length >= 5 && Math.random() > 0.7) {
      lastProactive = now;
      showProactiveBubble('🔥 ' + ctx.doneToday.length + ' tarefas hoje! Tá ON FIRE!');
      return;
    }
  }

  function showProactiveBubble(text) {
    var bubble = document.getElementById('mascotBubble');
    if (bubble) {
      bubble.textContent = text;
      bubble.classList.add('visible');
      setTimeout(function() { bubble.classList.remove('visible'); }, 6000);
    }
  }

  // === BINDS ===
  var closeBtn = document.getElementById('pixelChatClose');
  if (closeBtn) closeBtn.addEventListener('click', close);

  if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

  var sendBtn = document.getElementById('pixelChatSend');
  if (sendBtn) sendBtn.addEventListener('click', send);

  if (chatInput) {
    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') send();
    });
  }

  // Quick buttons
  var quickBtns = document.querySelectorAll('.pixel-quick-btn');
  quickBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (btn.dataset.msg) {
        chatInput.value = btn.dataset.msg;
        send();
      }
    });
  });

  var pqPersonalize = document.getElementById('pqPersonalize');
  if (pqPersonalize) {
    pqPersonalize.addEventListener('click', function() {
      close();
      if (typeof Mascot !== 'undefined') Mascot.openConfig();
    });
  }

  var pqMiniGame = document.getElementById('pqMiniGame');
  if (pqMiniGame) {
    pqMiniGame.addEventListener('click', function() {
      close();
      addMessage('🎮 Abrindo PIXEL SMASH!', 'bot');
      setTimeout(function() {
        if (typeof Mascot !== 'undefined') {
          var overlay = document.getElementById('mascotGameOverlay');
          if (overlay) {
            Mascot.setState('celebrate', 1000);
            // Iniciar mini-game diretamente
            overlay.classList.add('visible');
          }
        }
      }, 500);
    });
  }

  function init() {
    // Proativo a cada 5 minutos
    setInterval(proactiveCheck, 300000);
    // Primeira verificação após 2 minutos
    setTimeout(proactiveCheck, 120000);
  }

  return { init: init, open: open, close: close, send: send };
})();