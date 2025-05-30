/**
 * Legacy System Client
 * 
 * Client for interacting with the existing FlexTime monolithic system
 */

const axios = require('axios');
const logger = require('../../utilities/logger');

class LegacySystemClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiPrefix = config.apiPrefix || '/api';
    this.timeout = config.timeout || 15000;
    this.auth = config.auth;
    
    this.client = axios.create({
      baseURL: `${this.baseUrl}${this.apiPrefix}`,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.auth?.token && { 'Authorization': `Bearer ${this.auth.token}` })
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Legacy API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Legacy API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Legacy API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Legacy API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check for legacy system
   * @returns {Promise<boolean>} True if system is healthy
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const response = await this.client.get('/status');
      const duration = Date.now() - startTime;
      
      logger.apiCall('GET', '/status', response.status, duration);
      return response.status === 200;
    } catch (error) {
      logger.error('Legacy system health check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate a schedule using the legacy system
   * @param {Object} params - Schedule generation parameters
   * @returns {Promise<Object>} Generated schedule
   */
  async generateSchedule(params) {
    const timer = logger.startTimer('legacy-schedule-generation');
    
    try {
      logger.info('Generating schedule with legacy system', { params });
      
      const payload = {
        sport: params.sport,
        teams: params.teams,
        constraints: params.constraints,
        parameters: params.parameters,
        season: params.season || '2025-26'
      };
      
      const response = await this.client.post('/schedules/generate', payload);
      
      timer();
      logger.info('Legacy schedule generation completed', {
        scheduleId: response.data.id,
        gameCount: response.data.games?.length
      });
      
      return this.normalizeScheduleResponse(response.data);
      
    } catch (error) {
      timer();
      logger.error('Legacy schedule generation failed:', error.message);
      throw new Error(`Legacy schedule generation failed: ${error.message}`);
    }
  }

  /**
   * Optimize travel using legacy system
   * @param {Object} params - Travel optimization parameters
   * @returns {Promise<Object>} Travel optimization result
   */
  async optimizeTravel(params) {
    const timer = logger.startTimer('legacy-travel-optimization');
    
    try {
      logger.info('Optimizing travel with legacy system', { params });
      
      const response = await this.client.post('/schedules/optimize-travel', params);
      
      timer();
      return this.normalizeTravelResponse(response.data);
      
    } catch (error) {
      timer();
      logger.error('Legacy travel optimization failed:', error.message);
      throw new Error(`Legacy travel optimization failed: ${error.message}`);
    }
  }

  /**
   * Assign venues using legacy system
   * @param {Object} params - Venue assignment parameters
   * @returns {Promise<Object>} Venue assignment result
   */
  async assignVenues(params) {
    const timer = logger.startTimer('legacy-venue-assignment');
    
    try {
      logger.info('Assigning venues with legacy system', { params });
      
      const response = await this.client.post('/schedules/assign-venues', params);
      
      timer();
      return this.normalizeVenueResponse(response.data);
      
    } catch (error) {
      timer();
      logger.error('Legacy venue assignment failed:', error.message);
      throw new Error(`Legacy venue assignment failed: ${error.message}`);
    }
  }

  /**
   * Get teams from legacy system
   * @returns {Promise<Array>} Array of teams
   */
  async getTeams() {
    try {
      logger.debug('Fetching teams from legacy system');
      
      const response = await this.client.get('/teams');
      
      return response.data.map(team => this.normalizeTeamData(team));
      
    } catch (error) {
      logger.error('Failed to fetch teams from legacy system:', error.message);
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }
  }

  /**
   * Get venues from legacy system
   * @returns {Promise<Array>} Array of venues
   */
  async getVenues() {
    try {
      logger.debug('Fetching venues from legacy system');
      
      const response = await this.client.get('/venues');
      
      return response.data.map(venue => this.normalizeVenueData(venue));
      
    } catch (error) {
      logger.error('Failed to fetch venues from legacy system:', error.message);
      throw new Error(`Failed to fetch venues: ${error.message}`);
    }
  }

  /**
   * Get schedule by ID from legacy system
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<Object>} Schedule data
   */
  async getSchedule(scheduleId) {
    try {
      logger.debug('Fetching schedule from legacy system', { scheduleId });
      
      const response = await this.client.get(`/schedules/${scheduleId}`);
      
      return this.normalizeScheduleResponse(response.data);
      
    } catch (error) {
      logger.error('Failed to fetch schedule from legacy system:', error.message);
      throw new Error(`Failed to fetch schedule: ${error.message}`);
    }
  }

  /**
   * Normalize schedule response from legacy system
   * @param {Object} data - Raw schedule data
   * @returns {Object} Normalized schedule data
   */
  normalizeScheduleResponse(data) {
    return {
      id: data.id || data.scheduleId,
      sport: data.sport,
      season: data.season,
      conferenceId: data.conferenceId || 'big12',
      teams: data.teams || [],
      games: (data.games || []).map(game => ({
        id: game.id,
        homeTeam: game.homeTeam || game.home_team,
        awayTeam: game.awayTeam || game.away_team,
        date: game.date,
        time: game.time,
        venue: game.venue || game.venue_id,
        week: game.week
      })),
      venues: data.venues || [],
      constraints: data.constraints || [],
      metadata: {
        generatedAt: data.generatedAt || data.created_at,
        algorithm: data.algorithm,
        totalGames: data.games?.length || 0,
        totalTeams: data.teams?.length || 0
      }
    };
  }

  /**
   * Normalize travel optimization response
   * @param {Object} data - Raw travel data
   * @returns {Object} Normalized travel data
   */
  normalizeTravelResponse(data) {
    return {
      totalTravelDistance: data.totalDistance || data.total_travel_distance,
      optimizedGames: data.games || data.optimized_games || [],
      travelMatrix: data.travelMatrix || data.travel_matrix,
      optimization: {
        algorithm: data.algorithm,
        iterations: data.iterations,
        improvementPercent: data.improvementPercent || data.improvement_percent
      }
    };
  }

  /**
   * Normalize venue assignment response
   * @param {Object} data - Raw venue data
   * @returns {Object} Normalized venue data
   */
  normalizeVenueResponse(data) {
    return {
      assignments: data.assignments || data.venue_assignments || [],
      conflicts: data.conflicts || [],
      utilization: data.utilization || data.venue_utilization
    };
  }

  /**
   * Normalize team data
   * @param {Object} team - Raw team data
   * @returns {Object} Normalized team data
   */
  normalizeTeamData(team) {
    return {
      id: team.id,
      name: team.name,
      mascot: team.mascot,
      city: team.city,
      state: team.state,
      conference: team.conference || 'big12'
    };
  }

  /**
   * Normalize venue data
   * @param {Object} venue - Raw venue data
   * @returns {Object} Normalized venue data
   */
  normalizeVenueData(venue) {
    return {
      id: venue.id,
      name: venue.name,
      teamId: venue.teamId || venue.team_id,
      city: venue.city,
      state: venue.state,
      capacity: venue.capacity,
      type: venue.type
    };
  }

  /**
   * Disconnect from legacy system
   */
  async disconnect() {
    logger.debug('Disconnecting from legacy system');
    // No persistent connections to close for HTTP client
  }
}

module.exports = LegacySystemClient;