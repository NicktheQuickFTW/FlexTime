/**
 * COMPASS Resources Component
 * 
 * Analyzes and scores athletic programs based on financial resources,
 * revenue generation potential, and budget allocation efficiency.
 */

const logger = require('../../utils/logger');

class ResourcesComponent {
  /**
   * Create a new Resources Component
   * @param {Object} db - Database connection
   * @param {Object} options - Configuration options
   */
  constructor(db, options = {}) {
    this.db = db;
    this.options = {
      budgetWeight: 0.35,              // Weight for program budget
      revenueWeight: 0.35,             // Weight for revenue generation
      facilitiesWeight: 0.15,          // Weight for facilities quality
      staffingWeight: 0.15,            // Weight for coaching/support staff
      ...options
    };
    
    this.cachedResourceData = new Map();
    this.cachedScores = new Map();
    
    logger.info('COMPASS Resources Component initialized');
  }
  
  /**
   * Initialize the component
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      logger.info('Resources Component initialized successfully');
    } catch (error) {
      logger.error(`Error initializing Resources Component: ${error.message}`);
    }
  }
  
  /**
   * Get resources score for a program
   * @param {string} programId - Program ID
   * @returns {Promise<number>} Resources score (0-1)
   */
  async getScore(programId) {
    // Check cache first
    if (this.cachedScores.has(programId)) {
      return this.cachedScores.get(programId);
    }
    
    try {
      // Get resource metrics for the program
      const metrics = await this._getProgramResourceMetrics(programId);
      
      // Calculate weighted score
      const score = this._calculateResourcesScore(metrics);
      
      // Cache the score
      this.cachedScores.set(programId, score);
      
      return score;
    } catch (error) {
      logger.error(`Error calculating resources score for ${programId}: ${error.message}`);
      // Return default score on error
      return 0.5;
    }
  }
  
