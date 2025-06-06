const { Sequelize } = require('sequelize');
const heliiXConfig = require('../../config/neon_db_config');
// Note: fix-schedules-table script removed during refactoring
const logger = require("../../lib/logger");;

// Database connection with HELiiX validation
async function connectToDatabase() {
  let sequelizeConnection = null;
  
  console.log('🔌 Connecting to HELiiX Neon Database...');
  
  // Validate connection to HELiiX database first
  const validation = await heliiXConfig.validateConnection();
  if (!validation.success) {
    throw new Error(`Failed to validate HELiiX database connection: ${validation.error}`);
  }
  
  try {
    // Use the validated HELiiX configuration
    console.log('✅ Using validated HELiiX database configuration');
    sequelizeConnection = new Sequelize(heliiXConfig.connectionString, {
      dialect: 'postgres',
      logging: heliiXConfig.logging,
      dialectOptions: heliiXConfig.connection.dialectOptions,
      pool: heliiXConfig.pool
    });
    
    // Test the connection
    await sequelizeConnection.authenticate();
    
    // Verify we're connected to the correct database
    const [results] = await sequelizeConnection.query('SELECT current_database() as db_name');
    const dbName = results[0].db_name;
    
    if (dbName !== 'HELiiX') {
      throw new Error(`Connected to wrong database: ${dbName} (expected: HELiiX)`);
    }
    
    console.log(`✅ Successfully connected to HELiiX database (${dbName})`);
    
  } catch (error) {
    console.error('❌ Unable to connect to HELiiX database:', error.message);
    
    // Fallback to environment connection string if available
    if (process.env.NEON_DB_CONNECTION_STRING && !process.env.NEON_DB_CONNECTION_STRING.includes('HELiiX')) {
      console.warn('⚠️  Environment connection string does not point to HELiiX database');
    }
    
    throw error;
  }
  
  return sequelizeConnection;
}

// Initialize database connection and models
async function setupDatabase() {
  // Skip database setup if DISABLE_DATABASE is set
  if (process.env.DISABLE_DATABASE === 'true') {
    logger.info('Database connections disabled by configuration');
    
    // Create a mock database object with minimal functionality
    const mockDb = {
      Sport: { findAll: async () => [] },
      Championship: { findAll: async () => [] },
      Team: { findAll: async () => [] },
      School: { findAll: async () => [] },
      Schedule: { findAll: async () => [], findByPk: async () => null },
      Game: { findAll: async () => [] },
      sequelize: { transaction: async (fn) => fn({ commit: async () => {}, rollback: async () => {} }) }
    };
    
    // Return the mock db
    return mockDb;
  }
  
  try {
    const sequelize = await connectToDatabase();
    
    // Initialize core scheduling models
    const Team = require('../../models/db-team')(sequelize);
    const Schedule = require('../../models/db-schedule')(sequelize);
    const Game = require('../../models/db-game')(sequelize);
    const Sport = require('../../models/db-sport')(sequelize);
    const Venue = require('../../models/db-venue')(sequelize);
    const School = require('../../models/db-school')(sequelize);
    // const Championship = require('../../models/db-championship')(sequelize); // File doesn't exist
    const Constraint = require('../../models/db-constraint')(sequelize);

    // Note: fix-schedules-table functionality removed during refactoring
    if (process.env.FIX_SCHEDULES_TABLE === 'true') {
      logger.info('fix-schedules-table script is not available in refactored version');
    }

    // Create models object for associations
    const models = {
      Team,
      Schedule,
      Game,
      Sport,
      Venue,
      School,
      // Championship, // File doesn't exist
      Constraint
    };

    // Call associate functions if they exist
    Object.values(models).forEach(model => {
      if (model.associate) {
        model.associate(models);
      }
    });

    // Sync models with database (in development)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      console.log('Database models synchronized');
    }

    // Create a database object to export
    const db = {
      sequelize,
      Team,
      Schedule,
      Game,
      Sport,
      Venue,
      School,
      // Championship, // File doesn't exist
      Constraint
    };

    return db;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  setupDatabase
};