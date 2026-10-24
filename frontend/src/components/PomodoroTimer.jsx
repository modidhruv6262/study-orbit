import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, Target, Sliders, Bell } from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { startContinuousAlarm, stopContinuousAlarm, playSingleChime } from '../utils/audioAlerts';
import { triggerCelebration } from '../utils/confettiHelper';

export const PomodoroTimer = ({ isOpen, onClose, activeTask }) => {
  const { settings } = useAppSettings();
  const defaultMin = activeTask?.estimated_minutes ? Number(activeTask.estimated_minutes) : 25;
  const [totalSeconds, setTotalSeconds] = useState(defaultMin * 60);
  const [secondsLeft, setSecondsLeft] = useState(defaultMin * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [isRinging, setIsRinging] = useState(false);

  // When activeTask or isOpen changes, sync timer
  useEffect(() => {
    if (isOpen) {
      stopAlarm();
      const minutes = activeTask?.estimated_minutes ? Number(activeTask.estimated_minutes) : 25;
      const secs = minutes * 60;
      setTotalSeconds(secs);
      setSecondsLeft(secs);
      setIsActive(false);
      setIsCustomOpen(false);
    } else {
      stopAlarm();
    }
  }, [activeTask, isOpen]);

  useEffect(() => {
    return () => {
      stopContinuousAlarm();
    };
  }, []);

  // When user clicks a mode button
  const handleModeChange = (mins) => {
    stopAlarm();
    const totalSecs = Math.max(60, mins * 60);
    setTotalSeconds(totalSecs);
    setSecondsLeft(totalSecs);
    setIsActive(false);
  };

  const handleApplyCustom = (e) => {
    if (e) e.preventDefault();
    const h = Math.max(0, parseInt(customHours, 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(customMinutes, 10) || 0));
    const totalMins = (h * 60) + m;

    if (totalMins > 0) {
      handleModeChange(totalMins);
      setIsCustomOpen(false);
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      setIsActive(false);
      setIsRinging(true);
      triggerCelebration();

      if (settings.soundEnabled) {
        startContinuousAlarm(settings.timerSound, settings.soundVolume, () => {
          setIsRinging(false);
        });
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, settings]);

  const stopAlarm = () => {
    stopContinuousAlarm();
    setIsRinging(false);
  };

  if (!isOpen) return null;

  // Format with hours support
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

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const timeFormatted = formatTime(secondsLeft);

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', textAlign: 'center', position: 'relative' }}>
        <button
          onClick={() => {
            stopAlarm();
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
          aria-label="Close Timer"
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Timer
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
                {activeTask.topic_title}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Choose a duration or set custom hours & minutes
          </p>
        )}

        {/* Ringing Alert Banner */}
        {isRinging && (
          <div style={{
            margin: '0 0 16px 0',
            padding: '10px 14px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'pulse 1s infinite',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
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

        {/* Mode selector with Hour options */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: '25m', mins: 25 },
            { label: '45m', mins: 45 },
            { label: '1 Hour', mins: 60 },
            { label: '2 Hours', mins: 120 },
          ].map((m) => {
            const isSelected = totalSeconds === m.mins * 60 && !isCustomOpen;
            return (
              <button
                key={m.mins}
                onClick={() => {
                  handleModeChange(m.mins);
                  setIsCustomOpen(false);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 700 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 0 10px var(--primary-glow)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {m.label}
              </button>
            );
          })}
          
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

        {/* Custom Timer Input Form (Hours & Minutes) */}
        {isCustomOpen && (
          <form 
            onSubmit={handleApplyCustom}
            style={{
              marginBottom: '20px',
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 16px -2px var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                min="0"
                max="12"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                className="input-field"
                style={{ width: '54px', padding: '6px 8px', textAlign: 'center', fontSize: '0.9rem' }}
                placeholder="0"
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Hours</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                min="0"
                max="59"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="input-field"
                style={{ width: '54px', padding: '6px 8px', textAlign: 'center', fontSize: '0.9rem' }}
                placeholder="25"
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mins</span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '6px 16px', fontSize: '0.82rem' }}
            >
              Set
            </button>
          </form>
        )}

        {/* Big Timer Display */}
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
            <span style={{
              fontSize: timeFormatted.length > 5 ? '2.2rem' : '2.8rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: 'var(--text-primary)'
            }}>
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              if (isRinging) stopAlarm();
              setIsActive(!isActive);
            }}
            className="btn btn-primary"
            style={{ width: '135px', padding: '10px 16px', fontSize: '0.92rem' }}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
            <span>{isActive ? 'Pause' : 'Start'}</span>
          </button>
          <button
            onClick={() => {
              stopAlarm();
              setIsActive(false);
              setSecondsLeft(totalSeconds);
            }}
            className="btn btn-secondary"
            style={{ padding: '10px 16px' }}
            title="Reset Timer"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
