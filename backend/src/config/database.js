const { Sequelize } = require('sequelize');
const heliiXConfig = require('../../config/neon_db_config');
// Note: fix-schedules-table script removed during refactoring
const logger = require('../../utils/logger');

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
      Institution: { findAll: async () => [] },
      Schedule: { findAll: async () => [], findByPk: async () => null },
      Game: { findAll: async () => [] },
      sequelize: { transaction: async (fn) => fn({ commit: async () => {}, rollback: async () => {} }) }
    };
    
    // Return the mock db
    return mockDb;
  }
  
  try {
    const sequelize = await connectToDatabase();
    
    // Initialize scheduling models with simplified participant models
    const Sport = require('../../models/db-sport')(sequelize);
    const Championship = require('../../models/db-championship')(sequelize);
    const Team = require('../../models/db-team')(sequelize);
    const Institution = require('../../models/db-institution')(sequelize);
    const Schedule = require('../../models/db-schedule')(sequelize);
    const Game = require('../../models/db-game')(sequelize);

    // Note: fix-schedules-table functionality removed during refactoring
    if (process.env.FIX_SCHEDULES_TABLE === 'true') {
      logger.info('fix-schedules-table script is not available in refactored version');
    }

    // Define relationships
    Team.belongsTo(Institution, { 
      foreignKey: 'school_id',
      as: 'institution'
    });
    Institution.hasMany(Team, { 
      foreignKey: 'school_id',
      as: 'teams'
    });
    Team.belongsTo(Sport, { 
      foreignKey: 'sport_id',
      as: 'sport'
    });
    Sport.hasMany(Team, { 
      foreignKey: 'sport_id',
      as: 'teams'
    });
    
    Schedule.belongsTo(Sport, {
      foreignKey: 'sport_id',
      as: 'sport'
    });
    Schedule.belongsTo(Championship, {
      foreignKey: 'championship_id',
      as: 'championship'
    });
    Schedule.hasMany(Game, {
      foreignKey: 'schedule_id',
      as: 'games'
    });
    
    Game.belongsTo(Schedule, {
      foreignKey: 'schedule_id',
      as: 'schedule'
    });
    Game.belongsTo(Team, {
      as: 'home_team',
      foreignKey: 'home_team_id'
    });
    Game.belongsTo(Team, {
      as: 'away_team',
      foreignKey: 'away_team_id'
    });

    // Sync models with database (in development)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync();
      console.log('Database models synchronized');
    }

    // Create a database object to export
    const db = {
      sequelize,
      Sport,
      Championship,
      Team,
      Institution,
      Schedule,
      Game
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