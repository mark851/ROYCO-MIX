import React, { createContext, useContext, useEffect, useState } from 'react';
import { useProducts, ThemeColorOption, DefaultThemeMode } from './ProductsContext';

export type ThemeMode = 'light' | 'dark';

export interface ColorSchemeConfig {
  id: ThemeColorOption;
  name: string;
  tagline: string;
  primaryHex: string;
  secondaryHex: string;
  gradientHeader: string;
  buttonPrimary: string;
  buttonHover: string;
  textAccent: string;
  bgLightAccent: string;
  borderAccent: string;
  ringAccent: string;
  badgeBg: string;
  badgeText: string;
  chipActive: string;
  vipTagBg: string;
  shadowColor: string;
}

export const COLOR_PRESETS: Record<ThemeColorOption, ColorSchemeConfig> = {
  blue: {
    id: 'blue',
    name: 'Royco Classic Blue',
    tagline: 'Official Royal Uganda Enterprise Blue',
    primaryHex: '#1764c4',
    secondaryHex: '#1d70d6',
    gradientHeader: 'from-[#1764c4] via-[#1d70d6] to-[#1452a0]',
    buttonPrimary: 'bg-[#1764c4] text-white hover:bg-[#1353a3]',
    buttonHover: 'hover:bg-[#1353a3]',
    textAccent: 'text-[#1764c4] dark:text-blue-400',
    bgLightAccent: 'bg-blue-50 dark:bg-blue-950/40',
    borderAccent: 'border-blue-500/40',
    ringAccent: 'focus:ring-[#1764c4]',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-800 dark:text-blue-200',
    chipActive: 'bg-[#1764c4] text-white',
    vipTagBg: 'bg-amber-400 text-amber-950',
    shadowColor: 'shadow-blue-500/20',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Fortune',
    tagline: 'Prosperous Agro Yield Green',
    primaryHex: '#059669',
    secondaryHex: '#0d9488',
    gradientHeader: 'from-emerald-700 via-teal-600 to-emerald-800',
    buttonPrimary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    buttonHover: 'hover:bg-emerald-700',
    textAccent: 'text-emerald-600 dark:text-emerald-400',
    bgLightAccent: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderAccent: 'border-emerald-500/40',
    ringAccent: 'focus:ring-emerald-500',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    chipActive: 'bg-emerald-600 text-white',
    vipTagBg: 'bg-amber-400 text-amber-950',
    shadowColor: 'shadow-emerald-500/20',
  },
  purple: {
    id: 'purple',
    name: 'Royal VIP Purple',
    tagline: 'Imperial Prestige & High Yield',
    primaryHex: '#7c3aed',
    secondaryHex: '#9333ea',
    gradientHeader: 'from-purple-700 via-indigo-600 to-purple-900',
    buttonPrimary: 'bg-purple-600 text-white hover:bg-purple-700',
    buttonHover: 'hover:bg-purple-700',
    textAccent: 'text-purple-600 dark:text-purple-400',
    bgLightAccent: 'bg-purple-50 dark:bg-purple-950/40',
    borderAccent: 'border-purple-500/40',
    ringAccent: 'focus:ring-purple-500',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/40',
    badgeText: 'text-purple-800 dark:text-purple-200',
    chipActive: 'bg-purple-600 text-white',
    vipTagBg: 'bg-amber-400 text-amber-950',
    shadowColor: 'shadow-purple-500/20',
  },
  amber: {
    id: 'amber',
    name: 'Harvest Gold',
    tagline: 'Golden Grain & Solar Harvest',
    primaryHex: '#d97706',
    secondaryHex: '#eab308',
    gradientHeader: 'from-amber-600 via-yellow-600 to-amber-700',
    buttonPrimary: 'bg-amber-500 text-amber-950 hover:bg-amber-400 font-black',
    buttonHover: 'hover:bg-amber-400',
    textAccent: 'text-amber-600 dark:text-amber-400',
    bgLightAccent: 'bg-amber-50 dark:bg-amber-950/40',
    borderAccent: 'border-amber-500/40',
    ringAccent: 'focus:ring-amber-500',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/40',
    badgeText: 'text-amber-900 dark:text-amber-200',
    chipActive: 'bg-amber-500 text-amber-950',
    vipTagBg: 'bg-slate-900 text-amber-300',
    shadowColor: 'shadow-amber-500/20',
  },
  rose: {
    id: 'rose',
    name: 'Crimson Ruby',
    tagline: 'Dynamic Passion & Fast Growth',
    primaryHex: '#e11d48',
    secondaryHex: '#db2777',
    gradientHeader: 'from-rose-600 via-pink-600 to-rose-700',
    buttonPrimary: 'bg-rose-600 text-white hover:bg-rose-700',
    buttonHover: 'hover:bg-rose-700',
    textAccent: 'text-rose-600 dark:text-rose-400',
    bgLightAccent: 'bg-rose-50 dark:bg-rose-950/40',
    borderAccent: 'border-rose-500/40',
    ringAccent: 'focus:ring-rose-500',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/40',
    badgeText: 'text-rose-800 dark:text-rose-200',
    chipActive: 'bg-rose-600 text-white',
    vipTagBg: 'bg-amber-400 text-amber-950',
    shadowColor: 'shadow-rose-500/20',
  },
  cyan: {
    id: 'cyan',
    name: 'Ocean Cyan',
    tagline: 'Modern Tech & Pure Hydro Energy',
    primaryHex: '#0891b2',
    secondaryHex: '#0284c7',
    gradientHeader: 'from-cyan-700 via-teal-600 to-blue-700',
    buttonPrimary: 'bg-cyan-600 text-white hover:bg-cyan-700',
    buttonHover: 'hover:bg-cyan-700',
    textAccent: 'text-cyan-600 dark:text-cyan-400',
    bgLightAccent: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderAccent: 'border-cyan-500/40',
    ringAccent: 'focus:ring-cyan-500',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-900/40',
    badgeText: 'text-cyan-800 dark:text-cyan-200',
    chipActive: 'bg-cyan-600 text-white',
    vipTagBg: 'bg-amber-400 text-amber-950',
    shadowColor: 'shadow-cyan-500/20',
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colorPreset: ThemeColorOption;
  colorConfig: ColorSchemeConfig;
  setColorPreset: (color: ThemeColorOption) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_THEME_MODE_KEY = 'royco_user_theme_mode_v2';
const LOCAL_THEME_COLOR_KEY = 'royco_user_theme_color_v2';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useProducts();

  // Initialize theme mode: check localStorage or fallback to admin's defaultThemeMode
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_THEME_MODE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    if (settings?.defaultThemeMode === 'dark') return 'dark';
    return 'light';
  });

  // Color preset is set by the admin in Firestore settings, with local override fallback
  const adminChosenColor = (settings?.themeColor as ThemeColorOption) || 'blue';
  const [colorPreset, setColorPresetState] = useState<ThemeColorOption>(adminChosenColor);

  // Sync with Admin settings whenever Firestore changes
  useEffect(() => {
    if (settings?.themeColor && COLOR_PRESETS[settings.themeColor]) {
      setColorPresetState(settings.themeColor);
    }
  }, [settings?.themeColor]);

  // Apply dark mode class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(LOCAL_THEME_MODE_KEY, themeMode);
    } catch {}
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setColorPreset = (color: ThemeColorOption) => {
    setColorPresetState(color);
    try {
      localStorage.setItem(LOCAL_THEME_COLOR_KEY, color);
    } catch {}
  };

  const isDark = themeMode === 'dark';
  const colorConfig = COLOR_PRESETS[colorPreset] || COLOR_PRESETS.blue;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        toggleTheme,
        setThemeMode,
        colorPreset,
        colorConfig,
        setColorPreset,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
