/**
 * Feedback System for FlexTime Scheduler
 * 
 * This system implements specialized feedback loops that:
 * 1. Learn from scheduler performance by analyzing outcomes
 * 2. Implement automatic constraint reweighting based on historical performance
 * 3. Integrate with the memory system for long-term knowledge retention
 */

const { CentralizedMemoryManager } = require('../../enhanced/centralized_memory_manager');
const { ModelAllocation } = require('../../model_allocation');
const { DelegationPatterns } = require('../../delegation_patterns');
const { AnthropicMCPConnector } = require('../../anthropic_mcp_connector');

class FeedbackSystem {
  constructor(config = {}) {
    this.memoryManager = config.memoryManager || new CentralizedMemoryManager();
    this.modelAllocation = config.modelAllocation || new ModelAllocation();
    this.delegationPatterns = config.delegationPatterns || new DelegationPatterns();
    this.mcpConnector = config.mcpConnector || new AnthropicMCPConnector();
    
    this.learningRate = config.learningRate || 0.05;
    this.feedbackThreshold = config.feedbackThreshold || 0.7;
    this.performanceMetrics = {
      userSatisfaction: [],
      constraintViolations: [],
      scheduleCompletionRate: [],
      resourceUtilization: []
    };
    
    // Constraint weights start at equal distribution
    this.constraintWeights = {
      timePreference: 1.0,
      locationPreference: 1.0,
      taskPriority: 1.0,
      resourceAvailability: 1.0,
      deadlineProximity: 1.0
    };
    
    // Initialize feedback collection intervals
    this.feedbackInterval = config.feedbackInterval || 24 * 60 * 60 * 1000; // Default: daily
    this.lastFeedbackAnalysis = Date.now();
  }
  
  /**
   * Process feedback on a specific schedule
   * @param {Object} scheduleData - The schedule that was executed
   * @param {Object} feedbackData - User feedback and performance metrics
   * @returns {Promise<Object>} - Analysis and learning outcomes
   */
  async processFeedback(scheduleData, feedbackData) {
    try {
      // Store feedback in memory system for long-term learning
      await this.memoryManager.storeMemory('feedback', {
        scheduleId: scheduleData.id,
        timestamp: Date.now(),
        feedback: feedbackData,
        scheduleData: scheduleData
      });
      
      // Update performance metrics
      this._updatePerformanceMetrics(feedbackData);
      
      // Determine if we should perform constraint reweighting
      const shouldReweight = this._shouldReweightConstraints();
      let reweightingResults = null;
      
      if (shouldReweight) {
        reweightingResults = await this._reweightConstraints();
      }
      
      // Use Claude to analyze the feedback for deeper insights
      const analysisRequest = this._prepareAnalysisRequest(scheduleData, feedbackData);
      const model = this.modelAllocation.allocateModel('feedback_analysis');
      const analysisResults = await this.mcpConnector.processWithClaude(
        analysisRequest,
        model
      );
      
      // Store the insights in memory for future reference
      await this.memoryManager.storeMemory('learning', {
        type: 'feedback_analysis',
        timestamp: Date.now(),
        insights: analysisResults,
        reweightingApplied: shouldReweight,
        reweightingResults: reweightingResults
      });
      
      return {
        processed: true,
        reweightingApplied: shouldReweight,
        reweightingResults,
        insights: analysisResults.summary
      };
    } catch (error) {
      console.error('Error processing feedback:', error);
      throw new Error(`Failed to process feedback: ${error.message}`);
    }
  }
  
  /**
   * Get current constraint weights for schedule optimization
   * @returns {Object} - Current constraint weights
   */
  getConstraintWeights() {
    return { ...this.constraintWeights };
  }
  
  /**
   * Run periodic analysis of collected feedback
   * @returns {Promise<Object>} - Analysis results and actions taken
   */
  async runPeriodicAnalysis() {
    // Check if enough time has passed since last analysis
    const now = Date.now();
    if (now - this.lastFeedbackAnalysis < this.feedbackInterval) {
      return { 
        status: 'skipped', 
        reason: 'Insufficient time since last analysis'
      };
    }
    
    try {
      // Retrieve relevant memories for analysis
      const recentFeedback = await this.memoryManager.searchMemories('feedback', {
        timeRange: {
          start: this.lastFeedbackAnalysis,
          end: now
        }
      });
      
      if (recentFeedback.length === 0) {
        return {
          status: 'skipped',
          reason: 'No new feedback to analyze'
        };
      }
      
      // Delegate the analysis to a specialized agent via delegation patterns
      const analysisAgent = this.delegationPatterns.getAgentForTask('feedback_analysis');
      const analysisTask = {
        type: 'feedback_analysis',
        data: {
          feedback: recentFeedback,
          currentWeights: this.constraintWeights,
          performanceMetrics: this.performanceMetrics
        }
      };
      
      const analysisResults = await this.delegationPatterns.delegateTask(
        analysisAgent,
        analysisTask
      );
      
      // Apply recommended constraint adjustments if provided
      if (analysisResults.recommendedWeights) {
        this._applyRecommendedWeights(analysisResults.recommendedWeights);
      }
      
      // Update last analysis timestamp
      this.lastFeedbackAnalysis = now;
      
      // Store analysis results in long-term memory
      await this.memoryManager.storeMemory('system', {
        type: 'periodic_analysis',
        timestamp: now,
        results: analysisResults,
        updatedWeights: this.constraintWeights
      });
      
      return {
        status: 'completed',
        analysisResults,
        updatedWeights: { ...this.constraintWeights }
      };
    } catch (error) {
      console.error('Error in periodic feedback analysis:', error);
      return {
        status: 'error',
        message: error.message
      };
    }
  }
  
