/**
 * Soccer RAG Agent
 * 
 * Specialized RAG agent for soccer data and insights.
 */

const BaseSportRagAgent = require('./base_sport_rag_agent');
const logger = require("../../lib/logger");;
const path = require('path');
const axios = require('axios');
const fs = require('fs').promises;

class SoccerRagAgent extends BaseSportRagAgent {
  /**
   * Create a new Soccer RAG Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(config, mcpConnector) {
    super('SOC', 'Soccer', config, mcpConnector);
    
    // Soccer-specific data sources
    this.dataSources = [
      {
        name: 'NCAA Soccer Statistics',
        type: 'statistics',
        url: config.dataSources?.statistics || null
      },
      {
        name: 'Soccer Rankings',
        type: 'rankings',
        url: config.dataSources?.rankings || null
      },
      {
        name: 'Soccer Conference Schedules',
        type: 'schedules',
        url: config.dataSources?.schedules || null
      },
      {
        name: 'NCAA Soccer Teams',
        type: 'teams',
        url: config.dataSources?.teams || null
      },
      {
        name: 'College Cup History',
        type: 'tournament',
        url: config.dataSources?.tournament || null
      }
    ];
    
    // Soccer-specific knowledge schema
    this.knowledgeSchema = {
      rules: {
        description: 'NCAA Soccer Rules',
        source: config.knowledgeSources?.rules || null
      },
      constraints: {
        description: 'Soccer Scheduling Constraints',
        source: config.knowledgeSources?.constraints || null
      },
      bestPractices: {
        description: 'Best practices for Soccer scheduling',
        source: config.knowledgeSources?.bestPractices || null
      },
      seasonStructure: {
        description: 'NCAA Soccer season structure',
        source: config.knowledgeSources?.seasonStructure || null
      },
      metrics: {
        description: 'Key performance metrics for Soccer',
        source: config.knowledgeSources?.metrics || null
      },
      conferenceRules: {
        description: 'Conference-specific rules for Soccer',
        source: config.knowledgeSources?.conferenceRules || null
      }
    };
    
    // Soccer-specific scheduling parameters
    this.schedulingParameters = {
      regularSeasonLength: config.scheduling?.regularSeasonLength || 18,
      conferenceGamesMin: config.scheduling?.conferenceGamesMin || 10,
      nonConferenceGamesMax: config.scheduling?.nonConferenceGamesMax || 8,
      midweekGames: config.scheduling?.midweekGames || true,
      recoveryDays: config.scheduling?.recoveryDays || 2,
      preferredGameDays: config.scheduling?.preferredGameDays || ['Friday', 'Sunday'],
      seasonStartDate: config.scheduling?.seasonStartDate || 'Mid-August',
      regularSeasonEndDate: config.scheduling?.regularSeasonEndDate || 'Early November',
      conferenceTournamentLength: config.scheduling?.conferenceTournamentLength || 2
    };
    
    logger.info('Soccer RAG Agent initialized');
  }
  
  /**
   * Load soccer-specific knowledge
   * 
   * @returns {Promise<void>}
   */
  async loadSportKnowledge() {
    try {
      logger.info('Loading Soccer knowledge...');
      
      const knowledgeDir = path.join(this.config.dataDirectory || path.join(__dirname, '../../../data/soc'), 'knowledge');
      
      // Create knowledge directory if it doesn't exist
      try {
        await fs.mkdir(knowledgeDir, { recursive: true });
      } catch (error) {
        // Ignore if directory already exists
      }
      
      // Load each knowledge type
      for (const [type, info] of Object.entries(this.knowledgeSchema)) {
        if (info.source) {
          let data;
          
          if (info.source.startsWith('http')) {
            // Fetch from URL
            const response = await axios.get(info.source);
            data = response.data;
          } else if (info.source.startsWith('file://')) {
            // Load from file
            const filePath = info.source.replace('file://', '');
            if (await this._fileExists(filePath)) {
              const fileContent = await fs.readFile(filePath, 'utf8');
              data = JSON.parse(fileContent);
            } else {
              logger.warn(`Knowledge file not found: ${filePath}`);
              continue;
            }
          } else {
            // Use mock data for testing
            data = this._generateMockSoccerKnowledge(type);
          }
          
          // Store knowledge data
          const knowledgePath = path.join(knowledgeDir, `${type}.json`);
          await fs.writeFile(knowledgePath, JSON.stringify(data, null, 2), 'utf8');
          
          // Register with RAG engine as a special "school"
          await this.ragEngine.addSchool({
            id: `soc_knowledge_${type}`,
            name: `Soccer ${this._formatKnowledgeType(type)}`
          });
          
          // Update the RAG engine with this knowledge
          await this.ragEngine.updateSchoolData(
            `soc_knowledge_${type}`,
            'knowledge',
            `file://${knowledgePath}`
          );
          
          logger.info(`Loaded Soccer ${type} knowledge`);
        }
      }
      
      logger.info('Soccer knowledge loading complete');
    } catch (error) {
      logger.error(`Error loading Soccer knowledge: ${error.message}`);
    }
  }
  
