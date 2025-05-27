/**
 * Simple Neon Database Connection Test
 */

const { Client } = require('pg');

// Connection configuration
const config = {
  host: 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech',
  port: 5432,
  database: 'HELiiX',
  user: 'xii-os_owner',
  password: 'npg_4qYJFR0lneIg',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000, // 10 seconds
  query_timeout: 10000
};

async function testConnection() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Attempting to connect to Neon Database...');
    console.log(`Host: ${config.host}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}`);
    
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('📊 Database Info:');
    console.log(`  Current Time: ${result.rows[0].current_time}`);
    console.log(`  Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    
    // Test if HELiiX database exists
    const dbResult = await client.query(`
      SELECT datname FROM pg_database WHERE datname = 'HELiiX'
    `);
    
    if (dbResult.rows.length > 0) {
      console.log('✅ HELiiX database exists');
    } else {
      console.log('⚠️ HELiiX database not found');
    }
    
    // List existing tables
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('📋 Existing tables:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    } else {
      console.log('  No tables found (new database)');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Possible solutions:');
      console.log('  - Check if Neon database is active');
      console.log('  - Verify connection string and credentials');
      console.log('  - Check firewall/network restrictions');
    }
  } finally {
    try {
      await client.end();
      console.log('🔌 Connection closed');
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

// Alternative connection using connection string
async function testConnectionString() {
  const connectionString = 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require';
  
  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 10000
  });
  
  try {
    console.log('\n🔄 Testing with connection string...');
    await client.connect();
    console.log('✅ Connection string method successful!');
    
    const result = await client.query('SELECT current_database(), current_user');
    console.log(`Connected to database: ${result.rows[0].current_database}`);
    console.log(`Connected as user: ${result.rows[0].current_user}`);
    
  } catch (error) {
    console.error('❌ Connection string method failed:', error.message);
  } finally {
    try {
      await client.end();
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

// Run both tests
async function runTests() {
  console.log('🚀 FlexTime Neon Database Connection Test\n');
  
  await testConnection();
  await testConnectionString();
  
  console.log('\n🏁 Test completed');
}

runTests();