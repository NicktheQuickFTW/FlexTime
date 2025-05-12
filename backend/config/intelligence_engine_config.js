/**
 * Intelligence Engine Configuration for FlexTime 2.1
 * 
 * This module provides configuration settings for connecting to the
 * HELiiX Intelligence Engine from the FlexTime scheduling service.
 */

// Default configuration
const intelligenceEngineConfig = {
  // Connection settings
  serviceUrl: process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001/api',
  apiKey: process.env.INTELLIGENCE_ENGINE_API_KEY,
  enabled: process.env.ENABLE_INTELLIGENCE_ENGINE !== 'false',
  
  // Agent settings
  agentTypes: {
    master_director: {
      server: 'anthropic',
      model: 'claude-3-opus'
    },
    scheduling_director: {
      server: 'anthropic',
      model: 'claude-3-sonnet'
    },
    operations_director: {
      server: 'openai',
      model: 'gpt-4'
    },
    analysis_director: {
      server: 'vertex',
      model: 'gemini-pro'
    }
  },
  
  // Fallback settings (used when Intelligence Engine is unavailable)
  fallback: {
    // Default constraint weights by sport type
    constraintWeights: {
      basketball: {
        'travel_distance': 0.3,
        'rest_periods': 0.25,
        'home_away_balance': 0.25,
        'venue_availability': 0.2
      },
      football: {
        'travel_distance': 0.2,
        'rest_periods': 0.3,
        'home_away_balance': 0.2,
        'venue_availability': 0.3
      },
      baseball: {
        'travel_distance': 0.2,
        'rest_periods': 0.2,
        'home_away_balance': 0.2,
        'venue_availability': 0.4
      },
      soccer: {
        'travel_distance': 0.2,
        'rest_periods': 0.2,
        'home_away_balance': 0.4,
        'venue_availability': 0.2
      }
    },
    
    // Default algorithms by sport type
    algorithms: {
      basketball: 'round_robin',
      football: 'round_robin',
      baseball: 'partial_round_robin',
      soccer: 'partial_round_robin'
    },
    
    // Default optimization strategies
    optimizationStrategies: {
      default: 'simulated_annealing',
      travel_focused: 'travel_optimization_pipeline'
    }
  },
  
  // Memory settings
  memory: {
    experienceRetentionDays: 365, // How long to keep experiences
    maxExperiencesPerQuery: 50,   // Maximum experiences to return per query
    prioritizeTags: ['successful', 'recent'] // Tags to prioritize when retrieving experiences
  }
};

module.exports = intelligenceEngineConfig;
