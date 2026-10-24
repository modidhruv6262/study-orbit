import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'study_orbit_app_settings';

const DEFAULT_SETTINGS = {
  themeColor: 'indigo', // 'indigo', 'cyan', 'violet', 'emerald', 'rose'
  ambientGlow: true,
  soundEnabled: true,
  soundVolume: 80,
  timerSound: 'bell', // 'bell', 'digital', 'bowl'
  confettiEnabled: true,
  reducedMotion: false,
  keepAliveActive: true,
  desktopNotifications: false,
};

const COLOR_PALETTES = {
  indigo: { primary: '#4f46e5', primaryHover: '#4338ca', primaryLight: '#eef2ff', glow: 'rgba(79, 70, 229, 0.25)' },
  cyan: { primary: '#0891b2', primaryHover: '#0e7490', primaryLight: '#ecfeff', glow: 'rgba(8, 145, 178, 0.25)' },
  violet: { primary: '#7c3aed', primaryHover: '#6d28d9', primaryLight: '#f5f3ff', glow: 'rgba(124, 58, 237, 0.25)' },
  emerald: { primary: '#059669', primaryHover: '#047857', primaryLight: '#ecfdf5', glow: 'rgba(5, 150, 105, 0.25)' },
  rose: { primary: '#e11d48', primaryHover: '#be123c', primaryLight: '#fff1f2', glow: 'rgba(225, 29, 72, 0.25)' },
};

const AppSettingsContext = createContext(null);

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...jsonParse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  function jsonParse(str) {
    try {
      return JSON.parse(str);
    } catch {
      return {};
    }
  }

  // Apply CSS color overrides and effects dynamically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save app settings to localStorage', e);
    }

    const root = document.documentElement;
    const palette = COLOR_PALETTES[settings.themeColor] || COLOR_PALETTES.indigo;

    // Apply primary color accent if not in default dark mode override
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--primary-hover', palette.primaryHover);
    root.style.setProperty('--primary-light', palette.primaryLight);
    root.style.setProperty('--primary-glow', palette.glow);

    if (settings.ambientGlow) {
      root.classList.remove('no-ambient-glow');
    } else {
      root.classList.add('no-ambient-glow');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSetting, resetSettings, COLOR_PALETTES }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    return {
      settings: DEFAULT_SETTINGS,
      updateSetting: () => {},
      resetSettings: () => {},
      COLOR_PALETTES
    };
  }
  return ctx;
};
