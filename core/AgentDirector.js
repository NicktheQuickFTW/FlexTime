/**
 * FlexTime Agent Director
 * 
 * Orchestrates coordination between FTTravelAgent, FTOptimizationAgent, and AI services
 * Provides centralized agent management, task assignment, and result aggregation
 */

import Redis from 'redis';
import { FTTravelAgent } from './FTTravelAgent.js';
import { FTOptimizationAgent } from './FTOptimizationAgent.js';
import { TensorZeroAgent } from './TensorZeroAgent.js';
import { aiSDK } from '../ai/aiSDKService.js';

export class AgentDirector {
  constructor(config = {}) {
    this.directorId = 'agent_director';
    this.config = {
      enableTensorZero: true,
      enableAISDK: true,
      enableDistributedProcessing: true,
      maxConcurrentTasks: 10,
      taskTimeout: 300000, // 5 minutes
      ...config
    };

    // Initialize Redis for coordination
    this.redis = null;
    this.initializeRedis();

    // Initialize agent pool
    this.agents = new Map();
    this.activeTasks = new Map();
    this.taskQueue = [];
    
    // Performance tracking
    this.metrics = {
      tasksCompleted: 0,
      tasksErrored: 0,
      averageProcessingTime: 0,
      agentUtilization: {},
      lastReset: new Date().toISOString()
    };

    // Initialize agents
    this.initializeAgents();
  }

