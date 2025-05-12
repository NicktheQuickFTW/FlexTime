/**
 * Database configuration for FlexTime 2.1
 * 
 * This file contains configuration for MongoDB and Redis connections
 * used by the agent memory system and learning components.
 */

const dbConfig = {
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://flextime:flextime_secret@localhost:27017/flextime',
    options: {
      // Removed deprecated options (useNewUrlParser, useUnifiedTopology)
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000
    },
    collections: {
      experiences: 'agent_experiences',
      knowledge: 'agent_knowledge',
      feedback: 'user_feedback',
      schedules: 'schedules',
      optimizationResults: 'optimization_results'
    }
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
    keyPrefix: 'flextime:',
    cacheTTL: 3600 // 1 hour in seconds
  }
};

module.exports = dbConfig;
