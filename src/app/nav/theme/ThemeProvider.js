'use client';

import { createContext, useMemo, useState, useEffect, useContext } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';

export const ColorModeContext = createContext({ 
  toggleColorMode: () => {},
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
    toggleColorMode: context.toggleColorMode
  };
};

// For backward compatibility
export const useColorMode = useTheme;

export default function CustomThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem('colorMode');
    if (savedMode) {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
    setMounted(true);
  }, []);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('colorMode', newMode);
          // Dispatch custom event when theme changes
          document.documentElement.setAttribute('data-theme', newMode);
          document.dispatchEvent(new CustomEvent('themeChange', { detail: { mode: newMode } }));
          return newMode;
        });
      },
      mode,
      darkMode: mode === 'dark',
    }),
    [mode]
  );

  // Set initial theme on mount and handle system theme changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Update the data-theme attribute for MUI
    root.setAttribute('data-theme', mode);
    
    // Update the class on the html element for Tailwind
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  if (!mounted) {
    return null; // or a loading spinner
  }

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </MUIThemeProvider>
    </ColorModeContext.Provider>
  );
}