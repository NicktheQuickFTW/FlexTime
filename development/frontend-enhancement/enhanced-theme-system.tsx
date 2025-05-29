/**
 * Enhanced Theme System for FlexTime
 * 
 * Advanced theming system with sport-specific colors, dark mode support,
 * accessibility features, and Big 12 Conference branding integration.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createTheme, 
  ThemeProvider as MuiThemeProvider, 
  PaletteOptions, 
  Theme,
  responsiveFontSizes,
  alpha
} from '@mui/material/styles';
import { deepmerge } from '@mui/utils';

// Enhanced type definitions
export enum SportType {
  FOOTBALL = 'football',
  MENS_BASKETBALL = 'mens_basketball',
  WOMENS_BASKETBALL = 'womens_basketball',
  BASEBALL = 'baseball',
  SOFTBALL = 'softball',
  VOLLEYBALL = 'volleyball',
  SOCCER = 'soccer',
  TENNIS = 'tennis',
  GOLF = 'golf',
  SWIMMING = 'swimming',
  TRACK = 'track',
  CROSS_COUNTRY = 'cross_country',
  WRESTLING = 'wrestling',
  GYMNASTICS = 'gymnastics'
}

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
  contrast: string;
}

export interface EnhancedPalette extends PaletteOptions {
  gradient: {
    primary: string;
    secondary: string;
    sport: string;
    success: string;
    warning: string;
    error: string;
  };
  sport: {
    primary: string;
    secondary: string;
    accent: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  big12: {
    primary: string;
    gold: string;
    navy: string;
    light: string;
    dark: string;
  };
  semantic: {
    homeGame: string;
    awayGame: string;
    neutral: string;
    conflict: string;
    optimal: string;
    warning: string;
  };
}

// Big 12 Conference official colors
const BIG12_COLORS = {
  primary: '#003366', // Big 12 Navy
  gold: '#FFB81C',    // Big 12 Gold
  navy: '#003366',
  light: '#E8F4FD',
  dark: '#001A33',
  white: '#FFFFFF'
};

// Sport-specific color palettes with enhanced semantic meanings
const SPORT_COLOR_PALETTES: Record<SportType, TeamColors> = {
  [SportType.FOOTBALL]: {
    primary: '#8B2635',  // Deep Red
    secondary: '#FFD700', // Gold
    accent: '#2C5530',   // Forest Green
    contrast: '#FFFFFF'
  },
  [SportType.MENS_BASKETBALL]: {
    primary: '#FF6B35',  // Basketball Orange
    secondary: '#004E89', // Navy Blue
    accent: '#F7931E',   // Bright Orange
    contrast: '#FFFFFF'
  },
  [SportType.WOMENS_BASKETBALL]: {
    primary: '#E91E63',  // Pink
    secondary: '#673AB7', // Purple
    accent: '#FF4081',   // Light Pink
    contrast: '#FFFFFF'
  },
  [SportType.BASEBALL]: {
    primary: '#2E7D32',  // Baseball Green
    secondary: '#8D6E63', // Brown
    accent: '#FFC107',   // Yellow
    contrast: '#FFFFFF'
  },
  [SportType.SOFTBALL]: {
    primary: '#7B1FA2',  // Purple
    secondary: '#FFB300', // Amber
    accent: '#E91E63',   // Pink
    contrast: '#FFFFFF'
  },
  [SportType.VOLLEYBALL]: {
    primary: '#FF5722',  // Deep Orange
    secondary: '#3F51B5', // Indigo
    accent: '#FFC107',   // Amber
    contrast: '#FFFFFF'
  },
  [SportType.SOCCER]: {
    primary: '#388E3C',  // Soccer Green
    secondary: '#1976D2', // Blue
    accent: '#FFC107',   // Yellow
    contrast: '#FFFFFF'
  },
  [SportType.TENNIS]: {
    primary: '#689F38',  // Light Green
    secondary: '#F57C00', // Orange
    accent: '#FFEB3B',   // Yellow
    contrast: '#000000'
  },
  [SportType.GOLF]: {
    primary: '#2E7D32',  // Golf Green
    secondary: '#8D6E63', // Brown
    accent: '#FFD54F',   // Light Yellow
    contrast: '#FFFFFF'
  },
  [SportType.SWIMMING]: {
    primary: '#0288D1',  // Swimming Blue
    secondary: '#00ACC1', // Cyan
    accent: '#26C6DA',   // Light Cyan
    contrast: '#FFFFFF'
  },
  [SportType.TRACK]: {
    primary: '#D32F2F',  // Track Red
    secondary: '#FBC02D', // Yellow
    accent: '#FF7043',   // Deep Orange
    contrast: '#FFFFFF'
  },
  [SportType.CROSS_COUNTRY]: {
    primary: '#795548',  // Brown
    secondary: '#FF9800', // Orange
    accent: '#8BC34A',   // Light Green
    contrast: '#FFFFFF'
  },
  [SportType.WRESTLING]: {
    primary: '#5D4037',  // Wrestling Brown
    secondary: '#FF5722', // Deep Orange
    accent: '#FFB74D',   // Light Orange
    contrast: '#FFFFFF'
  },
  [SportType.GYMNASTICS]: {
    primary: '#C2185B',  // Pink
    secondary: '#9C27B0', // Purple
    accent: '#E1BEE7',   // Light Purple
    contrast: '#FFFFFF'
  }
};

// Game status semantic colors
const GAME_STATUS_COLORS = {
  homeGame: '#4CAF50',    // Green
  awayGame: '#2196F3',    // Blue
  neutral: '#FF9800',     // Orange
  conflict: '#F44336',    // Red
  optimal: '#8BC34A',     // Light Green
  warning: '#FF5722'      // Deep Orange
};

/**
 * Creates an enhanced theme with all customizations
 */
