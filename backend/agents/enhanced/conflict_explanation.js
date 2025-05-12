/**
 * Conflict Explanation Module for FlexTime
 * 
 * This module provides detailed explanations for scheduling conflicts:
 * - Natural language explanations of conflict causes
 * - Insight into why conflicts occur
 * - Recommendations for resolution
 * - Visualization data preparation
 */

const logger = require('../../utils/logger');
const MCPConnector = require('../mcp_connector');
// MCP config removed, using default config instead
const mcpConfig = {}; // Empty object as fallback
const KnowledgeGraphAgent = require('./knowledge_graph/knowledge_graph_agent');

// Initialize Context7 connector for AI-assisted explanations
const mcpConnector = new MCPConnector(mcpConfig);

// Initialize Knowledge Graph Agent for enhanced relationship analysis
let knowledgeGraphAgent = null;

/**
 * Initialize the conflict explanation module with dependencies
 * 
 * @param {Object} dependencies - Module dependencies
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize(dependencies = {}) {
  try {
    logger.info('Initializing conflict explanation module');
    
    // Use provided Knowledge Graph Agent or create a new one
    if (dependencies.knowledgeGraphAgent) {
      knowledgeGraphAgent = dependencies.knowledgeGraphAgent;
      logger.info('Using provided Knowledge Graph Agent');
    } else {
      knowledgeGraphAgent = new KnowledgeGraphAgent();
      await knowledgeGraphAgent.initialize();
      logger.info('Created new Knowledge Graph Agent');
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to initialize conflict explanation module: ${error.message}`);
    return false;
  }
}

/**
 * Generate a detailed explanation for a venue conflict
 * 
 * @param {object} conflict - Venue conflict to explain
 * @param {object} context - Additional context
 * @returns {Promise<object>} Detailed explanation
 */
