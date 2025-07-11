'use client';

import { createContext, useMemo, useState, useEffect, useContext } from 'react';
import { ThemeProvider as MUIThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useColorMode must be used within a ThemeProvider');
  }
  return context;
};

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
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

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
