/**
 * outlook.js — Integração com Outlook
 * Exportar tarefa como .ics (calendário) e enviar por email
 */
var Outlook = (function() {

  // === GERAR .ICS ===
  function exportICS(task) {
    if (!task) return;

    var now = new Date();
    var uid = 'fceux-' + task.id + '-' + now.getTime() + '@fceux';

    // Data início
    var startDate = task.dueDate ? new Date(task.dueDate + 'T' + (task.dueTime || '09:00') + ':00') : now;
    var endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    if (task.estimate && task.estimate > 0) {
      endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + task.estimate);
    }

    var dtStart = formatICSDate(startDate);
    var dtEnd = formatICSDate(endDate);
    var dtStamp = formatICSDate(now);

    // Descrição
    var desc = '';
    if (task.description) desc += task.description + '\\n\\n';
    desc += 'Prioridade: ' + (task.priority || 'media').toUpperCase() + '\\n';
    if (task.category) desc += 'Categoria: ' + task.category + '\\n';
    if (task.estimate) desc += 'Estimativa: ' + task.estimate + ' min\\n';
    if (task.tags && task.tags.length > 0) desc += 'Tags: ' + task.tags.join(', ') + '\\n';

    if (task.subtasks && task.subtasks.length > 0) {
      desc += '\\nSubtarefas:\\n';
      task.subtasks.forEach(function(s) {
        desc += (s.done ? '[x] ' : '[ ] ') + s.text + '\\n';
      });
    }

    desc += '\\nExportado do FCEUX Task Manager';

    // Prioridade ICS (1=alta, 5=media, 9=baixa)
    var priority = '5';
    if (task.priority === 'alta') priority = '1';
    else if (task.priority === 'baixa') priority = '9';

    // Alarme
    var alarm = '';
    if (task.dueDate) {
      alarm = 'BEGIN:VALARM\r\n' +
        'TRIGGER:-PT15M\r\n' +
        'ACTION:DISPLAY\r\n' +
        'DESCRIPTION:FCEUX: ' + escICS(task.text) + '\r\n' +
        'END:VALARM\r\n';
    }

    var ics = 'BEGIN:VCALENDAR\r\n' +
      'VERSION:2.0\r\n' +
      'PRODID:-//FCEUX Task Manager//PT\r\n' +
      'CALSCALE:GREGORIAN\r\n' +
      'METHOD:PUBLISH\r\n' +
      'BEGIN:VEVENT\r\n' +
      'UID:' + uid + '\r\n' +
      'DTSTAMP:' + dtStamp + '\r\n' +
      'DTSTART:' + dtStart + '\r\n' +
      'DTEND:' + dtEnd + '\r\n' +
      'SUMMARY:' + escICS(task.text) + '\r\n' +
      'DESCRIPTION:' + desc + '\r\n' +
      'PRIORITY:' + priority + '\r\n' +
      'STATUS:CONFIRMED\r\n' +
      alarm +
      'END:VEVENT\r\n' +
      'END:VCALENDAR';

    // Download
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = slugify(task.text) + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof Sounds !== 'undefined') Sounds.complete();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📅 OUTLOOK', 'Evento exportado! Abra o arquivo .ics no Outlook.', 'success', 5000);
    }
  }

  // === ENVIAR POR EMAIL ===
  function sendEmail(task) {
    if (!task) return;

    var subject = encodeURIComponent('[FCEUX] ' + task.text);

    var body = '';
    body += '📋 TAREFA: ' + task.text + '\n\n';
    body += '⚡ Prioridade: ' + (task.priority || 'media').toUpperCase() + '\n';
    if (task.dueDate) body += '📅 Vencimento: ' + formatDateBR(task.dueDate) + (task.dueTime ? ' às ' + task.dueTime : '') + '\n';
    if (task.category) body += '📁 Categoria: ' + task.category + '\n';
    if (task.estimate) body += '📏 Estimativa: ' + task.estimate + ' min\n';
    if (task.description) body += '\n📝 Descrição:\n' + task.description + '\n';

    if (task.subtasks && task.subtasks.length > 0) {
      body += '\n📋 Subtarefas:\n';
      task.subtasks.forEach(function(s) {
        body += (s.done ? '  ✅ ' : '  ⬜ ') + s.text + '\n';
      });
    }

    if (task.tags && task.tags.length > 0) {
      body += '\n🏷️ Tags: ' + task.tags.join(', ') + '\n';
    }

    body += '\n─────────────────────\n';
    body += 'Enviado do FCEUX Task Manager\n';
    body += 'https://pqsorriso.github.io/TaskManager/';

    var encodedBody = encodeURIComponent(body);

    // Abrir Outlook/email padrão
    window.location.href = 'mailto:?subject=' + subject + '&body=' + encodedBody;

    if (typeof Sounds !== 'undefined') Sounds.click();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📧 EMAIL', 'Abrindo Outlook com a tarefa...', 'info', 4000);
    }
  }

  // === EXPORTAR TAREFAS DO DIA COMO ICS ===
  function exportDayICS() {
    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var today = new Date().toISOString().slice(0, 10);
    var todayTasks = tasks.filter(function(t) {
      return !t.done && (t.dueDate === today || (!t.dueDate && t.priority === 'alta'));
    });

    if (todayTasks.length === 0) {
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('📅 OUTLOOK', 'Nenhuma tarefa pra hoje!', 'info', 3000);
      }
      return;
    }

    var now = new Date();
    var uid = 'fceux-day-' + now.getTime() + '@fceux';
    var dtStamp = formatICSDate(now);

    var ics = 'BEGIN:VCALENDAR\r\n' +
      'VERSION:2.0\r\n' +
      'PRODID:-//FCEUX Task Manager//PT\r\n' +
      'CALSCALE:GREGORIAN\r\n' +
      'METHOD:PUBLISH\r\n';

    todayTasks.forEach(function(task, i) {
      var startDate = new Date(today + 'T' + (task.dueTime || String(9 + i).padStart(2, '0') + ':00') + ':00');
      var endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + (task.estimate || 60));

      var priority = '5';
      if (task.priority === 'alta') priority = '1';
      else if (task.priority === 'baixa') priority = '9';

      ics += 'BEGIN:VEVENT\r\n' +
        'UID:fceux-' + task.id + '-' + now.getTime() + '@fceux\r\n' +
        'DTSTAMP:' + dtStamp + '\r\n' +
        'DTSTART:' + formatICSDate(startDate) + '\r\n' +
        'DTEND:' + formatICSDate(endDate) + '\r\n' +
        'SUMMARY:' + escICS(task.text) + '\r\n' +
        'DESCRIPTION:' + escICS(task.description || '') + '\\nPrioridade: ' + (task.priority || 'media').toUpperCase() + '\r\n' +
        'PRIORITY:' + priority + '\r\n' +
        'STATUS:CONFIRMED\r\n' +
        'BEGIN:VALARM\r\n' +
        'TRIGGER:-PT10M\r\n' +
        'ACTION:DISPLAY\r\n' +
        'DESCRIPTION:FCEUX: ' + escICS(task.text) + '\r\n' +
        'END:VALARM\r\n' +
        'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR';

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'fceux-dia-' + today + '.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof Sounds !== 'undefined') Sounds.complete();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📅 OUTLOOK', todayTasks.length + ' tarefas exportadas pro calendário!', 'success', 5000);
    }
  }

  // === ENVIAR RESUMO DO DIA POR EMAIL ===
  function emailDaySummary() {
    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var today = new Date().toISOString().slice(0, 10);
    var pending = tasks.filter(function(t) { return !t.done; });
    var doneToday = tasks.filter(function(t) { return t.done && t.createdAt && t.createdAt.startsWith(today); });
    var dueToday = pending.filter(function(t) { return t.dueDate === today; });

    var subject = encodeURIComponent('[FCEUX] Resumo do dia — ' + formatDateBR(today));

    var body = '📊 RESUMO DO DIA — ' + formatDateBR(today) + '\n\n';
    body += '✅ Concluídas hoje: ' + doneToday.length + '\n';
    body += '📋 Pendentes: ' + pending.length + '\n';
    if (dueToday.length > 0) body += '⚠️ Vencem hoje: ' + dueToday.length + '\n';

    if (doneToday.length > 0) {
      body += '\n── FEITAS HOJE ──\n';
      doneToday.forEach(function(t) {
        body += '  ✅ ' + t.text + '\n';
      });
    }

    if (dueToday.length > 0) {
      body += '\n── VENCEM HOJE ──\n';
      dueToday.forEach(function(t) {
        body += '  ⚠️ ' + t.text + (t.dueTime ? ' às ' + t.dueTime : '') + '\n';
      });
    }

    if (pending.length > 0) {
      body += '\n── TOP 5 PENDENTES ──\n';
      pending.slice(0, 5).forEach(function(t) {
        var pri = t.priority === 'alta' ? '🔴' : t.priority === 'media' ? '🟡' : '🟢';
        body += '  ' + pri + ' ' + t.text + (t.dueDate ? ' (vence ' + formatDateBR(t.dueDate) + ')' : '') + '\n';
      });
    }

    body += '\n─────────────────────\n';
    body += 'FCEUX Task Manager\n';
    body += 'https://pqsorriso.github.io/TaskManager/';

    window.location.href = 'mailto:?subject=' + subject + '&body=' + encodeURIComponent(body);

    if (typeof Sounds !== 'undefined') Sounds.click();
  }

  // === UTILS ===
  function formatICSDate(d) {
    return d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') + 'T' +
      String(d.getHours()).padStart(2, '0') +
      String(d.getMinutes()).padStart(2, '0') +
      String(d.getSeconds()).padStart(2, '0');
  }

  function formatDateBR(d) {
    if (!d) return '';
    var dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' +
      String(dt.getMonth() + 1).padStart(2, '0') + '/' +
      dt.getFullYear();
  }

  function escICS(s) {
    if (!s) return '';
    return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 30) || 'tarefa';
  }

  var btnOutlookDay = document.getElementById('btnOutlookDay');
  if (btnOutlookDay) {
    btnOutlookDay.addEventListener('click', function() {
      var menu = document.getElementById('outlookDayMenu');
      if (menu) {
        menu.classList.toggle('visible');
        return;
      }
      // Criar menu
      var m = document.createElement('div');
      m.className = 'outlook-menu visible';
      m.id = 'outlookDayMenu';
      m.style.position = 'fixed';
      m.style.bottom = '50px';
      m.innerHTML =
        '<div class="outlook-menu-item" id="omExportDay">📅 Exportar tarefas do dia (.ics)</div>' +
        '<div class="outlook-menu-item" id="omEmailSummary">📧 Enviar resumo por email</div>';
      document.body.appendChild(m);

      var rect = btnOutlookDay.getBoundingClientRect();
      m.style.left = rect.left + 'px';
      m.style.bottom = (window.innerHeight - rect.top + 5) + 'px';

      document.getElementById('omExportDay').addEventListener('click', function() {
        m.remove();
        exportDayICS();
      });

      document.getElementById('omEmailSummary').addEventListener('click', function() {
        m.remove();
        emailDaySummary();
      });

      setTimeout(function() {
        document.addEventListener('click', function closeMenu(e) {
          if (!m.contains(e.target) && e.target !== btnOutlookDay) {
            m.remove();
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 100);
    });
  }

  // === EXPORTAR PDF ===
  function exportPDF() {
    var tasks = typeof TaskManager !== 'undefined' ? TaskManager.getAll() : [];
    var today = new Date();
    var todayStr = today.toISOString().slice(0, 10);
    var pending = tasks.filter(function(t) { return !t.done; });
    var done = tasks.filter(function(t) { return t.done; });

    var win = window.open('', '_blank');
    if (!win) {
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('❌ PDF', 'Permita popups para gerar o PDF!', 'danger', 5000);
      }
      return;
    }

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
    html += '<title>FCEUX Task Manager — Relatório</title>';
    html += '<style>';
    html += 'body{font-family:Segoe UI,sans-serif;padding:30px;color:#333;max-width:800px;margin:0 auto}';
    html += 'h1{color:#1a3a5c;border-bottom:3px solid #1a3a5c;padding-bottom:8px;font-size:22px}';
    html += 'h2{color:#2a5a8c;margin-top:24px;font-size:16px;border-bottom:1px solid #ddd;padding-bottom:4px}';
    html += '.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}';
    html += '.header .date{color:#666;font-size:13px}';
    html += '.stats{display:flex;gap:16px;margin:16px 0}';
    html += '.stat-box{background:#f0f4f8;border:1px solid #d0d8e0;border-radius:6px;padding:12px 20px;text-align:center;flex:1}';
    html += '.stat-box .val{font-size:28px;font-weight:bold;color:#1a3a5c}';
    html += '.stat-box .lbl{font-size:11px;color:#666;margin-top:4px}';
    html += 'table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}';
    html += 'th{background:#1a3a5c;color:#fff;padding:8px 10px;text-align:left;font-size:11px}';
    html += 'td{padding:6px 10px;border-bottom:1px solid #e0e0e0}';
    html += 'tr:nth-child(even) td{background:#f8f8f8}';
    html += '.pri-alta{color:#cc0000;font-weight:bold}';
    html += '.pri-media{color:#cc8800}';
    html += '.pri-baixa{color:#008844}';
    html += '.done{color:#999;text-decoration:line-through}';
    html += '.overdue{color:#cc0000;font-size:10px}';
    html += '.footer{margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center}';
    html += '@media print{body{padding:15px}.stat-box{break-inside:avoid}}';
    html += '</style></head><body>';

    // Header
    html += '<div class="header">';
    html += '<h1>📋 FCEUX Task Manager</h1>';
    html += '<div class="date">Gerado em: ' + formatDateBR(todayStr) + ' às ' + String(today.getHours()).padStart(2,'0') + ':' + String(today.getMinutes()).padStart(2,'0') + '</div>';
    html += '</div>';

    // Stats
    var pct = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;
    html += '<div class="stats">';
    html += '<div class="stat-box"><div class="val">' + tasks.length + '</div><div class="lbl">TOTAL</div></div>';
    html += '<div class="stat-box"><div class="val">' + done.length + '</div><div class="lbl">CONCLUÍDAS</div></div>';
    html += '<div class="stat-box"><div class="val">' + pending.length + '</div><div class="lbl">PENDENTES</div></div>';
    html += '<div class="stat-box"><div class="val">' + pct + '%</div><div class="lbl">PROGRESSO</div></div>';
    html += '</div>';

    // Pendentes
    if (pending.length > 0) {
      html += '<h2>📌 Tarefas Pendentes (' + pending.length + ')</h2>';
      html += '<table><tr><th>Tarefa</th><th>Prioridade</th><th>Vencimento</th><th>Categoria</th></tr>';
      pending.forEach(function(t) {
        var priClass = 'pri-' + (t.priority || 'media');
        var overdue = '';
        if (t.dueDate) {
          var due = new Date(t.dueDate + 'T00:00:00');
          var todayD = new Date(); todayD.setHours(0,0,0,0);
          if (due < todayD) overdue = ' <span class="overdue">⚠️ ATRASADA</span>';
        }
        html += '<tr>';
        html += '<td>' + escHtml(t.text) + overdue + '</td>';
        html += '<td class="' + priClass + '">' + (t.priority || 'media').toUpperCase() + '</td>';
        html += '<td>' + (t.dueDate ? formatDateBR(t.dueDate) + (t.dueTime ? ' ' + t.dueTime : '') : '—') + '</td>';
        html += '<td>' + (t.category || '—') + '</td>';
        html += '</tr>';
      });
      html += '</table>';
    }

    // Concluídas recentes (últimos 7 dias)
    var recentDone = done.filter(function(t) {
      var d = new Date(today); d.setDate(d.getDate() - 7);
      var ts = t.completedAt || t.createdAt || '';
      return ts >= d.toISOString();
    });

    if (recentDone.length > 0) {
      html += '<h2>✅ Concluídas (últimos 7 dias: ' + recentDone.length + ')</h2>';
      html += '<table><tr><th>Tarefa</th><th>Prioridade</th><th>Concluída em</th></tr>';
      recentDone.forEach(function(t) {
        var ts = t.completedAt || t.createdAt || '';
        html += '<tr class="done">';
        html += '<td>' + escHtml(t.text) + '</td>';
        html += '<td>' + (t.priority || 'media').toUpperCase() + '</td>';
        html += '<td>' + (ts ? formatDateBR(ts.substring(0, 10)) : '—') + '</td>';
        html += '</tr>';
      });
      html += '</table>';
    }

    // Gamification
    if (typeof Gamification !== 'undefined') {
      var info = Gamification.getLevelInfo();
      html += '<h2>🎮 Gamificação</h2>';
      html += '<div class="stats">';
      html += '<div class="stat-box"><div class="val">⭐ Nv.' + info.level + '</div><div class="lbl">' + info.name + '</div></div>';
      html += '<div class="stat-box"><div class="val">' + info.xp + '</div><div class="lbl">XP TOTAL</div></div>';
      html += '<div class="stat-box"><div class="val">🔥 ' + info.streak + '</div><div class="lbl">STREAK</div></div>';
      html += '</div>';
    }

    html += '<div class="footer">FCEUX Task Manager v3.0 — by Gustavo Nogueira — pqsorriso.github.io/TaskManager</div>';
    html += '</body></html>';

    win.document.write(html);
    win.document.close();

    setTimeout(function() {
      win.print();
    }, 500);

    if (typeof Sounds !== 'undefined') Sounds.complete();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('📄 PDF', 'Relatório gerado! Use Ctrl+P para salvar como PDF.', 'success', 5000);
    }
  }

  function escHtml(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  var btnExportPDF = document.getElementById('btnExportPDF');
  if (btnExportPDF) {
    btnExportPDF.addEventListener('click', exportPDF);
  }

  return {
    exportICS: exportICS,
    sendEmail: sendEmail,
    exportDayICS: exportDayICS,
    emailDaySummary: emailDaySummary,
    exportPDF: exportPDF
  };
})();