async function explainVenueConflict(conflict, context = {}) {
  try {
    logger.info(`Generating explanation for venue conflict: ${conflict.id}`);
    
    if (conflict.type !== 'venue') {
      throw new Error('Not a venue conflict');
    }
    
    const events = conflict.events || [];
    const venue = conflict.venue;
    
    if (events.length < 2) {
      throw new Error('Insufficient event data for explanation');
    }
    
    // Format event information for readability
    const formattedEvents = events.map(event => {
      const teamsList = event.teams ? event.teams.join(' vs ') : 'Unknown teams';
      return `${event.date} at ${event.startTime} - ${teamsList}`;
    });
    
    // Use MCP for more detailed explanation
    const prompt = `
      Explain in clear, concise language why there is a venue conflict at ${venue}:
      
      Event 1: ${formattedEvents[0]}
      Event 2: ${formattedEvents[1]}
      
      The explanation should cover:
      1. Why this is a scheduling problem
      2. The specific constraint being violated
      3. The typical resolution approach
      
      Format the response as a JSON object with the following structure:
      {
        "explanation": "Clear explanation of the conflict",
        "businessImpact": "Brief description of business impact",
        "recommandedActions": ["Action 1", "Action 2"],
        "priority": "high/medium/low"
      }
    `;
    
    // Call the MCP server for explanation
    const response = await mcpConnector.sendRequest({
      agentId: 'conflict_explanation',
      taskType: 'venue_conflict_explanation',
      prompt,
      parameters: {
        temperature: 0.3,
        max_tokens: 800
      }
    });
    
    let explanationData;
    
    if (response.status === 'success' && response.content) {
      try {
        // Extract JSON from the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        explanationData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (parseError) {
        logger.error(`Failed to parse explanation: ${parseError.message}`);
        explanationData = null;
      }
    }
    
    // Default explanation if MCP fails
    if (!explanationData) {
      explanationData = {
        explanation: `Venue conflict at ${venue}: Multiple events are scheduled at the same venue with overlapping times. This creates a logistical impossibility as the venue cannot host both events simultaneously.`,
        businessImpact: "This conflict will require rescheduling one of the events, potentially leading to cascade effects on other scheduled events.",
        recommendedActions: [
          "Reschedule one of the events to a different time",
          `Consider moving one event to an alternate venue`
        ],
        priority: "high"
      };
    }
    
    // Prepare visualization data
    const visualizationData = {
      conflictType: 'venue',
      timeline: events.map(event => ({
        title: event.teams ? event.teams.join(' vs ') : 'Event',
        start: `${event.date}T${event.startTime}`,
        end: event.endTime ? `${event.date}T${event.endTime}` : null,
        venue: venue
      })),
      affectedResources: [venue]
    };
    
    return {
      success: true,
      conflictId: conflict.id,
      conflictType: conflict.type,
      explanation: explanationData.explanation,
      businessImpact: explanationData.businessImpact,
      recommendedActions: explanationData.recommendedActions,
      priority: explanationData.priority,
      visualizationData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Failed to explain venue conflict: ${error.message}`);
    return {
      success: false,
      error: error.message,
      conflictId: conflict?.id,
      conflictType: 'venue'
    };
  }
}

/**
 * Generate a detailed explanation for a team conflict
 * 
 * @param {object} conflict - Team conflict to explain
 * @param {object} context - Additional context
 * @returns {Promise<object>} Detailed explanation
 */
async function explainTeamConflict(conflict, context = {}) {
  try {
    logger.info(`Generating explanation for team conflict: ${conflict.id}`);
    
    if (conflict.type !== 'team') {
      throw new Error('Not a team conflict');
    }
    
    const events = conflict.events || [];
    const team = conflict.team;
    const subType = conflict.subType || 'schedule';
    
    if (events.length < 2) {
      throw new Error('Insufficient event data for explanation');
    }
    
    // Format event information for readability
    const formattedEvents = events.map(event => {
      const opponentTeam = event.teams.find(t => t !== team) || 'Unknown opponent';
      return `${event.date} at ${event.startTime} - ${team} vs ${opponentTeam} at ${event.venue}`;
    });
    
    // Use MCP for more detailed explanation
    const prompt = `
      Explain in clear, concise language why there is a ${subType} conflict for team ${team}:
      
      Event 1: ${formattedEvents[0]}
      Event 2: ${formattedEvents[1]}
      
      Additional context: ${
        subType === 'rest' 
          ? `The team does not have sufficient rest between these games. At least ${conflict.minimumRequired || '24'} hours of rest are needed.`
          : 'The team is scheduled for multiple events with a scheduling conflict.'
      }
      
      The explanation should cover:
      1. Why this is a problem for the team and their performance
      2. The specific constraint being violated
      3. How this impacts player welfare
      
      Format the response as a JSON object with the following structure:
      {
        "explanation": "Clear explanation of the conflict",
        "playerImpact": "Brief description of impact on players",
        "competitiveImpact": "Brief description of competitive impact",
        "recommandedActions": ["Action 1", "Action 2"],
        "priority": "high/medium/low"
      }
    `;
    
    // Call the MCP server for explanation
    const response = await mcpConnector.sendRequest({
      agentId: 'conflict_explanation',
      taskType: 'team_conflict_explanation',
      prompt,
      parameters: {
        temperature: 0.3,
        max_tokens: 800
      }
    });
    
    let explanationData;
    
    if (response.status === 'success' && response.content) {
      try {
        // Extract JSON from the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        explanationData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (parseError) {
        logger.error(`Failed to parse explanation: ${parseError.message}`);
        explanationData = null;
      }
    }
    
    // Default explanation if MCP fails
    if (!explanationData) {
      if (subType === 'rest') {
        explanationData = {
          explanation: `Rest period conflict for team ${team}: The team does not have sufficient recovery time between consecutive games. This violates the minimum rest requirement of ${conflict.minimumRequired || '24'} hours.`,
          playerImpact: "Insufficient rest increases injury risk and reduces performance quality.",
          competitiveImpact: "The team will be at a competitive disadvantage when playing without adequate rest.",
          recommendedActions: [
            "Reschedule one of the events to provide more recovery time",
            "Consider swapping with another team that has adequate rest"
          ],
          priority: "high"
        };
      } else {
        explanationData = {
          explanation: `Team scheduling conflict for ${team}: The team is scheduled for multiple events too close together, making it physically impossible to participate in both.`,
          playerImpact: "Players cannot be in two places at once, making this an impossible schedule.",
          competitiveImpact: "Would require the team to split into separate squads or forfeit one of the games.",
          recommendedActions: [
            "Reschedule one of the events",
            "Replace the team in one of the events"
          ],
          priority: "high"
        };
      }
    }
    
    // Prepare visualization data
    const visualizationData = {
      conflictType: 'team',
      subType,
      timeline: events.map(event => ({
        title: event.teams ? event.teams.join(' vs ') : 'Event',
        start: `${event.date}T${event.startTime}`,
        end: event.endTime ? `${event.date}T${event.endTime}` : null,
        venue: event.venue
      })),
      affectedResources: [team]
    };
    
    // For rest conflicts, add rest period visualization
    if (subType === 'rest') {
      const firstEventEnd = new Date(`${events[0].date}T${events[0].startTime}`);
      firstEventEnd.setHours(firstEventEnd.getHours() + 3); // Assuming 3 hour games
      
      const secondEventStart = new Date(`${events[1].date}T${events[1].startTime}`);
      
      visualizationData.restPeriod = {
        start: firstEventEnd.toISOString(),
        end: secondEventStart.toISOString(),
        availableHours: (secondEventStart - firstEventEnd) / (1000 * 60 * 60),
        requiredHours: conflict.minimumRequired || 24
      };
    }
    
    return {
      success: true,
      conflictId: conflict.id,
      conflictType: conflict.type,
      subType: conflict.subType,
      explanation: explanationData.explanation,
      playerImpact: explanationData.playerImpact,
      competitiveImpact: explanationData.competitiveImpact,
      recommendedActions: explanationData.recommendedActions,
      priority: explanationData.priority,
      visualizationData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Failed to explain team conflict: ${error.message}`);
    return {
      success: false,
      error: error.message,
      conflictId: conflict?.id,
      conflictType: 'team'
    };
  }
}