  /**
   * Check if a file exists
   * 
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} Whether the file exists
   * @private
   */
  async _fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Format knowledge type for display
   * 
   * @param {string} type - Knowledge type
   * @returns {string} Formatted type
   * @private
   */
  _formatKnowledgeType(type) {
    return type
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between words
  }
  
  /**
   * Generate mock soccer knowledge for testing
   * 
   * @param {string} type - Knowledge type
   * @returns {Object} Mock knowledge
   * @private
   */
  _generateMockSoccerKnowledge(type) {
    switch (type) {
      case 'rules':
        return {
          gameLength: {
            periods: 2,
            minutesPerPeriod: 45,
            overtimeRules: 'Two 10-minute sudden victory periods followed by penalty kicks'
          },
          substitutions: {
            regularSeason: 'Maximum 11 substitutes per match',
            postSeason: 'Maximum 11 substitutes per match',
            reentry: 'Players may re-enter once per half'
          },
          timeouts: {
            none: 'No timeouts in soccer',
            waterBreaks: 'Permitted in extreme heat conditions'
          },
          scoring: {
            goal: 1,
            overtimeGoal: 'Golden goal in overtime (sudden victory)',
            penaltyKicks: 'Best of 5, then sudden death'
          },
          offsideRule: {
            description: 'Attacker is ahead of second-to-last defender when ball is played',
            exceptions: 'Not offside in own half, on goal kicks, throw-ins, or corner kicks'
          },
          recent_rule_changes: [
            {
              year: 2023,
              description: 'Video review for critical decisions in championship tournaments'
            },
            {
              year: 2022,
              description: 'Increased flexibility in substitution patterns'
            }
          ]
        };
        
      case 'constraints':
        return {
          scheduling: {
            maxGamesPerWeek: 2,
            minHoursBetweenGames: 48,
            maxConsecutiveAwayGames: 3,
            finalExamBreakDays: 10,
            midweekGameLimitations: 'Limited travel distance for midweek games',
            recoveryTime: 'Minimum 2 days between matches'
          },
          balancing: {
            homeAwayRatio: 'Equal number of home and away conference games',
            conferenceOpponents: 'Play all conference opponents at least once',
            rivalMatchups: 'Home and away each season when possible',
            nonConferenceStrength: 'Mix of strong, moderate, and developmental opponents'
          },
          required: {
            conferenceGames: 'Typically 8-11 per season',
            nonConferenceGames: '7-9 per season',
            totalGames: 'Maximum 20 games in regular season',
            rpiConsiderations: 'Schedule opponents with winning records for RPI boost'
          },
          fieldAvailability: {
            sharedFacilities: 'Coordinate with other field sports',
            fieldConditions: 'Rain/weather contingency plans required',
            lightingRequirements: 'Evening games require proper lighting facilities'
          }
        };
        
      case 'bestPractices':
        return {
          nonConference: {
            description: 'Non-conference scheduling strategy',
            components: [
              'Schedule 1-2 top-25 opponents for RPI',
              'Regional non-conference games to minimize travel',
              'Balance of home and away matches',
              'Consider climate differences in early season games'
            ]
          },
          timing: {
            preConference: 'Front-load challenging non-conference games',
            homeOpeners: 'Start with home match when possible',
            midweekGames: 'Minimize travel for Tuesday/Wednesday matches',
            recoveryWindows: 'Allow adequate recovery between matches (48-72 hours)'
          },
          coordination: {
            menWomenCoordination: 'Coordinate men\'s and women\'s schedules for travel efficiency',
            doubleHeaders: 'Consider men\'s/women\'s doubleheaders when appropriate',
            fieldSharing: 'Coordinate field usage with other sports'
          },
          rpiOptimization: {
            opponentSelection: 'Schedule teams likely to have winning records',
            roadGames: 'Road wins have higher RPI value',
            opponentStrength: 'Opponent\'s opponent winning percentage matters'
          }
        };
        
      case 'seasonStructure':
        return {
          phases: [
            {
              name: 'Preseason',
              startDate: 'Early August',
              endDate: 'Mid-August',
              activities: ['Training', 'Exhibition Matches', 'Team Building']
            },
            {
              name: 'Non-Conference',
              startDate: 'Mid-August',
              endDate: 'Mid-September',
              activities: ['Early Season Tournaments', 'Non-Conference Matches']
            },
            {
              name: 'Conference',
              startDate: 'Mid-September',
              endDate: 'Early November',
              activities: ['Conference Schedule', 'Rivalry Matches']
            },
            {
              name: 'Conference Tournament',
              startDate: 'Early November',
              endDate: 'Mid-November',
              activities: ['Conference Tournament']
            },
            {
              name: 'NCAA Tournament',
              startDate: 'Mid-November',
              endDate: 'Early December',
              activities: ['NCAA Tournament Rounds', 'College Cup (Final Four)']
            }
          ],
          keyDates: {
            seasonOpener: 'Third weekend in August',
            conferenceOpener: 'Mid to late September',
            conferenceChampionships: 'First/second weekend in November',
            selectionShow: 'Mid-November',
            collegeCup: 'First weekend in December'
          },
          academicConsiderations: {
            examPeriods: ['Early December', 'Early May'],
            breaks: ['Fall Break', 'Thanksgiving Break'],
            travelPlanning: 'Minimize academic time missed for travel'
          },
          weatherConsiderations: {
            earlySeasonHeat: 'Consider evening games in August/September',
            lateSeasonCold: 'Consider afternoon games in late October/November',
            rainContingencies: 'Have backup plans for precipitation'
          }
        };
        
      case 'metrics':
        return {
          performanceMetrics: {
            rpi: {
              description: 'Rating Percentage Index',
              components: ['Team winning percentage (25%)', 'Opponent winning percentage (50%)', 'Opponents\' opponents winning percentage (25%)'],
              importance: 'Primary metric for NCAA tournament selection'
            },
            unitedSoccerCoachesRankings: {
              description: 'United Soccer Coaches Poll Rankings',
              components: ['Weekly coaches poll', 'Top 25 teams ranked'],
              importance: 'Indicates team reputation and quality'
            },
            resume: {
              qualityWins: 'Victories over top-50 RPI teams',
              badLosses: 'Defeats against teams with RPI over 150',
              importance: 'Key factor in committee evaluation'
            }
          },
          playerMetrics: {
            goalsAgainstAverage: 'Average goals allowed per game',
            scoringOffense: 'Average goals scored per game',
            shutoutPercentage: 'Percentage of games with no goals allowed',
            savePercentage: 'Percentage of shots on goal saved by goalkeeper'
          },
          schedulingMetrics: {
            strengthOfSchedule: {
              overall: 'Average RPI of all opponents',
              nonConference: 'Average RPI of non-conference opponents',
              importance: 'Critical for at-large selection consideration'
            },
            gameLocation: {
              home: 'Teams typically perform better at home',
              neutral: 'Used for tournaments and showcase events',
              away: 'Most challenging environment, highest RPI value for wins'
            }
          }
        };
        
      case 'conferenceRules':
        return {
          tiebreakers: [
            'Points (3 for win, 1 for draw, 0 for loss)',
            'Head-to-head results',
            'Goal differential in conference games',
            'Total goals scored in conference games',
            'Away goals in conference games',
            'RPI ranking',
            'Coin flip if all else equal'
          ],
          schedulingRequirements: {
            formatOptions: 'Single round-robin, double round-robin, or divisional play',
            homeAwayBalance: 'Equal number of home and away games when possible',
            rivalries: 'Traditional rivalries preserved in scheduling',
            weekendGamePriority: 'Friday/Sunday windows prioritized'
          },
          tournamentStructure: {
            qualification: 'Top 6-8 teams qualify for conference tournament',
            format: 'Single elimination or semifinals/finals',
            seeding: 'Based on regular season conference standings',
            championshipBenefit: 'Automatic NCAA Tournament bid'
          },
          specialConsiderations: {
            travelPartners: 'Teams paired for geographic efficiency',
            divisionalAlignment: 'Geographic divisions in larger conferences',
            playingConditions: 'Minimum field specifications required',
            gameTime: 'Standard start times to ensure adequate rest'
          }
        };
        
      default:
        return {
          name: `Soccer ${this._formatKnowledgeType(type)}`,
          note: 'Mock data for testing',
          created: new Date().toISOString()
        };
    }
  }
  
