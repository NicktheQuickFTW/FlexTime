/**
 * Resource Allocation Agent for the FlexTime multi-agent system.
 * 
 * This specialized agent is responsible for allocating resources
 * for championship events, including staff, equipment, and services.
 */

const Agent = require('../agent');
const logger = require("../utils/logger");

/**
 * Specialized agent for resource allocation.
 */
class ResourceAllocationAgent extends Agent {
  /**
   * Initialize a new Resource Allocation Agent.
   * 
   * @param {object} mcpConnector - MCP server connector
   */
  constructor(mcpConnector) {
    super('resource_allocation', 'specialized', mcpConnector);
    
    // Resource categories
    this.resourceCategories = {
      'staff': {
        description: 'Personnel required for event operations',
        types: ['officials', 'medical', 'security', 'media', 'operations']
      },
      'equipment': {
        description: 'Physical equipment needed for events',
        types: ['sport_specific', 'broadcast', 'scoring', 'medical', 'general']
      },
      'services': {
        description: 'Services required for event operations',
        types: ['transportation', 'catering', 'accommodation', 'technical', 'cleaning']
      },
      'facilities': {
        description: 'Facility areas and spaces needed',
        types: ['competition', 'warmup', 'media', 'vip', 'spectator', 'operations']
      }
    };
    
    // Sport-specific resource requirements
    this.sportRequirements = {
      'football': {
        staff: {
          officials: 7,
          medical: 8,
          security: 20,
          media: 10,
          operations: 15
        },
        equipment: {
          sport_specific: ['goal posts', 'yard markers', 'down indicators', 'field equipment'],
          broadcast: ['cameras', 'replay equipment', 'commentary positions'],
          scoring: ['scoreboard', 'play clocks', 'statistics systems']
        },
        services: {
          transportation: ['team buses', 'official transportation'],
          catering: ['team meals', 'media catering', 'vip hospitality']
        },
        facilities: {
          competition: ['field', 'sidelines', 'replay booth'],
          warmup: ['locker rooms', 'practice field'],
          media: ['press box', 'interview room', 'media workroom']
        }
      },
      'basketball': {
        staff: {
          officials: 3,
          medical: 4,
          security: 10,
          media: 8,
          operations: 12
        },
        equipment: {
          sport_specific: ['baskets', 'shot clocks', 'game balls', 'floor mops'],
          broadcast: ['cameras', 'replay equipment', 'commentary positions'],
          scoring: ['scoreboard', 'statistics systems', 'replay monitors']
        },
        services: {
          transportation: ['team buses', 'official transportation'],
          catering: ['team meals', 'media catering', 'vip hospitality']
        },
        facilities: {
          competition: ['court', 'team benches', 'scorer\'s table'],
          warmup: ['locker rooms', 'practice court'],
          media: ['press row', 'interview room', 'media workroom']
        }
      },
      // Additional sport requirements would be defined here
    };
    
    logger.info('Resource Allocation Agent initialized');
  }
  
