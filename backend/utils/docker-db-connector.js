/**
 * Docker DB Connector
 * 
 * Simplified implementation that works with Neon DB
 */

const { Pool } = require('pg');
const logger = console;

// Use environment variables for connection
const neonConfig = {
  connectionString: process.env.NEON_DB_CONNECTION_STRING,
  ssl: process.env.NEON_DB_SSL === 'true' ? 
    { rejectUnauthorized: false } : 
    false
};

// Singleton pool
let pool;

const connectToDockerPostgres = async () => {
  try {
    if (!pool) {
      pool = new Pool(neonConfig);
      
      // Test the connection
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      logger.info(`Connected to Neon DB at ${process.env.NEON_DB_HOST}`);
      logger.info(`Server time: ${result.rows[0].now}`);
      
      return { status: 'connected', pool };
    }
    
    return { status: 'already_connected', pool };
  } catch (error) {
    logger.error(`Failed to connect to Neon DB: ${error.message}`);
    return { status: 'error', error };
  }
};

module.exports = { 
  connectToDockerPostgres,
  getPool: () => pool
};