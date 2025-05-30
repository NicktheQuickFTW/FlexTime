import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SportType } from '../types';
import createExtendedTheme from '../theme/extendedTheme';
import { useSportConfigContext } from './SportConfigContext';

type ThemeMode = 'light' | 'dark';

// Enhanced theme customization interface
interface ThemeCustomizations {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontFamily?: string;
  glassIntensity?: number;
  motionPreference?: 'reduced' | 'normal' | 'enhanced';
  contrastMode?: 'normal' | 'high';
}

// Main theme interface
interface Theme {
  mode: ThemeMode;
  sport?: string;
  team?: string;
  customizations?: ThemeCustomizations;
}

// Big 12 teams mapping for team-specific theming
const BIG12_TEAMS = {
  'Arizona': { primary: '#CC0033', secondary: '#003366' },
  'Arizona State': { primary: '#8C1D40', secondary: '#FFC627' },
  'Baylor': { primary: '#003015', secondary: '#FFB81C' },
  'BYU': { primary: '#002E5D', secondary: '#FFFFFF' },
  'Cincinnati': { primary: '#E00122', secondary: '#000000' },
  'Colorado': { primary: '#CFB87C', secondary: '#000000' },
  'Houston': { primary: '#C8102E', secondary: '#FFFFFF' },
  'Iowa State': { primary: '#CC0033', secondary: '#FFC72C' },
  'Kansas': { primary: '#0051BA', secondary: '#E8000D' },
  'Kansas State': { primary: '#512888', secondary: '#FFFFFF' },
  'Oklahoma State': { primary: '#FF6600', secondary: '#000000' },
  'TCU': { primary: '#4D1979', secondary: '#A3A9AC' },
  'Texas Tech': { primary: '#CC0000', secondary: '#000000' },
  'UCF': { primary: '#FFC904', secondary: '#000000' },
  'Utah': { primary: '#CC0000', secondary: '#FFFFFF' },
  'West Virginia': { primary: '#002855', secondary: '#EAAA00' }
} as const;

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setSportTheme: (sport: string) => void;
  setTeamTheme: (team: string) => void;
  setCustomizations: (customizations: Partial<ThemeCustomizations>) => void;
  resetTheme: () => void;
  currentSport?: string;
  currentTeam?: string;
}

// Create the context with undefined as initial value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage keys for theme persistence
const THEME_STORAGE_KEYS = {
  MODE: 'flextime-theme-mode',
  SPORT: 'flextime-theme-sport',
  TEAM: 'flextime-theme-team',
  CUSTOMIZATIONS: 'flextime-theme-customizations'
} as const;

// Get initial theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return { mode: 'light' }; // Default for SSR
  }
  
  try {
    // Get stored theme mode
    const storedMode = localStorage.getItem(THEME_STORAGE_KEYS.MODE);
    const mode: ThemeMode = (storedMode === 'dark' || storedMode === 'light') 
      ? storedMode 
      : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) 
        ? 'dark' 
        : 'light';

    // Get stored sport and team
    const sport = localStorage.getItem(THEME_STORAGE_KEYS.SPORT) || undefined;
    const team = localStorage.getItem(THEME_STORAGE_KEYS.TEAM) || undefined;
    
    // Get stored customizations
    const customizationsStr = localStorage.getItem(THEME_STORAGE_KEYS.CUSTOMIZATIONS);
    const customizations: ThemeCustomizations | undefined = customizationsStr 
      ? JSON.parse(customizationsStr) 
      : undefined;

    return { mode, sport, team, customizations };
  } catch (error) {
    console.error('Error reading theme from localStorage', error);
    return { mode: 'light' };
  }
};

// Save theme to localStorage
const saveThemeToStorage = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEYS.MODE, theme.mode);
    
    if (theme.sport) {
      localStorage.setItem(THEME_STORAGE_KEYS.SPORT, theme.sport);
    } else {
      localStorage.removeItem(THEME_STORAGE_KEYS.SPORT);
    }
    
    if (theme.team) {
      localStorage.setItem(THEME_STORAGE_KEYS.TEAM, theme.team);
    } else {
      localStorage.removeItem(THEME_STORAGE_KEYS.TEAM);
    }
    
    if (theme.customizations) {
      localStorage.setItem(THEME_STORAGE_KEYS.CUSTOMIZATIONS, JSON.stringify(theme.customizations));
    } else {
      localStorage.removeItem(THEME_STORAGE_KEYS.CUSTOMIZATIONS);
    }
  } catch (error) {
    console.error('Error saving theme to localStorage', error);
  }
};

