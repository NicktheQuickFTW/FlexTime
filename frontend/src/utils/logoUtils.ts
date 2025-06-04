/**
 * FlexTime Logo Utilities
 * Provides easy access to all logos with proper mapping to HELiiX school IDs
 */

// Logo base paths (Next.js public directory)
const LOGO_BASE_PATH = '/logos'
const TEAMS_PATH = `${LOGO_BASE_PATH}/teams`
const FLEXTIME_PATH = `${LOGO_BASE_PATH}/flextime`
const CONFERENCE_PATH = `${LOGO_BASE_PATH}/conferences`

// FlexTime logos
export const FLEXTIME_LOGOS = {
  black: `${FLEXTIME_PATH}/flextime-black.jpg`,
  white: `${FLEXTIME_PATH}/flextime-white.jpg`,
  dark: `${FLEXTIME_PATH}/flextime-dark.svg`,
  light: `${FLEXTIME_PATH}/flextime-light.svg`,
  svg: {
    black: {
      large: `${FLEXTIME_PATH}/flextime-black1028x1028.svg`,
      small: `${FLEXTIME_PATH}/flextime-black240x240.svg`,
    },
    white: {
      large: `${FLEXTIME_PATH}/flextime-white1028x1028.svg`,
      small: `${FLEXTIME_PATH}/flextime-white240x240.svg`,
    }
  }
}

// Big 12 Conference logos
export const BIG12_LOGOS = {
  primary: `${CONFERENCE_PATH}/big_12_primary.svg`,
  black: `${CONFERENCE_PATH}/big_12_primary_black.svg`,
  white: `${CONFERENCE_PATH}/big_12_primary_white.svg`,
  reversed: `${CONFERENCE_PATH}/big_12_primary_reversed.svg`
}

// Team logo mapping based on HELiiX school IDs
export const TEAM_LOGOS = {
  1: { // University of Arizona
    default: `${TEAMS_PATH}/arizona.svg`,
    dark: `${TEAMS_PATH}/dark/arizona-dark.svg`,
    light: `${TEAMS_PATH}/light/arizona-light.svg`,
    name: 'Arizona Wildcats'
  },
  2: { // Arizona State University
    default: `${TEAMS_PATH}/arizona_state.svg`,
    dark: `${TEAMS_PATH}/dark/arizona_state-dark.svg`,
    light: `${TEAMS_PATH}/light/arizona_state-light.svg`,
    name: 'Arizona State Sun Devils'
  },
  3: { // Baylor University
    default: `${TEAMS_PATH}/baylor.svg`,
    dark: `${TEAMS_PATH}/dark/baylor-dark.svg`,
    light: `${TEAMS_PATH}/light/baylor-light.svg`,
    name: 'Baylor Bears'
  },
  4: { // Brigham Young University
    default: `${TEAMS_PATH}/byu.svg`,
    dark: `${TEAMS_PATH}/dark/byu-dark.svg`,
    light: `${TEAMS_PATH}/light/byu-light.svg`,
    name: 'BYU Cougars'
  },
  5: { // University of Central Florida
    default: `${TEAMS_PATH}/ucf.svg`,
    dark: `${TEAMS_PATH}/dark/ucf-dark.svg`,
    light: `${TEAMS_PATH}/light/ucf-light.svg`,
    name: 'UCF Knights'
  },
  6: { // University of Cincinnati
    default: `${TEAMS_PATH}/cincinnati.svg`,
    dark: `${TEAMS_PATH}/dark/cincinnati-dark.svg`,
    light: `${TEAMS_PATH}/light/cincinnati-light.svg`,
    name: 'Cincinnati Bearcats'
  },
  7: { // University of Colorado Boulder
    default: `${TEAMS_PATH}/colorado.svg`,
    dark: `${TEAMS_PATH}/dark/colorado-dark.svg`,
    light: `${TEAMS_PATH}/light/colorado-light.svg`,
    name: 'Colorado Buffaloes'
  },
  8: { // University of Houston
    default: `${TEAMS_PATH}/houston.svg`,
    dark: `${TEAMS_PATH}/dark/houston-dark.svg`,
    light: `${TEAMS_PATH}/light/houston-light.svg`,
    name: 'Houston Cougars'
  },
  9: { // Iowa State University
    default: `${TEAMS_PATH}/iowa_state.svg`,
    dark: `${TEAMS_PATH}/dark/iowa_state-dark.svg`,
    light: `${TEAMS_PATH}/light/iowa_state-light.svg`,
    name: 'Iowa State Cyclones'
  },
  10: { // University of Kansas
    default: `${TEAMS_PATH}/kansas.svg`,
    dark: `${TEAMS_PATH}/dark/kansas-dark.svg`,
    light: `${TEAMS_PATH}/light/kansas-light.svg`,
    name: 'Kansas Jayhawks'
  },
  11: { // Kansas State University
    default: `${TEAMS_PATH}/kansas_state.svg`,
    dark: `${TEAMS_PATH}/dark/kansas_state-dark.svg`,
    light: `${TEAMS_PATH}/light/kansas_state-light.svg`,
    name: 'Kansas State Wildcats'
  },
  12: { // Oklahoma State University
    default: `${TEAMS_PATH}/oklahoma_state.svg`,
    dark: `${TEAMS_PATH}/dark/oklahoma_state-dark.svg`,
    light: `${TEAMS_PATH}/light/oklahoma_state-light.svg`,
    name: 'Oklahoma State Cowboys'
  },
  13: { // Texas Christian University
    default: `${TEAMS_PATH}/tcu.svg`,
    dark: `${TEAMS_PATH}/dark/tcu-dark.svg`,
    light: `${TEAMS_PATH}/light/tcu-light.svg`,
    name: 'TCU Horned Frogs'
  },
  14: { // Texas Tech University
    default: `${TEAMS_PATH}/texas_tech.svg`,
    dark: `${TEAMS_PATH}/dark/texas_tech-dark.svg`,
    light: `${TEAMS_PATH}/light/texas_tech-light.svg`,
    name: 'Texas Tech Red Raiders'
  },
  15: { // University of Utah
    default: `${TEAMS_PATH}/utah.svg`,
    dark: `${TEAMS_PATH}/dark/utah-dark.svg`,
    light: `${TEAMS_PATH}/light/utah-light.svg`,
    name: 'Utah Utes'
  },
  16: { // West Virginia University
    default: `${TEAMS_PATH}/west_virginia.svg`,
    dark: `${TEAMS_PATH}/dark/west_virginia-dark.svg`,
    light: `${TEAMS_PATH}/light/west_virginia-light.svg`,
    name: 'West Virginia Mountaineers'
  }
} as const