  /**
   * Get detailed resource metrics for a program
   * @param {string} programId - Program ID
   * @returns {Promise<Object>} Resource metrics
   * @private
   */
  async _getProgramResourceMetrics(programId) {
    try {
      // Check cache first
      if (this.cachedResourceData.has(programId)) {
        return this.cachedResourceData.get(programId);
      }
      
      // Get team data
      let team;
      try {
        team = await this.db.Team.findByPk(programId, {
          include: [
            { model: this.db.Institution, as: 'institution' },
            { model: this.db.Sport, as: 'sport' }
          ]
        });
      } catch (error) {
        logger.warn(`Error fetching team data from DB: ${error.message}`);
        // Continue with synthetic data
      }
      
      // Extract sport from team or use default
      const sport = team?.sport?.name || 'Basketball';
      
      // For the prototype, generate synthetic data based on program ID
      // This ensures consistent results for the same program
      const idHash = this._simpleHash(programId);
      
      // Generate resource metrics (synthetic data)
      // Scale: 0-1 where higher is better
      
      // Adjust budget based on sport (football typically has larger budgets)
      let budgetFactor = 1.0;
      if (sport === 'Football') budgetFactor = 2.0;
      else if (sport === 'Basketball') budgetFactor = 1.5;
      
      const budget = {
        total: 5000000 + (idHash * budgetFactor * 100000), // $5M-$15M range
        perAthlete: 50000 + (idHash * 1000),
        percentOfDepartment: 0.05 + (idHash / 1000),
        normalizedScore: 0.3 + (idHash % 70) / 100 // 0.3-1.0 range
      };
      
      const revenue = {
        ticketSales: 1000000 + (idHash * 50000),
        merchandising: 200000 + (idHash * 20000),
        donations: 500000 + (idHash * 30000),
        mediaRights: 300000 + (idHash * 40000),
        total: 2000000 + (idHash * 140000),
        normalizedScore: 0.3 + ((idHash * 2) % 70) / 100 // 0.3-1.0 range
      };
      
      const facilities = {
        venueCapacity: 5000 + (idHash * 200),
        venueAge: Math.max(1, 50 - (idHash % 50)),
        practiceQuality: 0.3 + ((idHash * 3) % 70) / 100,
        normalizedScore: 0.3 + ((idHash * 3) % 70) / 100 // 0.3-1.0 range
      };
      
      const staffing = {
        coachingSalaries: 500000 + (idHash * 50000),
        supportStaffCount: 5 + (idHash % 20),
        staffToAthleteRatio: 0.1 + (idHash / 1000),
        normalizedScore: 0.3 + ((idHash * 4) % 70) / 100 // 0.3-1.0 range
      };
      
      // Get championship ticket price data if available
      const ticketPrices = await this._getChampionshipTicketPrices(sport);
      
      const metrics = {
        programId,
        sport,
        budget,
        revenue,
        facilities,
        staffing,
        ticketPrices
      };
      
      // Cache the metrics
      this.cachedResourceData.set(programId, metrics);
      
      return metrics;
    } catch (error) {
      logger.error(`Error getting resource metrics for ${programId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate resources score from metrics
   * @param {Object} metrics - Resource metrics
   * @returns {number} Resources score (0-1)
   * @private
   */
  _calculateResourcesScore(metrics) {
    try {
      // Use normalized scores from each category
      const budgetScore = metrics.budget.normalizedScore;
      const revenueScore = metrics.revenue.normalizedScore;
      const facilitiesScore = metrics.facilities.normalizedScore;
      const staffingScore = metrics.staffing.normalizedScore;
      
      // Apply weights
      const weightedScore = 
        (budgetScore * this.options.budgetWeight) +
        (revenueScore * this.options.revenueWeight) +
        (facilitiesScore * this.options.facilitiesWeight) +
        (staffingScore * this.options.staffingWeight);
      
      return weightedScore;
    } catch (error) {
      logger.error(`Error calculating resources score: ${error.message}`);
      return 0.5; // Default score on error
    }
  }
  
  /**
   * Get pricing data for a sport (regular season games only)
   * @param {string} sport - Sport name
   * @returns {Promise<Object>} Pricing data
   * @private
   */
  async _getSportPricingData(sport) {
    try {
      // In a real implementation, this would get pricing data from the database
      // Returning default pricing data based on sport
      const pricingData = {
        'Basketball': {
          basePrice: 30,
          premiumFactor: 2.5,
          studentPrice: 10
        },
        'Football': {
          basePrice: 60,
          premiumFactor: 3.0,
          studentPrice: 20
        },
        'Baseball': {
          basePrice: 20,
          premiumFactor: 2.0,
          studentPrice: 5
        },
        'default': {
          basePrice: 15,
          premiumFactor: 2.0,
          studentPrice: 5
        }
      };
      
      return pricingData[sport] || pricingData.default;
    } catch (error) {
      logger.error(`Error getting pricing data for ${sport}: ${error.message}`);
      return pricingData.default;
    }
  }
  
  /**
   * Get revenue metrics for a specific game between two teams
   * @param {string} teamId - Team ID
   * @param {string} opponentId - Opponent ID
   * @param {Date} gameDate - Game date
   * @param {boolean} isHome - Whether it's a home game
   * @returns {Promise<Object>} Revenue metrics
   */
  async getGameMetrics(teamId, opponentId, gameDate, isHome) {
    try {
      // Get scores for both teams
      const [teamScore, opponentScore] = await Promise.all([
        this.getScore(teamId),
        this.getScore(opponentId)
      ]);
      
      // Get team and opponent data
      const [teamMetrics, opponentMetrics] = await Promise.all([
        this._getProgramResourceMetrics(teamId),
        this._getProgramResourceMetrics(opponentId)
      ]);
      
      // Get sport-specific pricing data
      const pricingData = await this._getSportPricingData(teamMetrics.sport);
      
      // Calculate base ticket price based on resource levels and sport
      const basePrice = isHome ? 
        pricingData.basePrice * (1 + teamMetrics.budget.normalizedScore * 0.5) : 
        pricingData.basePrice * (1 + opponentMetrics.budget.normalizedScore * 0.5);
      
      // Calculate demand factor based on opponent quality
      const opponentQualityFactor = 0.5 + (opponentScore * 1.5);
      
      // Adjust for time of year (higher prices later in season)
      const today = new Date();
      const gameDay = new Date(gameDate);
      const daysSinceToday = Math.max(0, (gameDay - today) / (1000 * 60 * 60 * 24));
      const timeFactorAdjustment = daysSinceToday < 30 ? 1.2 : 1.0;
      
      // Calculate expected attendance (as percentage of capacity)
      const attendancePercentage = Math.min(1.0, 0.5 + (teamScore * 0.2) + (opponentScore * 0.3));
      
      // Calculate expected ticket revenue
      const estimatedCapacity = isHome ? 
        teamMetrics.facilities.venueCapacity : 
        opponentMetrics.facilities.venueCapacity;
      
      const estimatedAttendance = estimatedCapacity * attendancePercentage;
      const ticketPrice = basePrice * opponentQualityFactor * timeFactorAdjustment;
      const ticketRevenue = estimatedAttendance * ticketPrice;
      
      // Calculate expected merchandise revenue
      const merchPerAttendee = isHome ?
        10 + (teamMetrics.revenue.normalizedScore * 15) :
        5; // Lower merch sales for away games
      
      const merchandiseRevenue = estimatedAttendance * merchPerAttendee;
      
      // Media value depends on both teams' quality
      const combinedScore = teamScore + opponentScore;
      const nationalTVPotential = combinedScore > 1.5 ? 'High' : 
                                 combinedScore > 1.2 ? 'Medium' : 'Low';
      
      // Media revenue estimate
      const mediaRevenue = nationalTVPotential === 'High' ? 100000 :
                          nationalTVPotential === 'Medium' ? 50000 : 25000;
      
      // Calculate total revenue
      const totalRevenue = ticketRevenue + merchandiseRevenue + mediaRevenue;
      
      // Calculate revenue potential score (0-1)
      const maxPotentialRevenue = 1000000; // Theoretical maximum for a regular game
      const revenuePotential = Math.min(1.0, totalRevenue / maxPotentialRevenue);
      
      // Calculate national exposure score (0-1)
      const nationalExposure = nationalTVPotential === 'High' ? 0.9 :
                              nationalTVPotential === 'Medium' ? 0.6 : 0.3;
      
      return {
        teamId,
        opponentId,
        gameDate: gameDate.toISOString(),
        isHome,
        estimatedAttendance: Math.round(estimatedAttendance),
        attendancePercentage: Math.round(attendancePercentage * 100),
        ticketPrice: Math.round(ticketPrice),
        ticketRevenue: Math.round(ticketRevenue),
        merchandiseRevenue: Math.round(merchandiseRevenue),
        mediaRevenue: Math.round(mediaRevenue),
        totalRevenue: Math.round(totalRevenue),
        nationalTVPotential,
        revenuePotential,
        nationalExposure
      };
    } catch (error) {
      logger.error(`Error calculating game metrics: ${error.message}`);
      // Return default metrics on error
      return {
        teamId,
        opponentId,
        gameDate: gameDate.toISOString(),
        isHome,
        estimatedAttendance: 5000,
        attendancePercentage: 70,
        ticketPrice: 30,
        ticketRevenue: 150000,
        merchandiseRevenue: 50000,
        mediaRevenue: 25000,
        totalRevenue: 225000,
        nationalTVPotential: 'Medium',
        revenuePotential: 0.5,
        nationalExposure: 0.5
      };
    }
  }
  
  /**
   * Simple hash function for generating consistent synthetic data
   * @param {string} input - Input string
   * @returns {number} Hash value
   * @private
   */
  _simpleHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash % 100);
  }
  
  /**
   * Clear cached data
   */
  clearCache() {
    this.cachedResourceData.clear();
    this.cachedScores.clear();
    logger.info('Resources component cache cleared');
  }
}

module.exports = ResourcesComponent;