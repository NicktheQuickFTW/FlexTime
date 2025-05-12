/**
 * Direct Neon DB Update Script
 * 
 * This script directly connects to the Neon DB and updates the schema
 * with the enhanced models for FlexTime.
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = console;

// Direct connection parameters
const DB_NAME = 'HELiiX';
const DB_USER = 'xii-os_owner';
const DB_PASSWORD = 'npg_4qYJFR0lneIg';
const DB_HOST = 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech';
const DB_PORT = 5432;

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

async function updateNeonDB() {
  logger.info('Starting direct Neon DB update');
  
  try {
    // Create Sequelize instance with direct configuration
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    });
    
    // Test connection
    await sequelize.authenticate();
    logger.info('Connection to Neon DB established successfully');
    
    // Load models
    const models = {};
    
    for (const file of modelFiles) {
      const modelPath = path.join(__dirname, '../models', file);
      if (fs.existsSync(modelPath)) {
        const model = require(modelPath)(sequelize);
        models[model.name] = model;
        logger.info(`Loaded model: ${model.name}`);
      } else {
        logger.warn(`Model file not found: ${modelPath}`);
      }
    }
    
    // Set up associations
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
        logger.info(`Set up associations for: ${modelName}`);
      }
    });
    
    // Create each model individually to handle dependencies properly
    logger.info('Creating/updating database schema in Neon DB...');
    
    // Create tables in order of dependencies
    await models.Sport.sync({ alter: true });
    logger.info('Sport table updated');
    
    await models.Institution.sync({ alter: true });
    logger.info('Institution table updated');
    
    await models.Venue.sync({ alter: true });
    logger.info('Venue table updated');
    
    await models.Team.sync({ alter: true });
    logger.info('Team table updated');
    
    await models.VenueUnavailability.sync({ alter: true });
    logger.info('VenueUnavailability table updated');
    
    await models.ScheduleConstraint.sync({ alter: true });
    logger.info('ScheduleConstraint table updated');
    
    await models.Schedule.sync({ alter: true });
    logger.info('Schedule table updated');
    
    await models.Game.sync({ alter: true });
    logger.info('Game table updated');
    
    logger.info('Database schema updated successfully');
    
    // Seed initial data
    await seedInitialData(models);
    
    logger.info('Neon DB update completed successfully');
    return true;
  } catch (error) {
    logger.error(`Neon DB update failed: ${error.message}`);
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
        media_requirements: JSON.stringify({
          tv_broadcast: true,
          streaming: true,
          priority_level: 'high'
        }),
        scheduling_constraints: JSON.stringify({
          max_consecutive_away: 2,
          prefer_saturday_games: true
        })
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
        media_requirements: JSON.stringify({
          tv_broadcast: true,
          streaming: true,
          priority_level: 'high'
        }),
        scheduling_constraints: JSON.stringify({
          max_consecutive_away: 3,
          rematch_separation_days: 14
        })
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
        media_requirements: JSON.stringify({
          tv_broadcast: true,
          streaming: true,
          priority_level: 'medium'
        }),
        scheduling_constraints: JSON.stringify({
          max_consecutive_away: 3,
          rematch_separation_days: 14
        })
      }
    ];
    
    // Add sports one by one to catch any validation errors
    for (const sport of sports) {
      try {
        await models.Sport.create(sport);
        logger.info(`Created sport: ${sport.name}`);
      } catch (error) {
        logger.error(`Error creating sport ${sport.name}: ${error.message}`);
      }
    }
    logger.info('Created default sports with enhanced scheduling data');
    
    // Create some sample institutions
    const institutions = [
      { name: 'Brigham Young University', abbreviation: 'BYU', code: 'BYU' },
      { name: 'Texas Christian University', abbreviation: 'TCU', code: 'TCU' },
      { name: 'University of Central Florida', abbreviation: 'UCF', code: 'UCF' },
      { name: 'University of Arizona', abbreviation: 'UA', code: 'UA' },
      { name: 'Arizona State University', abbreviation: 'ASU', code: 'ASU' }
    ];
    
    // Add institutions one by one to catch any validation errors
    for (const institution of institutions) {
      try {
        await models.Institution.create(institution);
        logger.info(`Created institution: ${institution.name}`);
      } catch (error) {
        logger.error(`Error creating institution ${institution.name}: ${error.message}`);
      }
    }
    logger.info('Created sample institutions');
    
    logger.info('Initial data seeding completed');
  } catch (error) {
    logger.error(`Error seeding initial data: ${error.message}`);
    throw error;
  }
}

// Run the update function
updateNeonDB()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
