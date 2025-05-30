/**
 * Clean Teams Table Script V2
 * 
 * This script removes teams from the database for sports that schools don't actually sponsor
 * based on the official Big 12 Conference sport sponsorships.
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Big 12 Sport Sponsorships (from CLAUDE.md)
const BIG12_SPORT_SPONSORSHIPS = {
  'Baseball': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Houston', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  'Beach Volleyball': ['Arizona', 'Arizona State', 'TCU'],
  'Equestrian': ['Baylor', 'Oklahoma State', 'TCU'],
  'Football': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  'Gymnastics': ['Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia'],
  'Lacrosse': ['Arizona State', 'Cincinnati', 'Colorado'],
  "Men's Basketball": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Men's Cross Country": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
  "Men's Golf": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Men's Indoor Track & Field": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
  "Men's Outdoor Track & Field": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
  "Men's Swimming & Diving": ['Arizona', 'Arizona State', 'BYU', 'Cincinnati', 'TCU', 'Utah', 'West Virginia'],
  "Men's Tennis": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah'],
  'Rowing': ['Kansas', 'Kansas State', 'UCF', 'West Virginia'],
  'Soccer': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  'Softball': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Houston', 'Iowa State', 'Kansas', 'Oklahoma State', 'Texas Tech', 'UCF', 'Utah'],
  'Volleyball': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Basketball": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Cross Country": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Golf": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF'],
  "Women's Indoor Track & Field": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Outdoor Track & Field": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Swimming & Diving": ['Arizona', 'Arizona State', 'BYU', 'Cincinnati', 'Houston', 'Iowa State', 'Kansas', 'TCU', 'Utah', 'West Virginia'],
  "Women's Tennis": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  'Wrestling': ['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia']
};

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

async function cleanTeamsTable() {
  console.log('🧹 Starting Teams Table Cleanup...\n');
  
  const removedTeams = [];
  const errors = [];
  let totalRemoved = 0;
  
  const client = await pool.connect();
  
  try {
    // Create backup of teams table
    console.log('📦 Creating backup of teams table...');
    const backupPath = path.join(__dirname, `../data/backups/teams_backup_${new Date().toISOString().split('T')[0]}.json`);
    
    // Ensure backup directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    // Get all Big 12 teams for backup
    const allTeamsResult = await client.query(`
      SELECT t.*, s.school, sp.sport_name
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE s.school_id IN (${BIG12_SCHOOL_IDS.join(',')})
      ORDER BY s.school, sp.sport_name;
    `);
    
    await fs.writeFile(backupPath, JSON.stringify(allTeamsResult.rows, null, 2));
    console.log(`✅ Backup created at: ${backupPath}`);
    console.log(`   Total Big 12 teams backed up: ${allTeamsResult.rows.length}\n`);
    
    // Get all sports
    const sportsResult = await client.query(`
      SELECT sport_id, sport_name
      FROM sports
      ORDER BY sport_name;
    `);
    
    console.log(`Found ${sportsResult.rows.length} sports in the database.\n`);
    
    // Process each sport
    for (const sport of sportsResult.rows) {
      const sportName = sport.sport_name;
      console.log(`\n📊 Processing ${sportName}...`);
      
      // Get schools that sponsor this sport (using our mapping)
      const sponsoringSchools = BIG12_SPORT_SPONSORSHIPS[sportName] || [];
      
      if (sponsoringSchools.length === 0) {
        console.log(`  ⚠️  No sponsorship data found for ${sportName}`);
        continue;
      }
      
      console.log(`  Schools that sponsor ${sportName}: ${sponsoringSchools.length}`);
      
      // Get all Big 12 teams for this sport
      const teamsResult = await client.query(`
        SELECT t.team_id, t.name as team_name, s.school_id, s.school, sp.sport_name
        FROM teams t
        JOIN schools s ON t.school_id = s.school_id
        JOIN sports sp ON t.sport_id = sp.sport_id
        WHERE sp.sport_id = $1
          AND s.school_id IN (${BIG12_SCHOOL_IDS.join(',')})
        ORDER BY s.school;
      `, [sport.sport_id]);
      
      console.log(`  Found ${teamsResult.rows.length} Big 12 teams for ${sportName}`);
      
      // Check each team
      for (const team of teamsResult.rows) {
        const schoolName = team.school;
        const simplifiedName = SCHOOL_NAME_MAPPING[schoolName];
        
        if (!simplifiedName) {
          console.log(`  ⚠️  Unknown school mapping for: ${schoolName}`);
          continue;
        }
        
        // Check if this school sponsors this sport
        if (!sponsoringSchools.includes(simplifiedName)) {
          // This team should be removed
          console.log(`  ❌ Removing: ${schoolName} ${sportName} (Team ID: ${team.team_id})`);
          
          try {
            // Start transaction
            await client.query('BEGIN');
            
            // Delete the team
            await client.query('DELETE FROM teams WHERE team_id = $1', [team.team_id]);
            
            await client.query('COMMIT');
            
            removedTeams.push({
              team_id: team.team_id,
              school: schoolName,
              simplified_name: simplifiedName,
              sport: sportName
            });
            
            totalRemoved++;
          } catch (error) {
            await client.query('ROLLBACK');
            console.error(`  ⚠️  Error removing team ${team.team_id}:`, error.message);
            errors.push({
              team_id: team.team_id,
              school: schoolName,
              sport: sportName,
              error: error.message
            });
          }
        }
      }
    }
    
    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📋 CLEANUP SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`Total teams removed: ${totalRemoved}`);
    console.log(`Errors encountered: ${errors.length}`);
    
    if (removedTeams.length > 0) {
      console.log('\n🗑️  Removed Teams:');
      
      // Group by sport
      const removedBySport = removedTeams.reduce((acc, team) => {
        if (!acc[team.sport]) acc[team.sport] = [];
        acc[team.sport].push(team);
        return acc;
      }, {});
      
      Object.entries(removedBySport).forEach(([sport, teams]) => {
        console.log(`\n  ${sport}: ${teams.length} teams removed`);
        teams.forEach(team => {
          console.log(`    - ${team.school} (ID: ${team.team_id})`);
        });
      });
    }
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach(error => {
        console.log(`  - ${error.school} ${error.sport}: ${error.error}`);
      });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, `../data/reports/teams_cleanup_report_${new Date().toISOString().split('T')[0]}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRemoved: totalRemoved,
        errorsCount: errors.length
      },
      removedTeams,
      errors,
      sportSponsorships: BIG12_SPORT_SPONSORSHIPS
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Final verification
    console.log('\n🔍 Final Verification:');
    const finalCountResult = await client.query(`
      SELECT COUNT(*) as remaining_teams
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      WHERE s.school_id IN (${BIG12_SCHOOL_IDS.join(',')});
    `);
    
    console.log(`  Big 12 teams remaining in database: ${finalCountResult.rows[0].remaining_teams}`);
    
  } catch (error) {
    console.error('\n❌ Critical error during cleanup:', error);
    throw error;
  } finally {
    // Close database connection
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanTeamsTable()
    .then(() => {
      console.log('\n✅ Teams table cleanup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Teams table cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanTeamsTable, BIG12_SPORT_SPONSORSHIPS };