/**
 * Update Teams Based on Big 12 CSV Data
 * 
 * This script updates the teams in the Neon DB to accurately reflect
 * the actual Big 12 sports sponsorship based on the CSV data.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('/Users/nickw/Documents/GitHub/Flextime/FlexTime/utils/logger.js');

// Connection string from environment
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=prefer';

// Big 12 sports sponsorship data from CSV
const sportsSponsorship = {
  "Men's Cross Country": {
    abbreviation: "MXC",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech"]
  },
  "Women's Cross Country": {
    abbreviation: "WXC",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Soccer": {
    abbreviation: "SOC",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Volleyball": {
    abbreviation: "VB",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Football": {
    abbreviation: "FB",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Women's Swimming & Diving": {
    abbreviation: "WSWIM",
    schools: ["Arizona", "Arizona State", "BYU", "Cincinnati", "Houston", "Iowa State", "Kansas", "TCU", "Utah", "West Virginia"]
  },
  "Men's Swimming & Diving": {
    abbreviation: "MSWIM",
    schools: ["Arizona", "Arizona State", "BYU", "Cincinnati", "TCU", "Utah", "West Virginia"]
  },
  "Women's Indoor Track & Field": {
    abbreviation: "WITF",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Men's Indoor Track & Field": {
    abbreviation: "MITF",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech"]
  },
  "Women's Basketball": {
    abbreviation: "WBB",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Men's Basketball": {
    abbreviation: "MBB",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Women's Golf": {
    abbreviation: "WGOLF",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF"]
  },
  "Women's Tennis": {
    abbreviation: "WTEN",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Men's Tennis": {
    abbreviation: "MTEN",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah"]
  },
  "Men's Golf": {
    abbreviation: "MGOLF",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Men's Outdoor Track & Field": {
    abbreviation: "MOTF",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech"]
  },
  "Women's Outdoor Track & Field": {
    abbreviation: "WOTF",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Baseball": {
    abbreviation: "BSB",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Cincinnati", "Houston", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Softball": {
    abbreviation: "SB",
    schools: ["Arizona", "Arizona State", "BYU", "Baylor", "Houston", "Iowa State", "Kansas", "Oklahoma State", "Texas Tech", "UCF", "Utah"]
  }
};

// Map of our institution names to CSV school names
const institutionToSchoolMap = {
  "Texas Tech": "Texas Tech",
  "Baylor": "Baylor",
  "TCU": "TCU",
  "Oklahoma": "Oklahoma",
  "Oklahoma State": "Oklahoma State",
  "Kansas": "Kansas",
  "K-State": "Kansas State"
};

// Reverse map for lookups
const schoolToInstitutionMap = {};
Object.entries(institutionToSchoolMap).forEach(([institution, school]) => {
  schoolToInstitutionMap[school] = institution;
});

async function updateTeamsFromCSV() {
  logger.info('Starting teams update from CSV data...');
  
  // Create a client with the direct connection string
  const client = new Client(connectionString);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Get all sports
    const sportsResult = await client.query(`
      SELECT sport_id, name, abbreviation FROM sports ORDER BY sport_id;
    `);
    
    const sports = sportsResult.rows;
    logger.info(`Found ${sports.length} sports in database`);
    
    // Get all institutions
    const institutionsResult = await client.query(`
      SELECT school_id, name FROM institutions;
    `);
    
    const institutions = institutionsResult.rows;
    logger.info(`Found ${institutions.length} institutions in database`);
    
    // Create a map of institution names to IDs
    const institutionMap = {};
    institutions.forEach(inst => {
      institutionMap[inst.name] = inst.school_id;
    });
    
    // Create a map of sport abbreviations to IDs
    const sportMap = {};
    sports.forEach(sport => {
      sportMap[sport.abbreviation] = sport.sport_id;
    });
    
    // Get current teams
    const teamsResult = await client.query(`
      SELECT team_id, school_id, sport_id FROM teams;
    `);
    
    const existingTeams = teamsResult.rows;
    logger.info(`Found ${existingTeams.length} existing teams in database`);
    
    // Create a set of valid team combinations based on CSV data
    const validTeamCombinations = new Set();
    
    // Process each sport in the CSV data
    for (const [sportName, sportData] of Object.entries(sportsSponsorship)) {
      const sportId = sportMap[sportData.abbreviation];
      
      if (!sportId) {
        logger.warn(`Sport ${sportName} (${sportData.abbreviation}) not found in database`);
        continue;
      }
      
      logger.info(`Processing sport: ${sportName} (${sportData.abbreviation})`);
      
      // Process each school that sponsors this sport
      for (const schoolName of sportData.schools) {
        // Skip schools not in our database
        const institutionName = schoolToInstitutionMap[schoolName];
        if (!institutionName) {
          continue; // Skip schools we don't have in our database
        }
        
        const schoolId = institutionMap[institutionName];
        if (!schoolId) {
          logger.warn(`Institution ${institutionName} not found in database`);
          continue;
        }
        
        // Add this combination to valid set
        validTeamCombinations.add(`${schoolId}-${sportId}`);
        
        // Check if team exists
        const teamExists = existingTeams.some(team => 
          team.school_id === schoolId && team.sport_id === sportId
        );
        
        if (!teamExists) {
          // Create new team with standard template data
          const teamData = {
            name: institutionName,
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
            },
            code: sportData.abbreviation
          };
          
          // Insert team
          const insertTeamResult = await client.query(`
            INSERT INTO teams (
              name, school_id, sport_id, season, time_zone,
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
          logger.info(`Created team: ${institutionName} ${sportName} (ID: ${teamId})`);
        } else {
          logger.info(`Team already exists for ${institutionName} ${sportName}`);
        }
      }
    }
    
    // Delete teams that don't match the CSV data
    let deletedCount = 0;
    for (const team of existingTeams) {
      const combinationKey = `${team.school_id}-${team.sport_id}`;
      if (!validTeamCombinations.has(combinationKey)) {
        await client.query(`
          DELETE FROM teams WHERE team_id = $1;
        `, [team.team_id]);
        deletedCount++;
      }
    }
    
    logger.info(`Deleted ${deletedCount} teams that don't match CSV data`);
    
    // Get count of current teams
    const currentTeamsResult = await client.query(`
      SELECT COUNT(*) FROM teams;
    `);
    
    logger.info(`Total teams after update: ${currentTeamsResult.rows[0].count}`);
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Teams update from CSV completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to update teams from CSV: ${error.message}`);
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
  updateTeamsFromCSV()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  updateTeamsFromCSV
};