  /**
   * Update internal performance metrics with new feedback
   * @param {Object} feedbackData - The feedback data to incorporate
   * @private
   */
  _updatePerformanceMetrics(feedbackData) {
    const { userSatisfaction, constraintViolations, completionRate, resourceUtilization } = feedbackData;
    
    if (typeof userSatisfaction === 'number') {
      this.performanceMetrics.userSatisfaction.push(userSatisfaction);
      // Keep only the most recent 100 data points
      if (this.performanceMetrics.userSatisfaction.length > 100) {
        this.performanceMetrics.userSatisfaction.shift();
      }
    }
    
    if (typeof constraintViolations === 'number') {
      this.performanceMetrics.constraintViolations.push(constraintViolations);
      if (this.performanceMetrics.constraintViolations.length > 100) {
        this.performanceMetrics.constraintViolations.shift();
      }
    }
    
    if (typeof completionRate === 'number') {
      this.performanceMetrics.scheduleCompletionRate.push(completionRate);
      if (this.performanceMetrics.scheduleCompletionRate.length > 100) {
        this.performanceMetrics.scheduleCompletionRate.shift();
      }
    }
    
    if (typeof resourceUtilization === 'number') {
      this.performanceMetrics.resourceUtilization.push(resourceUtilization);
      if (this.performanceMetrics.resourceUtilization.length > 100) {
        this.performanceMetrics.resourceUtilization.shift();
      }
    }
  }
  
  /**
   * Decide whether constraint reweighting should occur
   * @returns {Boolean} - True if reweighting should occur
   * @private
   */
  _shouldReweightConstraints() {
    // Require minimum feedback samples
    const minSamples = 5;
    const hasEnoughSamples = Object.values(this.performanceMetrics)
      .every(metric => metric.length >= minSamples);
    
    if (!hasEnoughSamples) {
      return false;
    }
    
    // Check if satisfaction is below threshold
    const recentSatisfaction = this.performanceMetrics.userSatisfaction
      .slice(-minSamples)
      .reduce((sum, val) => sum + val, 0) / minSamples;
    
    const recentViolations = this.performanceMetrics.constraintViolations
      .slice(-minSamples)
      .reduce((sum, val) => sum + val, 0) / minSamples;
    
    // Reweight if satisfaction is low or violations are high
    return recentSatisfaction < this.feedbackThreshold || recentViolations > 1.0;
  }
  
  /**
   * Reweight constraints based on historical performance
   * @returns {Promise<Object>} - The reweighting results
   * @private
   */
  async _reweightConstraints() {
    try {
      // Retrieve historical scheduling data for analysis
      const historicalData = await this.memoryManager.searchMemories('feedback', {
        limit: 50,
        sortBy: 'timestamp',
        sortDirection: 'desc'
      });
      
      // Prepare the data for the Claude model
      const reweightingPrompt = {
        role: 'system',
        content: `Analyze the provided scheduling feedback and recommend constraint weight adjustments.
Current weights are: ${JSON.stringify(this.constraintWeights)}
Your task is to analyze patterns in user satisfaction, constraint violations, and schedule completion to suggest improved weights.
Focus on optimizing for user satisfaction while minimizing constraint violations.
Return a JSON object with recommended weights and a brief explanation for each adjustment.`
      };
      
      // Add historical data to the prompt
      const userPrompt = {
        role: 'user',
        content: `Here is the historical scheduling feedback data:
${JSON.stringify(historicalData)}

Current performance metrics:
${JSON.stringify(this.performanceMetrics)}

Please analyze this data and recommend constraint weight adjustments.`
      };
      
      // Use Claude Opus for this complex analytical task
      const analysisResults = await this.mcpConnector.processWithClaude(
        { messages: [reweightingPrompt, userPrompt] },
        'claude-3-opus-20240229'
      );
      
      // Parse the recommended weights from Claude's response
      const recommendedWeights = this._extractRecommendedWeights(analysisResults);
      
      // Apply the weight adjustments gradually
      this._applyRecommendedWeights(recommendedWeights);
      
      return {
        previousWeights: { ...this.constraintWeights },
        recommendedWeights,
        appliedWeights: { ...this.constraintWeights },
        explanation: analysisResults.explanation
      };
    } catch (error) {
      console.error('Error reweighting constraints:', error);
      return {
        error: true,
        message: error.message
      };
    }
  }
  
