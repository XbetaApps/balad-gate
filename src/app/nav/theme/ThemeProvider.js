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
    // تأخير تنفيذ الكود حتى يتم تحميل الصفحة بالكامل
    const initTheme = () => {
      const savedMode = localStorage.getItem('colorMode');
      const html = document.documentElement;
      
      if (savedMode) {
        setMode(savedMode);
        if (savedMode === 'dark') {
          html.classList.add('dark');
          html.style.backgroundColor = '#000';
          document.body.style.backgroundColor = '#000';
          document.body.style.color = '#fff';
        } else {
          html.classList.remove('dark');
          html.style.backgroundColor = '#fff';
          document.body.style.backgroundColor = '#fff';
          document.body.style.color = '#000';
        }
        html.setAttribute('data-theme', savedMode);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialMode = prefersDark ? 'dark' : 'light';
        setMode(initialMode);
        if (initialMode === 'dark') {
          html.classList.add('dark');
          html.style.backgroundColor = '#000';
          document.body.style.backgroundColor = '#000';
          document.body.style.color = '#fff';
        } else {
          html.classList.remove('dark');
          html.style.backgroundColor = '#fff';
          document.body.style.backgroundColor = '#fff';
          document.body.style.color = '#000';
        }
        html.setAttribute('data-theme', initialMode);
      }
      
      setMounted(true);
    };
    
    // تأخير التنفيذ حتى يكتمل تحميل الصفحة
    if (document.readyState === 'complete') {
      initTheme();
    } else {
      window.addEventListener('load', initTheme);
      return () => window.removeEventListener('load', initTheme);
    }
  }, []);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('colorMode', newMode);
          
          // تحديث الألوان وعناصر الصفحة
          const html = document.documentElement;
          if (newMode === 'dark') {
            html.classList.add('dark');
            html.style.backgroundColor = '#000';
            document.body.style.backgroundColor = '#000';
            document.body.style.color = '#fff';
          } else {
            html.classList.remove('dark');
            html.style.backgroundColor = '#fff';
            document.body.style.backgroundColor = '#fff';
            document.body.style.color = '#000';
          }
          
          html.setAttribute('data-theme', newMode);
          
          // إرسال حدث عند تغيير السمة
          document.dispatchEvent(new CustomEvent('themeChange', { 
            detail: { mode: newMode } 
          }));
          
          return newMode;
        });
      },
      mode: mode,
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