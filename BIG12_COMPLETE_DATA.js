/**
 * ⚠️  CRITICAL: AI AGENTS READ THIS FIRST ⚠️
 * 
 * BIG 12 COMPLETE HARDCODED DATA - FLEXTIME/COMPASS
 * COMPREHENSIVE DATABASE FOR ALL BIG 12 CONFERENCE MEMBERS AND AFFILIATES
 * 
 * 🔑 MANDATORY ID PATTERNS - DO NOT MODIFY:
 * - team_id = school_id + zero-padded sport_id (Format: SSSPP)
 * - venue_id = school_id + venue_type (Format: SSVV)
 * 
 * 🏫 SCHOOL ID RANGES - HARDCODED AND IMMUTABLE:
 * - School IDs 1-16: Big 12 Conference Members (FULL MEMBERS)
 * - School IDs 17-33: Big 12 Affiliate Members (SPORT-SPECIFIC)
 * 
 * ⚠️  AI AGENTS: NEVER ALTER THESE IDS OR PATTERNS - THEY ARE FOUNDATIONAL
 */

// ========================================
// 🏆 SPORT DEFINITIONS (FLEXTIME MANAGED) 
// ⚠️  AI AGENTS: THESE 12 SPORTS ARE THE CORE OF FLEXTIME
// 🚨 NEVER CHANGE THESE SPORT IDs - THEY ARE HARDCODED EVERYWHERE
// ========================================
export const SPORTS = {
  1: { id: 1, code: 'BSB', name: 'Baseball', gender: 'M', season: 'spring', teams: 14 },
  2: { id: 2, code: 'MBB', name: "Men's Basketball", gender: 'M', season: 'winter', teams: 16 },
  3: { id: 3, code: 'WBB', name: "Women's Basketball", gender: 'W', season: 'winter', teams: 16 },
  8: { id: 8, code: 'FB', name: 'Football', gender: 'M', season: 'fall', teams: 16 },
  12: { id: 12, code: 'GYM', name: 'Gymnastics', gender: 'W', season: 'winter', teams: 7 },
  13: { id: 13, code: 'LAX', name: 'Lacrosse', gender: 'W', season: 'spring', teams: 6 },
  14: { id: 14, code: 'SOC', name: 'Soccer', gender: 'W', season: 'fall', teams: 16 },
  15: { id: 15, code: 'SB', name: 'Softball', gender: 'W', season: 'spring', teams: 11 },
  18: { id: 18, code: 'MTN', name: "Men's Tennis", gender: 'M', season: 'spring', teams: 9 },
  19: { id: 19, code: 'WTN', name: "Women's Tennis", gender: 'W', season: 'spring', teams: 16 },
  24: { id: 24, code: 'VB', name: 'Volleyball', gender: 'W', season: 'fall', teams: 15 },
  25: { id: 25, code: 'WRE', name: 'Wrestling', gender: 'M', season: 'winter', teams: 14 }
};

// ========================================
// 🏟️  VENUE TYPES - CRITICAL MAPPING DATA
// ⚠️  AI AGENTS: VENUE IDs USE THESE TYPE CODES
// 🚨 NEVER CHANGE THESE VENUE_ID NUMBERS - THEY ARE HARDCODED EVERYWHERE
// ========================================
export const VENUE_TYPES = {
  1: { id: 1, name: 'Football Stadium', sport_codes: ['FB'] },
  2: { id: 2, name: 'Arena/Gymnasium', sport_codes: ['MBB', 'WBB', 'VB', 'WRE', 'GYM'] },
  3: { id: 3, name: 'Baseball Complex', sport_codes: ['BSB'] },
  4: { id: 4, name: 'Softball Complex', sport_codes: ['SB'] },
  5: { id: 5, name: 'Soccer Field', sport_codes: ['SOC', 'LAX'] },
  7: { id: 7, name: 'Tennis Complex', sport_codes: ['MTN', 'WTN'] }
};