  /**
   * Extract recommended weights from Claude's analysis
   * @param {Object} analysisResults - Claude's analysis output
   * @returns {Object} - Extracted weight recommendations
   * @private
   */
  _extractRecommendedWeights(analysisResults) {
    try {
      // First try to extract a JSON object from the response
      const jsonMatch = analysisResults.response.content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.recommendedWeights) {
          return parsed.recommendedWeights;
        }
        return parsed;
      }
      
      // Fallback to a simpler extraction approach
      const weights = {};
      const constraintTypes = Object.keys(this.constraintWeights);
      
      for (const constraint of constraintTypes) {
        const regex = new RegExp(`"${constraint}"\\s*:\\s*(\\d+\\.\\d+)`, 'i');
        const match = analysisResults.response.content.match(regex);
        if (match && match[1]) {
          weights[constraint] = parseFloat(match[1]);
        } else {
          // Keep current weight if no recommendation found
          weights[constraint] = this.constraintWeights[constraint];
        }
      }
      
      return weights;
    } catch (error) {
      console.error('Error extracting recommended weights:', error);
      return { ...this.constraintWeights }; // Return current weights as fallback
    }
  }
  
  /**
   * Apply recommended weight adjustments gradually
   * @param {Object} recommendedWeights - The recommended constraint weights
   * @private
   */
  _applyRecommendedWeights(recommendedWeights) {
    // Get all constraint types
    const constraintTypes = Object.keys(this.constraintWeights);
    
    // For each constraint, adjust the weight gradually
    for (const constraint of constraintTypes) {
      if (recommendedWeights[constraint] !== undefined) {
        // Apply gradual change using learning rate
        const currentWeight = this.constraintWeights[constraint];
        const targetWeight = recommendedWeights[constraint];
        const adjustment = this.learningRate * (targetWeight - currentWeight);
        
        // Update the weight
        this.constraintWeights[constraint] = currentWeight + adjustment;
      }
    }
    
    // Normalize weights to prevent extreme values
    this._normalizeWeights();
  }
  
  /**
   * Normalize constraint weights to prevent extreme values
   * @private
   */
  _normalizeWeights() {
    const constraintTypes = Object.keys(this.constraintWeights);
    
    // Find min and max weights
    let minWeight = Infinity;
    let maxWeight = -Infinity;
    
    for (const constraint of constraintTypes) {
      const weight = this.constraintWeights[constraint];
      minWeight = Math.min(minWeight, weight);
      maxWeight = Math.max(maxWeight, weight);
    }
    
    // If weights are getting too extreme, normalize them
    if (maxWeight / minWeight > 5) {
      // Calculate the sum of all weights
      const weightSum = constraintTypes.reduce(
        (sum, constraint) => sum + this.constraintWeights[constraint],
        0
      );
      
      // Normalize weights to sum to the number of constraints
      const targetSum = constraintTypes.length;
      for (const constraint of constraintTypes) {
        this.constraintWeights[constraint] = 
          (this.constraintWeights[constraint] / weightSum) * targetSum;
      }
    }
  }
  
  /**
   * Prepare an analysis request for Claude
   * @param {Object} scheduleData - The schedule data
   * @param {Object} feedbackData - The feedback data
   * @returns {Object} - Formatted request for Claude
   * @private
   */
  _prepareAnalysisRequest(scheduleData, feedbackData) {
    return {
      messages: [
        {
          role: 'system',
          content: `You are an advanced schedule analysis system. Your task is to:
1. Analyze the given schedule and associated feedback
2. Identify patterns and insights regarding user satisfaction
3. Determine which constraints were most problematic
4. Recommend specific improvements for future scheduling

Format your analysis with clear sections for:
- Insights summary
- Key constraint violations
- Recommendations for improvement
- Suggested weight adjustments (if applicable)`
        },
        {
          role: 'user',
          content: `Please analyze this schedule and feedback data:
Schedule: ${JSON.stringify(scheduleData)}
Feedback: ${JSON.stringify(feedbackData)}
Current constraint weights: ${JSON.stringify(this.constraintWeights)}`
        }
      ]
    };
  }
}

module.exports = { FeedbackSystem };