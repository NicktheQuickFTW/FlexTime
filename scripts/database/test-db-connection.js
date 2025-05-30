const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  // Use the connection string from environment variables
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  `postgresql://${process.env.NEON_DB_USER}:${process.env.NEON_DB_PASSWORD}@${process.env.NEON_DB_HOST}:${process.env.NEON_DB_PORT}/${process.env.NEON_DB_NAME}?sslmode=require`;

// Fallback to direct connection string if env vars are not set
const directConnectionString = 'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=require';

// Use direct connection if the constructed one is missing parts
const finalConnectionString = connectionString.includes('undefined') ? directConnectionString : connectionString;
  
  console.log('Testing connection to database...');
  console.log('Using connection string:', finalConnectionString.replace(/:[^:]*@/, ':***@'));
  
  const client = new Client({
    connectionString: finalConnectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    statement_timeout: 10000
  });
  
  console.log('Client configured with timeout:', client.connectionTimeoutMillis, 'ms');

  try {
    await client.connect();
    console.log('✅ Successfully connected to database');
    
    // Get database info
    const dbInfo = await client.query('SELECT current_database() as db_name, current_user as user_name, version() as version');
    console.log('\nDatabase Info:');
    console.table(dbInfo.rows);
    
    // List all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nTables in database:');
    console.table(tables.rows);
    
    // Check if sports table exists
    const sportsTableExists = tables.rows.some(t => t.table_name === 'sports');
    if (sportsTableExists) {
      console.log('\nSports table exists. Checking columns...');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'sports'
        ORDER BY ordinal_position;
      `);
      console.log('\nSports table columns:');
      console.table(columns.rows);
      
      // Get sample data
      const sample = await client.query('SELECT * FROM sports LIMIT 3');
      console.log('\nSample data from sports table:');
      console.table(sample.rows);
    } else {
      console.log('\nSports table does not exist yet');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await client.end();
  }
}

testConnection().catch(console.error);
