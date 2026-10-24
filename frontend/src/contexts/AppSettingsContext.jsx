import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'study_orbit_app_settings';

const DEFAULT_SETTINGS = {
  themeColor: 'indigo', // 'indigo', 'cyan', 'violet', 'emerald', 'rose'
  ambientGlow: true,
  soundEnabled: true,
  soundVolume: 85,
  timerSound: 'celestial_harp', // 'celestial_harp', 'zen_bowl', 'acoustic_bell', 'marimba_echo'
  confettiEnabled: true,
  reducedMotion: false,
};

export const COLOR_PALETTES = {
  indigo: {
    id: 'indigo',
    name: 'Cosmic Indigo',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: 'rgba(79, 70, 229, 0.12)',
    primaryDark: '#3730a3',
    glow: 'rgba(79, 70, 229, 0.15)'
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    primaryLight: 'rgba(6, 182, 212, 0.12)',
    primaryDark: '#0e7490',
    glow: 'rgba(6, 182, 212, 0.16)'
  },
  violet: {
    id: 'violet',
    name: 'Deep Violet',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryLight: 'rgba(139, 92, 246, 0.12)',
    primaryDark: '#6d28d9',
    glow: 'rgba(139, 92, 246, 0.16)'
  },
  emerald: {
    id: 'emerald',
    name: 'Aurora Emerald',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: 'rgba(16, 185, 129, 0.12)',
    primaryDark: '#047857',
    glow: 'rgba(16, 185, 129, 0.16)'
  },
  rose: {
    id: 'rose',
    name: 'Solar Rose',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    primaryLight: 'rgba(244, 63, 94, 0.12)',
    primaryDark: '#be123c',
    glow: 'rgba(244, 63, 94, 0.16)'
  },
};

const AppSettingsContext = createContext(null);

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Apply CSS color overrides and effects dynamically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save app settings to localStorage', e);
    }

    const root = document.documentElement;
    const palette = COLOR_PALETTES[settings.themeColor] || COLOR_PALETTES.indigo;

    // Apply primary brand colors across document
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--primary-hover', palette.primaryHover);
    root.style.setProperty('--primary-light', palette.primaryLight);
    root.style.setProperty('--primary-dark', palette.primaryDark);
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
