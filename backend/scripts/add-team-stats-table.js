/**
 * Add Team Stats Table to Neon DB
 * 
 * This script adds a new table to track team statistics in the Neon DB.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../utils/logger');

async function addTeamStatsTable() {
  logger.info('Starting to add team stats table to Neon DB...');
  
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
    
    // Set the search path to use the user's schema
    await client.query(`SET search_path TO ${currentUser}, public;`);
    logger.info(`Set search path to: ${currentUser}, public`);
    
    // Check if team_stats table already exists
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = '${currentUser}'
        AND table_name = 'team_stats'
      );
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      logger.info('Team stats table already exists. Dropping it to recreate...');
      await client.query(`DROP TABLE IF EXISTS ${currentUser}.team_stats CASCADE;`);
    }
    
    // Create team_stats table
    await client.query(`
      CREATE TABLE ${currentUser}.team_stats (
        stat_id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        season VARCHAR(9) NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        points_scored INTEGER DEFAULT 0,
        points_allowed INTEGER DEFAULT 0,
        home_wins INTEGER DEFAULT 0,
        home_losses INTEGER DEFAULT 0,
        away_wins INTEGER DEFAULT 0,
        away_losses INTEGER DEFAULT 0,
        conference_wins INTEGER DEFAULT 0,
        conference_losses INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_team
          FOREIGN KEY(team_id) 
          REFERENCES ${currentUser}.teams(team_id)
          ON DELETE CASCADE,
        CONSTRAINT team_season_unique UNIQUE(team_id, season)
      );
    `);
    
    logger.info('Created team_stats table successfully');
    
    // Add some sample data for the 2025-2026 season
    await client.query(`
      INSERT INTO ${currentUser}.team_stats 
        (team_id, season, wins, losses, points_scored, points_allowed, 
         home_wins, home_losses, away_wins, away_losses, 
         conference_wins, conference_losses)
      VALUES
        (1, '2025-2026', 22, 8, 2100, 1850, 14, 2, 8, 6, 12, 6),
        (2, '2025-2026', 20, 10, 2050, 1900, 13, 3, 7, 7, 11, 7),
        (3, '2025-2026', 18, 12, 1980, 1950, 12, 4, 6, 8, 10, 8),
        (4, '2025-2026', 25, 5, 2200, 1800, 15, 1, 10, 4, 14, 4),
        (5, '2025-2026', 26, 4, 2250, 1780, 16, 0, 10, 4, 15, 3);
    `);
    
    logger.info('Added sample team stats data for 5 teams');
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Team stats table added to Neon DB successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to add team stats table: ${error.message}`);
    
    // Try to close the connection if it was opened
    try {
      await client.end();
    } catch (closeError) {
      // Ignore errors when closing
    }
    
    return false;
  }
}

// Run the script if executed directly
if (require.main === module) {
  addTeamStatsTable()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  addTeamStatsTable
};
