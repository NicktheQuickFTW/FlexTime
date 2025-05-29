/**
 * Microservice System Client
 * 
 * Client for interacting with the new FlexTime microservices architecture
 */

const axios = require('axios');
const logger = require('../../utilities/logger');

class MicroserviceClient {
  constructor(config) {
    this.config = config;
    this.clients = {};
    
    // Initialize service clients
    this.initializeServiceClients();
  }

  /**
   * Initialize HTTP clients for each microservice
   */
  initializeServiceClients() {
    // API Gateway client
    if (this.config.apiGateway) {
      this.clients.gateway = this.createClient('gateway', this.config.apiGateway);
    }

    // Individual service clients
    Object.entries(this.config.services || {}).forEach(([serviceName, serviceConfig]) => {
      this.clients[serviceName] = this.createClient(serviceName, serviceConfig);
    });
  }

  /**
   * Create HTTP client for a service
   * @param {string} serviceName - Name of the service
   * @param {Object} serviceConfig - Service configuration
   * @returns {Object} Axios client instance
   */
  createClient(serviceName, serviceConfig) {
    const client = axios.create({
      baseURL: serviceConfig.baseUrl,
      timeout: serviceConfig.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Client': 'migration-testing-framework'
      }
    });

    // Add request/response interceptors
    client.interceptors.request.use(
      (config) => {
        logger.debug(`${serviceName} API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error(`${serviceName} API Request Error:`, error);
        return Promise.reject(error);
      }
    );

    client.interceptors.response.use(
      (response) => {
        logger.debug(`${serviceName} API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`${serviceName} API Response Error:`, {
          service: serviceName,
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Health check for all microservices
   * @returns {Promise<boolean>} True if all services are healthy
   */
  async healthCheck() {
    try {
      const healthChecks = [];

      // Check API Gateway if available
      if (this.clients.gateway) {
        healthChecks.push(this.checkServiceHealth('gateway', '/health'));
      }

      // Check individual services
      Object.keys(this.clients).forEach(serviceName => {
        if (serviceName !== 'gateway') {
          healthChecks.push(this.checkServiceHealth(serviceName, '/health'));
        }
      });

      const results = await Promise.all(healthChecks);
      const allHealthy = results.every(result => result.healthy);

      logger.info('Microservices health check completed', {
        totalServices: results.length,
        healthyServices: results.filter(r => r.healthy).length,
        allHealthy
      });

      return allHealthy;

    } catch (error) {
      logger.error('Microservices health check failed:', error.message);
      return false;
    }
  }

  /**
   * Check health of individual service
   * @param {string} serviceName - Name of the service
   * @param {string} healthEndpoint - Health check endpoint
   * @returns {Promise<Object>} Health check result
   */
  async checkServiceHealth(serviceName, healthEndpoint) {
    try {
      const startTime = Date.now();
      const response = await this.clients[serviceName].get(healthEndpoint);
      const duration = Date.now() - startTime;

      logger.apiCall('GET', `${serviceName}${healthEndpoint}`, response.status, duration);

      return {
        service: serviceName,
        healthy: response.status === 200,
        responseTime: duration
      };
    } catch (error) {
      logger.warn(`Health check failed for ${serviceName}:`, error.message);
      return {
        service: serviceName,
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a schedule using microservices
   * @param {Object} params - Schedule generation parameters
   * @returns {Promise<Object>} Generated schedule
   */
  async generateSchedule(params) {
    const timer = logger.startTimer('microservice-schedule-generation');

    try {
      logger.info('Generating schedule with microservices', { params });

      // Use scheduler service or API gateway
      const client = this.clients.scheduler || this.clients.gateway;
      if (!client) {
        throw new Error('No scheduler service or API gateway available');
      }

      const endpoint = this.clients.scheduler ? '/schedules/generate' : '/api/scheduler/schedules/generate';
      
      const payload = {
        sport: params.sport,
        teams: params.teams,
        constraints: params.constraints,
        parameters: params.parameters,
        season: params.season || '2025-26'
      };

      const response = await client.post(endpoint, payload);

      timer();
      logger.info('Microservice schedule generation completed', {
        scheduleId: response.data.id,
        gameCount: response.data.games?.length
      });

      return this.normalizeScheduleResponse(response.data);

    } catch (error) {
      timer();
      logger.error('Microservice schedule generation failed:', error.message);
      throw new Error(`Microservice schedule generation failed: ${error.message}`);
    }
  }

  /**
   * Optimize travel using microservices
   * @param {Object} params - Travel optimization parameters
   * @returns {Promise<Object>} Travel optimization result
   */
  async optimizeTravel(params) {
    const timer = logger.startTimer('microservice-travel-optimization');

    try {
      logger.info('Optimizing travel with microservices', { params });

      const client = this.clients.scheduler || this.clients.gateway;
      if (!client) {
        throw new Error('No scheduler service or API gateway available');
      }

      const endpoint = this.clients.scheduler ? '/travel/optimize' : '/api/scheduler/travel/optimize';
      const response = await client.post(endpoint, params);

      timer();
      return this.normalizeTravelResponse(response.data);

    } catch (error) {
      timer();
      logger.error('Microservice travel optimization failed:', error.message);
      throw new Error(`Microservice travel optimization failed: ${error.message}`);
    }
  }

  /**
   * Assign venues using microservices
   * @param {Object} params - Venue assignment parameters
   * @returns {Promise<Object>} Venue assignment result
   */
  async assignVenues(params) {
    const timer = logger.startTimer('microservice-venue-assignment');

    try {
      logger.info('Assigning venues with microservices', { params });

      const client = this.clients.scheduler || this.clients.gateway;
      if (!client) {
        throw new Error('No scheduler service or API gateway available');
      }

      const endpoint = this.clients.scheduler ? '/venues/assign' : '/api/scheduler/venues/assign';
      const response = await client.post(endpoint, params);

      timer();
      return this.normalizeVenueResponse(response.data);

    } catch (error) {
      timer();
      logger.error('Microservice venue assignment failed:', error.message);
      throw new Error(`Microservice venue assignment failed: ${error.message}`);
    }
  }

  /**
   * Get teams from microservices
   * @returns {Promise<Array>} Array of teams
   */
  async getTeams() {
    try {
      logger.debug('Fetching teams from microservices');

      const client = this.clients.teamManagement || this.clients.gateway;
      if (!client) {
        throw new Error('No team management service or API gateway available');
      }

      const endpoint = this.clients.teamManagement ? '/teams' : '/api/teams';
      const response = await client.get(endpoint);

      return response.data.map(team => this.normalizeTeamData(team));

    } catch (error) {
      logger.error('Failed to fetch teams from microservices:', error.message);
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }
  }

  /**
   * Get venues from microservices
   * @returns {Promise<Array>} Array of venues
   */
  async getVenues() {
    try {
      logger.debug('Fetching venues from microservices');

      const client = this.clients.teamManagement || this.clients.gateway;
      if (!client) {
        throw new Error('No team management service or API gateway available');
      }

      const endpoint = this.clients.teamManagement ? '/venues' : '/api/venues';
      const response = await client.get(endpoint);

      return response.data.map(venue => this.normalizeVenueData(venue));

    } catch (error) {
      logger.error('Failed to fetch venues from microservices:', error.message);
      throw new Error(`Failed to fetch venues: ${error.message}`);
    }
  }

  /**
   * Get schedule by ID from microservices
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<Object>} Schedule data
   */
  async getSchedule(scheduleId) {
    try {
      logger.debug('Fetching schedule from microservices', { scheduleId });

      const client = this.clients.scheduler || this.clients.gateway;
      if (!client) {
        throw new Error('No scheduler service or API gateway available');
      }

      const endpoint = this.clients.scheduler 
        ? `/schedules/${scheduleId}` 
        : `/api/scheduler/schedules/${scheduleId}`;
      
      const response = await client.get(endpoint);

      return this.normalizeScheduleResponse(response.data);

    } catch (error) {
      logger.error('Failed to fetch schedule from microservices:', error.message);
      throw new Error(`Failed to fetch schedule: ${error.message}`);
    }
  }

  /**
   * Normalize schedule response from microservices
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
   * Disconnect from all microservices
   */
  async disconnect() {
    logger.debug('Disconnecting from microservices');
    // No persistent connections to close for HTTP clients
  }
}

module.exports = MicroserviceClient;