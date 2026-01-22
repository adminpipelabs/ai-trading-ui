import React, { createContext, useContext, useState } from 'react';

const themes = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgCard: '#ffffff',
    bgCardHover: '#f1f5f9',
    bgInput: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    accent: '#0d9488',
    accentLight: 'rgba(13, 148, 136, 0.1)',
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    shadow: '0 1px 3px rgba(0,0,0,0.08)',
    shadowLg: '0 4px 20px rgba(0,0,0,0.08)',
    shadowXl: '0 25px 50px rgba(0,0,0,0.15)',
    logoBg: '#0f172a',
  },
  dark: {
    bgPrimary: '#0a0f1a',
    bgSecondary: '#111827',
    bgCard: 'rgba(255,255,255,0.03)',
    bgCardHover: 'rgba(255,255,255,0.06)',
    bgInput: 'rgba(255,255,255,0.05)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255,255,255,0.1)',
    accent: '#5eead4',
    accentLight: 'rgba(94, 234, 212, 0.15)',
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    shadow: 'none',
    shadowLg: '0 4px 20px rgba(0,0,0,0.3)',
    shadowXl: '0 25px 50px rgba(0,0,0,0.5)',
    logoBg: '#1e293b',
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? themes.dark : themes.light;
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeContext, themes };
