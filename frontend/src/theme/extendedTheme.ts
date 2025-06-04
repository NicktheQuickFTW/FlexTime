import { createTheme, PaletteOptions, Theme } from '@mui/material/styles';
import { SportType } from '../types';

// Augment the Theme and PaletteOptions interfaces to include our custom properties
declare module '@mui/material/styles' {
  interface Palette {
    gradient: string;
    sportAccent: {
      main: string;
      light: string;
      dark: string;
      contrastText: string;
    };
  }
  
  interface PaletteOptions {
    gradient?: string;
    sportAccent?: {
      main: string;
      light: string;
      dark: string;
      contrastText: string;
    };
  }

  interface TypeBackground {
    card?: string;
  }
}

// Augment the Button component to allow our custom color
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    sportAccent: true;
  }
}

// Sport-specific color palettes
const sportColorMap: Record<SportType, { main: string; light: string; dark: string }> = {
  [SportType.FOOTBALL]: { 
    main: '#8C1D40', 
    light: '#B33D5E', 
    dark: '#5E1429' 
  },
  [SportType.MENS_BASKETBALL]: { 
    main: '#00A3E0', 
    light: '#33B5E7', 
    dark: '#0076A3' 
  },
  [SportType.WOMENS_BASKETBALL]: { 
    main: '#00A3E0', 
    light: '#33B5E7', 
    dark: '#0076A3' 
  },
  [SportType.BASEBALL]: { 
    main: '#FFC627', 
    light: '#FFD45F', 
    dark: '#D9A61E' 
  },
  [SportType.SOFTBALL]: { 
    main: '#FFC627', 
    light: '#FFD45F', 
    dark: '#D9A61E' 
  },
  [SportType.VOLLEYBALL]: { 
    main: '#00A3E0', 
    light: '#33B5E7', 
    dark: '#0076A3' 
  },
  [SportType.SOCCER]: { 
    main: '#00A3E0', 
    light: '#33B5E7', 
    dark: '#0076A3' 
  },
  [SportType.MENS_TENNIS]: { 
    main: '#FFC627', 
    light: '#FFD45F', 
    dark: '#D9A61E' 
  },
  [SportType.WOMENS_TENNIS]: { 
    main: '#FFC627', 
    light: '#FFD45F', 
    dark: '#D9A61E' 
  },
  [SportType.GOLF]: { 
    main: '#FFC627', 
    light: '#FFD45F', 
    dark: '#D9A61E' 
  },
  [SportType.SWIMMING]: { 
    main: '#00A3E0', 
    light: '#33B5E7', 
    dark: '#0076A3' 
  },
  [SportType.TRACK]: { 
    main: '#8C1D40', 
    light: '#B33D5E', 
    dark: '#5E1429' 
  },
  [SportType.CROSS_COUNTRY]: { 
    main: '#8C1D40', 
    light: '#B33D5E', 
    dark: '#5E1429' 
  },
  [SportType.WRESTLING]: { 
    main: '#8C1D40', 
    light: '#B33D5E', 
    dark: '#5E1429' 
  },
  [SportType.GYMNASTICS]: { 
    main: '#00A3E0', 
    light: '#33B5E7', 
    dark: '#0076A3' 
  }
};

/**
 * Creates an extended theme with CSS variables and sport-specific customizations
 * 
 * @param mode - The theme mode ('light' or 'dark')
 * @param sportType - The current sport type
 * @returns An extended MUI theme
 */
