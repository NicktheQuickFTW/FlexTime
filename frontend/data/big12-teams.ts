/**
 * Big 12 Conference Team Branding Data
 * 
 * Comprehensive branding information for all 16 Big 12 Conference teams
 * including colors, logos, venues, and visual identity elements
 */

export interface TeamBranding {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  mascot: string;
  colors: {
    primary: string;
    primaryRGB: string;
    secondary: string;
    secondaryRGB: string;
    accent?: string;
    accentRGB?: string;
  };
  logos: {
    dark: string;  // Logo for dark backgrounds
    light: string; // Logo for light backgrounds
  };
  venues: {
    football?: string;
    basketball?: string;
    baseball?: string;
    other?: string;
  };
  location: {
    city: string;
    state: string;
  };
  conference: 'Big 12';
}

export const BIG12_TEAMS: Record<string, TeamBranding> = {
  arizona: {
    id: 'arizona',
    name: 'University of Arizona',
    shortName: 'Arizona',
    abbreviation: 'ARIZ',
    mascot: 'Wildcats',
    colors: {
      primary: '#003366',
      primaryRGB: '0, 51, 102',
      secondary: '#CC0033',
      secondaryRGB: '204, 0, 51',
      accent: '#FFFFFF',
      accentRGB: '255, 255, 255'
    },
    logos: {
      dark: '/assets/logos/teams/dark/arizona.svg',
      light: '/assets/logos/teams/light/arizona.svg'
    },
    venues: {
      football: 'Arizona Stadium',
      basketball: 'McKale Center',
      baseball: 'Hi Corbett Field'
    },
    location: {
      city: 'Tucson',
      state: 'AZ'
    },
    conference: 'Big 12'
  },
  
  arizona_state: {
    id: 'arizona_state',
    name: 'Arizona State University',
    shortName: 'Arizona State',
    abbreviation: 'ASU',
    mascot: 'Sun Devils',
    colors: {
      primary: '#8C1D40',
      primaryRGB: '140, 29, 64',
      secondary: '#FFC627',
      secondaryRGB: '255, 198, 39'
    },
    logos: {
      dark: '/assets/logos/teams/dark/arizona_state.svg',
      light: '/assets/logos/teams/light/arizona_state.svg'
    },
    venues: {
      football: 'Sun Devil Stadium',
      basketball: 'Desert Financial Arena',
      baseball: 'Phoenix Municipal Stadium'
    },
    location: {
      city: 'Tempe',
      state: 'AZ'
    },
    conference: 'Big 12'
  },
  
  baylor: {
    id: 'baylor',
    name: 'Baylor University',
    shortName: 'Baylor',
    abbreviation: 'BAY',
    mascot: 'Bears',
    colors: {
      primary: '#003015',
      primaryRGB: '0, 48, 21',
      secondary: '#FFB81C',
      secondaryRGB: '255, 184, 28'
    },
    logos: {
      dark: '/assets/logos/teams/dark/baylor.svg',
      light: '/assets/logos/teams/light/baylor.svg'
    },
    venues: {
      football: 'McLane Stadium',
      basketball: 'Foster Pavilion',
      baseball: 'Baylor Ballpark'
    },
    location: {
      city: 'Waco',
      state: 'TX'
    },
    conference: 'Big 12'
  },
  
  byu: {
    id: 'byu',
    name: 'Brigham Young University',
    shortName: 'BYU',
    abbreviation: 'BYU',
    mascot: 'Cougars',
    colors: {
      primary: '#002E5D',
      primaryRGB: '0, 46, 93',
      secondary: '#FFFFFF',
      secondaryRGB: '255, 255, 255',
      accent: '#C5C5C5',
      accentRGB: '197, 197, 197'
    },
    logos: {
      dark: '/assets/logos/teams/dark/byu.svg',
      light: '/assets/logos/teams/light/byu.svg'
    },
    venues: {
      football: 'LaVell Edwards Stadium',
      basketball: 'Marriott Center',
      baseball: 'Larry H. Miller Field'
    },
    location: {
      city: 'Provo',
      state: 'UT'
    },
    conference: 'Big 12'
  },
  
  cincinnati: {
    id: 'cincinnati',
    name: 'University of Cincinnati',
    shortName: 'Cincinnati',
    abbreviation: 'CIN',
    mascot: 'Bearcats',
    colors: {
      primary: '#E00122',
      primaryRGB: '224, 1, 34',
      secondary: '#000000',
      secondaryRGB: '0, 0, 0'
    },
    logos: {
      dark: '/assets/logos/teams/dark/cincinnati.svg',
      light: '/assets/logos/teams/light/cincinnati.svg'
    },
    venues: {
      football: 'Nippert Stadium',
      basketball: 'Fifth Third Arena',
      baseball: 'UC Baseball Stadium'
    },
    location: {
      city: 'Cincinnati',
      state: 'OH'
    },
    conference: 'Big 12'
  },
  
  colorado: {
    id: 'colorado',
    name: 'University of Colorado Boulder',
    shortName: 'Colorado',
    abbreviation: 'COL',
    mascot: 'Buffaloes',
    colors: {
      primary: '#000000',
      primaryRGB: '0, 0, 0',
      secondary: '#CFB87C',
      secondaryRGB: '207, 184, 124',
      accent: '#A2A4A3',
      accentRGB: '162, 164, 163'
    },
    logos: {
      dark: '/assets/logos/teams/dark/colorado.svg',
      light: '/assets/logos/teams/light/colorado.svg'
    },
    venues: {
      football: 'Folsom Field',
      basketball: 'CU Events Center'
    },
    location: {
      city: 'Boulder',
      state: 'CO'
    },
    conference: 'Big 12'
  },
  
  houston: {
    id: 'houston',
    name: 'University of Houston',
    shortName: 'Houston',
    abbreviation: 'HOU',
    mascot: 'Cougars',
    colors: {
      primary: '#CC0033',
      primaryRGB: '204, 0, 51',
      secondary: '#002D62',
      secondaryRGB: '0, 45, 98'
    },
    logos: {
      dark: '/assets/logos/teams/dark/houston.svg',
      light: '/assets/logos/teams/light/houston.svg'
    },
    venues: {
      football: 'TDECU Stadium',
      basketball: 'Fertitta Center',
      baseball: 'Darryl & Lori Schroeder Park'
    },
    location: {
      city: 'Houston',
      state: 'TX'
    },
    conference: 'Big 12'
  },
  
  iowa_state: {
    id: 'iowa_state',
    name: 'Iowa State University',
    shortName: 'Iowa State',
    abbreviation: 'ISU',
    mascot: 'Cyclones',
    colors: {
      primary: '#C8102E',
      primaryRGB: '200, 16, 46',
      secondary: '#F1BE48',
      secondaryRGB: '241, 190, 72'
    },
    logos: {
      dark: '/assets/logos/teams/dark/iowa_state.svg',
      light: '/assets/logos/teams/light/iowa_state.svg'
    },
    venues: {
      football: 'Jack Trice Stadium',
      basketball: 'Hilton Coliseum'
    },
    location: {
      city: 'Ames',
      state: 'IA'
    },
    conference: 'Big 12'
  },
  
  kansas: {
    id: 'kansas',
    name: 'University of Kansas',
    shortName: 'Kansas',
    abbreviation: 'KU',
    mascot: 'Jayhawks',
    colors: {
      primary: '#0051BA',
      primaryRGB: '0, 81, 186',
      secondary: '#E8000D',
      secondaryRGB: '232, 0, 13',
      accent: '#FFC82D',
      accentRGB: '255, 200, 45'
    },
    logos: {
      dark: '/assets/logos/teams/dark/kansas.svg',
      light: '/assets/logos/teams/light/kansas.svg'
    },
    venues: {
      football: 'David Booth Kansas Memorial Stadium',
      basketball: 'Allen Fieldhouse',
      baseball: 'Hoglund Ballpark'
    },
    location: {
      city: 'Lawrence',
      state: 'KS'
    },
    conference: 'Big 12'
  },
  
  kansas_state: {
    id: 'kansas_state',
    name: 'Kansas State University',
    shortName: 'Kansas State',
    abbreviation: 'KSU',
    mascot: 'Wildcats',
    colors: {
      primary: '#512888',
      primaryRGB: '81, 40, 136',
      secondary: '#D1D1D1',
      secondaryRGB: '209, 209, 209'
    },
    logos: {
      dark: '/assets/logos/teams/dark/kansas_state.svg',
      light: '/assets/logos/teams/light/kansas_state.svg'
    },
    venues: {
      football: 'Bill Snyder Family Stadium',
      basketball: 'Bramlage Coliseum',
      baseball: 'Tointon Family Stadium'
    },
    location: {
      city: 'Manhattan',
      state: 'KS'
    },
    conference: 'Big 12'
  },
  
  oklahoma_state: {
    id: 'oklahoma_state',
    name: 'Oklahoma State University',
    shortName: 'Oklahoma State',
    abbreviation: 'OSU',
    mascot: 'Cowboys',
    colors: {
      primary: '#FF6600',
      primaryRGB: '255, 102, 0',
      secondary: '#000000',
      secondaryRGB: '0, 0, 0'
    },
    logos: {
      dark: '/assets/logos/teams/dark/oklahoma_state.svg',
      light: '/assets/logos/teams/light/oklahoma_state.svg'
    },
    venues: {
      football: 'Boone Pickens Stadium',
      basketball: 'Gallagher-Iba Arena',
      baseball: "O'Brate Stadium"
    },
    location: {
      city: 'Stillwater',
      state: 'OK'
    },
    conference: 'Big 12'
  },
  
  tcu: {
    id: 'tcu',
    name: 'Texas Christian University',
    shortName: 'TCU',
    abbreviation: 'TCU',
    mascot: 'Horned Frogs',
    colors: {
      primary: '#4D1979',
      primaryRGB: '77, 25, 121',
      secondary: '#A3A9AC',
      secondaryRGB: '163, 169, 172'
    },
    logos: {
      dark: '/assets/logos/teams/dark/tcu.svg',
      light: '/assets/logos/teams/light/tcu.svg'
    },
    venues: {
      football: 'Amon G. Carter Stadium',
      basketball: 'Ed and Rae Schollmaier Arena',
      baseball: 'Lupton Stadium'
    },
    location: {
      city: 'Fort Worth',
      state: 'TX'
    },
    conference: 'Big 12'
  },
  
  texas_tech: {
    id: 'texas_tech',
    name: 'Texas Tech University',
    shortName: 'Texas Tech',
    abbreviation: 'TTU',
    mascot: 'Red Raiders',
    colors: {
      primary: '#CC0000',
      primaryRGB: '204, 0, 0',
      secondary: '#000000',
      secondaryRGB: '0, 0, 0'
    },
    logos: {
      dark: '/assets/logos/teams/dark/texas_tech.svg',
      light: '/assets/logos/teams/light/texas_tech.svg'
    },
    venues: {
      football: 'Jones AT&T Stadium',
      basketball: 'United Supermarkets Arena',
      baseball: 'Dan Law Field at Rip Griffin Park'
    },
    location: {
      city: 'Lubbock',
      state: 'TX'
    },
    conference: 'Big 12'
  },
  
  ucf: {
    id: 'ucf',
    name: 'University of Central Florida',
    shortName: 'UCF',
    abbreviation: 'UCF',
    mascot: 'Knights',
    colors: {
      primary: '#000000',
      primaryRGB: '0, 0, 0',
      secondary: '#BA9B37',
      secondaryRGB: '186, 155, 55'
    },
    logos: {
      dark: '/assets/logos/teams/dark/ucf.svg',
      light: '/assets/logos/teams/light/ucf.svg'
    },
    venues: {
      football: 'FBC Mortgage Stadium',
      basketball: 'Addition Financial Arena',
      baseball: 'John Euliano Park'
    },
    location: {
      city: 'Orlando',
      state: 'FL'
    },
    conference: 'Big 12'
  },
  
  utah: {
    id: 'utah',
    name: 'University of Utah',
    shortName: 'Utah',
    abbreviation: 'UTAH',
    mascot: 'Utes',
    colors: {
      primary: '#CC0000',
      primaryRGB: '204, 0, 0',
      secondary: '#000000',
      secondaryRGB: '0, 0, 0',
      accent: '#808080',
      accentRGB: '128, 128, 128'
    },
    logos: {
      dark: '/assets/logos/teams/dark/utah.svg',
      light: '/assets/logos/teams/light/utah.svg'
    },
    venues: {
      football: 'Rice-Eccles Stadium',
      basketball: 'Jon M. Huntsman Center',
      baseball: 'Smith\'s Ballpark'
    },
    location: {
      city: 'Salt Lake City',
      state: 'UT'
    },
    conference: 'Big 12'
  },
  
  west_virginia: {
    id: 'west_virginia',
    name: 'West Virginia University',
    shortName: 'West Virginia',
    abbreviation: 'WVU',
    mascot: 'Mountaineers',
    colors: {
      primary: '#002855',
      primaryRGB: '0, 40, 85',
      secondary: '#EAAA00',
      secondaryRGB: '234, 170, 0'
    },
    logos: {
      dark: '/assets/logos/teams/dark/west_virginia.svg',
      light: '/assets/logos/teams/light/west_virginia.svg'
    },
    venues: {
      football: 'Mountaineer Field at Milan Puskar Stadium',
      basketball: 'WVU Coliseum',
      baseball: 'Monongalia County Ballpark'
    },
    location: {
      city: 'Morgantown',
      state: 'WV'
    },
    conference: 'Big 12'
  }
};

