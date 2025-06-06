/**
 * FlexTime Agent System Core
 * 
 * This module provides the core functionality for the FlexTime agent system,
 * implementing the main agent initialization, coordination, and lifecycle management.
 */

const logger = require("../utils/logger");
const FTBuilderEngine = require('../../services/FT_Builder_Engine');
const AdvancedSchedulingService = require('../../services/advanced_scheduling_service');

// Travel Optimization Agents (specialized sub-agents)
const TransportModeOptimizationAgent = require('./specialized/travel_optimization/transport_mode_optimization_agent');
const TravelCostCalculationAgent = require('./specialized/travel_optimization/travel_cost_calculation_agent');
const CircuitOptimizationAgent = require('./specialized/travel_optimization/circuit_optimization_agent');
const SeasonalPricingAgent = require('./specialized/travel_optimization/seasonal_pricing_agent');
const SharedCharterAgent = require('./specialized/travel_optimization/shared_charter_agent');
const TravelBudgetMonitorAgent = require('./specialized/travel_optimization/travel_budget_monitor_agent');

// Travel Optimization Director
const TravelOptimizationDirector = require('./specialized/travel_optimization/travel_optimization_director');

/**
 * Core Agent System for FlexTime
 * Manages agent lifecycle and coordination
 */
class AgentSystem {
  /**
   * Initialize a new Agent System
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      logLevel: process.env.LOG_LEVEL || 'info',
      enableMCP: process.env.ENABLE_MCP === 'true',
      mcpEndpoint: process.env.MCP_ENDPOINT,
      ...config
    };
    
    // Logger level is configured elsewhere
    // logger.setLogLevel(this.config.logLevel);
    
    // Initialize Advanced Scheduling Service
    this.schedulingService = new AdvancedSchedulingService(config.scheduling || {});
    
    // Track registered agents
    this.agents = new Map();
    this.initialized = false;
    
    // Initialize travel optimization agents
    this.initializeTravelOptimizationAgents();
    
    logger.info('Agent System core initialized');
  }
  
  /**
   * Register an agent with the system
   * 
   * @param {string} agentId - Unique identifier for the agent
   * @param {Object} agent - Agent instance
   * @returns {boolean} - Whether registration was successful
   */
  registerAgent(agentId, agent) {
    if (this.agents.has(agentId)) {
      logger.warn(`Agent with ID ${agentId} is already registered`);
      return false;
    }
    
    this.agents.set(agentId, agent);
    logger.info(`Agent ${agentId} registered with the system`);
    return true;
  }
  
  /**
   * Get a registered agent by ID
   * 
   * @param {string} agentId - Agent identifier
   * @returns {Object|null} - Agent instance or null if not found
   */
  getAgent(agentId) {
    return this.agents.get(agentId) || null;
  }
  
