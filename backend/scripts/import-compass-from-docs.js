#!/usr/bin/env node

/**
 * Import COMPASS Ratings from Documentation Script
 * 
 * This script reads the enhanced research markdown documents and imports
 * COMPASS ratings into the HELiiX database
 */

const { Sequelize } = require('sequelize');
const MarkdownCompassParser = require('../services/markdownCompassParser');
const config = require('../config/neon_db_config');

async function importCompassData() {
  console.log('🧭 Starting COMPASS Data Import from Documentation');
  console.log('=' * 60);
  
  try {
    // Connect to database
    const sequelize = new Sequelize(config.connectionString, {
      dialectOptions: config.connection.dialectOptions,
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('✅ Connected to Neon HELiiX database');
    
    // Initialize parser
    const parser = new MarkdownCompassParser(sequelize);
    
    // Process all markdown files
    await parser.processAllMarkdownFiles();
    
    console.log('\n✅ COMPASS data import completed successfully!');
    
    // Show final stats
    await showFinalStats(sequelize);
    
    await sequelize.close();
    
  } catch (error) {
    console.error('💥 Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function showFinalStats(sequelize) {
  try {
    console.log('\n📊 FINAL DATABASE STATS:');
    
    // Count teams with COMPASS ratings
    const [ratingCounts] = await sequelize.query(`
      SELECT 
        sp.sport_name,
        COUNT(*) as teams_with_ratings,
        AVG(t.compass_rating) as avg_rating,
        MAX(t.compass_rating) as max_rating,
        MIN(t.compass_rating) as min_rating
      FROM teams t
      JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE t.compass_rating IS NOT NULL
      AND t.last_updated_summer_2025 = true
      GROUP BY sp.sport_name
      ORDER BY teams_with_ratings DESC
    `);
    
    console.log('🏀 COMPASS ratings by sport:');
    ratingCounts.forEach(sport => {
      console.log(`   - ${sport.sport_name}: ${sport.teams_with_ratings} teams (Avg: ${parseFloat(sport.avg_rating).toFixed(1)}, Range: ${sport.min_rating}-${sport.max_rating})`);
    });
    
    // Show top rated teams across all sports
    const [topTeams] = await sequelize.query(`
      SELECT 
        s.short_display,
        sp.sport_name,
        t.compass_rating,
        t.head_coach
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE t.compass_rating IS NOT NULL
      AND t.last_updated_summer_2025 = true
      ORDER BY t.compass_rating DESC
      LIMIT 15
    `);
    
    console.log('\n🏆 Top 15 COMPASS ratings across all sports:');
    topTeams.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.short_display} ${team.sport_name}: ${team.compass_rating} (${team.head_coach || 'No coach listed'})`);
    });
    
  } catch (error) {
    console.error('❌ Error showing stats:', error.message);
  }
}

// Handle signals
process.on('SIGINT', () => {
  console.log('\n👋 Import interrupted...');
  process.exit(0);
});

// Run the import
if (require.main === module) {
  importCompassData();
}

module.exports = { importCompassData };