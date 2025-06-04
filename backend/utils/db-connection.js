// HELiiX Database Connection Module
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load environment variables
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .forEach(line => {
          const [key, ...values] = line.split('=');
          if (key && values.length) {
            process.env[key.trim()] = values.join('=').trim();
          }
        });
    }
  } catch (error) {
    console.error('Error loading environment variables:', error.message);
  }
}

loadEnv();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DB_CONNECTION_STRING,
  ssl: process.env.NEON_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.connect()
  .then(client => {
    console.log('✅ Connected to HELiiX database');
    client.query('SELECT current_database();')
      .then(result => {
        console.log('📊 Database:', result.rows[0].current_database);
        client.release();
      });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = { pool };