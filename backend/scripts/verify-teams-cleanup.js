/**
 * Verify Teams Cleanup Script
 * 
 * This script shows what teams would be removed without actually removing them
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import sponsorship data from the cleanup script
const { BIG12_SPORT_SPONSORSHIPS } = require('./clean-teams-table-v2');

// Map database school names to our simplified names
const SCHOOL_NAME_MAPPING = {
  'University of Arizona': 'Arizona',
  'Arizona State University': 'Arizona State',
  'Baylor University': 'Baylor',
  'Brigham Young University': 'BYU',
  'University of Central Florida': 'UCF',
  'University of Cincinnati': 'Cincinnati',
  'University of Colorado': 'Colorado',
  'University of Houston': 'Houston',
  'Iowa State University': 'Iowa State',
  'University of Kansas': 'Kansas',
  'Kansas State University': 'Kansas State',
  'Oklahoma State University': 'Oklahoma State',
  'Texas Christian University': 'TCU',
  'Texas Tech University': 'Texas Tech',
  'University of Utah': 'Utah',
  'West Virginia University': 'West Virginia'
};

// Big 12 School IDs
const BIG12_SCHOOL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.NEON_DB_CONNECTION_STRING || 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function verifyTeamsCleanup() {
  console.log('🔍 Verifying Teams Cleanup (DRY RUN)...\n');
  
  const client = await pool.connect();
  
  try {
    // Get current state
    const currentStateResult = await client.query(`
      SELECT 
        sp.sport_name,
        COUNT(DISTINCT t.team_id) as team_count,
        STRING_AGG(DISTINCT s.school, ', ' ORDER BY s.school) as schools
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE s.school_id IN (${BIG12_SCHOOL_IDS.join(',')})
      GROUP BY sp.sport_name
      ORDER BY sp.sport_name;
    `);
    
    console.log('📊 Current Big 12 Teams by Sport:\n');
    
    let totalTeamsToRemove = 0;
    const teamsToRemoveBySchool = {};
    
    for (const row of currentStateResult.rows) {
      const sportName = row.sport_name;
      const currentTeamCount = parseInt(row.team_count);
      const sponsoringSchools = BIG12_SPORT_SPONSORSHIPS[sportName] || [];
      
      console.log(`${sportName}:`);
      console.log(`  Current teams: ${currentTeamCount}`);
      console.log(`  Should have teams: ${sponsoringSchools.length}`);
      
      if (sponsoringSchools.length === 0) {
        console.log(`  ⚠️  No sponsorship data available`);
      } else {
        // Get detailed team list for this sport
        const teamsResult = await client.query(`
          SELECT t.team_id, s.school
          FROM teams t
          JOIN schools s ON t.school_id = s.school_id
          JOIN sports sp ON t.sport_id = sp.sport_id
          WHERE sp.sport_name = $1
            AND s.school_id IN (${BIG12_SCHOOL_IDS.join(',')})
          ORDER BY s.school;
        `, [sportName]);
        
        const teamsToRemove = [];
        
        for (const team of teamsResult.rows) {
          const simplifiedName = SCHOOL_NAME_MAPPING[team.school];
          if (simplifiedName && !sponsoringSchools.includes(simplifiedName)) {
            teamsToRemove.push(team.school);
            
            // Track by school
            if (!teamsToRemoveBySchool[team.school]) {
              teamsToRemoveBySchool[team.school] = [];
            }
            teamsToRemoveBySchool[team.school].push(sportName);
          }
        }
        
        if (teamsToRemove.length > 0) {
          console.log(`  ❌ Teams to remove: ${teamsToRemove.length}`);
          console.log(`     Schools: ${teamsToRemove.join(', ')}`);
          totalTeamsToRemove += teamsToRemove.length;
        } else {
          console.log(`  ✅ All teams are valid`);
        }
      }
      console.log();
    }
    
    // Summary by school
    console.log('='.repeat(60));
    console.log('📋 CLEANUP PREVIEW BY SCHOOL');
    console.log('='.repeat(60));
    
    const schoolsWithRemovals = Object.keys(teamsToRemoveBySchool).sort();
    
    if (schoolsWithRemovals.length > 0) {
      for (const school of schoolsWithRemovals) {
        const sports = teamsToRemoveBySchool[school];
        console.log(`\n${school}: ${sports.length} teams to remove`);
        sports.forEach(sport => {
          console.log(`  - ${sport}`);
        });
      }
    } else {
      console.log('\n✅ No teams need to be removed!');
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    
    const totalTeamsResult = await client.query(`
      SELECT COUNT(*) as total
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      WHERE s.school_id IN (${BIG12_SCHOOL_IDS.join(',')});
    `);
    
    const currentTotal = parseInt(totalTeamsResult.rows[0].total);
    
    console.log(`Current Big 12 teams: ${currentTotal}`);
    console.log(`Teams to remove: ${totalTeamsToRemove}`);
    console.log(`Teams after cleanup: ${currentTotal - totalTeamsToRemove}`);
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyTeamsCleanup()
    .then(() => {
      console.log('\n✅ Verification completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyTeamsCleanup };