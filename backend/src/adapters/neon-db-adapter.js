/**
 * Neon DB Adapter for HELiiX Scheduling Service
 * 
 * This module provides an adapter for interacting with the Neon DB,
 * abstracting database operations for the scheduling service.
 */

const { Sequelize, Op } = require('sequelize');
const neonConfig = require('../config/neon_db_config');
const logger = require('../utils/logger');

class NeonDBAdapter {
  /**
   * Create a new Neon DB Adapter
   * @param {Object} config - Configuration options (optional, defaults to neonConfig)
   */
  constructor(config = {}) {
    this.config = {
      ...neonConfig,
      ...config
    };
    
    this.sequelize = null;
    this.models = {};
    this.initialized = false;
  }
  
  /**
   * Initialize the adapter and connect to the database
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }
      
      logger.info('Initializing Neon DB Adapter');
      
      // Create Sequelize instance
      this.sequelize = new Sequelize(
        this.config.connection.database,
        this.config.connection.username,
        this.config.connection.password,
        {
          host: this.config.connection.host,
          port: this.config.connection.port,
          dialect: 'postgres',
          dialectOptions: this.config.connection.dialectOptions,
          logging: this.config.logging ? sql => logger.debug(sql) : false,
          pool: this.config.pool
        }
      );
      
      // Test connection
      await this.sequelize.authenticate();
      logger.info('Connected to Neon DB successfully');
      
      // Load models
      this._loadModels();
      
      this.initialized = true;
      logger.info('Neon DB Adapter initialized successfully');
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Neon DB Adapter: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load all models from the models directory
   * @private
   */
  _loadModels() {
    const modelFiles = [
      'db-sport.js',
      'db-championship.js',
      'db-institution.js',
      'db-team.js',
      'db-venue.js',
      'db-venue-unavailability.js',
      'db-constraint.js',
      'db-schedule.js',
      'db-game.js'
    ];
    
    const path = require('path');
    
    for (const file of modelFiles) {
      const modelPath = path.join(__dirname, '../models', file);
      const model = require(modelPath)(this.sequelize);
      this.models[model.name] = model;
    }
    
    // Set up associations
    Object.keys(this.models).forEach(modelName => {
      if (this.models[modelName].associate) {
        this.models[modelName].associate(this.models);
      }
    });
    
    logger.info(`Loaded ${Object.keys(this.models).length} models`);
  }
  
  /**
   * Get a model by name
   * @param {string} modelName - Name of the model to get
   * @returns {Object} The model
   */
  getModel(modelName) {
    if (!this.initialized) {
      throw new Error('Neon DB Adapter not initialized');
    }
    
    if (!this.models[modelName]) {
      throw new Error(`Model ${modelName} not found`);
    }
    
    return this.models[modelName];
  }
  
  /**
   * Get all schedules
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Schedules
   */
  async getSchedules(options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const Schedule = this.getModel('Schedule');
    
    const queryOptions = {
      include: [
        { model: this.models.Sport, as: 'sport' },
        { model: this.models.Championship, as: 'championship' }
      ],
      ...options
    };
    
    return Schedule.findAll(queryOptions);
  }
  
  /**
   * Get a schedule by ID
   * @param {number} id - Schedule ID
   * @returns {Promise<Object>} Schedule
   */
  async getScheduleById(id) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const Schedule = this.getModel('Schedule');
    
