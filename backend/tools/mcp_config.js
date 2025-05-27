/**
 * MCP Configuration
 * 
 * This module provides configuration for the MCP (Model Coordination Protocol) system.
 */

require('dotenv').config();

module.exports = {
  // General MCP settings
  general: {
    enabled: process.env.ENABLE_MCP_COORDINATION === 'true',
    defaultServer: process.env.MCP_DEFAULT_SERVER || 'mock',
    defaultPriority: (process.env.MCP_DEFAULT_PRIORITY || 'mock,neon').split(','),
    schedulingPriority: (process.env.MCP_SCHEDULING_PRIORITY || 'mock,neon').split(','),
    memoryPriority: (process.env.MCP_MEMORY_PRIORITY || 'neon').split(','),
    timeout: parseInt(process.env.MCP_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.MCP_RETRY_ATTEMPTS || '2', 10),
    useCache: process.env.MCP_USE_CACHE !== 'false',
    cacheExpiration: parseInt(process.env.MCP_CACHE_EXPIRATION || '3600000', 10) // 1 hour default
  },
  
  // Anthropic configuration
  anthropic: {
    enabled: process.env.ENABLE_ANTHROPIC === 'true',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    apiUrl: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com',
    timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '60000', 10),
    model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10)
  },
  
  // OpenAI configuration
  openai: {
    enabled: process.env.ENABLE_OPENAI === 'true',
    apiKey: process.env.OPENAI_API_KEY || '',
    apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com',
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '60000', 10),
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10)
  },
  
  // Memory configuration
  memory: {
    // Neon DB configuration
    neonDB: {
      enabled: process.env.ENABLE_NEON_MEMORY === 'true',
      connectionString: process.env.NEON_DB_CONNECTION_STRING || '',
      host: process.env.NEON_DB_HOST || '',
      port: parseInt(process.env.NEON_DB_PORT || '5432', 10),
      database: process.env.NEON_DB_NAME || '',
      username: process.env.NEON_DB_USER || '',
      password: process.env.NEON_DB_PASSWORD || '',
      table: process.env.NEON_MEMORY_TABLE || 'agent_memories',
      ssl: process.env.NEON_DB_SSL !== 'false'
    },
    
    // Redis configuration
    redis: {
      enabled: process.env.ENABLE_REDIS_MEMORY === 'true',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || '',
      ttl: parseInt(process.env.REDIS_MEMORY_TTL || '3600', 10), // 1 hour default
      prefix: 'flextime:memory:'
    },
    
    // Vector database configuration (optional)
    vectorDB: {
      enabled: process.env.ENABLE_VECTOR_MEMORY === 'true',
      type: process.env.VECTOR_DB_TYPE || 'pinecone',
      apiKey: process.env.VECTOR_DB_API_KEY || '',
      environment: process.env.VECTOR_DB_ENVIRONMENT || 'us-west1-gcp',
      index: process.env.VECTOR_DB_INDEX || 'flextime-memories'
    }
  },
  
  // Rate limiting configuration
  rateLimit: {
    enabled: process.env.ENABLE_RATE_LIMITING === 'true',
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) // 15 minutes default
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    useMockResponses: process.env.USE_MOCK_RESPONSES === 'true'
  },
  
  // Mock server configuration (for development and testing)
  mock: {
    enabled: true,
    responseDelay: parseInt(process.env.MOCK_RESPONSE_DELAY || '500', 10),
    useRandomErrors: process.env.MOCK_RANDOM_ERRORS === 'true',
    errorRate: parseFloat(process.env.MOCK_ERROR_RATE || '0.05')
  }
};