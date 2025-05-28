// Sport-specific configuration for FlexTime UI

// Define sport-specific configuration interface
export interface SportConfig {
  // Basic information
  name: string;
  icon: string;
  color: string;
  
  // Game parameters
  defaultGameDuration: number; // in minutes
  minRestDays: number;
  recommendedRestDays: number;
  
  // Season parameters
  typicalSeasonLength: number; // in weeks
  defaultGamesPerTeam: number;
  maxGamesPerWeek: number;
  
  // Scheduling rules
  allowDoubleHeaders: boolean;
  requireHomeAwayBalance: boolean;
  maxConsecutiveHomeGames: number;
  maxConsecutiveAwayGames: number;
  
  // Venue requirements
  venueTypes: string[];
  requiresSpecializedVenues: boolean;
  
  // Visualization settings
  calendarViewEnabled: boolean;
  matrixViewEnabled: boolean;
  bracketViewEnabled: boolean;
  
  // Custom components
  customScheduleComponent?: string;
  customGameComponent?: string;
  
  // Sport-specific constraints
  defaultConstraints: {
    name: string;
    description: string;
    defaultPriority: number;
    category: string;
  }[];
  
  // Conference scheduling parameters
  conferenceSchedulingRules?: {
    totalGames: number;
    totalWindows: number;
    playTwiceCount?: number;
    playOnceCount?: number;
    hasBye?: boolean;
    coreRules: string[];
    softRules: string[];
    seriesLength?: number;
    maxHomeSeries?: number;
    weeklyFormat?: string;
  };
  
  // Additional properties for tennis sports
  isOutdoorSport?: boolean;
  hasIndoorBackup?: boolean;
  schedulingParameters?: {
    conferenceFormat: string;
    matchCount: number;
    weekCount: number;
    byeWeeks: number;
    typicalMatchDays: string[];
    specialMatchDays?: {
      [team: string]: string[];
    };
    weeklyCadence?: string;
    travelPartners?: {
      [team: string]: string | null;
    };
    travelPods?: {
      [podName: string]: string[];
    };
    elevationTeams?: string[];
    legacySchools?: string[];
    affiliateSchools?: string[];
    specialAgreements?: Array<{
      teams: string[];
      years: string[];
      homeTeam: string;
      description: string;
    }>;
    seasonDates: {
      [season: string]: {
        conferencePlayStart: string;
        conferencePlayEnd: string;
        championshipStart: string;
        championshipEnd: string;
      };
    };
  };
  
  // Flag to indicate if regular season scheduling is applicable
  regularSeasonScheduling?: boolean;
}

// Sport sponsorship by institution
export interface SportSponsorship {
  [sportType: string]: string[]; // Array of institution names that sponsor the sport
}

// Sport type enumeration
export enum SportType {
  FOOTBALL = 'football',
  MENS_BASKETBALL = 'mens_basketball',
  WOMENS_BASKETBALL = 'womens_basketball',
  BASEBALL = 'baseball',
  SOFTBALL = 'softball',
  VOLLEYBALL = 'volleyball',
  SOCCER = 'soccer',
  MENS_TENNIS = 'mens_tennis',
  WOMENS_TENNIS = 'womens_tennis',
  GYMNASTICS = 'gymnastics',
  WRESTLING = 'wrestling',
  MENS_GOLF = 'mens_golf',
  WOMENS_GOLF = 'womens_golf',
  MENS_SWIMMING = 'mens_swimming',
  WOMENS_SWIMMING = 'womens_swimming',
  MENS_INDOOR_TRACK = 'mens_indoor_track',
  WOMENS_INDOOR_TRACK = 'womens_indoor_track',
  MENS_OUTDOOR_TRACK = 'mens_outdoor_track',
  WOMENS_OUTDOOR_TRACK = 'womens_outdoor_track',
  MENS_CROSS_COUNTRY = 'mens_cross_country',
  WOMENS_CROSS_COUNTRY = 'womens_cross_country',
  BEACH_VOLLEYBALL = 'beach_volleyball',
  LACROSSE = 'lacrosse',
  ROWING = 'rowing',
  EQUESTRIAN = 'equestrian'
}

