/**
 * Check Database Structure Script
 * 
 * This script checks the actual structure of the database tables
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.NEON_DB_CONNECTION_STRING || 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure...\n');
  
  const client = await pool.connect();
  
  try {
    // Check teams table structure
    console.log('📊 Teams Table Structure:');
    const teamsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'teams'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in teams table:');
    teamsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check if there's a sport_id column
    const hasSportId = teamsStructure.rows.some(row => row.column_name === 'sport_id');
    console.log(`\n✅ Has sport_id column: ${hasSportId}`);
    
    // Get sample data from teams table
    console.log('\n📋 Sample Teams Data:');
    const sampleTeams = await client.query(`
      SELECT t.*, s.school, sp.sport_name
      FROM teams t
      LEFT JOIN schools s ON t.school_id = s.school_id
      LEFT JOIN sports sp ON t.sport_id = sp.sport_id
      LIMIT 10;
    `);
    
    if (sampleTeams.rows.length > 0) {
      console.log('First few teams:');
      sampleTeams.rows.forEach(team => {
        console.log(`  - Team ID: ${team.team_id}, School: ${team.school || 'N/A'}, Sport: ${team.sport_name || 'N/A'}`);
      });
    }
    
    // Check sports table
    console.log('\n📊 Sports Table Data:');
    const sports = await client.query(`
      SELECT sport_id, sport_name, gender, team_count
      FROM sports
      ORDER BY sport_name;
    `);
    
    console.log(`Total sports: ${sports.rows.length}`);
    sports.rows.forEach(sport => {
      console.log(`  - ${sport.sport_name} (ID: ${sport.sport_id}, Gender: ${sport.gender || 'N/A'})`);
    });
    
    // Check schools table
    console.log('\n📊 Schools Table Summary:');
    const schoolsCount = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(DISTINCT CASE WHEN school LIKE '%Arizona%' THEN school END) as arizona_schools,
             COUNT(DISTINCT CASE WHEN school IN ('Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
                                                 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State',
                                                 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia') 
                           THEN school END) as big12_schools
      FROM schools;
    `);
    
    const counts = schoolsCount.rows[0];
    console.log(`  - Total schools: ${counts.total}`);
    console.log(`  - Big 12 schools: ${counts.big12_schools}`);
    
    // Get Big 12 schools
    console.log('\n🏈 Big 12 Schools in Database:');
    const big12Schools = await client.query(`
      SELECT school_id, school, short_display
      FROM schools
      WHERE school IN ('Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
                       'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State',
                       'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia')
      ORDER BY school;
    `);
    
    big12Schools.rows.forEach(school => {
      console.log(`  - ${school.school} (ID: ${school.school_id}, Display: ${school.short_display || 'N/A'})`);
    });
    
    // Count teams by sport for Big 12 schools
    console.log('\n📊 Big 12 Teams by Sport:');
    const teamsBySport = await client.query(`
      SELECT sp.sport_name, COUNT(DISTINCT t.team_id) as team_count,
             STRING_AGG(DISTINCT s.school, ', ' ORDER BY s.school) as schools
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE s.school IN ('Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
                         'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State',
                         'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia')
      GROUP BY sp.sport_name
      ORDER BY sp.sport_name;
    `);
    
    teamsBySport.rows.forEach(sport => {
      console.log(`\n${sport.sport_name}: ${sport.team_count} teams`);
      console.log(`  Schools: ${sport.schools}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkDatabaseStructure()
    .then(() => {
      console.log('\n✅ Database structure check completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Database structure check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseStructure };