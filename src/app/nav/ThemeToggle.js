'use client';

import { useColorMode } from './theme/ThemeProvider';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.4,13.7C20.6,13.9,19.8,14,19,14c-5,0-9-4-9-9c0-0.7,0.1-1.4,0.3-2.1c0.1-0.3,0-0.5-0.1-0.7C9.8,1.8,9.6,1.7,9.4,1.7c-5.1,0.5-9,4.8-9,9.9c0,5.5,4.5,10,10,10c5.1,0,9.3-3.9,9.9-9c0-0.2,0-0.4-0.2-0.6C21.8,13.7,21.6,13.6,21.4,13.7z" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export default function ThemeToggle() {
  const { mode, toggleColorMode } = useColorMode();
  const [mounted, setMounted] = useState(false);
  const isDark = mode === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleColorMode}
      aria-label="Toggle Theme"
      className={`relative w-20 h-10 rounded-full transition-colors duration-300 
        ${isDark ? 'bg-gray-700' : 'bg-yellow-400'}
        flex items-center px-1`}
    >
      {/* الزر المتحرك */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 700,
          damping: 30,
        }}
        className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center z-10"
        animate={{
          x: isDark ? 'calc(100% - 2.5rem)' : '0rem',
        }}
      >
        {isDark ? (
          <MoonIcon className="text-gray-800" />
        ) : (
          <SunIcon className="text-yellow-500" />
        )}
      </motion.div>
    </button>
  );
}