  /**
   * Process a task related to resource allocation.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<object>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Resource Allocation Agent processing task: ${task.description}`);
    
    const taskType = task.taskType;
    const sportType = task.parameters.sportType;
    const schedule = task.parameters.schedule;
    const venues = task.parameters.venues || [];
    const resources = task.parameters.resources || {};
    const constraints = task.parameters.constraints || {};
    
    // Use MCP for resource planning if available
    if (taskType === 'plan_resources' && this.mcpConnector) {
      try {
        const resourcePlan = await this._getAIResourcePlan(
          sportType, schedule, venues, resources, constraints
        );
        return resourcePlan;
      } catch (error) {
        logger.warning(`Failed to get AI resource plan: ${error.message}`);
        // Fall back to rule-based planning
      }
    }
    
    // Handle different task types
    switch (taskType) {
      case 'allocate_resources':
        return this._allocateResources(sportType, schedule, venues, resources, constraints);
      
      case 'estimate_requirements':
        return this._estimateResourceRequirements(sportType, schedule, venues);
      
      case 'optimize_allocation':
        return this._optimizeResourceAllocation(sportType, schedule, venues, resources, constraints);
      
      case 'check_availability':
        return this._checkResourceAvailability(resources, task.parameters.dateRange);
      
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }
  
  /**
   * Allocate resources to events in a schedule.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} schedule - Schedule to allocate resources to
   * @param {Array<object>} venues - List of venues
   * @param {object} resources - Available resources
   * @param {object} constraints - Resource allocation constraints
   * @returns {object} Schedule with allocated resources
   * @private
   */
  _allocateResources(sportType, schedule, venues, resources, constraints) {
    // Estimate resource requirements first
    const requirements = this._estimateResourceRequirements(sportType, schedule, venues);
    
    // Create a deep copy of the schedule
    const updatedSchedule = JSON.parse(JSON.stringify(schedule));
    
    // Allocate resources to each game
    updatedSchedule.rounds.forEach(round => {
      round.games.forEach(game => {
        // Get venue for this game
        const venueId = game.venue?.id;
        const venue = venues.find(v => v.id === venueId);
        
        // Allocate resources based on requirements and availability
        game.resources = this._allocateGameResources(
          sportType, game, venue, resources, requirements, constraints
        );
      });
    });
    
    // Calculate resource utilization
    const resourceUtilization = this._calculateResourceUtilization(updatedSchedule, resources);
    
    return {
      sport: sportType,
      originalSchedule: schedule,
      updatedSchedule,
      resourceUtilization,
      metadata: {
        generatedAt: new Date().toISOString(),
        constraintsApplied: Object.keys(constraints)
      }
    };
  }
  
  /**
   * Estimate resource requirements for a schedule.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} schedule - Schedule to estimate for
   * @param {Array<object>} venues - List of venues
   * @returns {object} Resource requirements
   * @private
   */
  _estimateResourceRequirements(sportType, schedule, venues) {
    // Get sport-specific requirements
    const sportReqs = this.sportRequirements[sportType.toLowerCase()] || {
      staff: {
        officials: 3,
        medical: 2,
        security: 5,
        operations: 5
      },
      equipment: {
        sport_specific: ['basic equipment'],
        scoring: ['scoreboard']
      }
    };
    
    // Count games per day
    const gamesByDate = {};
    
    schedule.rounds.forEach(round => {
      round.games.forEach(game => {
        const date = game.date;
        if (!gamesByDate[date]) {
          gamesByDate[date] = [];
        }
        gamesByDate[date].push(game);
      });
    });
    
    // Calculate peak requirements (maximum resources needed on any single day)
    const peakRequirements = {
      staff: {},
      equipment: {},
      services: {},
      facilities: {}
    };
    
    // Calculate total requirements across the entire schedule
    const totalRequirements = {
      staff: {},
      equipment: {},
      services: {},
      facilities: {}
    };
    
    // Initialize with zeros
    Object.keys(sportReqs.staff || {}).forEach(staffType => {
      peakRequirements.staff[staffType] = 0;
      totalRequirements.staff[staffType] = 0;
    });
    
    // Calculate requirements for each day
    Object.entries(gamesByDate).forEach(([date, games]) => {
      const dailyRequirements = {
        staff: {}
      };
      
      // Initialize daily requirements
      Object.keys(sportReqs.staff || {}).forEach(staffType => {
        dailyRequirements.staff[staffType] = 0;
      });
      
      // Sum requirements for all games on this day
      games.forEach(game => {
        Object.entries(sportReqs.staff || {}).forEach(([staffType, count]) => {
          dailyRequirements.staff[staffType] += count;
        });
      });
      
      // Update peak requirements
      Object.entries(dailyRequirements.staff).forEach(([staffType, count]) => {
        peakRequirements.staff[staffType] = Math.max(
          peakRequirements.staff[staffType],
          count
        );
        
        totalRequirements.staff[staffType] += count;
      });
    });
    
    // Equipment, services, and facilities requirements
    ['equipment', 'services', 'facilities'].forEach(category => {
      if (sportReqs[category]) {
        Object.entries(sportReqs[category]).forEach(([type, items]) => {
          if (Array.isArray(items)) {
            peakRequirements[category][type] = items;
            totalRequirements[category][type] = items;
          }
        });
      }
    });
    
    return {
      sport: sportType,
      peakRequirements,
      totalRequirements,
      dailyRequirements: Object.entries(gamesByDate).map(([date, games]) => ({
        date,
        gameCount: games.length,
        requirements: this._calculateDailyRequirements(sportType, games.length)
      })),
      metadata: {
        totalGames: schedule.rounds.reduce((sum, round) => sum + round.games.length, 0),
        totalDays: Object.keys(gamesByDate).length,
        sportRequirements: sportReqs
      }
    };
  }
  