// Hard-coded sport sponsorship information
export const sportSponsorship: SportSponsorship = {
  [SportType.FOOTBALL]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.MENS_BASKETBALL]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.WOMENS_BASKETBALL]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.BASEBALL]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Houston', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 
    'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.SOFTBALL]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Houston', 
    'Iowa State', 'Kansas', 'Oklahoma State', 'Texas Tech', 'UCF', 'Utah'
  ],
  [SportType.VOLLEYBALL]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.SOCCER]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 
    'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
    'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.MENS_TENNIS]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Oklahoma State', 
    'TCU', 'Texas Tech', 'UCF', 'Utah'
  ],
  [SportType.WOMENS_TENNIS]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.GYMNASTICS]: [
    'Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia', 'Denver'
  ],
  [SportType.WRESTLING]: [
    'Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia',
    'Air Force', 'Cal Baptist', 'Missouri', 'North Dakota State', 'Northern Colorado', 
    'Northern Iowa', 'Oklahoma', 'South Dakota State', 'Utah Valley', 'Wyoming'
  ],
  [SportType.MENS_GOLF]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.WOMENS_GOLF]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF'
  ],
  [SportType.MENS_SWIMMING]: [
    'Arizona', 'Arizona State', 'BYU', 'Cincinnati', 'TCU', 'Utah', 'West Virginia'
  ],
  [SportType.WOMENS_SWIMMING]: [
    'Arizona', 'Arizona State', 'BYU', 'Cincinnati', 'Houston', 
    'Iowa State', 'Kansas', 'TCU', 'Utah', 'West Virginia'
  ],
  [SportType.MENS_INDOOR_TRACK]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech'
  ],
  [SportType.WOMENS_INDOOR_TRACK]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.MENS_OUTDOOR_TRACK]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech'
  ],
  [SportType.WOMENS_OUTDOOR_TRACK]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.MENS_CROSS_COUNTRY]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech'
  ],
  [SportType.WOMENS_CROSS_COUNTRY]: [
    'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
    'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 
    'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
  ],
  [SportType.BEACH_VOLLEYBALL]: [
    'Arizona', 'Arizona State', 'TCU', 'Utah'
  ],
  [SportType.LACROSSE]: [
    'Arizona State', 'Cincinnati', 'Colorado', 'Florida', 'San Diego State', 'UC Davis'
  ],
  [SportType.ROWING]: [
    'Kansas', 'Kansas State', 'UCF', 'West Virginia', 'Old Dominion', 'Tulsa'
  ],
  [SportType.EQUESTRIAN]: [
    'Baylor', 'Oklahoma State', 'TCU', 'Fresno'
  ]
};

// Helper function to get institutions that sponsor a specific sport
export const getSportSponsors = (sportType: SportType): string[] => {
  return sportSponsorship[sportType] || [];
};

// Helper function to check if an institution sponsors a specific sport
export const doesInstitutionSponsorSport = (institution: string, sportType: SportType): boolean => {
  return sportSponsorship[sportType]?.includes(institution) || false;
};

// Define which sports have regular season scheduling
export const sportsWithRegularSeason = [
  SportType.FOOTBALL,
  SportType.MENS_BASKETBALL,
  SportType.WOMENS_BASKETBALL,
  SportType.BASEBALL,
  SportType.SOFTBALL,
  SportType.VOLLEYBALL,
  SportType.SOCCER,
  SportType.MENS_TENNIS,
  SportType.WOMENS_TENNIS,
  SportType.GYMNASTICS,
  SportType.WRESTLING,
  SportType.LACROSSE
];

// Helper function to check if a sport has regular season scheduling
export const hasRegularSeasonScheduling = (sportType: SportType): boolean => {
  return sportsWithRegularSeason.includes(sportType);
};

