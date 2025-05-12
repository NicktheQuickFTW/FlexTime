/**
 * FlexTime Scheduling Improvements Integration
 * 
 * This module integrates all scheduling improvements into the FlexTime system.
 */

// Import improved algorithms
const AdaptiveSimulatedAnnealingOptimizer = require('../algorithms/improvements/adaptive_simulated_annealing');
const ConstraintEvaluator = require('../algorithms/improvements/constraint_evaluator');
const MemoryOptimizedTravelOptimizer = require('../algorithms/improvements/memory_optimized_travel_optimizer');
const IncrementalScheduleOptimizer = require('../algorithms/improvements/incremental_schedule_optimizer');

// Import improved agents
const ParallelSchedulingAgentSystem = require('../agents/improvements/parallel_scheduling_agent');
const EnhancedFeedbackSystem = require('../agents/improvements/enhanced_feedback_system');

// Import sport-specific optimizers
const BasketballScheduleOptimizer = require('../agents/sport_specific/basketball_schedule_optimizer');

// Import visualization tools
const ScheduleVisualizationGenerator = require('../utils/visualization/schedule_visualization');
const EnhancedScheduleAnalysisAgent = require('../agents/specialized/enhanced_schedule_analysis_agent');

// Logger for integration logging
const logger = require('../utils/logger');

/**
 * Initialize and register all scheduling improvements
 * @param {Object} app - Express app
 * @param {Object} agentSystem - Agent system
 * @param {Object} options - Configuration options
 */
function registerSchedulingImprovements(app, agentSystem, options = {}) {
  logger.info('Registering FlexTime scheduling improvements');
  
  try {
    // Register improved optimizers
    registerImprovedOptimizers(agentSystem, options);
    
    // Register improved agents
    registerImprovedAgents(agentSystem, options);
    
    // Register sport-specific optimizers
    registerSportSpecificOptimizers(agentSystem, options);
    
    // Register visualization tools
    registerVisualizationTools(app, agentSystem, options);
    
    // Register enhanced feedback system
    registerEnhancedFeedback(app, agentSystem, options);
    
    logger.info('Successfully registered all FlexTime scheduling improvements');
    return true;
  } catch (error) {
    logger.error(`Failed to register scheduling improvements: ${error.message}`);
    return false;
  }
}

/**
 * Register improved optimizers
 * @param {Object} agentSystem - Agent system
 * @param {Object} options - Configuration options
 */
function registerImprovedOptimizers(agentSystem, options) {
  // Create optimizer instances
  const adaptiveOptimizer = options.adaptiveOptimizer || new AdaptiveSimulatedAnnealingOptimizer();
  const constraintEvaluator = options.constraintEvaluator || new ConstraintEvaluator();
  const travelOptimizer = options.travelOptimizer || new MemoryOptimizedTravelOptimizer();
  const incrementalOptimizer = options.incrementalOptimizer || new IncrementalScheduleOptimizer();
  
  // Register with agent system
  agentSystem.registerOptimizer('adaptive_annealing', adaptiveOptimizer);
  agentSystem.registerOptimizer('memory_optimized_travel', travelOptimizer);
  agentSystem.registerOptimizer('incremental', incrementalOptimizer);
  
  // Register constraint evaluator
  agentSystem.registerConstraintEvaluator(constraintEvaluator);
  
  logger.info('Registered improved optimizers');
}

/**
 * Register improved agents
 * @param {Object} agentSystem - Agent system
 * @param {Object} options - Configuration options
 */
