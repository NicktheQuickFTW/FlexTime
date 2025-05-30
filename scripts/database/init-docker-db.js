#!/usr/bin/env node

/**
 * FlexTime Docker PostgreSQL Database Initialization
 * 
 * This script initializes the PostgreSQL database with all required tables
 * in the correct order to satisfy foreign key constraints.
 * It integrates with Context7 MCP for documentation and insights.
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const { connectToDockerPostgres } = require('../utils/docker-db-connector');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const modelsDir = path.join(__dirname, '../models');

// Logger configuration
const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Context7 MCP client configuration
const CONTEXT7_MCP_URL = process.env.CONTEXT7_MCP_URL || 'http://context7-mcp-server:5000';

/**
 * Connect to the Context7 MCP server and retrieve documentation
 * @param {string} topic - Topic to search for in the documentation
 * @returns {Promise<Object>} - Documentation data
 */
async function getContext7Documentation(topic) {
  try {
    // First check if MCP server is available
    const statusRes = await axios.get(`${CONTEXT7_MCP_URL}/status`);
    logger.info(`Context7 MCP Status: ${statusRes.data.status}`);
    
    // Get the library ID for PostgreSQL
    const libraryRes = await axios.post(`${CONTEXT7_MCP_URL}/resolve-library-id`, {
      libraryName: 'postgresql'
    });
    
    if (libraryRes.data.libraries && libraryRes.data.libraries.length > 0) {
      const libraryId = libraryRes.data.libraries[0].id;
      logger.info(`Retrieved Context7 library ID: ${libraryId}`);
      
      // Get documentation for the topic
      const docsRes = await axios.post(`${CONTEXT7_MCP_URL}/get-library-docs`, {
        context7CompatibleLibraryID: libraryId,
        topic: topic,
        tokens: 2000
      });
      
      return docsRes.data;
    } else {
      logger.warn('No PostgreSQL library found in Context7 MCP');
      return null;
    }
  } catch (error) {
    logger.error(`Error connecting to Context7 MCP: ${error.message}`);
    return null;
  }
}

/**
 * Initialize the database tables in correct dependency order
 */
async function initializeDatabase() {
  logger.info('Starting FlexTime Docker PostgreSQL initialization');
  
  try {
    // Get database documentation from Context7 MCP
    const dbDocs = await getContext7Documentation('sequelize postgres schema');
    if (dbDocs) {
      logger.info('Retrieved database documentation from Context7 MCP');
    }

    // Connect to the database
    const sequelize = await connectToDockerPostgres();
    
    // First, drop the championships and seasons tables if they exist
    logger.info('Dropping any existing championship/season tables...');
    await sequelize.query('DROP TABLE IF EXISTS championships CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS seasons CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_seasons_status');
    
    // Load and initialize models
    const models = {};
    const modelFiles = [
      { name: 'Sport', file: 'db-sport.js' },
      { name: 'Institution', file: 'db-institution.js' },
      { name: 'Team', file: 'db-team.js' },
      { name: 'Venue', file: 'db-venue.js' },
      { name: 'VenueUnavailability', file: 'db-venue-unavailability.js' },
      { name: 'ScheduleConstraint', file: 'db-constraint.js' },
      { name: 'Schedule', file: 'db-schedule.js' },
      { name: 'Game', file: 'db-game.js' }
    ];
    
    // Initialize all models
    logger.info('Initializing models...');
    for (const model of modelFiles) {
      const modelPath = path.join(modelsDir, model.file);
      if (fs.existsSync(modelPath)) {
        models[model.name] = require(modelPath)(sequelize);
        logger.info(`Loaded model: ${model.name}`);
      } else {
        logger.warn(`Model file not found: ${model.file}`);
      }
    }
    
    // Initialize model associations
    logger.info('Setting up model associations...');
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        models[modelName].associate(models);
      }
    });
    
    // Sync models in the correct order to respect foreign key constraints
    logger.info('Syncing models with database in correct order...');
    
    // 1. Sports - No foreign keys
    await models.Sport.sync({ force: true });
    logger.info('Created Sports table');
    
    // 2. Institutions - No foreign keys
    await models.Institution.sync({ force: true });
    logger.info('Created Institutions table');
    
    // 3. Teams - Depends on Institutions and Sports
    await models.Team.sync({ force: true });
    logger.info('Created Teams table');
    
    // 4. Venues - Depends on Teams
    await models.Venue.sync({ force: true });
    logger.info('Created Venues table');
    
    // 5. Venue Unavailability - Depends on Venues
    await models.VenueUnavailability.sync({ force: true });
    logger.info('Created Venue Unavailability table');
    
    // 6. Schedule Constraints - No direct foreign keys
    await models.ScheduleConstraint.sync({ force: true });
    logger.info('Created Schedule Constraints table');
    
    // 7. Schedules - Depends on Sports
    await models.Schedule.sync({ force: true });
    logger.info('Created Schedules table');
    
    // 8. Games - Depends on Schedules, Teams, and Venues
    await models.Game.sync({ force: true });
    logger.info('Created Games table');
    
    logger.info('All tables created successfully');
    
    // Seed initial data
    await seedTestData(models);
    logger.info('Seeded initial test data');
    
    return true;
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
}