  /**
   * Optimize resource allocation to minimize costs and maximize efficiency.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} schedule - Schedule to optimize
   * @param {Array<object>} venues - List of venues
   * @param {object} resources - Available resources
   * @param {object} constraints - Resource allocation constraints
   * @returns {object} Optimized resource allocation
   * @private
   */
  _optimizeResourceAllocation(sportType, schedule, venues, resources, constraints) {
    // First allocate resources normally
    const allocation = this._allocateResources(sportType, schedule, venues, resources, constraints);
    
    // Then optimize the allocation
    const optimizedSchedule = JSON.parse(JSON.stringify(allocation.updatedSchedule));
    
    // Apply optimization strategies
    this._applyResourceSharing(optimizedSchedule, resources);
    this._minimizeResourceMovement(optimizedSchedule, venues);
    this._balanceWorkloads(optimizedSchedule, resources);
    
    // Calculate savings
    const originalCost = this._estimateResourceCost(allocation.updatedSchedule, resources);
    const optimizedCost = this._estimateResourceCost(optimizedSchedule, resources);
    
    return {
      sport: sportType,
      originalSchedule: schedule,
      optimizedSchedule,
      costSavings: {
        original: originalCost,
        optimized: optimizedCost,
        savings: originalCost - optimizedCost,
        percentageSavings: ((originalCost - optimizedCost) / originalCost * 100).toFixed(2)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        optimizationStrategies: ['resource_sharing', 'minimize_movement', 'balance_workloads'],
        constraintsApplied: Object.keys(constraints)
      }
    };
  }
  
