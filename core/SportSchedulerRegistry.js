/**
 * Sport Scheduler Registry
 * 
 * Central registry for all sport-specific schedulers
 * Provides dynamic scheduler discovery and instantiation
 */

const logger = require('../utils/logger.js');

// Import sport schedulers as they're created
const FootballScheduler = require('../schedulers/FootballScheduler');
const MensBasketballScheduler = require('../schedulers/MensBasketballScheduler');
const WomensBasketballScheduler = require('../schedulers/WomensBasketballScheduler');
const SoccerScheduler = require('../schedulers/SoccerScheduler');
const VolleyballScheduler = require('../schedulers/VolleyballScheduler');
const WrestlingScheduler = require('../schedulers/WrestlingScheduler');
const BaseballScheduler = require('../schedulers/BaseballScheduler');
const SoftballScheduler = require('../schedulers/SoftballScheduler');
const GymnasticsScheduler = require('../schedulers/GymnasticsScheduler');
const WomensTennisScheduler = require('../schedulers/WomensTennisScheduler');
const MensTennisScheduler = require('../schedulers/MensTennisScheduler');
const LacrosseScheduler = require('../schedulers/LacrosseScheduler');

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
    this.register(8, FootballScheduler);       // Football - 9 conference games
    
    // Basketball (Split into Men's and Women's)
    this.register(2, MensBasketballScheduler);    // Men's Basketball
    this.register(3, WomensBasketballScheduler);  // Women's Basketball
    
    // Baseball & Softball (Series-based sports)
    this.register(1, BaseballScheduler);   // Baseball
    this.register(15, SoftballScheduler);  // Softball
    
    // Soccer (Women's - 16 teams)
    this.register(14, SoccerScheduler);          // Soccer - Round robin
    
    // Volleyball
    this.register(19, VolleyballScheduler);      // Volleyball
    
    // Tennis
    this.register(17, MensTennisScheduler);    // Men's Tennis - 8 matches, single round robin
    this.register(18, WomensTennisScheduler);  // Women's Tennis - 13 matches, travel partners
    
    // Other Sports
    this.register(11, GymnasticsScheduler);  // Gymnastics - Round robin meets
    this.register(13, LacrosseScheduler);    // Lacrosse - Round robin 6 teams
    this.register(20, WrestlingScheduler);   // Wrestling - Matrix with divisions
    
    logger.info('Registered default sport schedulers', {
      schedulers: Array.from(this.schedulers.keys()),
      count: this.schedulers.size
    });
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