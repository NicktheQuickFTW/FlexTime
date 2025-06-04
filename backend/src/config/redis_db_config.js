/**
 * Redis Database Configuration
 * 
 * This file contains configuration for Redis connections
 * used by the agent memory system, caching, and learning components.
 * 
 * Note: For PostgreSQL/Neon database configuration, see neon_db_config.js
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