  /**
   * Enhance a query with soccer-specific context
   * 
   * @param {string} query - Original query
   * @returns {Promise<string>} Enhanced query
   */
  async enhanceQuery(query) {
    // First use the base enhancement
    const baseEnhanced = await super.enhanceQuery(query);
    
    try {
      // Add soccer-specific terminology and context
      const systemPrompt = `You are a specialized assistant for NCAA Soccer. You'll receive a query that needs enhancement with soccer-specific terminology.
      
      Rewrite the query to include:
      1. Specific NCAA Soccer terminology (e.g., "College Cup" instead of "championship")
      2. Correct soccer positions (GK, CB, FB, WB, CDM, CM, CAM, LM/RM, LW/RW, ST)
      3. Soccer-specific metrics (RPI, goals against average, etc.)
      4. Current season context if time-dependent
      
      Important: Your task is just to rewrite the question in a way that will help retrieve the most relevant soccer information. Don't answer the question itself.
      Return only the enhanced query without explanations or additional text.`;
      
      const userPrompt = `Query: "${baseEnhanced}"
      
      Enhance this query with specific NCAA Soccer terminology and context.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];
      
      const enhancedQuery = await this.ai.generateText(messages, {
        temperature: 0.3,
        max_tokens: 150
      });
      
      // Clean up and return the enhanced query
      return enhancedQuery.trim();
    } catch (error) {
      logger.error(`Error in soccer-specific query enhancement: ${error.message}`);
      // Fall back to the base enhancement
      return baseEnhanced;
    }
  }
  
  /**
   * Update soccer-specific data
   * 
   * @param {string} dataType - Type of data to update
   * @param {string} source - Data source URL or identifier
   * @param {Array<string>} schoolIds - School IDs to update
   * @returns {Promise<boolean>} Success indicator
   */
  async updateSoccerData(dataType, source, schoolIds = []) {
    try {
      logger.info(`Updating Soccer ${dataType} data from ${source}`);
      
      // Process the data type
      switch (dataType) {
        case 'rankings':
          // Update rankings data
          await this._updateRankingsData(source);
          break;
          
        case 'statistics':
          // Update statistics data for specified schools
          await this._updateStatisticsData(source, schoolIds);
          break;
          
        case 'tournament':
          // Update tournament data
          await this._updateTournamentData(source);
          break;
          
        case 'schedules':
          // Update schedule data for specified schools
          await this._updateScheduleData(source, schoolIds);
          break;
          
        default:
          // Use base implementation for other data types
          return await this.updateSportData(dataType, source);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error updating Soccer data: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Update rankings data
   * 
   * @param {string} source - Data source
   * @returns {Promise<void>}
   * @private
   */
  async _updateRankingsData(source) {
    // Implementation would fetch and process rankings data
    logger.info(`Updating Soccer rankings from ${source}`);
    
    // Mock implementation - would be replaced with actual data fetching
    const mockedRankings = {
      poll: 'United Soccer Coaches Poll',
      week: 'Week 10',
      date: new Date().toISOString(),
      rankings: Array.from({ length: 25 }, (_, i) => ({
        rank: i + 1,
        team: `Team ${i + 1}`,
        conference: 'Conference',
        record: '12-3-2',
        previousRank: i + 2
      }))
    };
    
    // Store in knowledge directory
    const knowledgeDir = path.join(this.config.dataDirectory || path.join(__dirname, '../../../data/soc'), 'knowledge');
    const rankingsPath = path.join(knowledgeDir, 'rankings.json');
    
    await fs.writeFile(rankingsPath, JSON.stringify(mockedRankings, null, 2), 'utf8');
    
    // Register with RAG engine
    await this.ragEngine.updateSchoolData(
      'soc_knowledge_rankings',
      'rankings',
      `file://${rankingsPath}`
    );
  }
  
