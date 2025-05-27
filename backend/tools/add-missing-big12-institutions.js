/**
 * Add Missing Big 12 Institutions Script for Neon DB
 * 
 * This script adds the missing Big 12 institutions to the database
 * and creates teams for them based on their sport sponsorships.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../utils/logger');

// Connection string from environment
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=prefer';

// Missing Big 12 institutions data
const missingInstitutions = [
  { name: 'Arizona', abbreviation: 'ARIZ', mascot: 'Wildcats', primaryColor: '#003366', secondaryColor: '#cc0033', city: 'Tucson', state: 'AZ', latitude: 32.2319, longitude: -110.9501 },
  { name: 'Arizona State', abbreviation: 'AZST', mascot: 'Sun Devils', primaryColor: '#8c1d40', secondaryColor: '#ffc627', city: 'Tempe', state: 'AZ', latitude: 33.4255, longitude: -111.9400 },
  { name: 'BYU', abbreviation: 'BYUU', mascot: 'Cougars', primaryColor: '#002e5d', secondaryColor: '#ffffff', city: 'Provo', state: 'UT', latitude: 40.2518, longitude: -111.6493 },
  { name: 'Cincinnati', abbreviation: 'CINN', mascot: 'Bearcats', primaryColor: '#e00122', secondaryColor: '#000000', city: 'Cincinnati', state: 'OH', latitude: 39.1329, longitude: -84.5150 },
  { name: 'Colorado', abbreviation: 'COLO', mascot: 'Buffaloes', primaryColor: '#cfb87c', secondaryColor: '#000000', city: 'Boulder', state: 'CO', latitude: 40.0076, longitude: -105.2659 },
  { name: 'Houston', abbreviation: 'HOUS', mascot: 'Cougars', primaryColor: '#c8102e', secondaryColor: '#76232f', city: 'Houston', state: 'TX', latitude: 29.7199, longitude: -95.3422 },
  { name: 'Iowa State', abbreviation: 'IAST', mascot: 'Cyclones', primaryColor: '#c8102e', secondaryColor: '#f1be48', city: 'Ames', state: 'IA', latitude: 42.0266, longitude: -93.6465 },
  { name: 'UCF', abbreviation: 'UCFL', mascot: 'Knights', primaryColor: '#000000', secondaryColor: '#b29d6c', city: 'Orlando', state: 'FL', latitude: 28.6024, longitude: -81.2001 },
  { name: 'Utah', abbreviation: 'UTAU', mascot: 'Utes', primaryColor: '#cc0000', secondaryColor: '#ffffff', city: 'Salt Lake City', state: 'UT', latitude: 40.7608, longitude: -111.8910 },
  { name: 'West Virginia', abbreviation: 'WVAU', mascot: 'Mountaineers', primaryColor: '#002855', secondaryColor: '#eaaa00', city: 'Morgantown', state: 'WV', latitude: 39.6480, longitude: -79.9559 }
];

// Sports sponsorship data for each institution
const institutionSports = {
  'Arizona': {
    men: ['BSB', 'MBB', 'MXC', 'FB', 'MGOLF', 'MSWIM', 'MTEN', 'MITF', 'MOTF'],
    women: ['WBB', 'BVB', 'WXC', 'WGOLF', 'GYM', 'SOC', 'SB', 'WSWIM', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'Arizona State': {
    men: ['BSB', 'MBB', 'MXC', 'FB', 'MGOLF', 'MSWIM', 'MTEN', 'MITF', 'MOTF', 'WREST'],
    women: ['WBB', 'BVB', 'WXC', 'WGOLF', 'GYM', 'LAX', 'SOC', 'SB', 'WSWIM', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'BYU': {
    men: ['BSB', 'MBB', 'MXC', 'FB', 'MGOLF', 'MSWIM', 'MTEN', 'MITF', 'MOTF'],
    women: ['WBB', 'WXC', 'WGOLF', 'GYM', 'SOC', 'SB', 'WSWIM', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'Cincinnati': {
    men: ['BSB', 'MBB', 'MXC', 'FB', 'MGOLF', 'MSWIM', 'MITF', 'MOTF'],
    women: ['WBB', 'WXC', 'WGOLF', 'LAX', 'SOC', 'WSWIM', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'Colorado': {
    men: ['MBB', 'MXC', 'FB', 'MGOLF', 'MITF', 'MOTF'],
    women: ['WBB', 'WXC', 'WGOLF', 'LAX', 'SOC', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'Houston': {
    men: ['BSB', 'MBB', 'MXC', 'FB', 'MGOLF', 'MITF', 'MOTF'],
    women: ['WBB', 'WXC', 'WGOLF', 'SOC', 'SB', 'WSWIM', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'Iowa State': {
    men: ['MBB', 'MXC', 'FB', 'MGOLF', 'MITF', 'MOTF', 'WREST'],
    women: ['WBB', 'WXC', 'WGOLF', 'GYM', 'SOC', 'SB', 'WSWIM', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'UCF': {
    men: ['BSB', 'MBB', 'FB', 'MGOLF', 'MTEN'],
    women: ['WBB', 'WXC', 'WGOLF', 'ROW', 'SOC', 'SB', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'Utah': {
    men: ['BSB', 'MBB', 'FB', 'MGOLF', 'MSWIM', 'MTEN'],
    women: ['WBB', 'BVB', 'WXC', 'GYM', 'SOC', 'SB', 'WSWIM', 'WTEN', 'WITF', 'WOTF', 'VB']
  },
  'West Virginia': {
    men: ['BSB', 'MBB', 'FB', 'MGOLF', 'MSWIM', 'WREST'],
    women: ['WBB', 'WXC', 'GYM', 'ROW', 'SOC', 'WSWIM', 'WTEN', 'WITF', 'WOTF', 'VB']
  }
};

// Team data template
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

async function addMissingInstitutions() {
  logger.info('Starting to add missing Big 12 institutions...');
  
  // Create a client with the direct connection string
  const client = new Client(connectionString);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Get all sports
    const sportsResult = await client.query(`
      SELECT sport_id, name, abbreviation FROM sports;
    `);
    
    // Create a map of sport abbreviations to IDs
    const sportMap = {};
    sportsResult.rows.forEach(sport => {
      sportMap[sport.abbreviation] = sport.sport_id;
    });
    
    // Process each missing institution
    for (const institution of missingInstitutions) {
      // Check if institution already exists
      const institutionResult = await client.query(`
        SELECT institution_id FROM institutions WHERE name = $1 LIMIT 1;
      `, [institution.name]);
      
      let institutionId;
      
      if (institutionResult.rows.length === 0) {
        // Create new institution
        const insertInstitutionResult = await client.query(`
          INSERT INTO institutions (
            name, abbreviation, mascot, primary_color, secondary_color,
            city, state, latitude, longitude,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING institution_id;
        `, [
          institution.name,
          institution.abbreviation,
          institution.mascot,
          institution.primaryColor,
          institution.secondaryColor,
          institution.city,
          institution.state,
          institution.latitude,
          institution.longitude
        ]);
        
        institutionId = insertInstitutionResult.rows[0].institution_id;
        logger.info(`Created institution: ${institution.name} (ID: ${institutionId})`);
      } else {
        institutionId = institutionResult.rows[0].institution_id;
        logger.info(`Institution ${institution.name} already exists (ID: ${institutionId})`);
      }
      
      // Get sports for this institution
      const institutionSportsList = institutionSports[institution.name];
      if (!institutionSportsList) {
        logger.warn(`No sports data found for ${institution.name}`);
        continue;
      }
      
      // Combine men's and women's sports
      const allSports = [...institutionSportsList.men, ...institutionSportsList.women];
      
      // Create teams for each sport
      for (const sportAbbreviation of allSports) {
        const sportId = sportMap[sportAbbreviation];
        
        if (!sportId) {
          logger.warn(`Sport ${sportAbbreviation} not found in database`);
          continue;
        }
        
        // Check if team already exists
        const teamResult = await client.query(`
          SELECT team_id FROM teams 
          WHERE institution_id = $1 AND sport_id = $2 LIMIT 1;
        `, [institutionId, sportId]);
        
        if (teamResult.rows.length === 0) {
          // Create new team
          const teamData = {
            ...teamDataTemplate,
            name: institution.name,
            code: sportAbbreviation
          };
          
          // Special case for Utah's Beach Volleyball team
          let notes = null;
          if (institution.name === 'Utah' && sportAbbreviation === 'BVB') {
            notes = 'Dropping after spring 2025 season';
          }
          
          // Insert team
          const insertTeamResult = await client.query(`
            INSERT INTO teams (
              name, institution_id, sport_id, season, time_zone,
              travel_constraints, rival_teams, scheduling_priority, 
              blackout_dates, media_contracts, code, notes,
              created_at, updated_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
              NOW(), NOW()
            )
            RETURNING team_id;
          `, [
            teamData.name, 
            institutionId, 
            sportId,
            teamData.season,
            teamData.timeZone,
            JSON.stringify(teamData.travelConstraints),
            '{1,2,3}', // Placeholder for rival_teams as integer array
            8, // Scheduling priority
            '{2024-12-24,2024-12-25,2025-01-01}', // Blackout dates as date array
            JSON.stringify(teamData.mediaContracts),
            teamData.code,
            notes
          ]);
          
          const teamId = insertTeamResult.rows[0].team_id;
          logger.info(`Created team: ${institution.name} ${sportAbbreviation} (ID: ${teamId})`);
        } else {
          // Update existing team if it's Utah's Beach Volleyball team
          if (institution.name === 'Utah' && sportAbbreviation === 'BVB') {
            const teamId = teamResult.rows[0].team_id;
            await client.query(`
              UPDATE teams 
              SET notes = 'Dropping after spring 2025 season' 
              WHERE team_id = $1;
            `, [teamId]);
            logger.info(`Updated Utah's Beach Volleyball team with note about dropping after spring 2025`);
          } else {
            logger.info(`Team already exists for ${institution.name} ${sportAbbreviation}`);
          }
        }
      }
    }
    
    // Get count of institutions and teams
    const institutionsResult = await client.query(`
      SELECT COUNT(*) FROM institutions;
    `);
    
    const teamsResult = await client.query(`
      SELECT COUNT(*) FROM teams;
    `);
    
    logger.info(`Total institutions: ${institutionsResult.rows[0].count}`);
    logger.info(`Total teams: ${teamsResult.rows[0].count}`);
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Missing Big 12 institutions update completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to add missing institutions: ${error.message}`);
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
  addMissingInstitutions()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  addMissingInstitutions
};
