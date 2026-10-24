import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Maximize2, Bell, BellOff, Check } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { startContinuousAlarm, stopContinuousAlarm } from '../utils/audioAlerts';
import { triggerCelebration } from '../utils/confettiHelper';

export const DashboardStopwatch = ({ onOpenTimer, activeTask }) => {
  const { settings } = useAppSettings();
  const [mode, setMode] = useState('25'); // '25', '45', '60', '120', 'custom', 'stopwatch'
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);

  // Custom hours & minutes inputs
  const [isCustomActive, setIsCustomActive] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);

  // Persistent alarm state
  const [isRinging, setIsRinging] = useState(false);

  const timerRef = useRef(null);

  // Clean up alarm on unmount
  useEffect(() => {
    return () => {
      stopContinuousAlarm();
    };
  }, []);

  // Handle Preset selection
  const handleSelectMode = (newMode, minutes) => {
    stopAlarm();
    setIsRunning(false);
    setIsCustomActive(false);
    setMode(newMode);

    if (newMode === 'stopwatch') {
      setStopwatchElapsed(0);
    } else {
      const secs = minutes * 60;
      setTotalSeconds(secs);
      setSecondsLeft(secs);
    }
  };

  const handleApplyCustom = (e) => {
    if (e) e.preventDefault();
    const h = Math.max(0, parseInt(customHours, 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(customMinutes, 10) || 0));
    const totalMins = (h * 60) + m;

    if (totalMins > 0) {
      stopAlarm();
      setIsRunning(false);
      setMode('custom');
      const secs = totalMins * 60;
      setTotalSeconds(secs);
      setSecondsLeft(secs);
      setIsCustomActive(false);
    }
  };

  // Timer tick
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
              handleTimerComplete();
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
  }, [isRunning, mode]);

  // When timer hits 0
  const handleTimerComplete = () => {
    setIsRinging(true);
    triggerCelebration();

    if (settings.soundEnabled) {
      startContinuousAlarm(settings.timerSound, settings.soundVolume, () => {
        setIsRinging(false);
      });
    }
  };

  const stopAlarm = () => {
    stopContinuousAlarm();
    setIsRinging(false);
  };

  const handleReset = () => {
    stopAlarm();
    setIsRunning(false);
    if (mode === 'stopwatch') {
      setStopwatchElapsed(0);
    } else {
      setSecondsLeft(totalSeconds);
    }
  };

  // Formatting with hours support: HH:MM:SS or MM:SS
  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const remainingSecs = secs % 3600;
    const minutes = Math.floor(remainingSecs / 60);
    const s = remainingSecs % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
              Timer
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {activeTask ? (activeTask.topic_title || activeTask.title) : 'Focus Session'}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenTimer}
          className="btn btn-ghost"
          style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-muted)' }}
          title="Open Fullscreen Timer"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Continuous Ringing Banner if Alarm is Active */}
      {isRinging && (
        <div style={{
          margin: '8px 0',
          padding: '10px 14px',
          backgroundColor: '#ef4444',
          color: '#ffffff',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulse 1s infinite',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
            <Bell size={18} />
            <span>Time's Up! Ringing...</span>
          </div>
          <button
            onClick={stopAlarm}
            className="btn"
            style={{
              padding: '4px 12px',
              fontSize: '0.78rem',
              backgroundColor: '#ffffff',
              color: '#ef4444',
              borderRadius: '8px',
              fontWeight: 800
            }}
          >
            Stop Alarm
          </button>
        </div>
      )}

      {/* Center Dial: JUST THE TIME */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '14px 0',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: '185px',
          height: '185px',
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
              fontSize: displayTime.length > 5 ? '1.85rem' : '2.4rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1
            }}>
              {displayTime}
            </span>
          </div>
        </div>
      </div>

      {/* Custom Timer Input Form (Hours & Minutes) */}
      {isCustomActive && (
        <form onSubmit={handleApplyCustom} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-card-subtle)',
          padding: '8px 12px',
          borderRadius: '10px',
          marginBottom: '10px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number"
              min="0"
              max="12"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              className="input-field"
              style={{ width: '48px', padding: '4px 6px', textAlign: 'center', fontSize: '0.85rem' }}
              placeholder="0"
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>h</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number"
              min="0"
              max="59"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="input-field"
              style={{ width: '48px', padding: '4px 6px', textAlign: 'center', fontSize: '0.85rem' }}
              placeholder="30"
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>m</span>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '5px 12px', fontSize: '0.76rem' }}>
            Set
          </button>
        </form>
      )}

      {/* Preset Mode Switchers (with Hour options & Custom) */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '6px',
        position: 'relative',
        zIndex: 1,
        marginBottom: '12px'
      }}>
        {[
          { id: '25', label: '25m', mins: 25 },
          { id: '45', label: '45m', mins: 45 },
          { id: '60', label: '1 Hour', mins: 60 },
          { id: '120', label: '2 Hours', mins: 120 },
        ].map((m) => {
          const isSelected = mode === m.id && !isCustomActive;
          return (
            <button
              key={m.id}
              onClick={() => handleSelectMode(m.id, m.mins)}
              style={{
                border: 'none',
                background: isSelected ? 'var(--primary)' : 'var(--bg-card-subtle)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.74rem',
                fontWeight: isSelected ? 700 : 500,
                padding: '4px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {m.label}
            </button>
          );
        })}

        {/* Custom Timer Button */}
        <button
          onClick={() => setIsCustomActive(!isCustomActive)}
          style={{
            border: 'none',
            background: isCustomActive || mode === 'custom' ? 'var(--primary)' : 'var(--bg-card-subtle)',
            color: isCustomActive || mode === 'custom' ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.74rem',
            fontWeight: isCustomActive || mode === 'custom' ? 700 : 500,
            padding: '4px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Custom
        </button>

        {/* Stopwatch / Count Up Button */}
        <button
          onClick={() => handleSelectMode('stopwatch', 0)}
          style={{
            border: 'none',
            background: mode === 'stopwatch' && !isCustomActive ? 'var(--primary)' : 'var(--bg-card-subtle)',
            color: mode === 'stopwatch' && !isCustomActive ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '0.74rem',
            fontWeight: mode === 'stopwatch' && !isCustomActive ? 700 : 500,
            padding: '4px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Count Up
        </button>
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
          onClick={() => {
            if (isRinging) stopAlarm();
            setIsRunning(!isRunning);
          }}
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
          <span>{isRunning ? 'Pause' : 'Start'}</span>
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
