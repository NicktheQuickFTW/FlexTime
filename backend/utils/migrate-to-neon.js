/**
 * HELiiX Migration to Neon DB
 * 
 * This script migrates the PostgreSQL database schema to Neon DB,
 * restructuring as needed for the HELiiX platform requirements.
 */

const { Sequelize } = require('sequelize');
const neonConfig = require('../config/neon_db_config');
const logger = require('../scripts/logger');
const path = require('path');
const fs = require('fs');

// Models to migrate
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

async function migrateToNeon() {
  logger.info('Starting migration to Neon DB');
  
  try {
    // Create Sequelize instance with Neon DB connection string
    // Using direct connection string is more reliable for Neon DB
    const sequelize = new Sequelize(process.env.NEON_DB_CONNECTION_STRING, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: sql => logger.debug(sql),
      pool: neonConfig.pool
    });
    
    // Test connection
    await sequelize.authenticate();
    logger.info('Connection to Neon DB established successfully');
    
    // Get current user and schema
    const [userResult] = await sequelize.query('SELECT current_user;');
    const currentUser = userResult[0].current_user;
    logger.info(`Current database user: ${currentUser}`);
    
    // Set schema for the models
    const schema = currentUser;
    logger.info(`Using schema: ${schema}`);
    
    // Load models
    const models = {};
    
    for (const file of modelFiles) {
      const modelPath = path.join(__dirname, '../models', file);
      const model = require(modelPath)(sequelize, {
        schema: schema // Set schema for each model
      });
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
    
    // Create schema if it doesn't exist
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
    logger.info(`Ensured schema exists: ${schema}`);
    
    // Set search path to use the user's schema
    await sequelize.query(`SET search_path TO ${schema}, public;`);
    logger.info(`Set search path to: ${schema}, public`);
    
    // Sync database - this creates the tables based on the models
    logger.info('Creating database schema in Neon DB...');
    await sequelize.sync({ force: true });
    logger.info('Database schema created successfully');
    
    // Seed initial data if needed
    await seedInitialData(models);
    
    logger.info('Migration to Neon DB completed successfully');
    return true;
  } catch (error) {
    logger.error(`Migration to Neon DB failed: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
}

async function seedInitialData(models) {
  logger.info('Seeding initial data...');
  
  try {
    // Create default sport types
    const sports = [
      { name: 'Football', code: 'FB', season_type: 'fall' },
      { name: 'Men\'s Basketball', code: 'MBB', season_type: 'winter' },
      { name: 'Women\'s Basketball', code: 'WBB', season_type: 'winter' },
      { name: 'Volleyball', code: 'VB', season_type: 'fall' },
      { name: 'Baseball', code: 'BSB', season_type: 'spring' },
      { name: 'Softball', code: 'SB', season_type: 'spring' }
    ];
    
    for (const sport of sports) {
      await models.Sport.create(sport);
    }
    logger.info('Created default sports');
    
    // Create Big 12 championship
    const championship = await models.Championship.create({
      name: 'Big 12 Conference',
      code: 'BIG12',
      active: true
    });
    logger.info('Created Big 12 championship');
    
    // Load Big 12 teams if available
    try {
      const teamsModule = require('./seed-big12-teams');
      await teamsModule.seedBig12Teams(models, championship.championship_id);
      logger.info('Seeded Big 12 teams');
    } catch (error) {
      logger.warn(`Could not seed Big 12 teams: ${error.message}`);
    }
    
    logger.info('Initial data seeding completed');
  } catch (error) {
    logger.error(`Error seeding initial data: ${error.message}`);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToNeon()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unhandled error in migration: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  migrateToNeon
};
