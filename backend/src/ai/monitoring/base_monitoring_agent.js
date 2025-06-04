/**
 * Base Monitoring Agent
 * 
 * This agent provides core functionality for monitoring database health,
 * data integrity, and system performance. It identifies issues, logs them,
 * and can take corrective actions for certain problems.
 */

const Agent = require('../agent');
const logger = require("../utils/logger");
const path = require('path');
const fs = require('fs').promises;
const AIAdapter = require('../../adapters/ai-adapter');

class BaseMonitoringAgent extends Agent {
  /**
   * Create a new monitoring agent
   * 
   * @param {string} name - Agent name
   * @param {string} monitoringType - Type of monitoring (e.g., 'data_integrity', 'performance')
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(name, monitoringType, config, mcpConnector) {
    super(`${name.toLowerCase()}_monitoring`, 'monitoring', mcpConnector);
    
    this.name = name;
    this.monitoringType = monitoringType;
    this.config = config || {};
    
    // Configure data storage
    this.dataDirectory = this.config.dataDirectory || 
      path.join(__dirname, `../../data/monitoring/${name.toLowerCase()}`);
    
    // Initialize AI adapter for analysis
    this.ai = new AIAdapter();
    
    // Initialize monitoring data
    this.monitoringData = {
      issues: [],
      statistics: {},
      lastScan: null,
      checks: {},
      alerts: [],
      autoFixes: [],
      lastUpdated: null
    };
    
    // Define issue severity levels
    this.severityLevels = {
      CRITICAL: 'critical',   // Severe, immediate action required
      HIGH: 'high',           // Important, needs quick action
      MEDIUM: 'medium',       // Notable issue to address
      LOW: 'low',             // Minor issue to fix when convenient
      INFO: 'info'            // Informational, no action needed
    };
    
    // Define issue status values
    this.issueStatus = {
      NEW: 'new',             // Newly identified issue
      INVESTIGATING: 'investigating', // Under investigation
      IN_PROGRESS: 'in_progress', // Fix in progress
      FIXED: 'fixed',         // Issue has been fixed
      IGNORED: 'ignored',     // Deliberately ignored
      AUTOMATED: 'automated'  // Automatically fixed
    };
    
    // Default monitoring schedule (hourly)
    this.monitoringSchedule = this.config.schedule || {
      frequency: 'hourly',
      timeUnit: 'hour',
      interval: 1
    };
    
    // Monitoring configuration
    this.monitoringConfig = {
      // Maximum number of issues to retain
      maxIssueHistory: this.config.maxIssueHistory || 1000,
      
      // Auto-fix configurations
      autoFix: this.config.autoFix !== undefined ? this.config.autoFix : true,
      autoFixTypes: this.config.autoFixTypes || ['missing_reference', 'null_value', 'duplicate_entry'],
      
      // Alert configurations
      alertThreshold: this.config.alertThreshold || this.severityLevels.HIGH,
      alertEndpoints: this.config.alertEndpoints || [],

      // Check configurations
      enabledChecks: this.config.enabledChecks || ['all'],
      disabledChecks: this.config.disabledChecks || [],
      
      // Retention policy
      retentionDays: this.config.retentionDays || 30
    };
    
    // Initialize tasks queue
    this.taskQueue = [];
    
    // Last run timestamps
    this.lastRunTimestamps = {};
    
    logger.info(`${name} Monitoring Agent initialized`);
  }
  
  /**
   * Initialize the agent
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info(`Initializing ${this.name} Monitoring Agent`);
      
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDirectory, { recursive: true });
      
      // Load existing monitoring data if available
      await this._loadMonitoringData();
      
      // Start the agent
      await super.start();
      
      // Set up monitoring schedule
      this._setupMonitoringSchedule();
      
      logger.info(`${this.name} Monitoring Agent initialized successfully`);
      return true;
    } catch (error) {
      logger.error(`Error initializing ${this.name} Monitoring Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load existing monitoring data
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _loadMonitoringData() {
    try {
      const monitoringDataPath = path.join(this.dataDirectory, 'monitoring_data.json');
      
      try {
        const data = await fs.readFile(monitoringDataPath, 'utf8');
        this.monitoringData = JSON.parse(data);
        logger.info(`Loaded ${this.monitoringData.issues.length} monitoring issues for ${this.name}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.info(`No existing monitoring data found for ${this.name}, creating new dataset`);
          this._initializeEmptyMonitoringData();
          await this._saveMonitoringData();
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error(`Error loading monitoring data: ${error.message}`);
      this._initializeEmptyMonitoringData();
    }
  }
  
  /**
   * Initialize empty monitoring data structure
   * 
   * @private
   */
  _initializeEmptyMonitoringData() {
    this.monitoringData = {
      issues: [],
      statistics: {
        totalScans: 0,
        totalIssuesIdentified: 0,
        totalIssuesResolved: 0,
        issuesBySeverity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        },
        autoFixAttempts: 0,
        autoFixSuccesses: 0
      },
      lastScan: null,
      checks: {},
      alerts: [],
      autoFixes: [],
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Save monitoring data to disk
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _saveMonitoringData() {
    try {
      const monitoringDataPath = path.join(this.dataDirectory, 'monitoring_data.json');
      
      // Update last modified timestamp
      this.monitoringData.lastUpdated = new Date().toISOString();
      
      // Save to disk
      await fs.writeFile(
        monitoringDataPath,
        JSON.stringify(this.monitoringData, null, 2),
        'utf8'
      );
      
      logger.info(`Saved monitoring data for ${this.name}`);
    } catch (error) {
      logger.error(`Error saving monitoring data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Set up monitoring schedule
   * 
   * @private
   */
  _setupMonitoringSchedule() {
    // Convert schedule to milliseconds
    let interval;
    switch (this.monitoringSchedule.timeUnit) {
      case 'minute':
        interval = this.monitoringSchedule.interval * 60 * 1000;
        break;
      case 'hour':
        interval = this.monitoringSchedule.interval * 60 * 60 * 1000;
        break;
      case 'day':
        interval = this.monitoringSchedule.interval * 24 * 60 * 60 * 1000;
        break;
      default:
        interval = 60 * 60 * 1000; // Default to hourly
    }
    
    // Schedule the monitoring task
    this.monitoringInterval = setInterval(() => {
      this.runMonitoringScan();
    }, interval);
    
    logger.info(`Monitoring schedule set up for ${this.name}: every ${this.monitoringSchedule.interval} ${this.monitoringSchedule.timeUnit}(s)`);
  }
  
  /**
   * Run a monitoring scan
   * 
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Scan results
   */
  async runMonitoringScan(options = {}) {
    try {
      logger.info(`Running monitoring scan for ${this.name}`);
      
      const startTime = Date.now();
      let newIssues = [];
      
      // Update scan statistics
      this.monitoringData.statistics.totalScans++;
      this.monitoringData.lastScan = new Date().toISOString();
      
      // Run the scan (to be implemented by subclasses)
      const scanResults = await this._performScan(options);
      
      if (scanResults && scanResults.issues) {
        // Process and add new issues
        newIssues = scanResults.issues;
        
        // Update statistics
        this.monitoringData.statistics.totalIssuesIdentified += newIssues.length;
        
        // Add issues to the database
        for (const issue of newIssues) {
          // Add timestamp and ID if not present
          issue.detected = issue.detected || new Date().toISOString();
          issue.id = issue.id || `${this.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
          issue.status = issue.status || this.issueStatus.NEW;
          
          // Update severity counts
          if (issue.severity && this.monitoringData.statistics.issuesBySeverity[issue.severity] !== undefined) {
            this.monitoringData.statistics.issuesBySeverity[issue.severity]++;
          }
          
          // Add to issues array
          this.monitoringData.issues.push(issue);
        }
        
        // Limit issue history if needed
        if (this.monitoringData.issues.length > this.monitoringConfig.maxIssueHistory) {
          // Remove oldest resolved issues first
          const resolvedIssues = this.monitoringData.issues.filter(issue => 
            issue.status === this.issueStatus.FIXED ||
            issue.status === this.issueStatus.IGNORED ||
            issue.status === this.issueStatus.AUTOMATED
          );
          
          if (resolvedIssues.length > 0) {
            // Sort by detection date, oldest first
            resolvedIssues.sort((a, b) => new Date(a.detected) - new Date(b.detected));
            
            // Calculate how many to remove
            const removeCount = Math.min(
              resolvedIssues.length,
              this.monitoringData.issues.length - this.monitoringConfig.maxIssueHistory
            );
            
            if (removeCount > 0) {
              // Get IDs to remove
              const idsToRemove = resolvedIssues.slice(0, removeCount).map(issue => issue.id);
              
              // Filter out these issues
              this.monitoringData.issues = this.monitoringData.issues.filter(issue => 
                !idsToRemove.includes(issue.id)
              );
              
              logger.info(`Removed ${removeCount} old resolved issues to maintain history limit`);
            }
          }
        }
        
        // Auto-fix issues if enabled
        if (this.monitoringConfig.autoFix) {
          const autoFixableIssues = newIssues.filter(issue => 
            this.monitoringConfig.autoFixTypes.includes(issue.type) &&
            issue.autoFixable === true
          );
          
          if (autoFixableIssues.length > 0) {
            logger.info(`Attempting to auto-fix ${autoFixableIssues.length} issues`);
            
            for (const issue of autoFixableIssues) {
              this.monitoringData.statistics.autoFixAttempts++;
              
              try {
                // Attempt auto-fix (to be implemented by subclasses)
                const fixResult = await this._attemptAutoFix(issue);
                
                if (fixResult && fixResult.success) {
                  // Update issue status
                  const issueIndex = this.monitoringData.issues.findIndex(i => i.id === issue.id);
                  if (issueIndex !== -1) {
                    this.monitoringData.issues[issueIndex].status = this.issueStatus.AUTOMATED;
                    this.monitoringData.issues[issueIndex].resolvedAt = new Date().toISOString();
                    this.monitoringData.issues[issueIndex].resolution = fixResult.resolution || 'Auto-fixed';
                  }
                  
                  // Update statistics
                  this.monitoringData.statistics.autoFixSuccesses++;
                  this.monitoringData.statistics.totalIssuesResolved++;
                  
                  // Add to auto-fixes history
                  this.monitoringData.autoFixes.push({
                    issueId: issue.id,
                    timestamp: new Date().toISOString(),
                    issueType: issue.type,
                    entity: issue.entity,
                    resolution: fixResult.resolution
                  });
                  
                  logger.info(`Successfully auto-fixed issue ${issue.id}: ${issue.entity}`);
                }
              } catch (error) {
                logger.error(`Error attempting to auto-fix issue ${issue.id}: ${error.message}`);
              }
            }
          }
        }
        
        // Trigger alerts for high-severity issues
        const alertableIssues = newIssues.filter(issue => 
          this._isHigherOrEqualSeverity(issue.severity, this.monitoringConfig.alertThreshold)
        );
        
        if (alertableIssues.length > 0) {
          logger.info(`Generating alerts for ${alertableIssues.length} high-severity issues`);
          
          for (const issue of alertableIssues) {
            // Create alert
            const alert = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              issueId: issue.id,
              timestamp: new Date().toISOString(),
              severity: issue.severity,
              message: `${issue.severity.toUpperCase()} issue detected: ${issue.description}`,
              context: {
                entity: issue.entity,
                type: issue.type,
                source: issue.source
              },
              sent: false,
              sentTo: []
            };
            
            // Add to alerts history
            this.monitoringData.alerts.push(alert);
            
            // Send alerts (to be implemented by subclasses)
            try {
              const alertResult = await this._sendAlert(alert);
              
              if (alertResult && alertResult.success) {
                // Update alert status
                const alertIndex = this.monitoringData.alerts.findIndex(a => a.id === alert.id);
                if (alertIndex !== -1) {
                  this.monitoringData.alerts[alertIndex].sent = true;
                  this.monitoringData.alerts[alertIndex].sentTo = alertResult.sentTo || [];
                  this.monitoringData.alerts[alertIndex].sentAt = new Date().toISOString();
                }
              }
            } catch (error) {
              logger.error(`Error sending alert for issue ${issue.id}: ${error.message}`);
            }
          }
        }
      }
      
      // Update check statistics if provided
      if (scanResults && scanResults.checkStats) {
        for (const [checkName, stats] of Object.entries(scanResults.checkStats)) {
          this.monitoringData.checks[checkName] = {
            ...this.monitoringData.checks[checkName] || {},
            ...stats,
            lastRun: new Date().toISOString()
          };
        }
      }
      
      // Save monitoring data
      await this._saveMonitoringData();
      
      const scanDuration = Date.now() - startTime;
      logger.info(`Monitoring scan for ${this.name} completed in ${scanDuration}ms. Found ${newIssues.length} new issues.`);
      
      return {
        scanTime: this.monitoringData.lastScan,
        duration: scanDuration,
        newIssues: newIssues.length,
        autoFixed: this.monitoringConfig.autoFix ? 
          this.monitoringData.statistics.autoFixSuccesses : undefined,
        checks: Object.keys(scanResults.checkStats || {}).length
      };
    } catch (error) {
      logger.error(`Error during monitoring scan for ${this.name}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Perform a monitoring scan (to be implemented by subclasses)
   * 
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Scan results
   * @private
   */
  async _performScan(options) {
    // Base implementation - should be overridden by subclasses
    throw new Error('_performScan must be implemented by subclasses');
  }
  
  /**
   * Attempt to automatically fix an issue (to be implemented by subclasses)
   * 
   * @param {Object} issue - Issue to fix
   * @returns {Promise<Object>} Fix result
   * @private
   */
  async _attemptAutoFix(issue) {
    // Base implementation - should be overridden by subclasses
    throw new Error('_attemptAutoFix must be implemented by subclasses');
  }
  
  /**
   * Send an alert for a high-severity issue (to be implemented by subclasses)
   * 
   * @param {Object} alert - Alert to send
   * @returns {Promise<Object>} Alert result
   * @private
   */
  async _sendAlert(alert) {
    // Base implementation - should be overridden by subclasses
    logger.warn(`Alert sending not implemented for ${this.name} Monitoring Agent`);
    return { success: false, message: 'Not implemented' };
  }
  
  /**
   * Get all current issues
   * 
   * @param {Object} filters - Filters to apply
   * @returns {Promise<Array<Object>>} Matching issues
   */
  async getIssues(filters = {}) {
    try {
      let results = [...this.monitoringData.issues];
      
      // Apply filters
      if (filters.severity) {
        results = results.filter(issue => issue.severity === filters.severity);
      }
      
      if (filters.status) {
        results = results.filter(issue => issue.status === filters.status);
      }
      
      if (filters.type) {
        results = results.filter(issue => issue.type === filters.type);
      }
      
      if (filters.entity) {
        const entityPattern = new RegExp(filters.entity, 'i');
        results = results.filter(issue => entityPattern.test(issue.entity));
      }
      
      if (filters.source) {
        const sourcePattern = new RegExp(filters.source, 'i');
        results = results.filter(issue => sourcePattern.test(issue.source));
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        results = results.filter(issue => {
          const detectedDate = new Date(issue.detected);
          return (!start || detectedDate >= new Date(start)) && 
                 (!end || detectedDate <= new Date(end));
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
        // Default sort by detection date (newest first)
        results.sort((a, b) => new Date(b.detected) - new Date(a.detected));
      }
      
      // Apply pagination
      if (filters.limit) {
        const limit = parseInt(filters.limit);
        const offset = filters.offset ? parseInt(filters.offset) : 0;
        results = results.slice(offset, offset + limit);
      }
      
      return results;
    } catch (error) {
      logger.error(`Error getting issues: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a specific issue by ID
   * 
   * @param {string} issueId - Issue ID
   * @returns {Promise<Object>} Issue or null if not found
   */
  async getIssue(issueId) {
    try {
      const issue = this.monitoringData.issues.find(issue => issue.id === issueId);
      return issue || null;
    } catch (error) {
      logger.error(`Error getting issue ${issueId}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update issue status
   * 
   * @param {string} issueId - Issue ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated issue
   */
  async updateIssueStatus(issueId, updateData) {
    try {
      // Find issue
      const issueIndex = this.monitoringData.issues.findIndex(issue => issue.id === issueId);
      
      if (issueIndex === -1) {
        throw new Error(`Issue ${issueId} not found`);
      }
      
      // Get current issue
      const issue = { ...this.monitoringData.issues[issueIndex] };
      
      // Update issue data
      Object.assign(issue, updateData);
      
      // If status is changing to a resolved state, add resolution timestamp
      const resolvedStatuses = [
        this.issueStatus.FIXED,
        this.issueStatus.IGNORED,
        this.issueStatus.AUTOMATED
      ];
      
      if (
        updateData.status && 
        resolvedStatuses.includes(updateData.status) &&
        !resolvedStatuses.includes(this.monitoringData.issues[issueIndex].status)
      ) {
        issue.resolvedAt = new Date().toISOString();
        
        // Update statistics
        this.monitoringData.statistics.totalIssuesResolved++;
      }
      
      // Update issue in array
      this.monitoringData.issues[issueIndex] = issue;
      
      // Save changes
      await this._saveMonitoringData();
      
      logger.info(`Updated issue ${issueId} status to ${updateData.status || issue.status}`);
      
      return issue;
    } catch (error) {
      logger.error(`Error updating issue status: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get monitoring statistics
   * 
   * @param {Object} options - Options for statistics
   * @returns {Promise<Object>} Monitoring statistics
   */
  async getStatistics(options = {}) {
    try {
      // Basic statistics
      const stats = { ...this.monitoringData.statistics };
      
      // Calculate additional statistics
      const issues = this.monitoringData.issues;
      
      // Open issues by severity
      stats.openIssuesBySeverity = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      };
      
      const openStatuses = [
        this.issueStatus.NEW,
        this.issueStatus.INVESTIGATING,
        this.issueStatus.IN_PROGRESS
      ];
      
      for (const issue of issues) {
        if (openStatuses.includes(issue.status) && stats.openIssuesBySeverity[issue.severity] !== undefined) {
          stats.openIssuesBySeverity[issue.severity]++;
        }
      }
      
      // Issues by type
      const issueTypes = {};
      for (const issue of issues) {
        if (!issueTypes[issue.type]) {
          issueTypes[issue.type] = 0;
        }
        issueTypes[issue.type]++;
      }
      stats.issuesByType = issueTypes;
      
      // Calculate average time to resolution
      if (options.calculateResolutionTime) {
        const resolvedIssues = issues.filter(issue => issue.resolvedAt);
        if (resolvedIssues.length > 0) {
          let totalResolutionTime = 0;
          for (const issue of resolvedIssues) {
            const detectedTime = new Date(issue.detected).getTime();
            const resolvedTime = new Date(issue.resolvedAt).getTime();
            totalResolutionTime += resolvedTime - detectedTime;
          }
          stats.averageResolutionTimeMs = Math.round(totalResolutionTime / resolvedIssues.length);
          stats.averageResolutionTimeHours = Math.round(stats.averageResolutionTimeMs / (1000 * 60 * 60) * 10) / 10;
        }
      }
      
      // Calculate recent issue trends if requested
      if (options.calculateTrends) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Issues by day
        const issuesByDay = {};
        for (let i = 0; i < 30; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateString = date.toISOString().split('T')[0];
          issuesByDay[dateString] = 0;
        }
        
        // Count issues by day
        for (const issue of issues) {
          const issueDate = new Date(issue.detected);
          if (issueDate >= thirtyDaysAgo) {
            const dateString = issueDate.toISOString().split('T')[0];
            if (issuesByDay[dateString] !== undefined) {
              issuesByDay[dateString]++;
            }
          }
        }
        
        stats.issuesByDay = issuesByDay;
      }
      
      // Add check statistics if requested
      if (options.includeChecks) {
        stats.checks = this.monitoringData.checks;
      }
      
      // Add basic agent info
      stats.agent = {
        name: this.name,
        type: this.monitoringType,
        lastScan: this.monitoringData.lastScan,
        schedule: this.monitoringSchedule
      };
      
      return stats;
    } catch (error) {
      logger.error(`Error getting statistics: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a monitoring report
   * 
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Generated report
   */
  async generateReport(options = {}) {
    try {
      const format = options.format || 'json';
      
      // Get statistics
      const stats = await this.getStatistics({
        calculateResolutionTime: true,
        calculateTrends: true,
        includeChecks: true
      });
      
      // Get open issues, sorted by severity (highest first)
      const severityOrder = {
        [this.severityLevels.CRITICAL]: 0,
        [this.severityLevels.HIGH]: 1,
        [this.severityLevels.MEDIUM]: 2,
        [this.severityLevels.LOW]: 3,
        [this.severityLevels.INFO]: 4
      };
      
      const openIssues = await this.getIssues({
        status: [
          this.issueStatus.NEW,
          this.issueStatus.INVESTIGATING,
          this.issueStatus.IN_PROGRESS
        ]
      });
      
      openIssues.sort((a, b) => {
        // First by severity
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        
        // Then by detection date (oldest first)
        return new Date(a.detected) - new Date(b.detected);
      });
      
      // Get recent alerts
      const recentAlerts = [...this.monitoringData.alerts]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
      // Get recent auto-fixes
      const recentAutoFixes = [...this.monitoringData.autoFixes]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
      // Create report data
      const reportData = {
        agent: {
          name: this.name,
          type: this.monitoringType,
          lastScan: this.monitoringData.lastScan
        },
        timestamp: new Date().toISOString(),
        statistics: stats,
        openIssueCount: openIssues.length,
        criticalIssueCount: openIssues.filter(i => i.severity === this.severityLevels.CRITICAL).length,
        highIssueCount: openIssues.filter(i => i.severity === this.severityLevels.HIGH).length,
        openIssues: openIssues.slice(0, 20), // Limit to top 20
        recentAlerts,
        recentAutoFixes
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
    let text = `${this.name} Monitoring Report\n`;
    text += `Generated: ${reportData.timestamp}\n`;
    text += `Last Scan: ${reportData.agent.lastScan}\n\n`;
    
    text += `SUMMARY\n`;
    text += `- Total Issues: ${reportData.statistics.totalIssuesIdentified}\n`;
    text += `- Open Issues: ${reportData.openIssueCount}\n`;
    text += `- Critical Issues: ${reportData.criticalIssueCount}\n`;
    text += `- High-Priority Issues: ${reportData.highIssueCount}\n`;
    text += `- Issues Resolved: ${reportData.statistics.totalIssuesResolved}\n`;
    
    if (reportData.statistics.averageResolutionTimeHours) {
      text += `- Avg. Resolution Time: ${reportData.statistics.averageResolutionTimeHours} hours\n`;
    }
    
    text += `\nOPEN ISSUES\n`;
    if (reportData.openIssues.length === 0) {
      text += `No open issues.\n`;
    } else {
      for (const issue of reportData.openIssues) {
        text += `[${issue.severity.toUpperCase()}] ${issue.description}\n`;
        text += `  Entity: ${issue.entity}\n`;
        text += `  Type: ${issue.type}\n`;
        text += `  Detected: ${issue.detected}\n`;
        text += `  Status: ${issue.status}\n\n`;
      }
    }
    
    text += `\nRECENT ALERTS\n`;
    if (reportData.recentAlerts.length === 0) {
      text += `No recent alerts.\n`;
    } else {
      for (const alert of reportData.recentAlerts) {
        text += `[${alert.timestamp}] ${alert.message}\n`;
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
    let md = `# ${this.name} Monitoring Report\n\n`;
    md += `**Generated:** ${reportData.timestamp}  \n`;
    md += `**Last Scan:** ${reportData.agent.lastScan}\n\n`;
    
    md += `## Summary\n\n`;
    md += `- **Total Issues:** ${reportData.statistics.totalIssuesIdentified}\n`;
    md += `- **Open Issues:** ${reportData.openIssueCount}\n`;
    md += `- **Critical Issues:** ${reportData.criticalIssueCount}\n`;
    md += `- **High-Priority Issues:** ${reportData.highIssueCount}\n`;
    md += `- **Issues Resolved:** ${reportData.statistics.totalIssuesResolved}\n`;
    
    if (reportData.statistics.averageResolutionTimeHours) {
      md += `- **Avg. Resolution Time:** ${reportData.statistics.averageResolutionTimeHours} hours\n`;
    }
    
    md += `\n## Open Issues\n\n`;
    if (reportData.openIssues.length === 0) {
      md += `No open issues.\n`;
    } else {
      md += `| Severity | Issue | Entity | Status |\n`;
      md += `| -------- | ----- | ------ | ------ |\n`;
      
      for (const issue of reportData.openIssues) {
        md += `| ${issue.severity.toUpperCase()} | ${issue.description} | ${issue.entity} | ${issue.status} |\n`;
      }
    }
    
    md += `\n## Recent Alerts\n\n`;
    if (reportData.recentAlerts.length === 0) {
      md += `No recent alerts.\n`;
    } else {
      md += `| Time | Message | Severity |\n`;
      md += `| ---- | ------- | -------- |\n`;
      
      for (const alert of reportData.recentAlerts) {
        md += `| ${alert.timestamp} | ${alert.message} | ${alert.severity} |\n`;
      }
    }
    
    if (reportData.recentAutoFixes.length > 0) {
      md += `\n## Recent Auto-Fixes\n\n`;
      md += `| Time | Entity | Resolution |\n`;
      md += `| ---- | ------ | ---------- |\n`;
      
      for (const fix of reportData.recentAutoFixes) {
        md += `| ${fix.timestamp} | ${fix.entity} | ${fix.resolution} |\n`;
      }
    }
    
    return md;
  }
  
  /**
   * Check if a severity level is higher than or equal to a threshold
   * 
   * @param {string} level - Severity level to check
   * @param {string} threshold - Threshold to compare against
   * @returns {boolean} Whether level is higher than or equal to threshold
   * @private
   */
  _isHigherOrEqualSeverity(level, threshold) {
    const severityOrder = {
      [this.severityLevels.CRITICAL]: 0,
      [this.severityLevels.HIGH]: 1,
      [this.severityLevels.MEDIUM]: 2,
      [this.severityLevels.LOW]: 3,
      [this.severityLevels.INFO]: 4
    };
    
    return severityOrder[level] <= severityOrder[threshold];
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing ${this.name} Monitoring task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'run_scan':
        return await this.runMonitoringScan(task.parameters);
        
      case 'get_issues':
        return await this.getIssues(task.parameters);
        
      case 'get_issue':
        return await this.getIssue(task.parameters.issueId);
        
      case 'update_issue':
        return await this.updateIssueStatus(
          task.parameters.issueId,
          task.parameters.updateData
        );
        
      case 'get_statistics':
        return await this.getStatistics(task.parameters);
        
      case 'generate_report':
        return await this.generateReport(task.parameters);
        
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
    if (message.messageType === 'scan_request') {
      const task = this.createTask(
        'run_scan',
        `Run ${this.name} monitoring scan`,
        message.content
      );
      
      this.submitTask(task);
      
      // Log the scan request for debugging
      logger.info(`Received scan request for ${this.name} Monitoring Agent`);
    } else if (message.messageType === 'report_request') {
      const task = this.createTask(
        'generate_report',
        `Generate ${this.name} monitoring report`,
        message.content
      );
      
      this.submitTask(task);
      
      // Log the report request for debugging
      logger.info(`Received report request for ${this.name} Monitoring Agent`);
    } else {
      super._processMessage(message);
    }
  }
  
  /**
   * Stop the agent and clean up resources
   */
  async stop() {
    logger.info(`Stopping ${this.name} Monitoring Agent`);
    
    // Clear monitoring schedule
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Save any pending changes
    await this._saveMonitoringData();
    
    await super.stop();
  }
}

module.exports = BaseMonitoringAgent;