/**
 * Generate a detailed explanation for a travel conflict
 * 
 * @param {object} conflict - Travel conflict to explain
 * @param {object} context - Additional context
 * @returns {Promise<object>} Detailed explanation
 */
async function explainTravelConflict(conflict, context = {}) {
  try {
    logger.info(`Generating explanation for travel conflict: ${conflict.id}`);
    
    if (conflict.type !== 'travel') {
      throw new Error('Not a travel conflict');
    }
    
    const events = conflict.events || [];
    const team = conflict.team;
    
    if (events.length < 2) {
      throw new Error('Insufficient event data for explanation');
    }
    
    // Format travel information
    const sourceVenue = conflict.sourceVenue || events[0].venue;
    const destinationVenue = conflict.destinationVenue || events[1].venue;
    const travelHours = conflict.travelHours || 'unknown';
    const availableHours = conflict.availableHours || 'unknown';
    const requiredHours = conflict.requiredHours || 'unknown';
    
    // Use MCP for more detailed explanation
    const prompt = `
      Explain in clear, concise language why there is a travel conflict for team ${team}:
      
      Event 1: ${events[0].date} at ${events[0].startTime} - at ${sourceVenue}
      Event 2: ${events[1].date} at ${events[1].startTime} - at ${destinationVenue}
      
      Travel time needed: ${travelHours} hours
      Time available: ${availableHours} hours
      Time required (including rest): ${requiredHours} hours
      
      The explanation should cover:
      1. Why this is a logistical problem
      2. The impact on team performance
      3. Safety considerations
      
      Format the response as a JSON object with the following structure:
      {
        "explanation": "Clear explanation of the conflict",
        "logisticalImpact": "Brief description of logistical challenges",
        "performanceImpact": "Brief description of impact on performance",
        "recommandedActions": ["Action 1", "Action 2"],
        "priority": "high/medium/low"
      }
    `;
    
    // Call the MCP server for explanation
    const response = await mcpConnector.sendRequest({
      agentId: 'conflict_explanation',
      taskType: 'travel_conflict_explanation',
      prompt,
      parameters: {
        temperature: 0.3,
        max_tokens: 800
      }
    });
    
    let explanationData;
    
    if (response.status === 'success' && response.content) {
      try {
        // Extract JSON from the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        explanationData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (parseError) {
        logger.error(`Failed to parse explanation: ${parseError.message}`);
        explanationData = null;
      }
    }
    
    // Default explanation if MCP fails
    if (!explanationData) {
      explanationData = {
        explanation: `Travel conflict for team ${team}: Insufficient time to travel between venues. The team needs ${requiredHours} hours (including travel and rest time) but only has ${availableHours} hours available.`,
        logisticalImpact: "The team cannot physically reach the second venue in time for the scheduled game.",
        performanceImpact: "Even if travel were possible, the team would be fatigued and unprepared for competition.",
        recommendedActions: [
          "Reschedule one of the events to provide more travel time",
          "Look for an alternate venue closer to the previous location"
        ],
        priority: "high"
      };
    }
    
    // Prepare visualization data
    const visualizationData = {
      conflictType: 'travel',
      timeline: events.map(event => ({
        title: event.teams ? event.teams.join(' vs ') : 'Event',
        start: `${event.date}T${event.startTime}`,
        end: event.endTime ? `${event.date}T${event.endTime}` : null,
        venue: event.venue
      })),
      travel: {
        team,
        sourceVenue,
        destinationVenue,
        travelHours,
        availableHours,
        requiredHours
      },
      affectedResources: [team, sourceVenue, destinationVenue]
    };
    
    return {
      success: true,
      conflictId: conflict.id,
      conflictType: conflict.type,
      explanation: explanationData.explanation,
      logisticalImpact: explanationData.logisticalImpact,
      performanceImpact: explanationData.performanceImpact,
      recommendedActions: explanationData.recommendedActions,
      priority: explanationData.priority,
      visualizationData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Failed to explain travel conflict: ${error.message}`);
    return {
      success: false,
      error: error.message,
      conflictId: conflict?.id,
      conflictType: 'travel'
    };
  }
}

/**
 * Generate a detailed explanation for a resource conflict
 * 
 * @param {object} conflict - Resource conflict to explain
 * @param {object} context - Additional context
 * @returns {Promise<object>} Detailed explanation
 */
async function explainResourceConflict(conflict, context = {}) {
  try {
    logger.info(`Generating explanation for resource conflict: ${conflict.id}`);
    
    if (conflict.type !== 'resource') {
      throw new Error('Not a resource conflict');
    }
    
    const resourceId = conflict.resourceId;
    const resourceName = conflict.resourceName || resourceId;
    const subType = conflict.subType || 'general';
    
    let explanationData;
    
    // Handle different subtypes of resource conflicts
    if (subType === 'missing') {
      // Missing resource
      explanationData = {
        explanation: `Missing resource conflict: The required resource "${resourceName}" does not exist in the system but is needed for the event.`,
        operationalImpact: "The event cannot proceed without this essential resource.",
        recommendedActions: [
          "Add the resource to the system",
          "Remove the resource requirement from the event"
        ],
        priority: "high"
      };
    } else if (subType === 'overbooked') {
      // Overbooked resource
      const availableQuantity = conflict.availableQuantity || 1;
      const requiredQuantity = conflict.requiredQuantity || 2;
      
      explanationData = {
        explanation: `Resource overbooking conflict: The resource "${resourceName}" is needed for multiple events simultaneously. Available quantity: ${availableQuantity}, Required: ${requiredQuantity}.`,
        operationalImpact: "Some events will not have access to the required resources.",
        recommendedActions: [
          "Reschedule one of the events",
          "Increase resource quantity if possible",
          "Find alternative resource"
        ],
        priority: "medium"
      };
    } else {
      // Generic resource conflict
      explanationData = {
        explanation: `Resource conflict with "${resourceName}": The resource is not available as required for the scheduled event.`,
        operationalImpact: "Event operations may be compromised without this resource.",
        recommendedActions: [
          "Reschedule the event",
          "Find an alternative resource"
        ],
        priority: "medium"
      };
    }
    
    // Prepare visualization data based on conflict subtype
    let visualizationData;
    
    if (subType === 'overbooked' && conflict.conflictingEvents) {
      visualizationData = {
        conflictType: 'resource',
        subType,
        resource: {
          id: resourceId,
          name: resourceName,
          available: conflict.availableQuantity,
          required: conflict.requiredQuantity
        },
        timeline: [
          ...(conflict.event ? [{ 
            title: `Event (Needs ${resourceName})`,
            start: `${conflict.event.date}T${conflict.event.startTime}`,
            venue: conflict.event.venue
          }] : []),
          ...(conflict.conflictingEvents || []).map(event => ({
            title: `Conflicting Event (Using ${resourceName})`,
            start: `${event.date}T${event.startTime}`,
            venue: event.venue
          }))
        ],
        affectedResources: [resourceName]
      };
    } else {
      visualizationData = {
        conflictType: 'resource',
        subType,
        resource: {
          id: resourceId,
          name: resourceName
        },
        affectedResources: [resourceName]
      };
      
      if (conflict.event) {
        visualizationData.timeline = [{
          title: `Event (Needs ${resourceName})`,
          start: `${conflict.event.date}T${conflict.event.startTime}`,
          venue: conflict.event.venue
        }];
      }
    }
    
    return {
      success: true,
      conflictId: conflict.id,
      conflictType: conflict.type,
      subType,
      explanation: explanationData.explanation,
      operationalImpact: explanationData.operationalImpact,
      recommendedActions: explanationData.recommendedActions,
      priority: explanationData.priority,
      visualizationData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Failed to explain resource conflict: ${error.message}`);
    return {
      success: false,
      error: error.message,
      conflictId: conflict?.id,
      conflictType: 'resource'
    };
  }
}

