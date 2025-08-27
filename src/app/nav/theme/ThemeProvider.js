'use client';

import { createContext, useMemo, useState, useEffect, useContext } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';

export const ColorModeContext = createContext({ 
  toggleColorMode: () => {},
  setMode: () => {},
  mode: 'light'
});

export const useTheme = () => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return {
    mode: context.mode,
    darkMode: context.mode === 'dark',
    toggleColorMode: context.toggleColorMode,
    setMode: context.setMode,
  };
};

// For backward compatibility
export const useColorMode = useTheme;

export default function CustomThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode) {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', mode === 'dark');
      document.body.style.backgroundColor = mode === 'dark' ? '#121212' : '#ffffff';
      document.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { mode },
        bubbles: true,
        composed: true
      }));
    }
  }, [mode]);

  const colorMode = {
    setMode,
    toggleColorMode: () => {
      setMode((prevMode) => {
        const newMode = prevMode === 'light' ? 'dark' : 'light';
        localStorage.setItem('colorMode', newMode);
        return newMode;
      });
    },
    mode,
    darkMode: mode === 'dark',
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      {mounted && children}
    </ColorModeContext.Provider>
  );
}