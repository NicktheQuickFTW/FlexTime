/**
 * Intelligence Engine Configuration - Stub Implementation
 * 
 * This is a stub implementation that replaces the original Intelligence Engine configuration.
 * It provides default configuration values with the engine disabled.
 */

const intelligenceEngineConfig = {
  // Always disable the Intelligence Engine
  enabled: false,
  
  // Stub service URL (not used, but kept for compatibility)
  serviceUrl: 'http://localhost:4001/api',
  
  // API key (not used, but kept for compatibility)
  apiKey: null,
  
  // Fallback settings
  fallback: {
    useLocalRecommendations: true,
    useLocalMemory: true,
    useLocalTemplates: true
  },
  
  // Default agent types that were previously supported
  agentTypes: {
    director: 'local',
    scheduler: 'local',
    optimizer: 'local',
    evaluator: 'local',
    analyst: 'local'
  },
  
  // Default settings that were previously supported
  settings: {
    logLevel: process.env.LOG_LEVEL || 'info',
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000
  }
};

module.exports = intelligenceEngineConfig;