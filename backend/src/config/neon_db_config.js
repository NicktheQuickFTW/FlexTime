/**
 * HELiiX Neon PostgreSQL Database Configuration
 * 
 * This module provides consolidated configuration for connecting to the Neon serverless PostgreSQL database.
 * Combines the best features from previous neon_db_config.js and heliix_database_config.js
 */

require('dotenv').config();

// HELiiX Database Connection Details
const HELIIX_DATABASE_CONFIG = {
  // Primary connection details for HELiiX database
  host: 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech',
  port: 5432,
  database: 'HELiiX',
  username: 'xii-os_owner',
  
  // Connection string template
  getConnectionString: (password) => 
    `postgresql://${HELIIX_DATABASE_CONFIG.username}:${password}@${HELIIX_DATABASE_CONFIG.host}:${HELIIX_DATABASE_CONFIG.port}/${HELIIX_DATABASE_CONFIG.database}?sslmode=require`,
};

// Parse components from the connection string for individual parameter access if needed
const parseConnectionString = (connStr) => {
  try {
    if (!connStr) return null;
    
    // Extract components using regex
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)(\?.*)?/;
    const match = connStr.match(regex);
    
    if (!match) return null;
    
    const parsed = {
      username: match[1],
      password: match[2],
      host: match[3],
      database: match[4],
      options: match[5] || ''
    };
    
    // Validate that we're connecting to HELiiX database
    if (parsed.database !== 'HELiiX') {
      console.warn(`⚠️  Warning: Connection string points to '${parsed.database}' but should be 'HELiiX'`);
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing connection string:', error.message);
    return null;
  }
};

/**
 * Get the validated connection configuration
 */
function getValidatedConfig() {
  // Try to get connection string from environment
  const envConnectionString = process.env.NEON_DB_CONNECTION_STRING;
  const parsedConn = parseConnectionString(envConnectionString);
  
  // Get password from multiple possible sources
  const password = process.env.NEON_DB_PASSWORD || 
                   parsedConn?.password || 
                   process.env.PGPASSWORD;
  
  // Build final connection string ensuring HELiiX database
  const connectionString = envConnectionString && parsedConn?.database === 'HELiiX' 
    ? envConnectionString 
    : HELIIX_DATABASE_CONFIG.getConnectionString(password);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Database Configuration:');
    console.log(`   Host: ${HELIIX_DATABASE_CONFIG.host}`);
    console.log(`   Database: ${HELIIX_DATABASE_CONFIG.database}`);
    console.log(`   Username: ${HELIIX_DATABASE_CONFIG.username}`);
    console.log(`   SSL: Required`);
  }
  
  return {
    connectionString,
    connection: {
      host: parsedConn?.host || process.env.NEON_DB_HOST || HELIIX_DATABASE_CONFIG.host,
      port: process.env.NEON_DB_PORT || HELIIX_DATABASE_CONFIG.port,
      database: parsedConn?.database || process.env.NEON_DB_NAME || HELIIX_DATABASE_CONFIG.database,
      username: parsedConn?.username || process.env.NEON_DB_USER || HELIIX_DATABASE_CONFIG.username,
      password: password,
      projectId: process.env.NEON_DB_PROJECT_ID,
      ssl: process.env.NEON_DB_SSL !== 'false',
      dialectOptions: {
        ssl: {
          require: process.env.NEON_DB_SSL !== 'false',
          rejectUnauthorized: false
        }
      }
    },
    // Pool configuration - Immediate manageable scaling
    pool: {
      max: 100,                    // 5x increase (safe and manageable)
      min: 10,                     // Keep connections warm
      idle: 10000,                 // Standard idle timeout  
      acquire: 30000,              // Standard acquisition timeout
      evict: 1000,                 // Faster connection eviction
      handleDisconnects: true,     // Auto-handle disconnects
      validate: (connection) => {  // Validate connections
        return connection && !connection._invalid;
      }
    },
    // Logging configuration
    logging: process.env.NODE_ENV === 'development',
    // Sequelize configuration
    sequelize: {
      dialect: 'postgres',
      define: {
        timestamps: true,
        underscored: true
      }
    }
  };
}

/**
 * Validate connection to HELiiX database
 */
async function validateConnection() {
  const { Pool } = require('pg');
  const config = getValidatedConfig();
  
  const pool = new Pool({
    connectionString: config.connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔌 Testing connection to HELiiX database...');
    
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as username,
        version() as postgres_version,
        NOW() as server_time
    `);
    
    const dbInfo = result.rows[0];
    client.release();
    await pool.end();
    
    if (dbInfo.database_name !== 'HELiiX') {
      throw new Error(`Connected to wrong database: ${dbInfo.database_name} (expected: HELiiX)`);
    }
    
    console.log('✅ Successfully connected to HELiiX database');
    console.log(`   Database: ${dbInfo.database_name}`);
    console.log(`   User: ${dbInfo.username}`);
    console.log(`   Server Time: ${dbInfo.server_time}`);
    
    return { success: true, dbInfo };
    
  } catch (error) {
    console.error('❌ Failed to connect to HELiiX database:', error.message);
    await pool.end();
    return { success: false, error: error.message };
  }
}

// Export the configuration
const config = getValidatedConfig();

module.exports = {
  ...config,
  validateConnection,
  HELIIX_DATABASE_CONFIG
};
