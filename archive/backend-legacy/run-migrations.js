const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection configuration
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=require';

console.log('Connecting to database with connection string:', 
  connectionString.replace(/:[^:]*@/, ':***@')); // Hide password in logs

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Increase the timeout for long-running migrations
  statement_timeout: 60000, // 60 seconds
  query_timeout: 60000,     // 60 seconds
  idle_in_transaction_session_timeout: 60000, // 60 seconds
  connectionTimeoutMillis: 10000 // 10 seconds to connect
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(name)
      );
    `);
    
    // Get all migration files in order
    const migrationDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .filter(file => file.match(/^\d+_.+\.sql$/)); // Only files with number prefix
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Get already run migrations
    const { rows: runMigrations } = await client.query('SELECT name FROM _migrations');
    const runMigrationNames = new Set(runMigrations.map(m => m.name));
    
    let migrationsRun = 0;
    
    // Execute each migration file that hasn't been run yet
    for (const file of migrationFiles) {
      if (runMigrationNames.has(file)) {
        console.log(`⏩ Skipping already run migration: ${file}`);
        continue;
      }
      
      const filePath = path.join(migrationDir, file);
      console.log(`\n🚀 Running migration: ${file}`);
      
      try {
        await client.query('BEGIN');
        
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        
        // Record the migration
        await client.query(
          'INSERT INTO _migrations (name) VALUES ($1)',
          [file]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Successfully applied migration: ${file}`);
        migrationsRun++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Error in migration ${file}:`, error);
        throw error;
      }
    }
    
    if (migrationsRun === 0) {
      console.log('\n✨ No new migrations to run. Database is up to date!');
    } else {
      console.log(`\n🎉 Successfully ran ${migrationsRun} migration(s)!`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run with better error handling
runMigrations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Unhandled error in migrations:', error);
    process.exit(1);
  });