// ========================================
// 🏫 BIG 12 CONFERENCE MEMBERS (SCHOOL IDs 1-16)
// ⚠️  AI AGENTS: THESE ARE THE CORE 16 FULL MEMBER SCHOOLS
// 🚨 NEVER CHANGE THESE SCHOOL_ID NUMBERS - THEY ARE HARDCODED EVERYWHERE
// ========================================
export const BIG12_SCHOOLS = {
  1: {
    school_id: 1,
    school: 'University of Arizona',
    school_abbreviation: 'ARIZ',
    short_display: 'Arizona',
    preferred_school_name: 'Arizona',
    location: 'Tucson, AZ',
    mascot: 'Wildcats',
    primary_color: '#CC0033',
    secondary_color: '#003366',
    website: 'https://arizonawildcats.com',
    conference_status: 'full_member',
    joining_date: '2024-08-02'
  },
  2: {
    school_id: 2,
    school: 'Arizona State University',
    school_abbreviation: 'ASU',
    short_display: 'Arizona State',
    preferred_school_name: 'Arizona State',
    location: 'Tempe, AZ',
    mascot: 'Sun Devils',
    primary_color: '#8C1538',
    secondary_color: '#FFC627',
    website: 'https://thesundevils.com',
    conference_status: 'full_member',
    joining_date: '2024-08-02'
  },
  3: {
    school_id: 3,
    school: 'Baylor University',
    school_abbreviation: 'BAY',
    short_display: 'Baylor',
    preferred_school_name: 'Baylor',
    location: 'Waco, TX',
    mascot: 'Bears',
    primary_color: '#003015',
    secondary_color: '#FFB81C',
    website: 'https://baylorbears.com',
    conference_status: 'full_member',
    founding_member: true
  },
  4: {
    school_id: 4,
    school: 'Brigham Young University',
    school_abbreviation: 'BYU',
    short_display: 'BYU',
    preferred_school_name: 'BYU',
    location: 'Provo, UT',
    mascot: 'Cougars',
    primary_color: '#002E5D',
    secondary_color: '#FFFFFF',
    website: 'https://byucougars.com',
    conference_status: 'full_member',
    joining_date: '2023-07-01'
  },
  5: {
    school_id: 5,
    school: 'University of Central Florida',
    school_abbreviation: 'UCF',
    short_display: 'UCF',
    preferred_school_name: 'UCF',
    location: 'Orlando, FL',
    mascot: 'Knights',
    primary_color: '#000000',
    secondary_color: '#FFC904',
    website: 'https://ucfknights.com',
    conference_status: 'full_member',
    joining_date: '2023-09-01'
  },
  6: {
    school_id: 6,
    school: 'University of Cincinnati',
    school_abbreviation: 'CIN',
    short_display: 'Cincinnati',
    preferred_school_name: 'Cincinnati',
    location: 'Cincinnati, OH',
    mascot: 'Bearcats',
    primary_color: '#E00122',
    secondary_color: '#000000',
    website: 'https://gobearcats.com',
    conference_status: 'full_member',
    joining_date: '2023-09-01'
  },
  7: {
    school_id: 7,
    school: 'University of Colorado',
    school_abbreviation: 'COL',
    short_display: 'Colorado',
    preferred_school_name: 'Colorado',
    location: 'Boulder, CO',
    mascot: 'Buffaloes',
    primary_color: '#CFB87C',
    secondary_color: '#000000',
    website: 'https://cubuffs.com',
    conference_status: 'full_member',
    joining_date: '2024-08-02'
  },
  8: {
    school_id: 8,
    school: 'University of Houston',
    school_abbreviation: 'HOU',
    short_display: 'Houston',
    preferred_school_name: 'Houston',
    location: 'Houston, TX',
    mascot: 'Cougars',
    primary_color: '#C8102E',
    secondary_color: '#FFFFFF',
    website: 'https://uhcougars.com',
    conference_status: 'full_member',
    joining_date: '2023-09-01'
  },
  9: {
    school_id: 9,
    school: 'Iowa State University',
    school_abbreviation: 'ISU',
    short_display: 'Iowa State',
    preferred_school_name: 'Iowa State',
    location: 'Ames, IA',
    mascot: 'Cyclones',
    primary_color: '#C8102E',
    secondary_color: '#F1BE48',
    website: 'https://cyclones.com',
    conference_status: 'full_member',
    founding_member: true
  },
  10: {
    school_id: 10,
    school: 'University of Kansas',
    school_abbreviation: 'KU',
    short_display: 'Kansas',
    preferred_school_name: 'Kansas',
    location: 'Lawrence, KS',
    mascot: 'Jayhawks',
    primary_color: '#0051BA',
    secondary_color: '#E8000D',
    website: 'https://kuathletics.com',
    conference_status: 'full_member',
    founding_member: true
  },
  11: {
    school_id: 11,
    school: 'Kansas State University',
    school_abbreviation: 'KSU',
    short_display: 'Kansas State',
    preferred_school_name: 'K-State',
    location: 'Manhattan, KS',
    mascot: 'Wildcats',
    primary_color: '#512888',
    secondary_color: '#FFFFFF',
    website: 'https://kstatesports.com',
    conference_status: 'full_member',
    founding_member: true
  },
  12: {
    school_id: 12,
    school: 'Oklahoma State University',
    school_abbreviation: 'OKST',
    short_display: 'Oklahoma State',
    preferred_school_name: 'Oklahoma State',
    location: 'Stillwater, OK',
    mascot: 'Cowboys',
    primary_color: '#FF7300',
    secondary_color: '#000000',
    website: 'https://okstate.com',
    conference_status: 'full_member',
    founding_member: true
  },
  13: {
    school_id: 13,
    school: 'Texas Christian University',
    school_abbreviation: 'TCU',
    short_display: 'TCU',
    preferred_school_name: 'TCU',
    location: 'Fort Worth, TX',
    mascot: 'Horned Frogs',
    primary_color: '#4D1979',
    secondary_color: '#A3A3A3',
    website: 'https://gofrogs.com',
    conference_status: 'full_member',
    joining_date: '2012-07-01'
  },
  14: {
    school_id: 14,
    school: 'Texas Tech University',
    school_abbreviation: 'TTU',
    short_display: 'Texas Tech',
    preferred_school_name: 'Texas Tech',
    location: 'Lubbock, TX',
    mascot: 'Red Raiders',
    primary_color: '#CC0000',
    secondary_color: '#000000',
    website: 'https://texastech.com',
    conference_status: 'full_member',
    founding_member: true
  },
  15: {
    school_id: 15,
    school: 'University of Utah',
    school_abbreviation: 'UTAH',
    short_display: 'Utah',
    preferred_school_name: 'Utah',
    location: 'Salt Lake City, UT',
    mascot: 'Utes',
    primary_color: '#CC0000',
    secondary_color: '#000000',
    website: 'https://utahutes.com',
    conference_status: 'full_member',
    joining_date: '2024-08-02'
  },
  16: {
    school_id: 16,
    school: 'West Virginia University',
    school_abbreviation: 'WVU',
    short_display: 'West Virginia',
    preferred_school_name: 'West Virginia',
    location: 'Morgantown, WV',
    mascot: 'Mountaineers',
    primary_color: '#002855',
    secondary_color: '#EAAA00',
    website: 'https://wvusports.com',
    conference_status: 'full_member',
    joining_date: '2012-07-01'
  }
};

