/**
 * sessioncomplete.js — Tela de conclusão para Pomodoro e Foco
 */
var SessionComplete = (function() {

  var quotes = [
    '"O segredo de progredir é começar." — Mark Twain',
    '"Foco é dizer não pras outras coisas." — Steve Jobs',
    '"Disciplina é a ponte entre metas e conquistas."',
    '"Cada sessão concluída é um passo rumo ao objetivo."',
    '"Você não precisa ser perfeito. Precisa ser consistente."',
    '"Pequenos progressos diários levam a grandes resultados."',
    '"O melhor momento pra começar foi ontem. O segundo é agora."',
    '"Produtividade não é fazer mais. É fazer o que importa."',
    '"Seu futuro eu agradece o esforço de hoje."',
    '"Excelência não é um ato, mas um hábito." — Aristóteles',
    '"A persistência é o caminho do êxito." — Charles Chaplin',
    '"Quanto mais você sua em treino, menos sangra em combate."',
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function showPomoComplete(taskName, duration) {
    var panel = document.getElementById('pomoComplete');
    if (!panel) return;

    var todayPomos = typeof Pomodoro !== 'undefined' ? Pomodoro.getTodayPomos() : 0;
    var totalPomos = typeof Pomodoro !== 'undefined' ? Pomodoro.getTotalPomos() : 0;
    var streak = 0;
    var level = 1;
    if (typeof Gamification !== 'undefined') {
      var info = Gamification.getLevelInfo();
      streak = info.streak;
      level = info.level;
    }

    var taskEl = document.getElementById('pomoCompleteTask');
    if (taskEl) taskEl.textContent = taskName ? '📋 ' + taskName : '🍅 Pomodoro livre';

    var statsEl = document.getElementById('pomoCompleteStats');
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="sc-stat"><div class="scs-val">⏱️ ' + duration + 'min</div><div class="scs-lbl">DURAÇÃO</div></div>' +
        '<div class="sc-stat"><div class="scs-val">🍅 ' + todayPomos + '</div><div class="scs-lbl">HOJE</div></div>' +
        '<div class="sc-stat"><div class="scs-val">🏆 ' + totalPomos + '</div><div class="scs-lbl">TOTAL</div></div>' +
        '<div class="sc-stat"><div class="scs-val">⭐ +15</div><div class="scs-lbl">XP GANHO</div></div>' +
        '<div class="sc-stat"><div class="scs-val">🔥 ' + streak + '</div><div class="scs-lbl">STREAK</div></div>' +
        '<div class="sc-stat"><div class="scs-val">Nv.' + level + '</div><div class="scs-lbl">NÍVEL</div></div>';
    }

    var quoteEl = document.getElementById('pomoCompleteQuote');
    if (quoteEl) quoteEl.textContent = pick(quotes);

    setupRating('pomoCompleteRating');
    panel.classList.add('visible');

    if (typeof Sounds !== 'undefined') Sounds.levelUp();
  }

  function hidePomoComplete() {
    var panel = document.getElementById('pomoComplete');
    if (panel) panel.classList.remove('visible');
  }

  function showFocusComplete(taskName, duration) {
    var panel = document.getElementById('focusComplete');
    if (!panel) return;

    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var today = new Date().toISOString().slice(0, 10);
    var doneToday = tasks.filter(function(t) {
      if (!t.done) return false;
      if (t.completedAt && t.completedAt.startsWith(today)) return true;
      if (t.createdAt && t.createdAt.startsWith(today)) return true;
      return false;
    }).length;

    var streak = 0;
    var level = 1;
    var xp = 0;
    if (typeof Gamification !== 'undefined') {
      var info = Gamification.getLevelInfo();
      streak = info.streak;
      level = info.level;
      xp = info.xp || 0;
    }

    var taskEl = document.getElementById('focusCompleteTask');
    if (taskEl) taskEl.textContent = taskName ? '📋 ' + taskName : '🎯 Sessão de foco';

    var statsEl = document.getElementById('focusCompleteStats');
    if (statsEl) {
      statsEl.innerHTML =
        '<div class="sc-stat"><div class="scs-val">⏱️ ' + duration + 'min</div><div class="scs-lbl">DURAÇÃO</div></div>' +
        '<div class="sc-stat"><div class="scs-val">✅ ' + doneToday + '</div><div class="scs-lbl">FEITAS HOJE</div></div>' +
        '<div class="sc-stat"><div class="scs-val">⭐ +' + (duration >= 25 ? 15 : 10) + '</div><div class="scs-lbl">XP GANHO</div></div>' +
        '<div class="sc-stat"><div class="scs-val">🔥 ' + streak + '</div><div class="scs-lbl">STREAK</div></div>' +
        '<div class="sc-stat"><div class="scs-val">Nv.' + level + '</div><div class="scs-lbl">NÍVEL</div></div>' +
        '<div class="sc-stat"><div class="scs-val">⭐ ' + xp + '</div><div class="scs-lbl">XP TOTAL</div></div>';
    }

    var quoteEl = document.getElementById('focusCompleteQuote');
    if (quoteEl) quoteEl.textContent = pick(quotes);

    setupRating('focusCompleteRating');
    panel.classList.add('visible');

    if (typeof Sounds !== 'undefined') Sounds.levelUp();
  }

  function hideFocusComplete() {
    var panel = document.getElementById('focusComplete');
    if (panel) panel.classList.remove('visible');
  }

  function setupRating(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var stars = container.querySelectorAll('.sc-star');
    stars.forEach(function(star) {
      star.classList.remove('active');
      star.addEventListener('click', function() {
        var rate = Number(star.dataset.rate);
        stars.forEach(function(s) {
          s.classList.toggle('active', Number(s.dataset.rate) <= rate);
        });
        if (typeof Sounds !== 'undefined') Sounds.click();
      });
    });
  }

  // Binds — Pomodoro
  var pomoNewCycle = document.getElementById('pomoNewCycle');
  if (pomoNewCycle) {
    pomoNewCycle.addEventListener('click', function() {
      hidePomoComplete();
      if (typeof Pomodoro !== 'undefined') {
        // Resetar e iniciar novo ciclo
        var startBtn = document.getElementById('pomoStart');
        if (startBtn) startBtn.click();
      }
    });
  }

  var pomoCloseComplete = document.getElementById('pomoCloseComplete');
  if (pomoCloseComplete) {
    pomoCloseComplete.addEventListener('click', function() {
      hidePomoComplete();
    });
  }

  // Binds — Focus
  var focusNewCycle = document.getElementById('focusNewCycle');
  if (focusNewCycle) {
    focusNewCycle.addEventListener('click', function() {
      hideFocusComplete();
      var startBtn = document.getElementById('focusStartBtn');
      if (startBtn) startBtn.click();
    });
  }

  var focusCloseComplete = document.getElementById('focusCloseComplete');
  if (focusCloseComplete) {
    focusCloseComplete.addEventListener('click', function() {
      hideFocusComplete();
    });
  }

  return {
    showPomoComplete: showPomoComplete,
    hidePomoComplete: hidePomoComplete,
    showFocusComplete: showFocusComplete,
    hideFocusComplete: hideFocusComplete
  };
})();