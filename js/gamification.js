/**
 * gamification.js — XP, Níveis, Streak
 */
const Gamification = (() => {
  const STORAGE_KEY = 'fceux_gamification';

  const levels = [
    { name: 'Aprendiz', xp: 0 },
    { name: 'Iniciante', xp: 100 },
    { name: 'Praticante', xp: 300 },
    { name: 'Competente', xp: 600 },
    { name: 'Experiente', xp: 1000 },
    { name: 'Avançado', xp: 1500 },
    { name: 'Especialista', xp: 2500 },
    { name: 'Mestre', xp: 4000 },
    { name: 'Grão-Mestre', xp: 6000 },
    { name: 'Lenda', xp: 10000 },
  ];

  const xpValues = { baixa: 10, media: 20, alta: 30 };

  let data = { xp: 0, streak: 0, lastActiveDate: '', totalCompleted: 0 };

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) data = JSON.parse(saved);
    } catch (e) {}
    checkStreak();
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  function checkStreak() {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (data.lastActiveDate === today) return;
    if (data.lastActiveDate === yesterday) {
      // Streak continues
    } else if (data.lastActiveDate !== today) {
      data.streak = 0;
    }
  }

  function getLevel() {
    let lvl = 0;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (data.xp >= levels[i].xp) { lvl = i; break; }
    }
    return lvl;
  }

  function getLevelInfo() {
    const lvl = getLevel();
    const current = levels[lvl];
    const next = levels[lvl + 1] || { xp: current.xp + 1000 };
    const xpInLevel = data.xp - current.xp;
    const xpNeeded = next.xp - current.xp;
    const pct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
    return { level: lvl + 1, name: current.name, xp: data.xp, xpInLevel, xpNeeded, pct, streak: data.streak };
  }

  function addXP(amount, reason) {
    const oldLevel = getLevel();
    data.xp += amount;
    data.totalCompleted++;

    const today = new Date().toISOString().slice(0, 10);
    if (data.lastActiveDate !== today) {
      if (data.lastActiveDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
        data.streak++;
      } else {
        data.streak = 1;
      }
      data.lastActiveDate = today;
    }

    save();
    renderXPBar();

    // Show popup
    showXPPopup(amount, reason);

    // Level up?
    const newLevel = getLevel();
    if (typeof Sounds !== 'undefined') Sounds.levelUp();
    if (newLevel > oldLevel) {
    if (typeof Mascot !== 'undefined') Mascot.onLevelUp();
      setTimeout(() => {
        const info = getLevelInfo();
        if (typeof Notifications !== 'undefined') {
          Notifications.showToast('🎉 LEVEL UP!', 'Nível ' + info.level + ' — ' + info.name + '!', 'success', 6000);
        }
      }, 1500);
    }
  }

  function taskCompleted(priority) {
    const base = xpValues[priority] || 15;
    let bonus = 1;

    // Streak bonus
    if (data.streak >= 7) bonus = 1.5;
    else if (data.streak >= 3) bonus = 1.2;

    const total = Math.round(base * bonus);
    const reason = priority.toUpperCase() + (bonus > 1 ? ' (🔥 x' + bonus + ')' : '');
    addXP(total, reason);
  }

  function showXPPopup(amount, reason) {
    const popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.innerHTML =
      '<div class="xpp-title">⭐ XP</div>' +
      '<div class="xpp-amount">+' + amount + '</div>' +
      '<div class="xpp-reason">' + reason + '</div>';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 2000);
  }

  function renderXPBar() {
    const info = getLevelInfo();
    document.getElementById('xpLevel').textContent = '⭐ Nv.' + info.level + ' ' + info.name;
    document.getElementById('xpFill').style.width = info.pct + '%';
    document.getElementById('xpText').textContent = info.xpInLevel + '/' + info.xpNeeded + ' XP';
    document.getElementById('xpStreak').textContent = info.streak > 0 ? '🔥 ' + info.streak + ' dia(s)' : '';
  }

  function init() {
    load();
    renderXPBar();
  }

    function addBonusXP(amount, reason) {
    data.xp += amount;
    save();
    renderXPBar();

    if (typeof Notifications !== 'undefined') {
      Notifications.showToast('⭐ BÔNUS XP', '+' + amount + ' XP! ' + reason, 'success', 3000);
    }

    // Popup
    showXPPopup(amount, reason);

    // Check level up
    const oldLevel = getLevel();
    const newLevel = getLevel();
    if (newLevel > oldLevel && typeof Mascot !== 'undefined') {
      Mascot.onLevelUp();
    }
    if (typeof Pet !== 'undefined') Pet.checkUnlock();
  }

  return { init, taskCompleted, getLevelInfo, renderXPBar, addBonusXP };
})();