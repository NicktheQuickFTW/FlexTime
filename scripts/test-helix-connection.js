const { Client } = require('pg');
require('dotenv').config();

async function testHelixConnection() {
  // Use the connection details from .env but with the correct database name
  const connectionString = `postgresql://${process.env.NEON_DB_USER}:${process.env.NEON_DB_PASSWORD}@${process.env.NEON_DB_HOST}:${process.env.NEON_DB_PORT}/HELiiX?sslmode=require`;
  
  console.log('Testing connection to HELiiX database...');
  console.log('Connection string:', connectionString.replace(/:[^:]*@/, ':***@'));
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to HELiiX database');
    
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

testHelixConnection().catch(console.error);