  /**
   * Update statistics data
   * 
   * @param {string} source - Data source
   * @param {Array<string>} schoolIds - School IDs to update
   * @returns {Promise<void>}
   * @private
   */
  async _updateStatisticsData(source, schoolIds) {
    // Implementation would fetch and process statistics data
    logger.info(`Updating Soccer statistics for ${schoolIds.length} schools`);
    
    // Process would include:
    // 1. Fetching statistics from source
    // 2. Processing for each school
    // 3. Updating the RAG engine
    
    // This is a placeholder that would be implemented with actual logic
  }
  
  /**
   * Update tournament data
   * 
   * @param {string} source - Data source
   * @returns {Promise<void>}
   * @private
   */
  async _updateTournamentData(source) {
    // Implementation would fetch and process tournament data
    logger.info(`Updating Soccer tournament data from ${source}`);
    
    // Process would include:
    // 1. Fetching tournament data
    // 2. Storing in the knowledge directory
    // 3. Updating the RAG engine
    
    // This is a placeholder that would be implemented with actual logic
  }
  
  /**
   * Update schedule data
   * 
   * @param {string} source - Data source
   * @param {Array<string>} schoolIds - School IDs to update
   * @returns {Promise<void>}
   * @private
   */
  async _updateScheduleData(source, schoolIds) {
    // Implementation would fetch and process schedule data
    logger.info(`Updating Soccer schedules for ${schoolIds.length} schools`);
    
    // Process would include:
    // 1. Fetching schedule data from source
    // 2. Processing for each school
    // 3. Updating the RAG engine
    
    // This is a placeholder that would be implemented with actual logic
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing SOC RAG task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'update_soccer_data':
        return await this.updateSoccerData(
          task.parameters.dataType,
          task.parameters.source,
          task.parameters.schoolIds
        );
      
      default:
        // Use base implementation for other task types
        return await super._processTask(task);
    }
  }
}

module.exports = SoccerRagAgent;