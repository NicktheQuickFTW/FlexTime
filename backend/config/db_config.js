/**
 * Database configuration for HELiiX
 * 
 * This file contains configuration for Redis connections
 * used by the agent memory system and learning components.
 * 
 * Note: MongoDB configuration has been removed as part of the migration to Neon PostgreSQL.
 */

const dbConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0,
    keyPrefix: 'heliix:',
    cacheTTL: 3600 // 1 hour in seconds
  }
};

module.exports = dbConfig;
