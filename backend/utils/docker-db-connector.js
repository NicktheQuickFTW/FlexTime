/**
 * Docker-aware database connector for FlexTime
 * 
 * This module provides specialized connection logic for PostgreSQL
 * when running in Docker containers, ensuring proper network connection.
 */

const { Sequelize } = require('sequelize');
const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

/**
 * Create a Docker-optimized Sequelize connection
 * @param {string} uri - PostgreSQL connection URI
 * @returns {Sequelize} Sequelize instance
 */
function createDockerConnection(uri) {
  logger.info('Creating Docker-optimized database connection');
  
  try {
    // Extract connection details from URI to handle Docker networking properly
    const match = uri.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error(`Invalid PostgreSQL URI format: ${uri}`);
    }
    
    const [, username, password, host, port, database] = match;
    
    logger.info(`Connecting to PostgreSQL at ${host}:${port} as ${username}`);
    logger.info(`Database: ${database}`);
    
    // Create Sequelize instance with explicit parameters
    // This helps bypass potential localhost resolution issues in Docker
    return new Sequelize(database, username, password, {
      host,
      port: parseInt(port, 10),
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? msg => logger.debug(msg) : false,
      dialectOptions: {
        // Always disable SSL for Docker environments
        ssl: false
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      // Set these options to help with Docker network resolution
      retry: {
        max: 5,
        match: [
          /SequelizeConnectionRefusedError/,
          /SequelizeConnectionError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/
        ]
      }
    });
  } catch (error) {
    logger.error(`Error creating Docker database connection: ${error.message}`);
    throw error;
  }
}

/**
 * Connect to PostgreSQL database with Docker-aware optimizations
 * @returns {Promise<Object>} Database connection and models
 */
async function connectToDockerPostgres() {
  try {
    const postgresUri = process.env.POSTGRES_URI;
    
    if (!postgresUri) {
      throw new Error('POSTGRES_URI environment variable is not defined');
    }
    
    logger.info(`PostgreSQL URI: ${postgresUri}`);
    const sequelize = createDockerConnection(postgresUri);
    
    // Test the connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    return sequelize;
  } catch (error) {
    logger.error(`Failed to connect to Docker PostgreSQL: ${error.message}`);
    throw error;
  }
}

module.exports = {
  connectToDockerPostgres
};
