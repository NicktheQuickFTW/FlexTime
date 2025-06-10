/**
 * Affiliate Members Update Script for Neon DB
 * 
 * This script adds affiliate members to the database and creates
 * appropriate teams for them based on their sport affiliations.
 * It also adds notes about Utah dropping beach volleyball.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('/Users/nickw/Documents/GitHub/Flextime/FlexTime/utils/logger.js');

// Connection string from environment
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=prefer';

// Affiliate members data
const affiliateMembers = [
  // Wrestling affiliates
  { name: 'Air Force', abbreviation: 'AF', mascot: 'Falcons', primaryColor: '#004f9f', secondaryColor: '#ffffff', city: 'Colorado Springs', state: 'CO', latitude: 38.9983, longitude: -104.8613, sports: ['WREST'] },
  { name: 'California Baptist', abbreviation: 'CBU', mascot: 'Lancers', primaryColor: '#00247d', secondaryColor: '#ffd100', city: 'Riverside', state: 'CA', latitude: 33.9381, longitude: -117.4255, sports: ['WREST'] },
  { name: 'Missouri', abbreviation: 'MIZZ', mascot: 'Tigers', primaryColor: '#f1b82d', secondaryColor: '#000000', city: 'Columbia', state: 'MO', latitude: 38.9404, longitude: -92.3277, sports: ['WREST'] },
  { name: 'North Dakota State', abbreviation: 'NDSU', mascot: 'Bison', primaryColor: '#005643', secondaryColor: '#ffc82e', city: 'Fargo', state: 'ND', latitude: 46.8772, longitude: -96.7898, sports: ['WREST'] },
  { name: 'Northern Colorado', abbreviation: 'UNC', mascot: 'Bears', primaryColor: '#013c65', secondaryColor: '#f6b000', city: 'Greeley', state: 'CO', latitude: 40.4044, longitude: -104.6970, sports: ['WREST'] },
  { name: 'Northern Iowa', abbreviation: 'UNI', mascot: 'Panthers', primaryColor: '#4b116f', secondaryColor: '#ffcc00', city: 'Cedar Falls', state: 'IA', latitude: 42.5109, longitude: -92.4632, sports: ['WREST'] },
  { name: 'Oklahoma', abbreviation: 'OU', mascot: 'Sooners', primaryColor: '#841617', secondaryColor: '#ffffff', city: 'Norman', state: 'OK', latitude: 35.2226, longitude: -97.4395, sports: ['WREST'] },
  { name: 'South Dakota State', abbreviation: 'SDSU', mascot: 'Jackrabbits', primaryColor: '#0033a0', secondaryColor: '#ffc72c', city: 'Brookings', state: 'SD', latitude: 44.3114, longitude: -96.7984, sports: ['WREST'] },
  { name: 'Utah Valley', abbreviation: 'UVU', mascot: 'Wolverines', primaryColor: '#275d38', secondaryColor: '#ffffff', city: 'Orem', state: 'UT', latitude: 40.2969, longitude: -111.6946, sports: ['WREST'] },
  { name: 'Wyoming', abbreviation: 'WYO', mascot: 'Cowboys', primaryColor: '#492f24', secondaryColor: '#ffc425', city: 'Laramie', state: 'WY', latitude: 41.3149, longitude: -105.5666, sports: ['WREST'] },
  
  // Other women's sport affiliates
  { name: 'Fresno State', abbreviation: 'FRES', mascot: 'Bulldogs', primaryColor: '#db0032', secondaryColor: '#231f20', city: 'Fresno', state: 'CA', latitude: 36.8086, longitude: -119.7455, sports: ['EQ'] },
  { name: 'Denver', abbreviation: 'DEN', mascot: 'Pioneers', primaryColor: '#8b2332', secondaryColor: '#8a8d8f', city: 'Denver', state: 'CO', latitude: 39.6766, longitude: -104.9619, sports: ['GYM'] },
  { name: 'Florida', abbreviation: 'UF', mascot: 'Gators', primaryColor: '#0021a5', secondaryColor: '#fa4616', city: 'Gainesville', state: 'FL', latitude: 29.6436, longitude: -82.3549, sports: ['LAX'] },
  { name: 'San Diego State', abbreviation: 'SDGST', mascot: 'Aztecs', primaryColor: '#a6192e', secondaryColor: '#000000', city: 'San Diego', state: 'CA', latitude: 32.7757, longitude: -117.0719, sports: ['LAX'] },
  { name: 'UC Davis', abbreviation: 'UCD', mascot: 'Aggies', primaryColor: '#002855', secondaryColor: '#b3a369', city: 'Davis', state: 'CA', latitude: 38.5382, longitude: -121.7617, sports: ['LAX'] },
  { name: 'Old Dominion', abbreviation: 'ODU', mascot: 'Monarchs', primaryColor: '#003057', secondaryColor: '#7c9bbd', city: 'Norfolk', state: 'VA', latitude: 36.8855, longitude: -76.3058, sports: ['ROW'] },
  { name: 'Tulsa', abbreviation: 'TUL', mascot: 'Golden Hurricane', primaryColor: '#002d72', secondaryColor: '#c8102e', city: 'Tulsa', state: 'OK', latitude: 36.1540, longitude: -95.9928, sports: ['ROW'] }
];

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

async function updateAffiliateMembers() {
  logger.info('Starting affiliate members update...');
  
  // Create a client with the direct connection string
  const client = new Client(connectionString);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // First, add the necessary columns to the tables
    logger.info('Adding necessary columns to tables...');
    
    try {
      // Add is_affiliate column to institutions table
      await client.query(`
        ALTER TABLE institutions ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN DEFAULT false;
      `);
      logger.info('Added is_affiliate column to institutions table');
      
      // Add is_affiliate and notes columns to teams table
      await client.query(`
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN DEFAULT false;
      `);
      logger.info('Added is_affiliate column to teams table');
      
      await client.query(`
        ALTER TABLE teams ADD COLUMN IF NOT EXISTS notes TEXT;
      `);
      logger.info('Added notes column to teams table');
    } catch (error) {
      logger.error(`Error adding columns: ${error.message}`);
      throw error; // Re-throw to stop execution
    }
    
    // Get all sports
    const sportsResult = await client.query(`
      SELECT sport_id, name, abbreviation FROM sports;
    `);
    
    // Create a map of sport abbreviations to IDs
    const sportMap = {};
    sportsResult.rows.forEach(sport => {
      sportMap[sport.abbreviation] = sport.sport_id;
    });
    
    // Process each affiliate member
    for (const member of affiliateMembers) {
      // Check if institution already exists
      const institutionResult = await client.query(`
        SELECT school_id FROM institutions WHERE name = $1 LIMIT 1;
      `, [member.name]);
      
      let schoolId;
      
      if (institutionResult.rows.length === 0) {
        // Create new institution
        const insertInstitutionResult = await client.query(`
          INSERT INTO institutions (
            name, abbreviation, mascot, primary_color, secondary_color,
            city, state, latitude, longitude, is_affiliate,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
          RETURNING school_id;
        `, [
          member.name,
          member.abbreviation,
          member.mascot,
          member.primaryColor,
          member.secondaryColor,
          member.city,
          member.state,
          member.latitude,
          member.longitude
        ]);
        
        schoolId = insertInstitutionResult.rows[0].school_id;
        logger.info(`Created affiliate institution: ${member.name} (ID: ${schoolId})`);
      } else {
        schoolId = institutionResult.rows[0].school_id;
        logger.info(`Institution ${member.name} already exists (ID: ${schoolId})`);
        
        // Update the institution to mark as affiliate
        await client.query(`
          UPDATE institutions SET is_affiliate = true WHERE school_id = $1;
        `, [schoolId]);
      }
      
      // Create teams for each sport
      for (const sportAbbreviation of member.sports) {
        const sportId = sportMap[sportAbbreviation];
        
        if (!sportId) {
          logger.warn(`Sport ${sportAbbreviation} not found in database`);
          continue;
        }
        
        // Check if team already exists
        const teamResult = await client.query(`
          SELECT team_id FROM teams 
          WHERE school_id = $1 AND sport_id = $2 LIMIT 1;
        `, [schoolId, sportId]);
        
        if (teamResult.rows.length === 0) {
          // Create new team
          const teamData = {
            ...teamDataTemplate,
            name: member.name,
            code: sportAbbreviation
          };
          
          // Insert team
          const insertTeamResult = await client.query(`
            INSERT INTO teams (
              name, school_id, sport_id, season, time_zone,
              travel_constraints, rival_teams, scheduling_priority, 
              blackout_dates, media_contracts, code, is_affiliate,
              created_at, updated_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true,
              NOW(), NOW()
            )
            RETURNING team_id;
          `, [
            teamData.name, 
            schoolId, 
            sportId,
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
          logger.info(`Created affiliate team: ${member.name} ${sportAbbreviation} (ID: ${teamId})`);
        } else {
          const teamId = teamResult.rows[0].team_id;
          
          // Update team to mark as affiliate
          await client.query(`
            UPDATE teams SET is_affiliate = true WHERE team_id = $1;
          `, [teamId]);
          
          logger.info(`Team already exists for ${member.name} ${sportAbbreviation} (ID: ${teamId})`);
        }
      }
    }
    
    // Add note about Utah dropping beach volleyball after spring 2025
    // First, find Utah's school_id
    const utahResult = await client.query(`
      SELECT school_id FROM institutions WHERE name = 'Utah' LIMIT 1;
    `);
    
    if (utahResult.rows.length > 0) {
      const utahId = utahResult.rows[0].school_id;
      
      // Find Beach Volleyball sport_id
      const bvbResult = await client.query(`
        SELECT sport_id FROM sports WHERE abbreviation = 'BVB' LIMIT 1;
      `);
      
      if (bvbResult.rows.length > 0) {
        const bvbId = bvbResult.rows[0].sport_id;
        
        // Find Utah's Beach Volleyball team
        const teamResult = await client.query(`
          SELECT team_id FROM teams 
          WHERE school_id = $1 AND sport_id = $2 LIMIT 1;
        `, [utahId, bvbId]);
        
        if (teamResult.rows.length > 0) {
          const teamId = teamResult.rows[0].team_id;
          
          // Update team with note about dropping after spring 2025
          await client.query(`
            UPDATE teams 
            SET notes = 'Dropping after spring 2025 season' 
            WHERE team_id = $1;
          `, [teamId]);
          
          logger.info(`Added note about Utah dropping Beach Volleyball after spring 2025`);
        }
      }
    }
    
    // Get count of affiliate institutions and teams
    const affiliateInstitutionsResult = await client.query(`
      SELECT COUNT(*) FROM institutions WHERE is_affiliate = true;
    `);
    
    const affiliateTeamsResult = await client.query(`
      SELECT COUNT(*) FROM teams WHERE is_affiliate = true;
    `);
    
    logger.info(`Total affiliate institutions: ${affiliateInstitutionsResult.rows[0].count}`);
    logger.info(`Total affiliate teams: ${affiliateTeamsResult.rows[0].count}`);
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Affiliate members update completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to update affiliate members: ${error.message}`);
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
  updateAffiliateMembers()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  updateAffiliateMembers
};
