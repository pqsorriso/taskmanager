/**
 * countdown.js — Countdown widget COMPLETO
 * Timer com horário exato, alerta 5min, fogos ao terminar, auto-excluir
 */
var Countdown = (function() {
  var STORAGE_KEY = 'fceux_countdowns';
  var overlay = document.getElementById('countdownOverlay');
  var countdowns = [];
  var tickInterval = null;
  var alertShown = {};

  function load() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) countdowns = JSON.parse(saved);
    } catch (e) {}
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(countdowns)); }

  function open() {
    load();
    renderList();
    if (overlay) overlay.classList.add('visible');
  }

  function close() { if (overlay) overlay.classList.remove('visible'); }

  function add(name, date, time, category) {
    if (!name || !date) return;
    countdowns.push({
      name: name,
      date: date,
      time: time || '23:59',
      category: category || '',
      id: Date.now(),
      createdAt: new Date().toISOString(),
      completed: false
    });
    save();
    renderList();
    if (typeof Sounds !== 'undefined') Sounds.addTask();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('⏳ COUNTDOWN', name + ' adicionado!', 'success', 3000);
    }
  }

  function remove(id) {
    countdowns = countdowns.filter(function(c) { return c.id !== id; });
    save();
    renderList();
  }

  function edit(id) {
    var cd = countdowns.find(function(c) { return c.id === id; });
    if (!cd) return;

    var body = document.getElementById('countdownBody');
    if (!body) return;

    var html = '<div style="padding:12px">';
    html += '<button class="habit-act-btn" id="cdEditBack" style="margin-bottom:10px">← Voltar</button>';
    html += '<div style="color:var(--text-cyan);font-size:13px;font-weight:bold;margin-bottom:12px">✏️ Editar Countdown</div>';

    html += '<div style="margin:10px 0">';
    html += '<label style="color:#006688;font-size:12px;display:block;margin-bottom:4px">Nome do evento:</label>';
    html += '<input type="text" id="cdEditName" value="' + escHtml(cd.name) + '" maxlength="50" style="background:var(--bg-input);border:1px solid var(--border-light);padding:5px 8px;font-family:var(--font-main);font-size:13px;color:var(--text-green);outline:none;width:100%;box-sizing:border-box" />';
    html += '</div>';

    html += '<div style="margin:10px 0">';
    html += '<label style="color:#006688;font-size:12px;display:block;margin-bottom:4px">Data:</label>';
    html += '<input type="date" id="cdEditDate" value="' + cd.date + '" style="background:var(--bg-input);border:1px solid var(--border-light);padding:5px 8px;font-family:var(--font-main);font-size:13px;color:var(--text-yellow);outline:none;color-scheme:dark" />';
    html += '</div>';

    html += '<div style="margin:10px 0">';
    html += '<label style="color:#006688;font-size:12px;display:block;margin-bottom:4px">Horario:</label>';
    html += '<div class="time-picker">';
    html += '<span class="tp-icon">⏰</span>';
    html += '<select id="cdEditHour">';
    for (var h = 0; h < 24; h++) {
      var hh = String(h).padStart(2, '0');
      var selH = cd.time && cd.time.split(':')[0] === hh ? ' selected' : '';
      html += '<option' + selH + '>' + hh + '</option>';
    }
    html += '</select>';
    html += '<span class="tp-sep">:</span>';
    html += '<select id="cdEditMin">';
    var mins = ['00','05','10','15','20','25','30','35','40','45','50','55'];
    mins.forEach(function(m) {
      var selM = cd.time && cd.time.split(':')[1] === m ? ' selected' : '';
      html += '<option' + selM + '>' + m + '</option>';
    });
    html += '</select>';
    html += '</div></div>';

    html += '<div style="margin:10px 0">';
    html += '<label style="color:#006688;font-size:12px;display:block;margin-bottom:4px">Categoria:</label>';
    html += '<select id="cdEditCat" style="background:var(--bg-input);border:1px solid var(--border-light);padding:5px 8px;font-family:var(--font-main);font-size:13px;color:var(--text-yellow);outline:none">';
    html += '<option value=""' + (!cd.category ? ' selected' : '') + '>Nenhuma</option>';
    html += '<option value="trabalho"' + (cd.category === 'trabalho' ? ' selected' : '') + '>💼 Trabalho</option>';
    html += '<option value="pessoal"' + (cd.category === 'pessoal' ? ' selected' : '') + '>🌟 Pessoal</option>';
    html += '<option value="estudo"' + (cd.category === 'estudo' ? ' selected' : '') + '>📚 Estudo</option>';
    html += '<option value="reuniao"' + (cd.category === 'reuniao' ? ' selected' : '') + '>📅 Reuniao</option>';
    html += '<option value="deadline"' + (cd.category === 'deadline' ? ' selected' : '') + '>⏰ Deadline</option>';
    html += '</select></div>';

    html += '<button id="cdEditSave" style="background:rgba(0,150,80,0.4);border:1px solid rgba(0,200,100,0.5);color:var(--pri-baixa);font-family:var(--font-main);font-size:13px;padding:6px 24px;cursor:pointer;border-radius:4px;margin-top:8px">💾 Salvar</button>';
    html += '</div>';

    body.innerHTML = html;

    document.getElementById('cdEditBack').addEventListener('click', renderList);

    document.getElementById('cdEditSave').addEventListener('click', function() {
      var nameInput = document.getElementById('cdEditName');
      var dateInput = document.getElementById('cdEditDate');
      var hourInput = document.getElementById('cdEditHour');
      var minInput = document.getElementById('cdEditMin');
      var catInput = document.getElementById('cdEditCat');

      if (!nameInput.value.trim() || !dateInput.value) return;

      cd.name = nameInput.value.trim();
      cd.date = dateInput.value;
      cd.time = hourInput.value + ':' + minInput.value;
      cd.category = catInput.value || '';

      save();
      renderList();

      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('⏳ COUNTDOWN', cd.name + ' atualizado!', 'success', 3000);
      }
    });
  }

  function getTimeLeft(cd) {
    var now = new Date();
    var targetStr = cd.date + 'T' + (cd.time || '23:59') + ':00';
    var target = new Date(targetStr);
    var diff = target - now;

    if (diff <= 0) return { text: 'CONCLUIDO!', status: 'done', diff: 0, seconds: 0 };

    var totalSec = Math.floor(diff / 1000);
    var days = Math.floor(totalSec / 86400);
    var hours = Math.floor((totalSec % 86400) / 3600);
    var mins = Math.floor((totalSec % 3600) / 60);
    var secs = totalSec % 60;

    var text = '';
    if (days > 0) text = days + 'd ' + hours + 'h ' + mins + 'min';
    else if (hours > 0) text = hours + 'h ' + mins + 'min ' + secs + 's';
    else if (mins > 0) text = mins + 'min ' + secs + 's';
    else text = secs + 's';

    var status = 'normal';
    if (days === 0 && hours === 0 && mins <= 5) status = 'urgent';
    else if (days === 0 && hours === 0) status = 'urgent';
    else if (days <= 1) status = 'soon';

    return { text: text, status: status, diff: diff, seconds: totalSec };
  }

  function getCatIcon(cat) {
    var icons = { trabalho: '💼', pessoal: '🌟', estudo: '📚', reuniao: '📅', deadline: '⏰' };
    return icons[cat] || '⏳';
  }

  function formatDate(d) {
    var dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' +
           String(dt.getMonth() + 1).padStart(2, '0') + '/' +
           dt.getFullYear();
  }

  function renderList() {
    var body = document.getElementById('countdownBody');
    if (!body) return;

    if (!countdowns.length) {
      body.innerHTML = '<div class="cd-empty">⏳ Nenhum countdown<br><br>Adicione deadlines e eventos importantes!<br><br>Ex: Entrega do projeto, Reuniao, Prova...</div>';
      return;
    }

    body.innerHTML = '';
    countdowns.sort(function(a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });

    countdowns.forEach(function(cd) {
      var tl = getTimeLeft(cd);
      var item = document.createElement('div');
      item.className = 'cd-item';

      var timeClass = 'cd-item-time';
      if (tl.status === 'urgent') timeClass += ' urgent';
      else if (tl.status === 'done') timeClass += ' done';

      var catIcon = getCatIcon(cd.category);
      var timeStr = cd.time ? ' ⏰ ' + cd.time : '';

      item.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:start">' +
          '<div style="flex:1">' +
            '<div class="cd-item-title">' + catIcon + ' ' + escHtml(cd.name) + '</div>' +
            '<div class="' + timeClass + '">' +
              (tl.status === 'done' ? '✅ ' : '⏳ ') + tl.text +
            '</div>' +
            '<div class="cd-item-date">📅 ' + formatDate(cd.date) + timeStr + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:4px;flex-shrink:0">' +
            '<span class="cd-item-action" data-action="edit" data-id="' + cd.id + '" style="color:#006688;cursor:pointer;font-size:14px" title="Editar">✏️</span>' +
            '<span class="cd-item-action" data-action="delete" data-id="' + cd.id + '" style="color:#553333;cursor:pointer;font-size:14px" title="Excluir">🗑</span>' +
          '</div>' +
        '</div>';

      body.appendChild(item);
    });

    body.querySelectorAll('.cd-item-action').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = Number(btn.dataset.id);
        var action = btn.dataset.action;
        if (action === 'delete') {
          if (confirm('Excluir este countdown?')) {
            remove(id);
            if (typeof Sounds !== 'undefined') Sounds.deleteSound();
          }
        }
        else if (action === 'edit') edit(id);
      });
    });
  }

  // === TICK — verifica a cada segundo ===
  function tick() {
    var now = new Date();
    var changed = false;

    countdowns.forEach(function(cd) {
      if (cd.completed) return;

      var tl = getTimeLeft(cd);

      // 5 minutos finais — mostrar alerta flutuante
      if (tl.seconds > 0 && tl.seconds <= 300 && !alertShown[cd.id + '_5min']) {
        alertShown[cd.id + '_5min'] = true;
        showFloatingAlert(cd, tl);

        if (typeof Sounds !== 'undefined') Sounds.notification();
        if (typeof Notifications !== 'undefined') {
          Notifications.showToast('⏳ 5 MINUTOS!', cd.name + ' — ' + tl.text + ' restantes!', 'warn', 10000);
        }
        if (typeof Mascot !== 'undefined') {
          Mascot.setState('worry', 5000);
        }

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⏳ 5 minutos!', { body: cd.name + ' em ' + tl.text + '!' });
        }
      }

      // 1 minuto final
      if (tl.seconds > 0 && tl.seconds <= 60 && !alertShown[cd.id + '_1min']) {
        alertShown[cd.id + '_1min'] = true;
        if (typeof Sounds !== 'undefined') Sounds.notification();
        if (typeof Notifications !== 'undefined') {
          Notifications.showToast('⏳ ULTIMO MINUTO!', cd.name + ' — ' + tl.text + '!', 'danger', 10000);
        }
        updateFloatingAlert(cd, tl);
      }

      // Concluido!
      if (tl.seconds === 0 && tl.status === 'done') {
        cd.completed = true;
        changed = true;
        onCountdownComplete(cd);
      }
    });

    if (changed) save();

    // Atualizar alerta flutuante
    updateAllFloatingAlerts();

    // Atualizar lista se overlay aberto
    if (overlay && overlay.classList.contains('visible')) {
      renderList();
    }
  }

  // === ALERTA FLUTUANTE ===
  function showFloatingAlert(cd, tl) {
    var existing = document.getElementById('cdFloating_' + cd.id);
    if (existing) return;

    var alert = document.createElement('div');
    alert.id = 'cdFloating_' + cd.id;
    alert.style.cssText = 'position:fixed;top:60px;right:16px;background:rgba(0,0,40,0.96);border:2px solid rgba(255,170,0,0.5);border-radius:8px;padding:12px 16px;z-index:17000;font-family:var(--font-main);box-shadow:0 4px 20px rgba(255,170,0,0.3);animation:reminder-pulse 1s ease infinite;min-width:200px';

    alert.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span style="color:var(--text-yellow);font-size:12px;font-weight:bold">⏳ COUNTDOWN</span>' +
        '<span class="cd-float-close" data-id="' + cd.id + '" style="color:#553333;cursor:pointer;font-size:14px">✕</span>' +
      '</div>' +
      '<div style="color:var(--text-cyan);font-size:14px;font-weight:bold;margin-bottom:4px">' + escHtml(cd.name) + '</div>' +
      '<div class="cd-float-time" data-id="' + cd.id + '" style="color:var(--pri-alta);font-size:22px;font-weight:bold;text-align:center;margin:8px 0">⏳ ' + tl.text + '</div>';

    document.body.appendChild(alert);

    alert.querySelector('.cd-float-close').addEventListener('click', function() {
      alert.remove();
    });
  }

  function updateAllFloatingAlerts() {
    countdowns.forEach(function(cd) {
      var alert = document.getElementById('cdFloating_' + cd.id);
      if (!alert) return;

      var tl = getTimeLeft(cd);
      var timeEl = alert.querySelector('.cd-float-time');
      if (timeEl) {
        if (tl.status === 'done') {
          timeEl.textContent = '✅ CONCLUIDO!';
          timeEl.style.color = 'var(--pri-baixa)';
        } else {
          timeEl.textContent = '⏳ ' + tl.text;
        }
      }
    });
  }

  function updateFloatingAlert(cd, tl) {
    var alert = document.getElementById('cdFloating_' + cd.id);
    if (!alert) return;
    alert.style.borderColor = 'rgba(255,60,60,0.6)';
    alert.style.boxShadow = '0 4px 20px rgba(255,60,60,0.4)';
  }

  // === COUNTDOWN COMPLETO — fogos + auto-excluir ===
  function onCountdownComplete(cd) {
    // Fogos de artifício (confetti)
    if (typeof TaskManager !== 'undefined' && typeof TaskManager.showConfetti === 'function') {
      TaskManager.showConfetti();
    } else {
      showFireworks();
    }

    // Som
    if (typeof Sounds !== 'undefined') Sounds.levelUp();

    // Toast
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('🎉 COUNTDOWN COMPLETO!', cd.name + ' — Hora chegou!', 'success', 10000);
    }

    // Mascote
    if (typeof Mascot !== 'undefined') {
      Mascot.setState('celebrate', 5000);
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 Countdown completo!', { body: cd.name + ' — A hora chegou!' });
    }

    // Atualizar alerta flutuante
    var alert = document.getElementById('cdFloating_' + cd.id);
    if (alert) {
      alert.style.borderColor = 'rgba(0,200,100,0.5)';
      alert.style.boxShadow = '0 4px 20px rgba(0,200,100,0.4)';
    }

    // Auto-excluir após 30 segundos
    setTimeout(function() {
      // Remover alerta flutuante
      var floatEl = document.getElementById('cdFloating_' + cd.id);
      if (floatEl) floatEl.remove();

      // Remover do array
      countdowns = countdowns.filter(function(c) { return c.id !== cd.id; });
      save();

      if (overlay && overlay.classList.contains('visible')) {
        renderList();
      }
    }, 30000);
  }

  // === FOGOS DE ARTIFÍCIO ===
  function showFireworks() {
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:18000;pointer-events:none';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var particles = [];
    var colors = ['#ff4444', '#ffaa00', '#00ff44', '#44aaff', '#ff44ff', '#ffff00', '#00ffff'];

    // Criar explosões
    for (var e = 0; e < 5; e++) {
      var cx = Math.random() * canvas.width;
      var cy = Math.random() * canvas.height * 0.5 + 50;
      for (var p = 0; p < 30; p++) {
        var angle = (Math.PI * 2 * p) / 30;
        var speed = 2 + Math.random() * 4;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 2
        });
      }
    }

    var frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;

      particles.forEach(function(p) {
        p.life--;
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravidade
        p.vx *= 0.99;

        var alpha = p.life / 100;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x - p.vx, p.y - p.vy, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      frame++;

      if (alive && frame < 200) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    animate();
  }

  function escHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // === BINDS ===
  var btnCountdown = document.getElementById('btnCountdown');
  if (btnCountdown) btnCountdown.addEventListener('click', open);

  var cdClose = document.getElementById('countdownCloseBtn');
  if (cdClose) cdClose.addEventListener('click', close);

  if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

  var cdAddBtn = document.getElementById('cdAddBtn');
  if (cdAddBtn) {
    cdAddBtn.addEventListener('click', function() {
      var nameInput = document.getElementById('cdNameInput');
      var dateInput = document.getElementById('cdDateInput');
      var cdHour = document.getElementById('cdTimeHour');
      var cdMin = document.getElementById('cdTimeMin');
      var catInput = document.getElementById('cdCatInput');

      var timeVal = '';
      if (cdHour && cdMin && cdHour.value && cdMin.value) {
        timeVal = cdHour.value + ':' + cdMin.value;
      }

      if (nameInput && dateInput) {
        add(
          nameInput.value.trim(),
          dateInput.value,
          timeVal,
          catInput ? catInput.value : ''
        );
        nameInput.value = '';
        dateInput.value = '';
        if (cdHour) cdHour.value = '';
        if (cdMin) cdMin.value = '';
        if (catInput) catInput.value = '';
      }
    });
  }

  function init() {
    load();
    // Tick a cada segundo pra contagem precisa
    tickInterval = setInterval(tick, 1000);
  }

  return { init: init, open: open, close: close };
})();