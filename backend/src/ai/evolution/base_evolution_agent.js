/**
 * Base Evolution Agent
 * 
 * Provides core functionality for self-evolving agents that analyze the FlexTime platform,
 * identify gaps, and develop new specialized agents to address emerging needs.
 */

const Agent = require('../agent');
const logger = require("../../lib/logger");;
const fs = require('fs').promises;
const path = require('path');
const AIAdapter = require('../../adapters/ai-adapter');

class BaseEvolutionAgent extends Agent {
  /**
   * Create a new evolution agent
   * 
   * @param {string} name - Agent name
   * @param {string} evolutionType - Type of evolution (e.g., 'platform_analyzer', 'agent_generator')
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(name, evolutionType, config, mcpConnector) {
    super(`${name.toLowerCase()}_evolution`, 'evolution', mcpConnector);
    
    this.name = name;
    this.evolutionType = evolutionType;
    this.config = config || {};
    
    // Configure data storage
    this.dataDirectory = this.config.dataDirectory || 
      path.join(__dirname, `../../data/evolution/${name.toLowerCase()}`);
    
    // Initialize AI adapter for analysis
    this.ai = new AIAdapter(mcpConnector);
    
    // Initialize evolution data
    this.evolutionData = {
      analyses: [],
      generatedAgents: [],
      insights: [],
      recommendations: [],
      trends: [],
      lastAnalysis: null,
      lastUpdated: null
    };
    
    // Define priority levels for evolution tasks
    this.priorityLevels = {
      CRITICAL: 5,   // Platform-wide critical need
      HIGH: 4,       // Significant opportunity for improvement
      MEDIUM: 3,     // Notable enhancement
      LOW: 2,        // Minor improvement
      INFO: 1        // Informational, no immediate action
    };
    
    // Define evolution status values
    this.evolutionStatus = {
      PROPOSED: 'proposed',     // New evolution proposal
      RESEARCHING: 'researching', // Researching the concept
      DESIGNING: 'designing',   // Designing the solution
      IMPLEMENTING: 'implementing', // Implementation in progress
      DEPLOYED: 'deployed',     // Successfully deployed
      REJECTED: 'rejected'      // Deliberately rejected
    };
    
    // Default evolution schedule
    this.evolutionSchedule = this.config.schedule || {
      frequency: 'daily',
      timeUnit: 'day',
      interval: 1
    };
    
    // Evolution configuration
    this.evolutionConfig = {
      // Maximum number of analyses to retain
      maxAnalysisHistory: this.config.maxAnalysisHistory || 100,
      
      // Development configurations
      autoDevelop: this.config.autoDevelop !== undefined ? this.config.autoDevelop : false,
      developmentTypes: this.config.developmentTypes || ['analyzer', 'monitor', 'enhancer'],
      
      // Alert configurations
      notifyThreshold: this.config.notifyThreshold || this.priorityLevels.HIGH,
      notifyEndpoints: this.config.notifyEndpoints || [],

      // Check configurations
      enabledAnalyses: this.config.enabledAnalyses || ['all'],
      disabledAnalyses: this.config.disabledAnalyses || [],
      
      // Retention policy
      retentionDays: this.config.retentionDays || 90
    };
    
    // Knowledge sources for evolution
    this.knowledgeSources = this.config.knowledgeSources || {
      industry: [],
      competitive: [],
      internal: [],
      trends: []
    };
    
    // Last run timestamps
    this.lastRunTimestamps = {};
    
    logger.info(`${name} Evolution Agent initialized`);
  }
  
  /**
   * Initialize the agent
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info(`Initializing ${this.name} Evolution Agent`);
      
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDirectory, { recursive: true });
      
      // Load existing evolution data if available
      await this._loadEvolutionData();
      
      // Start the agent
      await super.start();
      
      // Set up evolution schedule
      this._setupEvolutionSchedule();
      
      logger.info(`${this.name} Evolution Agent initialized successfully`);
      return true;
    } catch (error) {
      logger.error(`Error initializing ${this.name} Evolution Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load existing evolution data
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _loadEvolutionData() {
    try {
      const evolutionDataPath = path.join(this.dataDirectory, 'evolution_data.json');
      
      try {
        const data = await fs.readFile(evolutionDataPath, 'utf8');
        this.evolutionData = JSON.parse(data);
        logger.info(`Loaded ${this.evolutionData.analyses.length} evolution analyses for ${this.name}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.info(`No existing evolution data found for ${this.name}, creating new dataset`);
          this._initializeEmptyEvolutionData();
          await this._saveEvolutionData();
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error(`Error loading evolution data: ${error.message}`);
      this._initializeEmptyEvolutionData();
    }
  }
  
  /**
   * Initialize empty evolution data structure
   * 
   * @private
   */
  _initializeEmptyEvolutionData() {
    this.evolutionData = {
      analyses: [],
      generatedAgents: [],
      insights: [],
      recommendations: [],
      trends: [],
      statistics: {
        totalAnalyses: 0,
        agentsGenerated: 0,
        insightsDiscovered: 0,
        recommendationsImplemented: 0,
        byPriority: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        }
      },
      lastAnalysis: null,
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Save evolution data to disk
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _saveEvolutionData() {
    try {
      const evolutionDataPath = path.join(this.dataDirectory, 'evolution_data.json');
      
      // Update last modified timestamp
      this.evolutionData.lastUpdated = new Date().toISOString();
      
      // Save to disk
      await fs.writeFile(
        evolutionDataPath,
        JSON.stringify(this.evolutionData, null, 2),
        'utf8'
      );
      
      logger.info(`Saved evolution data for ${this.name}`);
    } catch (error) {
      logger.error(`Error saving evolution data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set up evolution schedule
   * 
   * @private
   */
  _setupEvolutionSchedule() {
    // Convert schedule to milliseconds
    let interval;
    switch (this.evolutionSchedule.timeUnit) {
      case 'minute':
        interval = this.evolutionSchedule.interval * 60 * 1000;
        break;
      case 'hour':
        interval = this.evolutionSchedule.interval * 60 * 60 * 1000;
        break;
      case 'day':
        interval = this.evolutionSchedule.interval * 24 * 60 * 60 * 1000;
        break;
      default:
        interval = 24 * 60 * 60 * 1000; // Default to daily
    }
    
    // Schedule the evolution task
    this.evolutionInterval = setInterval(() => {
      this.runEvolutionAnalysis();
    }, interval);
    
    logger.info(`Evolution schedule set up for ${this.name}: every ${this.evolutionSchedule.interval} ${this.evolutionSchedule.timeUnit}(s)`);
  }
  
  /**
   * Run an evolution analysis
   * 
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async runEvolutionAnalysis(options = {}) {
    try {
      logger.info(`Running evolution analysis for ${this.name}`);
      
      const startTime = Date.now();
      let insights = [];
      
      // Update analysis statistics
      this.evolutionData.statistics.totalAnalyses++;
      this.evolutionData.lastAnalysis = new Date().toISOString();
      
      // Run the analysis (to be implemented by subclasses)
      const analysisResults = await this._performAnalysis(options);
      
      if (analysisResults && analysisResults.insights) {
        // Process and add new insights
        insights = analysisResults.insights;
        
        // Update statistics
        this.evolutionData.statistics.insightsDiscovered += insights.length;
        
        // Add insights to the database
        for (const insight of insights) {
          // Add timestamp and ID if not present
          insight.discovered = insight.discovered || new Date().toISOString();
          insight.id = insight.id || `${this.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          insight.status = insight.status || this.evolutionStatus.PROPOSED;
          
          // Update priority counts
          if (insight.priority && this.evolutionData.statistics.byPriority[insight.priority] !== undefined) {
            this.evolutionData.statistics.byPriority[insight.priority]++;
          }
          
          // Add to insights array
          this.evolutionData.insights.push(insight);
        }
        
        // Add the analysis record
        const analysis = {
          id: `analysis_${Date.now()}`,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
          insightCount: insights.length,
          summary: analysisResults.summary || 'Analysis completed successfully',
          options: options
        };
        
        this.evolutionData.analyses.push(analysis);
        
        // Limit history if needed
        if (this.evolutionData.analyses.length > this.evolutionConfig.maxAnalysisHistory) {
          this.evolutionData.analyses = this.evolutionData.analyses.slice(
            this.evolutionData.analyses.length - this.evolutionConfig.maxAnalysisHistory
          );
        }
        
        // Update trends if provided
        if (analysisResults.trends) {
          for (const trend of analysisResults.trends) {
            // Add timestamp and ID if not present
            trend.discovered = trend.discovered || new Date().toISOString();
            trend.id = trend.id || `trend_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
            
            // Add to trends array
            this.evolutionData.trends.push(trend);
          }
        }
        
        // Auto-develop agents if enabled
        if (this.evolutionConfig.autoDevelop) {
          const developmentCandidates = insights.filter(insight => 
            insight.priority >= this.evolutionConfig.notifyThreshold &&
            insight.recommendation?.type === 'new_agent' &&
            this.evolutionConfig.developmentTypes.includes(insight.recommendation.agentType)
          );
          
          if (developmentCandidates.length > 0) {
            logger.info(`Auto-developing ${developmentCandidates.length} agent(s) based on insights`);
            
            for (const candidate of developmentCandidates) {
              try {
                // Develop new agent (to be implemented by subclasses)
                const developmentResult = await this._developAgent(candidate);
                
                if (developmentResult && developmentResult.success) {
                  // Update insight status
                  const insightIndex = this.evolutionData.insights.findIndex(i => i.id === candidate.id);
                  if (insightIndex !== -1) {
                    this.evolutionData.insights[insightIndex].status = this.evolutionStatus.IMPLEMENTED;
                    this.evolutionData.insights[insightIndex].implementedAt = new Date().toISOString();
                  }
                  
                  // Add to generated agents
                  this.evolutionData.generatedAgents.push({
                    id: developmentResult.agentId,
                    insightId: candidate.id,
                    name: developmentResult.name,
                    type: developmentResult.type,
                    timestamp: new Date().toISOString(),
                    description: developmentResult.description
                  });
                  
                  // Update statistics
                  this.evolutionData.statistics.agentsGenerated++;
                  
                  logger.info(`Successfully developed new agent: ${developmentResult.name}`);
                }
              } catch (error) {
                logger.error(`Error developing agent for insight ${candidate.id}: ${error.message}`);
              }
            }
          }
        }
        
        // Notify for high-priority insights
        const notifiableInsights = insights.filter(insight => 
          insight.priority >= this.evolutionConfig.notifyThreshold
        );
        
        if (notifiableInsights.length > 0) {
          logger.info(`Generating notifications for ${notifiableInsights.length} high-priority insights`);
          
          for (const insight of notifiableInsights) {
            try {
              const notificationResult = await this._sendNotification(insight);
              
              if (notificationResult && notificationResult.success) {
                logger.info(`Notification sent for insight ${insight.id}`);
              }
            } catch (error) {
              logger.error(`Error sending notification for insight ${insight.id}: ${error.message}`);
            }
          }
        }
      }
      
      // Save evolution data
      await this._saveEvolutionData();
      
      const analysisDuration = Date.now() - startTime;
      logger.info(`Evolution analysis for ${this.name} completed in ${analysisDuration}ms. Found ${insights.length} new insights.`);
      
      return {
        analysisTime: this.evolutionData.lastAnalysis,
        duration: analysisDuration,
        newInsights: insights.length,
        autoDeveloped: this.evolutionConfig.autoDevelop ? 
          (this.evolutionData.generatedAgents.length - (analysisResults.previousAgentCount || 0)) : undefined,
        trends: analysisResults.trends ? analysisResults.trends.length : 0
      };
    } catch (error) {
      logger.error(`Error during evolution analysis for ${this.name}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Perform an evolution analysis (to be implemented by subclasses)
   * 
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   * @private
   */
  async _performAnalysis(options) {
    // Base implementation - should be overridden by subclasses
    throw new Error('_performAnalysis must be implemented by subclasses');
  }
  
  /**
   * Develop a new agent based on an insight (to be implemented by subclasses)
   * 
   * @param {Object} insight - Insight with agent recommendation
   * @returns {Promise<Object>} Development result
   * @private
   */
  async _developAgent(insight) {
    // Base implementation - should be overridden by subclasses
    throw new Error('_developAgent must be implemented by subclasses');
  }
  
  /**
   * Send a notification for a high-priority insight
   * 
   * @param {Object} insight - Insight to send notification for
   * @returns {Promise<Object>} Notification result
   * @private
   */
  async _sendNotification(insight) {
    try {
      // Check if there are configured notification endpoints
      if (!this.evolutionConfig.notifyEndpoints || this.evolutionConfig.notifyEndpoints.length === 0) {
        return {
          success: false,
          message: 'No notification endpoints configured'
        };
      }
      
      const sentTo = [];
      
      // Format notification message
      const message = `[${insight.priority.toUpperCase()}] Evolution insight: ${insight.description}`;
      
      // Send notification to each endpoint
      for (const endpoint of this.evolutionConfig.notifyEndpoints) {
        try {
          switch (endpoint.type) {
            case 'email':
              // Send email notification (implementation would depend on email service)
              logger.info(`Would send email notification to ${endpoint.address}: ${message}`);
              sentTo.push(`email:${endpoint.address}`);
              break;
              
            case 'slack':
              // Send Slack notification (implementation would depend on Slack API)
              logger.info(`Would send Slack notification to ${endpoint.channel}: ${message}`);
              sentTo.push(`slack:${endpoint.channel}`);
              break;
              
            case 'webhook':
              // Send webhook notification (implementation would depend on HTTP client)
              logger.info(`Would send webhook notification to ${endpoint.url}: ${message}`);
              sentTo.push(`webhook:${endpoint.url}`);
              break;
              
            default:
              logger.warn(`Unknown notification endpoint type: ${endpoint.type}`);
          }
        } catch (endpointError) {
          logger.error(`Error sending notification to endpoint ${endpoint.type}: ${endpointError.message}`);
        }
      }
      
      return {
        success: sentTo.length > 0,
        sentTo
      };
    } catch (error) {
      logger.error(`Error sending notification: ${error.message}`);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * Get all current insights
   * 
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Array<Object>>} Matching insights
   */
  async getInsights(filters = {}) {
    try {
      let results = [...this.evolutionData.insights];
      
      // Apply filters
      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          results = results.filter(insight => filters.priority.includes(insight.priority));
        } else {
          results = results.filter(insight => insight.priority === filters.priority);
        }
      }
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          results = results.filter(insight => filters.status.includes(insight.status));
        } else {
          results = results.filter(insight => insight.status === filters.status);
        }
      }
      
      if (filters.category) {
        results = results.filter(insight => insight.category === filters.category);
      }
      
      if (filters.text) {
        const textPattern = new RegExp(filters.text, 'i');
        results = results.filter(insight => 
          textPattern.test(insight.description) || 
          textPattern.test(insight.details?.summary || '')
        );
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        results = results.filter(insight => {
          const discoveredDate = new Date(insight.discovered);
          return (!start || discoveredDate >= new Date(start)) && 
                 (!end || discoveredDate <= new Date(end));
        });
      }
      
      // Sort results
      if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortDirection = filters.sortDirection === 'asc' ? 1 : -1;
        
        results.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortDirection;
          if (a[sortField] > b[sortField]) return 1 * sortDirection;
          return 0;
        });
      } else {
        // Default sort by priority (highest first) then discovery date (newest first)
        results.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return new Date(b.discovered) - new Date(a.discovered);
        });
      }
      
