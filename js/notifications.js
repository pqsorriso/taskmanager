/**
 * notifications.js — Sistema de notificações
 * 
 * - Toast notifications in-app (estilo FCEUX)
 * - Browser notifications (com permissão)
 * - Verifica tarefas vencidas e vencendo hoje
 * - Verifica periodicamente
 * 
 * Depende de: tasks.js (TaskManager)
 */
var Notifications = (function () {

  var container = document.getElementById('toastContainer');
  var CHECK_INTERVAL = 60000; // Verifica a cada 60 segundos
  var notifiedIds = {}; // Evita notificar a mesma tarefa repetidamente
  var browserPermission = false;

  // ==========================================
  // TOAST NOTIFICATIONS (in-app)
  // ==========================================

  /**
   * Mostra um toast na tela
   * @param {string} title - Título do toast
   * @param {string} message - Mensagem
   * @param {string} type - 'info' | 'warn' | 'danger' | 'success'
   * @param {number} duration - Duração em ms (0 = não fecha sozinho)
   */
  function showToast(title, message, type, duration) {
    type = type || 'info';
    duration = duration !== undefined ? duration : 5000;

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;

    var now = new Date();
    var timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    toast.innerHTML =
      '<div class="toast-header">' +
        '<span class="toast-title">' + escapeHtml(title) + '</span>' +
        '<span>' +
          '<span class="toast-time">' + timeStr + '</span>' +
          '<span class="toast-close">✕</span>' +
        '</span>' +
      '</div>' +
      '<div class="toast-body">' + escapeHtml(message) + '</div>';

    // Fechar ao clicar no X
    toast.querySelector('.toast-close').addEventListener('click', function (e) {
      e.stopPropagation();
      closeToast(toast);
    });

    // Fechar ao clicar no toast
    toast.addEventListener('click', function () {
      closeToast(toast);
    });

    container.appendChild(toast);

    // Auto-fechar
    if (duration > 0) {
      setTimeout(function () {
        closeToast(toast);
      }, duration);
    }

    // Limitar a 5 toasts na tela
    var toasts = container.querySelectorAll('.toast');
    if (toasts.length > 5) {
      closeToast(toasts[0]);
    }

    return toast;
  }

  function closeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('closing');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ==========================================
  // BROWSER NOTIFICATIONS
  // ==========================================

    function requestPermission() {
    try {
      if (!('Notification' in window)) {
        console.log('[Notif] Browser não suporta notificações');
        return;
      }

      if (Notification.permission === 'granted') {
        browserPermission = true;
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission()
          .then(function (perm) {
            browserPermission = perm === 'granted';
            if (browserPermission) {
              showToast('Notificações', 'Notificações do navegador ativadas!', 'success', 3000);
            }
          })
          .catch(function (err) {
            console.log('[Notif] Permissão negada ou indisponível:', err);
          });
      }
    } catch (e) {
      console.log('[Notif] Notificações do navegador não disponíveis:', e);
    }
  }

    function sendBrowserNotif(title, body) {
    if (!browserPermission) return;
    try {
      new Notification(title, {
        body: body,
        tag: 'fceux-task'
      });
    } catch (e) {
      console.log('[Notif] Erro ao enviar notificação:', e);
    }
  }

  // ==========================================
  // TASK CHECKER — Verifica vencimentos
  // ==========================================

  function checkTasks() {
    var tasks = TaskManager.getAll();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayTime = today.getTime();

    var overdue = [];
    var dueToday = [];
    var dueSoon = []; // Vence em 1 dia

    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowTime = tomorrow.getTime();

    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      if (t.done || !t.dueDate) continue;

      var due = new Date(t.dueDate + 'T00:00:00');
      var dueTime = due.getTime();

      // Já notificou esta tarefa nesta sessão?
      var key = t.id + '_' + t.dueDate;

      if (dueTime < todayTime && !notifiedIds[key + '_overdue']) {
        overdue.push(t);
        notifiedIds[key + '_overdue'] = true;
      } else if (dueTime === todayTime && !notifiedIds[key + '_today']) {
        dueToday.push(t);
        notifiedIds[key + '_today'] = true;
      } else if (dueTime === tomorrowTime && !notifiedIds[key + '_soon']) {
        dueSoon.push(t);
        notifiedIds[key + '_soon'] = true;
      }
    }

      // Verificar horário limite próximo (menos de 30 min)
      if (dueTime === todayTime && t.dueTime && !notifiedIds[key + '_time']) {
        var now = new Date();
        var parts = t.dueTime.split(':');
        var dueHour = new Date();
        dueHour.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
        var diffMin = (dueHour - now) / 60000;

        if (diffMin > 0 && diffMin <= 30) {
          showToast(
            '⏰ HORÁRIO PRÓXIMO',
            t.text + ' — vence às ' + t.dueTime,
            'danger',
            10000
          );
          sendBrowserNotif(
            '⏰ ' + t.text,
            'Vence às ' + t.dueTime + ' — faltam ' + Math.round(diffMin) + ' min!'
          );
          notifiedIds[key + '_time'] = true;
        }
      }

    // Mostrar notificações
    if (overdue.length > 0) {
      for (var j = 0; j < overdue.length; j++) {
        showToast(
          '⚠️ ATRASADA',
          overdue[j].text,
          'danger',
          8000
        );
      }
      sendBrowserNotif(
        '⚠️ ' + overdue.length + ' tarefa(s) atrasada(s)!',
        overdue.map(function (t) { return t.text; }).join(', ')
      );
    }

    if (dueToday.length > 0) {
      for (var k = 0; k < dueToday.length; k++) {
        showToast(
          '📅 VENCE HOJE',
          dueToday[k].text,
          'warn',
          7000
        );
      }
      sendBrowserNotif(
        '📅 ' + dueToday.length + ' tarefa(s) vence(m) hoje!',
        dueToday.map(function (t) { return t.text; }).join(', ')
      );
    }

    if (dueSoon.length > 0) {
      for (var l = 0; l < dueSoon.length; l++) {
        showToast(
          '🔔 VENCE AMANHÃ',
          dueSoon[l].text,
          'info',
          6000
        );
      }
    }
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  function init() {
    // Pedir permissão do navegador
    requestPermission();

    // Primeira verificação após 3 segundos (dá tempo do app carregar)
      setTimeout(function () {
      checkTasks();

      const isFirstVisit = !localStorage.getItem('fceux_visited');
      if (isFirstVisit) {
        showToast(
          '👋 BEM-VINDO',
          'FCEUX Task Manager v3.0 — Gerencie suas tarefas com estilo!',
          'success',
          6000
        );
        setTimeout(function () {
          showToast(
            '💡 DICA',
            'Duplo-clique em uma tarefa para editar. F1 para ajuda.',
            'info',
            6000
          );
        }, 2000);
        localStorage.setItem('fceux_visited', 'true');
      } else {
        showToast(
          '🎮 SISTEMA',
          'Task Manager iniciado. ' + TaskManager.getPending() + ' tarefa(s) pendente(s).',
          'info',
          4000
        );
      }
    }, 3000);

    // Verificação periódica
    setInterval(checkTasks, CHECK_INTERVAL);
  }

  // API pública
  return {
    init: init,
    showToast: showToast,
    checkTasks: checkTasks
  };

})();