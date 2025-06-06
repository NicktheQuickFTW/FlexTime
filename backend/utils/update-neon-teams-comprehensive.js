/**
 * Comprehensive Teams Update Script for Neon DB
 * 
 * This script updates the teams in the Neon DB to accurately reflect
 * the comprehensive Big 12 sports sponsorship data.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../scripts/logger');

// Connection string from environment
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=prefer';

// Comprehensive Big 12 sports sponsorship data
// Men's sports
const mensSportsSponsorship = {
  "Baseball": {
    abbreviation: "BSB",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Houston", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Men's Basketball": {
    abbreviation: "MBB",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Men's Cross Country": {
    abbreviation: "MXC",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech"]
  },
  "Football": {
    abbreviation: "FB",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Men's Golf": {
    abbreviation: "MGOLF",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Men's Swimming & Diving": {
    abbreviation: "MSWIM",
    schools: ["Arizona", "Arizona State", "BYU", "Cincinnati", "TCU", "Utah", "West Virginia"]
  },
  "Men's Tennis": {
    abbreviation: "MTEN",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah"]
  },
  "Men's Indoor Track & Field": {
    abbreviation: "MITF",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech"]
  },
  "Men's Outdoor Track & Field": {
    abbreviation: "MOTF",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech"]
  },
  "Wrestling": {
    abbreviation: "WREST",
    schools: ["Arizona State", "Iowa State", "Oklahoma State", "West Virginia"]
  }
};

// Women's sports
const womensSportsSponsorship = {
  "Women's Basketball": {
    abbreviation: "WBB",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Beach Volleyball": {
    abbreviation: "BVB",
    schools: ["Arizona", "Arizona State", "TCU", "Utah"]
  },
  "Women's Cross Country": {
    abbreviation: "WXC",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Equestrian": {
    abbreviation: "EQ",
    schools: ["Baylor", "Oklahoma State", "TCU"]
  },
  "Women's Golf": {
    abbreviation: "WGOLF",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF"]
  },
  "Gymnastics": {
    abbreviation: "GYM",
    schools: ["Arizona", "Arizona State", "BYU", "Iowa State", "Utah", "West Virginia"]
  },
  "Lacrosse": {
    abbreviation: "LAX",
    schools: ["Arizona State", "Cincinnati", "Colorado"]
  },
  "Rowing": {
    abbreviation: "ROW",
    schools: ["Kansas", "Kansas State", "UCF", "West Virginia"]
  },
  "Soccer": {
    abbreviation: "SOC",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Softball": {
    abbreviation: "SB",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Houston", "Iowa State", "Kansas", "Oklahoma State", "Texas Tech", "UCF", "Utah"]
  },
  "Women's Swimming & Diving": {
    abbreviation: "WSWIM",
    schools: ["Arizona", "Arizona State", "BYU", "Cincinnati", "Houston", "Iowa State", "Kansas", "TCU", "Utah", "West Virginia"]
  },
  "Women's Tennis": {
    abbreviation: "WTEN",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Women's Indoor Track & Field": {
    abbreviation: "WITF",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Women's Outdoor Track & Field": {
    abbreviation: "WOTF",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
  },
  "Volleyball": {
    abbreviation: "VB",
    schools: ["Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado", "Houston", "Iowa State", "Kansas", "Kansas State", "TCU", "Texas Tech", "UCF", "Utah", "West Virginia"]
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

// Add missing sports if needed
async function addMissingSports(client) {
  logger.info('Checking for missing sports...');
  
  // Combine all sports data
  const allSportsData = {
    ...mensSportsSponsorship,
    ...womensSportsSponsorship
  };
  
  // Get existing sports
  const sportsResult = await client.query(`
    SELECT sport_id, name, abbreviation FROM sports;
  `);
  
  const existingSports = new Set();
  sportsResult.rows.forEach(sport => {
    existingSports.add(sport.abbreviation);
  });
  
  // Add missing sports
  for (const [sportName, sportData] of Object.entries(allSportsData)) {
    if (!existingSports.has(sportData.abbreviation)) {
      // Determine type (men, women, mixed)
      let type = 'mixed';
      if (sportName.startsWith("Men's") || sportName === "Football" || sportName === "Baseball" || sportName === "Wrestling") {
        type = 'men';
      } else if (sportName.startsWith("Women's") || sportName === "Volleyball" || sportName === "Soccer" || 
                sportName === "Softball" || sportName === "Gymnastics" || sportName === "Beach Volleyball" || 
                sportName === "Lacrosse" || sportName === "Rowing" || sportName === "Equestrian") {
        type = 'women';
      }
      
      // Default values for new sports
      const newSportData = {
        name: sportName,
        abbreviation: sportData.abbreviation,
        type: type,
        team_based: true,
        active: true,
        season_start_month: 8, // Default to August
        season_end_month: 5,   // Default to May
        default_days_between_games: 3,
        typical_game_duration: 180,
        max_games_per_week: 2,
        is_winter_sport: false,
        conference_games_count: 10,
        media_requirements: {
          tv_broadcast: true,
          streaming: true,
          priority_level: 'medium'
        },
        scheduling_constraints: {
          max_consecutive_away: 3,
          weekend_preference: true
        }
      };
      
      // Customize for specific sports
      if (sportName === "Football") {
        newSportData.season_start_month = 8;
        newSportData.season_end_month = 12;
        newSportData.default_days_between_games = 7;
        newSportData.typical_game_duration = 210;
        newSportData.max_games_per_week = 1;
        newSportData.conference_games_count = 9;
      } else if (sportName === "Wrestling") {
        newSportData.season_start_month = 11;
        newSportData.season_end_month = 3;
        newSportData.is_winter_sport = true;
      } else if (sportName === "Beach Volleyball" || sportName === "Lacrosse") {
        newSportData.season_start_month = 2;
        newSportData.season_end_month = 5;
      } else if (sportName === "Gymnastics") {
        newSportData.season_start_month = 1;
        newSportData.season_end_month = 4;
        newSportData.is_winter_sport = true;
      } else if (sportName === "Equestrian") {
        newSportData.season_start_month = 9;
        newSportData.season_end_month = 4;
      } else if (sportName.includes("Indoor Track")) {
        newSportData.season_start_month = 1;
        newSportData.season_end_month = 3;
        newSportData.is_winter_sport = true;
      }
      
      // Insert the new sport
      const insertSportResult = await client.query(`
        INSERT INTO sports (
          name, abbreviation, type, team_based, active, 
          season_start_month, season_end_month, default_days_between_games,
          typical_game_duration, max_games_per_week, is_winter_sport,
          conference_games_count, media_requirements, scheduling_constraints,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          NOW(), NOW()
        )
        RETURNING sport_id;
      `, [
        newSportData.name,
        newSportData.abbreviation,
        newSportData.type,
        newSportData.team_based,
        newSportData.active,
        newSportData.season_start_month,
        newSportData.season_end_month,
        newSportData.default_days_between_games,
        newSportData.typical_game_duration,
        newSportData.max_games_per_week,
        newSportData.is_winter_sport,
        newSportData.conference_games_count,
        JSON.stringify(newSportData.media_requirements),
        JSON.stringify(newSportData.scheduling_constraints)
      ]);
      
      const sportId = insertSportResult.rows[0].sport_id;
      logger.info(`Created new sport: ${sportName} (ID: ${sportId})`);
    }
  }
}

async function updateTeamsComprehensive() {
  logger.info('Starting comprehensive teams update...');
  
  // Create a client with the direct connection string
  const client = new Client(connectionString);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // First, add any missing sports
    await addMissingSports(client);
    
    // Get all sports
    const sportsResult = await client.query(`
      SELECT sport_id, name, abbreviation FROM sports ORDER BY sport_id;
    `);
    
    const sports = sportsResult.rows;
    logger.info(`Found ${sports.length} sports in database`);
    
    // Get all institutions
    const institutionsResult = await client.query(`
      SELECT institution_id, name FROM institutions;
    `);
    
    const institutions = institutionsResult.rows;
    logger.info(`Found ${institutions.length} institutions in database`);
    
    // Create a map of institution names to IDs
    const institutionMap = {};
    institutions.forEach(inst => {
      institutionMap[inst.name] = inst.institution_id;
    });
    
    // Create a map of sport abbreviations to IDs
    const sportMap = {};
    sports.forEach(sport => {
      sportMap[sport.abbreviation] = sport.sport_id;
    });
    
    // Get current teams
    const teamsResult = await client.query(`
      SELECT team_id, institution_id, sport_id FROM teams;
    `);
    
    const existingTeams = teamsResult.rows;
    logger.info(`Found ${existingTeams.length} existing teams in database`);
    
    // Create a set of valid team combinations based on comprehensive data
    const validTeamCombinations = new Set();
    
    // Process all sports data
    const allSportsSponsorship = {
      ...mensSportsSponsorship,
      ...womensSportsSponsorship
    };
    
    // Process each sport in the comprehensive data
    for (const [sportName, sportData] of Object.entries(allSportsSponsorship)) {
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
        
        const institutionId = institutionMap[institutionName];
        if (!institutionId) {
          logger.warn(`Institution ${institutionName} not found in database`);
          continue;
        }
        
        // Add this combination to valid set
        validTeamCombinations.add(`${institutionId}-${sportId}`);
        
        // Check if team exists
        const teamExists = existingTeams.some(team => 
          team.institution_id === institutionId && team.sport_id === sportId
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
    
    // Delete teams that don't match the comprehensive data
    let deletedCount = 0;
    for (const team of existingTeams) {
      const combinationKey = `${team.institution_id}-${team.sport_id}`;
      if (!validTeamCombinations.has(combinationKey)) {
        await client.query(`
          DELETE FROM teams WHERE team_id = $1;
        `, [team.team_id]);
        deletedCount++;
      }
    }
    
    logger.info(`Deleted ${deletedCount} teams that don't match comprehensive data`);
    
    // Get count of current teams
    const currentTeamsResult = await client.query(`
      SELECT COUNT(*) FROM teams;
    `);
    
    logger.info(`Total teams after update: ${currentTeamsResult.rows[0].count}`);
    
    // Get team counts by institution
    const teamsByInstitutionResult = await client.query(`
      SELECT i.name, COUNT(t.team_id) 
      FROM institutions i 
      JOIN teams t ON i.institution_id = t.institution_id 
      GROUP BY i.name 
      ORDER BY COUNT(t.team_id) DESC;
    `);
    
    logger.info('Teams by institution:');
    teamsByInstitutionResult.rows.forEach(row => {
      logger.info(`${row.name}: ${row.count} teams`);
    });
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Comprehensive teams update completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to update teams: ${error.message}`);
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
  updateTeamsComprehensive()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  updateTeamsComprehensive
};
