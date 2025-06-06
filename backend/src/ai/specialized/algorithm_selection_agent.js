/**
 * Algorithm Selection Agent for the FlexTime multi-agent system.
 * 
 * This specialized agent is responsible for selecting the most appropriate
 * scheduling algorithm based on sport requirements and constraints.
 */

const Agent = require('../agent');
const logger = require('../scripts/logger");

/**
 * Specialized agent for selecting scheduling algorithms.
 */
class AlgorithmSelectionAgent extends Agent {
  /**
   * Initialize a new Algorithm Selection Agent.
   * 
   * @param {object} mcpConnector - MCP server connector
   */
  constructor(mcpConnector) {
    super('algorithm_selection', 'specialized', mcpConnector);
    
    // Algorithm catalog with metadata
    this.algorithmCatalog = {
      'round_robin': {
        description: 'Classic round-robin tournament scheduling',
        suitableFor: ['balanced_home_away', 'complete_tournament'],
        constraints: ['equal_games_against_all_opponents'],
        complexity: 'low'
      },
      'traveling_tournament': {
        description: 'Minimizes travel distance across the schedule',
        suitableFor: ['travel_optimization', 'multi_venue'],
        constraints: ['travel_distance', 'consecutive_away_games'],
        complexity: 'high'
      },
      'constrained_scheduling': {
        description: 'Handles complex constraints with constraint programming',
        suitableFor: ['complex_constraints', 'venue_limitations'],
        constraints: ['venue_availability', 'broadcast_requirements', 'rivalry_games'],
        complexity: 'high'
      },
      'genetic_algorithm': {
        description: 'Evolutionary approach for multi-objective optimization',
        suitableFor: ['multi_objective', 'complex_patterns'],
        constraints: ['balanced_travel', 'competitive_balance', 'rest_time'],
        complexity: 'medium'
      },
      'simulated_annealing': {
        description: 'Probabilistic technique for approximating global optimum',
        suitableFor: ['large_leagues', 'complex_constraints'],
        constraints: ['travel_distance', 'balanced_schedule', 'venue_preferences'],
        complexity: 'medium'
      },
      'partial_round_robin': {
        description: 'Modified round-robin for unbalanced schedules',
        suitableFor: ['divisional_play', 'unbalanced_schedules'],
        constraints: ['divisional_opponents', 'non_divisional_opponents'],
        complexity: 'low'
      }
    };
    
    logger.info('Algorithm Selection Agent initialized');
  }
  
  /**
   * Process a task to select an appropriate algorithm.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<object>} Selected algorithm and rationale
   * @private
   */
  async _processTask(task) {
    logger.info(`Algorithm Selection Agent processing task: ${task.description}`);
    
    const sportType = task.parameters.sportType;
    const constraints = task.parameters.constraints || [];
    const preferences = task.parameters.preferences || {};
    
    // Use MCP to enhance algorithm selection if available
    if (this.mcpConnector) {
      try {
        const enhancedSelection = await this._getAIEnhancedSelection(sportType, constraints, preferences);
        return enhancedSelection;
      } catch (error) {
        logger.warning(`Failed to get AI-enhanced algorithm selection: ${error.message}`);
        // Fall back to rule-based selection
      }
    }
    
    // Rule-based algorithm selection
    const selectedAlgorithm = this._selectAlgorithmByRules(sportType, constraints, preferences);
    
    return {
      selectedAlgorithm: selectedAlgorithm.name,
      rationale: selectedAlgorithm.rationale,
      configuration: selectedAlgorithm.configuration
    };
  }
  
  /**
   * Select an algorithm using rule-based approach.
   * 
   * @param {string} sportType - Type of sport
   * @param {Array<string>} constraints - List of constraints
   * @param {object} preferences - User preferences
   * @returns {object} Selected algorithm with rationale
   * @private
   */
  _selectAlgorithmByRules(sportType, constraints, preferences) {
    // Check if travel optimization is a high priority
    const travelPriority = constraints.includes('minimize_travel') || 
                          preferences.travelOptimization === 'high';
    
    // Check if there are complex constraints
    const hasComplexConstraints = constraints.length > 3 || 
                                 constraints.includes('broadcast_requirements') ||
                                 constraints.includes('venue_limitations');
    
    // Check if this is a large league
    const isLargeLeague = preferences.leagueSize === 'large' || 
                         (preferences.teamCount && preferences.teamCount > 12);
    
    // Check if divisional play is required
    const hasDivisionalPlay = constraints.includes('divisional_play') ||
                             preferences.divisionalStructure === true;
    
    // Check if schedule is unbalanced (not all teams play each other equally)
    const isUnbalancedSchedule = constraints.includes('unbalanced_schedule') ||
                                preferences.balancedSchedule === false;
    
    // Decision logic for algorithm selection
    if (travelPriority && hasComplexConstraints) {
      return {
        name: 'traveling_tournament',
        rationale: 'Selected due to high priority on travel optimization with complex constraints.',
        configuration: {
          objectiveWeights: {
            travelDistance: 0.7,
            constraintViolations: 0.3
          },
          maxIterations: 10000,
          coolingRate: 0.003
        }
      };
    } else if (hasComplexConstraints && !travelPriority) {
      return {
        name: 'constrained_scheduling',
        rationale: 'Selected to handle the complex set of constraints with constraint programming approach.',
        configuration: {
          solverType: 'CBC',
          timeLimit: 300, // seconds
          constraintPriorities: {
            hard: ['venue_availability', 'team_availability'],
            soft: ['preferred_matchups', 'rest_days']
          }
        }
      };
    } else if (isLargeLeague && (travelPriority || hasComplexConstraints)) {
      return {
        name: 'simulated_annealing',
        rationale: 'Selected for large league with travel considerations or moderate constraints.',
        configuration: {
          initialTemperature: 1000,
          coolingRate: 0.003,
          neighborhoodSize: 20,
          maxIterations: 50000
        }
      };
    } else if (hasDivisionalPlay || isUnbalancedSchedule) {
      return {
        name: 'partial_round_robin',
        rationale: 'Selected for divisional play structure or unbalanced schedule requirements.',
        configuration: {
          divisionalGames: preferences.divisionalGames || 2,
          nonDivisionalGames: preferences.nonDivisionalGames || 1,
          balancingMethod: 'strength_of_schedule'
        }
      };
    } else if (constraints.includes('multi_objective')) {
      return {
        name: 'genetic_algorithm',
        rationale: 'Selected for balancing multiple competing objectives in the schedule.',
        configuration: {
          populationSize: 100,
          generations: 500,
          mutationRate: 0.1,
          crossoverRate: 0.8,
          objectiveWeights: {
            travelDistance: 0.4,
            competitiveBalance: 0.3,
            venueUtilization: 0.3
          }
        }
      };
    } else {
      // Default to round robin for simpler cases
      return {
        name: 'round_robin',
        rationale: 'Selected as the default balanced scheduling approach for simpler requirements.',
        configuration: {
          variant: preferences.balanced ? 'balanced' : 'standard',
          homeAwayPattern: preferences.homeAwayPattern || 'alternating',
          breakMinimization: true
        }
      };
    }
  }
  
  /**
   * Get AI-enhanced algorithm selection using MCP.
   * 
   * @param {string} sportType - Type of sport
   * @param {Array<string>} constraints - List of constraints
   * @param {object} preferences - User preferences
   * @returns {Promise<object>} AI-enhanced algorithm selection
   * @private
   */
  async _getAIEnhancedSelection(sportType, constraints, preferences) {
    // Prepare context for the AI model
    const context = {
      sportType,
      constraints,
      preferences,
      availableAlgorithms: this.algorithmCatalog
    };
    
    // Prepare prompt for the AI model
    const prompt = `
      As an expert in sports scheduling algorithms, analyze the following scheduling scenario:
      
      Sport: ${sportType}
      Constraints: ${JSON.stringify(constraints)}
      Preferences: ${JSON.stringify(preferences)}
      
      Based on this information, select the most appropriate scheduling algorithm from the available options.
      Provide a detailed rationale for your selection and suggest specific configuration parameters.
      
      Return your response in JSON format with the following structure:
      {
        "selectedAlgorithm": "algorithm_name",
        "rationale": "detailed explanation",
        "configuration": {
          // Specific configuration parameters
        }
      }
    `;
    
    // Generate cache key
    const cacheKey = `algo_selection_${sportType}_${JSON.stringify(constraints)}_${JSON.stringify(preferences)}`;
    
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
      
      // Validate that the selected algorithm exists in our catalog
      if (!this.algorithmCatalog[result.selectedAlgorithm]) {
        throw new Error(`Selected algorithm '${result.selectedAlgorithm}' is not in the catalog`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to parse AI response: ${error.message}`);
      // Fall back to rule-based selection
      return this._selectAlgorithmByRules(sportType, constraints, preferences);
    }
  }
}

module.exports = AlgorithmSelectionAgent;
