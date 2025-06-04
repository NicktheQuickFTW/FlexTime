/**
 * Wrestling RAG Agent
 * 
 * Specialized RAG agent for wrestling data and insights.
 */

const BaseSportRagAgent = require('./base_sport_rag_agent');
const logger = require("../utils/logger");
const path = require('path');
const axios = require('axios');
const fs = require('fs').promises;

class WrestlingRagAgent extends BaseSportRagAgent {
  /**
   * Create a new Wrestling RAG Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(config, mcpConnector) {
    super('WRES', 'Wrestling', config, mcpConnector);
    
    // Wrestling-specific data sources
    this.dataSources = [
      {
        name: 'NCAA Wrestling Statistics',
        type: 'statistics',
        url: config.dataSources?.statistics || null
      },
      {
        name: 'Wrestling Rankings',
        type: 'rankings',
        url: config.dataSources?.rankings || null
      },
      {
        name: 'Wrestling Dual Schedules',
        type: 'schedules',
        url: config.dataSources?.schedules || null
      },
      {
        name: 'NCAA Wrestling Teams',
        type: 'teams',
        url: config.dataSources?.teams || null
      },
      {
        name: 'NCAA Tournament History',
        type: 'tournament',
        url: config.dataSources?.tournament || null
      },
      {
        name: 'Weight Class Information',
        type: 'weight_classes',
        url: config.dataSources?.weightClasses || null
      }
    ];
    
    // Wrestling-specific knowledge schema
    this.knowledgeSchema = {
      rules: {
        description: 'NCAA Wrestling Rules',
        source: config.knowledgeSources?.rules || null
      },
      constraints: {
        description: 'Wrestling Scheduling Constraints',
        source: config.knowledgeSources?.constraints || null
      },
      bestPractices: {
        description: 'Best practices for Wrestling scheduling',
        source: config.knowledgeSources?.bestPractices || null
      },
      seasonStructure: {
        description: 'NCAA Wrestling season structure',
        source: config.knowledgeSources?.seasonStructure || null
      },
      metrics: {
        description: 'Key performance metrics for Wrestling',
        source: config.knowledgeSources?.metrics || null
      },
      conferenceRules: {
        description: 'Conference-specific rules for Wrestling',
        source: config.knowledgeSources?.conferenceRules || null
      },
      weightClasses: {
        description: 'NCAA Wrestling weight classes',
        source: config.knowledgeSources?.weightClasses || null
      }
    };
    
    // Wrestling-specific scheduling parameters
    this.schedulingParameters = {
      dualMeetLength: config.scheduling?.dualMeetLength || 2,
      maxDualMeetsPerWeek: config.scheduling?.maxDualMeetsPerWeek || 2,
      tournamentWeekends: config.scheduling?.tournamentWeekends || 5,
      preferredDualDays: config.scheduling?.preferredDualDays || ['Friday', 'Sunday'],
      conferenceMatches: config.scheduling?.conferenceMatches || 8,
      nonConferenceMatches: config.scheduling?.nonConferenceMatches || 10,
      seasonStartDate: config.scheduling?.seasonStartDate || 'Early November',
      regularSeasonEndDate: config.scheduling?.regularSeasonEndDate || 'Late February',
      conferenceTournamentDate: config.scheduling?.conferenceTournamentDate || 'Early March'
    };
    
    logger.info('Wrestling RAG Agent initialized');
  }
  
  /**
   * Load wrestling-specific knowledge
   * 
   * @returns {Promise<void>}
   */
  async loadSportKnowledge() {
    try {
      logger.info('Loading Wrestling knowledge...');
      
      const knowledgeDir = path.join(this.config.dataDirectory || path.join(__dirname, '../../../data/wres'), 'knowledge');
      
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
            data = this._generateMockWrestlingKnowledge(type);
          }
          
          // Store knowledge data
          const knowledgePath = path.join(knowledgeDir, `${type}.json`);
          await fs.writeFile(knowledgePath, JSON.stringify(data, null, 2), 'utf8');
          
          // Register with RAG engine as a special "school"
          await this.ragEngine.addSchool({
            id: `wres_knowledge_${type}`,
            name: `Wrestling ${this._formatKnowledgeType(type)}`
          });
          
          // Update the RAG engine with this knowledge
          await this.ragEngine.updateSchoolData(
            `wres_knowledge_${type}`,
            'knowledge',
            `file://${knowledgePath}`
          );
          
          logger.info(`Loaded Wrestling ${type} knowledge`);
        }
      }
      
      logger.info('Wrestling knowledge loading complete');
    } catch (error) {
      logger.error(`Error loading Wrestling knowledge: ${error.message}`);
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
   * Generate mock wrestling knowledge for testing
   * 
   * @param {string} type - Knowledge type
   * @returns {Object} Mock knowledge
   * @private
   */
  _generateMockWrestlingKnowledge(type) {
    switch (type) {
      case 'rules':
        return {
          matchFormat: {
            periods: 3,
            periodLength: '3 minutes for 1st period, 2 minutes for 2nd and 3rd periods',
            overtime: '1-minute sudden victory followed by two 30-second tiebreakers'
          },
          scoring: {
            takedown: 2,
            escape: 1,
            reversal: 2,
            nearfall: '2 or 4 points depending on duration',
            ridingTime: '1 point for 1 minute advantage',
            technicalFall: '15-point advantage ends match',
            pin: 'Automatically ends match with victory'
          },
          dualMeetFormat: {
            weightClassOrder: 'Determined by pre-match draw',
            teamScoring: '3 team points for decision, 4 for major, 5 for tech fall, 6 for pin',
            tiebreakers: 'Multiple criteria including most victories, pins, etc.'
          },
          weightClasses: [125, 133, 141, 149, 157, 165, 174, 184, 197, 285],
          weighIns: {
            timing: '1-2 hours before competition',
            allowance: '1 pound allowance for multi-day tournaments',
            monitoring: 'Body composition and weight loss monitoring required'
          },
          recent_rule_changes: [
            {
              year: 2023,
              description: 'Modified neutral danger zone scoring'
            },
            {
              year: 2022,
              description: 'Updated medical forfeiture rules'
            }
          ]
        };
        
      case 'constraints':
        return {
          scheduling: {
            maxCompetitiveDates: 16,
            maxDualMeetsPerDay: 2,
            maxTournamentsPerSeason: 6,
            recoveryTime: 'Minimum 18 hours between competitions',
            multiDayEvents: 'Count as one date of competition per NCAA rules',
            consecutiveWeekends: 'No more than 3 consecutive weekends of competition recommended'
          },
          balancing: {
            homeAwayRatio: 'Approximately equal home and away dual meets',
            conferenceOpponents: 'All conference opponents competed against annually',
            nonConferenceStrength: 'Mix of top-25, mid-level, and developmental programs',
            tournamentSelection: 'Strategic selection for RPI and qualifying opportunity'
          },
          weightManagement: {
            certificationPeriod: 'Weight certification must be completed before competition',
            descendingWeightPlan: 'Wrestlers must follow approved weight loss plan',
            hydrationTesting: 'Required for certification',
            minimumCompetitionWeight: 'Based on body composition assessment'
          },
          athlete_welfare: {
            travelRecovery: 'Adequate recovery time after long-distance travel',
            academicWindows: 'Limited competition during exams',
            holidayConsiderations: 'Limited competition during official holidays',
            medicalClearance: 'Skin checks and medical clearance required'
          }
        };
        
      case 'bestPractices':
        return {
          dualMeetScheduling: {
            description: 'Dual meet scheduling strategy',
            components: [
              'Triangular/quadrangular meets for travel efficiency',
              'Strategic home meets for recruiting and fan engagement',
              'Competitive balance throughout season',
              'Marquee opponents for fan engagement and RPI'
            ]
          },
          tournamentSelection: {
            description: 'Tournament participation strategy',
            components: [
              'Early season open tournaments for development',
              'Mid-season invitationals for rankings',
              'Strategic selection for qualifying purposes',
              'Balance of individual vs team tournaments'
            ]
          },
          timing: {
            openingEvents: 'Begin with open tournaments or non-conference duals',
            peakPerformance: 'Schedule to peak for conference/NCAA championships',
            academicBalance: 'Minimize academic disruption',
            trainingCycles: 'Align with physiological training cycles'
          },
          financialConsiderations: {
            travelEfficiency: 'Cluster competitions geographically',
            revenueGeneration: 'Strategic home meets against marquee opponents',
            guarantees: 'Balance paid vs. received guarantees',
            tournamentCosts: 'Consider entry fees and travel costs'
          }
        };
        
      case 'seasonStructure':
        return {
          phases: [
            {
              name: 'Preseason',
              startDate: 'October 10',
              endDate: 'Early November',
              activities: ['Practice', 'Intrasquad Competitions', 'Weight Certification']
            },
            {
              name: 'Early Season Tournaments',
              startDate: 'Early November',
              endDate: 'Mid-December',
              activities: ['Open Tournaments', 'Non-Conference Duals']
            },
            {
              name: 'Holiday Tournaments',
              startDate: 'Late December',
              endDate: 'Early January',
              activities: ['Midseason Invitationals', 'Training Camps']
            },
            {
              name: 'Conference Season',
              startDate: 'Early January',
              endDate: 'Late February',
              activities: ['Conference Dual Meets', 'Selected Non-Conference Duals']
            },
            {
              name: 'Championship Season',
              startDate: 'Late February',
              endDate: 'Late March',
              activities: ['Conference Championship', 'NCAA Qualifiers', 'NCAA Championships']
            }
          ],
          keyDates: {
            seasonOpener: 'First weekend in November',
            holidayTournaments: 'Late December',
            conferenceSchedule: 'January-February',
            conferenceTournament: 'Early March',
            ncaaQualifiers: 'Early March',
            ncaaChampionships: 'Mid-March'
          },
          academicConsiderations: {
            examPeriods: ['Early December', 'Early May'],
            breaks: ['Thanksgiving', 'Winter Break', 'Spring Break'],
            classSchedules: 'Friday competitions may require Thursday travel'
          }
        };
        
      case 'metrics':
        return {
          performanceMetrics: {
            rpi: {
              description: 'Rating Percentage Index',
              components: ['Win-loss record', 'Opponent win-loss record', 'Opponents\' opponents win-loss record'],
              importance: 'Used for NCAA qualification and seeding'
            },
            coachesRankings: {
              description: 'NWCA Coaches Poll',
              components: ['Weekly team rankings by coaching panel'],
              importance: 'Indicates program strength and perception'
            },
            individualRankings: {
              description: 'Individual wrestler rankings by weight class',
              sources: ['InterMat', 'FloWrestling', 'The Open Mat', 'WIN Magazine'],
              importance: 'Used for seeding and qualification allocation'
            }
          },
          athleteMetrics: {
            winningPercentage: 'Rate of victories vs. total matches',
            bonusRate: 'Percentage of matches won by pin, tech fall, or major decision',
            takedownDifferential: 'Takedowns scored minus takedowns allowed',
            dominance: 'Average margin of victory or defeat'
          },
          schedulingMetrics: {
            strengthOfSchedule: {
              duals: 'Average ranking of dual meet opponents',
              tournaments: 'Quality of tournament fields faced',
              importance: 'Critical for at-large selection consideration'
            },
            qualityWins: {
              definition: 'Victories over ranked opponents',
              thresholds: 'Wins over top-10, top-25 opponents',
              importance: 'Key factor for NCAA selection and seeding'
            }
          }
        };
        
      case 'conferenceRules':
        return {
          dualMeetFormat: {
            weightOrder: 'Determined by pre-meet draw starting with randomly selected weight',
            timeSchedule: 'Standard warm-up periods and match timing',
            scoringSystem: 'Standard NCAA team scoring',
            tiebreakers: ['Most matches won', 'Most falls', 'Most technical falls']
          },
          schedulingRequirements: {
            dualFrequency: 'Each team meets all conference opponents once annually',
            homeAwayRotation: 'Alternates annually with previous season',
            protectedRivalries: 'Certain rivalries may receive scheduling priority',
            conferenceTournament: 'All teams compete in season-culminating championship'
          },
          championshipStructure: {
            qualification: 'All conference teams participate',
            format: 'Individual bracket tournament with team scoring',
            seeding: 'Based on season performance, head-to-head results, and rankings',
            qualifier: 'Conference receives NCAA allocations based on season performance'
          },
          specialConsiderations: {
            facilitiesRequirements: 'Minimum standards for competition venues',
            officialAssignments: 'Conference assigns officials for conference duals',
            mediaRequirements: 'Broadcasting and stats reporting standards',
            weighInProcedures: 'Standardized conference weigh-in protocols'
          }
        };
        
      case 'weightClasses':
        return {
          ncaaDivision1: [
            { weight: 125, name: '125 pounds' },
            { weight: 133, name: '133 pounds' },
            { weight: 141, name: '141 pounds' },
            { weight: 149, name: '149 pounds' },
            { weight: 157, name: '157 pounds' },
            { weight: 165, name: '165 pounds' },
            { weight: 174, name: '174 pounds' },
            { weight: 184, name: '184 pounds' },
            { weight: 197, name: '197 pounds' },
            { weight: 285, name: 'Heavyweight (285 pounds max)' }
          ],
          certificationProcess: {
            timeframe: 'October 1 to first competition',
            components: ['Hydration assessment', 'Body composition analysis', 'Minimum weight calculation'],
            weightLossLimit: 'Maximum 1.5% body weight loss per week',
            lowestAllowable: 'Minimum 5% body fat for males, 12% for females'
          },
          weighInProcedures: {
            timing: 'One hour before start of competition (duals), two hours (tournaments)',
            allowances: '+1 pound for consecutive days, +1 pound after December 23',
            monitoring: 'Random weight checks throughout season',
            penalties: 'Disqualification if weight not made'
          }
        };
        
      default:
        return {
          name: `Wrestling ${this._formatKnowledgeType(type)}`,
          note: 'Mock data for testing',
          created: new Date().toISOString()
        };
    }
  }
  
  /**
   * Enhance a query with wrestling-specific context
   * 
   * @param {string} query - Original query
   * @returns {Promise<string>} Enhanced query
   */
  async enhanceQuery(query) {
    // First use the base enhancement
    const baseEnhanced = await super.enhanceQuery(query);
    
    try {
      // Add wrestling-specific terminology and context
      const systemPrompt = `You are a specialized assistant for NCAA Wrestling. You'll receive a query that needs enhancement with wrestling-specific terminology.
      
      Rewrite the query to include:
      1. Specific NCAA Wrestling terminology (e.g., "riding time" instead of "control time")
      2. Correct weight class references (125, 133, 141, 149, 157, 165, 174, 184, 197, 285)
      3. Wrestling-specific metrics (RPI, bonus rate, etc.)
      4. Current season context if time-dependent
      
      Important: Your task is just to rewrite the question in a way that will help retrieve the most relevant wrestling information. Don't answer the question itself.
      Return only the enhanced query without explanations or additional text.`;
      
      const userPrompt = `Query: "${baseEnhanced}"
      
      Enhance this query with specific NCAA Wrestling terminology and context.`;
      
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
      logger.error(`Error in wrestling-specific query enhancement: ${error.message}`);
      // Fall back to the base enhancement
      return baseEnhanced;
    }
  }
  
  /**
   * Update wrestling-specific data
   * 
   * @param {string} dataType - Type of data to update
   * @param {string} source - Data source URL or identifier
   * @param {Array<string>} schoolIds - School IDs to update
   * @returns {Promise<boolean>} Success indicator
   */
  async updateWrestlingData(dataType, source, schoolIds = []) {
    try {
      logger.info(`Updating Wrestling ${dataType} data from ${source}`);
      
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
          
        case 'weight_classes':
          // Update weight class data
          await this._updateWeightClassData(source);
          break;
          
        default:
          // Use base implementation for other data types
          return await this.updateSportData(dataType, source);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error updating Wrestling data: ${error.message}`);
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
    logger.info(`Updating Wrestling rankings from ${source}`);
    
    // Mock implementation - would be replaced with actual data fetching
    const mockedRankings = {
      teamRankings: {
        poll: 'NWCA Coaches Poll',
        week: 'Week 10',
        date: new Date().toISOString(),
        rankings: Array.from({ length: 25 }, (_, i) => ({
          rank: i + 1,
          team: `Team ${i + 1}`,
          conference: 'Conference',
          dualRecord: '10-3',
          previousRank: i + 2
        }))
      },
      individualRankings: {
        poll: 'InterMat Rankings',
        date: new Date().toISOString(),
        weightClasses: [125, 133, 141, 149, 157, 165, 174, 184, 197, 285].map(weight => ({
          weight,
          wrestlers: Array.from({ length: 10 }, (_, i) => ({
            rank: i + 1,
            name: `Wrestler ${i + 1}`,
            school: `School ${i + 1}`,
            record: '20-3',
            previousRank: i + 2
          }))
        }))
      }
    };
    
    // Store in knowledge directory
    const knowledgeDir = path.join(this.config.dataDirectory || path.join(__dirname, '../../../data/wres'), 'knowledge');
    const rankingsPath = path.join(knowledgeDir, 'rankings.json');
    
    await fs.writeFile(rankingsPath, JSON.stringify(mockedRankings, null, 2), 'utf8');
    
    // Register with RAG engine
    await this.ragEngine.updateSchoolData(
      'wres_knowledge_rankings',
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
    logger.info(`Updating Wrestling statistics for ${schoolIds.length} schools`);
    
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
    logger.info(`Updating Wrestling tournament data from ${source}`);
    
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
    logger.info(`Updating Wrestling schedules for ${schoolIds.length} schools`);
    
    // Process would include:
    // 1. Fetching schedule data from source
    // 2. Processing for each school
    // 3. Updating the RAG engine
    
    // This is a placeholder that would be implemented with actual logic
  }
  
  /**
   * Update weight class data
   * 
   * @param {string} source - Data source
   * @returns {Promise<void>}
   * @private
   */
  async _updateWeightClassData(source) {
    // Implementation would fetch and process weight class data
    logger.info(`Updating Wrestling weight class data from ${source}`);
    
    // Process would include:
    // 1. Fetching weight class data
    // 2. Storing in the knowledge directory
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
    logger.info(`Processing WRES RAG task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'update_wrestling_data':
        return await this.updateWrestlingData(
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

module.exports = WrestlingRagAgent;