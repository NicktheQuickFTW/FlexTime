/**
 * Find Big 12 Schools Script
 * 
 * This script finds the actual Big 12 school names in the database
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

async function findBig12Schools() {
  console.log('🔍 Finding Big 12 Schools in Database...\n');
  
  const client = await pool.connect();
  
  try {
    // Search for schools with Big 12 related names
    console.log('📊 Searching for Big 12 Schools:');
    const big12Keywords = [
      'Arizona', 'Baylor', 'BYU', 'Brigham Young', 'Cincinnati', 'Colorado',
      'Houston', 'Iowa State', 'Kansas', 'Oklahoma State', 'TCU', 'Texas Christian',
      'Texas Tech', 'UCF', 'Central Florida', 'Utah', 'West Virginia'
    ];
    
    for (const keyword of big12Keywords) {
      const result = await client.query(`
        SELECT school_id, school, short_display, preferred_school_name
        FROM schools
        WHERE LOWER(school) LIKE LOWER($1)
           OR LOWER(short_display) LIKE LOWER($1)
           OR LOWER(preferred_school_name) LIKE LOWER($1)
        ORDER BY school_id
        LIMIT 5;
      `, [`%${keyword}%`]);
      
      if (result.rows.length > 0) {
        console.log(`\n🔎 Schools matching "${keyword}":`);
        result.rows.forEach(school => {
          console.log(`  - ID: ${school.school_id}, Name: "${school.school}", Display: "${school.short_display || 'N/A'}", Preferred: "${school.preferred_school_name || 'N/A'}"`);
        });
      }
    }
    
    // Also check for teams with these keywords to understand the data better
    console.log('\n\n📊 Checking Teams for Big 12 Schools:');
    const teamResults = await client.query(`
      SELECT DISTINCT s.school_id, s.school, COUNT(DISTINCT t.sport_id) as sport_count
      FROM schools s
      JOIN teams t ON s.school_id = t.school_id
      WHERE LOWER(s.school) LIKE '%arizona%'
         OR LOWER(s.school) LIKE '%baylor%'
         OR LOWER(s.school) LIKE '%byu%'
         OR LOWER(s.school) LIKE '%brigham young%'
         OR LOWER(s.school) LIKE '%cincinnati%'
         OR LOWER(s.school) LIKE '%colorado%'
         OR LOWER(s.school) LIKE '%houston%'
         OR LOWER(s.school) LIKE '%iowa state%'
         OR LOWER(s.school) LIKE '%kansas%'
         OR LOWER(s.school) LIKE '%oklahoma state%'
         OR LOWER(s.school) LIKE '%tcu%'
         OR LOWER(s.school) LIKE '%texas christian%'
         OR LOWER(s.school) LIKE '%texas tech%'
         OR LOWER(s.school) LIKE '%ucf%'
         OR LOWER(s.school) LIKE '%central florida%'
         OR LOWER(s.school) LIKE '%utah%'
         OR LOWER(s.school) LIKE '%west virginia%'
      GROUP BY s.school_id, s.school
      ORDER BY s.school;
    `);
    
    if (teamResults.rows.length > 0) {
      console.log(`Found ${teamResults.rows.length} potential Big 12 schools with teams:`);
      teamResults.rows.forEach(school => {
        console.log(`  - ${school.school} (ID: ${school.school_id}) - ${school.sport_count} sports`);
      });
    }
    
    // Get a sample of all schools to understand naming patterns
    console.log('\n\n📋 Sample of All Schools (first 50):');
    const allSchools = await client.query(`
      SELECT school_id, school, short_display
      FROM schools
      ORDER BY school_id
      LIMIT 50;
    `);
    
    allSchools.rows.forEach(school => {
      console.log(`  - ID: ${school.school_id}, Name: "${school.school}", Display: "${school.short_display || 'N/A'}"`);
    });
    
  } catch (error) {
    console.error('❌ Error finding schools:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the search if this script is executed directly
if (require.main === module) {
  findBig12Schools()
    .then(() => {
      console.log('\n✅ School search completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ School search failed:', error);
      process.exit(1);
    });
}

module.exports = { findBig12Schools };