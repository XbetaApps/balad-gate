'use client';

import { createContext, useState, useEffect } from 'react';
import { AuthProvider } from './auth/AuthProvider';
import dynamic from 'next/dynamic';

// Load OnboardingWrapper dynamically to avoid SSR issues
const OnboardingWrapper = dynamic(
  () => import('./components/OnboardingWrapper'),
  { ssr: false }
);

export const ThemeContext = createContext();

export default function LayoutClient({ children }) {
  const [darkMode, setDarkMode] = useState(typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false);

  // Listen to themeChange events to update any consumers if needed
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setDarkMode(JSON.parse(savedTheme));
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Sync with changes triggered elsewhere (e.g., ThemeProvider)
  useEffect(() => {
    const handler = (e) => {
      const newMode = e.detail.mode;
      setDarkMode(newMode === 'dark');
    };
    document.addEventListener('themeChange', handler);
    return () => document.removeEventListener('themeChange', handler);
  }, []);

  // Persist preference when toggled from LayoutClient (if ever used)
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark');
    setDarkMode(document.documentElement.classList.contains('dark'));
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <AuthProvider>
        {/* Onboarding Modal */}
        <OnboardingWrapper key="onboarding-wrapper" />
        {/* Main Content */}
        {children}
      </AuthProvider>
    </ThemeContext.Provider>
  );
}