function registerImprovedAgents(agentSystem, options) {
  // Replace standard scheduling agent system with parallel version if requested
  if (options.useParallelSchedulingAgent !== false) {
    // Create parallel scheduling agent system
    const parallelAgentSystem = new ParallelSchedulingAgentSystem({
      ...agentSystem.config,
      maxParallelOperations: options.maxParallelOperations || 4
    });
    
    // Copy properties from existing agent system
    parallelAgentSystem.mcpConnector = agentSystem.mcpConnector;
    parallelAgentSystem.historicalData = agentSystem.historicalData;
    parallelAgentSystem.dateAssigner = agentSystem.dateAssigner;
    parallelAgentSystem.travelOptimizer = agentSystem.travelOptimizer;
    parallelAgentSystem.scheduleMetrics = agentSystem.scheduleMetrics;
    
    // Initialize and register
    parallelAgentSystem.initialize().then(success => {
      if (success) {
        logger.info('Parallel scheduling agent system initialized successfully');
      } else {
        logger.warn('Parallel scheduling agent system initialization had issues');
      }
    });
    
    // Register as special system-level agent
    agentSystem.registerAgentSystem('parallel_scheduling', parallelAgentSystem);
  }
  
  // Create enhanced schedule analysis agent
  const analysisAgent = new EnhancedScheduleAnalysisAgent(agentSystem.mcpConnector, {
    debug: options.debug || false,
    generateVisualizations: options.generateVisualizations !== false,
    generateAIInsights: options.generateAIInsights !== false
  });
  
  // Register enhanced analysis agent
  agentSystem.registerAgent('enhanced_analysis', analysisAgent);
  
  logger.info('Registered improved agents');
}

/**
 * Register sport-specific optimizers
 * @param {Object} agentSystem - Agent system
 * @param {Object} options - Configuration options
 */
function registerSportSpecificOptimizers(agentSystem, options) {
  // Register basketball-specific optimizer
  const basketballOptimizer = new BasketballScheduleOptimizer(null, {
    conferenceWeight: options.basketballConferenceWeight || 2.0,
    rivalryWeight: options.basketballRivalryWeight || 1.5,
    restDaysRequired: options.basketballRestDays || 1,
    maxConsecutiveGames: options.basketballMaxConsecutiveGames || 4
  });
  
  agentSystem.registerSportOptimizer('basketball', basketballOptimizer);
  
  // Future: Add other sport-specific optimizers as they're implemented
  
  logger.info('Registered sport-specific optimizers');
}

/**
 * Register visualization tools
 * @param {Object} app - Express app
 * @param {Object} agentSystem - Agent system
 * @param {Object} options - Configuration options
 */
function registerVisualizationTools(app, agentSystem, options) {
  // Create visualization generator
  const visualizationGenerator = new ScheduleVisualizationGenerator({
    debug: options.debug || false,
    includeRawData: options.includeVisualizationRawData || false,
    colorPalette: options.visualizationColorPalette
  });
  
  // Make visualization generator available in app
  app.set('visualizationGenerator', visualizationGenerator);
  
  // Add to agent system
  agentSystem.visualizationGenerator = visualizationGenerator;
  
  logger.info('Registered visualization tools');
}

/**
 * Register enhanced feedback system
 * @param {Object} app - Express app
 * @param {Object} agentSystem - Agent system
 * @param {Object} options - Configuration options
 */
function registerEnhancedFeedback(app, agentSystem, options) {
  // Create enhanced feedback system
  const feedbackSystem = new EnhancedFeedbackSystem({
    memoryManager: agentSystem.historicalData?.memoryManager,
    mcpConnector: agentSystem.mcpConnector,
    modelAllocation: agentSystem.modelAllocator,
    learningRate: options.feedbackLearningRate || 0.05,
    feedbackThreshold: options.feedbackThreshold || 0.7,
    adaptiveLearningRate: options.adaptiveLearningRate || 0.1
  });
  
  // Initialize feedback system
  feedbackSystem.initialize().then(success => {
    if (success) {
      logger.info('Enhanced feedback system initialized successfully');
    } else {
      logger.warn('Enhanced feedback system initialization had issues');
    }
  });
  
  // Make feedback system available in app
  app.set('feedbackSystem', feedbackSystem);
  
  // Add to agent system
  agentSystem.feedbackSystem = feedbackSystem;
  
  logger.info('Registered enhanced feedback system');
}

module.exports = {
  registerSchedulingImprovements,
  registerImprovedOptimizers,
  registerImprovedAgents,
  registerSportSpecificOptimizers,
  registerVisualizationTools,
  registerEnhancedFeedback,
  
  // Export classes for direct use
  AdaptiveSimulatedAnnealingOptimizer,
  ConstraintEvaluator,
  MemoryOptimizedTravelOptimizer,
  IncrementalScheduleOptimizer,
  ParallelSchedulingAgentSystem,
  EnhancedFeedbackSystem,
  BasketballScheduleOptimizer,
  ScheduleVisualizationGenerator,
  EnhancedScheduleAnalysisAgent
};