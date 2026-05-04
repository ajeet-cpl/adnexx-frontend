import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'aerosis_theme';
export const THEMES = [
  // { id: 'light',        label: 'Aviation Blue',   color: '#F8FAFC', accent: '#1E3A8A' },
  // { id: 'dark',         label: 'Dark Premium',    color: '#0F172A', accent: '#38BDF8' },
  // { id: 'deep-navy',    label: 'Deep Navy',       color: '#0B1220', accent: '#2563EB' },
  // { id: 'green-ops',    label: 'Green Ops',       color: '#ECFDF5', accent: '#065F46' },
  // { id: 'alert-orange', label: 'Alert Orange',    color: '#F3F4F6', accent: '#F97316' },
  // { id: 'minimal',      label: 'Minimal White',   color: '#FFFFFF', accent: '#2563EB' },
  { id: 'corepeelers',  label: 'CorePeelers',     color: '#1B1B2A', accent: '#EAB308' },
];

const VALID_IDS = new Set(THEMES.map((t) => t.id));

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_IDS.has(stored)) return stored;
  return 'corepeelers';
}

export default function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((id) => {
    if (VALID_IDS.has(id)) setThemeState(id);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const idx = THEMES.findIndex((t) => t.id === prev);
      return THEMES[(idx + 1) % THEMES.length].id;
    });
  }, []);

  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' || theme === 'deep-navy' || theme === 'corepeelers' };
}
