/**
 * Setup Neon DB Permissions
 * 
 * This script sets up the correct permissions for the Neon DB user to create tables
 * and perform other operations in the database.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('/Users/nickw/Documents/GitHub/Flextime/FlexTime/utils/logger.js');

async function setupPermissions() {
  logger.info('Setting up Neon DB permissions...');
  
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
    
    // Create a schema for the current user if it doesn't exist
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${currentUser} AUTHORIZATION ${currentUser};`);
    logger.info(`Created schema: ${currentUser}`);
    
    // Grant permissions on the public schema
    await client.query(`GRANT ALL ON SCHEMA public TO ${currentUser};`);
    logger.info('Granted permissions on public schema');
    
    // Set the search path to include both schemas
    await client.query(`ALTER USER ${currentUser} SET search_path TO public, ${currentUser};`);
    logger.info(`Set search path to: public, ${currentUser}`);
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Neon DB permissions setup completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to set up Neon DB permissions: ${error.message}`);
    
    // Try to close the connection if it was opened
    try {
      await client.end();
    } catch (closeError) {
      // Ignore errors when closing
    }
    
    return false;
  }
}

// Run the setup
setupPermissions()
  .then(success => {
    if (!success) {
      logger.error('Failed to set up Neon DB permissions');
      process.exit(1);
    } else {
      logger.info('Neon DB permissions setup completed successfully');
      process.exit(0);
    }
  })
  .catch(error => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
