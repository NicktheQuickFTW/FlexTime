/**
 * Update Sports with Gender Separation for Neon DB
 * 
 * This script updates existing sports and adds new ones with proper gender separation
 * for Tennis, Swimming & Diving, Cross Country, Golf, and Track & Field.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../utils/logger');

// Connection string from environment
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=prefer';

// Sports to update with gender separation
const sportsToUpdate = [
  // Tennis - Update existing and add women's
  {
    existing_abbreviation: 'TEN',
    new_name: 'Men\'s Tennis',
    new_abbreviation: 'MTEN',
    type: 'men',
    team_based: true,
    active: true,
    season_start_month: 1,
    season_end_month: 5,
    default_days_between_games: 3,
    typical_game_duration: 240,
    max_games_per_week: 2,
    is_winter_sport: false,
    conference_games_count: 10,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      indoor_outdoor_flexibility: true,
      weather_dependent: true
    }
  },
  {
    new_name: 'Women\'s Tennis',
    new_abbreviation: 'WTEN',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 1,
    season_end_month: 5,
    default_days_between_games: 3,
    typical_game_duration: 240,
    max_games_per_week: 2,
    is_winter_sport: false,
    conference_games_count: 10,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      indoor_outdoor_flexibility: true,
      weather_dependent: true
    }
  },
  
  // Swimming & Diving - Update existing and add women's
  {
    existing_abbreviation: 'SWIM',
    new_name: 'Men\'s Swimming & Diving',
    new_abbreviation: 'MSWIM',
    type: 'men',
    team_based: true,
    active: true,
    season_start_month: 10,
    season_end_month: 3,
    default_days_between_games: 7,
    typical_game_duration: 300,
    max_games_per_week: 1,
    is_winter_sport: true,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      weekend_preference: true,
      pool_availability: true
    }
  },
  {
    new_name: 'Women\'s Swimming & Diving',
    new_abbreviation: 'WSWIM',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 10,
    season_end_month: 3,
    default_days_between_games: 7,
    typical_game_duration: 300,
    max_games_per_week: 1,
    is_winter_sport: true,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      weekend_preference: true,
      pool_availability: true
    }
  },
  
  // Track & Field - Update existing and add all variations
  {
    existing_abbreviation: 'TF',
    new_name: 'Men\'s Indoor Track & Field',
    new_abbreviation: 'MITF',
    type: 'men',
    team_based: true,
    active: true,
    season_start_month: 1,
    season_end_month: 3,
    default_days_between_games: 7,
    typical_game_duration: 480,
    max_games_per_week: 1,
    is_winter_sport: true,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      weekend_only: true,
      multi_day_events: true
    }
  },
  {
    new_name: 'Women\'s Indoor Track & Field',
    new_abbreviation: 'WITF',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 1,
    season_end_month: 3,
    default_days_between_games: 7,
    typical_game_duration: 480,
    max_games_per_week: 1,
    is_winter_sport: true,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      weekend_only: true,
      multi_day_events: true
    }
  },
  {
    new_name: 'Men\'s Outdoor Track & Field',
    new_abbreviation: 'MOTF',
    type: 'men',
    team_based: true,
    active: true,
    season_start_month: 3,
    season_end_month: 6,
    default_days_between_games: 7,
    typical_game_duration: 480,
    max_games_per_week: 1,
    is_winter_sport: false,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      weekend_only: true,
      multi_day_events: true,
      weather_dependent: true
    }
  },
  {
    new_name: 'Women\'s Outdoor Track & Field',
    new_abbreviation: 'WOTF',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 3,
    season_end_month: 6,
    default_days_between_games: 7,
    typical_game_duration: 480,
    max_games_per_week: 1,
    is_winter_sport: false,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      weekend_only: true,
      multi_day_events: true,
      weather_dependent: true
    }
  },
  
  // Cross Country - Add men's and women's
  {
    new_name: 'Men\'s Cross Country',
    new_abbreviation: 'MXC',
    type: 'men',
    team_based: true,
    active: true,
    season_start_month: 8,
    season_end_month: 11,
    default_days_between_games: 14,
    typical_game_duration: 240,
    max_games_per_week: 1,
    is_winter_sport: false,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      weekend_only: true,
      weather_dependent: true
    }
  },
  {
    new_name: 'Women\'s Cross Country',
    new_abbreviation: 'WXC',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 8,
    season_end_month: 11,
    default_days_between_games: 14,
    typical_game_duration: 240,
    max_games_per_week: 1,
    is_winter_sport: false,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      weekend_only: true,
      weather_dependent: true
    }
  },
  
  // Golf - Add men's and women's
  {
    new_name: 'Men\'s Golf',
    new_abbreviation: 'MGOLF',
    type: 'men',
    team_based: true,
    active: true,
    season_start_month: 9,
    season_end_month: 5,
    default_days_between_games: 14,
    typical_game_duration: 480,
    max_games_per_week: 1,
    is_winter_sport: false,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      multi_day_events: true,
      weather_dependent: true
    }
  },
  {
    new_name: 'Women\'s Golf',
    new_abbreviation: 'WGOLF',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 9,
    season_end_month: 5,
    default_days_between_games: 14,
    typical_game_duration: 480,
    max_games_per_week: 1,
    is_winter_sport: false,
    conference_games_count: 1,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      multi_day_events: true,
      weather_dependent: true
    }
  }
];

async function updateSportsGender() {
  logger.info('Starting sports gender update for Neon DB...');
  
  // Create a client with the direct connection string
  const client = new Client(connectionString);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Process each sport
    for (const sportData of sportsToUpdate) {
      if (sportData.existing_abbreviation) {
        // Update existing sport
        const sportResult = await client.query(`
          SELECT sport_id FROM sports WHERE abbreviation = $1 LIMIT 1;
        `, [sportData.existing_abbreviation]);
        
        if (sportResult.rows.length > 0) {
          const sportId = sportResult.rows[0].sport_id;
          await client.query(`
            UPDATE sports 
            SET name = $1, abbreviation = $2, type = $3, team_based = $4,
                active = $5, season_start_month = $6, season_end_month = $7, 
                default_days_between_games = $8, typical_game_duration = $9,
                max_games_per_week = $10, is_winter_sport = $11,
                conference_games_count = $12, media_requirements = $13,
                scheduling_constraints = $14
            WHERE sport_id = $15;
          `, [
            sportData.new_name,
            sportData.new_abbreviation,
            sportData.type,
            sportData.team_based,
            sportData.active,
            sportData.season_start_month,
            sportData.season_end_month,
            sportData.default_days_between_games,
            sportData.typical_game_duration,
            sportData.max_games_per_week,
            sportData.is_winter_sport,
            sportData.conference_games_count,
            JSON.stringify(sportData.media_requirements),
            JSON.stringify(sportData.scheduling_constraints),
            sportId
          ]);
          
          logger.info(`Updated sport: ${sportData.existing_abbreviation} -> ${sportData.new_name} (ID: ${sportId})`);
        } else {
          logger.warn(`Sport with abbreviation ${sportData.existing_abbreviation} not found for update`);
        }
      } else {
        // Insert new sport
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
          sportData.new_name,
          sportData.new_abbreviation,
          sportData.type,
          sportData.team_based,
          sportData.active,
          sportData.season_start_month,
          sportData.season_end_month,
          sportData.default_days_between_games,
          sportData.typical_game_duration,
          sportData.max_games_per_week,
          sportData.is_winter_sport,
          sportData.conference_games_count,
          JSON.stringify(sportData.media_requirements),
          JSON.stringify(sportData.scheduling_constraints)
        ]);
        
        const sportId = insertSportResult.rows[0].sport_id;
        logger.info(`Created sport: ${sportData.new_name} (ID: ${sportId})`);
      }
    }
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Sports gender update completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to update sports gender: ${error.message}`);
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
  updateSportsGender()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  updateSportsGender
};
