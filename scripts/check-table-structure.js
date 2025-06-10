/**
 * Check Table Structure in Neon DB
 * 
 * This script checks the structure of tables in the Neon DB.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('/Users/nickw/Documents/GitHub/Flextime/FlexTime/utils/logger.js');

async function checkTableStructure() {
  logger.info('Checking table structure in Neon DB...');
  
  // Create a client with the direct connection string
  const client = new Client(process.env.NEON_DB_CONNECTION_STRING);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Get the current user
    const userResult = await client.query('SELECT current_user;');
    const currentUser = userResult.rows[0].current_user;
    logger.info(`Current user: ${currentUser}`);
    
    // Set the search path to use the user's schema
    await client.query(`SET search_path TO ${currentUser}, public;`);
    logger.info(`Set search path to: ${currentUser}, public`);
    
    // Check sports table structure
    const sportsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${currentUser}' 
      AND table_name = 'sports';
    `);
    
    logger.info('Sports table columns:');
    sportsColumns.rows.forEach(column => {
      logger.info(`- ${column.column_name} (${column.data_type})`);
    });
    
    // Check championships table structure
    const championshipsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${currentUser}' 
      AND table_name = 'championships';
    `);
    
    logger.info('Championships table columns:');
    championshipsColumns.rows.forEach(column => {
      logger.info(`- ${column.column_name} (${column.data_type})`);
    });
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    return true;
  } catch (error) {
    logger.error(`Failed to check table structure: ${error.message}`);
    
    // Try to close the connection if it was opened
    try {
      await client.end();
    } catch (closeError) {
      // Ignore errors when closing
    }
    
    return false;
  }
}

// Run the script if executed directly
if (require.main === module) {
  checkTableStructure()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  checkTableStructure
};
