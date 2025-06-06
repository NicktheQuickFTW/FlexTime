'use client';

import { useEffect } from 'react';

export function ThemeInitializer() {
  useEffect(() => {
    // Only run on client side
    try {
      const savedTheme = localStorage.getItem('flextime-theme-mode');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemDark);
      
      // Only update if different from default
      if (!shouldBeDark) {
        document.documentElement.className = 'light';
      }
    } catch (e) {
      // Keep default dark theme
    }
  }, []);

  return null;
}