// ========================================
// 🎯 BIG 12 AFFILIATE MEMBERS (SCHOOL IDs 17-33)
// ⚠️  AI AGENTS: THESE ARE SPORT-SPECIFIC AFFILIATE MEMBERS
// 🚨 CRITICAL: IDs 17-33 ARE RESERVED FOR AFFILIATES ONLY
// ========================================
// 🚨 NEVER CHANGE THESE SCHOOL_ID NUMBERS - THEY ARE HARDCODED EVERYWHERE
// ========================================
export const BIG12_AFFILIATES = {
  17: {
    school_id: 17,
    school: 'United States Air Force Academy',
    school_abbreviation: 'AF',
    short_display: 'Air Force',
    preferred_school_name: 'Air Force',
    location: 'Colorado Springs, CO',
    mascot: 'Falcons',
    primary_color: '#003087',
    secondary_color: '#8A8B8C',
    website: 'https://goairforcefalcons.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  18: {
    school_id: 18,
    school: 'California Baptist University',
    school_abbreviation: 'CBU',
    short_display: 'Cal Baptist',
    preferred_school_name: 'Cal Baptist',
    location: 'Riverside, CA',
    mascot: 'Lancers',
    primary_color: '#003087',
    secondary_color: '#FDB515',
    website: 'https://cbulancers.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  19: {
    school_id: 19,
    school: 'University of Denver',
    school_abbreviation: 'DEN',
    short_display: 'Denver',
    preferred_school_name: 'Denver',
    location: 'Denver, CO',
    mascot: 'Pioneers',
    primary_color: '#864142',
    secondary_color: '#FFC726',
    website: 'https://denverpioneers.com',
    conference_status: 'gymnastics_affiliate',
    sports: ['GYM']
  },
  20: {
    school_id: 20,
    school: 'University of Florida',
    school_abbreviation: 'UF',
    short_display: 'Florida',
    preferred_school_name: 'Florida',
    location: 'Gainesville, FL',
    mascot: 'Gators',
    primary_color: '#0021A5',
    secondary_color: '#FA4616',
    website: 'https://floridagators.com',
    conference_status: 'lacrosse_affiliate',
    sports: ['LAX']
  },
  21: {
    school_id: 21,
    school: 'Fresno State University',
    school_abbreviation: 'FRES',
    short_display: 'Fresno',
    preferred_school_name: 'Fresno',
    location: 'Fresno, CA',
    mascot: 'Bulldogs',
    primary_color: '#CC0033',
    secondary_color: '#003594',
    website: 'https://gobulldogs.com',
    conference_status: 'equestrian_affiliate',
    sports: ['EQ']
  },
  22: {
    school_id: 22,
    school: 'University of Missouri',
    school_abbreviation: 'MIZ',
    short_display: 'Mizzou',
    preferred_school_name: 'Missouri',
    location: 'Columbia, MO',
    mascot: 'Tigers',
    primary_color: '#F1B82D',
    secondary_color: '#000000',
    website: 'https://mutigers.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  23: {
    school_id: 23,
    school: 'North Dakota State University',
    school_abbreviation: 'NDSU',
    short_display: 'North Dakota St',
    preferred_school_name: 'North Dakota St',
    location: 'Fargo, ND',
    mascot: 'Bison',
    primary_color: '#009639',
    secondary_color: '#FFC72C',
    website: 'https://gobison.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  24: {
    school_id: 24,
    school: 'University of Northern Colorado',
    school_abbreviation: 'UNC',
    short_display: 'Northern Colorado',
    preferred_school_name: 'Northern Colorado',
    location: 'Greeley, CO',
    mascot: 'Bears',
    primary_color: '#003087',
    secondary_color: '#FFC72C',
    website: 'https://uncbears.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  25: {
    school_id: 25,
    school: 'University of Northern Iowa',
    school_abbreviation: 'UNI',
    short_display: 'Northern Iowa',
    preferred_school_name: 'Northern Iowa',
    location: 'Cedar Falls, IA',
    mascot: 'Panthers',
    primary_color: '#663399',
    secondary_color: '#FFCC33',
    website: 'https://unipanthers.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  26: {
    school_id: 26,
    school: 'Old Dominion University',
    school_abbreviation: 'ODU',
    short_display: 'Old Dominion',
    preferred_school_name: 'Old Dominion',
    location: 'Norfolk, VA',
    mascot: 'Monarchs',
    primary_color: '#003087',
    secondary_color: '#8A8B8C',
    website: 'https://odusports.com',
    conference_status: 'rowing_affiliate',
    sports: ['ROW']
  },
  27: {
    school_id: 27,
    school: 'University of Oklahoma',
    school_abbreviation: 'OU',
    short_display: 'Oklahoma',
    preferred_school_name: 'Oklahoma',
    location: 'Norman, OK',
    mascot: 'Sooners',
    primary_color: '#841617',
    secondary_color: '#FDF8F0',
    website: 'https://soonersports.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  28: {
    school_id: 28,
    school: 'San Diego State University',
    school_abbreviation: 'SDGST',
    short_display: 'San Diego State',
    preferred_school_name: 'San Diego State',
    location: 'San Diego, CA',
    mascot: 'Aztecs',
    primary_color: '#BA0C2F',
    secondary_color: '#000000',
    website: 'https://goaztecs.com',
    conference_status: 'lacrosse_affiliate',
    sports: ['LAX']
  },
  29: {
    school_id: 29,
    school: 'South Dakota State University',
    school_abbreviation: 'SDSU',
    short_display: 'South Dakota State',
    preferred_school_name: 'South Dakota State',
    location: 'Brookings, SD',
    mascot: 'Jackrabbits',
    primary_color: '#003594',
    secondary_color: '#FFCC33',
    website: 'https://gojacks.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  30: {
    school_id: 30,
    school: 'University of Tulsa',
    school_abbreviation: 'TULSA',
    short_display: 'Tulsa',
    preferred_school_name: 'Tulsa',
    location: 'Tulsa, OK',
    mascot: 'Golden Hurricane',
    primary_color: '#003087',
    secondary_color: '#FFC72C',
    website: 'https://tulsahurricane.com',
    conference_status: 'rowing_affiliate',
    sports: ['ROW']
  },
  31: {
    school_id: 31,
    school: 'University of California, Davis',
    school_abbreviation: 'UCD',
    short_display: 'UC Davis',
    preferred_school_name: 'UC Davis',
    location: 'Davis, CA',
    mascot: 'Aggies',
    primary_color: '#022851',
    secondary_color: '#FFBF00',
    website: 'https://ucdavisaggies.com',
    conference_status: 'lacrosse_affiliate',
    sports: ['LAX']
  },
  32: {
    school_id: 32,
    school: 'Utah Valley University',
    school_abbreviation: 'UVU',
    short_display: 'Utah Valley',
    preferred_school_name: 'Utah Valley',
    location: 'Orem, UT',
    mascot: 'Wolverines',
    primary_color: '#165C34',
    secondary_color: '#FFFFFF',
    website: 'https://gouvu.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  },
  33: {
    school_id: 33,
    school: 'University of Wyoming',
    school_abbreviation: 'WYO',
    short_display: 'Wyoming',
    preferred_school_name: 'Wyoming',
    location: 'Laramie, WY',
    mascot: 'Cowboys',
    primary_color: '#492F24',
    secondary_color: '#FFC72C',
    website: 'https://gowyo.com',
    conference_status: 'wrestling_affiliate',
    sports: ['WRE']
  }
};

// ========================================
// 🔧 TEAM GENERATION FUNCTIONS
// ⚠️  AI AGENTS: USE THESE FUNCTIONS FOR ID GENERATION
// 🚨 NEVER CREATE IDs MANUALLY - ALWAYS USE THESE FUNCTIONS
// ========================================

/**
 * ⚠️  AI AGENTS: MANDATORY FUNCTION FOR TEAM ID GENERATION
 * Generate team ID using pattern: school_id + zero-padded sport_id
 * @param {number} schoolId 
 * @param {number} sportId 
 * @returns {number} team_id
 */
export function generateTeamId(schoolId, sportId) {
  return parseInt(`${schoolId}${sportId.toString().padStart(2, '0')}`);
}

/**
 * ⚠️  AI AGENTS: MANDATORY FUNCTION FOR VENUE ID GENERATION
 * Generate venue ID using pattern: school_id + venue_type
 * @param {number} schoolId 
 * @param {number} venueType 
 * @returns {number} venue_id
 */
export function generateVenueId(schoolId, venueType) {
  return parseInt(`${schoolId.toString().padStart(2, '0')}${venueType.toString().padStart(2, '0')}`);
}

/**
 * ⚠️  AI AGENTS: USE THIS TO GENERATE ALL BIG 12 TEAMS
 * Generate all teams for Big 12 Conference members
 * @returns {Array} Complete team data with proper IDs
 */
export function generateBig12Teams() {
  const teams = [];
  
  // ⚠️  AI AGENTS: DO NOT MODIFY - SPORTS PARTICIPATION BY SCHOOL (BASED ON ACTUAL BIG 12 DATA)
  const schoolSports = {
    1: [1, 2, 3, 8, 12, 14, 15, 18, 19, 24], // Arizona (+ Gymnastics)
    2: [1, 2, 3, 8, 12, 13, 14, 15, 18, 19, 24, 25], // Arizona State (+ Gymnastics, Lacrosse, Wrestling)
    3: [1, 2, 3, 8, 14, 15, 18, 19, 24], // Baylor
    4: [1, 2, 3, 8, 12, 14, 15, 18, 19, 24], // BYU (+ Gymnastics)
    5: [1, 2, 3, 8, 14, 15, 18, 19, 24], // UCF
    6: [2, 3, 8, 13, 14, 24], // Cincinnati (+ Lacrosse, no baseball, softball, tennis)
    7: [2, 3, 8, 13, 14, 24], // Colorado (+ Lacrosse)
    8: [1, 2, 3, 8, 14, 15, 24], // Houston
    9: [2, 3, 8, 12, 14, 15, 24, 25], // Iowa State (+ Gymnastics)
    10: [1, 2, 3, 8, 14, 24], // Kansas
    11: [1, 2, 3, 8, 14, 24], // Kansas State
    12: [1, 2, 3, 8, 14, 15, 18, 19, 24, 25], // Oklahoma State
    13: [1, 2, 3, 8, 14, 15, 18, 19, 24], // TCU
    14: [1, 2, 3, 8, 14, 15, 18, 19, 24], // Texas Tech
    15: [1, 2, 3, 8, 12, 14, 15, 18, 19, 24], // Utah (+ Gymnastics)
    16: [2, 3, 8, 12, 14, 24, 25] // West Virginia (+ Gymnastics)
  };

  // Process full member schools
  Object.entries(schoolSports).forEach(([schoolId, sportIds]) => {
    const school = BIG12_SCHOOLS[parseInt(schoolId)];
    
    sportIds.forEach(sportId => {
      const sport = SPORTS[sportId];
      const teamId = generateTeamId(parseInt(schoolId), sportId);
      
      teams.push({
        team_id: teamId,
        name: `${school.short_display} ${school.mascot}`,
        mascot: school.mascot,
        school_id: parseInt(schoolId),
        sport_id: sportId,
        abbreviation: `${school.school_abbreviation}-${sport.code}`,
        school_abbreviation: school.school_abbreviation,
        primary_color: school.primary_color,
        secondary_color: school.secondary_color,
        sport_name: sport.name,
        sport_code: sport.code,
        school_name: school.school,
        school_short: school.short_display
      });
    });
  });

  // ⚠️  AI AGENTS: PROCESS AFFILIATE MEMBERS FOR THEIR SPECIFIC SPORTS
  // Process affiliate schools for their specific sports
  Object.entries(BIG12_AFFILIATES).forEach(([schoolId, school]) => {
    // Get sports for this affiliate from their sports array
    const sportCodes = school.sports || [];
    
    sportCodes.forEach(sportCode => {
      // Find the sport ID from the code
      const sportEntry = Object.entries(SPORTS).find(([id, sport]) => sport.code === sportCode);
      if (!sportEntry) return;
      
      const sportId = parseInt(sportEntry[0]);
      const sport = sportEntry[1];
      const teamId = generateTeamId(parseInt(schoolId), sportId);
      
      teams.push({
        team_id: teamId,
        name: `${school.short_display} ${school.mascot}`,
        mascot: school.mascot,
        school_id: parseInt(schoolId),
        sport_id: sportId,
        abbreviation: `${school.school_abbreviation}-${sport.code}`,
        school_abbreviation: school.school_abbreviation,
        primary_color: school.primary_color,
        secondary_color: school.secondary_color,
        sport_name: sport.name,
        sport_code: sport.code,
        school_name: school.school,
        school_short: school.short_display,
        conference_status: school.conference_status // Track affiliate status
      });
    });
  });

  return teams;
}

/**
 * ⚠️  AI AGENTS: USE THIS TO GENERATE ALL BIG 12 VENUES
 * Generate all venues for Big 12 Conference members
 * @returns {Array} Complete venue data with proper IDs
 */
export function generateBig12Venues() {
  const venues = [];
  
  // ⚠️  AI AGENTS: DO NOT MODIFY - VENUE DATA BY SCHOOL (ACTUAL STADIUM/ARENA NAMES)
  const schoolVenues = {
    1: { // Arizona
      1: { name: 'Arizona Stadium', capacity: 57000, city: 'Tucson', state: 'AZ' },
      2: { name: 'McKale Center', capacity: 14644, city: 'Tucson', state: 'AZ' },
      3: { name: 'Hi Corbett Field', capacity: 4000, city: 'Tucson', state: 'AZ' },
      4: { name: 'Rita Hillenbrand Memorial Stadium', capacity: 1500, city: 'Tucson', state: 'AZ' },
      5: { name: 'Murphey Family Soccer Stadium', capacity: 3000, city: 'Tucson', state: 'AZ' },
      7: { name: 'LaNelle Robson Tennis Center', capacity: 2000, city: 'Tucson', state: 'AZ' }
    },
    2: { // Arizona State
      1: { name: 'Mountain America Stadium', capacity: 53000, city: 'Tempe', state: 'AZ' },
      2: { name: 'Desert Financial Arena', capacity: 14198, city: 'Tempe', state: 'AZ' },
      3: { name: 'Phoenix Municipal Stadium', capacity: 8500, city: 'Phoenix', state: 'AZ' },
      4: { name: 'Farrington Stadium', capacity: 1000, city: 'Tempe', state: 'AZ' },
      5: { name: 'Sun Devil Soccer Stadium', capacity: 1500, city: 'Tempe', state: 'AZ' },
      7: { name: 'Whiteman Tennis Center', capacity: 1000, city: 'Tempe', state: 'AZ' }
    },
    3: { // Baylor
      1: { name: 'McLane Stadium', capacity: 45000, city: 'Waco', state: 'TX' },
      2: { name: 'Ferrell Center', capacity: 10284, city: 'Waco', state: 'TX' },
      3: { name: 'Baylor Ballpark', capacity: 5000, city: 'Waco', state: 'TX' },
      4: { name: 'Getterman Stadium', capacity: 1200, city: 'Waco', state: 'TX' },
      5: { name: 'Betty Lou Mays Field', capacity: 1500, city: 'Waco', state: 'TX' },
      7: { name: 'Hurd Tennis Center', capacity: 1500, city: 'Waco', state: 'TX' }
    },
    4: { // BYU
      1: { name: 'LaVell Edwards Stadium', capacity: 63000, city: 'Provo', state: 'UT' },
      2: { name: 'Marriott Center', capacity: 22700, city: 'Provo', state: 'UT' },
      3: { name: 'Larry H. Miller Field', capacity: 2500, city: 'Provo', state: 'UT' },
      4: { name: 'Gail Miller Field', capacity: 1500, city: 'Provo', state: 'UT' },
      5: { name: 'South Field', capacity: 2000, city: 'Provo', state: 'UT' },
      7: { name: 'Indoor Tennis Courts', capacity: 500, city: 'Provo', state: 'UT' }
    },
    5: { // UCF
      1: { name: 'FBC Mortgage Stadium', capacity: 45000, city: 'Orlando', state: 'FL' },
      2: { name: 'Addition Financial Arena', capacity: 10000, city: 'Orlando', state: 'FL' },
      3: { name: 'John Euliano Park', capacity: 2500, city: 'Orlando', state: 'FL' },
      4: { name: 'UCF Softball Complex', capacity: 1000, city: 'Orlando', state: 'FL' },
      5: { name: 'UCF Soccer and Track Stadium', capacity: 2000, city: 'Orlando', state: 'FL' },
      7: { name: 'UCF Tennis Complex', capacity: 1000, city: 'Orlando', state: 'FL' }
    },
    6: { // Cincinnati
      1: { name: 'Nippert Stadium', capacity: 40000, city: 'Cincinnati', state: 'OH' },
      2: { name: 'Fifth Third Arena', capacity: 12000, city: 'Cincinnati', state: 'OH' },
      5: { name: 'Gettler Stadium', capacity: 3000, city: 'Cincinnati', state: 'OH' }
    },
    7: { // Colorado
      1: { name: 'Folsom Field', capacity: 50000, city: 'Boulder', state: 'CO' },
      2: { name: 'CU Events Center', capacity: 11064, city: 'Boulder', state: 'CO' },
      5: { name: 'Prentup Field', capacity: 2500, city: 'Boulder', state: 'CO' }
    },
    8: { // Houston
      1: { name: 'TDECU Stadium', capacity: 40000, city: 'Houston', state: 'TX' },
      2: { name: 'Fertitta Center', capacity: 7100, city: 'Houston', state: 'TX' },
      3: { name: 'Schroeder Park', capacity: 3500, city: 'Houston', state: 'TX' },
      4: { name: 'Cougar Softball Stadium', capacity: 1500, city: 'Houston', state: 'TX' }
    },
    9: { // Iowa State
      1: { name: 'Jack Trice Stadium', capacity: 61500, city: 'Ames', state: 'IA' },
      2: { name: 'Hilton Coliseum', capacity: 14384, city: 'Ames', state: 'IA' },
      4: { name: 'Cyclone Sports Complex', capacity: 1500, city: 'Ames', state: 'IA' },
      5: { name: 'Cyclone Sports Complex', capacity: 1000, city: 'Ames', state: 'IA' }
    },
    10: { // Kansas
      1: { name: 'David Booth Kansas Memorial Stadium', capacity: 47000, city: 'Lawrence', state: 'KS' },
      2: { name: 'Allen Fieldhouse', capacity: 16300, city: 'Lawrence', state: 'KS' },
      3: { name: 'Hoglund Ballpark', capacity: 2500, city: 'Lawrence', state: 'KS' },
      5: { name: 'Rock Chalk Park', capacity: 2500, city: 'Lawrence', state: 'KS' }
    },
    11: { // Kansas State
      1: { name: 'Bill Snyder Family Stadium', capacity: 50000, city: 'Manhattan', state: 'KS' },
      2: { name: 'Bramlage Coliseum', capacity: 12528, city: 'Manhattan', state: 'KS' },
      3: { name: 'Tointon Family Stadium', capacity: 2000, city: 'Manhattan', state: 'KS' },
      5: { name: 'Buser Family Park', capacity: 1500, city: 'Manhattan', state: 'KS' }
    },
    12: { // Oklahoma State
      1: { name: 'Boone Pickens Stadium', capacity: 55500, city: 'Stillwater', state: 'OK' },
      2: { name: 'Gallagher-Iba Arena', capacity: 13611, city: 'Stillwater', state: 'OK' },
      3: { name: "O'Brate Stadium", capacity: 4000, city: 'Stillwater', state: 'OK' },
      4: { name: 'Cowgirl Stadium', capacity: 1500, city: 'Stillwater', state: 'OK' },
      5: { name: 'Neal Patterson Stadium', capacity: 3500, city: 'Stillwater', state: 'OK' },
      7: { name: 'Greenwood Tennis Center', capacity: 1500, city: 'Stillwater', state: 'OK' }
    },
    13: { // TCU
      1: { name: 'Amon G. Carter Stadium', capacity: 45000, city: 'Fort Worth', state: 'TX' },
      2: { name: 'Ed and Rae Schollmaier Arena', capacity: 7166, city: 'Fort Worth', state: 'TX' },
      3: { name: 'Lupton Stadium', capacity: 4500, city: 'Fort Worth', state: 'TX' },
      4: { name: 'Garvey-Rosenthal Stadium', capacity: 1500, city: 'Fort Worth', state: 'TX' },
      5: { name: 'Garvey-Rosenthal Stadium', capacity: 2000, city: 'Fort Worth', state: 'TX' },
      7: { name: 'Bayard H. Friedman Tennis Center', capacity: 3000, city: 'Fort Worth', state: 'TX' }
    },
    14: { // Texas Tech
      1: { name: 'Jones AT&T Stadium', capacity: 60000, city: 'Lubbock', state: 'TX' },
      2: { name: 'United Supermarkets Arena', capacity: 15020, city: 'Lubbock', state: 'TX' },
      3: { name: 'Dan Law Field at Rip Griffin Park', capacity: 5050, city: 'Lubbock', state: 'TX' },
      4: { name: 'Rocky Johnson Field', capacity: 1000, city: 'Lubbock', state: 'TX' },
      5: { name: 'John Walker Soccer Complex', capacity: 1500, city: 'Lubbock', state: 'TX' },
      7: { name: 'McLeod Tennis Center', capacity: 2000, city: 'Lubbock', state: 'TX' }
    },
    15: { // Utah
      1: { name: 'Rice-Eccles Stadium', capacity: 51000, city: 'Salt Lake City', state: 'UT' },
      2: { name: 'Jon M. Huntsman Center', capacity: 15000, city: 'Salt Lake City', state: 'UT' },
      3: { name: 'Smith Ballpark', capacity: 15000, city: 'Salt Lake City', state: 'UT' },
      4: { name: 'Dumke Family Softball Stadium', capacity: 1500, city: 'Salt Lake City', state: 'UT' },
      5: { name: 'Ute Soccer Field', capacity: 3000, city: 'Salt Lake City', state: 'UT' },
      7: { name: 'George S. Eccles Tennis Center', capacity: 1500, city: 'Salt Lake City', state: 'UT' }
    },
    16: { // West Virginia
      1: { name: 'Milan Puskar Stadium', capacity: 60000, city: 'Morgantown', state: 'WV' },
      2: { name: 'WVU Coliseum', capacity: 14000, city: 'Morgantown', state: 'WV' },
      5: { name: 'Dick Dlesk Soccer Stadium', capacity: 1650, city: 'Morgantown', state: 'WV' }
    },
    // Affiliate member venues (only for their specific sports)
    20: { // Florida
      5: { name: 'Donald R. Dizney Stadium', capacity: 1500, city: 'Gainesville', state: 'FL' } // Lacrosse
    },
    28: { // San Diego State
      5: { name: 'SDSU Lacrosse Field', capacity: 1000, city: 'San Diego', state: 'CA' } // Lacrosse
    },
    31: { // UC Davis
      5: { name: 'Aggie Stadium', capacity: 1000, city: 'Davis', state: 'CA' } // Lacrosse
    }
  };

  Object.entries(schoolVenues).forEach(([schoolId, venuesByType]) => {
    const school = BIG12_SCHOOLS[parseInt(schoolId)] || BIG12_AFFILIATES[parseInt(schoolId)];
    
    Object.entries(venuesByType).forEach(([venueType, venueData]) => {
      const venueId = generateVenueId(parseInt(schoolId), parseInt(venueType));
      
      venues.push({
        venue_id: venueId,
        name: venueData.name,
        city: venueData.city,
        state: venueData.state,
        capacity: venueData.capacity,
        school_id: parseInt(schoolId),
        venue_type: parseInt(venueType),
        school_name: school.school,
        school_short: school.short_display
      });
    });
  });

  return venues;
}

// ========================================
// 🏆 COMPASS RATING DATA - PERFORMANCE ANALYTICS
// ⚠️  AI AGENTS: THESE ARE OFFICIAL COMPASS SCORES FOR TOP PROGRAMS
// 🚨 DO NOT MODIFY - USED FOR SCHEDULING PRIORITY AND ANALYTICS
// ========================================
export const COMPASS_RATINGS = {
  // Football Programs (High Priority)
  108: { overall: 87, competitive: 90, operational: 85, market: 83, trajectory: 89, analytics: 86 }, // Arizona FB
  208: { overall: 88, competitive: 85, operational: 92, market: 90, trajectory: 88, analytics: 87 }, // Arizona State FB
  308: { overall: 89, competitive: 90, operational: 88, market: 85, trajectory: 92, analytics: 88 }, // Baylor FB
  408: { overall: 86, competitive: 82, operational: 88, market: 90, trajectory: 85, analytics: 84 }, // BYU FB
  508: { overall: 84, competitive: 80, operational: 86, market: 88, trajectory: 86, analytics: 82 }, // UCF FB
  608: { overall: 83, competitive: 78, operational: 85, market: 87, trajectory: 84, analytics: 81 }, // Cincinnati FB
  708: { overall: 85, competitive: 82, operational: 87, market: 86, trajectory: 87, analytics: 83 }, // Colorado FB
  808: { overall: 87, competitive: 84, operational: 89, market: 88, trajectory: 89, analytics: 85 }, // Houston FB
  908: { overall: 88, competitive: 86, operational: 90, market: 87, trajectory: 90, analytics: 87 }, // Iowa State FB
  1008: { overall: 82, competitive: 78, operational: 84, market: 85, trajectory: 82, analytics: 80 }, // Kansas FB
  1108: { overall: 86, competitive: 83, operational: 88, market: 86, trajectory: 87, analytics: 84 }, // Kansas State FB
  1208: { overall: 90, competitive: 88, operational: 92, market: 89, trajectory: 91, analytics: 89 }, // Oklahoma State FB
  1308: { overall: 91, competitive: 89, operational: 93, market: 90, trajectory: 92, analytics: 90 }, // TCU FB
  1408: { overall: 87, competitive: 84, operational: 89, market: 88, trajectory: 88, analytics: 86 }, // Texas Tech FB
  1508: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Utah FB
  1608: { overall: 85, competitive: 82, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // West Virginia FB
  
  // Men's Basketball Programs (Realistic COMPASS scale - 100 reserved for dynasties)
  102: { overall: 86, competitive: 88, operational: 84, market: 82, trajectory: 87, analytics: 85 }, // Arizona MBB - Strong recent performance
  202: { overall: 79, competitive: 75, operational: 82, market: 81, trajectory: 80, analytics: 77 }, // Arizona State MBB
  302: { overall: 88, competitive: 90, operational: 86, market: 85, trajectory: 89, analytics: 87 }, // Baylor MBB - Consistent top program
  402: { overall: 83, competitive: 81, operational: 85, market: 84, trajectory: 83, analytics: 82 }, // BYU MBB - Solid program
  502: { overall: 77, competitive: 73, operational: 79, market: 80, trajectory: 78, analytics: 76 }, // UCF MBB
  602: { overall: 80, competitive: 77, operational: 82, market: 81, trajectory: 81, analytics: 78 }, // Cincinnati MBB
  702: { overall: 78, competitive: 74, operational: 80, market: 79, trajectory: 79, analytics: 77 }, // Colorado MBB
  802: { overall: 91, competitive: 93, operational: 89, market: 88, trajectory: 93, analytics: 90 }, // Houston MBB - NCAA Championship + returning players
  902: { overall: 87, competitive: 85, operational: 89, market: 84, trajectory: 88, analytics: 86 }, // Iowa State MBB - Strong recent years
  1002: { overall: 82, competitive: 80, operational: 86, market: 87, trajectory: 77, analytics: 81 }, // Kansas MBB - Down years recently, legacy brand
  1102: { overall: 81, competitive: 78, operational: 83, market: 81, trajectory: 82, analytics: 79 }, // Kansas State MBB
  1202: { overall: 83, competitive: 80, operational: 85, market: 83, trajectory: 84, analytics: 82 }, // Oklahoma State MBB
  1302: { overall: 82, competitive: 79, operational: 84, market: 82, trajectory: 83, analytics: 81 }, // TCU MBB
  1402: { overall: 85, competitive: 83, operational: 87, market: 84, trajectory: 86, analytics: 84 }, // Texas Tech MBB - Consistent program
  1502: { overall: 80, competitive: 77, operational: 82, market: 80, trajectory: 81, analytics: 78 }, // Utah MBB
  1602: { overall: 79, competitive: 76, operational: 81, market: 79, trajectory: 80, analytics: 77 },  // West Virginia MBB

  // Women's Basketball Programs (Realistic COMPASS scale)
  103: { overall: 84, competitive: 86, operational: 82, market: 81, trajectory: 85, analytics: 83 }, // Arizona WBB
  203: { overall: 82, competitive: 80, operational: 84, market: 82, trajectory: 83, analytics: 81 }, // Arizona State WBB
  303: { overall: 86, competitive: 88, operational: 84, market: 83, trajectory: 87, analytics: 85 }, // Baylor WBB - Consistent program
  403: { overall: 80, competitive: 78, operational: 82, market: 81, trajectory: 81, analytics: 79 }, // BYU WBB
  503: { overall: 78, competitive: 76, operational: 80, market: 79, trajectory: 79, analytics: 77 }, // UCF WBB
  603: { overall: 79, competitive: 77, operational: 81, market: 80, trajectory: 80, analytics: 78 }, // Cincinnati WBB
  703: { overall: 81, competitive: 79, operational: 83, market: 80, trajectory: 82, analytics: 80 }, // Colorado WBB
  803: { overall: 83, competitive: 81, operational: 85, market: 83, trajectory: 84, analytics: 82 }, // Houston WBB
  903: { overall: 90, competitive: 92, operational: 88, market: 87, trajectory: 91, analytics: 89 }, // Iowa State WBB - Elite program under Fennelly
  1003: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // Kansas WBB - Strong recent years
  1103: { overall: 82, competitive: 80, operational: 84, market: 81, trajectory: 83, analytics: 81 }, // Kansas State WBB
  1203: { overall: 80, competitive: 78, operational: 82, market: 80, trajectory: 81, analytics: 79 }, // Oklahoma State WBB
  1303: { overall: 81, competitive: 79, operational: 83, market: 81, trajectory: 82, analytics: 80 }, // TCU WBB
  1403: { overall: 87, competitive: 89, operational: 85, market: 84, trajectory: 88, analytics: 86 }, // Texas Tech WBB - Elite program under Gerlich
  1503: { overall: 83, competitive: 81, operational: 85, market: 82, trajectory: 84, analytics: 82 }, // Utah WBB
  1603: { overall: 79, competitive: 77, operational: 81, market: 79, trajectory: 80, analytics: 78 }, // West Virginia WBB

  // Baseball Programs (Updated with 2024-25 recency bias) 
  101: { overall: 90, competitive: 92, operational: 88, market: 87, trajectory: 91, analytics: 89 }, // Arizona BSB - Strong program
  201: { overall: 88, competitive: 90, operational: 86, market: 85, trajectory: 89, analytics: 87 }, // Arizona State BSB
  301: { overall: 88, competitive: 90, operational: 86, market: 85, trajectory: 89, analytics: 87 }, // Baylor BSB - Strong program
  401: { overall: 86, competitive: 84, operational: 88, market: 87, trajectory: 87, analytics: 85 }, // BYU BSB
  601: { overall: 84, competitive: 82, operational: 86, market: 85, trajectory: 85, analytics: 83 }, // Cincinnati BSB
  801: { overall: 87, competitive: 85, operational: 89, market: 88, trajectory: 88, analytics: 86 }, // Houston BSB
  901: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // Kansas BSB
  1001: { overall: 83, competitive: 81, operational: 85, market: 84, trajectory: 84, analytics: 82 }, // Kansas State BSB
  1201: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Oklahoma State BSB
  1301: { overall: 89, competitive: 91, operational: 87, market: 86, trajectory: 90, analytics: 88 }, // TCU BSB - Strong program
  1401: { overall: 91, competitive: 93, operational: 89, market: 88, trajectory: 92, analytics: 90 }, // Texas Tech BSB
  1501: { overall: 86, competitive: 84, operational: 88, market: 86, trajectory: 87, analytics: 85 }, // Utah BSB
  1601: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // West Virginia BSB
  501: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // UCF BSB

  // Softball Programs (Updated with 2024-25 recency bias)
  115: { overall: 91, competitive: 93, operational: 89, market: 88, trajectory: 92, analytics: 90 }, // Arizona SB - Elite program
  215: { overall: 89, competitive: 91, operational: 87, market: 86, trajectory: 90, analytics: 88 }, // Arizona State SB
  315: { overall: 92, competitive: 94, operational: 90, market: 89, trajectory: 93, analytics: 91 }, // Baylor SB - Strong program
  415: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // BYU SB
  815: { overall: 88, competitive: 86, operational: 90, market: 88, trajectory: 89, analytics: 87 }, // Houston SB
  915: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // Iowa State SB
  1015: { overall: 84, competitive: 82, operational: 86, market: 85, trajectory: 85, analytics: 83 }, // Kansas SB
  1215: { overall: 90, competitive: 92, operational: 88, market: 87, trajectory: 91, analytics: 89 }, // Oklahoma State SB - Elite program
  1415: { overall: 90, competitive: 92, operational: 88, market: 87, trajectory: 91, analytics: 89 }, // Texas Tech SB
  515: { overall: 86, competitive: 84, operational: 88, market: 87, trajectory: 87, analytics: 85 }, // UCF SB
  1515: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Utah SB

  // Soccer Programs (Updated with 2024-25 recency bias)
  114: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // Arizona SOC
  214: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // Arizona State SOC
  314: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Baylor SOC
  414: { overall: 88, competitive: 90, operational: 86, market: 85, trajectory: 89, analytics: 87 }, // BYU SOC - Strong program
  514: { overall: 84, competitive: 82, operational: 86, market: 85, trajectory: 85, analytics: 83 }, // UCF SOC
  614: { overall: 86, competitive: 84, operational: 88, market: 86, trajectory: 87, analytics: 85 }, // Cincinnati SOC
  714: { overall: 88, competitive: 86, operational: 90, market: 87, trajectory: 89, analytics: 87 }, // Colorado SOC
  814: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // Houston SOC
  914: { overall: 90, competitive: 88, operational: 92, market: 89, trajectory: 91, analytics: 89 }, // Iowa State SOC
  1014: { overall: 86, competitive: 84, operational: 88, market: 87, trajectory: 87, analytics: 85 }, // Kansas SOC
  1114: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // Kansas State SOC
  1214: { overall: 88, competitive: 86, operational: 90, market: 88, trajectory: 89, analytics: 87 }, // Oklahoma State SOC
  1314: { overall: 89, competitive: 91, operational: 87, market: 86, trajectory: 90, analytics: 88 }, // TCU SOC - Strong program
  1414: { overall: 91, competitive: 93, operational: 89, market: 88, trajectory: 92, analytics: 90 }, // Texas Tech SOC
  1514: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Utah SOC
  1614: { overall: 92, competitive: 94, operational: 90, market: 89, trajectory: 93, analytics: 91 }, // West Virginia SOC - Strong program

  // Volleyball Programs (Updated with 2024-25 recency bias)
  124: { overall: 88, competitive: 86, operational: 90, market: 87, trajectory: 89, analytics: 87 }, // Arizona VB
  224: { overall: 86, competitive: 84, operational: 88, market: 86, trajectory: 87, analytics: 85 }, // Arizona State VB
  324: { overall: 89, competitive: 91, operational: 87, market: 86, trajectory: 90, analytics: 88 }, // Baylor VB - Strong program
  424: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // BYU VB
  524: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // UCF VB
  624: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // Cincinnati VB
  724: { overall: 90, competitive: 88, operational: 92, market: 89, trajectory: 91, analytics: 89 }, // Colorado VB
  824: { overall: 86, competitive: 84, operational: 88, market: 87, trajectory: 87, analytics: 85 }, // Houston VB
  924: { overall: 88, competitive: 86, operational: 90, market: 87, trajectory: 89, analytics: 87 }, // Iowa State VB
  1024: { overall: 91, competitive: 89, operational: 93, market: 90, trajectory: 92, analytics: 90 }, // Kansas VB - Strong program
  1124: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // Kansas State VB
  1324: { overall: 92, competitive: 94, operational: 90, market: 89, trajectory: 93, analytics: 91 }, // TCU VB - Elite program
  1424: { overall: 90, competitive: 92, operational: 88, market: 87, trajectory: 91, analytics: 89 }, // Texas Tech VB - Strong program
  1524: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Utah VB
  1624: { overall: 88, competitive: 90, operational: 86, market: 85, trajectory: 89, analytics: 87 }, // West Virginia VB - Strong program

  // Wrestling Programs (Updated with 2024-25 recency bias - includes affiliates)
  225: { overall: 86, competitive: 88, operational: 84, market: 82, trajectory: 87, analytics: 85 }, // Arizona State WRE
  925: { overall: 89, competitive: 91, operational: 87, market: 86, trajectory: 90, analytics: 88 }, // Iowa State WRE - Strong program
  1225: { overall: 92, competitive: 94, operational: 90, market: 89, trajectory: 93, analytics: 91 }, // Oklahoma State WRE - Elite program
  1625: { overall: 84, competitive: 86, operational: 82, market: 80, trajectory: 85, analytics: 83 }, // West Virginia WRE
  // Affiliate members
  1725: { overall: 75, competitive: 77, operational: 73, market: 71, trajectory: 76, analytics: 74 }, // Air Force WRE
  1825: { overall: 78, competitive: 80, operational: 76, market: 74, trajectory: 79, analytics: 77 }, // Cal Baptist WRE
  1925: { overall: 91, competitive: 93, operational: 89, market: 88, trajectory: 92, analytics: 90 }, // Missouri WRE - Elite program
  2025: { overall: 83, competitive: 85, operational: 81, market: 79, trajectory: 84, analytics: 82 }, // North Dakota State WRE
  2125: { overall: 76, competitive: 78, operational: 74, market: 72, trajectory: 77, analytics: 75 }, // Northern Colorado WRE
  2225: { overall: 79, competitive: 81, operational: 77, market: 75, trajectory: 80, analytics: 78 }, // Northern Iowa WRE
  2325: { overall: 74, competitive: 76, operational: 72, market: 70, trajectory: 75, analytics: 73 }, // Oklahoma WRE
  2425: { overall: 80, competitive: 82, operational: 78, market: 76, trajectory: 81, analytics: 79 }, // South Dakota State WRE
  2525: { overall: 81, competitive: 83, operational: 79, market: 77, trajectory: 82, analytics: 80 }, // Utah Valley WRE
  2625: { overall: 79, competitive: 81, operational: 77, market: 75, trajectory: 80, analytics: 78 }, // Wyoming WRE

  // Men's Tennis Programs (Updated with 2024-25 recency bias)
  118: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // Arizona MTN
  218: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // Arizona State MTN
  318: { overall: 91, competitive: 93, operational: 89, market: 88, trajectory: 92, analytics: 90 }, // Baylor MTN - Strong program
  418: { overall: 88, competitive: 86, operational: 90, market: 88, trajectory: 89, analytics: 87 }, // BYU MTN
  1218: { overall: 86, competitive: 84, operational: 88, market: 87, trajectory: 87, analytics: 85 }, // Oklahoma State MTN
  1318: { overall: 88, competitive: 90, operational: 86, market: 85, trajectory: 89, analytics: 87 }, // TCU MTN - Strong program
  1418: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Texas Tech MTN
  518: { overall: 84, competitive: 82, operational: 86, market: 85, trajectory: 85, analytics: 83 }, // UCF MTN
  1518: { overall: 90, competitive: 88, operational: 92, market: 89, trajectory: 91, analytics: 89 }, // Utah MTN

  // Women's Tennis Programs (Updated with 2024-25 recency bias)
  119: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Arizona WTN
  219: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // Arizona State WTN
  319: { overall: 92, competitive: 94, operational: 90, market: 89, trajectory: 93, analytics: 91 }, // Baylor WTN - Elite program
  419: { overall: 88, competitive: 86, operational: 90, market: 88, trajectory: 89, analytics: 87 }, // BYU WTN
  519: { overall: 85, competitive: 83, operational: 87, market: 86, trajectory: 86, analytics: 84 }, // UCF WTN
  619: { overall: 86, competitive: 84, operational: 88, market: 86, trajectory: 87, analytics: 85 }, // Cincinnati WTN
  719: { overall: 84, competitive: 82, operational: 86, market: 85, trajectory: 85, analytics: 83 }, // Colorado WTN
  819: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }, // Houston WTN
  919: { overall: 88, competitive: 86, operational: 90, market: 87, trajectory: 89, analytics: 87 }, // Iowa State WTN
  1019: { overall: 90, competitive: 88, operational: 92, market: 89, trajectory: 91, analytics: 89 }, // Kansas WTN
  1119: { overall: 86, competitive: 84, operational: 88, market: 86, trajectory: 87, analytics: 85 }, // Kansas State WTN
  1219: { overall: 89, competitive: 87, operational: 91, market: 88, trajectory: 90, analytics: 88 }, // Oklahoma State WTN
  1319: { overall: 89, competitive: 91, operational: 87, market: 86, trajectory: 90, analytics: 88 }, // TCU WTN - Strong program
  1419: { overall: 91, competitive: 93, operational: 89, market: 88, trajectory: 92, analytics: 90 }, // Texas Tech WTN
  1519: { overall: 88, competitive: 86, operational: 90, market: 87, trajectory: 89, analytics: 87 }, // Utah WTN
  1619: { overall: 87, competitive: 85, operational: 89, market: 87, trajectory: 88, analytics: 86 }   // West Virginia WTN
};

// ========================================
// 📦 EXPORT ALL DATA - MAIN MODULE EXPORTS
// ⚠️  AI AGENTS: IMPORT FROM THIS DEFAULT EXPORT FOR ALL BIG 12 DATA
// ========================================
export default {
  SPORTS,
  VENUE_TYPES,
  BIG12_SCHOOLS,
  BIG12_AFFILIATES,
  COMPASS_RATINGS,
  generateTeamId,
  generateVenueId,
  generateBig12Teams,
  generateBig12Venues
};