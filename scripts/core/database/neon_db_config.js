/**
 * HELiiX Neon DB Configuration
 * 
 * This module provides configuration for connecting to the Neon serverless PostgreSQL database.
 */

require('dotenv').config();

// Use the direct connection string from the environment variables
const connectionString = process.env.NEON_DB_CONNECTION_STRING;

// Parse components from the connection string for individual parameter access if needed
const parseConnectionString = (connStr) => {
  try {
    if (!connStr) return null;
    
    // Extract components using regex
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)(\?.*)?/;
    const match = connStr.match(regex);
    
    if (!match) return null;
    
    return {
      username: match[1],
      password: match[2],
      host: match[3],
      database: match[4],
      options: match[5] || ''
    };
  } catch (error) {
    console.error('Error parsing connection string:', error.message);
    return null;
  }
};

const parsedConn = parseConnectionString(connectionString);

module.exports = {
  // Direct connection string for Sequelize
  connectionString,
  
  // Connection details (for tools that need individual parameters)
  connection: {
    host: parsedConn?.host || process.env.NEON_DB_HOST,
    port: process.env.NEON_DB_PORT || 5432,
    database: parsedConn?.database || process.env.NEON_DB_NAME,
    username: parsedConn?.username || process.env.NEON_DB_USER,
    password: parsedConn?.password || process.env.PGPASSWORD,
    projectId: process.env.NEON_DB_PROJECT_ID,
    ssl: process.env.NEON_DB_SSL !== 'false',
    dialectOptions: {
      ssl: {
        require: process.env.NEON_DB_SSL !== 'false',
        rejectUnauthorized: false
      }
    }
  },
  
  // Pool configuration
  pool: {
    max: 20,
    min: 0,
    idle: 10000,
    acquire: 30000
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
