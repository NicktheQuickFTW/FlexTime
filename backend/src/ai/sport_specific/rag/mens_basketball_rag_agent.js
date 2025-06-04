/**
 * Men's Basketball RAG Agent
 * 
 * Specialized RAG agent for men's basketball data and insights.
 */

const BaseSportRagAgent = require('./base_sport_rag_agent');
const logger = require("../utils/logger");
const path = require('path');
const axios = require('axios');
const fs = require('fs').promises;

class MensBasketballRagAgent extends BaseSportRagAgent {
  /**
   * Create a new Men's Basketball RAG Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(config, mcpConnector) {
    super('MBB', 'Men\'s Basketball', config, mcpConnector);
    
    // Basketball-specific data sources
    this.dataSources = [
      {
        name: 'NCAA Men\'s Basketball Statistics',
        type: 'statistics',
        url: config.dataSources?.statistics || null
      },
      {
        name: 'Men\'s Basketball Rankings',
        type: 'rankings',
        url: config.dataSources?.rankings || null
      },
      {
        name: 'Men\'s Basketball Conference Schedules',
        type: 'schedules',
        url: config.dataSources?.schedules || null
      },
      {
        name: 'NCAA Men\'s Basketball Teams',
        type: 'teams',
        url: config.dataSources?.teams || null
      },
      {
        name: 'Men\'s Basketball Tournament History',
        type: 'tournament',
        url: config.dataSources?.tournament || null
      }
    ];
    
    // Basketball-specific knowledge schema
    this.knowledgeSchema = {
      rules: {
        description: 'NCAA Men\'s Basketball Rules',
        source: config.knowledgeSources?.rules || null
      },
      constraints: {
        description: 'Men\'s Basketball Scheduling Constraints',
        source: config.knowledgeSources?.constraints || null
      },
      bestPractices: {
        description: 'Best practices for Men\'s Basketball scheduling',
        source: config.knowledgeSources?.bestPractices || null
      },
      seasonStructure: {
        description: 'NCAA Men\'s Basketball season structure',
        source: config.knowledgeSources?.seasonStructure || null
      },
      metrics: {
        description: 'Key performance metrics for Men\'s Basketball',
        source: config.knowledgeSources?.metrics || null
      },
      conferenceRules: {
        description: 'Conference-specific rules for Men\'s Basketball',
        source: config.knowledgeSources?.conferenceRules || null
      }
    };
    
    // Basketball-specific scheduling parameters
    this.schedulingParameters = {
      regularSeasonLength: config.scheduling?.regularSeasonLength || 29,
      conferenceGamesMin: config.scheduling?.conferenceGamesMin || 18,
      nonConferenceGamesMax: config.scheduling?.nonConferenceGamesMax || 11,
      holidayTournaments: config.scheduling?.holidayTournaments || true,
      examBreakDays: config.scheduling?.examBreakDays || 10,
      preferredGameDays: config.scheduling?.preferredGameDays || ['Tuesday', 'Wednesday', 'Saturday'],
      seasonStartDate: config.scheduling?.seasonStartDate || 'November 1',
      regularSeasonEndDate: config.scheduling?.regularSeasonEndDate || 'March 10',
      conferenceTournamentLength: config.scheduling?.conferenceTournamentLength || 5
    };
    
    logger.info('Men\'s Basketball RAG Agent initialized');
  }
  
  /**
   * Load basketball-specific knowledge
   * 
   * @returns {Promise<void>}
   */
  async loadSportKnowledge() {
    try {
      logger.info('Loading Men\'s Basketball knowledge...');
      
      const knowledgeDir = path.join(this.config.dataDirectory || path.join(__dirname, '../../../data/mbb'), 'knowledge');
      
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
            data = this._generateMockBasketballKnowledge(type);
          }
          
          // Store knowledge data
          const knowledgePath = path.join(knowledgeDir, `${type}.json`);
          await fs.writeFile(knowledgePath, JSON.stringify(data, null, 2), 'utf8');
          
          // Register with RAG engine as a special "school"
          await this.ragEngine.addSchool({
            id: `mbb_knowledge_${type}`,
            name: `Men's Basketball ${this._formatKnowledgeType(type)}`
          });
          
          // Update the RAG engine with this knowledge
          await this.ragEngine.updateSchoolData(
            `mbb_knowledge_${type}`,
            'knowledge',
            `file://${knowledgePath}`
          );
          
          logger.info(`Loaded Men's Basketball ${type} knowledge`);
        }
      }
      
      logger.info('Men\'s Basketball knowledge loading complete');
    } catch (error) {
      logger.error(`Error loading Men's Basketball knowledge: ${error.message}`);
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
   * Generate mock basketball knowledge for testing
   * 
   * @param {string} type - Knowledge type
   * @returns {Object} Mock knowledge
   * @private
   */
  _generateMockBasketballKnowledge(type) {
    switch (type) {
      case 'rules':
        return {
          gameLength: {
            periods: 2,
            minutesPerPeriod: 20,
            overtimeMinutes: 5
          },
          shotClock: {
            durationSeconds: 30,
            resetToSeconds: 20
          },
          timeouts: {
            perHalf: 4,
            perOvertime: 1,
            lengthSeconds: 75,
            mediaTVTimeouts: true
          },
          fouls: {
            playerFoulLimit: 5,
            teamFoulLimit: 7,
            technicalFoulImpact: 'Two free throws and possession'
          },
          scoring: {
            freeThrowPoints: 1,
            fieldGoalPoints: 2,
            threePointDistance: '22 feet, 1.75 inches',
            threePointPoints: 3
          },
          recent_rule_changes: [
            {
              year: 2023,
              description: 'Implemented replay review for out-of-bounds calls in last 2 minutes'
            },
            {
              year: 2022,
              description: 'Changed block/charge review guidelines'
            }
          ]
        };
        
      case 'constraints':
        return {
          scheduling: {
            maxGamesPerWeek: 2,
            minHoursBetweenGames: 48,
            maxConsecutiveAwayGames: 3,
            maxConsecutiveHomeGames: 4,
            finalExamBreakDays: 10,
            holidayBreakGuidelines: 'Limited travel between December 23-26',
            maxTravelDistance: {
              weekday: 300,
              weekend: 1000
            }
          },
          balancing: {
            homeAwayRatio: 'Approximately equal',
            conferenceOpponents: 'Play all teams at least once',
            rivalMatchups: 'Home and away each season',
            nonConferenceStrength: 'Mix of high, mid, and low major opponents'
          },
          required: {
            conferenceGames: 'Minimum 18 per season',
            nonConferenceGames: 'Maximum 11 per season',
            totalGames: 'Maximum 29 games excluding tournaments',
            tournamentExemption: 'Multi-team events count as single game'
          }
        };
        
      case 'bestPractices':
        return {
          rvs: {
            description: 'Resume Value Scheduling',
            components: [
              'Target 2-3 Quadrant 1 non-conference games',
              'Avoid Quadrant 4 games whenever possible',
              'Schedule at least 1-2 away/neutral non-conference games',
              'Consider NET impact of all scheduling decisions'
            ]
          },
          timing: {
            openers: 'Start with winnable home game',
            finals: 'Avoid difficult road game before finals',
            postExams: 'Schedule lighter competition when returning from breaks',
            holidays: 'Consider tournament participation during Thanksgiving/Christmas'
          },
          balance: {
            travelBurden: 'Cluster road games in same geographic region',
            difficultyPacing: 'Space out most challenging opponents',
            conferenceBalance: 'Avoid consecutive road games against top teams'
          },
          metrics: {
            netConsiderations: 'Be mindful of efficiency margin impact on NET',
            kenpomAlignment: 'Consider adjusted efficiency impacts',
            quadrantPlanning: 'Project opponent quality into scheduling decisions'
          }
        };
        
      case 'seasonStructure':
        return {
          phases: [
            {
              name: 'Preseason',
              startDate: 'October 15',
              endDate: 'October 31',
              activities: ['Practice', 'Exhibition Games', 'Media Days']
            },
            {
              name: 'Non-Conference',
              startDate: 'November 1',
              endDate: 'December 31',
              activities: ['Regular Season Games', 'Holiday Tournaments', 'Classics']
            },
            {
              name: 'Conference',
              startDate: 'January 1',
              endDate: 'March 10',
              activities: ['Conference Games', 'Rivalry Weeks']
            },
            {
              name: 'Conference Tournament',
              startDate: 'March 11',
              endDate: 'March 16',
              activities: ['Single-elimination tournament']
            },
            {
              name: 'NCAA Tournament',
              startDate: 'March 19',
              endDate: 'April 8',
              activities: ['Selection Sunday', 'First Four', 'First/Second Rounds', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship']
            }
          ],
          keyDates: {
            seasonOpener: 'First Tuesday in November',
            earlySeasonTournaments: 'November 20-27',
            holidayBreak: 'December 23-26',
            finalExams: 'Varies by institution (typically early-mid December)',
            rivalryWeek: 'Typically in February',
            selectionSunday: 'Mid-March (Sunday before tournament)',
            finalFour: 'First weekend in April'
          },
          academicConsiderations: {
            examPeriods: ['Early December', 'Early May'],
            breaks: ['Thanksgiving', 'Winter Break', 'Spring Break'],
            avoidanceWindows: ['Final Exam Periods', 'Graduation Weekend']
          }
        };
        
      case 'metrics':
        return {
          performanceMetrics: {
            net: {
              description: 'NCAA Evaluation Tool',
              components: ['Adjusted Efficiency', 'Winning Percentage', 'Game Location', 'Opponent Strength'],
              importance: 'Primary NCAA Tournament selection metric'
            },
            kenpom: {
              description: 'KenPom Adjusted Efficiency',
              components: ['Offensive Efficiency', 'Defensive Efficiency', 'Tempo', 'Strength of Schedule'],
              importance: 'Industry standard for team quality assessment'
            },
            resume: {
              quadrantSystem: {
                q1: 'Home: 1-30, Neutral: 1-50, Away: 1-75',
                q2: 'Home: 31-75, Neutral: 51-100, Away: 76-135',
                q3: 'Home: 76-160, Neutral: 101-200, Away: 136-240',
                q4: 'Home: 161+, Neutral: 201+, Away: 241+'
              },
              importance: 'Quadrant record is key tournament selection factor'
            }
          },
          schedulingMetrics: {
            strengthOfSchedule: {
              nonConference: 'Average NET ranking of non-conference opponents',
              overall: 'Average NET ranking of all opponents',
              importance: 'Critical for at-large selection consideration'
            },
            gameLocation: {
              home: 'Easiest environment, least valuable for metrics',
              neutral: 'Moderate difficulty, moderately valuable',
              away: 'Most difficult environment, most valuable for metrics'
            }
          }
        };
        
      case 'conferenceRules':
        return {
          tiebreakers: [
            'Head-to-head record between tied teams',
            'Record against teams in order of conference finish',
            'NET ranking comparison',
            'Coin flip for seeding if all else equal'
          ],
          schedulingRequirements: {
            playEveryone: true,
            homeAndAwayBalance: 'Play most teams twice (home and away)',
            protectedRivalries: ['Must play twice annually'],
            rotatingOpponents: ['Some opponents played only once in unbalanced format']
          },
          tournamentStructure: {
            teams: 'All teams qualify',
            format: 'Single elimination',
            seeding: 'Based on regular season conference record',
            location: 'Neutral site',
            championshipBenefit: 'Automatic NCAA Tournament bid'
          },
          televisionConsiderations: {
            nationalWindows: ['Tuesday, Wednesday, Saturday prime time slots prioritized'],
            rivalryWeeks: ['Scheduled for maximum exposure'],
            marqueeMatchups: ['Spaced throughout season for TV purposes']
          }
        };
        
      default:
        return {
          name: `Men's Basketball ${this._formatKnowledgeType(type)}`,
          note: 'Mock data for testing',
          created: new Date().toISOString()
        };
    }
  }
  
  /**
   * Enhance a query with basketball-specific context
   * 
   * @param {string} query - Original query
   * @returns {Promise<string>} Enhanced query
   */
  async enhanceQuery(query) {
    // First use the base enhancement
    const baseEnhanced = await super.enhanceQuery(query);
    
    try {
      // Add basketball-specific terminology and context
      const systemPrompt = `You are a specialized assistant for NCAA Men's Basketball. You'll receive a query that needs enhancement with basketball-specific terminology.
      
      Rewrite the query to include:
      1. Specific NCAA Men's Basketball terminology (e.g., "Quad 1 wins" instead of "good wins")
      2. Correct basketball positions (PG, SG, SF, PF, C)
      3. NCAA Men's Basketball specific metrics (NET, KenPom, BPI, etc.)
      4. Current season context if time-dependent
      
      Important: Your task is just to rewrite the question in a way that will help retrieve the most relevant basketball information. Don't answer the question itself.
      Return only the enhanced query without explanations or additional text.`;
      
      const userPrompt = `Query: "${baseEnhanced}"
      
      Enhance this query with specific NCAA Men's Basketball terminology and context.`;
      
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
      logger.error(`Error in basketball-specific query enhancement: ${error.message}`);
      // Fall back to the base enhancement
      return baseEnhanced;
    }
  }
  
  /**
   * Update basketball-specific data
   * 
   * @param {string} dataType - Type of data to update
   * @param {string} source - Data source URL or identifier
   * @param {Array<string>} schoolIds - School IDs to update
   * @returns {Promise<boolean>} Success indicator
   */
  async updateBasketballData(dataType, source, schoolIds = []) {
    try {
      logger.info(`Updating Men's Basketball ${dataType} data from ${source}`);
      
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
      logger.error(`Error updating Men's Basketball data: ${error.message}`);
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
    logger.info(`Updating Men's Basketball rankings from ${source}`);
    
    // Mock implementation - would be replaced with actual data fetching
    const mockedRankings = {
      poll: 'AP Top 25',
      week: 'Week 10',
      date: new Date().toISOString(),
      rankings: Array.from({ length: 25 }, (_, i) => ({
        rank: i + 1,
        team: `Team ${i + 1}`,
        conference: 'Conference',
        record: '15-3',
        points: 1000 - (i * 40),
        previousRank: i + 2
      }))
    };
    
    // Store in knowledge directory
    const knowledgeDir = path.join(this.config.dataDirectory || path.join(__dirname, '../../../data/mbb'), 'knowledge');
    const rankingsPath = path.join(knowledgeDir, 'rankings.json');
    
    await fs.writeFile(rankingsPath, JSON.stringify(mockedRankings, null, 2), 'utf8');
    
    // Register with RAG engine
    await this.ragEngine.updateSchoolData(
      'mbb_knowledge_rankings',
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
    logger.info(`Updating Men's Basketball statistics for ${schoolIds.length} schools`);
    
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
    logger.info(`Updating Men's Basketball tournament data from ${source}`);
    
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
    logger.info(`Updating Men's Basketball schedules for ${schoolIds.length} schools`);
    
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
    logger.info(`Processing MBB RAG task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'update_basketball_data':
        return await this.updateBasketballData(
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

module.exports = MensBasketballRagAgent;