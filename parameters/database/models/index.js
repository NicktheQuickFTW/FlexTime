/**
 * Parameter Models Index
 * Exports all parameter-related Sequelize models
 */

const { Sequelize } = require('sequelize');
const neonConfig = require('../../../../../../config/neon-database');

// Initialize Sequelize with Neon configuration
const sequelize = new Sequelize(neonConfig.connectionString, {
  dialect: 'postgres',
  dialectOptions: neonConfig.connection.dialectOptions,
  pool: neonConfig.pool,
  logging: neonConfig.logging ? console.log : false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// Import models
const ParameterCategory = require('./ParameterCategory')(sequelize);
const ParameterTemplate = require('./ParameterTemplate')(sequelize);
const ParameterInstance = require('./ParameterInstance')(sequelize);
const ParameterEvaluation = require('./ParameterEvaluation')(sequelize);
const ParameterConflict = require('./ParameterConflict')(sequelize);
const ParameterResolution = require('./ParameterResolution')(sequelize);
const ParameterCache = require('./ParameterCache')(sequelize);
const ParameterMetric = require('./ParameterMetric')(sequelize);

// Store models in sequelize instance
const models = {
  ParameterCategory,
  ParameterTemplate,
  ParameterInstance,
  ParameterEvaluation,
  ParameterConflict,
  ParameterResolution,
  ParameterCache,
  ParameterMetric
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  ...models,
  
  // Utility functions
  async syncDatabase(options = {}) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      
      if (options.force) {
        console.log('Force syncing database (this will drop existing tables)...');
      }
      
      await sequelize.sync(options);
      console.log('Database synchronized successfully.');
      
      return true;
    } catch (error) {
      console.error('Unable to sync database:', error);
      throw error;
    }
  },
  
  async testConnection() {
    try {
      await sequelize.authenticate();
      console.log('Database connection test successful.');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  },
  
  async closeConnection() {
    try {
      await sequelize.close();
      console.log('Database connection closed.');
      return true;
    } catch (error) {
      console.error('Error closing database connection:', error);
      return false;
    }
  }
};