// Apply theme to document attributes for CSS variable access
const applyThemeToDocument = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Set mode attribute
  root.setAttribute('data-theme-mode', theme.mode);
  
  // Set sport attribute
  if (theme.sport) {
    root.setAttribute('data-theme-sport', theme.sport.toLowerCase().replace(/[\s']/g, '-'));
  } else {
    root.removeAttribute('data-theme-sport');
  }
  
  // Set team attribute
  if (theme.team) {
    root.setAttribute('data-theme-team', theme.team.toLowerCase().replace(/\s/g, '-'));
  } else {
    root.removeAttribute('data-theme-team');
  }
  
  // Apply customizations as CSS custom properties
  if (theme.customizations) {
    const customizations = theme.customizations;
    
    if (customizations.primaryColor) {
      root.style.setProperty('--flextime-primary', customizations.primaryColor);
    }
    if (customizations.secondaryColor) {
      root.style.setProperty('--flextime-secondary', customizations.secondaryColor);
    }
    if (customizations.accentColor) {
      root.style.setProperty('--flextime-accent', customizations.accentColor);
    }
    if (customizations.backgroundColor) {
      root.style.setProperty('--flextime-bg', customizations.backgroundColor);
    }
    if (customizations.textColor) {
      root.style.setProperty('--flextime-text', customizations.textColor);
    }
    if (customizations.borderRadius !== undefined) {
      root.style.setProperty('--flextime-border-radius', `${customizations.borderRadius}px`);
    }
    if (customizations.fontFamily) {
      root.style.setProperty('--flextime-font-family', customizations.fontFamily);
    }
    if (customizations.glassIntensity !== undefined) {
      root.style.setProperty('--flextime-glass-intensity', customizations.glassIntensity.toString());
    }
    
    // Motion preference
    if (customizations.motionPreference) {
      root.setAttribute('data-motion-preference', customizations.motionPreference);
    }
    
    // Contrast mode
    if (customizations.contrastMode) {
      root.setAttribute('data-contrast-mode', customizations.contrastMode);
    }
  }
};

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Enhanced ThemeProvider component that manages comprehensive theme state
 * including mode, sport, team, and custom theme configurations.
 * Integrates with MUI ThemeProvider and applies sport/team-specific theming.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme state from localStorage
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  
  // Get the current sport configuration from context
  const { currentSportType } = useSportConfigContext();
  
  // Theme manipulation functions
  const setThemeMode = (mode: ThemeMode) => {
    setTheme(prev => ({ ...prev, mode }));
  };

  const toggleTheme = () => {
    setTheme(prev => ({ 
      ...prev, 
      mode: prev.mode === 'light' ? 'dark' : 'light' 
    }));
  };

  const setSportTheme = (sport: string) => {
    setTheme(prev => ({ 
      ...prev, 
      sport,
      // Clear team when sport changes to avoid conflicts
      team: undefined 
    }));
  };

  const setTeamTheme = (team: string) => {
    setTheme(prev => {
      // Apply team colors to customizations if Big 12 team
      const teamColors = BIG12_TEAMS[team as keyof typeof BIG12_TEAMS];
      const teamCustomizations: Partial<ThemeCustomizations> = teamColors
        ? {
            primaryColor: teamColors.primary,
            secondaryColor: teamColors.secondary,
            accentColor: teamColors.primary
          }
        : {};

      return {
        ...prev,
        team,
        customizations: {
          ...prev.customizations,
          ...teamCustomizations
        }
      };
    });
  };

  const setCustomizations = (customizations: Partial<ThemeCustomizations>) => {
    setTheme(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        ...customizations
      }
    }));
  };

  const resetTheme = () => {
    setTheme({ mode: theme.mode }); // Keep current mode but reset everything else
  };

  // Save theme to localStorage and apply to document when theme changes
  useEffect(() => {
    saveThemeToStorage(theme);
    applyThemeToDocument(theme);
  }, [theme]);

  // Update sport from context if it changes
  useEffect(() => {
    if (currentSportType && currentSportType !== theme.sport) {
      setSportTheme(currentSportType);
    }
  }, [currentSportType, theme.sport]);

  // Create the MUI theme object
  const muiTheme = useMemo(() => {
    let sportType = SportType.FOOTBALL; // Default
    
    // Try to match sport string to SportType enum
    if (theme.sport) {
      const matchedSport = Object.values(SportType).find(
        sport => sport.toLowerCase() === theme.sport!.toLowerCase()
      );
      if (matchedSport) {
        sportType = matchedSport;
      }
    }
    
    // Use current sport type from context if available
    if (currentSportType) {
      sportType = currentSportType;
    }

    return createExtendedTheme(theme.mode, sportType);
  }, [theme.mode, theme.sport, currentSportType]);

  // Create the context value
  const contextValue = useMemo(() => ({
    theme,
    themeMode: theme.mode,
    setThemeMode,
    toggleTheme,
    setSportTheme,
    setTeamTheme,
    setCustomizations,
    resetTheme,
    currentSport: theme.sport || currentSportType,
    currentTeam: theme.team
  }), [theme, currentSportType]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the enhanced theme context
 * @returns ThemeContextType containing theme state and manipulation functions
 * @throws Error if used outside of ThemeProvider
 */
export const useThemeContext = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Convenience hook for accessing just the theme mode
 * @returns Current theme mode ('light' | 'dark')
 */
export const useThemeMode = (): ThemeMode => {
  const { themeMode } = useThemeContext();
  return themeMode;
};

/**
 * Convenience hook for accessing sport and team themes
 * @returns Object with current sport and team
 */
export const useSportTeamTheme = () => {
  const { currentSport, currentTeam, setSportTheme, setTeamTheme } = useThemeContext();
  return {
    currentSport,
    currentTeam,
    setSportTheme,
    setTeamTheme
  };
};

/**
 * Convenience hook for accessing theme customizations
 * @returns Object with customizations and setter function
 */
export const useThemeCustomizations = () => {
  const { theme, setCustomizations, resetTheme } = useThemeContext();
  return {
    customizations: theme.customizations,
    setCustomizations,
    resetTheme
  };
};

// Export the complete Theme and ThemeCustomizations interfaces for external use
export type { Theme, ThemeCustomizations, ThemeMode };

// Export Big 12 teams for external components
export { BIG12_TEAMS };

export default ThemeProvider;
