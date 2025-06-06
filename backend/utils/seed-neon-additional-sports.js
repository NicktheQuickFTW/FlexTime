/**
 * Additional Sports Seed Script for Neon DB
 * 
 * This script populates the Neon DB with additional sports data
 * to enhance scheduling intelligence capabilities.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../scripts/logger');

// Connection string from environment
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=prefer';

// Additional sports data with enhanced scheduling information
const additionalSportsData = [
  { 
    name: 'Volleyball',
    abbreviation: 'VB',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 8,
    season_end_month: 12,
    default_days_between_games: 2,
    typical_game_duration: 120,
    max_games_per_week: 3,
    is_winter_sport: false,
    conference_games_count: 18,
    media_requirements: {
      tv_broadcast: true,
      streaming: true,
      priority_level: 'medium'
    },
    scheduling_constraints: {
      max_consecutive_away: 3,
      weekend_preference: true
    }
  },
  { 
    name: 'Baseball',
    abbreviation: 'BSB',
    type: 'men',
    team_based: true,
    active: true,
    season_start_month: 2,
    season_end_month: 6,
    default_days_between_games: 1,
    typical_game_duration: 180,
    max_games_per_week: 5,
    is_winter_sport: false,
    conference_games_count: 24,
    media_requirements: {
      tv_broadcast: true,
      streaming: true,
      priority_level: 'medium'
    },
    scheduling_constraints: {
      max_consecutive_away: 4,
      series_based: true,
      series_length: 3
    }
  },
  { 
    name: 'Softball',
    abbreviation: 'SB',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 2,
    season_end_month: 5,
    default_days_between_games: 1,
    typical_game_duration: 150,
    max_games_per_week: 5,
    is_winter_sport: false,
    conference_games_count: 24,
    media_requirements: {
      tv_broadcast: true,
      streaming: true,
      priority_level: 'medium'
    },
    scheduling_constraints: {
      max_consecutive_away: 4,
      series_based: true,
      series_length: 3
    }
  },
  { 
    name: 'Soccer',
    abbreviation: 'SOC',
    type: 'women',
    team_based: true,
    active: true,
    season_start_month: 8,
    season_end_month: 11,
    default_days_between_games: 3,
    typical_game_duration: 120,
    max_games_per_week: 2,
    is_winter_sport: false,
    conference_games_count: 10,
    media_requirements: {
      tv_broadcast: false,
      streaming: true,
      priority_level: 'low'
    },
    scheduling_constraints: {
      max_consecutive_away: 3,
      weekend_preference: true
    }
  },
  { 
    name: 'Track & Field',
    abbreviation: 'TF',
    type: 'mixed',
    team_based: false,
    active: true,
    season_start_month: 1,
    season_end_month: 6,
    default_days_between_games: 7,
    typical_game_duration: 480, // All-day events
    max_games_per_week: 1,
    is_winter_sport: false,
    conference_games_count: 1, // Conference championship
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
    name: 'Swimming & Diving',
    abbreviation: 'SWIM',
    type: 'mixed',
    team_based: false,
    active: true,
    season_start_month: 10,
    season_end_month: 3,
    default_days_between_games: 7,
    typical_game_duration: 300, // Multi-hour meets
    max_games_per_week: 1,
    is_winter_sport: true,
    conference_games_count: 1, // Conference championship
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
    name: 'Tennis',
    abbreviation: 'TEN',
    type: 'mixed',
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
  }
];

async function seedAdditionalSports() {
  logger.info('Starting additional sports seed for Neon DB...');
  
  // Create a client with the direct connection string
  const client = new Client(connectionString);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Process each sport
    for (const sportData of additionalSportsData) {
      // Check if sport already exists
      const sportResult = await client.query(`
        SELECT sport_id FROM sports WHERE abbreviation = $1 LIMIT 1;
      `, [sportData.abbreviation]);
      
      if (sportResult.rows.length === 0) {
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
          sportData.name,
          sportData.abbreviation,
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
        logger.info(`Created sport: ${sportData.name} (ID: ${sportId})`);
        
        // Update venue supported_sports to include this new sport
        if (sportData.abbreviation === 'VB') {
          // Add volleyball to all venues that support basketball
          await client.query(`
            UPDATE venues 
            SET supported_sports = array_append(supported_sports, $1)
            WHERE $1 <> ALL(supported_sports) 
            AND (2 = ANY(supported_sports) OR 3 = ANY(supported_sports));
          `, [sportId]);
          logger.info(`Added Volleyball to basketball venues`);
        } else if (sportData.abbreviation === 'BSB' || sportData.abbreviation === 'SB') {
          // These would need dedicated venues, but we'll skip for now
          logger.info(`Note: ${sportData.name} would need dedicated venues`);
        } else if (sportData.abbreviation === 'SOC') {
          // Add soccer to venues that support football
          await client.query(`
            UPDATE venues 
            SET supported_sports = array_append(supported_sports, $1)
            WHERE $1 <> ALL(supported_sports) 
            AND 1 = ANY(supported_sports);
          `, [sportId]);
          logger.info(`Added Soccer to football venues`);
        }
      } else {
        // Update existing sport
        const sportId = sportResult.rows[0].sport_id;
        await client.query(`
          UPDATE sports 
          SET name = $1, type = $2, team_based = $3, active = $4,
              season_start_month = $5, season_end_month = $6, 
              default_days_between_games = $7, typical_game_duration = $8,
              max_games_per_week = $9, is_winter_sport = $10,
              conference_games_count = $11, media_requirements = $12,
              scheduling_constraints = $13
          WHERE sport_id = $14;
        `, [
          sportData.name,
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
        
        logger.info(`Updated sport: ${sportData.name} (ID: ${sportId})`);
      }
    }
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Additional sports seed completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to seed additional sports: ${error.message}`);
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
  seedAdditionalSports()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  seedAdditionalSports
};