const createEnhancedTheme = (
  mode: 'light' | 'dark',
  sportType: SportType,
  accessibilityMode: boolean = false
): Theme => {
  const sportColors = SPORT_COLOR_PALETTES[sportType];
  const isDark = mode === 'dark';
  
  // Enhanced color palette
  const palette: EnhancedPalette = {
    mode,
    primary: {
      main: BIG12_COLORS.primary,
      light: alpha(BIG12_COLORS.primary, 0.7),
      dark: BIG12_COLORS.dark,
      contrastText: BIG12_COLORS.white
    },
    secondary: {
      main: BIG12_COLORS.gold,
      light: alpha(BIG12_COLORS.gold, 0.7),
      dark: '#CC9416',
      contrastText: BIG12_COLORS.navy
    },
    background: {
      default: isDark ? '#0A0E1A' : '#F8FAFC',
      paper: isDark ? '#1A1F2E' : '#FFFFFF'
    },
    text: {
      primary: isDark ? '#F1F5F9' : '#1E293B',
      secondary: isDark ? '#CBD5E1' : '#475569'
    },
    // Enhanced gradient system
    gradient: {
      primary: `linear-gradient(135deg, ${BIG12_COLORS.primary} 0%, ${alpha(BIG12_COLORS.primary, 0.8)} 100%)`,
      secondary: `linear-gradient(135deg, ${BIG12_COLORS.gold} 0%, ${alpha(BIG12_COLORS.gold, 0.8)} 100%)`,
      sport: `linear-gradient(135deg, ${sportColors.primary} 0%, ${sportColors.secondary} 100%)`,
      success: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
      warning: `linear-gradient(135deg, #F59E0B 0%, #D97706 100%)`,
      error: `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`
    },
    // Sport-specific colors
    sport: {
      primary: sportColors.primary,
      secondary: sportColors.secondary,
      accent: sportColors.accent,
      light: alpha(sportColors.primary, 0.1),
      dark: alpha(sportColors.primary, 0.9),
      contrastText: sportColors.contrast
    },
    // Big 12 branding colors
    big12: BIG12_COLORS,
    // Semantic colors for scheduling
    semantic: GAME_STATUS_COLORS
  };

  const baseTheme = createTheme({
    palette,
    typography: {
      fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: '3.5rem',
        lineHeight: 1.1,
        letterSpacing: '-0.025em'
      },
      h2: {
        fontWeight: 700,
        fontSize: '2.25rem',
        lineHeight: 1.2,
        letterSpacing: '-0.015em'
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.875rem',
        lineHeight: 1.3
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.5
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.6
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6
      }
    },
    shape: {
      borderRadius: 12
    },
    spacing: 8,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: `${alpha(palette.primary!.main as string, 0.3)} transparent`,
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(palette.primary!.main as string, 0.3),
              borderRadius: '4px'
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            padding: '12px 24px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
              transform: 'translateX(-100%)',
              transition: 'transform 0.6s'
            },
            '&:hover::before': {
              transform: 'translateX(100%)'
            },
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 25px ${alpha(palette.primary!.main as string, 0.3)}`
            }
          },
          containedPrimary: {
            background: palette.gradient.primary,
            '&:hover': {
              background: palette.gradient.primary,
              filter: 'brightness(1.1)'
            }
          },
          containedSecondary: {
            background: palette.gradient.secondary,
            '&:hover': {
              background: palette.gradient.secondary,
              filter: 'brightness(1.1)'
            }
          }
        },
        variants: [
          {
            props: { variant: 'sport' },
            style: {
              background: palette.gradient.sport,
              color: sportColors.contrast,
              '&:hover': {
                background: palette.gradient.sport,
                filter: 'brightness(1.15)'
              }
            }
          },
          {
            props: { variant: 'glassmorphic' },
            style: {
              background: alpha(palette.background!.paper as string, 0.8),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(palette.primary!.main as string, 0.2)}`,
              '&:hover': {
                background: alpha(palette.background!.paper as string, 0.9),
                borderColor: palette.primary!.main
              }
            }
          }
        ]
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: palette.gradient.sport,
              opacity: 0,
              transition: 'opacity 0.3s'
            },
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isDark 
                ? '0 16px 64px rgba(0, 0, 0, 0.4)' 
                : '0 16px 64px rgba(0, 0, 0, 0.12)',
              '&::before': {
                opacity: 1
              }
            }
          }
        },
        variants: [
          {
            props: { variant: 'glassmorphic' },
            style: {
              background: alpha(palette.background!.paper as string, 0.8),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(palette.primary!.main as string, 0.1)}`
            }
          },
          {
            props: { variant: 'sport' },
            style: {
              background: `linear-gradient(135deg, ${alpha(sportColors.primary, 0.05)} 0%, ${alpha(sportColors.secondary, 0.05)} 100%)`,
              border: `1px solid ${alpha(sportColors.primary, 0.2)}`
            }
          }
        ]
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark 
              ? alpha('#1A1F2E', 0.95) 
              : alpha('#FFFFFF', 0.95),
            backdropFilter: 'blur(20px)',
            boxShadow: 'none',
            borderBottom: `1px solid ${alpha(palette.primary!.main as string, 0.1)}`
          }
        }
      },
      MuiPaper: {
        variants: [
          {
            props: { variant: 'glassmorphic' },
            style: {
              background: alpha(palette.background!.paper as string, 0.8),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(palette.primary!.main as string, 0.1)}`
            }
          }
        ]
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 500
          },
          colorPrimary: {
            background: palette.gradient.primary,
            color: palette.primary!.contrastText
          }
        },
        variants: [
          {
            props: { variant: 'sport' },
            style: {
              background: palette.gradient.sport,
              color: sportColors.contrast
            }
          }
        ]
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            '& .MuiSlider-thumb': {
              background: palette.gradient.primary,
              '&:hover': {
                boxShadow: `0 0 0 8px ${alpha(palette.primary!.main as string, 0.16)}`
              }
            },
            '& .MuiSlider-track': {
              background: palette.gradient.primary
            }
          }
        }
      }
    }
  });

  // Apply responsive font sizing
  return responsiveFontSizes(baseTheme, {
    factor: accessibilityMode ? 1.5 : 1.2
  });
};