  /**
   * Check availability of resources for a date range.
   * 
   * @param {object} resources - Resources to check
   * @param {object} dateRange - Date range to check
   * @returns {object} Resource availability results
   * @private
   */
  _checkResourceAvailability(resources, dateRange) {
    // In a real implementation, this would query a database or external system
    // This is a placeholder implementation
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    const availabilityResults = {};
    
    // Check each resource category
    Object.entries(resources).forEach(([category, items]) => {
      availabilityResults[category] = {};
      
      Object.entries(items).forEach(([type, count]) => {
        // Generate some random availability data
        const unavailableDates = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          // 15% chance a resource is partially unavailable
          if (Math.random() < 0.15) {
            const availableCount = Math.floor(count * 0.7); // 70% available
            unavailableDates.push({
              date: new Date(currentDate).toISOString().split('T')[0],
              availableCount,
              shortfall: count - availableCount
            });
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        availabilityResults[category][type] = {
          totalCount: count,
          unavailableDates,
          fullyAvailable: unavailableDates.length === 0,
          availabilityPercentage: 100 - (unavailableDates.length / ((endDate - startDate) / (24 * 60 * 60 * 1000) + 1) * 100)
        };
      });
    });
    
    return {
      dateRange: {
        start: dateRange.start,
        end: dateRange.end
      },
      availabilityResults,
      summary: {
        fullyAvailableResources: Object.entries(availabilityResults).reduce((acc, [category, types]) => {
          acc[category] = Object.entries(types).filter(([type, data]) => data.fullyAvailable).map(([type]) => type);
          return acc;
        }, {})
      }
    };
  }
  
  /**
   * Get AI-enhanced resource plan using MCP.
   * 
   * @param {string} sportType - Type of sport
   * @param {object} schedule - Schedule to plan for
   * @param {Array<object>} venues - List of venues
   * @param {object} resources - Available resources
   * @param {object} constraints - Resource constraints
   * @returns {Promise<object>} AI-enhanced resource plan
   * @private
   */
  async _getAIResourcePlan(sportType, schedule, venues, resources, constraints) {
    // Prepare context for the AI model
    const context = {
      sportType,
      schedule,
      venues,
      resources,
      constraints,
      resourceCategories: this.resourceCategories,
      sportRequirements: this.sportRequirements
    };
    
    // Prepare prompt for the AI model
    const prompt = `
      As an expert in sports event resource planning, create a comprehensive resource plan for:
      
      Sport: ${sportType}
      Schedule: ${schedule.rounds.length} rounds, ${schedule.rounds.reduce((sum, round) => sum + round.games.length, 0)} games
      
      Based on your expertise and the provided information:
      1. Identify all required resources for each game
      2. Create an efficient allocation plan that minimizes costs
      3. Identify potential resource conflicts and provide solutions
      4. Suggest optimization strategies for resource utilization
      
      Return your response in JSON format with the following structure:
      {
        "resourcePlan": {
          "staffing": {
            "requirements": { "officials": 5, "medical": 4, ... },
            "allocation": [
              { "date": "2025-09-01", "games": 3, "officials": 15, ... }
            ]
          },
          "equipment": {
            "requirements": { ... },
            "allocation": [ ... ]
          },
          "services": { ... },
          "facilities": { ... }
        },
        "optimizationStrategies": [
          { "strategy": "resource_sharing", "description": "...", "estimatedSavings": "..." }
        ],
        "potentialConflicts": [
          { "date": "2025-09-15", "resource": "officials", "description": "..." }
        ]
      }
    `;
    
    // Generate cache key - don't cache this as each plan should be unique
    const cacheKey = null;
    
    // Send request to MCP server
    const response = await this.mcpConnector.sendRequest(
      'gpt-4',  // Or other appropriate model
      prompt,
      context,
      cacheKey
    );
    
    // Parse and validate response
    try {
      const result = typeof response.content === 'string' 
        ? JSON.parse(response.content) 
        : response.content;
      
      return {
        sport: sportType,
        aiResourcePlan: result,
        metadata: {
          generatedAt: new Date().toISOString(),
          constraintsApplied: Object.keys(constraints)
        }
      };
    } catch (error) {
      logger.error(`Failed to parse AI response: ${error.message}`);
      // Fall back to rule-based planning
      return this._allocateResources(sportType, schedule, venues, resources, constraints);
    }
  }
  
  // Helper methods
  
  _allocateGameResources(sportType, game, venue, resources, requirements, constraints) {
    // Get sport-specific requirements
    const sportReqs = this.sportRequirements[sportType.toLowerCase()] || {
      staff: {
        officials: 3,
        medical: 2,
        security: 5,
        operations: 5
      }
    };
    
    // Allocate staff
    const staffAllocation = {};
    Object.entries(sportReqs.staff || {}).forEach(([staffType, count]) => {
      staffAllocation[staffType] = count;
    });
    
    // Allocate equipment
    const equipmentAllocation = {};
    Object.entries(sportReqs.equipment || {}).forEach(([equipType, items]) => {
      if (Array.isArray(items)) {
        equipmentAllocation[equipType] = [...items];
      }
    });
    
    // Allocate services
    const servicesAllocation = {};
    Object.entries(sportReqs.services || {}).forEach(([serviceType, items]) => {
      if (Array.isArray(items)) {
        servicesAllocation[serviceType] = [...items];
      }
    });
    
    // Allocate facilities
    const facilitiesAllocation = {};
    Object.entries(sportReqs.facilities || {}).forEach(([facilityType, items]) => {
      if (Array.isArray(items)) {
        facilitiesAllocation[facilityType] = [...items];
      }
    });
    
    return {
      staff: staffAllocation,
      equipment: equipmentAllocation,
      services: servicesAllocation,
      facilities: facilitiesAllocation
    };
  }
  
  _calculateResourceUtilization(schedule, resources) {
    // This is a placeholder implementation
    const utilization = {
      staff: {},
      equipment: {},
      services: {},
      facilities: {}
    };
    
    // Initialize with zeros
    Object.entries(resources).forEach(([category, types]) => {
      Object.keys(types).forEach(type => {
        utilization[category][type] = {
          total: resources[category][type],
          used: 0,
          utilizationRate: 0
        };
      });
    });
    
    // Count resources used in schedule
    schedule.rounds.forEach(round => {
      round.games.forEach(game => {
        if (game.resources) {
          Object.entries(game.resources).forEach(([category, types]) => {
            Object.entries(types).forEach(([type, count]) => {
              if (utilization[category][type]) {
                if (typeof count === 'number') {
                  utilization[category][type].used += count;
                } else if (Array.isArray(count)) {
                  utilization[category][type].used += 1; // Count as one usage
                }
              }
            });
          });
        }
      });
    });
    
    // Calculate utilization rates
    Object.entries(utilization).forEach(([category, types]) => {
      Object.entries(types).forEach(([type, data]) => {
        if (data.total > 0) {
          data.utilizationRate = (data.used / data.total * 100).toFixed(2);
        }
      });
    });
    
    return utilization;
  }
  
  _calculateDailyRequirements(sportType, gameCount) {
    // Get sport-specific requirements
    const sportReqs = this.sportRequirements[sportType.toLowerCase()] || {
      staff: {
        officials: 3,
        medical: 2,
        security: 5,
        operations: 5
      }
    };
    
    const dailyReqs = {
      staff: {}
    };
    
    // Calculate staff requirements
    Object.entries(sportReqs.staff || {}).forEach(([staffType, count]) => {
      // Some staff can be shared between games
      const sharingFactor = this._getStaffSharingFactor(staffType);
      dailyReqs.staff[staffType] = Math.ceil(count * gameCount * sharingFactor);
    });
    
    return dailyReqs;
  }
  
  _getStaffSharingFactor(staffType) {
    // Different staff types have different sharing capabilities
    switch (staffType) {
      case 'officials':
        return 1.0; // Cannot be shared between games
      case 'medical':
        return 0.7; // Some sharing possible
      case 'security':
        return 0.6; // More sharing possible
      case 'operations':
        return 0.5; // Significant sharing possible
      default:
        return 0.8;
    }
  }
  
  _applyResourceSharing(schedule, resources) {
    // Placeholder for resource sharing optimization
    // In a real implementation, this would identify resources that can be shared
    // between games on the same day at the same venue
  }
  
  _minimizeResourceMovement(schedule, venues) {
    // Placeholder for minimizing resource movement
    // In a real implementation, this would optimize to keep resources at the same
    // venue for consecutive days when possible
  }
  
  _balanceWorkloads(schedule, resources) {
    // Placeholder for workload balancing
    // In a real implementation, this would ensure staff workloads are balanced
  }
  
  _estimateResourceCost(schedule, resources) {
    // Placeholder for cost estimation
    // In a real implementation, this would calculate the cost based on resource usage
    return 100000 + Math.floor(Math.random() * 20000);
  }
}

module.exports = ResourceAllocationAgent;
