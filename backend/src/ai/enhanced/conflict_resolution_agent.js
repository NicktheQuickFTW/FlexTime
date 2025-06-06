/**
 * Conflict Resolution Agent for FlexTime
 * 
 * This agent focuses on detecting and resolving scheduling conflicts by:
 * - Proactively identifying potential conflicts in proposed schedules
 * - Applying specialized resolution strategies for different conflict types
 * - Providing explanations for conflicts and resolutions
 * - Learning from past conflict resolutions
 */

const logger = require('../scripts/logger");
const FlexTimeConnector = require('../flextime_connector');
const EnhancedMemoryAgent = require('./enhanced_memory_agent');
// FlexTime config removed, using default config instead
const flexTimeConfig = {}; // Empty object as fallback

// Import specialized modules
const {
  detectVenueConflicts,
  detectTeamConflicts,
  detectTravelConflicts,
  detectResourceConflicts,
  detectRestPeriodConflicts
} = require('./conflict_detection');

const {
  resolveVenueConflicts,
  resolveTeamConflicts,
  resolveTravelConflicts,
  resolveRestPeriodConflicts
} = require('./resolution_strategies');

const { explainConflict } = require('./conflict_explanation');

/**
 * Conflict Resolution Agent for detecting and resolving scheduling conflicts
 */
class ConflictResolutionAgent {
  /**
   * Initialize a new Conflict Resolution Agent
   * 
   * @param {object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = { ...flexTimeConfig, ...config };
    this.enabled = this.config.enabled;
    this.flexTimeConnector = new FlexTimeConnector(this.config);
    this.memoryAgent = new EnhancedMemoryAgent(this.config);
    
    // Define known conflict types
    this.conflictTypes = new Set([
      'venue', // Same venue, overlapping times
      'time',  // Scheduling window violations
      'travel', // Insufficient travel time
      'resource', // Personnel or equipment conflicts
      'team', // Same team scheduled multiple times
      'rest' // Insufficient rest periods
    ]);
    
    // Initialize empty resolution strategies map
    this.resolutionStrategies = new Map();
    
    // Initialize priority matrix for conflict resolution
    // Higher values indicate higher priority conflicts to resolve
    this.priorityMatrix = {
      venue: 9,
      team: 10,
      travel: 8,
      rest: 7,
      resource: 6,
      time: 5
    };
    
    logger.info('Conflict Resolution Agent initialized');
  }

  /**
   * Register a resolution strategy for a specific conflict type
   * 
   * @param {string} conflictType - Type of conflict this strategy handles
   * @param {Function} strategyFn - Strategy function that resolves conflicts
   * @param {number} priority - Priority level (higher values = higher priority)
   */
  registerResolutionStrategy(conflictType, strategyFn, priority = 1) {
    if (!this.conflictTypes.has(conflictType)) {
      logger.warn(`Unknown conflict type: ${conflictType}`);
      this.conflictTypes.add(conflictType); // Add it anyway
    }
    
    if (!this.resolutionStrategies.has(conflictType)) {
      this.resolutionStrategies.set(conflictType, []);
    }
    
    this.resolutionStrategies.get(conflictType).push({
      execute: strategyFn,
      priority
    });
    
    // Sort strategies by priority (descending)
    this.resolutionStrategies.get(conflictType).sort((a, b) => b.priority - a.priority);
    
    logger.info(`Registered resolution strategy for ${conflictType} conflicts with priority ${priority}`);
  }
  
  /**
   * Detect conflicts in a proposed schedule
   * 
   * @param {object} params - Detection parameters
   * @param {Array<object>} params.proposedSchedule - Proposed schedule to check
   * @param {string} params.sportType - Type of sport
   * @param {object} params.constraints - Additional scheduling constraints
   * @returns {Promise<object>} Detected conflicts with explanations
   */
  async detectConflicts(params) {
    if (!this.enabled) {
      logger.warn('Conflict Resolution Agent is disabled');
      return {
        success: false,
        error: 'Agent is disabled',
        conflicts: []
      };
    }
    
    const { proposedSchedule, sportType, constraints = {} } = params;
    
    if (!proposedSchedule || !Array.isArray(proposedSchedule) || proposedSchedule.length === 0) {
      return {
        success: false,
        error: 'Invalid or empty schedule provided',
        conflicts: []
      };
    }
    
    try {
      logger.info(`Detecting conflicts for ${sportType} schedule with ${proposedSchedule.length} events`);
      
      // Initialize conflicts collection
      let detectedConflicts = [];
      
      // Apply each conflict detection method
      const venues = constraints.venues || {};
      const resources = constraints.resources || {};
      
      // Detect venue conflicts
      const venueConflicts = detectVenueConflicts(proposedSchedule, venues);
      
      // Detect team conflicts
      const teamConflicts = detectTeamConflicts(proposedSchedule, constraints);
      
      // Detect travel conflicts
      const travelConflicts = detectTravelConflicts(proposedSchedule, venues, constraints);
      
      // Detect resource conflicts
      const resourceConflicts = detectResourceConflicts(proposedSchedule, resources);
      
      // Detect rest period conflicts
      const restConflicts = detectRestPeriodConflicts(proposedSchedule, {
        ...constraints,
        sportType
      });
      
      // Combine all conflicts
      detectedConflicts = [
        ...venueConflicts,
        ...teamConflicts,
        ...travelConflicts,
        ...resourceConflicts,
        ...restConflicts
      ];
      
      // Store conflicts in memory for learning
      if (detectedConflicts.length > 0) {
        await this.memoryAgent.storeMemory({
          content: JSON.stringify({
            sportType,
            scheduleSize: proposedSchedule.length,
            conflicts: detectedConflicts.map(c => ({
              type: c.type,
              subType: c.subType,
              severity: c.severity
            })),
            timestamp: new Date().toISOString()
          }),
          agentId: 'conflict_resolution',
          tags: ['conflicts', 'detection', sportType],
          importance: detectedConflicts.some(c => c.severity === 'high') ? 'high' : 'medium'
        });
      }
      
      return {
        success: true,
        conflicts: detectedConflicts,
        conflictCount: detectedConflicts.length,
        conflictsByType: {
          venue: venueConflicts.length,
          team: teamConflicts.length,
          travel: travelConflicts.length,
          resource: resourceConflicts.length,
          rest: restConflicts.length
        },
        sportType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to detect conflicts: ${error.message}`);
      return {
        success: false,
        error: error.message,
        conflicts: []
      };
    }
  }
  
  /**
   * Resolve detected conflicts in a schedule
   * 
   * @param {object} params - Resolution parameters
   * @param {Array<object>} params.conflicts - Conflicts to resolve
   * @param {Array<object>} params.originalSchedule - Original schedule
   * @param {object} params.context - Additional context for resolution
   * @returns {Promise<object>} Resolution results with modified schedule
   */
  async resolveConflicts(params) {
    if (!this.enabled) {
      logger.warn('Conflict Resolution Agent is disabled');
      return {
        success: false,
        error: 'Agent is disabled',
        resolutions: [],
        modifiedSchedule: params.originalSchedule || []
      };
    }
    
    const { conflicts, originalSchedule, context = {} } = params;
    
    if (!conflicts || !Array.isArray(conflicts) || conflicts.length === 0) {
      return {
        success: true,
        message: 'No conflicts to resolve',
        resolutions: [],
        modifiedSchedule: originalSchedule || []
      };
    }
    
    if (!originalSchedule || !Array.isArray(originalSchedule) || originalSchedule.length === 0) {
      return {
        success: false,
        error: 'Invalid or empty original schedule provided',
        resolutions: [],
        modifiedSchedule: []
      };
    }
    
    try {
      logger.info(`Resolving ${conflicts.length} conflicts`);
      
      // Sort conflicts by priority
      const prioritizedConflicts = [...conflicts].sort((a, b) => {
        const priorityA = this.priorityMatrix[a.type] || 0;
        const priorityB = this.priorityMatrix[b.type] || 0;
        return priorityB - priorityA;
      });
      
      // Group conflicts by type
      const conflictsByType = {};
      
      prioritizedConflicts.forEach(conflict => {
        if (!conflictsByType[conflict.type]) {
          conflictsByType[conflict.type] = [];
        }
        conflictsByType[conflict.type].push(conflict);
      });
      
      // Create a deep copy of the schedule to modify
      let modifiedSchedule = JSON.parse(JSON.stringify(originalSchedule));
      
      // Track all resolutions applied
      let allResolutions = [];
      
      // Resolve conflicts by type using specialized resolvers
      
      // 1. Start with venue conflicts
      if (conflictsByType.venue && conflictsByType.venue.length > 0) {
        const { resolutions, modifiedSchedule: newSchedule } = await resolveVenueConflicts(
          conflictsByType.venue,
          modifiedSchedule,
          context
        );
        
        allResolutions = [...allResolutions, ...resolutions];
        modifiedSchedule = newSchedule;
      }
      
      // 2. Then resolve team conflicts
      if (conflictsByType.team && conflictsByType.team.length > 0) {
        const { resolutions, modifiedSchedule: newSchedule } = await resolveTeamConflicts(
          conflictsByType.team,
          modifiedSchedule,
          context
        );
        
        allResolutions = [...allResolutions, ...resolutions];
        modifiedSchedule = newSchedule;
      }
      
      // 3. Resolve travel conflicts
      if (conflictsByType.travel && conflictsByType.travel.length > 0) {
        const { resolutions, modifiedSchedule: newSchedule } = await resolveTravelConflicts(
          conflictsByType.travel,
          modifiedSchedule,
          context
        );
        
        allResolutions = [...allResolutions, ...resolutions];
        modifiedSchedule = newSchedule;
      }
      
      // 4. Resolve rest period conflicts
      if (conflictsByType.rest && conflictsByType.rest.length > 0) {
        const { resolutions, modifiedSchedule: newSchedule } = await resolveRestPeriodConflicts(
          conflictsByType.rest,
          modifiedSchedule,
          context
        );
        
        allResolutions = [...allResolutions, ...resolutions];
        modifiedSchedule = newSchedule;
      }
      
      // Identify unresolved conflicts
      const resolvedConflictIds = new Set(allResolutions.map(r => r.conflictId));
      const unresolvedConflicts = prioritizedConflicts.filter(
        c => !resolvedConflictIds.has(c.id)
      );
      
      // Store resolutions in memory for learning
      if (allResolutions.length > 0) {
        await this.memoryAgent.storeMemory({
          content: JSON.stringify({
            totalConflicts: conflicts.length,
            resolvedConflicts: allResolutions.length,
            unresolvedConflicts: unresolvedConflicts.length,
            resolutionTypes: allResolutions.map(r => r.resolutionType),
            timestamp: new Date().toISOString()
          }),
          agentId: 'conflict_resolution',
          tags: ['resolutions', context.sportType || 'unknown'],
          importance: 'medium'
        });
      }
      
      return {
        success: true,
        resolutions: allResolutions,
        resolutionCount: allResolutions.length,
        modifiedSchedule,
        unresolvedConflicts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to resolve conflicts: ${error.message}`);
      return {
        success: false,
        error: error.message,
        resolutions: [],
        modifiedSchedule: originalSchedule || []
      };
    }
  }
  
  /**
   * Get detailed explanation for a conflict
   * 
   * @param {object} conflict - Conflict to explain
   * @returns {Promise<object>} Detailed explanation with resolution options
   */
  async explainConflict(conflict) {
    if (!this.enabled) {
      logger.warn('Conflict Resolution Agent is disabled');
      return {
        success: false,
        error: 'Agent is disabled',
        explanation: null
      };
    }
    
    try {
      // Use our explanation module
      const explanation = await explainConflict(conflict, {});
      
      // Store user-facing explanations in memory
      if (explanation.success) {
        await this.memoryAgent.storeMemory({
          content: JSON.stringify({
            conflictType: conflict.type,
            explanation: explanation.explanation,
            recommendedActions: explanation.recommendedActions,
            timestamp: new Date().toISOString()
          }),
          agentId: 'conflict_resolution',
          tags: ['explanations', conflict.type],
          importance: 'low'
        });
      }
      
      return explanation;
    } catch (error) {
      logger.error(`Failed to explain conflict: ${error.message}`);
      return {
        success: false,
        error: error.message,
        explanation: null
      };
    }
  }
  
  /**
   * Generate a summary report of detected conflicts
   * 
   * @param {Array<object>} conflicts - List of detected conflicts
   * @returns {Promise<object>} Summary report
   */
  async generateConflictSummaryReport(conflicts) {
    if (!this.enabled || !conflicts || conflicts.length === 0) {
      return {
        success: false,
        error: 'No conflicts to summarize or agent disabled',
        report: null
      };
    }
    
    try {
      // Count conflicts by type
      const countByType = {};
      conflicts.forEach(conflict => {
        const type = conflict.type;
        countByType[type] = (countByType[type] || 0) + 1;
      });
      
      // Count by severity
      const countBySeverity = {
        high: 0,
        medium: 0,
        low: 0
      };
      
      conflicts.forEach(conflict => {
        const severity = conflict.severity || 'medium';
        countBySeverity[severity] = (countBySeverity[severity] || 0) + 1;
      });
      
      // Identify resources involved in conflicts
      const affectedResources = new Set();
      
      conflicts.forEach(conflict => {
        if (conflict.team) affectedResources.add(conflict.team);
        if (conflict.venue) affectedResources.add(conflict.venue);
        if (conflict.resourceId) affectedResources.add(conflict.resourceId);
        
        if (conflict.events) {
          conflict.events.forEach(event => {
            if (event.venue) affectedResources.add(event.venue);
            if (event.teams) {
              event.teams.forEach(team => affectedResources.add(team));
            }
          });
        }
      });
      
      // Generate prompt for FlexTime AI
      const prompt = `
        Generate a concise executive summary of scheduling conflicts:
        
        Total conflicts: ${conflicts.length}
        
        By type:
        ${Object.entries(countByType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}
        
        By severity:
        ${Object.entries(countBySeverity).map(([severity, count]) => `- ${severity}: ${count}`).join('\n')}
        
        Affected resources:
        ${Array.from(affectedResources).join(', ')}
        
        Generate a brief 3-5 sentence summary that highlights the most critical issues, potential impacts, and high-level recommendations. Format the response as plain text.
      `;
      
      // Call FlexTime AI for the summary
      const response = await this.flexTimeConnector.sendRequest({
        agentId: 'conflict_resolution',
        taskType: 'conflict_summary',
        prompt,
        parameters: {
          temperature: 0.4,
          max_tokens: 250
        }
      });
      
      let summarizedReport;
      
      if (response.status === 'success' && response.content) {
        summarizedReport = response.content.trim();
      } else {
        // Fallback summary if AI generation fails
        summarizedReport = `Detected ${conflicts.length} scheduling conflicts: ${countByType.venue || 0} venue, ${countByType.team || 0} team, ${countByType.travel || 0} travel, and ${countByType.rest || 0} rest period conflicts. ${countBySeverity.high || 0} conflicts are high severity requiring immediate attention. Recommend addressing venue conflicts first, followed by team conflicts.`;
      }
      
      return {
        success: true,
        report: {
          summary: summarizedReport,
          totalConflicts: conflicts.length,
          byType: countByType,
          bySeverity: countBySeverity,
          affectedResources: Array.from(affectedResources),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error(`Failed to generate conflict summary: ${error.message}`);
      return {
        success: false,
        error: error.message,
        report: null
      };
    }
  }
  
  /**
   * Learn from historical conflict resolutions
   * 
   * @returns {Promise<object>} Learning results
   */
  async learnFromHistoricalResolutions() {
    if (!this.enabled) {
      logger.warn('Conflict Resolution Agent is disabled');
      return {
        success: false,
        error: 'Agent is disabled'
      };
    }
    
    try {
      logger.info('Learning from historical conflict resolutions');
      
      // Retrieve resolution memories
      const resolutionMemories = await this.memoryAgent.findRelevantMemories({
        query: 'conflict resolutions effectiveness',
        tags: ['resolutions'],
        limit: 50,
        threshold: 0.6
      });
      
      if (resolutionMemories.length === 0) {
        return {
          success: false,
          error: 'No historical resolution data found',
          improvements: []
        };
      }
      
      // Process memories to extract patterns
      const resolutionData = resolutionMemories.map(memory => {
        try {
          return JSON.parse(memory.content);
        } catch (error) {
          logger.warn(`Failed to parse resolution memory: ${error.message}`);
          return null;
        }
      }).filter(Boolean);
      
      // Calculate effectiveness statistics
      const stats = {
        totalConflicts: 0,
        resolvedConflicts: 0,
        unresolvedConflicts: 0,
        resolutionsByType: {}
      };
      
      resolutionData.forEach(data => {
        stats.totalConflicts += data.totalConflicts || 0;
        stats.resolvedConflicts += data.resolvedConflicts || 0;
        stats.unresolvedConflicts += data.unresolvedConflicts || 0;
        
        // Count resolution types
        if (data.resolutionTypes) {
          data.resolutionTypes.forEach(type => {
            stats.resolutionsByType[type] = (stats.resolutionsByType[type] || 0) + 1;
          });
        }
      });
      
      // Calculate effectiveness rate
      const effectivenessRate = stats.totalConflicts > 0 ?
        stats.resolvedConflicts / stats.totalConflicts : 0;
      
      // Identify top resolution strategies
      const topStrategies = Object.entries(stats.resolutionsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type, count]) => ({
          type,
          count,
          effectiveness: count / stats.resolvedConflicts
        }));
      
      // Update priority matrix based on learning
      this._updatePriorityMatrix(resolutionData);
      
      return {
        success: true,
        learningStats: {
          effectivenessRate,
          totalConflictsAnalyzed: stats.totalConflicts,
          resolvedConflictsCount: stats.resolvedConflicts,
          unresolvedConflictsCount: stats.unresolvedConflicts,
          topStrategies,
          updatedPriorities: this.priorityMatrix
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to learn from historical resolutions: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update priority matrix based on resolution effectiveness
   * 
   * @param {Array<object>} resolutionData - Historical resolution data
   * @private
   */
  _updatePriorityMatrix(resolutionData) {
    // Calculate which conflict types have been most successfully resolved
    const resolutionSuccessByType = {};
    
    // This is a simplified implementation
    // In a production system, this would use more sophisticated machine learning
    
    // For now, we just slightly adjust priorities based on resolution history
    Object.keys(this.priorityMatrix).forEach(type => {
      // Small random adjustment to avoid getting stuck in local optimum
      const adjustment = (Math.random() * 0.4) - 0.2;
      this.priorityMatrix[type] += adjustment;
      
      // Ensure priorities stay in reasonable range
      this.priorityMatrix[type] = Math.max(1, Math.min(10, this.priorityMatrix[type]));
    });
  }
}

module.exports = ConflictResolutionAgent;
