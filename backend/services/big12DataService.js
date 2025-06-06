/**
 * Big 12 Data Service
 * 
 * Unified data service layer that properly exposes Big 12 conference data
 * from the hardcoded source to all parts of the application.
 * 
 * This service acts as the single source of truth for:
 * - Teams (with proper team_id calculation)
 * - Venues
 * - Schools
 * - Sports
 * - COMPASS ratings
 */

const BIG12_DATA = require('../../BIG12_COMPLETE_DATA');
const logger = require('../lib/logger');

class Big12DataService {
  /**
   * Get all teams or filtered teams
   * @param {Object} filters - Optional filters
   * @param {number} filters.sport_id - Filter by sport
   * @param {number} filters.school_id - Filter by school
   * @param {string} filters.conference_status - Filter by conference status
   * @returns {Array} Array of team objects
   */
  static getTeams(filters = {}) {
    try {
      let teams = BIG12_DATA.generateBig12Teams();
      
      // Apply filters
      if (filters.sport_id) {
        teams = teams.filter(t => t.sport_id === parseInt(filters.sport_id));
      }
      
      if (filters.school_id) {
        teams = teams.filter(t => t.school_id === parseInt(filters.school_id));
      }
      
      if (filters.conference_status) {
        // Filter based on school's conference status
        const schoolIds = this.getSchoolIdsByStatus(filters.conference_status);
        teams = teams.filter(t => schoolIds.includes(t.school_id));
      }
      
      // Add COMPASS ratings to teams
      teams = teams.map(team => ({
        ...team,
        compass_rating: BIG12_DATA.COMPASS_RATINGS[team.team_id] || null
      }));
      
      logger.info(`Retrieved ${teams.length} teams with filters:`, filters);
      return teams;
    } catch (error) {
      logger.error('Error getting teams:', error);
      return [];
    }
  }
  
  /**
   * Get all venues or filtered venues
   * @param {Object} filters - Optional filters
   * @param {number} filters.school_id - Filter by school
   * @param {number} filters.venue_type - Filter by venue type
   * @param {number} filters.sport_id - Filter by sport compatibility
   * @returns {Array} Array of venue objects
   */
  static getVenues(filters = {}) {
    try {
      let venues = BIG12_DATA.generateBig12Venues();
      
      // Apply filters
      if (filters.school_id) {
        venues = venues.filter(v => v.school_id === parseInt(filters.school_id));
      }
      
      if (filters.venue_type) {
        venues = venues.filter(v => v.venue_type === parseInt(filters.venue_type));
      }
      
      if (filters.sport_id) {
        // Get compatible venue types for this sport
        const sport = BIG12_DATA.SPORTS[filters.sport_id];
        if (sport) {
          const compatibleTypes = this.getVenueTypesForSport(sport.code);
          venues = venues.filter(v => compatibleTypes.includes(v.venue_type));
        }
      }
      
      logger.info(`Retrieved ${venues.length} venues with filters:`, filters);
      return venues;
    } catch (error) {
      logger.error('Error getting venues:', error);
      return [];
    }
  }
  
  /**
   * Get a specific team by ID
   * @param {number} teamId - The team ID
   * @returns {Object|null} Team object or null if not found
   */
  static getTeamById(teamId) {
    try {
      const teams = this.getTeams();
      const team = teams.find(t => t.team_id === parseInt(teamId));
      
      if (!team) {
        logger.warn(`Team not found with ID: ${teamId}`);
        return null;
      }
      
      return team;
    } catch (error) {
      logger.error(`Error getting team by ID ${teamId}:`, error);
      return null;
    }
  }
  
  /**
   * Get teams by sport
   * @param {number} sportId - The sport ID
   * @returns {Array} Array of teams for that sport
   */
  static getTeamsBySport(sportId) {
    return this.getTeams({ sport_id: sportId });
  }
  
  /**
   * Get teams by school
   * @param {number} schoolId - The school ID
   * @returns {Array} Array of teams for that school
   */
  static getTeamsBySchool(schoolId) {
    return this.getTeams({ school_id: schoolId });
  }
  
  /**
   * Calculate team ID using the official pattern
   * @param {number} schoolId - School ID (1-33)
   * @param {number} sportId - Sport ID
   * @returns {number} Calculated team ID
   */
  static calculateTeamId(schoolId, sportId) {
    return BIG12_DATA.generateTeamId(schoolId, sportId);
  }
  
  /**
   * Calculate venue ID using the official pattern
   * @param {number} schoolId - School ID
   * @param {number} venueType - Venue type ID
   * @returns {number} Calculated venue ID
   */
  static calculateVenueId(schoolId, venueType) {
    return BIG12_DATA.generateVenueId(schoolId, venueType);
  }
  