/**
 * Seed test data into the database
 * @param {Object} models - Database models object
 */
async function seedTestData(models) {
  const { Sport, Institution, Team, Venue } = models;
  
  logger.info('Seeding initial test data...');
  
  try {
    // Create basic sports
    const sports = [
      { name: "Men's Basketball", abbreviation: 'MBB', type: 'men', team_based: true },
      { name: 'Football', abbreviation: 'FB', type: 'men', team_based: true },
      { name: "Women's Basketball", abbreviation: 'WBB', type: 'women', team_based: true }
    ];
    
    for (const sportData of sports) {
      await Sport.create(sportData);
    }
    logger.info('Created sports');
    
    // Get Men's Basketball sport ID for later use
    const menBasketballSport = await Sport.findOne({ where: { abbreviation: 'MBB' } });
    const menBasketballSportId = menBasketballSport.sport_id;
    
    // Create a few sample institutions and teams based on Big 12 data
    const teams = [
      {
        institution: {
          name: 'Kansas',
          abbreviation: 'KU',
          city: 'Lawrence',
          state: 'KS'
        },
        team: {
          name: 'Kansas Jayhawks',
          code: 'KU',
          status: 'confirmed'
        },
        venue: {
          name: 'Allen Fieldhouse',
          city: 'Lawrence',
          state: 'KS',
          capacity: 16300
        }
      },
      {
        institution: {
          name: 'Texas Tech',
          abbreviation: 'TTU',
          city: 'Lubbock',
          state: 'TX'
        },
        team: {
          name: 'Texas Tech Red Raiders',
          code: 'TTU',
          status: 'confirmed'
        },
        venue: {
          name: 'United Supermarkets Arena',
          city: 'Lubbock',
          state: 'TX',
          capacity: 15098
        }
      },
      {
        institution: {
          name: 'Baylor',
          abbreviation: 'BU',
          city: 'Waco',
          state: 'TX'
        },
        team: {
          name: 'Baylor Bears',
          code: 'BU',
          status: 'confirmed'
        },
        venue: {
          name: 'Foster Pavilion',
          city: 'Waco',
          state: 'TX',
          capacity: 7000
        }
      }
    ];
    
    // Create the sample teams
    for (const teamData of teams) {
      // Create institution
      const institution = await Institution.create(teamData.institution);
      
      // Create team with the season info (using winter sport format for basketball)
      const team = await Team.create({
        ...teamData.team,
        school_id: institution.school_id,
        sport_id: menBasketballSportId,
        season: '2024-25'  // Format for winter sports is yyyy-yy
      });
      
      // Create venue for the team
      await Venue.create({
        ...teamData.venue,
        school_id: institution.school_id,
        team_id: team.team_id
      });
    }
    
    logger.info('Created institutions, teams, and venues');
    
    return true;
  } catch (error) {
    logger.error(`Error seeding test data: ${error.message}`);
    throw error;
  }
}

// Run the initialization if the script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (success) {
        logger.info('Database initialization completed successfully');
        process.exit(0);
      } else {
        logger.error('Database initialization failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  initializeDatabase
};
