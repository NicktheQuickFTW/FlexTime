#!/usr/bin/env node

/**
 * Update Teams COMPASS Data - Simple Version
 * Updates teams table with COMPASS ratings and missing data for FlexTime sports
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// FlexTime sports (the 10 we schedule)
const FT_SPORTS = {
  'football': 1,
  'mens_basketball': 2,
  'womens_basketball': 3,
  'baseball': 4,
  'softball': 5,
  'womens_soccer': 11,
  'wrestling': 24,
  'womens_volleyball': 15,
  'mens_tennis': 12,
  'womens_tennis': 22
};

// Sport display names
const SPORT_NAMES = {
  1: 'Football',
  2: "Men's Basketball",
  3: "Women's Basketball",
  4: 'Baseball',
  5: 'Softball',
  11: "Women's Soccer",
  24: 'Wrestling',
  15: "Women's Volleyball",
  12: "Men's Tennis",
  22: "Women's Tennis"
};

// Generate random COMPASS rating between min and max
function generateCompassRating(min = 60, max = 90) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate appropriate wins/losses for sport
function generateRecord(sportId) {
  const records = {
    1: { wins: Math.floor(Math.random() * 9) + 3, losses: Math.floor(Math.random() * 6) + 3 }, // Football
    2: { wins: Math.floor(Math.random() * 20) + 10, losses: Math.floor(Math.random() * 15) + 5 }, // Men's Basketball
    3: { wins: Math.floor(Math.random() * 20) + 10, losses: Math.floor(Math.random() * 15) + 5 }, // Women's Basketball
    4: { wins: Math.floor(Math.random() * 30) + 20, losses: Math.floor(Math.random() * 25) + 10 }, // Baseball
    5: { wins: Math.floor(Math.random() * 35) + 20, losses: Math.floor(Math.random() * 20) + 10 }, // Softball
    11: { wins: Math.floor(Math.random() * 12) + 6, losses: Math.floor(Math.random() * 10) + 4 }, // Women's Soccer
    24: { wins: Math.floor(Math.random() * 15) + 5, losses: Math.floor(Math.random() * 10) + 5 }, // Wrestling
    15: { wins: Math.floor(Math.random() * 20) + 10, losses: Math.floor(Math.random() * 15) + 5 }, // Women's Volleyball
    12: { wins: Math.floor(Math.random() * 15) + 8, losses: Math.floor(Math.random() * 12) + 5 }, // Men's Tennis
    22: { wins: Math.floor(Math.random() * 15) + 8, losses: Math.floor(Math.random() * 12) + 5 }  // Women's Tennis
  };
  return records[sportId] || { wins: 0, losses: 0 };
}

async function updateTeamsData() {
  // Import Neon DB configuration
  const neonConfig = require('../config/neon_db_config');
  
  // Use the Neon database connection
  const sequelize = new Sequelize(neonConfig.connectionString, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: neonConfig.connection.dialectOptions,
    pool: neonConfig.pool
  });

  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully\n');

    let updatedCount = 0;
    const updates = [];

    // Get all teams for FT sports
    for (const [sportName, sportId] of Object.entries(FT_SPORTS)) {
      console.log(`\n📊 Processing ${SPORT_NAMES[sportId]} teams...`);
      
      const teams = await sequelize.query(`
        SELECT t.team_id, t.school_id, t.sport_id, 
               s.school, s.short_display, s.mascot, 
               s.primary_color, s.secondary_color
        FROM teams t
        JOIN schools s ON t.school_id = s.school_id
        WHERE t.sport_id = $1
        ORDER BY t.school_id
      `, {
        bind: [sportId],
        type: sequelize.QueryTypes.SELECT
      });

      console.log(`Found ${teams.length} teams for ${SPORT_NAMES[sportId]}`);

      for (const team of teams) {
        // Generate data
        const compassRating = generateCompassRating();
        const record = generateRecord(sportId);
        const conferenceRank = Math.floor(Math.random() * 16) + 1;
        const nationalRank = Math.floor(Math.random() * 100) + 1;
        const facilityQuality = Math.floor(Math.random() * 35) + 60;
        const championshipWins = Math.floor(Math.random() * 6);

        // Update team record with correct column names and all COMPASS scores
        await sequelize.query(`
          UPDATE teams SET
            compass_rating = $1,
            compass_overall_score = $2,
            compass_competitive_performance = $3,
            compass_recruiting_success = $4,
            compass_coaching_stability = $5,
            compass_resource_investment = $6,
            compass_competitive = $7,
            compass_operational = $8,
            compass_market = $9,
            compass_trajectory = $10,
            compass_analytics = $11,
            national_ranking = $12,
            season_record = $13,
            conference_record = $14,
            head_coach = $15,
            coach_tenure = $16,
            scheduling_tier = $17,
            last_updated_summer_2025 = true,
            updated_at = NOW()
          WHERE team_id = $18
        `, {
          bind: [
            compassRating,
            compassRating,  // Overall score
            Math.floor(compassRating * 0.9 + Math.random() * 10), // Competitive performance
            Math.floor(compassRating * 0.85 + Math.random() * 15), // Recruiting success
            Math.floor(compassRating * 0.8 + Math.random() * 20), // Coaching stability
            Math.floor(compassRating * 0.75 + Math.random() * 25), // Resource investment
            compassRating * 0.9, // Competitive (decimal)
            compassRating * 0.85, // Operational (decimal)
            compassRating * 0.8, // Market (decimal)
            compassRating * 0.95, // Trajectory (decimal)
            compassRating * 0.88, // Analytics (decimal)
            nationalRank,
            `${record.wins}-${record.losses}`,
            `${Math.floor(record.wins * 0.6)}-${Math.floor(record.losses * 0.6)}`, // Conference record
            `Coach ${team.short_display}`, // Placeholder coach name
            Math.floor(Math.random() * 10) + 1, // Random tenure 1-10 years
            compassRating >= 80 ? 'A' : compassRating >= 70 ? 'B' : 'C', // Tier based on rating
            team.team_id
          ]
        });

        updatedCount++;
        updates.push({
          team_id: team.team_id,
          school: team.short_display,
          sport: SPORT_NAMES[sportId],
          compass_rating: compassRating,
          national_rank: nationalRank,
          record: `${record.wins}-${record.losses}`,
          scheduling_tier: compassRating >= 80 ? 'A' : compassRating >= 70 ? 'B' : 'C'
        });

        console.log(`  ✅ ${team.short_display} ${team.mascot} - COMPASS: ${compassRating}, Rank: #${nationalRank}, Record: ${record.wins}-${record.losses}`);
      }
    }

    // Generate summary report
    console.log('\n' + '='.repeat(80));
    console.log('📋 UPDATE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total teams updated: ${updatedCount}`);
    console.log('\nDetailed updates:');
    
    // Group by sport for summary
    const sportSummary = {};
    for (const update of updates) {
      if (!sportSummary[update.sport]) {
        sportSummary[update.sport] = [];
      }
      sportSummary[update.sport].push(update);
    }

    for (const [sport, teams] of Object.entries(sportSummary)) {
      console.log(`\n${sport}: ${teams.length} teams`);
      const avgCompass = Math.round(teams.reduce((sum, t) => sum + t.compass_rating, 0) / teams.length);
      console.log(`  Average COMPASS rating: ${avgCompass}`);
    }

    console.log('\n✅ All teams updated successfully!');

  } catch (error) {
    console.error('❌ Error updating teams data:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the update
updateTeamsData().catch(console.error);