  /**
   * Initialize Redis connection for agent coordination
   */
  async initializeRedis() {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redis.connect();
      
      // Subscribe to agent coordination messages
      await this.redis.subscribe('flextime:agents:coordination', (message) => {
        this.handleAgentMessage(JSON.parse(message));
      });

      // Subscribe to TensorZero events if enabled
      if (this.config.enableTensorZero) {
        await this.redis.subscribe('tensorzero:optimization:results', (message) => {
          this.handleTensorZeroMessage(JSON.parse(message));
        });
      }
      
      console.log(`🎯 [${this.directorId}] Connected to Redis and subscribed to agent coordination`);
    } catch (error) {
      console.warn(`⚠️  [${this.directorId}] Redis connection failed, running in standalone mode:`, error.message);
    }
  }

  /**
   * Initialize agent pool
   */
  async initializeAgents() {
    try {
      // Create agent instances
      const travelAgent = new FTTravelAgent();
      const optimizationAgent = new FTOptimizationAgent();

      this.agents.set('ft_travel_agent', {
        instance: travelAgent,
        type: 'travel_agent',
        status: 'ready',
        capabilities: ['transportation_optimization', 'cost_analysis', 'tier_constraints'],
        currentLoad: 0,
        maxLoad: 5
      });

      this.agents.set('ft_optimization_agent', {
        instance: optimizationAgent,
        type: 'optimization_agent', 
        status: 'ready',
        capabilities: ['ml_optimization', 'advanced_analysis', 'multi_objective'],
        currentLoad: 0,
        maxLoad: 3
      });

      // Initialize TensorZero agent if enabled
      if (this.config.enableTensorZero) {
        const tensorZeroAgent = new TensorZeroAgent();
        
        this.agents.set('tensorzero_agent', {
          instance: tensorZeroAgent,
          type: 'tensorzero_agent',
          status: 'ready',
          capabilities: ['ml_optimization', 'pattern_recognition', 'predictive_analytics', 'reinforcement_learning'],
          currentLoad: 0,
          maxLoad: 2
        });

        console.log(`🔮 [${this.directorId}] TensorZero agent initialized`);
      }

      console.log(`🏭 [${this.directorId}] Initialized ${this.agents.size} agents`);
      
      // Start health monitoring
      this.startHealthMonitoring();
      
    } catch (error) {
      console.error(`❌ [${this.directorId}] Failed to initialize agents:`, error);
    }
  }

  /**
   * Coordinate comprehensive optimization workflow
   */
  async coordinateOptimization(schedule, constraints = {}, options = {}) {
    const taskId = this.generateTaskId();
    const startTime = Date.now();

    console.log(`🚀 [${this.directorId}] Starting optimization coordination [${taskId}]`);

    try {
      // Step 1: Analyze travel requirements
      const travelTasks = schedule.filter(game => game.venue === 'away').map(game => ({
        taskId: `${taskId}_travel_${game.game_id}`,
        type: 'travel_optimization',
        agentType: 'travel_agent',
        data: { game, constraints, options },
        priority: this.calculatePriority(game, constraints)
      }));

      // Step 2: Execute travel analysis in parallel
      const travelResults = await this.executeParallelTasks(travelTasks);

      // Step 3: Run ML enhancement on travel results
      const optimizationTasks = travelResults.map(result => ({
        taskId: `${taskId}_opt_${result.game?.game_id}`,
        type: 'ml_optimization',
        agentType: 'optimization_agent',
        data: { game: result.game, context: result, options },
        priority: result.priority || 'medium'
      }));

      const optimizationResults = await this.executeParallelTasks(optimizationTasks);

      // Step 4: AI SDK analysis for consensus
      let aiAnalysis = null;
      if (this.config.enableAISDK && optimizationResults.length > 0) {
        aiAnalysis = await this.runAIAnalysis(schedule, optimizationResults, constraints);
      }

      // Step 5: TensorZero integration if enabled
      let tensorZeroResults = null;
      if (this.config.enableTensorZero) {
        tensorZeroResults = await this.runTensorZeroOptimization(schedule, optimizationResults, constraints);
      }

      // Step 6: Aggregate final results
      const finalResult = await this.aggregateResults({
        taskId,
        travelResults,
        optimizationResults,
        aiAnalysis,
        tensorZeroResults,
        processingTime: Date.now() - startTime
      });

      // Update metrics
      this.updateMetrics(taskId, Date.now() - startTime, true);

      console.log(`✅ [${this.directorId}] Completed optimization coordination [${taskId}] in ${Date.now() - startTime}ms`);

      return finalResult;

    } catch (error) {
      console.error(`❌ [${this.directorId}] Optimization coordination failed [${taskId}]:`, error);
      
      this.updateMetrics(taskId, Date.now() - startTime, false);
      
      return {
        success: false,
        taskId,
        error: error.message,
        processingTime: Date.now() - startTime,
        fallback: await this.generateFallbackResult(schedule, constraints)
      };
    }
  }

  /**
   * Execute tasks in parallel across available agents
   */
  async executeParallelTasks(tasks) {
    const results = [];
    const activeBatch = [];

    for (const task of tasks) {
      // Find available agent
      const agent = this.findAvailableAgent(task.agentType);
      
      if (agent) {
        // Execute task
        const taskPromise = this.executeTask(agent, task);
        activeBatch.push(taskPromise);
        
        // If we hit max concurrent tasks, wait for some to complete
        if (activeBatch.length >= this.config.maxConcurrentTasks) {
          const batchResults = await Promise.allSettled(activeBatch);
          results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));
          activeBatch.length = 0;
        }
      } else {
        // Queue task for later
        this.taskQueue.push(task);
      }
    }

    // Wait for remaining tasks
    if (activeBatch.length > 0) {
      const batchResults = await Promise.allSettled(activeBatch);
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));
    }

    return results;
  }

  /**
   * Execute individual task on specific agent
   */
  async executeTask(agent, task) {
    const startTime = Date.now();
    
    try {
      // Increment agent load
      agent.currentLoad++;
      this.activeTasks.set(task.taskId, { agent: agent.instance, startTime, task });

      let result;

      switch (task.type) {
        case 'travel_optimization':
          result = await agent.instance.optimizeTransportation(
            task.data.game, 
            task.data.constraints
          );
          break;
          
        case 'ml_optimization':
          result = await agent.instance.optimizeTravel(
            task.data.game,
            task.data.context,
            task.data.options
          );
          break;

        case 'tensorzero_optimization':
          result = await agent.instance.optimizeSchedule(
            task.data.schedule,
            task.data.constraints,
            task.data.options
          );
          break;
          
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      console.log(`✅ [${this.directorId}] Task ${task.taskId} completed in ${Date.now() - startTime}ms`);

      return {
        ...result,
        taskId: task.taskId,
        agentId: agent.instance.agentId,
        processingTime: Date.now() - startTime,
        game: task.data.game
      };

    } catch (error) {
      console.error(`❌ [${this.directorId}] Task ${task.taskId} failed:`, error);
      
      return {
        success: false,
        taskId: task.taskId,
        error: error.message,
        agentId: agent.instance.agentId,
        processingTime: Date.now() - startTime
      };
    } finally {
      // Decrement agent load and clean up
      agent.currentLoad--;
      this.activeTasks.delete(task.taskId);
    }
  }

  /**
   * Find available agent of specified type
   */
  findAvailableAgent(agentType) {
    for (const [agentId, agent] of this.agents) {
      if (agent.type === agentType && agent.currentLoad < agent.maxLoad && agent.status === 'ready') {
        return agent;
      }
    }
    
    // If no specific agent type found, try to find compatible agent
    if (agentType === 'tensorzero_agent' && this.config.enableTensorZero) {
      const tensorAgent = this.agents.get('tensorzero_agent');
      if (tensorAgent && tensorAgent.currentLoad < tensorAgent.maxLoad && tensorAgent.status === 'ready') {
        return tensorAgent;
      }
    }
    
    return null;
  }

  /**
   * Run AI SDK analysis for consensus
   */
  async runAIAnalysis(schedule, optimizationResults, constraints) {
    try {
      console.log(`🧠 [${this.directorId}] Running AI SDK consensus analysis`);
      
      const analysisData = {
        schedule_summary: {
          total_games: schedule.length,
          away_games: schedule.filter(g => g.venue === 'away').length,
          optimization_results: optimizationResults.length
        },
        optimization_summary: optimizationResults.map(r => ({
          game_id: r.game?.game_id,
          recommended_mode: r.recommendations?.primaryRecommendation?.transportationMode,
          estimated_cost: r.recommendations?.primaryRecommendation?.estimatedCost,
          confidence: r.metadata?.confidenceScore
        })),
        constraints: constraints
      };

      // Get consensus from multiple AI providers
      const consensus = await aiSDK.getConsensusAnalysis(
        analysisData,
        "Analyze this Big 12 sports schedule optimization and provide strategic recommendations for improvement",
        ['claude', 'gpt', 'gemini']
      );

      return {
        consensus_analysis: consensus,
        ai_recommendations: await this.extractAIRecommendations(consensus),
        confidence: this.calculateAIConfidence(consensus)
      };

    } catch (error) {
      console.error(`❌ [${this.directorId}] AI analysis failed:`, error);
      return null;
    }
  }

  /**
   * Run TensorZero optimization with full agent integration
   */
  async runTensorZeroOptimization(schedule, optimizationResults, constraints) {
    if (!this.config.enableTensorZero) return null;

    try {
      console.log(`🔮 [${this.directorId}] Running TensorZero optimization`);

      // Find TensorZero agent
      const tensorZeroAgent = this.agents.get('tensorzero_agent');
      if (!tensorZeroAgent || tensorZeroAgent.status !== 'ready') {
        console.warn(`⚠️ [${this.directorId}] TensorZero agent not available`);
        return { status: 'agent_unavailable' };
      }

      // Check agent capacity
      if (tensorZeroAgent.currentLoad >= tensorZeroAgent.maxLoad) {
        console.warn(`⚠️ [${this.directorId}] TensorZero agent at capacity`);
        return { status: 'agent_busy', retryAfter: 30000 };
      }

      // Prepare comprehensive data for TensorZero
      const tensorData = {
        schedule: schedule,
        optimization_context: optimizationResults.map(r => ({
          travel_recommendation: r.recommendations?.primaryRecommendation,
          ml_features: r.mlOptimization?.features,
          tier_analysis: r.tierAnalysis,
          confidence: r.metadata?.confidenceScore || 0.5,
          processing_time: r.processingTimeMs || 0
        })),
        constraints: constraints,
        objectives: {
          cost_minimization: 0.3,
          travel_efficiency: 0.25,
          constraint_satisfaction: 0.2,
          schedule_quality: 0.15,
          competitive_balance: 0.1
        },
        ml_context: {
          previous_optimizations: optimizationResults.length,
          total_games: schedule.length,
          complexity_score: this.calculateComplexityScore(schedule, constraints)
        }
      };

      // Execute TensorZero optimization
      tensorZeroAgent.currentLoad++;
      const startTime = Date.now();

      try {
        const tensorResults = await tensorZeroAgent.instance.optimizeSchedule(
          tensorData,
          constraints,
          {
            integration_mode: true,
            agent_director_context: {
              taskId: this.generateTaskId(),
              optimizationResults: optimizationResults,
              timestamp: new Date().toISOString()
            }
          }
        );

        const processingTime = Date.now() - startTime;
        console.log(`✅ [${this.directorId}] TensorZero optimization completed in ${processingTime}ms`);

        return {
          status: 'completed',
          results: tensorResults,
          processing_time: processingTime,
          agent_used: 'tensorzero_agent',
          integration_metadata: {
            input_optimization_count: optimizationResults.length,
            complexity_score: tensorData.ml_context.complexity_score,
            confidence: tensorResults.performance?.confidenceLevel || 0.5
          }
        };

      } finally {
        tensorZeroAgent.currentLoad--;
      }

    } catch (error) {
      console.error(`❌ [${this.directorId}] TensorZero optimization failed:`, error);
      
      return {
        status: 'failed',
        error: error.message,
        fallback: 'Using traditional optimization results',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate complexity score for TensorZero optimization
   */
  calculateComplexityScore(schedule, constraints) {
    let complexity = 0;
    
    // Schedule complexity factors
    complexity += schedule.length * 0.01; // Game count
    complexity += Object.keys(constraints).length * 0.05; // Constraint count
    
    // Additional complexity factors
    const awayGames = schedule.filter(g => g.venue === 'away').length;
    complexity += (awayGames / schedule.length) * 0.3; // Travel ratio
    
    // Distance complexity
    const totalDistance = schedule.reduce((sum, game) => {
      return sum + (game.estimated_distance || 0);
    }, 0);
    complexity += Math.min(totalDistance / 100000, 1.0) * 0.2; // Normalized distance
    
    return Math.min(complexity, 1.0); // Cap at 1.0
  }

  /**
   * Handle messages from agents
   */
  async handleAgentMessage(message) {
    console.log(`📩 [${this.directorId}] Received message from ${message.from}: ${message.type}`);

    switch (message.type) {
      case 'optimization_complete':
      case 'travel_analysis_complete':
        await this.processAgentResult(message);
        break;
      case 'agent_status_update':
        await this.updateAgentStatus(message.from, message.data);
        break;
      case 'task_request':
        await this.handleTaskRequest(message);
        break;
      default:
        console.log(`🤷 [${this.directorId}] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle TensorZero messages
   */
  async handleTensorZeroMessage(message) {
    console.log(`🔮 [${this.directorId}] Received TensorZero message: ${message.type}`);
    
    // Process TensorZero optimization results
    if (message.type === 'optimization_complete') {
      await this.processTensorZeroResult(message);
    }
  }

  /**
   * Aggregate all optimization results
   */
  async aggregateResults(data) {
    const {
      taskId,
      travelResults,
      optimizationResults,
      aiAnalysis,
      tensorZeroResults,
      processingTime
    } = data;

    // Calculate aggregate metrics
    const totalCost = optimizationResults.reduce((sum, r) => 
      sum + (r.recommendations?.primaryRecommendation?.estimatedCost || 0), 0);

    const averageConfidence = optimizationResults.reduce((sum, r) => 
      sum + (r.metadata?.confidenceScore || 0), 0) / optimizationResults.length;

    return {
      success: true,
      taskId,
      summary: {
        total_optimizations: optimizationResults.length,
        total_estimated_cost: totalCost,
        average_confidence: averageConfidence,
        processing_time_ms: processingTime
      },
      results: {
        travel_analysis: travelResults,
        ml_optimization: optimizationResults,
        ai_consensus: aiAnalysis,
        tensorzero_results: tensorZeroResults
      },
      recommendations: await this.generateAggregateRecommendations(optimizationResults, aiAnalysis),
      metadata: {
        director_id: this.directorId,
        coordination_timestamp: new Date().toISOString(),
        agents_utilized: Array.from(this.agents.keys()),
        ai_providers_used: aiAnalysis ? ['claude', 'gpt', 'gemini'] : [],
        tensorzero_enabled: this.config.enableTensorZero
      }
    };
  }

  /**
   * Generate aggregate recommendations
   */
  async generateAggregateRecommendations(optimizationResults, aiAnalysis) {
    const recommendations = [];

    // Cost optimization recommendations
    const highCostTrips = optimizationResults.filter(r => 
      r.recommendations?.primaryRecommendation?.estimatedCost > 100000);
    
    if (highCostTrips.length > 3) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'high',
        description: `${highCostTrips.length} high-cost trips identified (>$100k each)`,
        action: 'Consider charter flight volume discounts or travel clustering',
        potential_savings: highCostTrips.length * 25000
      });
    }

    // AI consensus recommendations
    if (aiAnalysis?.ai_recommendations) {
      recommendations.push(...aiAnalysis.ai_recommendations);
    }

    // Performance recommendations
    const lowConfidenceResults = optimizationResults.filter(r => 
      r.metadata?.confidenceScore < 0.7);
    
    if (lowConfidenceResults.length > 0) {
      recommendations.push({
        type: 'confidence_improvement',
        priority: 'medium',
        description: `${lowConfidenceResults.length} optimizations with low confidence`,
        action: 'Review constraint parameters and data quality'
      });
    }

    return recommendations;
  }

  /**
   * Utility methods
   */
  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  calculatePriority(game, constraints) {
    // Higher priority for long-distance trips, championship games, etc.
    if (game.game_type === 'championship') return 'high';
    if (game.estimated_distance > 1000) return 'high';
    if (constraints.urgent) return 'high';
    return 'medium';
  }

  updateMetrics(taskId, processingTime, success) {
    if (success) {
      this.metrics.tasksCompleted++;
    } else {
      this.metrics.tasksErrored++;
    }

    // Update rolling average
    const totalTasks = this.metrics.tasksCompleted + this.metrics.tasksErrored;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (totalTasks - 1) + processingTime) / totalTasks;
  }

  async extractAIRecommendations(consensus) {
    // Parse AI consensus and extract actionable recommendations
    return consensus.analyses.flatMap(analysis => [
      {
        type: 'ai_insight',
        priority: 'medium',
        source: analysis.provider,
        description: analysis.analysis.substring(0, 200) + '...'
      }
    ]);
  }

  calculateAIConfidence(consensus) {
    return Math.min(1.0, consensus.consensus_count / 3);
  }

  async generateFallbackResult(schedule, constraints) {
    return {
      message: 'Fallback optimization using basic heuristics',
      estimated_cost: schedule.filter(g => g.venue === 'away').length * 75000,
      confidence: 0.5
    };
  }

  /**
   * Start health monitoring for agents
   */
  startHealthMonitoring() {
    setInterval(async () => {
      for (const [agentId, agent] of this.agents) {
        try {
          const status = await agent.instance.getAgentStatus();
          agent.status = status.status;
          agent.last_heartbeat = status.last_heartbeat;
        } catch (error) {
          console.warn(`⚠️  [${this.directorId}] Agent ${agentId} health check failed:`, error.message);
          agent.status = 'unhealthy';
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get director status and metrics
   */
  async getDirectorStatus() {
    return {
      directorId: this.directorId,
      status: 'active',
      redis_connected: !!this.redis?.isReady,
      agents: Object.fromEntries(
        Array.from(this.agents.entries()).map(([id, agent]) => [
          id, {
            type: agent.type,
            status: agent.status,
            currentLoad: agent.currentLoad,
            maxLoad: agent.maxLoad,
            capabilities: agent.capabilities
          }
        ])
      ),
      metrics: this.metrics,
      config: this.config,
      active_tasks: this.activeTasks.size,
      queued_tasks: this.taskQueue.length,
      last_heartbeat: new Date().toISOString()
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    console.log(`🔌 [${this.directorId}] Shutting down agent director`);

    // Shutdown all agents
    for (const [agentId, agent] of this.agents) {
      try {
        if (agent.instance && typeof agent.instance.shutdown === 'function') {
          await agent.instance.shutdown();
          console.log(`✅ [${this.directorId}] Shutdown agent: ${agentId}`);
        }
      } catch (error) {
        console.error(`❌ [${this.directorId}] Failed to shutdown agent ${agentId}:`, error);
      }
    }

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }

    console.log(`✅ [${this.directorId}] Shutdown complete`);
  }
}

export default AgentDirector;