// Utility functions
export const getTeamLogo = (schoolId: number, variant: 'default' | 'dark' | 'light' = 'default') => {
  const team = TEAM_LOGOS[schoolId as keyof typeof TEAM_LOGOS]
  return team ? team[variant] : null
}

export const getTeamName = (schoolId: number) => {
  const team = TEAM_LOGOS[schoolId as keyof typeof TEAM_LOGOS]
  return team ? team.name : null
}

export const getFlexTimeLogo = (variant: 'black' | 'white' | 'dark' | 'light' = 'dark') => {
  return FLEXTIME_LOGOS[variant]
}

export const getBig12Logo = (variant: 'primary' | 'black' | 'white' | 'reversed' = 'primary') => {
  return BIG12_LOGOS[variant]
}

// Get appropriate logo based on theme
export const getThemedLogo = (schoolId: number, isDarkTheme: boolean = true) => {
  return getTeamLogo(schoolId, isDarkTheme ? 'dark' : 'light')
}

export const getThemedFlexTimeLogo = (isDarkTheme: boolean = true) => {
  return getFlexTimeLogo(isDarkTheme ? 'dark' : 'light')
}

export const getThemedBig12Logo = (isDarkTheme: boolean = true) => {
  return getBig12Logo(isDarkTheme ? 'white' : 'black')
}

// Export all team IDs for easy iteration
export const ALL_TEAM_IDS = Object.keys(TEAM_LOGOS).map(Number)

// Team URL mapping for dynamic routes
export const TEAM_URL_MAPPING = {
  'arizona': 1,
  'arizona-state': 2,
  'baylor': 3,
  'byu': 4,
  'ucf': 5,
  'cincinnati': 6,
  'colorado': 7,
  'houston': 8,
  'iowa-state': 9,
  'kansas': 10,
  'kansas-state': 11,
  'oklahoma-state': 12,
  'tcu': 13,
  'texas-tech': 14,
  'utah': 15,
  'west-virginia': 16
} as const

export const getTeamIdFromUrl = (urlName: string) => {
  return TEAM_URL_MAPPING[urlName as keyof typeof TEAM_URL_MAPPING] || null
}