  /**
   * Get all sports
   * @returns {Object} Sports object keyed by sport ID
   */
  static getSports() {
    return BIG12_DATA.SPORTS;
  }
  
  /**
   * Get sport by ID
   * @param {number} sportId - The sport ID
   * @returns {Object|null} Sport object or null
   */
  static getSportById(sportId) {
    return BIG12_DATA.SPORTS[sportId] || null;
  }
  
  /**
   * Get all schools (full members and affiliates)
   * @param {Object} filters - Optional filters
   * @param {string} filters.conference_status - Filter by status
   * @returns {Object} Schools object
   */
  static getSchools(filters = {}) {
    let schools = { ...BIG12_DATA.BIG12_SCHOOLS };
    
    if (!filters.conference_status || filters.conference_status === 'all') {
      // Include affiliates
      schools = { ...schools, ...BIG12_DATA.BIG12_AFFILIATES };
    } else if (filters.conference_status === 'affiliate') {
      schools = { ...BIG12_DATA.BIG12_AFFILIATES };
    }
    
    return schools;
  }
  
  /**
   * Get school by ID
   * @param {number} schoolId - The school ID
   * @returns {Object|null} School object or null
   */
  static getSchoolById(schoolId) {
    const allSchools = this.getSchools({ conference_status: 'all' });
    return allSchools[schoolId] || null;
  }
  
  /**
   * Get venue types
   * @returns {Object} Venue types object
   */
  static getVenueTypes() {
    return BIG12_DATA.VENUE_TYPES;
  }
  
  /**
   * Get venue type by ID
   * @param {number} venueTypeId - The venue type ID
   * @returns {Object|null} Venue type object or null
   */
  static getVenueTypeById(venueTypeId) {
    return BIG12_DATA.VENUE_TYPES[venueTypeId] || null;
  }
  
  /**
   * Get COMPASS rating for a team
   * @param {number} teamId - The team ID
   * @returns {Object|null} COMPASS rating object or null
   */
  static getCompassRating(teamId) {
    return BIG12_DATA.COMPASS_RATINGS[teamId] || null;
  }
  
  /**
   * Get all COMPASS ratings
   * @returns {Object} All COMPASS ratings
   */
  static getAllCompassRatings() {
    return BIG12_DATA.COMPASS_RATINGS;
  }
  
  /**
   * Helper: Get school IDs by conference status
   * @private
   */
  static getSchoolIdsByStatus(status) {
    const schools = this.getSchools({ conference_status: status });
    return Object.keys(schools).map(id => parseInt(id));
  }
  
  /**
   * Helper: Get venue types compatible with a sport
   * @private
   */
  static getVenueTypesForSport(sportCode) {
    const compatibleTypes = [];
    
    Object.entries(BIG12_DATA.VENUE_TYPES).forEach(([typeId, venueType]) => {
      if (venueType.sport_codes.includes(sportCode)) {
        compatibleTypes.push(parseInt(typeId));
      }
    });
    
    return compatibleTypes;
  }
  
  /**
   * Validate team exists
   * @param {number} teamId - Team ID to validate
   * @returns {boolean} True if team exists
   */
  static validateTeamId(teamId) {
    return this.getTeamById(teamId) !== null;
  }
  
  /**
   * Validate multiple team IDs
   * @param {Array<number>} teamIds - Array of team IDs
   * @returns {Object} Validation result with valid/invalid arrays
   */
  static validateTeamIds(teamIds) {
    const valid = [];
    const invalid = [];
    
    teamIds.forEach(id => {
      if (this.validateTeamId(id)) {
        valid.push(id);
      } else {
        invalid.push(id);
      }
    });
    
    return { valid, invalid };
  }
  
  /**
   * Get team matchup history (for future enhancement)
   * @param {number} team1Id - First team ID
   * @param {number} team2Id - Second team ID
   * @returns {Object} Matchup history data
   */
  static getTeamMatchupHistory(team1Id, team2Id) {
    // Placeholder for future implementation
    return {
      team1_id: team1Id,
      team2_id: team2Id,
      total_games: 0,
      team1_wins: 0,
      team2_wins: 0,
      last_game: null,
      rivalry_intensity: 'normal'
    };
  }
  
  /**
   * Get scheduling priority based on COMPASS ratings
   * @param {number} teamId - Team ID
   * @returns {string} Priority level (high/medium/low)
   */
  static getSchedulingPriority(teamId) {
    const compass = this.getCompassRating(teamId);
    
    if (!compass) return 'medium';
    
    if (compass.overall >= 90) return 'high';
    if (compass.overall >= 80) return 'medium';
    return 'low';
  }
}

module.exports = Big12DataService;