      // Apply pagination
      if (filters.limit) {
        const limit = parseInt(filters.limit);
        const offset = filters.offset ? parseInt(filters.offset) : 0;
        results = results.slice(offset, offset + limit);
      }
      
      return results;
    } catch (error) {
      logger.error(`Error getting insights: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a specific insight by ID
   * 
   * @param {string} insightId - Insight ID
   * @returns {Promise<Object>} Insight or null if not found
   */
  async getInsight(insightId) {
    try {
      const insight = this.evolutionData.insights.find(insight => insight.id === insightId);
      return insight || null;
    } catch (error) {
      logger.error(`Error getting insight ${insightId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update insight status
   * 
   * @param {string} insightId - Insight ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated insight
   */
  async updateInsightStatus(insightId, updateData) {
    try {
      // Find insight
      const insightIndex = this.evolutionData.insights.findIndex(insight => insight.id === insightId);
      
      if (insightIndex === -1) {
        throw new Error(`Insight ${insightId} not found`);
      }
      
      // Get current insight
      const insight = { ...this.evolutionData.insights[insightIndex] };
      
      // Update insight data
      Object.assign(insight, updateData);
      
      // If status is changing to implemented, add implementation timestamp
      if (
        updateData.status && 
        updateData.status === this.evolutionStatus.IMPLEMENTED &&
        this.evolutionData.insights[insightIndex].status !== this.evolutionStatus.IMPLEMENTED
      ) {
        insight.implementedAt = new Date().toISOString();
        
        // Update statistics
        this.evolutionData.statistics.recommendationsImplemented++;
      }
      
      // Update insight in array
      this.evolutionData.insights[insightIndex] = insight;
      
      // Save changes
      await this._saveEvolutionData();
      
      logger.info(`Updated insight ${insightId} status to ${updateData.status || insight.status}`);
      
      return insight;
    } catch (error) {
      logger.error(`Error updating insight status: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get evolution statistics
   * 
   * @param {Object} options - Options for statistics
   * @returns {Promise<Object>} Evolution statistics
   */
  async getStatistics(options = {}) {
    try {
      // Basic statistics
      const stats = { ...this.evolutionData.statistics };
      
      // Calculate additional statistics
      const insights = this.evolutionData.insights;
      
      // Open insights by priority
      stats.openInsightsByPriority = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      };
      
      const openStatuses = [
        this.evolutionStatus.PROPOSED,
        this.evolutionStatus.RESEARCHING,
        this.evolutionStatus.DESIGNING
      ];
      
      for (const insight of insights) {
        if (openStatuses.includes(insight.status) && stats.openInsightsByPriority[insight.priority] !== undefined) {
          stats.openInsightsByPriority[insight.priority]++;
        }
      }
      
      // Insights by category
      const insightCategories = {};
      for (const insight of insights) {
        if (!insightCategories[insight.category]) {
          insightCategories[insight.category] = 0;
        }
        insightCategories[insight.category]++;
      }
      stats.insightsByCategory = insightCategories;
      
      // Calculate time to implementation
      if (options.calculateImplementationTime) {
        const implementedInsights = insights.filter(insight => insight.implementedAt);
        if (implementedInsights.length > 0) {
          let totalImplementationTime = 0;
          for (const insight of implementedInsights) {
            const discoveredTime = new Date(insight.discovered).getTime();
            const implementedTime = new Date(insight.implementedAt).getTime();
            totalImplementationTime += implementedTime - discoveredTime;
          }
          stats.averageImplementationTimeMs = Math.round(totalImplementationTime / implementedInsights.length);
          stats.averageImplementationTimeDays = Math.round(stats.averageImplementationTimeMs / (1000 * 60 * 60 * 24) * 10) / 10;
        }
      }
      
      // Calculate recent insight trends if requested
      if (options.calculateTrends) {
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        // Insights by day
        const insightsByDay = {};
        for (let i = 0; i < 90; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateString = date.toISOString().split('T')[0];
          insightsByDay[dateString] = 0;
        }
        
        // Count insights by day
        for (const insight of insights) {
          const insightDate = new Date(insight.discovered);
          if (insightDate >= ninetyDaysAgo) {
            const dateString = insightDate.toISOString().split('T')[0];
            if (insightsByDay[dateString] !== undefined) {
              insightsByDay[dateString]++;
            }
          }
        }
        
        stats.insightsByDay = insightsByDay;
        
        // Implementation success rate over time
        const implementationRatesByMonth = {};
        const implementedInsights = insights.filter(insight => insight.implementedAt);
        
        for (const insight of implementedInsights) {
          const implementedDate = new Date(insight.implementedAt);
          const monthYear = `${implementedDate.getFullYear()}-${String(implementedDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!implementationRatesByMonth[monthYear]) {
            implementationRatesByMonth[monthYear] = {
              implemented: 0,
              total: 0
            };
          }
          
          implementationRatesByMonth[monthYear].implemented++;
        }
        
        // Count all insights by discovery month
        for (const insight of insights) {
          const discoveredDate = new Date(insight.discovered);
          const monthYear = `${discoveredDate.getFullYear()}-${String(discoveredDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!implementationRatesByMonth[monthYear]) {
            implementationRatesByMonth[monthYear] = {
              implemented: 0,
              total: 0
            };
          }
          
          implementationRatesByMonth[monthYear].total++;
        }
        
        // Calculate rates
        for (const monthYear in implementationRatesByMonth) {
          const data = implementationRatesByMonth[monthYear];
          data.rate = data.total > 0 ? data.implemented / data.total : 0;
        }
        
        stats.implementationRatesByMonth = implementationRatesByMonth;
      }
      
      // Add generated agents statistics
      stats.generatedAgentsByType = {};
      for (const agent of this.evolutionData.generatedAgents) {
        if (!stats.generatedAgentsByType[agent.type]) {
          stats.generatedAgentsByType[agent.type] = 0;
        }
        stats.generatedAgentsByType[agent.type]++;
      }
      
      // Add basic agent info
      stats.agent = {
        name: this.name,
        type: this.evolutionType,
        lastAnalysis: this.evolutionData.lastAnalysis,
        schedule: this.evolutionSchedule
      };
      
      return stats;
    } catch (error) {
      logger.error(`Error getting statistics: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate an evolution report
   * 
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Generated report
   */
  async generateReport(options = {}) {
    try {
      const format = options.format || 'json';
      
      // Get statistics
      const stats = await this.getStatistics({
        calculateImplementationTime: true,
        calculateTrends: true
      });
      
      // Get open insights, sorted by priority (highest first)
      const priorityOrder = {
        'critical': 0,
        'high': 1,
        'medium': 2,
        'low': 3,
        'info': 4
      };
      
      const openInsights = await this.getInsights({
        status: [
          this.evolutionStatus.PROPOSED,
          this.evolutionStatus.RESEARCHING,
          this.evolutionStatus.DESIGNING
        ]
      });
      
      // Get recent analyses
      const recentAnalyses = [...this.evolutionData.analyses]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
      // Get recent trends
      const recentTrends = [...this.evolutionData.trends]
        .sort((a, b) => new Date(b.discovered) - new Date(a.discovered))
        .slice(0, 10);
      
      // Create report data
      const reportData = {
        agent: {
          name: this.name,
          type: this.evolutionType,
          lastAnalysis: this.evolutionData.lastAnalysis
        },
        timestamp: new Date().toISOString(),
        statistics: stats,
        openInsightCount: openInsights.length,
        criticalInsightCount: openInsights.filter(i => i.priority === 'critical').length,
        highInsightCount: openInsights.filter(i => i.priority === 'high').length,
        openInsights: openInsights.slice(0, 20), // Limit to top 20
        recentAnalyses,
        recentTrends,
        generatedAgents: this.evolutionData.generatedAgents.slice(0, 10) // Limit to top 10
      };
      
      // Format the report
      let formattedReport;
      
      switch (format) {
        case 'json':
          formattedReport = reportData;
          break;
          
        case 'text':
          formattedReport = this._formatReportAsText(reportData);
          break;
          
        case 'markdown':
          formattedReport = this._formatReportAsMarkdown(reportData);
          break;
          
        default:
          formattedReport = reportData;
      }
      
      return {
        format,
        timestamp: reportData.timestamp,
        data: formattedReport
      };
    } catch (error) {
      logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Format a report as plain text
   * 
   * @param {Object} reportData - Report data
   * @returns {string} Formatted report
   * @private
   */
  _formatReportAsText(reportData) {
    let text = `${this.name} Evolution Report\n`;
    text += `Generated: ${reportData.timestamp}\n`;
    text += `Last Analysis: ${reportData.agent.lastAnalysis}\n\n`;
    
    text += `SUMMARY\n`;
    text += `- Total Insights: ${reportData.statistics.insightsDiscovered}\n`;
    text += `- Open Insights: ${reportData.openInsightCount}\n`;
    text += `- Critical Insights: ${reportData.criticalInsightCount}\n`;
    text += `- High-Priority Insights: ${reportData.highInsightCount}\n`;
    text += `- Recommendations Implemented: ${reportData.statistics.recommendationsImplemented}\n`;
    text += `- Agents Generated: ${reportData.statistics.agentsGenerated}\n`;
    
    if (reportData.statistics.averageImplementationTimeDays) {
      text += `- Avg. Implementation Time: ${reportData.statistics.averageImplementationTimeDays} days\n`;
    }
    
    text += `\nOPEN INSIGHTS\n`;
    if (reportData.openInsights.length === 0) {
      text += `No open insights.\n`;
    } else {
      for (const insight of reportData.openInsights) {
        text += `[${insight.priority.toUpperCase()}] ${insight.description}\n`;
        text += `  Category: ${insight.category}\n`;
        text += `  Discovered: ${insight.discovered}\n`;
        text += `  Status: ${insight.status}\n\n`;
      }
    }
    
    text += `\nRECENT TRENDS\n`;
    if (reportData.recentTrends.length === 0) {
      text += `No recent trends.\n`;
    } else {
      for (const trend of reportData.recentTrends) {
        text += `[${trend.discovered}] ${trend.name}: ${trend.description}\n`;
      }
    }
    
    text += `\nGENERATED AGENTS\n`;
    if (reportData.generatedAgents.length === 0) {
      text += `No agents generated.\n`;
    } else {
      for (const agent of reportData.generatedAgents) {
        text += `[${agent.timestamp}] ${agent.name} (${agent.type}): ${agent.description}\n`;
      }
    }
    
    return text;
  }
  
  /**
   * Format a report as markdown
   * 
   * @param {Object} reportData - Report data
   * @returns {string} Formatted report
   * @private
   */
  _formatReportAsMarkdown(reportData) {
    let md = `# ${this.name} Evolution Report\n\n`;
    md += `**Generated:** ${reportData.timestamp}  \n`;
    md += `**Last Analysis:** ${reportData.agent.lastAnalysis}\n\n`;
    
    md += `## Summary\n\n`;
    md += `- **Total Insights:** ${reportData.statistics.insightsDiscovered}\n`;
    md += `- **Open Insights:** ${reportData.openInsightCount}\n`;
    md += `- **Critical Insights:** ${reportData.criticalInsightCount}\n`;
    md += `- **High-Priority Insights:** ${reportData.highInsightCount}\n`;
    md += `- **Recommendations Implemented:** ${reportData.statistics.recommendationsImplemented}\n`;
    md += `- **Agents Generated:** ${reportData.statistics.agentsGenerated}\n`;
    
    if (reportData.statistics.averageImplementationTimeDays) {
      md += `- **Avg. Implementation Time:** ${reportData.statistics.averageImplementationTimeDays} days\n`;
    }
    
    md += `\n## Open Insights\n\n`;
    if (reportData.openInsights.length === 0) {
      md += `No open insights.\n`;
    } else {
      md += `| Priority | Insight | Category | Status |\n`;
      md += `| -------- | ------- | -------- | ------ |\n`;
      
      for (const insight of reportData.openInsights) {
        md += `| ${insight.priority.toUpperCase()} | ${insight.description} | ${insight.category} | ${insight.status} |\n`;
      }
    }
    
    md += `\n## Recent Trends\n\n`;
    if (reportData.recentTrends.length === 0) {
      md += `No recent trends.\n`;
    } else {
      md += `| Date | Trend | Description |\n`;
      md += `| ---- | ----- | ----------- |\n`;
      
      for (const trend of reportData.recentTrends) {
        md += `| ${trend.discovered.split('T')[0]} | **${trend.name}** | ${trend.description} |\n`;
      }
    }
    
    md += `\n## Generated Agents\n\n`;
    if (reportData.generatedAgents.length === 0) {
      md += `No agents generated.\n`;
    } else {
      md += `| Date | Agent | Type | Description |\n`;
      md += `| ---- | ----- | ---- | ----------- |\n`;
      
      for (const agent of reportData.generatedAgents) {
        md += `| ${agent.timestamp.split('T')[0]} | **${agent.name}** | ${agent.type} | ${agent.description} |\n`;
      }
    }
    
    if (reportData.statistics.implementationRatesByMonth) {
      md += `\n## Implementation Rates\n\n`;
      md += `| Month | Rate | Implemented / Total |\n`;
      md += `| ----- | ---- | ------------------- |\n`;
      
      const sortedMonths = Object.keys(reportData.statistics.implementationRatesByMonth).sort().reverse();
      
      for (const month of sortedMonths) {
        const data = reportData.statistics.implementationRatesByMonth[month];
        md += `| ${month} | ${(data.rate * 100).toFixed(1)}% | ${data.implemented} / ${data.total} |\n`;
      }
    }
    
    return md;
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing ${this.name} Evolution task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'run_analysis':
        return await this.runEvolutionAnalysis(task.parameters);
        
      case 'get_insights':
        return await this.getInsights(task.parameters);
        
      case 'get_insight':
        return await this.getInsight(task.parameters.insightId);
        
      case 'update_insight':
        return await this.updateInsightStatus(
          task.parameters.insightId,
          task.parameters.updateData
        );
        
      case 'get_statistics':
        return await this.getStatistics(task.parameters);
        
      case 'generate_report':
        return await this.generateReport(task.parameters);
        
      case 'develop_agent':
        return await this._developAgent(task.parameters.insight);
        
      case 'initialize':
        return await this.initialize();
        
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
  
  /**
   * Process a message.
   * 
   * @param {object} message - The message to process
   * @private
   */
  _processMessage(message) {
    if (message.messageType === 'analysis_request') {
      const task = this.createTask(
        'run_analysis',
        `Run ${this.name} evolution analysis`,
        message.content
      );
      
      this.submitTask(task);
      
      // Log the analysis request for debugging
      logger.info(`Received analysis request for ${this.name} Evolution Agent`);
    } else if (message.messageType === 'report_request') {
      const task = this.createTask(
        'generate_report',
        `Generate ${this.name} evolution report`,
        message.content
      );
      
      this.submitTask(task);
      
      // Log the report request for debugging
      logger.info(`Received report request for ${this.name} Evolution Agent`);
    } else if (message.messageType === 'develop_agent_request') {
      const task = this.createTask(
        'develop_agent',
        `Develop agent from insight ${message.content.insightId}`,
        message.content
      );
      
      this.submitTask(task);
      
      // Log the development request for debugging
      logger.info(`Received agent development request for insight ${message.content.insightId}`);
    } else {
      super._processMessage(message);
    }
  }
  
  /**
   * Stop the agent and clean up resources
   */
  async stop() {
    logger.info(`Stopping ${this.name} Evolution Agent`);
    
    // Clear evolution schedule
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
    }
    
    // Save any pending changes
    await this._saveEvolutionData();
    
    await super.stop();
  }
}

module.exports = BaseEvolutionAgent;