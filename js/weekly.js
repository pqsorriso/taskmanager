/**
 * weekly.js — Relatório semanal
 */
var Weekly = (function() {
  var overlay = document.getElementById('weeklyOverlay');
  var dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function open() {
    render();
    if (overlay) overlay.classList.add('visible');
  }

  function close() { if (overlay) overlay.classList.remove('visible'); }

  function render() {
    var body = document.getElementById('weeklyBody');
    if (!body) return;

    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var today = new Date();
    var todayStr = today.toISOString().slice(0, 10);

    // Últimos 7 dias
    var days = [];
    var maxDone = 0;
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      var key = d.toISOString().slice(0, 10);
      var done = tasks.filter(function(t) {
        if (!t.done) return false;
        if (t.completedAt && t.completedAt.startsWith(key)) return true;
        if (t.createdAt && t.createdAt.startsWith(key)) return true;
        return false;
      }).length;
      if (done > maxDone) maxDone = done;
      days.push({ date: key, day: dayNames[d.getDay()], done: done, isToday: key === todayStr });
    }

    // Stats da semana
    var weekDone = days.reduce(function(a, b) { return a + b.done; }, 0);
    var weekCreated = tasks.filter(function(t) {
      var d = new Date(today); d.setDate(d.getDate() - 7);
      return t.createdAt && t.createdAt >= d.toISOString();
    }).length;
    var avgDay = Math.round(weekDone / 7 * 10) / 10;
    var bestDay = days.reduce(function(a, b) { return b.done > a.done ? b : a; });

    // Categorias da semana
    var cats = {};
    tasks.forEach(function(t) {
      if (!t.done || !t.createdAt) return;
      var d = new Date(today); d.setDate(d.getDate() - 7);
      if (t.createdAt < d.toISOString()) return;
      var cat = t.category || 'sem categoria';
      cats[cat] = (cats[cat] || 0) + 1;
    });

    var totalPomos = parseInt(localStorage.getItem('fceux_pomos_total') || '0');
    var streak = 0;
    if (typeof Gamification !== 'undefined') streak = Gamification.getLevelInfo().streak;

    var html = '';

    // Gráfico de barras
    html += '<div style="color:var(--text-cyan);font-size:12px;margin-bottom:8px">📊 Tarefas concluídas por dia</div>';
    html += '<div class="weekly-chart">';
    days.forEach(function(day) {
      var height = maxDone > 0 ? Math.max(4, (day.done / maxDone) * 100) : 4;
      html += '<div class="weekly-bar' + (day.isToday ? ' today' : '') + '">' +
        '<div class="wb-val">' + day.done + '</div>' +
        '<div class="wb-fill" style="height:' + height + 'px"></div>' +
        '<div class="wb-day">' + day.day + '</div>' +
        '</div>';
    });
    html += '</div>';

    // Stats grid
    html += '<div class="weekly-stats">';
    html += '<div class="weekly-stat"><div class="ws-val">' + weekDone + '</div><div class="ws-lbl">FEITAS</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">' + weekCreated + '</div><div class="ws-lbl">CRIADAS</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">' + avgDay + '</div><div class="ws-lbl">MÉDIA/DIA</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">🏆 ' + bestDay.day + '</div><div class="ws-lbl">MELHOR DIA (' + bestDay.done + ')</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">🔥 ' + streak + '</div><div class="ws-lbl">STREAK</div></div>';
    html += '<div class="weekly-stat"><div class="ws-val">🍅 ' + totalPomos + '</div><div class="ws-lbl">POMODOROS</div></div>';
    html += '</div>';

    // Categorias
    var catKeys = Object.keys(cats).sort(function(a, b) { return cats[b] - cats[a]; });
    if (catKeys.length > 0) {
      var maxCat = cats[catKeys[0]];
      html += '<div style="color:var(--text-cyan);font-size:12px;margin:12px 0 8px">📁 Por categoria</div>';
      html += '<div class="weekly-cats">';
      catKeys.forEach(function(cat) {
        var pct = Math.round((cats[cat] / maxCat) * 100);
        html += '<div class="weekly-cat-row">' +
          '<span class="wc-name">' + cat + '</span>' +
          '<div class="wc-bar"><div class="wc-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="wc-val">' + cats[cat] + '</span>' +
          '</div>';
      });
      html += '</div>';
    }

    // Nota da semana
    var grade = 'F';
    if (weekDone >= 35) grade = 'S';
    else if (weekDone >= 25) grade = 'A';
    else if (weekDone >= 15) grade = 'B';
    else if (weekDone >= 8) grade = 'C';
    else if (weekDone >= 3) grade = 'D';

    html += '<div style="text-align:center;margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,100,200,0.3)">';
    html += '<div style="font-size:28px;font-weight:bold;color:var(--text-cyan)">NOTA: ' + grade + '</div>';
    html += '<div style="font-size:11px;color:#006688;margin-top:4px">' + weekDone + ' tarefas em 7 dias</div>';
    html += '</div>';

    body.innerHTML = html;
  }

  // Binds
  var closeBtn = document.getElementById('weeklyCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', close);

  if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

  var btnWeekly = document.getElementById('btnWeekly');
  if (btnWeekly) btnWeekly.addEventListener('click', open);

  return { open: open, close: close };
})();