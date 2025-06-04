/**
 * Test Neon DB Direct Connection
 * 
 * This script tests a direct connection to the Neon DB.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../utils/logger');

async function testNeonConnection() {
  logger.info('Testing Neon DB connection...');
  
  // Get connection string from environment variables
  const connectionString = process.env.NEON_DB_CONNECTION_STRING;
  
  if (!connectionString) {
    logger.error('NEON_DB_CONNECTION_STRING environment variable is not set');
    return false;
  }
  
  // Create a new client with the connection string
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Successfully connected to Neon DB');
    
    // Try a simple query
    const result = await client.query('SELECT NOW()');
    logger.info(`Current time from database: ${result.rows[0].now}`);
    
    // Release client
    await client.end();
    logger.info('Connection closed');
    
    return true;
  } catch (error) {
    logger.error(`Failed to connect to Neon DB: ${error.message}`);
    
    // Try to end client connection if it was established
    try {
      await client.end();
    } catch (endError) {
      // Ignore errors from ending client
    }
    
    return false;
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testNeonConnection()
    .then(success => {
      if (success) {
        logger.info('Neon DB connection test successful');
        process.exit(0);
      } else {
        logger.error('Neon DB connection test failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testNeonConnection;