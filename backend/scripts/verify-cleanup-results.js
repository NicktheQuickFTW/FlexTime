/**
 * Verify Cleanup Results Script
 * 
 * This script verifies that the cleanup was successful and shows the final state
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

async function verifyCleanupResults() {
  console.log('✅ Verifying Cleanup Results...\n');
  
  const client = await pool.connect();
  
  try {
    // Get current state
    const currentStateResult = await client.query(`
      SELECT 
        sp.sport_name,
        COUNT(DISTINCT t.team_id) as team_count,
        STRING_AGG(s.school, ', ' ORDER BY s.school) as schools
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE s.school_id IN (${BIG12_SCHOOL_IDS.join(',')})
      GROUP BY sp.sport_name
      ORDER BY sp.sport_name;
    `);
    
    console.log('📊 Big 12 Teams After Cleanup:\n');
    
    let allValid = true;
    const invalidTeams = [];
    
    for (const row of currentStateResult.rows) {
      const sportName = row.sport_name;
      const currentTeamCount = parseInt(row.team_count);
      const sponsoringSchools = BIG12_SPORT_SPONSORSHIPS[sportName] || [];
      const expectedCount = sponsoringSchools.length;
      
      const status = currentTeamCount === expectedCount ? '✅' : '❌';
      console.log(`${status} ${sportName}: ${currentTeamCount} teams (expected: ${expectedCount})`);
      
      if (currentTeamCount !== expectedCount) {
        allValid = false;
        
        // Get detailed list to see what's wrong
        const teamsResult = await client.query(`
          SELECT s.school
          FROM teams t
          JOIN schools s ON t.school_id = s.school_id
          JOIN sports sp ON t.sport_id = sp.sport_id
          WHERE sp.sport_name = $1
            AND s.school_id IN (${BIG12_SCHOOL_IDS.join(',')})
          ORDER BY s.school;
        `, [sportName]);
        
        const currentSchools = teamsResult.rows.map(t => SCHOOL_NAME_MAPPING[t.school] || t.school);
        const missingSchools = sponsoringSchools.filter(school => !currentSchools.includes(school));
        const extraSchools = currentSchools.filter(school => !sponsoringSchools.includes(school));
        
        if (missingSchools.length > 0) {
          console.log(`   Missing teams: ${missingSchools.join(', ')}`);
        }
        if (extraSchools.length > 0) {
          console.log(`   Unexpected teams: ${extraSchools.join(', ')}`);
          extraSchools.forEach(school => {
            invalidTeams.push({ sport: sportName, school });
          });
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const totalTeamsResult = await client.query(`
      SELECT COUNT(*) as total
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      WHERE s.school_id IN (${BIG12_SCHOOL_IDS.join(',')});
    `);
    
    const currentTotal = parseInt(totalTeamsResult.rows[0].total);
    
    console.log(`Total Big 12 teams: ${currentTotal}`);
    
    if (allValid) {
      console.log('\n✅ All teams are valid! Cleanup was successful.');
    } else {
      console.log('\n❌ Some discrepancies found:');
      if (invalidTeams.length > 0) {
        console.log('\nTeams that should have been removed but weren\'t:');
        invalidTeams.forEach(({ sport, school }) => {
          console.log(`  - ${school} ${sport}`);
        });
      }
    }
    
    // Show school summary
    console.log('\n📋 Teams by School:');
    const schoolSummary = await client.query(`
      SELECT 
        s.school,
        COUNT(DISTINCT t.team_id) as team_count,
        STRING_AGG(DISTINCT sp.sport_name, ', ' ORDER BY sp.sport_name) as sports
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE s.school_id IN (${BIG12_SCHOOL_IDS.join(',')})
      GROUP BY s.school
      ORDER BY s.school;
    `);
    
    schoolSummary.rows.forEach(row => {
      console.log(`\n${row.school}: ${row.team_count} teams`);
      console.log(`  Sports: ${row.sports}`);
    });
    
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
  verifyCleanupResults()
    .then(() => {
      console.log('\n✅ Verification completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyCleanupResults };