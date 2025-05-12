/**
 * Agent Delegation Patterns for FlexTime
 * 
 * This module defines explicit reasoning chains and delegation patterns
 * between agents to handle complex decisions collaboratively.
 */

const logger = require('../utils/logger');

/**
 * Delegation patterns for the FlexTime multi-agent system
 */
class DelegationPatterns {
  /**
   * Initialize delegation patterns
   * 
   * @param {Object} agentSystem - Reference to the agent system
   */
  constructor(agentSystem) {
    this.agentSystem = agentSystem;
    this.delegationGraph = this._buildDelegationGraph();
    logger.info('Delegation patterns initialized');
  }

  /**
   * Build the delegation graph that defines which agents can delegate to others
   * 
   * @returns {Object} The delegation graph
   * @private
   */
  _buildDelegationGraph() {
    return {
      // Master director can delegate to any other agent
      'master_director': {
        canDelegateTo: ['scheduling_director', 'operations_director', 'analysis_director', 'knowledge_graph'],
        reasoningChain: ['problem_decomposition', 'agent_selection', 'task_formulation']
      },
      
      // Scheduling director handles schedule generation and optimization
      'scheduling_director': {
        canDelegateTo: ['algorithm_selection', 'constraint_management', 'travel_optimization', 'schedule_optimization'],
        reasoningChain: ['constraints_analysis', 'algorithm_selection', 'schedule_generation', 'optimization']
      },
      
      // Operations director handles resource allocation and venue management
      'operations_director': {
        canDelegateTo: ['resource_allocation', 'venue_management', 'conflict_resolution'],
        reasoningChain: ['resource_availability', 'conflict_detection', 'resolution_strategy']
      },
      
      // Analysis director handles data analysis and learning
      'analysis_director': {
        canDelegateTo: ['feedback_analysis', 'pattern_recognition', 'predictive_scheduling'],
        reasoningChain: ['data_collection', 'pattern_identification', 'insight_generation']
      }
    };
  }

  /**
   * Delegate a task from one agent to another following the delegation patterns
   * 
   * @param {string} fromAgentId - ID of the agent delegating the task
   * @param {string} toAgentId - ID of the agent receiving the task
   * @param {Object} task - Task to delegate
   * @returns {Promise<Object>} Result of the delegation
   */
  async delegateTask(fromAgentId, toAgentId, task) {
    // Check if delegation is allowed
    if (!this._canDelegate(fromAgentId, toAgentId)) {
      const error = `Agent ${fromAgentId} is not allowed to delegate to ${toAgentId}`;
      logger.error(error);
      return { success: false, error };
    }

    // Apply delegation reasoning chain
    const reasoningChain = this.delegationGraph[fromAgentId].reasoningChain;
    const enhancedTask = await this._applyReasoningChain(reasoningChain, task);
    
    logger.info(`Agent ${fromAgentId} delegating task to ${toAgentId}`);
    
    // Get the receiving agent
    const agent = this.agentSystem.getAgent(toAgentId);
    if (!agent) {
      const error = `Agent ${toAgentId} not found`;
      logger.error(error);
      return { success: false, error };
    }
    
    // Execute the task with the target agent
    return await agent.executeTask(enhancedTask);
  }

  /**
   * Check if an agent can delegate to another
   * 
   * @param {string} fromAgentId - ID of the agent delegating the task
   * @param {string} toAgentId - ID of the agent receiving the task
   * @returns {boolean} Whether delegation is allowed
   * @private
   */
  _canDelegate(fromAgentId, toAgentId) {
    if (!this.delegationGraph[fromAgentId]) {
      return false;
    }
    
    return this.delegationGraph[fromAgentId].canDelegateTo.includes(toAgentId);
  }

  /**
   * Apply reasoning chain to a task
   * 
   * @param {Array<string>} reasoningChain - Steps in the reasoning chain
   * @param {Object} task - Original task
   * @returns {Promise<Object>} Enhanced task with reasoning chain
   * @private
   */
  async _applyReasoningChain(reasoningChain, task) {
    logger.info(`Applying reasoning chain: ${reasoningChain.join(' -> ')}`);
    
    // Clone the task to avoid modifying the original
    const enhancedTask = { ...task };
    
    // Add reasoning chain to the task context
    enhancedTask.reasoningChain = reasoningChain;
    
    // Track delegation in task history for accountability
    enhancedTask.delegationHistory = enhancedTask.delegationHistory || [];
    enhancedTask.delegationHistory.push({
      timestamp: new Date().toISOString(),
      reasoningChain
    });
    
    return enhancedTask;
  }

