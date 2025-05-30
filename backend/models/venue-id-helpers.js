/**
 * Venue ID Helper Functions
 * 
 * Provides utilities for generating and parsing venue IDs following FlexTime conventions
 */

/**
 * Generate venue ID using school-venue-type pattern
 * @param {number} schoolId - School ID (1-99)
 * @param {number} venueType - Venue type (1-99: 01=Football, 02=Arena, etc.)
 * @returns {number} Generated venue_id
 */
function generateVenueId(schoolId, venueType = 1) {
  // Format: SSVV (school + venue type)
  // 01=Football Stadium, 02=Arena, 03=Baseball, etc.
  const school = schoolId.toString().padStart(2, '0');
  const venue = venueType.toString().padStart(2, '0');
  
  return parseInt(`${school}${venue}`);
}

/**
 * Create venue-to-sport mapping for multi-sport venues
 * @param {number} venueId - Venue ID
 * @param {number[]} sportIds - Array of sport IDs that use this venue
 * @returns {object} Venue-sport mapping
 */
function createVenueSportMapping(venueId, sportIds) {
  return {
    venue_id: venueId,
    supported_sports: sportIds,
    sport_names: [] // Would be populated with actual sport names
  };
}

/**
 * Parse venue ID to extract components
 * @param {number} venueId - Venue ID to parse
 * @returns {object} Parsed components or null if invalid
 */
function parseVenueId(venueId) {
  const venueStr = venueId.toString().padStart(4, '0');
  
  // School-venue-type pattern (4 digits: SSVV)
  if (venueStr.length === 4) {
    return {
      schoolId: parseInt(venueStr.substring(0, 2)),
      venueType: parseInt(venueStr.substring(2, 4)),
      pattern: 'school-venue-type'
    };
  }
  
  // Legacy pattern (1-3 digits)
  if (venueStr.length <= 3) {
    return {
      venueId: venueId,
      pattern: 'legacy'
    };
  }
  
  return null;
}

// Venue type constants
const VENUE_TYPES = {
  FOOTBALL_STADIUM: 1,
  ARENA_GYMNASIUM: 2,     // Basketball, Gymnastics
  BASEBALL_COMPLEX: 3,    // Baseball
  SOFTBALL_COMPLEX: 4,    // Softball
  SOCCER_FIELD: 5,        // Soccer
  VOLLEYBALL_FACILITY: 6, // Volleyball
  TENNIS_COMPLEX: 7,      // Tennis
  TRACK_FIELD: 8,         // Track & Field, Cross Country
  SWIMMING_POOL: 9,       // Swimming & Diving
  GOLF_COURSE: 10         // Golf
};

/**
 * Get venue ID for a specific school and venue type
 * @param {number} schoolId - School ID 
 * @param {number} venueType - Venue type (use VENUE_TYPES constants)
 * @returns {number} Generated venue_id
 */
function getVenueIdForSchool(schoolId, venueType = VENUE_TYPES.FOOTBALL_STADIUM) {
  return generateVenueId(schoolId, venueType);
}

/**
 * Get venue ID for a team based on sport
 * @param {number} teamId - Team ID (following school_id + sport_id pattern)
 * @param {number} sportId - Sport ID to determine venue type
 * @returns {number} Generated venue_id for the team's sport
 */
function getVenueIdForTeam(teamId, sportId) {
  // Parse team_id to get school_id
  const teamStr = teamId.toString();
  if (teamStr.length < 3) return null;
  
  const schoolId = parseInt(teamStr.slice(0, -2));
  
  // Map sport to venue type
  const venueType = mapSportToVenueType(sportId);
  return generateVenueId(schoolId, venueType);
}

/**
 * Map sport ID to venue type
 * @param {number} sportId - Sport ID
 * @returns {number} Venue type
 */
function mapSportToVenueType(sportId) {
  const sportVenueMap = {
    8: VENUE_TYPES.FOOTBALL_STADIUM,     // Football
    2: VENUE_TYPES.ARENA_GYMNASIUM,      // Men's Basketball
    3: VENUE_TYPES.ARENA_GYMNASIUM,      // Women's Basketball
    11: VENUE_TYPES.ARENA_GYMNASIUM,     // Gymnastics
    1: VENUE_TYPES.BASEBALL_COMPLEX,     // Baseball
    15: VENUE_TYPES.SOFTBALL_COMPLEX,    // Softball
    14: VENUE_TYPES.SOCCER_FIELD,        // Soccer
    24: VENUE_TYPES.VOLLEYBALL_FACILITY, // Volleyball
    18: VENUE_TYPES.TENNIS_COMPLEX,      // Men's Tennis
    19: VENUE_TYPES.TENNIS_COMPLEX,      // Women's Tennis
    // Track events
    5: VENUE_TYPES.TRACK_FIELD,         // Men's Cross Country
    6: VENUE_TYPES.TRACK_FIELD,         // Women's Cross Country
    20: VENUE_TYPES.TRACK_FIELD,        // Men's Indoor Track
    21: VENUE_TYPES.TRACK_FIELD,        // Women's Indoor Track
    22: VENUE_TYPES.TRACK_FIELD,        // Men's Outdoor Track
    23: VENUE_TYPES.TRACK_FIELD,        // Women's Outdoor Track
    // Swimming & Diving
    16: VENUE_TYPES.SWIMMING_POOL,       // Men's Swimming
    17: VENUE_TYPES.SWIMMING_POOL,       // Women's Swimming
    // Golf
    9: VENUE_TYPES.GOLF_COURSE,         // Men's Golf
    10: VENUE_TYPES.GOLF_COURSE,        // Women's Golf
    // Other sports (default to arena)
    12: VENUE_TYPES.ARENA_GYMNASIUM,     // Lacrosse
    25: VENUE_TYPES.ARENA_GYMNASIUM,     // Wrestling
  };
  
  return sportVenueMap[sportId] || VENUE_TYPES.ARENA_GYMNASIUM;
}

