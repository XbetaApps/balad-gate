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

  // Apply theme changes
  const applyTheme = (themeMode) => {
    const html = document.documentElement;
    
    if (themeMode === 'dark') {
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#121212';
      document.body.style.color = '#ffffff';
    } else {
      html.classList.remove('dark');
      html.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }
    
    // Update the data-theme attribute for MUI
    html.setAttribute('data-theme', themeMode);
    
    // Dispatch theme change event
    document.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { mode: themeMode } 
    }));
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Get saved theme or use system preference
    const savedMode = localStorage.getItem('colorMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = savedMode || (prefersDark ? 'dark' : 'light');
    
    // Apply initial theme
    setMode(initialMode);
    applyTheme(initialMode);
    setMounted(true);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newMode = mediaQuery.matches ? 'dark' : 'light';
      if (!localStorage.getItem('colorMode')) {
        setMode(newMode);
        applyTheme(newMode);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleColorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          // Save preference
          localStorage.setItem('colorMode', newMode);
          // Apply theme changes
          applyTheme(newMode);
          return newMode;
        });
      },
      mode: mode,
      darkMode: mode === 'dark',
    }),
    [mode]
  );



  const theme = useMemo(() => getTheme(mode), [mode]);

  if (!mounted) {
    return null; // or a loading spinner
  }

  return (
    <ColorModeContext.Provider value={toggleColorMode}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </MUIThemeProvider>
    </ColorModeContext.Provider>
  );
}