  /**
   * Create a complex multi-agent reasoning chain for difficult problems
   * 
   * @param {string} taskType - Type of task to solve
   * @param {Object} parameters - Task parameters
   * @returns {Object} Multi-agent reasoning chain specification
   */
  createReasoningChain(taskType, parameters) {
    // Define different reasoning chains based on task type
    const chainTemplates = {
      'championship_scheduling': [
        { agent: 'master_director', step: 'decompose_championship_problem' },
        { agent: 'scheduling_director', step: 'identify_schedule_patterns' },
        { agent: 'knowledge_graph', step: 'retrieve_relevant_constraints' },
        { agent: 'algorithm_selection', step: 'select_scheduling_algorithm' },
        { agent: 'scheduling_director', step: 'generate_candidate_schedules' },
        { agent: 'travel_optimization', step: 'optimize_travel_distances' },
        { agent: 'operations_director', step: 'verify_venue_availability' },
        { agent: 'conflict_resolution', step: 'resolve_constraint_conflicts' },
        { agent: 'analysis_director', step: 'evaluate_schedule_quality' },
        { agent: 'master_director', step: 'finalize_championship_schedule' }
      ],
      
      'conflict_resolution': [
        { agent: 'operations_director', step: 'identify_conflicting_constraints' },
        { agent: 'knowledge_graph', step: 'retrieve_conflict_resolution_patterns' },
        { agent: 'conflict_explanation', step: 'explain_constraint_conflicts' },
        { agent: 'conflict_resolution', step: 'generate_resolution_options' },
        { agent: 'analysis_director', step: 'evaluate_resolution_impacts' },
        { agent: 'operations_director', step: 'implement_optimal_resolution' }
      ],
      
      'schedule_optimization': [
        { agent: 'analysis_director', step: 'analyze_optimization_opportunities' },
        { agent: 'algorithm_selection', step: 'select_optimization_algorithm' },
        { agent: 'schedule_optimization', step: 'apply_optimization_techniques' },
        { agent: 'travel_optimization', step: 'reduce_travel_distances' },
        { agent: 'analysis_director', step: 'verify_optimization_improvements' }
      ]
    };
    
    // Get the appropriate chain template or use a default chain
    const chainTemplate = chainTemplates[taskType] || [
      { agent: 'master_director', step: 'problem_decomposition' },
      { agent: 'scheduling_director', step: 'solution_generation' },
      { agent: 'analysis_director', step: 'solution_evaluation' }
    ];
    
    // Create the reasoning chain with all necessary metadata
    return {
      taskType,
      parameters,
      steps: chainTemplate,
      createdAt: new Date().toISOString(),
      status: 'created',
      results: {}
    };
  }

  /**
   * Execute a multi-agent reasoning chain
   * 
   * @param {Object} chain - Reasoning chain specification
   * @returns {Promise<Object>} Results of the reasoning chain execution
   */
  async executeReasoningChain(chain) {
    logger.info(`Executing reasoning chain for task type: ${chain.taskType}`);
    
    // Update chain status
    chain.status = 'in_progress';
    chain.startedAt = new Date().toISOString();
    
    // Execute each step in the chain
    for (let i = 0; i < chain.steps.length; i++) {
      const step = chain.steps[i];
      
      logger.info(`Executing step ${i + 1}/${chain.steps.length}: ${step.agent} - ${step.step}`);
      
      try {
        // Get the agent for this step
        const agent = this.agentSystem.getAgent(step.agent);
        if (!agent) {
          throw new Error(`Agent ${step.agent} not found`);
        }
        
        // Prepare context with results from previous steps
        const context = {
          chainId: chain.id,
          stepIndex: i,
          previousResults: chain.results,
          parameters: chain.parameters
        };
        
        // Execute the step
        const result = await agent.executeStep(step.step, context);
        
        // Store the result
        chain.results[step.step] = result;
        
        // Update step status
        step.status = 'completed';
        step.completedAt = new Date().toISOString();
        
      } catch (error) {
        // Handle step failure
        logger.error(`Error executing step ${step.agent} - ${step.step}: ${error.message}`);
        
        step.status = 'failed';
        step.error = error.message;
        
        // Determine if we should halt the chain or continue
        if (this._isStepCritical(step)) {
          chain.status = 'failed';
          chain.error = `Critical step ${step.agent} - ${step.step} failed: ${error.message}`;
          break;
        }
      }
    }
    
    // Update chain status if not already failed
    if (chain.status !== 'failed') {
      chain.status = 'completed';
    }
    
    chain.completedAt = new Date().toISOString();
    
    return chain;
  }

  /**
   * Determine if a step is critical for the chain and should halt execution on failure
   * 
   * @param {Object} step - Step information
   * @returns {boolean} Whether the step is critical
   * @private
   */
  _isStepCritical(step) {
    // Define critical steps that should halt the chain if they fail
    const criticalSteps = [
      'decompose_championship_problem',
      'generate_candidate_schedules',
      'resolve_constraint_conflicts',
      'finalize_championship_schedule'
    ];
    
    return criticalSteps.includes(step.step);
  }
}

module.exports = DelegationPatterns;