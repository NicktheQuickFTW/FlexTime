const { Client } = require('pg');
require('dotenv').config();

async function listDatabases() {
  const connectionString = process.env.NEON_DB_CONNECTION_STRING || 'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=require';
  
  console.log('Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // List all databases
    const result = await client.query(
      'SELECT datname FROM pg_database WHERE datistemplate = false;'
    );
    
    console.log('Available databases:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error listing databases:', error);
  } finally {
    await client.end();
  }
}

listDatabases().catch(console.error);
