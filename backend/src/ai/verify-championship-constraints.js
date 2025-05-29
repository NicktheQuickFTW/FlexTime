/**
 * verify-championship-constraints.js
 * 
 * A lightweight script to verify that the championship date constraints 
 * system is working correctly with the NCAA tournament dates.
 */

const { Pool } = require('pg');
const { ChampionshipDateManager } = require('./ChampionshipDateManager');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection
const connectionString = 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require';
const pool = new Pool({ connectionString });

// Sports to test
const TEST_SPORTS = [
  { id: 8, name: "Football" },
  { id: 1, name: "Men's Basketball" },
  { id: 2, name: "Women's Basketball" },
  { id: 19, name: "Softball" },
  { id: 20, name: "Baseball" }
];

const SEASON = '2025-26';

/**
 * Verify NCAA dates are properly loaded
 */
async function verifyNcaaDates() {
  console.log('\n========== VERIFYING NCAA DATES ==========\n');
  
  try {
    // Check NCAA tournament dates table
    const tournamentResult = await pool.query(`
      SELECT COUNT(*) FROM ncaa_tournament_dates WHERE season = $1
    `, [SEASON]);
    
    const tournamentCount = parseInt(tournamentResult.rows[0].count, 10);
    console.log(`NCAA Tournament Dates: ${tournamentCount} records found for ${SEASON} season`);
    
    // Check NCAA regular season dates table
    const regularSeasonResult = await pool.query(`
      SELECT COUNT(*) FROM ncaa_regular_season_dates WHERE season = $1
    `, [SEASON]);
    
    const regularSeasonCount = parseInt(regularSeasonResult.rows[0].count, 10);
    console.log(`NCAA Regular Season Dates: ${regularSeasonCount} records found for ${SEASON} season`);
    
    if (tournamentCount === 0 || regularSeasonCount === 0) {
      console.log('\n⚠️ NCAA dates are missing. You need to run the migration script first:');
      console.log('psql <connection_string> -f migrations/ncaa-tournament-dates-2025-26.sql');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying NCAA dates:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('\n⚠️ Required tables are missing. You need to run the migration script first:');
      console.log('psql <connection_string> -f migrations/ncaa-tournament-dates-2025-26.sql');
    }
    
    return false;
  }
}

/**
 * Verify championship constraints for test sports
 */
async function verifyChampionshipConstraints() {
  console.log('\n========== TESTING CHAMPIONSHIP CONSTRAINTS ==========\n');
  
  try {
    // Initialize Championship Date Manager
    const config = { database: { connectionString } };
    const championshipManager = new ChampionshipDateManager(config);
    await championshipManager.initialize();
    
    // Verify each sport
    for (const sport of TEST_SPORTS) {
      console.log(`\n----- Testing ${sport.name} -----`);
      
      // Get championship date
      console.log('Championship date calculation:');
      const championshipInfo = await championshipManager.calculateChampionshipDates(sport.id, SEASON);
      
      if (championshipInfo) {
        console.log(` ✓ Championship Date: ${championshipInfo.championshipDate}`);
        console.log(` ✓ Calculation Method: ${championshipInfo.calculationMethod}`);
      } else {
        console.log(` ✗ Could not calculate championship date`);
      }
      
      // Get regular season window
      console.log('\nRegular season window calculation:');
      if (championshipInfo) {
        const seasonWindow = await championshipManager.calculateRegularSeasonWindow(
          sport.id, SEASON, championshipInfo.championshipDate
        );
        
        if (seasonWindow) {
          console.log(` ✓ Season window: ${seasonWindow.startDate} to ${seasonWindow.endDate}`);
          console.log(` ✓ Season length: ${seasonWindow.lengthInDays} days`);
          if (seasonWindow.source) {
            console.log(` ✓ Source: ${seasonWindow.source}`);
          }
        } else {
          console.log(` ✗ Could not calculate regular season window`);
        }
      }
      
      // Get full constraints
      console.log('\nFull championship constraints:');
      const constraints = await championshipManager.getChampionshipConstraints(sport.id, SEASON);
      
      if (constraints) {
        console.log(` ✓ Championship Date: ${constraints.championshipDate}`);
        console.log(` ✓ Regular Season: ${constraints.schedulingWindows.regularSeason.startDate} to ${constraints.schedulingWindows.regularSeason.endDate}`);
        console.log(` ✓ Blackout Dates: ${constraints.blackoutDates.length} dates`);
        
        if (constraints.ncaaDates) {
          console.log('\nNCAA Official Dates:');
          if (constraints.ncaaDates.firstPractice) {
            console.log(` ✓ First Practice: ${constraints.ncaaDates.firstPractice}`);
          }
          if (constraints.ncaaDates.firstContest) {
            console.log(` ✓ First Contest: ${constraints.ncaaDates.firstContest}`);
          }
          if (constraints.ncaaDates.regularSeasonEnd) {
            console.log(` ✓ Regular Season End: ${constraints.ncaaDates.regularSeasonEnd}`);
          }
        }
      } else {
        console.log(` ✗ Could not get championship constraints`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying championship constraints:', error);
    return false;
  }
}

/**
 * Run the verification
 */
async function runVerification() {
  try {
    console.log('\n🔍 CHAMPIONSHIP DATES VERIFICATION TOOL');
    console.log('--------------------------------------\n');
    
    // Step 1: Verify NCAA dates are in the database
    const ncaaDatesValid = await verifyNcaaDates();
    
    // Step 2: Verify championship constraints
    if (ncaaDatesValid) {
      await verifyChampionshipConstraints();
    }
    
    console.log('\n========== VERIFICATION COMPLETE ==========\n');
  } catch (error) {
    console.error('Unhandled error during verification:', error);
  } finally {
    // Close DB connection
    await pool.end();
  }
}

// Run the verification
runVerification();