// Theme context
interface ThemeContextType {
  mode: 'light' | 'dark';
  sportType: SportType;
  accessibilityMode: boolean;
  toggleMode: () => void;
  setSportType: (sport: SportType) => void;
  toggleAccessibilityMode: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface EnhancedThemeProviderProps {
  children: ReactNode;
  defaultSport?: SportType;
  defaultMode?: 'light' | 'dark';
}

/**
 * Enhanced Theme Provider Component
 */
export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({
  children,
  defaultSport = SportType.FOOTBALL,
  defaultMode = 'light'
}) => {
  const [mode, setMode] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme-mode') as 'light' | 'dark') || defaultMode
  );
  
  const [sportType, setSportTypeState] = useState<SportType>(
    () => (localStorage.getItem('sport-type') as SportType) || defaultSport
  );
  
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(
    () => localStorage.getItem('accessibility-mode') === 'true'
  );

  // Persist theme preferences
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('sport-type', sportType);
  }, [sportType]);

  useEffect(() => {
    localStorage.setItem('accessibility-mode', accessibilityMode.toString());
  }, [accessibilityMode]);

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setSportType = (sport: SportType) => {
    setSportTypeState(sport);
  };

  const toggleAccessibilityMode = () => {
    setAccessibilityMode(prev => !prev);
  };

  const theme = createEnhancedTheme(mode, sportType, accessibilityMode);

  const contextValue: ThemeContextType = {
    mode,
    sportType,
    accessibilityMode,
    toggleMode,
    setSportType,
    toggleAccessibilityMode,
    theme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use the enhanced theme context
 */
export const useEnhancedTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useEnhancedTheme must be used within an EnhancedThemeProvider');
  }
  return context;
};

// Export types and utilities
export { SPORT_COLOR_PALETTES, BIG12_COLORS, GAME_STATUS_COLORS };
export type { TeamColors, EnhancedPalette };

// Declare module augmentation for custom variants
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    sport: true;
    glassmorphic: true;
  }
}

declare module '@mui/material/Card' {
  interface CardPropsVariantOverrides {
    glassmorphic: true;
    sport: true;
  }
}

declare module '@mui/material/Paper' {
  interface PaperPropsVariantOverrides {
    glassmorphic: true;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsVariantOverrides {
    sport: true;
  }
}