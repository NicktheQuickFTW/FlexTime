/**
 * Test Neon DB Connection
 * 
 * This script tests the connection to the Neon DB using the pg client directly.
 */

require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  console.log('Testing Neon DB connection...');
  
  // Try direct connection string first (most reliable)
  if (process.env.NEON_DB_CONNECTION_STRING) {
    console.log('\nMethod 1: Using direct connection string');
    const success = await tryConnection(process.env.NEON_DB_CONNECTION_STRING);
    if (success) return true;
  }
  
  // Try standard connection parameters
  console.log('\nMethod 2: Using standard connection parameters');
  await tryConnection({
    host: process.env.NEON_DB_HOST,
    port: process.env.NEON_DB_PORT || 5432,
    database: process.env.NEON_DB_NAME,
    user: process.env.NEON_DB_USER,
    password: process.env.PGPASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  console.log('\nAll connection methods failed. Please check your credentials and try again.');
  return false;
}

async function tryConnection(config) {
  const client = new Client(config);
  
  try {
    // Connect to the database
    await client.connect();
    console.log('✅ Successfully connected to Neon DB!');
    
    // Run a simple query to verify the connection
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`Current time from Neon DB: ${result.rows[0].current_time}`);
    
    // Close the connection
    await client.end();
    console.log('Connection closed');
    
    // Exit with success since we found a working connection method
    process.exit(0);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    
    // Try to close the connection if it was opened
    try {
      await client.end();
    } catch (closeError) {
      // Ignore errors when closing
    }
    
    return false;
  }
}

// Run the test
testConnection()
  .then((success) => {
    if (!success) {
      console.log('\nTroubleshooting tips:');
      console.log('1. Check that your Neon DB credentials are correct');
      console.log('2. Verify that your IP address is allowed in Neon DB network settings');
      console.log('3. Make sure you\'re using the correct branch in your Neon DB project');
      console.log('4. Try connecting with psql to verify your credentials');
      console.log('5. Check if your Neon DB project is active and not suspended');
      
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
