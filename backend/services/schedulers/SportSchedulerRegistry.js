/**
 * Sport Scheduler Registry
 * 
 * Central registry for all sport-specific schedulers
 * Provides dynamic scheduler discovery and instantiation
 */

const logger = require('../../lib/logger');

// Import sport schedulers as they're created
const FootballScheduler = require('./sports/FootballScheduler');
const BasketballScheduler = require('./sports/BasketballScheduler');
const SoccerScheduler = require('./sports/SoccerScheduler');
const VolleyballScheduler = require('./sports/VolleyballScheduler');
const WrestlingScheduler = require('./sports/WrestlingScheduler');
const GymnasticsScheduler = require('./GymnasticsScheduler');
const WomensTennisScheduler = require('./WomensTennisScheduler');
const MensTennisScheduler = require('./MensTennisScheduler');
// const BaseballScheduler = require('./sports/BaseballScheduler');
// const DefaultScheduler = require('./base/DefaultScheduler');

class SportSchedulerRegistry {
  constructor() {
    this.schedulers = new Map();
    this.registerDefaultSchedulers();
  }

  /**
   * Register a scheduler for a specific sport
   * @param {number} sportId - Sport ID
   * @param {Class} schedulerClass - Scheduler class (not instance)
   */
  register(sportId, schedulerClass) {
    this.schedulers.set(sportId, schedulerClass);
    logger.info(`Registered ${schedulerClass.name} for sport ${sportId}`);
  }

  /**
   * Get scheduler instance for a sport
   * @param {number} sportId - Sport ID
   * @param {Object} config - Configuration for scheduler
   * @returns {SportScheduler} Scheduler instance
   */
  getScheduler(sportId, config = {}) {
    const SchedulerClass = this.schedulers.get(sportId);
    
    if (!SchedulerClass) {
      logger.warn(`No scheduler found for sport ${sportId}, using default`);
      // For now, return null - will use SimpleSchedulingService as fallback
      return null;
    }
    
    // Ensure sportId is passed to the scheduler
    const schedulerConfig = { ...config, sportId };
    return new SchedulerClass(schedulerConfig);
  }

  /**
   * Check if a sport has a registered scheduler
   * @param {number} sportId - Sport ID
   * @returns {boolean} True if scheduler exists
   */
  hasScheduler(sportId) {
    return this.schedulers.has(sportId);
  }

  /**
   * Register all default schedulers
   * @private
   */
  registerDefaultSchedulers() {
    // Football
    this.register(8, FootballScheduler);
    
    // Basketball
    this.register(2, BasketballScheduler);  // Men's Basketball
    this.register(3, BasketballScheduler);  // Women's Basketball
    
    // Gymnastics
    this.register(11, GymnasticsScheduler);
    
    // Tennis
    this.register(17, MensTennisScheduler);    // Men's Tennis
    this.register(18, WomensTennisScheduler);  // Women's Tennis
    
    // Soccer
    this.register(14, SoccerScheduler);  // Soccer
    
    // Volleyball
    this.register(19, VolleyballScheduler);  // Volleyball
    
    // Wrestling
    this.register(20, WrestlingScheduler);  // Wrestling
    
    // Baseball/Softball (when implemented)
    // this.register(1, BaseballScheduler);   // Baseball
    // this.register(15, BaseballScheduler);  // Softball (same pattern)
    
    // Other sports can be added as implemented
  }

  /**
   * Get list of registered sports
   * @returns {Array} Array of sport IDs
   */
  getRegisteredSports() {
    return Array.from(this.schedulers.keys());
  }

  /**
   * Get metadata about all registered schedulers
   * @returns {Object} Scheduler metadata
   */
  getSchedulerMetadata() {
    const metadata = {};
    
    this.schedulers.forEach((SchedulerClass, sportId) => {
      const tempInstance = new SchedulerClass();
      metadata[sportId] = tempInstance.getMetadata();
    });
    
    return metadata;
  }
}

// Export singleton instance
module.exports = new SportSchedulerRegistry();