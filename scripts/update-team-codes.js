/**
 * Update Team Codes Script
 * 
 * This script updates all team codes in the database to follow the format:
 * [School Abbreviation]-[Sport Abbreviation]
 * Example: TCU-MBB for TCU Men's Basketball
 */

require('dotenv').config();
const { Client } = require('pg');
const path = require('path');

// Database connection
const connectToDatabase = async () => {
  try {
    // Check if we're running in Docker environment
    const isDockerEnvironment = process.env.POSTGRES_URI && process.env.POSTGRES_URI.includes('@postgres:');
    
    let connectionString;
    if (isDockerEnvironment) {
      console.log('Using Docker PostgreSQL connection');
      connectionString = process.env.POSTGRES_URI;
    } else {
      console.log('Using Neon DB connection');
      connectionString = process.env.NEON_DB_CONNECTION_STRING;
    }
    
    if (!connectionString) {
      throw new Error('No database connection string available');
    }
    
    const client = new Client({ connectionString });
    await client.connect();
    console.log('Connected to database successfully');
    return client;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

// Main function to update team codes
const updateTeamCodes = async () => {
  let client;
  
  try {
    client = await connectToDatabase();
    
    // Get all teams with their institution and sport information
    const teamsQuery = `
      SELECT 
        t.team_id, 
        t.name AS team_name, 
        t.code AS current_code,
        i.abbreviation AS institution_abbreviation, 
        s.abbreviation AS sport_abbreviation
      FROM 
        teams t
        JOIN institutions i ON t.institution_id = i.institution_id
        JOIN sports s ON t.sport_id = s.sport_id
    `;
    
    const teamsResult = await client.query(teamsQuery);
    const teams = teamsResult.rows;
    
    console.log(`Found ${teams.length} teams to update`);
    
    // Update each team's code
    let updatedCount = 0;
    for (const team of teams) {
      const newCode = `${team.institution_abbreviation}-${team.sport_abbreviation}`;
      
      if (team.current_code !== newCode) {
        const updateQuery = `
          UPDATE teams 
          SET code = $1, updated_at = NOW() 
          WHERE team_id = $2
        `;
        
        await client.query(updateQuery, [newCode, team.team_id]);
        updatedCount++;
        
        console.log(`Updated team code: ${team.team_name} from ${team.current_code || 'NULL'} to ${newCode}`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} team codes`);
    
    // Verify the updates
    const verifyQuery = `
      SELECT 
        t.name AS team_name, 
        t.code AS team_code,
        i.abbreviation AS institution_abbreviation, 
        s.abbreviation AS sport_abbreviation
      FROM 
        teams t
        JOIN institutions i ON t.institution_id = i.institution_id
        JOIN sports s ON t.sport_id = s.sport_id
      ORDER BY t.name
      LIMIT 10
    `;
    
    const verifyResult = await client.query(verifyQuery);
    console.log('\nSample of updated team codes:');
    verifyResult.rows.forEach(team => {
      console.log(`${team.team_name}: ${team.team_code} (Institution: ${team.institution_abbreviation}, Sport: ${team.sport_abbreviation})`);
    });
    
  } catch (error) {
    console.error('Error updating team codes:', error);
  } finally {
    if (client) {
      await client.end();
      console.log('Database connection closed');
    }
  }
};

// Run the script
updateTeamCodes()
  .then(() => console.log('Team code update completed'))
  .catch(err => console.error('Script failed:', err));
