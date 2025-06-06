/**
 * Create Neon DB Tables
 * 
 * This script creates the tables directly in the Neon DB using raw SQL queries
 * instead of relying on Sequelize's sync method, which requires public schema permissions.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../scripts/logger');

async function createNeonTables() {
  logger.info('Creating tables in Neon DB...');
  
  // Create a client with the direct connection string
  const client = new Client(process.env.NEON_DB_CONNECTION_STRING);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Get the current user
    const userResult = await client.query('SELECT current_user;');
    const currentUser = userResult.rows[0].current_user;
    logger.info(`Current user: ${currentUser}`);
    
    // Create a schema for the current user if it doesn't exist
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${currentUser};`);
    logger.info(`Created schema: ${currentUser}`);
    
    // Set the search path to use the user's schema
    await client.query(`SET search_path TO ${currentUser}, public;`);
    logger.info(`Set search path to: ${currentUser}, public`);
    
    // Drop existing tables if they exist
    await dropTables(client, currentUser);
    
    // Create tables in the user's schema
    await createSportTable(client, currentUser);
    await createChampionshipTable(client, currentUser);
    await createInstitutionTable(client, currentUser);
    await createTeamTable(client, currentUser);
    await createVenueTable(client, currentUser);
    await createVenueUnavailabilityTable(client, currentUser);
    await createScheduleTable(client, currentUser);
    await createConstraintTable(client, currentUser);
    await createGameTable(client, currentUser);
    
    // Seed initial data
    await seedInitialData(client, currentUser);
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Neon DB tables created successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to create Neon DB tables: ${error.message}`);
    
    // Try to close the connection if it was opened
    try {
      await client.end();
    } catch (closeError) {
      // Ignore errors when closing
    }
    
    return false;
  }
}

async function dropTables(client, schema) {
  // Drop tables in reverse order to avoid foreign key constraints
  const tables = [
    'games',
    'schedule_constraints',
    'schedule_teams',
    'schedules',
    'venue_unavailabilities',
    'venues',
    'teams',
    'institutions',
    'championships',
    'sports'
  ];
  
  for (const table of tables) {
    try {
      await client.query(`DROP TABLE IF EXISTS ${schema}.${table} CASCADE;`);
      logger.info(`Dropped table: ${table}`);
    } catch (error) {
      logger.warn(`Error dropping table ${table}: ${error.message}`);
    }
  }
}

async function createSportTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.sports (
      sport_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(10) NOT NULL UNIQUE,
      season_type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created sports table');
}

async function createChampionshipTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.championships (
      championship_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      code VARCHAR(10) NOT NULL UNIQUE,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created championships table');
}

async function createInstitutionTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.institutions (
      institution_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(50),
      code VARCHAR(10) NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created institutions table');
}

async function createTeamTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.teams (
      team_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      mascot VARCHAR(100),
      institution_id INTEGER REFERENCES ${schema}.institutions(institution_id),
      sport_id INTEGER REFERENCES ${schema}.sports(sport_id),
      championship_id INTEGER REFERENCES ${schema}.championships(championship_id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created teams table');
}

async function createVenueTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.venues (
      venue_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(100),
      state VARCHAR(50),
      capacity INTEGER,
      team_id INTEGER REFERENCES ${schema}.teams(team_id),
      supported_sports INTEGER[] DEFAULT '{}',
      venue_type VARCHAR(20),
      setup_time_required INTEGER,
      teardown_time_required INTEGER,
      media_facilities JSON,
      transport_hubs JSON,
      accessibility_features JSON,
      latitude NUMERIC(10,6),
      longitude NUMERIC(10,6),
      institution_id INTEGER REFERENCES ${schema}.institutions(institution_id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created venues table');
}

async function createVenueUnavailabilityTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.venue_unavailabilities (
      unavailability_id SERIAL PRIMARY KEY,
      venue_id INTEGER REFERENCES ${schema}.venues(venue_id),
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE NOT NULL,
      reason VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created venue_unavailabilities table');
}

async function createScheduleTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.schedules (
      schedule_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      sport_id INTEGER REFERENCES ${schema}.sports(sport_id),
      championship_id INTEGER REFERENCES ${schema}.championships(championship_id),
      season VARCHAR(20),
      status VARCHAR(20) DEFAULT 'draft',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created schedules table');
  
  // Create the schedules_teams join table
  const joinQuery = `
    CREATE TABLE ${schema}.schedule_teams (
      schedule_id INTEGER REFERENCES ${schema}.schedules(schedule_id),
      team_id INTEGER REFERENCES ${schema}.teams(team_id),
      PRIMARY KEY (schedule_id, team_id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(joinQuery);
  logger.info('Created schedule_teams join table');
}

async function createConstraintTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.schedule_constraints (
      constraint_id SERIAL PRIMARY KEY,
      schedule_id INTEGER REFERENCES ${schema}.schedules(schedule_id),
      constraint_type VARCHAR(50) NOT NULL,
      team_id INTEGER REFERENCES ${schema}.teams(team_id),
      opponent_id INTEGER REFERENCES ${schema}.teams(team_id),
      value TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created schedule_constraints table');
}

async function createGameTable(client, schema) {
  const query = `
    CREATE TABLE ${schema}.games (
      game_id SERIAL PRIMARY KEY,
      schedule_id INTEGER REFERENCES ${schema}.schedules(schedule_id),
      home_team_id INTEGER REFERENCES ${schema}.teams(team_id),
      away_team_id INTEGER REFERENCES ${schema}.teams(team_id),
      venue_id INTEGER REFERENCES ${schema}.venues(venue_id),
      date TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) DEFAULT 'scheduled',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(query);
  logger.info('Created games table');
}

async function seedInitialData(client, schema) {
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
      await client.query(`
        INSERT INTO ${schema}.sports (name, code, season_type)
        VALUES ($1, $2, $3);
      `, [sport.name, sport.code, sport.season_type]);
    }
    logger.info('Created default sports');
    
    // Create Big 12 championship
    await client.query(`
      INSERT INTO ${schema}.championships (name, code, active)
      VALUES ('Big 12 Conference', 'BIG12', TRUE);
    `);
    logger.info('Created Big 12 championship');
    
    logger.info('Initial data seeding completed');
  } catch (error) {
    logger.error(`Error seeding initial data: ${error.message}`);
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  createNeonTables()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  createNeonTables
};