/**
 * Examples of venue IDs for Big 12 schools
 */
const VENUE_ID_EXAMPLES = {
  // Arizona (school_id = 1)
  arizona_football_stadium: generateVenueId(1, VENUE_TYPES.FOOTBALL_STADIUM),    // 0101 = Arizona Stadium
  arizona_arena: generateVenueId(1, VENUE_TYPES.ARENA_GYMNASIUM),               // 0102 = McKale Center
  arizona_baseball_complex: generateVenueId(1, VENUE_TYPES.BASEBALL_COMPLEX),   // 0103 = Hi Corbett Field
  arizona_softball_complex: generateVenueId(1, VENUE_TYPES.SOFTBALL_COMPLEX),   // 0104 = Hillenbrand Stadium
  arizona_soccer_field: generateVenueId(1, VENUE_TYPES.SOCCER_FIELD),           // 0105 = Murphey Field
  arizona_volleyball_facility: generateVenueId(1, VENUE_TYPES.VOLLEYBALL_FACILITY), // 0106 = Bear Down Gym
  arizona_tennis_complex: generateVenueId(1, VENUE_TYPES.TENNIS_COMPLEX),       // 0107 = LaNelle Robson Tennis Center
  
  // UCF (school_id = 5)
  ucf_football_stadium: generateVenueId(5, VENUE_TYPES.FOOTBALL_STADIUM),       // 0501 = FBC Mortgage Stadium
  ucf_arena: generateVenueId(5, VENUE_TYPES.ARENA_GYMNASIUM),                  // 0502 = Addition Financial Arena
  ucf_baseball_complex: generateVenueId(5, VENUE_TYPES.BASEBALL_COMPLEX),       // 0503 = John Euliano Park
  ucf_softball_complex: generateVenueId(5, VENUE_TYPES.SOFTBALL_COMPLEX),       // 0504 = UCF Softball Complex
  ucf_soccer_field: generateVenueId(5, VENUE_TYPES.SOCCER_FIELD),               // 0505 = UCF Soccer Complex
  
  // Venue-Sport Mappings (Updated)
  arizona_sport_venues: [
    createVenueSportMapping(0102, [2, 3, 11]),       // McKale Arena: MBB, WBB, Gymnastics
    createVenueSportMapping(0101, [8]),              // Arizona Stadium: Football only
    createVenueSportMapping(0103, [1]),              // Baseball complex: Baseball only
    createVenueSportMapping(0104, [15]),             // Softball complex: Softball only
    createVenueSportMapping(0105, [14]),             // Soccer field: Soccer only
    createVenueSportMapping(0106, [24]),             // Volleyball facility: Volleyball only
    createVenueSportMapping(0107, [18, 19])          // Tennis complex: Men's & Women's Tennis
  ]
};

/**
 * Common venue type mappings by sport
 */
const SPORT_VENUE_TYPES = {
  // Indoor arena sports (may share venues)
  arena_gymnasium: [2, 3, 11, 12, 25], // Men's BB, Women's BB, Gymnastics, Lacrosse, Wrestling
  
  // Outdoor stadium sports
  football_stadium: [8], // Football only
  
  // Diamond sports (separate venues)
  baseball_complex: [1], // Baseball only
  softball_complex: [15], // Softball only
  
  // Field sports
  soccer_field: [14], // Soccer only
  volleyball_facility: [24], // Volleyball only (can be indoor or outdoor)
  
  // Court sports (may share)
  tennis_complex: [18, 19], // Men's Tennis, Women's Tennis
  
  // Track & field (share venues)
  track_facility: [5, 6, 20, 21, 22, 23], // All cross country and track events
  
  // Aquatic sports
  swimming_pool: [16, 17], // Men's & Women's Swimming & Diving
  
  // Golf (may share course)
  golf_course: [9, 10], // Men's & Women's Golf
  
  // Other sports
  equestrian_facility: [7], // Equestrian
  rowing_facility: [13], // Rowing
  beach_volleyball: [4] // Beach Volleyball (if different from indoor volleyball)
};

module.exports = {
  generateVenueId,
  parseVenueId,
  createVenueSportMapping,
  getVenueIdForSchool,
  getVenueIdForTeam,
  mapSportToVenueType,
  VENUE_TYPES,
  VENUE_ID_EXAMPLES,
  SPORT_VENUE_TYPES
};