  /**
   * Initialize the agent system and all registered agents
   * 
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    try {
      if (this.initialized) {
        logger.warn('Agent System is already initialized');
        return true;
      }
      
      logger.info('Initializing Agent System');
      
      // Initialize Advanced Scheduling Service
      const serviceInitialized = await this.schedulingService.initialize();
      if (serviceInitialized) {
        logger.info('Advanced Scheduling Service initialized successfully');
      } else {
        logger.warn('Advanced Scheduling Service initialization failed, using limited functionality');
      }
      
      // Initialize all registered agents
      for (const [agentId, agent] of this.agents.entries()) {
        try {
          if (typeof agent.initialize === 'function') {
            logger.info(`Initializing agent: ${agentId}`);
            await agent.initialize();
            logger.info(`Agent ${agentId} initialized successfully`);
          }
        } catch (error) {
          logger.error(`Failed to initialize agent ${agentId}: ${error.message}`);
        }
      }
      
      this.initialized = true;
      logger.info('Agent System initialization complete');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Agent System: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Store an experience for learning and improvement
   * 
   * @param {string} agentId - ID of the agent storing the experience
   * @param {Object} experience - Experience data
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<boolean>} - Whether storage was successful
   */
  async storeExperience(agentId, experience, metadata = {}) {
    try {
      // Format experience data
      const experienceData = {
        content: experience,
        agentId,
        type: metadata.type || 'general',
        tags: metadata.tags || [],
        scheduleId: metadata.scheduleId
      };
      
      // Store experience using Advanced Scheduling Service
      const result = await this.schedulingService.storeFeedback(experienceData);
      logger.debug(`Experience stored for agent ${agentId}`);
      return !!result;
    } catch (error) {
      logger.error(`Failed to store experience for agent ${agentId}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Register an optimizer with the system
   * 
   * @param {string} optimizerName - Name of the optimizer
   * @param {Object} optimizer - Optimizer instance
   * @returns {boolean} - Whether registration was successful
   */
  registerOptimizer(optimizerName, optimizer) {
    if (!this.optimizers) {
      this.optimizers = new Map();
    }
    
    if (this.optimizers.has(optimizerName)) {
      logger.warn(`Optimizer with name ${optimizerName} is already registered`);
      return false;
    }
    
    this.optimizers.set(optimizerName, optimizer);
    logger.info(`Optimizer ${optimizerName} registered with the system`);
    return true;
  }
  
  /**
   * Register a constraint evaluator with the system
   * 
   * @param {Object} evaluator - Constraint evaluator instance
   * @returns {boolean} - Whether registration was successful
   */
  registerConstraintEvaluator(evaluator) {
    if (!this.constraintEvaluators) {
      this.constraintEvaluators = new Map();
    }
    
    const evaluatorName = evaluator.name || 'default_evaluator';
    this.constraintEvaluators.set(evaluatorName, evaluator);
    logger.info(`Constraint evaluator ${evaluatorName} registered with the system`);
    return true;
  }
  
  /**
   * Register a sport-specific optimizer
   * 
   * @param {string} sport - Sport name
   * @param {Object} optimizer - Sport optimizer instance
   * @returns {boolean} - Whether registration was successful
   */
  registerSportOptimizer(sport, optimizer) {
    if (!this.sportOptimizers) {
      this.sportOptimizers = new Map();
    }
    
    this.sportOptimizers.set(sport, optimizer);
    logger.info(`Sport optimizer for ${sport} registered with the system`);
    return true;
  }
  
  /**
   * Register an agent sub-system
   * 
   * @param {string} systemName - Name of the agent system
   * @param {Object} agentSystem - Agent system instance
   * @returns {boolean} - Whether registration was successful
   */
  registerAgentSystem(systemName, agentSystem) {
    if (!this.agentSystems) {
      this.agentSystems = new Map();
    }
    
    this.agentSystems.set(systemName, agentSystem);
    logger.info(`Agent system ${systemName} registered with the system`);
    return true;
  }
  
  /**
   * Initialize travel optimization agents
   * 
   * @private
   */
  initializeTravelOptimizationAgents() {
    try {
      logger.info('Initializing travel optimization agents');
      
      // Create and register travel optimization agents
      const travelAgents = [
        { id: 'transport_mode_optimization', class: TransportModeOptimizationAgent },
        { id: 'travel_cost_calculation', class: TravelCostCalculationAgent },
        { id: 'circuit_optimization', class: CircuitOptimizationAgent },
        { id: 'seasonal_pricing', class: SeasonalPricingAgent },
        { id: 'shared_charter', class: SharedCharterAgent },
        { id: 'travel_budget_monitor', class: TravelBudgetMonitorAgent }
      ];
      
      travelAgents.forEach(({ id, class: AgentClass }) => {
        try {
          const agent = new AgentClass({
            systemConfig: this.config,
            schedulingService: this.schedulingService
          });
          
          const registered = this.registerAgent(id, agent);
          if (registered) {
            logger.info(`Travel optimization agent ${id} registered successfully`);
          }
        } catch (error) {
          logger.error(`Failed to create travel optimization agent ${id}: ${error.message}`);
        }
      });
      
      // Create and register travel optimization director
      try {
        const travelDirector = new TravelOptimizationDirector({
          systemConfig: this.config,
          agentSystem: this,
          schedulingService: this.schedulingService
        });
        
        const registered = this.registerAgent('travel_optimization_director', travelDirector);
        if (registered) {
          logger.info('Travel Optimization Director registered successfully');
        }
      } catch (error) {
        logger.error(`Failed to create Travel Optimization Director: ${error.message}`);
      }
      
      logger.info('Travel optimization agents initialization complete');
    } catch (error) {
      logger.error(`Failed to initialize travel optimization agents: ${error.message}`);
    }
  }
  
  /**
   * Get all travel optimization agents
   * 
   * @returns {Map} - Map of travel optimization agents
   */
  getTravelOptimizationAgents() {
    const travelAgentIds = [
      'transport_mode_optimization',
      'travel_cost_calculation', 
      'circuit_optimization',
      'seasonal_pricing',
      'shared_charter',
      'travel_budget_monitor'
    ];
    
    const travelAgents = new Map();
    travelAgentIds.forEach(id => {
      const agent = this.getAgent(id);
      if (agent) {
        travelAgents.set(id, agent);
      }
    });
    
    return travelAgents;
  }
  
  /**
   * Optimize travel costs for a schedule using all travel optimization agents
   * 
   * @param {Object} schedule - Schedule to optimize
   * @param {Object} constraints - Optimization constraints
   * @returns {Promise<Object>} - Optimization results
   */
  async optimizeTravelCosts(schedule, constraints = {}) {
    try {
      logger.info('Starting comprehensive travel cost optimization');
      
      const results = {
        original_schedule: schedule,
        optimized_schedule: null,
        optimization_results: {},
        total_savings: 0,
        recommendations: []
      };
      
      // Get travel optimization agents
      const transportAgent = this.getAgent('transport_mode_optimization');
      const costAgent = this.getAgent('travel_cost_calculation');
      const circuitAgent = this.getAgent('circuit_optimization');
      const seasonalAgent = this.getAgent('seasonal_pricing');
      const sharedCharterAgent = this.getAgent('shared_charter');
      const budgetAgent = this.getAgent('travel_budget_monitor');
      
      // 1. Circuit optimization (restructure travel routes)
      if (circuitAgent) {
        logger.info('Applying circuit optimization');
        const circuitResults = await circuitAgent.optimizeScheduleCircuits(schedule);
        results.optimization_results.circuit = circuitResults;
        results.optimized_schedule = circuitResults.optimizedSchedule || schedule;
        results.total_savings += circuitResults.savings?.cost || 0;
      }
      
      // 2. Seasonal timing optimization
      if (seasonalAgent) {
        logger.info('Applying seasonal timing optimization');
        const seasonalResults = await seasonalAgent.optimizeScheduleTiming(
          results.optimized_schedule || schedule, 
          constraints
        );
        results.optimization_results.seasonal = seasonalResults;
        results.optimized_schedule = seasonalResults.optimizedSchedule || results.optimized_schedule;
        results.total_savings += seasonalResults.savings?.totalSavings || 0;
      }
      
      // 3. Transport mode optimization for each game
      if (transportAgent && results.optimized_schedule) {
        logger.info('Applying transport mode optimization');
        const transportResults = [];
        
        for (const game of results.optimized_schedule) {
          if (!game.isHome) {
            try {
              const modeResult = await transportAgent.optimizeTransportMode({
                origin: game.homeTeam,
                destination: game.destination || game.awayTeam,
                teamSize: game.teamSize || 35,
                sport: game.sport,
                date: game.date,
                constraints: constraints
              });
              
              transportResults.push({
                gameId: game.id,
                recommendation: modeResult.recommendation,
                savings: modeResult.analysis?.factors?.costComparison?.savings || 0
              });
            } catch (error) {
              logger.warn(`Transport optimization failed for game ${game.id}: ${error.message}`);
            }
          }
        }
        
        results.optimization_results.transport = transportResults;
        const transportSavings = transportResults.reduce((sum, result) => sum + (result.savings || 0), 0);
        results.total_savings += transportSavings;
      }
      
      // 4. Calculate comprehensive costs
      if (costAgent && results.optimized_schedule) {
        logger.info('Calculating comprehensive travel costs');
        let totalOriginalCost = 0;
        let totalOptimizedCost = 0;
        
        for (const game of results.optimized_schedule) {
          if (!game.isHome) {
            try {
              const costResult = await costAgent.calculateTotalTravelCost({
                origin: game.homeTeam,
                destination: game.destination || game.awayTeam,
                teamSize: game.teamSize || 35,
                sport: game.sport,
                date: game.date
              });
              
              totalOptimizedCost += costResult.total;
              // Estimate original cost (without optimizations)
              totalOriginalCost += costResult.total * 1.15; // Assume 15% savings from optimization
            } catch (error) {
              logger.warn(`Cost calculation failed for game ${game.id}: ${error.message}`);
            }
          }
        }
        
        results.optimization_results.cost_analysis = {
          total_original_cost: totalOriginalCost,
          total_optimized_cost: totalOptimizedCost,
          cost_savings: totalOriginalCost - totalOptimizedCost
        };
      }
      
      // 5. Shared charter analysis (cross-schedule optimization)
      if (sharedCharterAgent) {
        logger.info('Analyzing shared charter opportunities');
        try {
          // For now, analyze single schedule - in full implementation, this would analyze multiple team schedules
          const sharedResults = await sharedCharterAgent.identifySharedCharterOpportunities([{
            teamId: 'team_1',
            teamName: 'Primary Team',
            sport: schedule[0]?.sport || 'basketball',
            teamSize: 35,
            games: results.optimized_schedule || schedule
          }]);
          
          results.optimization_results.shared_charter = sharedResults;
          results.total_savings += sharedResults.totalSavings?.total_savings || 0;
        } catch (error) {
          logger.warn(`Shared charter analysis failed: ${error.message}`);
        }
      }
      
      // 6. Budget monitoring and recommendations
      if (budgetAgent) {
        logger.info('Performing budget analysis');
        try {
          const budgetAnalysis = await budgetAgent.monitorTravelBudgets(
            { total: 5000000 }, // Example budget
            {}, // Current spending (empty for optimization)
            results.optimized_schedule || schedule
          );
          
          results.optimization_results.budget = budgetAnalysis;
          results.recommendations = budgetAnalysis.recommendations || [];
        } catch (error) {
          logger.warn(`Budget analysis failed: ${error.message}`);
        }
      }
      
      logger.info(`Travel cost optimization complete. Total estimated savings: $${results.total_savings}`);
      return results;
      
    } catch (error) {
      logger.error(`Travel cost optimization failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Shutdown the agent system and all registered agents
   * 
   * @returns {Promise<boolean>} - Whether shutdown was successful
   */
  async shutdown() {
    try {
      logger.info('Shutting down Agent System');
      
      // Shutdown all registered agents in reverse registration order
      const agentEntries = [...this.agents.entries()].reverse();
      
      for (const [agentId, agent] of agentEntries) {
        try {
          if (typeof agent.shutdown === 'function') {
            logger.info(`Shutting down agent: ${agentId}`);
            await agent.shutdown();
            logger.info(`Agent ${agentId} shutdown successfully`);
          }
        } catch (error) {
          logger.error(`Failed to shutdown agent ${agentId}: ${error.message}`);
        }
      }
      
      // Shutdown Advanced Scheduling Service
      if (this.schedulingService) {
        await this.schedulingService.shutdown();
        logger.info('Advanced Scheduling Service shut down successfully');
      }
      
      this.initialized = false;
      logger.info('Agent System shutdown complete');
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Agent System: ${error.message}`);
      return false;
    }
  }
}

module.exports = AgentSystem;
