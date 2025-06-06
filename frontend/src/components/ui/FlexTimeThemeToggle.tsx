'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Toggle } from '../../../components/ui/toggle';

export function FlexTimeThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem('flextime-theme-mode');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    setIsDark(shouldBeDark);
    
    // Apply theme to html element
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    // Save to localStorage
    localStorage.setItem('flextime-theme-mode', newIsDark ? 'dark' : 'light');
    
    // Apply to html element
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Toggle
        pressed={true}
        aria-label="Theme toggle"
        className="relative w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300"
      >
        <div className="relative w-6 h-6">
          <Moon 
            className="absolute inset-0 text-[color:var(--ft-neon)]"
            size={24}
          />
        </div>
      </Toggle>
    );
  }

  return (
    <Toggle
      pressed={isDark}
      onPressedChange={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative w-12 h-12 rounded-lg bg-white/10 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 transition-all duration-300 group data-[state=on]:bg-gray-900/80 data-[state=off]:bg-slate-100/80"
    >
      <div className="relative w-6 h-6">
        <Sun 
          className={`absolute inset-0 transform transition-all duration-300 ${
            !isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          } text-black`}
          size={24}
        />
        <Moon 
          className={`absolute inset-0 transform transition-all duration-300 ${
            isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          } text-[color:var(--ft-neon)]`}
          size={24}
        />
      </div>
      
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        !isDark 
          ? 'bg-black/10 shadow-black/20' 
          : 'bg-[color:var(--ft-neon)]/20 shadow-[color:var(--ft-neon)]/20'
      } shadow-lg`} />
    </Toggle>
  );
}