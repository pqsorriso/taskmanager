/**
 * pixelpatterns.js — PIXEL aprende padrões do usuário
 * Analisa horários, dias produtivos, categorias favoritas
 */
var PixelPatterns = (function() {
  var STORAGE_KEY = 'fceux_patterns';
  var patterns = {};

  function load() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) patterns = JSON.parse(saved);
    } catch(e) {}
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  }

  // === ANALISAR PADRÕES ===
  function analyze() {
    var tasks = typeof TaskManager !== 'undefined' ? (TaskManager.getAllWithArchive ? TaskManager.getAllWithArchive() : TaskManager.getAll()) : [];
    var doneTasks = tasks.filter(function(t) { return t.done; });
    if (doneTasks.length < 5) return; // Precisa de dados mínimos

    // Horário mais produtivo
    var hourCounts = {};
    doneTasks.forEach(function(t) {
      var ts = t.completedAt || t.createdAt;
      if (!ts) return;
      var h = parseInt(ts.substring(11, 13));
      if (!isNaN(h)) hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    var bestHour = 0;
    var bestHourCount = 0;
    Object.keys(hourCounts).forEach(function(h) {
      if (hourCounts[h] > bestHourCount) {
        bestHour = parseInt(h);
        bestHourCount = hourCounts[h];
      }
    });

    // Dia mais produtivo
    var dayCounts = [0, 0, 0, 0, 0, 0, 0];
    var dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    doneTasks.forEach(function(t) {
      var ts = t.completedAt || t.createdAt;
      if (!ts) return;
      var d = new Date(ts);
      dayCounts[d.getDay()]++;
    });

    var bestDay = 0;
    var bestDayCount = 0;
    dayCounts.forEach(function(c, i) {
      if (c > bestDayCount) {
        bestDay = i;
        bestDayCount = c;
      }
    });

    // Categoria mais usada
    var catCounts = {};
    tasks.forEach(function(t) {
      var cat = t.category || 'sem categoria';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    var bestCat = 'sem categoria';
    var bestCatCount = 0;
    Object.keys(catCounts).forEach(function(c) {
      if (catCounts[c] > bestCatCount) {
        bestCat = c;
        bestCatCount = catCounts[c];
      }
    });

    // Prioridade mais comum
    var priCounts = { alta: 0, media: 0, baixa: 0 };
    tasks.forEach(function(t) {
      priCounts[t.priority || 'media']++;
    });

    // Tempo médio por tarefa
    var tasksWithTime = doneTasks.filter(function(t) { return t.timeSpent && t.timeSpent > 0; });
    var avgTime = 0;
    if (tasksWithTime.length > 0) {
      avgTime = Math.round(tasksWithTime.reduce(function(a, t) { return a + t.timeSpent; }, 0) / tasksWithTime.length / 60);
    }

    // Média de tarefas por dia
    var daysActive = {};
    doneTasks.forEach(function(t) {
      var ts = t.completedAt || t.createdAt;
      if (!ts) return;
      var key = ts.substring(0, 10);
      daysActive[key] = (daysActive[key] || 0) + 1;
    });
    var totalDays = Object.keys(daysActive).length || 1;
    var avgPerDay = Math.round(doneTasks.length / totalDays * 10) / 10;

    // Melhor dia (mais tarefas)
    var recordDay = '';
    var recordCount = 0;
    Object.keys(daysActive).forEach(function(d) {
      if (daysActive[d] > recordCount) {
        recordDay = d;
        recordCount = daysActive[d];
      }
    });

    // Streak de horário — costuma trabalhar no mesmo horário?
    var morningCount = 0;
    var afternoonCount = 0;
    var nightCount = 0;
    doneTasks.forEach(function(t) {
      var ts = t.completedAt || t.createdAt;
      if (!ts) return;
      var h = parseInt(ts.substring(11, 13));
      if (h >= 5 && h < 12) morningCount++;
      else if (h >= 12 && h < 18) afternoonCount++;
      else nightCount++;
    });

    var preferredTime = 'variado';
    if (morningCount > afternoonCount && morningCount > nightCount) preferredTime = 'manhã';
    else if (afternoonCount > morningCount && afternoonCount > nightCount) preferredTime = 'tarde';
    else if (nightCount > morningCount && nightCount > afternoonCount) preferredTime = 'noite';

    patterns = {
      bestHour: bestHour,
      bestHourCount: bestHourCount,
      bestDay: bestDay,
      bestDayName: dayNames[bestDay],
      bestDayCount: bestDayCount,
      bestCat: bestCat,
      bestCatCount: bestCatCount,
      priCounts: priCounts,
      avgTime: avgTime,
      avgPerDay: avgPerDay,
      recordDay: recordDay,
      recordCount: recordCount,
      preferredTime: preferredTime,
      morningCount: morningCount,
      afternoonCount: afternoonCount,
      nightCount: nightCount,
      totalAnalyzed: doneTasks.length,
      lastAnalysis: new Date().toISOString()
    };

    save();
    return patterns;
  }

  // === GERAR INSIGHTS ===
  function getInsights() {
    if (!patterns.totalAnalyzed || patterns.totalAnalyzed < 5) {
      analyze();
    }
    if (!patterns.totalAnalyzed || patterns.totalAnalyzed < 5) {
      return '📊 Preciso de mais dados!\n\nComplete pelo menos 5 tarefas pra eu aprender seus padrões. Até agora não tenho dados suficientes. 🤖';
    }

    var insights = '🧠 SEUS PADRÕES\n\n';
    insights += '📊 Baseado em ' + patterns.totalAnalyzed + ' tarefas concluídas:\n\n';
    insights += '⏰ Horário mais produtivo: ' + patterns.bestHour + 'h (' + patterns.bestHourCount + ' tarefas)\n';
    insights += '📅 Dia mais produtivo: ' + patterns.bestDayName + ' (' + patterns.bestDayCount + ' tarefas)\n';
    insights += '📁 Categoria favorita: ' + patterns.bestCat + ' (' + patterns.bestCatCount + ')\n';
    insights += '📏 Média por dia: ' + patterns.avgPerDay + ' tarefas\n';
    if (patterns.avgTime > 0) insights += '⏱️ Tempo médio: ' + patterns.avgTime + ' min/tarefa\n';
    insights += '🌤️ Prefere trabalhar de: ' + patterns.preferredTime + '\n';

    if (patterns.recordDay) {
      var dt = new Date(patterns.recordDay + 'T00:00:00');
      var recStr = String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0');
      insights += '\n🏆 Recorde: ' + patterns.recordCount + ' tarefas em ' + recStr + '!';
    }

    insights += '\n\n';

    // Sugestão baseada no padrão
    var now = new Date();
    var h = now.getHours();
    if (h === patterns.bestHour || h === patterns.bestHour - 1) {
      insights += '💡 Agora é seu MELHOR horário! Aproveite! 🔥';
    } else if (patterns.preferredTime === 'manhã' && h >= 12) {
      insights += '💡 Você produz mais de manhã. Amanhã cedo, ataque as difíceis!';
    } else if (patterns.preferredTime === 'tarde' && h < 12) {
      insights += '💡 Você rende mais à tarde. Manhã = planejamento, tarde = execução!';
    } else {
      insights += '💡 Seu pico é às ' + patterns.bestHour + 'h. Reserve tarefas difíceis pra esse horário!';
    }

    return insights;
  }

  // === SUGESTÃO PROATIVA ===
  function getProactiveSuggestion() {
    if (!patterns.totalAnalyzed || patterns.totalAnalyzed < 5) return null;

    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var pending = tasks.filter(function(t) { return !t.done; });
    var now = new Date();
    var h = now.getHours();
    var day = now.getDay();

    var suggestions = [];

    // É o melhor horário
    if (h === patterns.bestHour) {
      suggestions.push('⏰ Agora é seu horário MAIS produtivo! Aproveite pra atacar as tarefas difíceis! 🔥');
    }

    // É o melhor dia
    if (day === patterns.bestDay) {
      suggestions.push('📅 ' + patterns.bestDayName + ' é seu dia mais produtivo! Hoje vai render! 💪');
    }

    // Abaixo da média
    var today = now.toISOString().slice(0, 10);
    var doneToday = tasks.filter(function(t) {
      if (!t.done) return false;
      if (t.completedAt && t.completedAt.startsWith(today)) return true;
      if (t.createdAt && t.createdAt.startsWith(today)) return true;
      return false;
    }).length;

    if (doneToday < patterns.avgPerDay && h >= 14) {
      suggestions.push('📊 Você costuma fazer ' + patterns.avgPerDay + ' tarefas/dia. Hoje: ' + doneToday + '. Ainda dá tempo! 💪');
    }

    // Acima da média
    if (doneToday > patterns.avgPerDay * 1.5) {
      suggestions.push('🔥 ' + doneToday + ' tarefas hoje! Muito acima da sua média (' + patterns.avgPerDay + ')! INSANO! 🏆');
    }

    // Muitas tarefas de uma categoria
    if (patterns.bestCat !== 'sem categoria') {
      var catPending = pending.filter(function(t) { return (t.category || 'sem categoria') === patterns.bestCat; });
      if (catPending.length >= 3) {
        suggestions.push('📁 Tem ' + catPending.length + ' tarefas de "' + patterns.bestCat + '" (sua categoria mais ativa). Foco nelas!');
      }
    }

    if (suggestions.length === 0) return null;
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  function init() {
    load();
    // Analisar a cada 30 minutos
    setTimeout(analyze, 5000);
    setInterval(analyze, 1800000);
  }

  return {
    init: init,
    analyze: analyze,
    getInsights: getInsights,
    getProactiveSuggestion: getProactiveSuggestion,
    getPatterns: function() { return patterns; }
  };
})();