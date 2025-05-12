import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SportType } from '../types';
import createExtendedTheme from '../theme/extendedTheme';
import { useSportConfigContext } from './SportConfigContext';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  currentSport?: string;
}

// Create the context with undefined as initial value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get initial theme from localStorage or system preference
const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light'; // Default for SSR
  
  try {
    // Check localStorage first
    const storedTheme = localStorage.getItem('themeMode');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (error) {
    console.error('Error reading theme from localStorage', error);
  }
  
  // Default to light
  return 'light';
};

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages theme state and integrates with MUI ThemeProvider
 * Uses the sport configuration from SportConfigContext to apply sport-specific theming
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the current theme mode from localStorage or system preference
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  
  // Get the current sport configuration
  const { currentSportType } = useSportConfigContext();
  
  // Toggle between light and dark mode
  const toggleThemeMode = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Save theme mode to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('themeMode', themeMode);
    } catch (error) {
      console.error('Error saving theme to localStorage', error);
    }
  }, [themeMode]);
  
  // Create the theme object based on current mode and sport
  const theme = useMemo(() => {
    return createExtendedTheme(themeMode, currentSportType || SportType.FOOTBALL);
  }, [themeMode, currentSportType]);
  
  // Create the context value
  const contextValue = useMemo(() => ({
    themeMode,
    setThemeMode,
    toggleThemeMode,
    currentSport: currentSportType
  }), [themeMode, currentSportType]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* Apply baseline styles */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context
 * @returns ThemeContextType containing themeMode and setter functions
 * @throws Error if used outside of ThemeProvider
 */
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
