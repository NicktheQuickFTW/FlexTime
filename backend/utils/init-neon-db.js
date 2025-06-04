/**
 * HELiiX Neon DB Initialization
 * 
 * This script initializes the Neon DB schema for the HELiiX scheduling service,
 * creating all necessary tables and relationships.
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Models to initialize
const modelFiles = [
  'db-sport.js',
  'db-institution.js',
  'db-team.js',
  'db-venue.js',
  'db-venue-unavailability.js',
  'db-constraint.js',
  'db-schedule.js',
  'db-game.js'
];

async function initializeNeonDB() {
  logger.info('Starting Neon DB initialization');
  
  // Ask for confirmation before proceeding
  const confirmed = await confirmAction('This will reset the database. Are you sure you want to continue? (y/n): ');
  if (!confirmed) {
    logger.info('Database initialization canceled');
    return false;
  }
  
  try {
    // Create Sequelize instance with hardcoded configuration to ensure connection
    const sequelize = new Sequelize('HELiiX', 'xii-os_owner', 'npg_4qYJFR0lneIg', {
      host: 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech',
      port: 5432,
      dialect: 'postgres', 
      dialectOptions: {
        ssl: false
      },
      logging: sql => logger.debug(sql),
      pool: {
        max: 20,
        min: 0,
        idle: 10000,
        acquire: 30000
      }
    });
    
    // Test connection
    await sequelize.authenticate();
    logger.info('Connection to Neon DB established successfully');
    
    // Load models
    const models = {};
    
    for (const file of modelFiles) {
      const modelPath = path.join(__dirname, '../models', file);
      const model = require(modelPath)(sequelize);
      models[model.name] = model;
      logger.info(`Loaded model: ${model.name}`);
    }
    
    // Set up associations
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
        logger.info(`Set up associations for: ${modelName}`);
      }
    });
    
    // Sync database - this creates the tables based on the models
    logger.info('Creating database schema in Neon DB...');
    await sequelize.sync({ force: true });
    logger.info('Database schema created successfully');
    
    // Seed initial data
    await seedInitialData(models);
    
    logger.info('Neon DB initialization completed successfully');
    return true;
  } catch (error) {
    logger.error(`Neon DB initialization failed: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
}

async function seedInitialData(models) {
  logger.info('Seeding initial data...');
  
  try {
    // Create default sport types with enhanced fields
    const sports = [
      { 
        name: 'Football', 
        abbreviation: 'FB', 
        type: 'men',
        team_based: true,
        active: true,
        season_start_month: 8,
        season_end_month: 12,
        default_days_between_games: 7,
        typical_game_duration: 210,
        max_games_per_week: 1,
        is_winter_sport: false,
        conference_games_count: 9,
        media_requirements: {
          tv_broadcast: true,
          streaming: true,
          priority_level: 'high'
        },
        scheduling_constraints: {
          max_consecutive_away: 2,
          prefer_saturday_games: true
        }
      },
      { 
        name: 'Men\'s Basketball', 
        abbreviation: 'MBB', 
        type: 'men',
        team_based: true,
        active: true,
        season_start_month: 11,
        season_end_month: 3,
        default_days_between_games: 3,
        typical_game_duration: 120,
        max_games_per_week: 2,
        is_winter_sport: true,
        conference_games_count: 18,
        media_requirements: {
          tv_broadcast: true,
          streaming: true,
          priority_level: 'high'
        },
        scheduling_constraints: {
          max_consecutive_away: 3,
          rematch_separation_days: 14
        }
      },
      { 
        name: 'Women\'s Basketball', 
        abbreviation: 'WBB', 
        type: 'women',
        team_based: true,
        active: true,
        season_start_month: 11,
        season_end_month: 3,
        default_days_between_games: 3,
        typical_game_duration: 120,
        max_games_per_week: 2,
        is_winter_sport: true,
        conference_games_count: 18,
        media_requirements: {
          tv_broadcast: true,
          streaming: true,
          priority_level: 'medium'
        },
        scheduling_constraints: {
          max_consecutive_away: 3,
          rematch_separation_days: 14
        }
      },
      { 
        name: 'Volleyball', 
        abbreviation: 'VB', 
        type: 'women',
        team_based: true,
        active: true,
        season_start_month: 8,
        season_end_month: 12,
        default_days_between_games: 2,
        typical_game_duration: 120,
        max_games_per_week: 3,
        is_winter_sport: false,
        conference_games_count: 18,
        media_requirements: {
          tv_broadcast: false,
          streaming: true,
          priority_level: 'medium'
        }
      },
      { 
        name: 'Baseball', 
        abbreviation: 'BSB', 
        type: 'men',
        team_based: true,
        active: true,
        season_start_month: 2,
        season_end_month: 6,
        default_days_between_games: 1,
        typical_game_duration: 180,
        max_games_per_week: 5,
        is_winter_sport: false,
        conference_games_count: 24,
        media_requirements: {
          tv_broadcast: false,
          streaming: true,
          priority_level: 'medium'
        },
        scheduling_constraints: {
          series_based: true,
          series_length: 3
        }
      },
      { 
        name: 'Softball', 
        abbreviation: 'SB', 
        type: 'women',
        team_based: true,
        active: true,
        season_start_month: 2,
        season_end_month: 5,
        default_days_between_games: 1,
        typical_game_duration: 150,
        max_games_per_week: 5,
        is_winter_sport: false,
        conference_games_count: 24,
        media_requirements: {
          tv_broadcast: false,
          streaming: true,
          priority_level: 'medium'
        },
        scheduling_constraints: {
          series_based: true,
          series_length: 3
        }
      }
    ];
    
    for (const sport of sports) {
      await models.Sport.create(sport);
    }
    logger.info('Created default sports with enhanced scheduling data');
    
    // Create some sample institutions
    const institutions = [
      { name: 'Brigham Young University', short_name: 'BYU', code: 'BYU' },
      { name: 'Texas Christian University', short_name: 'TCU', code: 'TCU' },
      { name: 'University of Central Florida', short_name: 'UCF', code: 'UCF' },
      { name: 'University of Arizona', short_name: 'U of A', code: 'UA' },
      { name: 'Arizona State University', short_name: 'ASU', code: 'ASU' }
    ];
    
    for (const institution of institutions) {
      await models.Institution.create(institution);
    }
    logger.info('Created sample institutions');
    
    logger.info('Initial data seeding completed');
  } catch (error) {
    logger.error(`Error seeding initial data: ${error.message}`);
    throw error;
  }
}

function confirmAction(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeNeonDB()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unhandled error in initialization: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  initializeNeonDB
};
