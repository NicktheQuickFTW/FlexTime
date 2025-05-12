/**
 * test-championship-dates.js
 * 
 * Test script for verifying the enhanced ChampionshipDateManager functionality
 * with the NCAA tournament dates for the 2025-26 season.
 */

const { Pool } = require('pg');
const { ChampionshipDateManager } = require('./ChampionshipDateManager');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection
const connectionString = 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require';
const pool = new Pool({ connectionString });

// Test sports to check
const TEST_SPORTS = [
  { id: 1, name: "Men's Basketball" },
  { id: 2, name: "Women's Basketball" },
  { id: 8, name: "Football" },
  { id: 17, name: "Men's Soccer" },
  { id: 18, name: "Women's Soccer" },
  { id: 19, name: "Softball" },
  { id: 28, name: "Women's Volleyball" }
];

const SEASON = '2025-26';

/**
 * Run database migrations for NCAA tournament dates
 */
async function runMigrations() {
  try {
    console.log('Running NCAA tournament dates migration...');
    
    // Read migration SQL file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', 'ncaa-tournament-dates-2025-26.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('Migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error running migrations:', error);
    return false;
  }
}

/**
 * Test the ChampionshipDateManager functionality
 */
async function testChampionshipDates() {
  try {
    console.log('\n==== Testing Championship Date Management ====\n');
    
    // Create and initialize the Championship Date Manager
    const config = { database: { connectionString } };
    const championshipManager = new ChampionshipDateManager(config);
    await championshipManager.initialize();
    
    console.log('\n1. Testing Championship Date Calculation:');
    console.log('----------------------------------------');
    
    // Test calculating championship dates for each sport
    for (const sport of TEST_SPORTS) {
      console.log(`\nCalculating championship date for ${sport.name} (ID: ${sport.id}):`);
      
      const championshipInfo = await championshipManager.calculateChampionshipDates(sport.id, SEASON);
      
      if (championshipInfo) {
        console.log(` - Championship Date: ${championshipInfo.championshipDate}`);
        console.log(` - Calculation Method: ${championshipInfo.calculationMethod}`);
        console.log(` - Formula Details:`, championshipInfo.formulaDetails);
      } else {
        console.log(` - No championship date calculated`);
      }
    }
    
    console.log('\n2. Testing Championship Constraints for Scheduling:');
    console.log('------------------------------------------------');
    
    // Test getting championship constraints for each sport
    for (const sport of TEST_SPORTS) {
      console.log(`\nGetting championship constraints for ${sport.name} (ID: ${sport.id}):`);
      
      const constraints = await championshipManager.getChampionshipConstraints(sport.id, SEASON);
      
      if (constraints) {
        console.log(` - Championship Date: ${constraints.championshipDate}`);
        console.log(` - Regular Season Window: ${constraints.schedulingWindows.regularSeason.startDate} to ${constraints.schedulingWindows.regularSeason.endDate}`);
        console.log(` - Season Length: ${constraints.schedulingWindows.regularSeason.lengthInDays} days`);
        console.log(` - Blackout Dates: ${constraints.blackoutDates.length} dates`);
        
        // Display a sample of blackout dates (first 5)
        if (constraints.blackoutDates.length > 0) {
          console.log(`   Sample blackout dates: ${constraints.blackoutDates.slice(0, 5).join(', ')}${constraints.blackoutDates.length > 5 ? '...' : ''}`);
        }
      } else {
        console.log(` - No constraints generated`);
      }
    }
    
    console.log('\n==== Championship Date Testing Complete ====\n');
  } catch (error) {
    console.error('Error testing championship dates:', error);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the test
async function runTest() {
  // First run the migrations to ensure the NCAA dates are in the database
  const migrationSuccess = await runMigrations();
  
  if (migrationSuccess) {
    // Then test the championship date functionality
    await testChampionshipDates();
  } else {
    console.error('Aborting test due to migration failure');
  }
}

runTest().catch(err => {
  console.error('Unhandled error in test:', err);
  process.exit(1);
});
