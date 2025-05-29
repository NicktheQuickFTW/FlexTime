const { Client } = require('pg');

async function testConnection() {
  const connectionString = 'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=require';
  
  console.log('Testing connection to Neon database...');
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to Neon database');
    
    // Test query
    const result = await client.query('SELECT current_database() as db_name, current_user as user_name, version() as version');
    console.log('\nDatabase Info:');
    console.table(result.rows);
    
    // List all tables
    const tables = await client.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'
       ORDER BY table_name;`
    );
    
    console.log('\nTables in database:');
    console.table(tables.rows);
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await client.end();
  }
}

testConnection().catch(console.error);
