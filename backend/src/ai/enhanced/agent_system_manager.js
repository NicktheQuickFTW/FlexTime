/**
 * Agent System Manager for FlexTime
 * 
 * This utility provides integration and orchestration functions for the enhanced agent system,
 * facilitating testing, initialization, and runtime management of the agents.
 */

const EnhancedMemoryAgent = require('./enhanced_memory_agent');
const PredictiveSchedulingAgent = require('./predictive_scheduling_agent');
const ConflictResolutionAgent = require('./conflict_resolution_agent');
const mcpConfig = require('../../config/mcp_config');
const logger = require("../../lib/logger");;

/**
 * Manager for enhanced agent system
 */
class AgentSystemManager {
  /**
   * Initialize the agent system manager
   * 
   * @param {object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = { ...mcpConfig, ...config };
    this.initialized = false;
    this.agents = {};
    
    // Default to enabled
    this.enabled = this.config.enabled !== false;
    
    logger.info('Agent System Manager created');
  }
  
  /**
   * Initialize the enhanced agent system
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) {
      logger.info('Agent system already initialized');
      return true;
    }
    
    if (!this.enabled) {
      logger.warn('Agent system is disabled');
      return false;
    }
    
    try {
      logger.info('Initializing enhanced agent system');
      
      // Initialize memory agent
      this.agents.memory = new EnhancedMemoryAgent(this.config);
      
      // Initialize predictive scheduling agent
      this.agents.prediction = new PredictiveSchedulingAgent(this.config);
      
      // Initialize conflict resolution agent
      this.agents.resolution = new ConflictResolutionAgent(this.config);
      
      this.initialized = true;
      logger.info('Enhanced agent system initialized successfully');
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize agent system: ${error.message}`);
      this.initialized = false;
      return false;
    }
  }
  
  /**
   * Check if the agent system is initialized and ready
   * 
   * @returns {boolean} Whether the system is ready
   */
  isReady() {
    return this.initialized && this.enabled;
  }
  