    return Schedule.findByPk(id, {
      include: [
        { model: this.models.Sport, as: 'sport' },
        { model: this.models.Championship, as: 'championship' },
        { model: this.models.Team, as: 'teams' },
        { model: this.models.ScheduleConstraint, as: 'constraints' }
      ]
    });
  }
  
  /**
   * Create a new schedule
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} Created schedule
   */
  async createSchedule(scheduleData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const Schedule = this.getModel('Schedule');
    
    // Start a transaction
    const transaction = await this.sequelize.transaction();
    
    try {
      // Create the schedule
      const schedule = await Schedule.create(scheduleData, { transaction });
      
      // Add teams if provided
      if (scheduleData.teams && scheduleData.teams.length > 0) {
        await schedule.setTeams(scheduleData.teams, { transaction });
      }
      
      // Add constraints if provided
      if (scheduleData.constraints && scheduleData.constraints.length > 0) {
        const ScheduleConstraint = this.getModel('ScheduleConstraint');
        
        for (const constraint of scheduleData.constraints) {
          await ScheduleConstraint.create({
            ...constraint,
            schedule_id: schedule.schedule_id
          }, { transaction });
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      // Return the created schedule with associations
      return this.getScheduleById(schedule.schedule_id);
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      logger.error(`Failed to create schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a schedule
   * @param {number} id - Schedule ID
   * @param {Object} scheduleData - Updated schedule data
   * @returns {Promise<Object>} Updated schedule
   */
  async updateSchedule(id, scheduleData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const Schedule = this.getModel('Schedule');
    
    // Start a transaction
    const transaction = await this.sequelize.transaction();
    
    try {
      // Get the schedule
      const schedule = await Schedule.findByPk(id);
      
      if (!schedule) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      
      // Update the schedule
      await schedule.update(scheduleData, { transaction });
      
      // Update teams if provided
      if (scheduleData.teams) {
        await schedule.setTeams(scheduleData.teams, { transaction });
      }
      
      // Update constraints if provided
      if (scheduleData.constraints) {
        const ScheduleConstraint = this.getModel('ScheduleConstraint');
        
        // Remove existing constraints
        await ScheduleConstraint.destroy({
          where: { schedule_id: id },
          transaction
        });
        
        // Add new constraints
        for (const constraint of scheduleData.constraints) {
          await ScheduleConstraint.create({
            ...constraint,
            schedule_id: id
          }, { transaction });
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      // Return the updated schedule with associations
      return this.getScheduleById(id);
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      logger.error(`Failed to update schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a schedule
   * @param {number} id - Schedule ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async deleteSchedule(id) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const Schedule = this.getModel('Schedule');
    
    // Start a transaction
    const transaction = await this.sequelize.transaction();
    
    try {
      // Get the schedule
      const schedule = await Schedule.findByPk(id);
      
      if (!schedule) {
        throw new Error(`Schedule with ID ${id} not found`);
      }
      
      // Delete the schedule's games
      const Game = this.getModel('Game');
      await Game.destroy({
        where: { schedule_id: id },
        transaction
      });
      
      // Delete the schedule's constraints
      const ScheduleConstraint = this.getModel('ScheduleConstraint');
      await ScheduleConstraint.destroy({
        where: { schedule_id: id },
        transaction
      });
      
      // Delete the schedule
      await schedule.destroy({ transaction });
      
      // Commit the transaction
      await transaction.commit();
      
      return true;
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      logger.error(`Failed to delete schedule: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get games for a schedule
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<Array>} Games
   */
  async getScheduleGames(scheduleId) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const Game = this.getModel('Game');
    
    return Game.findAll({
      where: { schedule_id: scheduleId },
      include: [
        { model: this.models.Team, as: 'homeTeam' },
        { model: this.models.Team, as: 'awayTeam' },
        { model: this.models.Venue, as: 'venue' }
      ],
      order: [['date', 'ASC']]
    });
  }
  
  /**
   * Add a game to a schedule
   * @param {number} scheduleId - Schedule ID
   * @param {Object} gameData - Game data
   * @returns {Promise<Object>} Created game
   */
  async addGameToSchedule(scheduleId, gameData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const Game = this.getModel('Game');
    
    // Create the game
    const game = await Game.create({
      ...gameData,
      schedule_id: scheduleId
    });
    
    // Return the created game with associations
    return Game.findByPk(game.game_id, {
      include: [
        { model: this.models.Team, as: 'homeTeam' },
        { model: this.models.Team, as: 'awayTeam' },
        { model: this.models.Venue, as: 'venue' }
      ]
    });
  }
  
  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.initialized = false;
      logger.info('Neon DB connection closed');
    }
  }
}

module.exports = NeonDBAdapter;
