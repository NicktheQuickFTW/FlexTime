'use client'

import React, { createContext } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { createTheme } from '@mui/material/styles'
import SchoolPage from '../../../src/pages/universities/UniversityPage'

interface SchoolPageClientProps {
  schoolId: number
}

// Create mock contexts for compatibility
const MockThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
})

const MockAnimationContext = createContext({
  reducedMotion: false,
  toggleReducedMotion: () => {},
})

const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <MockThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
    {children}
  </MockThemeContext.Provider>
)

const MockAnimationProvider = ({ children }: { children: React.ReactNode }) => (
  <MockAnimationContext.Provider value={{ reducedMotion: false, toggleReducedMotion: () => {} }}>
    {children}
  </MockAnimationContext.Provider>
)

// Create FlexTime theme
const flexTimeTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bfff', // cyber-cyan
    },
    secondary: {
      main: '#1e40af', // electric-blue
    },
    background: {
      default: '#0a0e17', // space-navy
      paper: 'rgba(255, 255, 255, 0.08)', // glass-primary
    },
    text: {
      primary: '#ffffff', // crystal-white
      secondary: '#a0aec0', // silver-mist
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 191, 255, 0.15)',
        },
      },
    },
  },
})

export default function SchoolPageClient({ schoolId }: SchoolPageClientProps) {
  return (
    <ThemeProvider theme={flexTimeTheme}>
      <MockThemeProvider>
        <MockAnimationProvider>
          <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e17 0%, #060a10 100%)' }}>
            <SchoolPage schoolId={schoolId} />
          </div>
        </MockAnimationProvider>
      </MockThemeProvider>
    </ThemeProvider>
  )
}