// Define configurations for each sport
const sportConfigurations = {
  [SportType.FOOTBALL]: {
    name: 'Football',
    icon: 'sports_football',
    color: '#8C1D40',
    defaultGameDuration: 180,
    minRestDays: 5,
    recommendedRestDays: 7,
    typicalSeasonLength: 9,  // 9-week period for conference games
    defaultGamesPerTeam: 9,  // 9 conference games per team
    maxGamesPerWeek: 1,
    allowDoubleHeaders: false,
    requireHomeAwayBalance: true,
    maxConsecutiveHomeGames: 3,
    maxConsecutiveAwayGames: 2, // Core principle: No more than 2 consecutive road games
    venueTypes: ['Stadium', 'Field'],
    requiresSpecializedVenues: true,
    calendarViewEnabled: true,
    matrixViewEnabled: true,
    bracketViewEnabled: false,
    regularSeasonScheduling: true,
    defaultConstraints: [
      {
        name: 'No More Than 2 Consecutive Road Games',
        description: 'No school plays more than two consecutive road Conference games',
        defaultPriority: 5,
        category: 'Core'
      },
      {
        name: 'No 4-of-5 Road Games',
        description: 'No school plays four-of-five Conference games on the road',
        defaultPriority: 5,
        category: 'Core'
      },
      {
        name: 'Limit Open Week Advantage',
        description: 'No school plays a Conference team coming off an open week more than twice',
        defaultPriority: 5,
        category: 'Core'
      },
      {
        name: 'No Double Back-to-Back Road Games',
        description: 'No school plays two sets of back-to-back Conference Road games in a season',
        defaultPriority: 5,
        category: 'Core'
      },
      {
        name: 'Thursday Game Recovery',
        description: 'Equal recovery period for teams playing in Thursday games',
        defaultPriority: 5,
        category: 'Core'
      },
      {
        name: 'Home Game Distribution',
        description: 'At least one of the first two games and one of the last two games as home games',
        defaultPriority: 4,
        category: 'Soft'
      },
      {
        name: 'Avoid 3 Weeks Without Home Game',
        description: 'Avoid institutions playing three straight weeks without a home game on campus',
        defaultPriority: 4,
        category: 'Soft'
      },
      {
        name: 'Avoid Away-Bye-Away',
        description: 'Avoid the away-bye-away scenario unless a Thursday appearance is involved',
        defaultPriority: 4,
        category: 'Soft'
      },
      {
        name: 'Time Zone Consideration',
        description: 'Consider crossing multiple time zones in game sequencing',
        defaultPriority: 3,
        category: 'Soft'
      },
      {
        name: 'Media Rights Obligations',
        description: 'Meet contractual obligations for ABC/ESPN and FOX telecasts',
        defaultPriority: 5,
        category: 'Media'
      }
    ],
    schedulingParameters: {
      conferenceFormat: 'Nine-Game Schedule',
      matchCount: 9,
      weekCount: 9,
      byeWeeks: 1,
      typicalMatchDays: ['Saturday'],
      specialMatchDays: {
        'Weeknight': ['Thursday']
      },
      seasonDates: {
        '2024-25': {
          conferencePlayStart: '2024-09-14',
          conferencePlayEnd: '2024-11-30', // Thanksgiving Saturday
          championshipStart: '2024-12-07',
          championshipEnd: '2024-12-07'
        },
        '2025-26': {
          conferencePlayStart: '2025-09-13',
          conferencePlayEnd: '2025-11-29', // Thanksgiving Saturday
          championshipStart: '2025-12-06',
          championshipEnd: '2025-12-06'
        }
      }
    }
  },
  
  [SportType.MENS_BASKETBALL]: {
    name: 'Men\'s Basketball',
    icon: 'sports_basketball',
    color: '#FF9800',
    defaultGameDuration: 150,
    minRestDays: 2,
    recommendedRestDays: 3,
    typicalSeasonLength: 10,
    defaultGamesPerTeam: 18,
    maxGamesPerWeek: 2,
    allowDoubleHeaders: false,
    requireHomeAwayBalance: true,
    maxConsecutiveHomeGames: 3,
    maxConsecutiveAwayGames: 3,
    venueTypes: ['Arena'],
    requiresSpecializedVenues: true,
    calendarViewEnabled: true,
    matrixViewEnabled: true,
    bracketViewEnabled: true,
    isOutdoorSport: false,
    hasIndoorBackup: false,
    regularSeasonScheduling: true,
    defaultConstraints: []
  }
} as Partial<Record<SportType, SportConfig>>;

// Helper function to get sport ID by type
export const getSportTypeById = (sportId: number): SportType => {
  const sportTypes = Object.values(SportType);
  if (sportId < 1 || sportId > sportTypes.length) {
    throw new Error(`Invalid sport ID: ${sportId}`);
  }
  return sportTypes[sportId - 1];
};

// Export functions to get sport configurations
export const getSportConfig = (sportType: SportType): SportConfig => {
  return sportConfigurations[sportType] || {
    name: 'Unknown Sport',
    icon: 'sports',
    color: '#999999',
    defaultGameDuration: 120,
    minRestDays: 1,
    recommendedRestDays: 2,
    typicalSeasonLength: 8,
    defaultGamesPerTeam: 8,
    maxGamesPerWeek: 1,
    allowDoubleHeaders: false,
    requireHomeAwayBalance: true,
    maxConsecutiveHomeGames: 2,
    maxConsecutiveAwayGames: 2,
    venueTypes: ['Generic'],
    requiresSpecializedVenues: false,
    calendarViewEnabled: true,
    matrixViewEnabled: true,
    bracketViewEnabled: false,
    defaultConstraints: []
  };
};
