/**
 * workdays.js — Configuração de dias de trabalho e férias
 * Controla quais dias tarefas recorrentes são válidas
 * Depende de: tasks.js
 */
const Workdays = (() => {
  const STORAGE_KEY = 'fceux_workdays';
  const VACATION_KEY = 'fceux_vacation';

  // Padrão: Seg a Sex
  let workdays = [1, 2, 3, 4, 5]; // 0=Dom, 1=Seg, ..., 6=Sab
  let vacation = { start: '', end: '' };
  let workHours = { start: '07:00', end: '17:00' };
  const HOURS_KEY = 'fceux_workhours';

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const overlay = document.getElementById('vacationOverlay');

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) workdays = JSON.parse(saved);
      const vac = localStorage.getItem(VACATION_KEY);
      if (vac) vacation = JSON.parse(vac);
      const hours = localStorage.getItem(HOURS_KEY);
      if (hours) workHours = JSON.parse(hours);
    } catch (e) {}
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workdays));
    localStorage.setItem(VACATION_KEY, JSON.stringify(vacation));
    localStorage.setItem(HOURS_KEY, JSON.stringify(workHours));
  }

  function isWorkday(date) {
    if (!date) return true;
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const dayOfWeek = d.getDay();

    // Verificar se é dia de trabalho
    if (!workdays.includes(dayOfWeek)) return false;

    // Verificar férias
    if (vacation.start && vacation.end) {
      const vacStart = new Date(vacation.start + 'T00:00:00');
      const vacEnd = new Date(vacation.end + 'T00:00:00');
      if (d >= vacStart && d <= vacEnd) return false;
    }

    return true;
  }

  function isToday(dateStr) {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
                     String(today.getMonth() + 1).padStart(2, '0') + '-' +
                     String(today.getDate()).padStart(2, '0');
    return dateStr === todayStr;
  }

  function isTodayWorkday() {
    return isWorkday(new Date());
  }

  function getWorkdays() { return workdays; }
  function getVacation() { return vacation; }

  // === UI ===
  function open() {
    renderDayToggles();
    document.getElementById('vacationStart').value = vacation.start || '';
    document.getElementById('vacationEnd').value = vacation.end || '';
    // Horário de trabalho
    var startParts = (workHours.start || '07:00').split(':');
    var endParts = (workHours.end || '17:00').split(':');
    var wsh = document.getElementById('workStartHour');
    var wsm = document.getElementById('workStartMin');
    var weh = document.getElementById('workEndHour');
    var wem = document.getElementById('workEndMin');
    if (wsh) wsh.value = startParts[0];
    if (wsm) wsm.value = startParts[1];
    if (weh) weh.value = endParts[0];
    if (wem) wem.value = endParts[1];
    overlay.classList.add('visible');
  }

  function close() {
    overlay.classList.remove('visible');
  }

  function renderDayToggles() {
    const row = document.getElementById('workdaysRow');
    row.innerHTML = '';
    dayNames.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.className = 'workday-toggle' + (workdays.includes(i) ? ' active' : '');
      btn.textContent = name;
      btn.addEventListener('click', () => {
        if (workdays.includes(i)) {
          workdays = workdays.filter(d => d !== i);
        } else {
          workdays.push(i);
          workdays.sort();
        }
        renderDayToggles();
      });
      row.appendChild(btn);
    });
  }

  function saveConfig() {
    vacation.start = document.getElementById('vacationStart').value;
    vacation.end = document.getElementById('vacationEnd').value;
    // Salvar horário de trabalho
    var wsh = document.getElementById('workStartHour');
    var wsm = document.getElementById('workStartMin');
    var weh = document.getElementById('workEndHour');
    var wem = document.getElementById('workEndMin');
    if (wsh && wsm) workHours.start = wsh.value + ':' + wsm.value;
    if (weh && wem) workHours.end = weh.value + ':' + wem.value;
    save();
    close();

    if (typeof Notifications !== 'undefined') {
      const dayStr = workdays.map(d => dayNames[d]).join(', ');
      Notifications.showToast('📆 WORKDAYS', 'Dias de trabalho: ' + dayStr, 'success', 3000);

      if (vacation.start && vacation.end) {
        Notifications.showToast('🏖️ FÉRIAS', 'Folga de ' + fmtDateSimple(vacation.start) + ' até ' + fmtDateSimple(vacation.end), 'info', 4000);
      }
    }

    // Recalcular tarefas atrasadas
    TaskManager.render();
  }

  function fmtDateSimple(d) {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return String(dt.getDate()).padStart(2, '0') + '/' +
           String(dt.getMonth() + 1).padStart(2, '0');
  }

  // Binds
  const btnWorkdays = document.getElementById('btnWorkdays');
  if (btnWorkdays) btnWorkdays.addEventListener('click', open);
  document.getElementById('vacationClose').addEventListener('click', close);
  document.getElementById('vacationCancelBtn').addEventListener('click', close);
  document.getElementById('vacationSaveBtn').addEventListener('click', saveConfig);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  function init() {
    load();
  }

  return {
    init: init,
    isWorkday: isWorkday,
    isTodayWorkday: isTodayWorkday,
    getWorkdays: getWorkdays,
    getVacation: getVacation,
    getWorkHours: function() { return workHours; },
    open: open
  };
})();