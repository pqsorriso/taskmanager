/**
 * sounds.js — Sons 8-bit da interface
 */
const Sounds = (() => {
  let enabled = true;
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    return ctx;
  }

  function play(notes, type, volume) {
    if (!enabled) return;
    if (typeof Config !== 'undefined' && !Config.get('sounds')) return;
    const c = getCtx();
    if (!c) return;

    notes.forEach((n, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'square';
      osc.frequency.value = n.freq;
      gain.gain.value = volume || 0.05;
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime + (n.delay || i * 0.08));
      osc.stop(c.currentTime + (n.delay || i * 0.08) + (n.dur || 0.06));
    });
  }

  // === SONS PRÉ-DEFINIDOS ===
  function click() {
    play([{ freq: 800, dur: 0.03 }], 'square', 0.03);
  }

  function complete() {
    play([
      { freq: 523, delay: 0, dur: 0.08 },
      { freq: 659, delay: 0.08, dur: 0.08 },
      { freq: 784, delay: 0.16, dur: 0.08 },
      { freq: 1047, delay: 0.24, dur: 0.15 }
    ], 'square', 0.05);
  }

  function deleteSound() {
    play([
      { freq: 400, delay: 0, dur: 0.08 },
      { freq: 300, delay: 0.08, dur: 0.08 },
      { freq: 200, delay: 0.16, dur: 0.12 }
    ], 'sawtooth', 0.04);
  }

  function error() {
    play([
      { freq: 200, delay: 0, dur: 0.1 },
      { freq: 150, delay: 0.12, dur: 0.15 }
    ], 'square', 0.06);
  }

  function levelUp() {
    play([
      { freq: 523, delay: 0, dur: 0.1 },
      { freq: 659, delay: 0.1, dur: 0.1 },
      { freq: 784, delay: 0.2, dur: 0.1 },
      { freq: 1047, delay: 0.3, dur: 0.1 },
      { freq: 1319, delay: 0.4, dur: 0.15 },
      { freq: 1568, delay: 0.55, dur: 0.2 }
    ], 'square', 0.05);
  }

  function badge() {
    play([
      { freq: 880, delay: 0, dur: 0.08 },
      { freq: 1109, delay: 0.1, dur: 0.08 },
      { freq: 1319, delay: 0.2, dur: 0.08 },
      { freq: 1760, delay: 0.3, dur: 0.2 },
      { freq: 1760, delay: 0.55, dur: 0.1 },
      { freq: 2093, delay: 0.7, dur: 0.25 }
    ], 'square', 0.04);
  }

  function addTask() {
    play([
      { freq: 600, delay: 0, dur: 0.05 },
      { freq: 900, delay: 0.06, dur: 0.08 }
    ], 'square', 0.04);
  }

  function undo() {
    play([
      { freq: 500, delay: 0, dur: 0.06 },
      { freq: 400, delay: 0.07, dur: 0.06 },
      { freq: 600, delay: 0.14, dur: 0.08 }
    ], 'triangle', 0.05);
  }

  function notification() {
    play([
      { freq: 700, delay: 0, dur: 0.1 },
      { freq: 900, delay: 0.12, dur: 0.1 },
      { freq: 700, delay: 0.24, dur: 0.1 }
    ], 'sine', 0.04);
  }

  function startup() {
    play([
      { freq: 262, delay: 0, dur: 0.12 },
      { freq: 330, delay: 0.15, dur: 0.12 },
      { freq: 392, delay: 0.3, dur: 0.12 },
      { freq: 523, delay: 0.45, dur: 0.2 },
      { freq: 659, delay: 0.7, dur: 0.12 },
      { freq: 784, delay: 0.85, dur: 0.25 }
    ], 'square', 0.04);
  }

  function setEnabled(val) { enabled = val; }

  return {
    click, complete, deleteSound, error, levelUp, badge,
    addTask, undo, notification, startup, setEnabled, play
  };
})();