// Helper functions for team branding
export const getTeamById = (id: string): TeamBranding | undefined => {
  return BIG12_TEAMS[id];
};

export const getTeamColors = (id: string) => {
  const team = BIG12_TEAMS[id];
  return team ? team.colors : null;
};

export const getTeamLogo = (id: string, theme: 'dark' | 'light' = 'dark') => {
  const team = BIG12_TEAMS[id];
  return team ? team.logos[theme] : null;
};

export const getTeamsByState = (state: string): TeamBranding[] => {
  return Object.values(BIG12_TEAMS).filter(team => team.location.state === state);
};

export const getAllTeams = (): TeamBranding[] => {
  return Object.values(BIG12_TEAMS);
};

// CSS Custom Properties generator for team theming
export const generateTeamCSSVariables = (teamId: string) => {
  const team = BIG12_TEAMS[teamId];
  if (!team) return {};
  
  return {
    '--team-primary': team.colors.primary,
    '--team-primary-rgb': team.colors.primaryRGB,
    '--team-secondary': team.colors.secondary,
    '--team-secondary-rgb': team.colors.secondaryRGB,
    '--team-accent': team.colors.accent || team.colors.secondary,
    '--team-accent-rgb': team.colors.accentRGB || team.colors.secondaryRGB,
  };
};