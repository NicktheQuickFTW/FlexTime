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
  [SportType.TENNIS]: { 
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
    // Base palette
    primary: {
      main: '#0066cc',
      light: '#3399ff',
      dark: '#004c99',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00c2ff',
      light: '#33cfff',
      dark: '#0097cc',
      contrastText: '#000000',
    },
    // Sport-specific accent color
    sportAccent: {
      main: sportColors.main,
      light: sportColors.light,
      dark: sportColors.dark,
      contrastText,
    },
    // Gradient for special elements
    gradient: `linear-gradient(45deg, ${sportColors.main}, ${sportColors.light})`,
    // Mode-specific adjustments
    background: {
      default: mode === 'light' ? '#f8f9fa' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      card: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 30, 30, 0.8)',
    },
    text: {
      primary: mode === 'light' ? '#1a1a1a' : '#f5f5f5',
      secondary: mode === 'light' ? '#4a4a4a' : '#b0b0b0',
    },
  };

  // Create the theme with CSS variables enabled
  return createTheme({
    cssVariables: true, // Enable CSS variables
    palette: paletteOptions,
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.5px',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.3px',
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.2px',
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 30,
            padding: '10px 24px',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: '0 8px 25px rgba(0, 102, 204, 0.4), 0 0 15px rgba(0, 198, 255, 0.5)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #0066cc, #00c2ff)',
          },
          containedSportAccent: ({ theme }) => ({
            background: theme.vars ? 
              `linear-gradient(135deg, var(--mui-palette-sportAccent-main), var(--mui-palette-sportAccent-light))` :
              `linear-gradient(135deg, ${theme.palette.sportAccent.main}, ${theme.palette.sportAccent.light})`,
            color: theme.palette.sportAccent.contrastText,
          }),
        },
        variants: [
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
            borderRadius: 15,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-10px)',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1), 0 8px 15px rgba(0, 102, 204, 0.2)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
      },
    },
  });
};

export default createExtendedTheme;