/**
 * Generate a comprehensive explanation for any type of conflict
 * 
 * @param {object} conflict - Conflict to explain
 * @param {object} context - Additional context information
 * @returns {Promise<object>} Detailed explanation with visualization data
 */
async function explainConflict(conflict, context = {}) {
  try {
    if (!conflict || !conflict.type) {
      throw new Error('Invalid conflict object');
    }
    
    // Initialize Knowledge Graph Agent if not already initialized
    if (!knowledgeGraphAgent) {
      await initialize();
    }
    
    // Enhance the conflict data with knowledge graph insights if available
    if (knowledgeGraphAgent && knowledgeGraphAgent.config.enabled) {
      try {
        // Query the knowledge graph for related entities and relationships
        const graphInsights = await knowledgeGraphAgent.analyzeRelationships({
          entityType: conflict.type,
          entityId: conflict.id || conflict.venue || conflict.team,
          relationshipTypes: null,
          maxDepth: 2
        });
        
        // Merge insights into context
        context.graphInsights = graphInsights;
        
        // Add additional context from the knowledge graph
        if (conflict.schedule && conflict.schedule.id) {
          context.scheduleInsights = await knowledgeGraphAgent.generateScheduleInsights(
            conflict.schedule.id,
            { includeConflicts: true }
          );
        }
      } catch (error) {
        logger.warn(`Knowledge graph enhancement failed: ${error.message}`);
        // Continue without graph insights
      }
    }
    
    // Route to the appropriate explanation function based on conflict type
    switch (conflict.type) {
      case 'venue':
        return await explainVenueConflict(conflict, context);
      
      case 'team':
        return await explainTeamConflict(conflict, context);
      
      case 'travel':
        return await explainTravelConflict(conflict, context);
      
      case 'resource':
        return await explainResourceConflict(conflict, context);
      
      case 'rest':
        // Rest conflicts are handled as a subtype of team conflicts
        return await explainTeamConflict({...conflict, type: 'team', subType: 'rest'}, context);
      
      default:
        throw new Error(`Unsupported conflict type: ${conflict.type}`);
    }
  } catch (error) {
    logger.error(`Failed to explain conflict: ${error.message}`);
    return {
      success: false,
      error: error.message,
      conflictId: conflict?.id,
      conflictType: conflict?.type || 'unknown'
    };
  }
}

/**
 * Shutdown the conflict explanation module
 * 
 * @returns {Promise<boolean>} Whether shutdown was successful
 */
async function shutdown() {
  try {
    logger.info('Shutting down conflict explanation module');
    
    // Shutdown Knowledge Graph Agent if we created it
    if (knowledgeGraphAgent) {
      await knowledgeGraphAgent.shutdown();
      knowledgeGraphAgent = null;
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to shutdown conflict explanation module: ${error.message}`);
    return false;
  }
}

module.exports = {
  initialize,
  explainConflict,
  explainVenueConflict,
  explainTeamConflict,
  explainTravelConflict,
  explainResourceConflict,
  shutdown
};
