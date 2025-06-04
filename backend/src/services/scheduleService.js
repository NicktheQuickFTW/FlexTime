/**
 * Schedule Service for FlexTime
 * 
 * Provides an interface for accessing schedule data
 */

class ScheduleService {
  constructor(db) {
    this.Schedule = db?.Schedule;
    this.Game = db?.Game;
    this.db = db;
  }
  
  /**
   * Get a schedule by ID
   * @param {string} scheduleId - The ID of the schedule to retrieve
   * @returns {Promise<Object>} - The schedule data
   */
  async getScheduleById(scheduleId) {
    try {
      // Check if the DB connection is available
      if (!this.Schedule) {
        throw new Error('Database models not initialized');
      }
      
      // Fetch the schedule from the database
      const schedule = await this.Schedule.findByPk(scheduleId, {
        include: [{
          model: this.Game,
          as: 'games'
        }]
      });
      
      if (!schedule) {
        return null;
      }
      
      return schedule.toJSON();
    } catch (error) {
      console.error(`Error retrieving schedule ${scheduleId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get recent schedules
   * @param {number} limit - Maximum number of schedules to retrieve
   * @returns {Promise<Array>} - Array of schedule data
   */
  async getRecentSchedules(limit = 10) {
    try {
      // Check if the DB connection is available
      if (!this.Schedule) {
        throw new Error('Database models not initialized');
      }
      
      // Fetch recent schedules from the database
      const schedules = await this.Schedule.findAll({
        order: [['createdAt', 'DESC']],
        limit,
        include: [{
          model: this.Game,
          as: 'games'
        }]
      });
      
      return schedules.map(schedule => schedule.toJSON());
    } catch (error) {
      console.error('Error retrieving recent schedules:', error);
      throw error;
    }
  }
  
  /**
   * Initialize the service with the database connection
   * @param {Object} db - The database connection and models
   */
  initialize(db) {
    this.Schedule = db.Schedule;
    this.Game = db.Game;
    this.db = db;
  }
}

// Create a singleton instance
const scheduleService = new ScheduleService();

module.exports = scheduleService;