// Centralized Web Audio API sound generator for timer chimes & persistent alarms

let activeAlarmInterval = null;
let activeAlarmTimeout = null;

export const CHIME_STYLES = [
  { id: 'celestial_harp', name: 'Celestial Harp Arpeggio', desc: 'Ascending 4-note soothing chime' },
  { id: 'zen_bowl', name: 'Zen Singing Bowl', desc: 'Deep 432Hz resonant meditation bowl' },
  { id: 'acoustic_bell', name: 'Acoustic Tubular Bell', desc: 'Rich harmonious bell with overtones' },
  { id: 'marimba_echo', name: 'Warm Wooden Marimba', desc: 'Gentle organic double marimba tone' },
];

export const playSingleChime = (style = 'celestial_harp', volume = 80) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const masterGain = ctx.createGain();
    const volLevel = Math.max(0.05, Math.min(1, (volume / 100))) * 0.4;
    masterGain.gain.setValueAtTime(volLevel, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (style === 'zen_bowl') {
      // 432Hz Tibetan singing bowl with warm octave & fifth overtones
      const frequencies = [432, 864, 1296];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const duration = 2.2 - (i * 0.4);
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.3 / (i + 1), ctx.currentTime + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      });
    } else if (style === 'marimba_echo') {
      // Warm marimba double note
      const notes = [
        { freq: 440, delay: 0 },
        { freq: 659.25, delay: 0.12 }
      ];
      notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        const t = ctx.currentTime + delay;
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.4, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.65);
      });
    } else if (style === 'acoustic_bell') {
      // Harmonious tubular bell chime
      const freqs = [587.33, 880, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.35 / (idx + 1), ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 1.8);
      });
    } else {
      // Default: Celestial Harp Arpeggio (C5, E5, G5, C6)
      const chord = [
        { freq: 523.25, delay: 0.0 },
        { freq: 659.25, delay: 0.12 },
        { freq: 783.99, delay: 0.24 },
        { freq: 1046.50, delay: 0.36 },
      ];
      chord.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        const t = ctx.currentTime + delay;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.32, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + 1.6);
      });
    }
  } catch (err) {
    console.warn('Audio playback error', err);
  }
};

// Continuous alarm that rings until stopped, auto-stopping after 1 min (60 seconds)
export const startContinuousAlarm = (style = 'celestial_harp', volume = 80, onStopCallback) => {
  stopContinuousAlarm();

  // Play immediately
  playSingleChime(style, volume);

  // Repeat every 2.6 seconds
  activeAlarmInterval = setInterval(() => {
    playSingleChime(style, volume);
  }, 2600);

  // Auto-stop after 60 seconds (1 minute)
  activeAlarmTimeout = setTimeout(() => {
    stopContinuousAlarm();
    if (onStopCallback) onStopCallback();
  }, 60000);
};

export const stopContinuousAlarm = () => {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  if (activeAlarmTimeout) {
    clearTimeout(activeAlarmTimeout);
    activeAlarmTimeout = null;
  }
};