  /**
   * Run a test scenario to validate the agent system
   * 
   * @param {string} testType - Type of test to run
   * @param {object} params - Test parameters
   * @returns {Promise<object>} Test results
   */
  async runTest(testType, params = {}) {
    if (!this.isReady()) {
      await this.initialize();
      
      if (!this.isReady()) {
        return {
          success: false,
          error: 'Agent system is not initialized',
          testType
        };
      }
    }
    
    try {
      logger.info(`Running ${testType} test scenario`);
      
      switch (testType) {
        case 'memory':
          return await this.runMemoryTest(params);
        
        case 'prediction':
          return await this.runPredictionTest(params);
        
        case 'conflict':
          return await this.runConflictTest(params);
        
        case 'integration':
          return await this.runIntegrationTest(params);
        
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }
    } catch (error) {
      logger.error(`Test failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        testType
      };
    }
  }
  
  /**
   * Run a memory agent test
   * 
   * @param {object} params - Test parameters
   * @returns {Promise<object>} Test results
   * @private
   */
  async runMemoryTest(params) {
    const { content = 'Test memory content', tags = ['test'] } = params;
    
    // Store a test memory
    const memoryId = await this.agents.memory.storeMemory({
      content,
      agentId: 'test_agent',
      tags,
      importance: 'medium'
    });
    
    if (!memoryId) {
      throw new Error('Failed to store test memory');
    }
    
    // Retrieve the memory
    const memories = await this.agents.memory.findRelevantMemories({
      query: content,
      tags,
      limit: 1
    });
    
    // Validate retrieval
    const retrievalSuccess = memories.length > 0 && memories[0].id === memoryId;
    
    // Clean up test memory
    await this.agents.memory.deleteMemory(memoryId);
    
    return {
      success: retrievalSuccess,
      testType: 'memory',
      memoryId,
      retrievalSuccess,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Run a prediction agent test
   * 
   * @param {object} params - Test parameters
   * @returns {Promise<object>} Test results
   * @private
   */
  async runPredictionTest(params) {
    const { 
      sportType = 'football',
      season = '2024-2025',
      institutions = [
        'University of Texas',
        'Texas Tech University',
        'Baylor University',
        'Texas Christian University'
      ]
    } = params;
    
    // Run a prediction test
    const prediction = await this.agents.prediction.predictOptimalSchedule({
      sportType,
      season,
      institutions,
      startDate: '2024-09-01',
      endDate: '2024-11-30'
    });
    
    return {
      success: prediction.success,
      testType: 'prediction',
      predictionResult: prediction,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Run a conflict resolution agent test
   * 
   * @param {object} params - Test parameters
   * @returns {Promise<object>} Test results
   * @private
   */
  async runConflictTest(params) {
    // Create a simple test schedule with conflicts
    const testSchedule = params.schedule || [
      {
        id: 'game1',
        date: '2024-09-14',
        startTime: '14:00',
        homeTeam: 'University of Texas',
        awayTeam: 'Oklahoma University',
        venue: 'DKR Texas Memorial Stadium'
      },
      {
        id: 'game2',
        date: '2024-09-14',
        startTime: '14:00',
        homeTeam: 'University of Texas',
        awayTeam: 'Texas Tech University',
        venue: 'Jones AT&T Stadium'
      },
      {
        id: 'game3',
        date: '2024-09-14',
        startTime: '15:00',
        homeTeam: 'Baylor University',
        awayTeam: 'TCU',
        venue: 'DKR Texas Memorial Stadium'
      }
    ];
    
    // Detect conflicts
    const detectionResult = await this.agents.resolution.detectConflicts({
      proposedSchedule: testSchedule,
      sportType: params.sportType || 'football'
    });
    
    // Resolve conflicts if any were detected
    let resolutionResult = null;
    if (detectionResult.success && detectionResult.conflicts.length > 0) {
      resolutionResult = await this.agents.resolution.resolveConflicts({
        conflicts: detectionResult.conflicts,
        originalSchedule: testSchedule,
        context: {
          sportType: params.sportType || 'football'
        }
      });
    }
    
    // Get explanation for one conflict if available
    let explanationResult = null;
    if (detectionResult.success && detectionResult.conflicts.length > 0) {
      explanationResult = await this.agents.resolution.explainConflict(
        detectionResult.conflicts[0]
      );
    }
    
    return {
      success: detectionResult.success,
      testType: 'conflict',
      detectionResult,
      resolutionResult,
      explanationResult,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Run an integration test of all agents working together
   * 
   * @param {object} params - Test parameters
   * @returns {Promise<object>} Test results
   * @private
   */
  async runIntegrationTest(params) {
    const { 
      sportType = 'football',
      season = '2024-2025',
      institutions = [
        'University of Texas',
        'Texas Tech University',
        'Baylor University',
        'Texas Christian University'
      ]
    } = params;
    
    // Test results
    const results = {
      memory: false,
      prediction: false,
      detection: false,
      resolution: false,
      integration: false
    };
    
    try {
      // 1. Store context in memory
      const contextMemoryId = await this.agents.memory.storeMemory({
        content: JSON.stringify({
          sportType,
          season,
          institutions,
          constraints: {
            minDaysBetweenGames: 5,
            preferredDays: [5, 6] // Friday and Saturday
          }
        }),
        agentId: 'integration_test',
        tags: ['scheduling', sportType, season],
        importance: 'high'
      });
      
      results.memory = !!contextMemoryId;
      
      // 2. Generate schedule prediction
      const prediction = await this.agents.prediction.predictOptimalSchedule({
        sportType,
        season,
        institutions
      });
      
      results.prediction = prediction.success;
      
      if (!prediction.success || !prediction.predictions || prediction.predictions.length === 0) {
        throw new Error('Failed to generate schedule prediction');
      }
      
      // 3. Detect conflicts in predicted schedule
      const proposedSchedule = prediction.predictions[0].schedule;
      
      const detectionResult = await this.agents.resolution.detectConflicts({
        proposedSchedule,
        sportType
      });
      
      results.detection = detectionResult.success;
      
      // 4. Resolve conflicts
      let finalSchedule = proposedSchedule;
      
      if (detectionResult.conflicts && detectionResult.conflicts.length > 0) {
        const resolutionResult = await this.agents.resolution.resolveConflicts({
          conflicts: detectionResult.conflicts,
          originalSchedule: proposedSchedule,
          context: { sportType }
        });
        
        results.resolution = resolutionResult.success;
        
        if (resolutionResult.success) {
          finalSchedule = resolutionResult.modifiedSchedule;
        }
      } else {
        // No conflicts to resolve
        results.resolution = true;
      }
      
      // 5. Store final result in memory
      const resultMemoryId = await this.agents.memory.storeMemory({
        content: JSON.stringify({
          finalSchedule,
          sportType,
          season,
          institutions,
          conflictsDetected: detectionResult.conflicts?.length || 0,
          conflictsResolved: detectionResult.conflicts?.length || 0
        }),
        agentId: 'integration_test',
        tags: ['final_schedule', sportType, season],
        importance: 'high'
      });
      
      // Overall success if we got through all steps
      results.integration = true;
      
      return {
        success: true,
        testType: 'integration',
        results,
        finalScheduleSize: finalSchedule.length,
        contextMemoryId,
        resultMemoryId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Integration test failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        testType: 'integration',
        results,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get an agent by name
   * 
   * @param {string} agentName - Name of the agent to retrieve
   * @returns {object|null} The requested agent or null if not found
   */
  getAgent(agentName) {
    if (!this.isReady()) {
      logger.warn('Attempting to get agent from uninitialized system');
      return null;
    }
    
    return this.agents[agentName] || null;
  }
  
  /**
   * Shutdown the agent system gracefully
   */
  async shutdown() {
    if (!this.initialized) {
      logger.info('Agent system not initialized, nothing to shut down');
      return;
    }
    
    logger.info('Shutting down agent system');
    
    // Run maintenance on memory agent before shutdown
    if (this.agents.memory) {
      try {
        await this.agents.memory.runMaintenanceCycle();
      } catch (error) {
        logger.error(`Error during memory maintenance: ${error.message}`);
      }
    }
    
    // Clear agent references
    this.agents = {};
    this.initialized = false;
    
    logger.info('Agent system shut down successfully');
  }
}

module.exports = AgentSystemManager;
