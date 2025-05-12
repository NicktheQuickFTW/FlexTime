/**
 * Feedback Analysis Service
 * 
 * Service to handle periodic feedback analysis as a background process
 */

const { FeedbackSystem } = require('../agents/learning/feedback_system');
const { EnhancedMemoryManager } = require('../agents/memory/enhanced_memory_manager');

class FeedbackAnalysisService {
  constructor() {
    this.memoryManager = new EnhancedMemoryManager();
    this.feedbackSystem = null;
    this.analysisInterval = 24 * 60 * 60 * 1000; // Default: daily
    this.analysisTimer = null;
    this.isInitialized = false;
  }
  
  /**
   * Initialize the feedback analysis service
   * @param {Object} options - Configuration options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Set analysis interval (if provided)
      if (options.analysisInterval) {
        this.analysisInterval = options.analysisInterval;
      }
      
      // Try to load previous constraint weights from memory
      let savedWeights = null;
      try {
        const systemMemory = await this.memoryManager.searchMemories('system', {
          type: 'constraint_weights',
          limit: 1,
          sortBy: 'timestamp',
          sortDirection: 'desc'
        });
        
        if (systemMemory && systemMemory.length > 0) {
          savedWeights = systemMemory[0].weights;
          console.log('Loaded saved constraint weights:', savedWeights);
        }
      } catch (error) {
        console.warn('Could not load saved constraint weights:', error.message);
      }
      
      // Create the feedback system with saved weights if available
      this.feedbackSystem = new FeedbackSystem({
        memoryManager: this.memoryManager,
        constraintWeights: savedWeights || undefined,
        feedbackInterval: this.analysisInterval
      });
      
      // Start the periodic analysis
      this._startPeriodicAnalysis();
      
      this.isInitialized = true;
      console.log('Feedback Analysis Service initialized');
    } catch (error) {
      console.error('Error initializing Feedback Analysis Service:', error);
      throw new Error(`Failed to initialize Feedback Analysis Service: ${error.message}`);
    }
  }
  
  /**
   * Start periodic analysis of feedback data
   * @private
   */
  _startPeriodicAnalysis() {
    // Clear any existing timer
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
    }
    
    // Set up the analysis timer
    this.analysisTimer = setInterval(async () => {
      try {
        console.log('Running scheduled feedback analysis...');
        const results = await this.feedbackSystem.runPeriodicAnalysis();
        
        if (results.status === 'completed') {
          console.log('Scheduled feedback analysis completed successfully');
          
          // Save the updated constraint weights to memory
          await this.memoryManager.storeMemory('system', {
            type: 'constraint_weights',
            timestamp: Date.now(),
            weights: results.updatedWeights
          });
        } else {
          console.log(`Scheduled feedback analysis skipped: ${results.reason || 'unknown reason'}`);
        }
      } catch (error) {
        console.error('Error in scheduled feedback analysis:', error);
      }
    }, this.analysisInterval);
    
    console.log(`Periodic feedback analysis scheduled (interval: ${this.analysisInterval}ms)`);
  }
  
  /**
   * Stop the periodic analysis
   */
  stop() {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
      console.log('Feedback Analysis Service stopped');
    }
  }
  
  /**
   * Run a manual analysis
   * @returns {Promise<Object>} Analysis results
   */
  async runManualAnalysis() {
    if (!this.isInitialized) {
      throw new Error('Feedback Analysis Service not initialized');
    }
    
    try {
      console.log('Running manual feedback analysis...');
      const results = await this.feedbackSystem.runPeriodicAnalysis();
      
      if (results.status === 'completed') {
        // Save the updated constraint weights to memory
        await this.memoryManager.storeMemory('system', {
          type: 'constraint_weights',
          timestamp: Date.now(),
          weights: results.updatedWeights
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error in manual feedback analysis:', error);
      throw new Error(`Failed to run manual feedback analysis: ${error.message}`);
    }
  }
  
  /**
   * Get the current constraint weights
   * @returns {Object} Current constraint weights
   */
  getConstraintWeights() {
    if (!this.isInitialized) {
      throw new Error('Feedback Analysis Service not initialized');
    }
    
    return this.feedbackSystem.getConstraintWeights();
  }
}

// Create and export a singleton instance
const feedbackAnalysisService = new FeedbackAnalysisService();

module.exports = feedbackAnalysisService;