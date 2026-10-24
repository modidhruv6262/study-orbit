import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Volume2, 
  Bell, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Moon, 
  Sun, 
  Download,
  Trash2,
  VolumeX,
  Sliders
} from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import SectionHeader from '../components/SectionHeader';

export const AppSettingsPage = () => {
  const { settings, updateSetting, resetSettings, COLOR_PALETTES } = useAppSettings();
  const { theme, toggleTheme } = useTheme();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [soundTesting, setSoundTesting] = useState(false);

  // Play synthetic web audio tone for sound testing
  const playTestTone = (type = 'bell') => {
    try {
      setSoundTesting(true);
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const gainNode = audioCtx.createGain();
      const osc = audioCtx.createOscillator();

      const vol = (settings.soundVolume || 80) / 100 * 0.3;
      gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);

      if (type === 'digital') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      } else if (type === 'bowl') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      } else {
        // Bell (default)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      }

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
      setTimeout(() => setSoundTesting(false), 800);
    } catch {
      setSoundTesting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all app appearance, sound, and notification preferences to defaults?')) {
      resetSettings();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const handleExportSettings = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `study_orbit_settings_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionHeader
        title="Application Settings"
        subtitle="Personalize your theme, accent colors, focus audio alerts, and performance preferences."
        icon={Settings}
        iconColor="var(--primary)"
        iconBg="var(--primary-light)"
        tag="App Configuration"
      />

      {resetSuccess && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid var(--success)',
          borderRadius: '12px',
          color: 'var(--success)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          <span>App preferences have been successfully reset to defaults.</span>
        </div>
      )}

      {/* 1. Theme & Accent Appearance */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Palette size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Appearance & Accent Colors
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Choose your interface theme and brand accent palette
            </p>
          </div>
        </div>

        {/* Theme mode buttons */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Interface Theme
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => { if (theme !== 'light') toggleTheme(); }}
              className="glass-card"
              style={{
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                borderColor: theme === 'light' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: theme === 'light' ? 'var(--primary-light)' : 'var(--bg-card)',
                color: theme === 'light' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: theme === 'light' ? 700 : 500,
                borderRadius: '12px',
                transition: 'all 0.18s ease'
              }}
            >
              <Sun size={18} color={theme === 'light' ? 'var(--primary)' : 'var(--text-muted)'} />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => { if (theme !== 'dark') toggleTheme(); }}
              className="glass-card"
              style={{
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                borderColor: theme === 'dark' ? 'var(--primary)' : 'var(--border)',
                backgroundColor: theme === 'dark' ? 'var(--primary-light)' : 'var(--bg-card)',
                color: theme === 'dark' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: theme === 'dark' ? 700 : 500,
                borderRadius: '12px',
                transition: 'all 0.18s ease'
              }}
            >
              <Moon size={18} color={theme === 'dark' ? '#fbbf24' : 'var(--text-muted)'} />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Accent Color Palette Selector */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Brand Accent Color
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {[
              { id: 'indigo', name: 'Cosmic Indigo', color: '#4f46e5' },
              { id: 'cyan', name: 'Cyber Cyan', color: '#0891b2' },
              { id: 'violet', name: 'Deep Violet', color: '#7c3aed' },
              { id: 'emerald', name: 'Aurora Emerald', color: '#059669' },
              { id: 'rose', name: 'Solar Rose', color: '#e11d48' },
            ].map((p) => {
              const isSelected = settings.themeColor === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => updateSetting('themeColor', p.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? p.color : 'var(--border)'}`,
                    backgroundColor: isSelected ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    boxShadow: isSelected ? `0 0 10px ${p.color}` : 'none',
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ambient Glow & Effects Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
              Ambient Glow & Lighting
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Subtle colored halos behind cards and active controls
            </span>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.ambientGlow}
              onChange={(e) => updateSetting('ambientGlow', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: settings.ambientGlow ? 'var(--primary)' : 'var(--border)',
              borderRadius: '24px',
              transition: '0.2s ease'
            }}>
              <span style={{
                position: 'absolute',
                height: '18px',
                width: '18px',
                left: settings.ambientGlow ? '24px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </span>
          </label>
        </div>
      </div>

      {/* 2. Audio & Focus Sprint Sounds */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d97706'
          }}>
            <Volume2 size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Audio & Focus Chimes
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Configure acoustic bells when your Pomodoro study sprints complete
            </p>
          </div>
        </div>

        {/* Enable Audio Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
              Timer Completion Sound
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Play gentle audio chime when a study session concludes
            </span>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: settings.soundEnabled ? 'var(--primary)' : 'var(--border)',
              borderRadius: '24px',
              transition: '0.2s ease'
            }}>
              <span style={{
                position: 'absolute',
                height: '18px',
                width: '18px',
                left: settings.soundEnabled ? '24px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </span>
          </label>
        </div>

        {/* Chime Sound Style & Test */}
        {settings.soundEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Chime Style
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                {[
                  { id: 'bell', name: 'Acoustic Bell' },
                  { id: 'digital', name: 'Digital Soft Chime' },
                  { id: 'bowl', name: 'Tibetan Sing Bowl' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      updateSetting('timerSound', s.id);
                      playTestTone(s.id);
                    }}
                    className="btn btn-secondary"
                    style={{
                      padding: '10px 12px',
                      fontSize: '0.8rem',
                      fontWeight: settings.timerSound === s.id ? 700 : 500,
                      borderColor: settings.timerSound === s.id ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: settings.timerSound === s.id ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: settings.timerSound === s.id ? 'var(--primary)' : 'var(--text-primary)',
                      borderRadius: '10px'
                    }}
                  >
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume slider & Test button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sound Volume</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{settings.soundVolume}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.soundVolume}
                  onChange={(e) => updateSetting('soundVolume', Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <button
                type="button"
                onClick={() => playTestTone(settings.timerSound)}
                className="btn btn-secondary"
                disabled={soundTesting}
                style={{ padding: '8px 14px', fontSize: '0.78rem', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <Volume2 size={14} />
                <span>{soundTesting ? 'Playing...' : 'Test Sound'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Celebrations & Micro-Interactions */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Feedback & Micro-Animations
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Motivating visual cues when conquering study blocks
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
              Confetti Bursts on Completion
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Fire joyful confetti celebrations when you finish an exam or study milestone
            </span>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.confettiEnabled}
              onChange={(e) => updateSetting('confettiEnabled', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: settings.confettiEnabled ? 'var(--primary)' : 'var(--border)',
              borderRadius: '24px',
              transition: '0.2s ease'
            }}>
              <span style={{
                position: 'absolute',
                height: '18px',
                width: '18px',
                left: settings.confettiEnabled ? '24px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </span>
          </label>
        </div>
      </div>

      {/* 4. Network & Connection Status */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary)'
          }}>
            <Zap size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Performance & Network Keep-Alive
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Optimize responsiveness and cloud server connectivity
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
              Smart Tab Heartbeat (Zero Cold Starts)
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Silently primes the backend every 4 minutes while the app is open so you never experience AFK lag
            </span>
          </div>
          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
            ✓ Active
          </span>
        </div>

        <div style={{
          padding: '12px 14px',
          backgroundColor: 'var(--bg-card-subtle)',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Database Provider:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Neon Cloud PostgreSQL (Always Connected)</span>
        </div>
      </div>

      {/* 5. Device Storage & Configuration Backup */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-card-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)'
          }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Backup & Reset Preferences
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Export or reset your personalized interface settings
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportSettings}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontSize: '0.82rem', gap: '6px' }}
          >
            <Download size={14} />
            <span>Export App Config (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            style={{ padding: '9px 16px', fontSize: '0.82rem', gap: '6px', color: 'var(--danger)' }}
          >
            <RotateCcw size={14} />
            <span>Reset UI Defaults</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          StudyOrbit Web Client • Version 1.2.0 Production
        </div>
      </div>
    </div>
  );
};
