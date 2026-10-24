import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Sparkles, Volume2, VolumeX, Target, Sliders, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PomodoroTimer = ({ isOpen, onClose, activeTask }) => {
  const defaultMin = activeTask?.estimated_minutes ? Number(activeTask.estimated_minutes) : 25;
  const [mode, setMode] = useState(defaultMin);
  const [secondsLeft, setSecondsLeft] = useState(defaultMin * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play a harmonic, soothing completion chime using Web Audio API
  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Melodic celebration chime chord: D5 -> F#5 -> A5 -> D6
      const chord = [
        { freq: 587.33, delay: 0.0, duration: 1.2, gainVal: 0.28 },
        { freq: 739.99, delay: 0.16, duration: 1.3, gainVal: 0.26 },
        { freq: 880.00, delay: 0.32, duration: 1.4, gainVal: 0.26 },
        { freq: 1174.66, delay: 0.48, duration: 2.2, gainVal: 0.32 }
      ];

      chord.forEach(({ freq, delay, duration, gainVal }) => {
        // Fundamental tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        // Harmonic overtone for natural bell acoustic warmth
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(freq * 2, ctx.currentTime + delay);

        // Musical envelope: fast soft attack, smooth exponential decay
        const startTime = ctx.currentTime + delay;
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(gainVal, startTime + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        overtoneGain.gain.setValueAtTime(0.0001, startTime);
        overtoneGain.gain.exponentialRampToValueAtTime(gainVal * 0.3, startTime + 0.03);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + (duration * 0.7));

        osc.connect(gain);
        gain.connect(ctx.destination);

        overtone.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);

        overtone.start(startTime);
        overtone.stop(startTime + duration);
      });
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  };

  // When activeTask or isOpen changes, sync timer to the target study duration
  useEffect(() => {
    if (isOpen) {
      const minutes = activeTask?.estimated_minutes ? Number(activeTask.estimated_minutes) : 25;
      setMode(minutes);
      setSecondsLeft(minutes * 60);
      setIsActive(false);
      setIsCustomOpen(false);
    }
  }, [activeTask, isOpen]);

  // When user clicks a mode button
  const handleModeChange = (newMode) => {
    const val = Math.max(1, Math.min(360, Number(newMode) || 25));
    setMode(val);
    setSecondsLeft(val * 60);
    setIsActive(false);
  };

  const handleApplyCustom = (e) => {
    if (e) e.preventDefault();
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val > 0 && val <= 360) {
      handleModeChange(val);
      setIsCustomOpen(false);
      setCustomInput('');
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      if (soundEnabled) {
        playChimeSound();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, soundEnabled]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = mode * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const taskMinutes = activeTask?.estimated_minutes ? Number(activeTask.estimated_minutes) : null;

  // Build mode pills
  const modeOptions = [];
  if (taskMinutes && taskMinutes !== 25 && taskMinutes !== 50) {
    modeOptions.push({ label: `${taskMinutes}m Target`, val: taskMinutes, isTarget: true });
  }
  modeOptions.push(
    { label: taskMinutes === 25 ? '25m Target' : '25m Sprint', val: 25 },
    { label: taskMinutes === 50 ? '50m Target' : '50m Deep', val: 50 },
    { label: '5m Break', val: 5 }
  );

  // If current mode is not in presets, show as custom
  const isPreset = modeOptions.some(m => m.val === mode);
  if (!isPreset) {
    modeOptions.push({ label: `${mode}m Custom`, val: mode, isCustom: true });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', textAlign: 'center', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
          aria-label="Close Focus Timer"
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Focus Study Sprint
        </h3>

        {activeTask ? (
          <div style={{
            margin: '0 auto 16px',
            padding: '8px 14px',
            backgroundColor: 'var(--primary-light)',
            borderRadius: '10px',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '100%',
            boxShadow: '0 0 14px var(--primary-glow)'
          }}>
            <Target size={16} color="var(--primary)" />
            <div style={{ textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                {activeTask.chapter_title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {activeTask.topic_title} • {activeTask.estimated_minutes} mins scheduled
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Choose your focus duration or set a custom timer
          </p>
        )}

        {/* Mode selector */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {modeOptions.map((m) => (
            <button
              key={m.val}
              onClick={() => {
                handleModeChange(m.val);
                setIsCustomOpen(false);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: mode === m.val ? 'var(--primary)' : 'var(--border)',
                backgroundColor: mode === m.val ? 'var(--primary-light)' : 'var(--bg-card)',
                color: mode === m.val ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: mode === m.val ? 700 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: mode === m.val ? '0 0 10px var(--primary-glow)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {m.label}
            </button>
          ))}
          
          <button
            onClick={() => setIsCustomOpen(!isCustomOpen)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: isCustomOpen ? 'var(--primary)' : 'var(--border)',
              backgroundColor: isCustomOpen ? 'var(--primary-light)' : 'var(--bg-card)',
              color: isCustomOpen ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: isCustomOpen ? '0 0 10px var(--primary-glow)' : 'none',
              transition: 'all 0.15s ease'
            }}
            title="Set Custom Timer"
          >
            <Sliders size={13} />
            <span>Custom</span>
          </button>
        </div>

        {/* Custom Timer Input Drawer */}
        {isCustomOpen && (
          <form 
            onSubmit={handleApplyCustom}
            style={{
              marginBottom: '20px',
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 16px -2px var(--primary-glow)'
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max="360"
                placeholder="Minutes (1–360)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                autoFocus
                className="input-field"
                style={{ padding: '8px 12px', minHeight: '38px', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0 16px', minHeight: '38px', fontSize: '0.82rem', flexShrink: 0 }}
              >
                Set Time
              </button>
            </div>
            {/* Quick quick preset pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    handleModeChange(mins);
                    setIsCustomOpen(false);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </form>
        )}

        {/* Big Timer Display with Ambient Radial Backlight */}
        <div style={{
          position: 'relative',
          width: '210px',
          height: '210px',
          margin: '0 auto 24px',
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `conic-gradient(var(--primary) ${progressPercent * 3.6}deg, var(--border) 0deg)`,
          padding: '12px',
          boxShadow: isActive ? '0 0 35px var(--primary-glow), 0 0 60px rgba(79, 70, 229, 0.15)' : '0 8px 24px -4px var(--primary-glow)'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.08)'
          }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {timeFormatted}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isActive ? 'Session Active' : secondsLeft === 0 ? 'Goal Reached!' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsActive(!isActive)}
            className="btn btn-primary"
            style={{ width: '135px', padding: '10px 16px', fontSize: '0.92rem' }}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
            <span>{isActive ? 'Pause' : 'Start Focus'}</span>
          </button>
          <button
            onClick={() => {
              setIsActive(false);
              setSecondsLeft(mode * 60);
            }}
            className="btn btn-secondary"
            style={{ padding: '10px 16px' }}
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Completion Chime Sound Settings */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              borderRadius: '20px',
              border: '1px solid var(--border)',
              backgroundColor: soundEnabled ? 'var(--primary-light)' : 'var(--bg-card-subtle)',
              color: soundEnabled ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Toggle Sound Alert on Completion"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>Chime {soundEnabled ? 'Enabled' : 'Muted'}</span>
          </button>

          {soundEnabled && (
            <button
              type="button"
              onClick={playChimeSound}
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              title="Preview completion sound"
            >
              Test Chime
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
