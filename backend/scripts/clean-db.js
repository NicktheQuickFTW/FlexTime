/**
 * FlexTime Scheduling System - Database Cleanup Script
 * 
 * Script to clean up any unwanted tables from the database.
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Configure logging
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`)
};

/**
 * Connect to the Docker PostgreSQL database using environment variables
 */
async function connectToDockerPostgres() {
  // Get database configuration from environment variables
  const dbHost = process.env.POSTGRES_HOST || 'localhost';
  const dbPort = process.env.POSTGRES_PORT || 5432;
  const dbName = process.env.POSTGRES_DB || 'flextime';
  const dbUser = process.env.POSTGRES_USER || 'postgres';
  const dbPassword = process.env.POSTGRES_PASSWORD || 'postgres';

  // Create Sequelize instance
  const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: (msg) => logger.info(msg)
  });

  // Test the connection
  try {
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL database');
    return sequelize;
  } catch (error) {
    logger.error(`Unable to connect to PostgreSQL database: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up unwanted tables from the database
 */
async function cleanupDatabase() {
  logger.info('Starting database cleanup');
  
  try {
    // Connect to the database
    const sequelize = await connectToDockerPostgres();
    
    // Tables to drop
    const tablesToDrop = [
      'seasons',
      'championships'
    ];
    
    // Drop each table if it exists
    for (const table of tablesToDrop) {
      logger.info(`Dropping table: ${table}`);
      await sequelize.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    
    // Drop enum types that might be left over
    const enumsToClean = [
      'enum_seasons_status',
      'enum_championships_status'
    ];
    
    for (const enumType of enumsToClean) {
      logger.info(`Dropping enum type: ${enumType}`);
      await sequelize.query(`DROP TYPE IF EXISTS ${enumType}`);
    }
    
    logger.info('Database cleanup completed successfully');
    
    // Close the connection
    await sequelize.close();
    
    return true;
  } catch (error) {
    logger.error(`Database cleanup failed: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
}

// Run the cleanup function
cleanupDatabase()
  .then(success => {
    if (success) {
      logger.info('Database cleanup completed successfully');
      process.exit(0);
    } else {
      logger.error('Database cleanup failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Unexpected error: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  });
