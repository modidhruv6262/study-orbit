import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Volume2, 
  Sparkles, 
  Moon, 
  Sun, 
  Check, 
  Music
} from 'lucide-react';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { CHIME_STYLES, playSingleChime } from '../utils/audioAlerts';
import SectionHeader from '../components/SectionHeader';

export const AppSettingsPage = () => {
  const { settings, updateSetting, COLOR_PALETTES } = useAppSettings();
  const { theme, toggleTheme } = useTheme();
  const [soundTesting, setSoundTesting] = useState(false);

  const handleTestTone = (style) => {
    setSoundTesting(true);
    playSingleChime(style, settings.soundVolume || 85);
    setTimeout(() => setSoundTesting(false), 900);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionHeader
        title="Application Settings"
        subtitle="Personalize your interface theme, brand accent color, and focus sound chimes."
        icon={Settings}
        iconColor="var(--primary)"
        iconBg="var(--primary-light)"
        tag="App Configuration"
      />

      {/* 1. Theme & Accent Appearance */}
      <div className="glass-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
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
            Brand Accent Color (Transforms buttons, highlights, badges & glow)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {Object.values(COLOR_PALETTES).map((p) => {
              const isSelected = settings.themeColor === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => updateSetting('themeColor', p.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: `2px solid ${isSelected ? p.primary : 'var(--border)'}`,
                    backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 14px ${p.glow}` : 'none',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: p.primary,
                    boxShadow: isSelected ? `0 0 10px ${p.primary}` : 'none',
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 800 : 600, color: 'var(--text-primary)' }}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ambient Glow & Effects Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
              Ambient Glow & Lighting
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Soft colored light reflections and glowing halos behind interactive cards
            </span>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
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
              borderRadius: '26px',
              transition: '0.2s ease',
              boxShadow: settings.ambientGlow ? '0 0 12px var(--primary-glow)' : 'none'
            }}>
              <span style={{
                position: 'absolute',
                height: '20px',
                width: '20px',
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

      {/* 2. Audio & Focus Chimes */}
      <div className="glass-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
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
              Audio & Acoustic Alert Chimes
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Configure relaxing musical chimes and persistent alarms when study sprints conclude
            </p>
          </div>
        </div>

        {/* Enable Audio Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
              Timer Completion Sound Alert
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              Rings periodically when timer hits 0:00 until stopped (or auto-stops after 1 minute)
            </span>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
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
              borderRadius: '26px',
              transition: '0.2s ease',
              boxShadow: settings.soundEnabled ? '0 0 12px var(--primary-glow)' : 'none'
            }}>
              <span style={{
                position: 'absolute',
                height: '20px',
                width: '20px',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Acoustic Chime Style (Click to preview)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                {CHIME_STYLES.map((s) => {
                  const isSelected = settings.timerSound === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        updateSetting('timerSound', s.id);
                        handleTestTone(s.id);
                      }}
                      className="glass-card"
                      style={{
                        padding: '12px 14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                        boxShadow: isSelected ? '0 0 14px var(--primary-glow)' : 'none',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: isSelected ? 800 : 700, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {s.name}
                        </span>
                        {isSelected && <Check size={14} color="var(--primary)" />}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {s.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume slider & Test button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Alert Volume</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{settings.soundVolume}%</span>
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
                onClick={() => handleTestTone(settings.timerSound)}
                className="btn btn-secondary"
                disabled={soundTesting}
                style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px', whiteSpace: 'nowrap', borderRadius: '10px' }}
              >
                <Music size={14} />
                <span>{soundTesting ? 'Playing...' : 'Test Sound'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Celebrations & Micro-Interactions */}
      <div className="glass-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              Feedback & Celebrations
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
              Dual-cannon confetti celebrations on desktop and mobile when tasks or exams are finished
            </span>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
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
              borderRadius: '26px',
              transition: '0.2s ease',
              boxShadow: settings.confettiEnabled ? '0 0 12px var(--primary-glow)' : 'none'
            }}>
              <span style={{
                position: 'absolute',
                height: '20px',
                width: '20px',
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
    </div>
  );
};
