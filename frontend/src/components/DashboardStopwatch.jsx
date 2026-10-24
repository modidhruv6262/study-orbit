import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Sparkles, Volume2, Maximize2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppSettings } from '../contexts/AppSettingsContext';

export const DashboardStopwatch = ({ onOpenTimer, activeTask }) => {
  const { settings } = useAppSettings();
  const [mode, setMode] = useState('25'); // '25', '50', '15', 'stopwatch'
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);

  const timerRef = useRef(null);

  // Play synthetic tone when timer finishes
  const playChime = () => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime((settings.soundVolume || 80) / 100 * 0.35, audioCtx.currentTime);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch {}
  };

  // Change preset
  const handleSelectMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'stopwatch') {
      setStopwatchElapsed(0);
    } else {
      const mins = Number(newMode);
      setTotalSeconds(mins * 60);
      setSecondsLeft(mins * 60);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchElapsed((prev) => prev + 1);
        } else {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsRunning(false);
              playChime();
              if (settings.confettiEnabled) {
                confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, mode, settings]);

  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'stopwatch') {
      setStopwatchElapsed(0);
    } else {
      setSecondsLeft(totalSeconds);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Progress percentage for circular ring
  const progressPercent = mode === 'stopwatch' 
    ? Math.min(100, (stopwatchElapsed % 3600) / 36)
    : Math.max(0, Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100));

  const displayTime = mode === 'stopwatch' ? formatTime(stopwatchElapsed) : formatTime(secondsLeft);

  return (
    <div className="glass-card" style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      minHeight: '340px'
    }}>
      {/* Background ambient decorative glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: 'var(--primary-glow)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Clock size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Focus Stopwatch
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {activeTask ? `Studying: ${activeTask.topic_title || activeTask.title}` : 'Paced study session'}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenTimer}
          className="btn btn-ghost"
          style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-muted)' }}
          title="Open Fullscreen Pomodoro Timer"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Center Stopwatch Dial */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '16px 0',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Animated Circular Ring */}
        <div style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: `conic-gradient(var(--primary) ${progressPercent * 3.6}deg, var(--border) 0deg)`,
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isRunning ? '0 0 28px var(--primary-glow)' : 'var(--shadow-sm)',
          transition: 'box-shadow 0.3s ease'
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
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06)'
          }}>
            <span style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1
            }}>
              {displayTime}
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: isRunning ? 'var(--primary)' : 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {isRunning && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />}
              {isRunning ? 'Active Sprint' : (secondsLeft === 0 ? 'Completed!' : 'Ready')}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Mode Switchers */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '6px',
        position: 'relative',
        zIndex: 1,
        marginBottom: '12px'
      }}>
        {[
          { id: '25', label: '25m Pomodoro' },
          { id: '50', label: '50m Deep Work' },
          { id: '15', label: '15m Review' },
          { id: 'stopwatch', label: 'Count Up' }
        ].map((m) => {
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelectMode(m.id)}
              style={{
                border: 'none',
                background: isSelected ? 'var(--primary)' : 'var(--bg-card-subtle)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: isSelected ? 700 : 500,
                padding: '4px 9px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Action Controls: Start/Pause & Reset */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        position: 'relative',
        zIndex: 1
      }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="btn btn-primary"
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '0.88rem',
            gap: '8px',
            borderRadius: '12px',
            boxShadow: isRunning ? '0 4px 14px var(--primary-glow)' : 'none'
          }}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
          <span>{isRunning ? 'Pause Sprint' : 'Start Focus Sprint'}</span>
        </button>

        <button
          onClick={handleReset}
          className="btn btn-secondary"
          style={{
            padding: '10px 14px',
            fontSize: '0.88rem',
            borderRadius: '12px',
            color: 'var(--text-muted)'
          }}
          title="Reset timer"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
};
