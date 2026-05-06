/**
 * config.js — Configurações centralizadas
 */
const Config = (() => {
  const STORAGE_KEY = 'fceux_config';
  const overlay = document.getElementById('configOverlay');

  let settings = {
    pomoFocus: 25,
    pomoPause: 5,
    pomoLongBreak: 15,
    pomoLongInterval: 4,
    pomoSound: true,
    weatherCity: 'Joinville',
    toasts: true,
    browserNotif: true,
    review: true,
    confetti: true,
    xpPopup: true,
    workdays: [1, 2, 3, 4, 5],
    vacStart: '',
    vacEnd: '',
    autoScale: true,
    scaleMedia: 2,
    scaleBaixa: 3,
    sounds: true,
    particles: true,
    tooltips: true,
  };

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) settings = Object.assign(settings, JSON.parse(saved));
    } catch (e) {}
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function get(key) { return settings[key]; }

  function open() {
    load();
    document.getElementById('cfgPomoFocus').value = settings.pomoFocus;
    document.getElementById('cfgPomoPause').value = settings.pomoPause;
    const cfgLongBreak = document.getElementById('cfgPomoLongBreak');
    if (cfgLongBreak) cfgLongBreak.value = settings.pomoLongBreak;
    const cfgLongInterval = document.getElementById('cfgPomoLongInterval');
    if (cfgLongInterval) cfgLongInterval.value = settings.pomoLongInterval;
    setToggle('cfgPomoSound', settings.pomoSound);
    document.getElementById('cfgWeatherCity').value = settings.weatherCity;
    setToggle('cfgToasts', settings.toasts);
    setToggle('cfgBrowserNotif', settings.browserNotif);
    setToggle('cfgReview', settings.review);
    setToggle('cfgConfetti', settings.confetti);
    setToggle('cfgXpPopup', settings.xpPopup);
    document.getElementById('cfgVacStart').value = settings.vacStart;
    document.getElementById('cfgVacEnd').value = settings.vacEnd;
    renderWorkdays();
    // Carregar horário de trabalho
    try {
      var workHours = JSON.parse(localStorage.getItem('fceux_workhours') || '{"start":"07:00","end":"17:00"}');
      var startParts = workHours.start.split(':');
      var endParts = workHours.end.split(':');
      var wsh = document.getElementById('cfgWorkStartHour');
      var wsm = document.getElementById('cfgWorkStartMin');
      var weh = document.getElementById('cfgWorkEndHour');
      var wem = document.getElementById('cfgWorkEndMin');
      if (wsh) wsh.value = startParts[0];
      if (wsm) wsm.value = startParts[1];
      if (weh) weh.value = endParts[0];
      if (wem) wem.value = endParts[1];
    } catch(e) {}
    setToggle('cfgAutoScale', settings.autoScale);
    const cfgScaleMedia = document.getElementById('cfgScaleMedia');
    if (cfgScaleMedia) cfgScaleMedia.value = settings.scaleMedia;
    const cfgScaleBaixa = document.getElementById('cfgScaleBaixa');
    if (cfgScaleBaixa) cfgScaleBaixa.value = settings.scaleBaixa;
    overlay.classList.add('visible');
    setToggle('cfgSounds', settings.sounds);
    setToggle('cfgParticles', settings.particles);
    setToggle('cfgTooltips', settings.tooltips);

    // Tema
    const currentTheme = typeof Themes !== 'undefined' ? Themes.getCurrent() : 'dark';
    document.querySelectorAll('#cfgThemes .theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
      btn.addEventListener('click', () => {
        document.querySelectorAll('#cfgThemes .theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (typeof Themes !== 'undefined') Themes.apply(btn.dataset.theme);
      });
    });
  }

  function close() { overlay.classList.remove('visible'); }

  function setToggle(id, val) {
    const el = document.getElementById(id);
    if (val) el.classList.add('active');
    else el.classList.remove('active');
  }

  function getToggle(id) {
    return document.getElementById(id).classList.contains('active');
  }

  function renderWorkdays() {
    const container = document.getElementById('cfgWorkdays');
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    container.innerHTML = '';
    dayNames.forEach((name, i) => {
      const btn = document.createElement('button');
      btn.className = 'workday-toggle' + (settings.workdays.includes(i) ? ' active' : '');
      btn.textContent = name;
      btn.addEventListener('click', () => {
        if (settings.workdays.includes(i)) {
          settings.workdays = settings.workdays.filter(d => d !== i);
        } else {
          settings.workdays.push(i);
          settings.workdays.sort();
        }
        renderWorkdays();
      });
      container.appendChild(btn);
    });
  }

  function saveConfig() {
    settings.pomoFocus = Number(document.getElementById('cfgPomoFocus').value) || 25;
    settings.pomoPause = Number(document.getElementById('cfgPomoPause').value) || 5;
    settings.pomoLongBreak = Number(document.getElementById('cfgPomoLongBreak').value) || 15;
    settings.pomoLongInterval = Number(document.getElementById('cfgPomoLongInterval').value) || 4;
    settings.pomoSound = getToggle('cfgPomoSound');
    settings.weatherCity = document.getElementById('cfgWeatherCity').value.trim() || 'Joinville';
    settings.toasts = getToggle('cfgToasts');
    settings.browserNotif = getToggle('cfgBrowserNotif');
    settings.review = getToggle('cfgReview');
    settings.confetti = getToggle('cfgConfetti');
    settings.xpPopup = getToggle('cfgXpPopup');
    settings.vacStart = document.getElementById('cfgVacStart').value;
    settings.vacEnd = document.getElementById('cfgVacEnd').value;
    settings.autoScale = getToggle('cfgAutoScale');
    settings.scaleMedia = Number(document.getElementById('cfgScaleMedia').value) || 2;
    settings.scaleBaixa = Number(document.getElementById('cfgScaleBaixa').value) || 3;
    settings.sounds = getToggle('cfgSounds');
    settings.particles = getToggle('cfgParticles');
    settings.tooltips = getToggle('cfgTooltips');

    // Aplicar partículas
    if (typeof Particles !== 'undefined') {
      if (settings.particles) Particles.start();
      else Particles.stop();
    }
    save();

    // Atualizar Workdays se existir
    if (typeof Workdays !== 'undefined') {
      localStorage.setItem('fceux_workdays', JSON.stringify(settings.workdays));
      localStorage.setItem('fceux_vacation', JSON.stringify({ start: settings.vacStart, end: settings.vacEnd }));

      // Salvar horário de trabalho
      var wsh = document.getElementById('cfgWorkStartHour');
      var wsm = document.getElementById('cfgWorkStartMin');
      var weh = document.getElementById('cfgWorkEndHour');
      var wem = document.getElementById('cfgWorkEndMin');
      var workHours = {
        start: (wsh ? wsh.value : '07') + ':' + (wsm ? wsm.value : '00'),
        end: (weh ? weh.value : '17') + ':' + (wem ? wem.value : '00')
      };
      localStorage.setItem('fceux_workhours', JSON.stringify(workHours));
    }

    // Aplicar tema
    if (typeof Themes !== 'undefined') {
      const themeBtn = document.querySelector('#cfgThemes .theme-btn.active');
      if (themeBtn) Themes.apply(themeBtn.dataset.theme);
    }

    close();
    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('⚙️ CONFIG', 'Configurações salvas!', 'success', 3000);
    }
  }

  // Binds
  document.getElementById('btnConfig').addEventListener('click', open);
  document.getElementById('configCloseBtn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.getElementById('cfgSaveBtn').addEventListener('click', saveConfig);

  // Toggles
  document.querySelectorAll('.config-toggle').forEach(t => {
    t.addEventListener('click', () => t.classList.toggle('active'));
  });

  // Clear all
  document.getElementById('cfgClearAll').addEventListener('click', async () => {
    if (!confirm('ATENÇÃO: Isso vai apagar TODAS as tarefas, hábitos, templates e configurações. Continuar?')) return;
    if (!confirm('Tem certeza? Essa ação NÃO pode ser desfeita!')) return;
    await TaskDB.clear();
    localStorage.clear();
    location.reload();
  });

  function init() { load(); }

  return { init, get, open, close };
})();