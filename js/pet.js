/**
 * pet.js — Pet do mascote PIXEL
 * Desbloqueado no nível 5. Evolui: gato → cachorro → dragão
 */
const Pet = (() => {
  const petCanvas = document.getElementById('petCanvas');
  const petCtx = petCanvas ? petCanvas.getContext('2d') : null;
  const petContainer = document.getElementById('mascotPet');

  const STORAGE_KEY = 'fceux_pet';
  let petData = {
    unlocked: false,
    type: 'cat',
    name: 'BYTE'
  };

  const petTypes = {
    cat: { name: 'Gato', minLevel: 5 },
    dog: { name: 'Cachorro', minLevel: 7 },
    dragon: { name: 'Dragão', minLevel: 10 }
  };

  function px(x, y, color) {
    if (!petCtx) return;
    petCtx.fillStyle = color;
    petCtx.fillRect(x, y, 1, 1);
  }

  function clear() {
    if (!petCtx) return;
    petCtx.clearRect(0, 0, 14, 14);
  }

  // === DESENHAR PETS ===
  function drawCat() {
    clear();
    // Orelhas
    px(3, 2, '#aa8866'); px(4, 2, '#aa8866');
    px(9, 2, '#aa8866'); px(10, 2, '#aa8866');
    px(3, 3, '#aa8866'); px(10, 3, '#aa8866');
    // Cabeça
    px(4, 3, '#cc9966'); px(5, 3, '#cc9966'); px(6, 3, '#cc9966');
    px(7, 3, '#cc9966'); px(8, 3, '#cc9966'); px(9, 3, '#cc9966');
    for (let x = 3; x <= 10; x++) px(x, 4, '#cc9966');
    for (let x = 3; x <= 10; x++) px(x, 5, '#cc9966');
    for (let x = 4; x <= 9; x++) px(x, 6, '#cc9966');
    // Olhos
    px(5, 4, '#00ff44'); px(8, 4, '#00ff44');
    px(5, 5, '#000000'); px(8, 5, '#000000');
    // Nariz
    px(6, 5, '#ff8888'); px(7, 5, '#ff8888');
    // Bigodes
    px(2, 5, '#ddbbaa'); px(11, 5, '#ddbbaa');
    px(2, 4, '#ddbbaa'); px(11, 4, '#ddbbaa');
    // Corpo
    for (let x = 4; x <= 9; x++) px(x, 7, '#cc9966');
    for (let x = 4; x <= 9; x++) px(x, 8, '#cc9966');
    for (let x = 5; x <= 8; x++) px(x, 9, '#cc9966');
    // Patas
    px(4, 9, '#aa8866'); px(5, 9, '#aa8866');
    px(8, 9, '#aa8866'); px(9, 9, '#aa8866');
    px(4, 10, '#aa8866'); px(9, 10, '#aa8866');
    // Rabo
    px(10, 7, '#cc9966'); px(11, 6, '#cc9966'); px(12, 5, '#cc9966');
  }

  function drawDog() {
    clear();
    // Orelhas (caídas)
    px(2, 3, '#886644'); px(2, 4, '#886644'); px(2, 5, '#886644');
    px(11, 3, '#886644'); px(11, 4, '#886644'); px(11, 5, '#886644');
    // Cabeça
    for (let x = 3; x <= 10; x++) px(x, 3, '#bb8844');
    for (let x = 3; x <= 10; x++) px(x, 4, '#bb8844');
    for (let x = 3; x <= 10; x++) px(x, 5, '#bb8844');
    for (let x = 4; x <= 9; x++) px(x, 6, '#bb8844');
    // Olhos
    px(5, 4, '#222222'); px(8, 4, '#222222');
    // Nariz
    px(6, 5, '#333333'); px(7, 5, '#333333');
    // Língua
    px(7, 6, '#ff6666');
    // Corpo
    for (let x = 4; x <= 9; x++) px(x, 7, '#bb8844');
    for (let x = 4; x <= 9; x++) px(x, 8, '#bb8844');
    for (let x = 5; x <= 8; x++) px(x, 9, '#bb8844');
    // Patas
    px(4, 9, '#996633'); px(5, 9, '#996633');
    px(8, 9, '#996633'); px(9, 9, '#996633');
    px(4, 10, '#996633'); px(9, 10, '#996633');
    // Rabo (levantado, feliz)
    px(10, 6, '#bb8844'); px(11, 5, '#bb8844'); px(12, 4, '#bb8844');
    px(12, 3, '#bb8844');
  }

  function drawDragon() {
    clear();
    // Chifres
    px(3, 1, '#ffaa00'); px(4, 2, '#ffaa00');
    px(10, 1, '#ffaa00'); px(9, 2, '#ffaa00');
    // Cabeça
    for (let x = 4; x <= 9; x++) px(x, 3, '#44aa44');
    for (let x = 3; x <= 10; x++) px(x, 4, '#44aa44');
    for (let x = 3; x <= 10; x++) px(x, 5, '#44aa44');
    for (let x = 4; x <= 9; x++) px(x, 6, '#44aa44');
    // Olhos (fogo)
    px(5, 4, '#ff4400'); px(8, 4, '#ff4400');
    // Nariz (fumaça)
    px(6, 6, '#888888'); px(7, 6, '#888888');
    px(5, 7, '#aaaaaa');
    // Corpo
    for (let x = 4; x <= 9; x++) px(x, 7, '#338833');
    for (let x = 4; x <= 9; x++) px(x, 8, '#338833');
    // Escamas
    px(5, 7, '#44aa44'); px(7, 7, '#44aa44');
    // Asas
    px(2, 6, '#66cc66'); px(1, 5, '#66cc66'); px(0, 4, '#66cc66');
    px(11, 6, '#66cc66'); px(12, 5, '#66cc66'); px(13, 4, '#66cc66');
    // Patas
    px(4, 9, '#338833'); px(5, 9, '#338833');
    px(8, 9, '#338833'); px(9, 9, '#338833');
    // Rabo com fogo
    px(10, 8, '#338833'); px(11, 7, '#338833');
    px(12, 7, '#ff4400'); px(12, 6, '#ff8800');
  }

  const drawFns = { cat: drawCat, dog: drawDog, dragon: drawDragon };

  function redraw() {
    if (!petData.unlocked) {
      if (petContainer) petContainer.style.display = 'none';
      return;
    }
    if (petContainer) petContainer.style.display = '';
    (drawFns[petData.type] || drawCat)();
  }

  function checkUnlock() {
    if (typeof Gamification === 'undefined') return;
    const level = Gamification.getLevelInfo().level;

    if (level >= 5 && !petData.unlocked) {
      petData.unlocked = true;
      petData.type = 'cat';
      save();
      redraw();
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🐱 PET DESBLOQUEADO!', 'BYTE, o gato, agora acompanha PIXEL!', 'success', 6000);
      }
    }

    if (level >= 7 && petData.type === 'cat') {
      petData.type = 'dog';
      save();
      redraw();
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🐕 PET EVOLUIU!', 'BYTE evoluiu para cachorro!', 'success', 5000);
      }
    }

    if (level >= 10 && petData.type === 'dog') {
      petData.type = 'dragon';
      save();
      redraw();
      if (typeof Notifications !== 'undefined') {
        Notifications.showToast('🐉 PET EVOLUIU!', 'BYTE evoluiu para DRAGÃO!', 'success', 5000);
      }
    }
  }

  function onTaskCompleted() {
    if (!petData.unlocked || !petContainer) return;
    petContainer.classList.add('happy');
    setTimeout(() => petContainer.classList.remove('happy'), 2000);
  }

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) petData = Object.assign(petData, JSON.parse(saved));
    } catch (e) {}
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(petData)); }

  function init() {
    load();
    checkUnlock();
    redraw();
    setInterval(checkUnlock, 30000);

    // Interação com clique no pet
    var petCanvas = document.getElementById('petCanvas');
    if (petCanvas) {
      var petClickCount = 0;
      var petClickTimer = null;

      petCanvas.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!petData.unlocked) return;

        petClickCount++;
        if (petClickTimer) clearTimeout(petClickTimer);
        petClickTimer = setTimeout(function() { petClickCount = 0; }, 2000);

        // Animação de pulo
        var container = petCanvas.parentElement;
        if (container) {
          container.style.transform = 'translateY(-8px)';
          setTimeout(function() { container.style.transform = ''; }, 200);
        }

        // Sons
        if (typeof Sounds !== 'undefined') Sounds.click();

        // Frases do pet
        var petName = petData.type === 'cat' ? '🐱 BYTE' : petData.type === 'dog' ? '🐕 BYTE' : '🐉 BYTE';
        var phrases = [];

        if (petData.type === 'cat') {
          phrases = [
            'Miau! 😺', 'Purr... 😸', 'Miau miau! 🐱', '*ronrona* 😻',
            '*esfrega na perna* 🐈', 'Prr prr... quer carinho? 😺',
            '*olha com curiosidade* 👀', 'Miau? Tarefa? 📋',
            '*boceja* 😴', '*brinca com o cursor* 🖱️'
          ];
        } else if (petData.type === 'dog') {
          phrases = [
            'Au au! 🐕', 'Woof! 🐶', '*abana o rabo* 🐕', '*late feliz* 🎉',
            '*traz a bolinha* ⚽', 'Au! Bora trabalhar! 💪',
            '*pula de alegria* 🐾', '*deita e rola* 😊',
            '*lambe a tela* 👅', 'Woof woof! Cadê a tarefa? 📋'
          ];
        } else {
          phrases = [
            '*sopra fogo* 🔥', 'ROAR! 🐉', '*bate as asas* 🪽',
            '*olha imponente* 👑', '*voa ao redor da tela* ✨',
            'Dragão protege suas tarefas! 🛡️', '*solta faíscas* ⚡',
            '*ronrona como trovão* ⛈️', 'LEGENDARY! 🏆',
            '*aquece seu café com fogo* ☕🔥'
          ];
        }

        var phrase = phrases[Math.floor(Math.random() * phrases.length)];

        // Mostrar frase no bubble do mascote
        var bubble = document.getElementById('mascotBubble');
        if (bubble) {
          bubble.textContent = petName + ': ' + phrase;
          bubble.classList.add('visible');
          setTimeout(function() { bubble.classList.remove('visible'); }, 3000);
        }

        // 5 cliques = pet faz truque
        if (petClickCount >= 5) {
          petClickCount = 0;
          doTrick();
        }
      });
    }
  }

  // === TRUQUES DO PET ===
  function doTrick() {
    var tricks = [];

    if (petData.type === 'cat') {
      tricks = ['*dá uma cambalhota* 🤸', '*caça um rato imaginário* 🐭', '*pula no teclado* ⌨️ adsfjkl;'];
    } else if (petData.type === 'dog') {
      tricks = ['*dá a pata* 🐾', '*faz morto* 😵', '*pega o graveto* 🪵 Bom garoto!'];
    } else {
      tricks = ['*voa em círculos* 🌀', '*cospe fogos de artifício* 🎆', '*faz um loop no ar* 🔄 INSANO!'];
    }

    var trick = tricks[Math.floor(Math.random() * tricks.length)];

    if (typeof Notifications !== 'undefined') {
      var name = petData.type === 'cat' ? '🐱' : petData.type === 'dog' ? '🐕' : '🐉';
      Notifications.showToast(name + ' TRUQUE!', trick, 'success', 4000);
    }

    // Emote
    var container = document.getElementById('mascotContainer');
    if (container) {
      var emote = document.createElement('div');
      emote.className = 'mascot-emote';
      emote.textContent = petData.type === 'cat' ? '😺' : petData.type === 'dog' ? '🐕' : '🐉';
      container.appendChild(emote);
      setTimeout(function() { emote.remove(); }, 1500);
    }

    // XP bônus
    if (typeof Gamification !== 'undefined') {
      Gamification.addBonusXP(5, 'Truque do pet!');
    }
  }

  return { init, redraw, onTaskCompleted, checkUnlock };
})();