export const createExtendedTheme = (
  mode: 'light' | 'dark' = 'light',
  sportType: SportType = SportType.FOOTBALL
): Theme => {
  // Get sport-specific colors
  const sportColors = sportColorMap[sportType] || sportColorMap[SportType.FOOTBALL];
  
  // Determine text contrast color based on mode
  const contrastText = mode === 'light' ? '#ffffff' : '#000000';
  
  // Create the palette options based on mode and sport
  const paletteOptions: PaletteOptions = {
    mode,
    // Clean monochrome base palette
    primary: {
      main: mode === 'light' ? '#000000' : '#ffffff',
      light: mode === 'light' ? '#333333' : '#f5f5f5',
      dark: mode === 'light' ? '#000000' : '#cccccc',
      contrastText: mode === 'light' ? '#ffffff' : '#000000',
    },
    secondary: {
      main: mode === 'light' ? '#666666' : '#999999',
      light: mode === 'light' ? '#888888' : '#bbbbbb',
      dark: mode === 'light' ? '#444444' : '#777777',
      contrastText: mode === 'light' ? '#ffffff' : '#000000',
    },
    // Sport-specific accent color (keep for branding)
    sportAccent: {
      main: sportColors.main,
      light: sportColors.light,
      dark: sportColors.dark,
      contrastText,
    },
    // Clean monochrome gradient
    gradient: mode === 'light' ? 
      'linear-gradient(135deg, #000000, #333333)' : 
      'linear-gradient(135deg, #ffffff, #f5f5f5)',
    // Clean monochrome backgrounds
    background: {
      default: mode === 'light' ? '#ffffff' : '#000000',
      paper: mode === 'light' ? '#ffffff' : '#000000',
      card: mode === 'light' ? '#ffffff' : '#000000',
    },
    text: {
      primary: mode === 'light' ? '#000000' : '#ffffff',
      secondary: mode === 'light' ? '#666666' : '#999999',
    },
  };

  // Create the theme with CSS variables enabled
  return createTheme({
    cssVariables: true, // Enable CSS variables
    palette: paletteOptions,
    typography: {
      // FT Brand Typography System
      fontFamily: '"Exo 2", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: '"Orbitron", monospace', // Brand headers
        fontWeight: 800,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontFamily: '"Orbitron", monospace', // Brand headers
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontFamily: '"Rajdhani", sans-serif', // UI headers
        fontWeight: 700,
        letterSpacing: '0.025em',
      },
      h4: {
        fontFamily: '"Rajdhani", sans-serif', // UI headers
        fontWeight: 600,
        letterSpacing: '0.025em',
      },
      h5: {
        fontFamily: '"Rajdhani", sans-serif', // UI headers
        fontWeight: 600,
        letterSpacing: '0.025em',
      },
      h6: {
        fontFamily: '"Rajdhani", sans-serif', // UI headers
        fontWeight: 600,
        letterSpacing: '0.025em',
      },
      body1: {
        fontFamily: '"Exo 2", sans-serif', // Body text
        fontWeight: 400,
        letterSpacing: '0.015em',
      },
      body2: {
        fontFamily: '"Exo 2", sans-serif', // Body text
        fontWeight: 400,
        letterSpacing: '0.015em',
      },
      subtitle1: {
        fontFamily: '"Rajdhani", sans-serif', // UI text
        fontWeight: 500,
        letterSpacing: '0.025em',
      },
      subtitle2: {
        fontFamily: '"Rajdhani", sans-serif', // UI text
        fontWeight: 500,
        letterSpacing: '0.025em',
      },
      button: {
        fontFamily: '"Rajdhani", sans-serif', // UI buttons
        fontWeight: 600,
        letterSpacing: '0.025em',
        textTransform: 'none',
      },
      caption: {
        fontFamily: '"Exo 2", sans-serif',
        fontWeight: 400,
        letterSpacing: '0.015em',
      },
      overline: {
        fontFamily: '"Rajdhani", sans-serif',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'all 0.2s ease',
            border: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: mode === 'light' ? 
                '0 4px 12px rgba(0, 0, 0, 0.08)' : 
                '0 4px 12px rgba(255, 255, 255, 0.08)',
            },
          },
          containedPrimary: {
            background: mode === 'light' ? '#000000' : '#ffffff',
            color: mode === 'light' ? '#ffffff' : '#000000',
            border: 'none',
            '&:hover': {
              background: mode === 'light' ? '#333333' : '#e5e5e5',
            },
          },
          outlined: {
            borderColor: mode === 'light' ? '#000000' : '#ffffff',
            color: mode === 'light' ? '#000000' : '#ffffff',
            '&:hover': {
              background: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
              borderColor: mode === 'light' ? '#000000' : '#ffffff',
            },
          },
          text: {
            color: mode === 'light' ? '#000000' : '#ffffff',
            '&:hover': {
              background: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
            },
          },
        },
        variants: [
          {
            props: { variant: 'contained', color: 'sportAccent' },
            style: ({ theme }) => ({
              background: theme.vars ? 
                `linear-gradient(135deg, var(--mui-palette-sportAccent-main), var(--mui-palette-sportAccent-light))` :
                `linear-gradient(135deg, ${theme.palette.sportAccent.main}, ${theme.palette.sportAccent.light})`,
              color: theme.palette.sportAccent.contrastText,
            }),
          },
          {
            props: { color: 'sportAccent' },
            style: ({ theme }) => ({
              color: theme.palette.sportAccent.main,
              borderColor: theme.palette.sportAccent.main,
              '&:hover': {
                backgroundColor: `${theme.palette.sportAccent.main}14`, // 14 = 8% opacity in hex
                borderColor: theme.palette.sportAccent.main,
              },
            }),
          },
        ],
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
            boxShadow: 'none',
            background: mode === 'light' ? '#ffffff' : '#000000',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light' ? 
                '0 8px 16px rgba(0, 0, 0, 0.08)' : 
                '0 8px 16px rgba(255, 255, 255, 0.08)',
              borderColor: mode === 'light' ? '#cccccc' : '#555555',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
            backgroundColor: mode === 'light' ? '#ffffff' : '#000000',
          },
        },
      },
      // Add input and form field styling
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              fontSize: '14px',
              '& fieldset': {
                borderColor: mode === 'light' ? '#e5e5e5' : '#333333',
              },
              '&:hover fieldset': {
                borderColor: mode === 'light' ? '#cccccc' : '#555555',
              },
              '&.Mui-focused fieldset': {
                borderColor: mode === 'light' ? '#000000' : '#ffffff',
                borderWidth: 1,
              },
            },
            '& .MuiInputLabel-root': {
              color: mode === 'light' ? '#666666' : '#999999',
              fontSize: '14px',
              '&.Mui-focused': {
                color: mode === 'light' ? '#000000' : '#ffffff',
              },
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
            boxShadow: mode === 'light' ? 
              '0 20px 40px rgba(0, 0, 0, 0.1)' : 
              '0 20px 40px rgba(255, 255, 255, 0.1)',
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: mode === 'light' ? '#f8f9fa' : '#111111',
              borderBottom: `1px solid ${mode === 'light' ? '#e5e5e5' : '#333333'}`,
              fontWeight: 600,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            },
            '& .MuiTableCell-body': {
              borderBottom: `1px solid ${mode === 'light' ? '#f0f0f0' : '#222222'}`,
              fontSize: '14px',
            },
          },
        },
      },
    },
  });
};

export default createExtendedTheme;
