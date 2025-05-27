/**
 * Additional Teams Seed Script for Neon DB
 * 
 * This script populates the Neon DB with teams for all sports
 * for each Big 12 institution.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../utils/logger');

// Connection string from environment
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=prefer';

// List of Big 12 institutions to create teams for
const big12Institutions = [
  'Texas Tech',
  'Baylor',
  'TCU',
  'Oklahoma',
  'Oklahoma State',
  'Kansas',
  'K-State'
];

// Common team data template
const teamDataTemplate = {
  season: '2024-25',
  timeZone: 'America/Chicago',
  travelConstraints: {
    maxTravelDistance: 1500,
    preferredTravelDays: ['Thursday', 'Friday']
  },
  schedulingPriorities: {
    homeGamesWeighted: 0.7,
    rivalGamesWeighted: 0.8
  },
  blackoutDates: ['2024-12-24', '2024-12-25', '2025-01-01'],
  mediaContracts: {
    espn: true,
    fox: true,
    streamingServices: ['ESPN+']
  }
};

async function seedAdditionalTeams() {
  logger.info('Starting additional teams seed for Neon DB...');
  
  // Create a client with the direct connection string
  const client = new Client(connectionString);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Get all sports
    const sportsResult = await client.query(`
      SELECT sport_id, name, abbreviation, type FROM sports ORDER BY sport_id;
    `);
    
    const sports = sportsResult.rows;
    logger.info(`Found ${sports.length} sports`);
    
    // Process each institution
    for (const institutionName of big12Institutions) {
      // Get institution ID
      const institutionResult = await client.query(`
        SELECT institution_id FROM institutions WHERE name = $1 LIMIT 1;
      `, [institutionName]);
      
      if (institutionResult.rows.length === 0) {
        logger.warn(`Institution ${institutionName} not found, skipping`);
        continue;
      }
      
      const institutionId = institutionResult.rows[0].institution_id;
      logger.info(`Processing institution: ${institutionName} (ID: ${institutionId})`);
      
      // Process each sport
      for (const sport of sports) {
        // Skip sports that don't apply to this institution (e.g., some schools might not have certain sports)
        // For simplicity, we'll create teams for all sports for all institutions
        
        // Check if team already exists
        const teamResult = await client.query(`
          SELECT team_id FROM teams 
          WHERE institution_id = $1 AND sport_id = $2 LIMIT 1;
        `, [institutionId, sport.sport_id]);
        
        if (teamResult.rows.length === 0) {
          // Create new team
          const teamData = {
            ...teamDataTemplate,
            name: institutionName,
            code: sport.abbreviation,
            sport_id: sport.sport_id
          };
          
          // Insert team
          const insertTeamResult = await client.query(`
            INSERT INTO teams (
              name, institution_id, sport_id, season, time_zone,
              travel_constraints, rival_teams, scheduling_priority, 
              blackout_dates, media_contracts, code,
              created_at, updated_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
              NOW(), NOW()
            )
            RETURNING team_id;
          `, [
            teamData.name, 
            institutionId, 
            teamData.sport_id,
            teamData.season,
            teamData.timeZone,
            JSON.stringify(teamData.travelConstraints),
            '{1,2,3}', // Placeholder for rival_teams as integer array
            8, // Scheduling priority
            '{2024-12-24,2024-12-25,2025-01-01}', // Blackout dates as date array
            JSON.stringify(teamData.mediaContracts),
            teamData.code
          ]);
          
          const teamId = insertTeamResult.rows[0].team_id;
          logger.info(`Created team: ${institutionName} ${sport.name} (ID: ${teamId})`);
        } else {
          logger.info(`Team already exists for ${institutionName} ${sport.name}`);
        }
      }
    }
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Additional teams seed completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to seed additional teams: ${error.message}`);
    logger.error(error.stack);
    
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
  seedAdditionalTeams()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  seedAdditionalTeams
};
