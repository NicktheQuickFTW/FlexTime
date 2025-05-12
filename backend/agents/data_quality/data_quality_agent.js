/**
 * Data Quality Agent
 * 
 * This agent ensures data integrity, completeness, and consistency
 * throughout the FlexTime scheduling pipeline.
 */

const Agent = require('../agent');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const Ajv = require('ajv');
const { Client } = require('pg');

class DataQualityAgent extends Agent {
  /**
   * Initialize a new Data Quality Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions (optional)
   */
  constructor(config, mcpConnector = null) {
    super('data_quality', 'specialized', mcpConnector);
    
    this.config = {
      validationRules: config.validationRules || './config/validation_rules.json',
      remediationStrategies: config.remediationStrategies || './config/remediation_strategies.json',
      alertThresholds: config.alertThresholds || {
        warning: 90,
        error: 75,
        critical: 60
      },
      auditSchedule: config.auditSchedule || '0 0 * * *', // Daily at midnight
      dbConnectionString: config.dbConnectionString || process.env.NEON_DB_CONNECTION_STRING,
      ...config
    };
    
    // Initialize components
    this.validator = new Ajv({ allErrors: true });
    this.schemas = {};
    this.remediationStrategies = {};
    this.monitoringActive = false;
    this.dbClient = null;
    
    logger.info('Data Quality Agent initialized');
  }
  
  /**
   * Start the agent and initialize components
   */
  async start() {
    try {
      logger.info('Starting Data Quality Agent');
      
      // Connect to database
      await this.connectToDatabase();
      
      // Load validation schemas
      await this.loadValidationSchemas();
      
      // Load remediation strategies
      await this.loadRemediationStrategies();
      
      // Start the base agent
      await super.start();
      
      logger.info('Data Quality Agent started successfully');
      return true;
    } catch (error) {
      logger.error(`Error starting Data Quality Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Connect to the database
   */
  async connectToDatabase() {
    try {
      this.dbClient = new Client(this.config.dbConnectionString);
      await this.dbClient.connect();
      
      logger.info('Connected to database successfully');
    } catch (error) {
      logger.error(`Error connecting to database: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load validation schemas from configuration
   */
  async loadValidationSchemas() {
    try {
      let schemas;
      
      // Load schemas from file or config
      if (typeof this.config.validationRules === 'string') {
        const schemaPath = path.resolve(this.config.validationRules);
        const schemaData = await fs.readFile(schemaPath, 'utf8');
        schemas = JSON.parse(schemaData);
      } else {
        schemas = this.config.validationRules;
      }
      
      // Compile schemas with Ajv
      for (const [name, schema] of Object.entries(schemas)) {
        this.schemas[name] = this.validator.compile(schema);
      }
      
      logger.info(`Loaded ${Object.keys(this.schemas).length} validation schemas`);
    } catch (error) {
      logger.error(`Error loading validation schemas: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load remediation strategies from configuration
   */
  async loadRemediationStrategies() {
    try {
      let strategies;
      
      // Load strategies from file or config
      if (typeof this.config.remediationStrategies === 'string') {
        const strategiesPath = path.resolve(this.config.remediationStrategies);
        const strategiesData = await fs.readFile(strategiesPath, 'utf8');
        strategies = JSON.parse(strategiesData);
      } else {
        strategies = this.config.remediationStrategies;
      }
      
      this.remediationStrategies = strategies;
      
      logger.info(`Loaded ${Object.keys(this.remediationStrategies).length} remediation strategies`);
    } catch (error) {
      logger.error(`Error loading remediation strategies: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Start monitoring data quality
   */
  async startMonitoring() {
    try {
      if (this.monitoringActive) {
        logger.warn('Data quality monitoring is already active');
        return true;
      }
      
      logger.info('Starting data quality monitoring');
      
      // Set monitoring active flag
      this.monitoringActive = true;
      
      // Schedule initial data audit
      await this.scheduleNextAudit();
      
      // Set up event listeners for real-time validation
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      logger.error(`Error starting data quality monitoring: ${error.message}`);
      this.monitoringActive = false;
      return false;
    }
  }
  
  /**
   * Schedule the next data audit
   */
  async scheduleNextAudit() {
    try {
      // Parse the cron schedule
      const cronParts = this.config.auditSchedule.split(' ');
      
      // Calculate next run time
      // This is a simplified implementation - in production, use a proper cron parser
      const now = new Date();
      const nextRun = new Date(now);
      nextRun.setHours(parseInt(cronParts[1], 10) || 0);
      nextRun.setMinutes(parseInt(cronParts[0], 10) || 0);
      nextRun.setSeconds(0);
      
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      const delay = nextRun.getTime() - now.getTime();
      
      logger.info(`Scheduled next data audit for ${nextRun.toISOString()}`);
      
      // Schedule the audit
      setTimeout(() => {
        if (this.monitoringActive) {
          this.runDataAudit()
            .then(() => this.scheduleNextAudit())
            .catch(error => {
              logger.error(`Error running scheduled data audit: ${error.message}`);
              this.scheduleNextAudit();
            });
        }
      }, delay);
      
      return true;
    } catch (error) {
      logger.error(`Error scheduling next data audit: ${error.message}`);
      
      // Retry after 1 hour on failure
      setTimeout(() => {
        if (this.monitoringActive) {
          this.scheduleNextAudit();
        }
      }, 60 * 60 * 1000);
      
      return false;
    }
  }
  
  /**
   * Setup event listeners for real-time validation
   */
  setupEventListeners() {
    try {
      logger.info('Setting up data quality event listeners');
      
      // Add custom event listeners here for specific data events
      
      // Example event listeners
      if (this.communicationManager) {
        this.communicationManager.subscribe('data_create', this._handleDataCreateEvent.bind(this));
        this.communicationManager.subscribe('data_update', this._handleDataUpdateEvent.bind(this));
        this.communicationManager.subscribe('data_delete', this._handleDataDeleteEvent.bind(this));
      }
      
      logger.info('Data quality event listeners set up successfully');
    } catch (error) {
      logger.error(`Error setting up event listeners: ${error.message}`);
    }
  }
  
  /**
   * Run a comprehensive data audit
   */
  async runDataAudit() {
    try {
      logger.info('Starting comprehensive data audit');
      
      const startTime = Date.now();
      
      // Create a task for the audit
      const task = this.createTask(
        'data_audit',
        'Comprehensive data quality audit',
        {
          fullAudit: true,
          timestamp: new Date().toISOString()
        }
      );
      
      // Submit the task
      this.submitTask(task);
      
      logger.info(`Data audit initiated (Task ID: ${task.taskId})`);
      
      return task;
    } catch (error) {
      logger.error(`Error running data audit: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Validate data against a schema
   * 
   * @param {string} schemaName - Name of the schema to validate against
   * @param {Object} data - Data to validate
   * @returns {Object} Validation result with errors if any
   */
  validateData(schemaName, data) {
    try {
      // Get the schema validator
      const validate = this.schemas[schemaName];
      
      if (!validate) {
        throw new Error(`Schema not found: ${schemaName}`);
      }
      
      // Validate the data
      const valid = validate(data);
      
      if (valid) {
        return {
          valid: true,
          schemaName,
          errors: null
        };
      } else {
        return {
          valid: false,
          schemaName,
          errors: validate.errors
        };
      }
    } catch (error) {
      logger.error(`Error validating data against schema ${schemaName}: ${error.message}`);
      return {
        valid: false,
        schemaName,
        errors: [{ message: error.message }]
      };
    }
  }
  
  /**
   * Check for inconsistencies between related data elements
   * 
   * @param {Array<Object>} dataItems - Array of related data items to check
   * @param {Array<Object>} rules - Consistency rules to apply
   * @returns {Object} Consistency check results
   */
  checkConsistency(dataItems, rules) {
    try {
      const results = {
        consistent: true,
        inconsistencies: []
      };
      
      // Apply each consistency rule
      for (const rule of rules) {
        try {
          // Apply the rule logic
          const ruleFunction = this._getConsistencyRule(rule.type);
          const ruleResult = ruleFunction(dataItems, rule.parameters);
          
          if (!ruleResult.consistent) {
            results.consistent = false;
            results.inconsistencies.push({
              rule: rule.name,
              type: rule.type,
              details: ruleResult.details
            });
          }
        } catch (error) {
          logger.error(`Error applying consistency rule ${rule.name}: ${error.message}`);
          results.consistent = false;
          results.inconsistencies.push({
            rule: rule.name,
            type: rule.type,
            details: `Error: ${error.message}`
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error checking data consistency: ${error.message}`);
      return {
        consistent: false,
        inconsistencies: [{ message: error.message }]
      };
    }
  }
  
  /**
   * Get a consistency rule function by type
   * 
   * @param {string} ruleType - Type of consistency rule
   * @returns {Function} Rule checking function
   * @private
   */
  _getConsistencyRule(ruleType) {
    switch (ruleType) {
      case 'referential':
        return this._checkReferentialConsistency;
      
      case 'logical':
        return this._checkLogicalConsistency;
      
      case 'mathematical':
        return this._checkMathematicalConsistency;
      
      case 'temporal':
        return this._checkTemporalConsistency;
      
      default:
        throw new Error(`Unknown consistency rule type: ${ruleType}`);
    }
  }
  
  /**
   * Check referential consistency between items
   * 
   * @param {Array<Object>} items - Data items to check
   * @param {Object} parameters - Rule parameters
   * @returns {Object} Consistency check result
   * @private
   */
  _checkReferentialConsistency(items, parameters) {
    // Implementation of referential consistency checking
    // Example: checking that referenced IDs exist
    
    // Placeholder implementation
    return {
      consistent: true,
      details: null
    };
  }
  
  /**
   * Check logical consistency between items
   * 
   * @param {Array<Object>} items - Data items to check
   * @param {Object} parameters - Rule parameters
   * @returns {Object} Consistency check result
   * @private
   */
  _checkLogicalConsistency(items, parameters) {
    // Implementation of logical consistency checking
    // Example: checking that status transitions are valid
    
    // Placeholder implementation
    return {
      consistent: true,
      details: null
    };
  }
  
  /**
   * Check mathematical consistency between items
   * 
   * @param {Array<Object>} items - Data items to check
   * @param {Object} parameters - Rule parameters
   * @returns {Object} Consistency check result
   * @private
   */
  _checkMathematicalConsistency(items, parameters) {
    // Implementation of mathematical consistency checking
    // Example: checking that totals match sum of components
    
    // Placeholder implementation
    return {
      consistent: true,
      details: null
    };
  }
  
  /**
   * Check temporal consistency between items
   * 
   * @param {Array<Object>} items - Data items to check
   * @param {Object} parameters - Rule parameters
   * @returns {Object} Consistency check result
   * @private
   */
  _checkTemporalConsistency(items, parameters) {
    // Implementation of temporal consistency checking
    // Example: checking that end dates are after start dates
    
    // Placeholder implementation
    return {
      consistent: true,
      details: null
    };
  }
  
  /**
   * Apply remediation strategy to fix data issues
   * 
   * @param {string} strategyName - Name of the remediation strategy
   * @param {Object} data - Data with issues
   * @param {Object} validationResult - Result of validation
   * @returns {Object} Remediated data
   */
  applyRemediation(strategyName, data, validationResult) {
    try {
      // Get the remediation strategy
      const strategy = this.remediationStrategies[strategyName];
      
      if (!strategy) {
        throw new Error(`Remediation strategy not found: ${strategyName}`);
      }
      
      // Apply the strategy
      let remediatedData = { ...data };
      
      // Apply different types of remediations
      switch (strategy.type) {
        case 'default_values':
          remediatedData = this._applyDefaultValues(remediatedData, strategy.defaults, validationResult);
          break;
          
        case 'correction_rules':
          remediatedData = this._applyCorrectionRules(remediatedData, strategy.rules, validationResult);
          break;
          
        case 'data_transformation':
          remediatedData = this._applyDataTransformation(remediatedData, strategy.transformation, validationResult);
          break;
          
        case 'manual_review':
          // For manual review, just mark the data as needing review
          logger.info(`Data marked for manual review according to strategy: ${strategyName}`);
          return {
            data: remediatedData,
            needsReview: true,
            strategy: strategyName,
            validationResult
          };
          
        default:
          throw new Error(`Unknown remediation strategy type: ${strategy.type}`);
      }
      
      // Validate the remediated data
      const revalidationResult = this.validateData(validationResult.schemaName, remediatedData);
      
      return {
        data: remediatedData,
        needsReview: !revalidationResult.valid,
        strategy: strategyName,
        validationResult: revalidationResult
      };
    } catch (error) {
      logger.error(`Error applying remediation strategy ${strategyName}: ${error.message}`);
      return {
        data,
        needsReview: true,
        strategy: strategyName,
        error: error.message,
        validationResult
      };
    }
  }
  
  /**
   * Apply default values remediation
   * 
   * @param {Object} data - Data to remediate
   * @param {Object} defaults - Default values
   * @param {Object} validationResult - Validation result
   * @returns {Object} Remediated data
   * @private
   */
  _applyDefaultValues(data, defaults, validationResult) {
    // Create a deep copy of the data
    const remediatedData = JSON.parse(JSON.stringify(data));
    
    // Get missing or invalid properties from validation errors
    const missingProps = new Set();
    
    if (validationResult.errors) {
      for (const error of validationResult.errors) {
        // Extract property path from the error
        if (error.keyword === 'required') {
          error.params.missingProperty && missingProps.add(error.params.missingProperty);
        } else if (error.instancePath) {
          const prop = error.instancePath.substring(1); // Remove leading slash
          missingProps.add(prop);
        }
      }
    }
    
    // Apply defaults for all missing or invalid properties
    for (const [path, defaultValue] of Object.entries(defaults)) {
      const pathParts = path.split('.');
      const propName = pathParts[pathParts.length - 1];
      
      // Check if this property needs remediation
      if (missingProps.has(propName)) {
        // Navigate to the correct part of the object
        let current = remediatedData;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          
          // Create missing objects along the path
          if (current[part] === undefined) {
            current[part] = {};
          }
          
          current = current[part];
        }
        
        // Set the default value
        current[propName] = defaultValue;
      }
    }
    
    return remediatedData;
  }
  
  /**
   * Apply correction rules remediation
   * 
   * @param {Object} data - Data to remediate
   * @param {Array<Object>} rules - Correction rules
   * @param {Object} validationResult - Validation result
   * @returns {Object} Remediated data
   * @private
   */
  _applyCorrectionRules(data, rules, validationResult) {
    // Create a deep copy of the data
    const remediatedData = JSON.parse(JSON.stringify(data));
    
    // Apply each correction rule
    for (const rule of rules) {
      try {
        switch (rule.ruleType) {
          case 'regex_replace':
            this._applyRegexReplace(remediatedData, rule);
            break;
            
          case 'value_mapping':
            this._applyValueMapping(remediatedData, rule);
            break;
            
          case 'conditional_set':
            this._applyConditionalSet(remediatedData, rule);
            break;
            
          default:
            logger.warn(`Unknown correction rule type: ${rule.ruleType}`);
        }
      } catch (error) {
        logger.error(`Error applying correction rule: ${error.message}`);
      }
    }
    
    return remediatedData;
  }
  
  /**
   * Apply regex replace correction rule
   * 
   * @param {Object} data - Data to remediate
   * @param {Object} rule - Regex replace rule
   * @private
   */
  _applyRegexReplace(data, rule) {
    // Navigate to the target property
    const pathParts = rule.path.split('.');
    let current = data;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      if (current[part] === undefined) {
        return; // Path doesn't exist, nothing to replace
      }
      
      current = current[part];
    }
    
    // Get the property to replace
    const prop = pathParts[pathParts.length - 1];
    
    if (typeof current[prop] === 'string') {
      // Apply regex replacement
      const regex = new RegExp(rule.pattern, rule.flags || 'g');
      current[prop] = current[prop].replace(regex, rule.replacement);
    }
  }
  
  /**
   * Apply value mapping correction rule
   * 
   * @param {Object} data - Data to remediate
   * @param {Object} rule - Value mapping rule
   * @private
   */
  _applyValueMapping(data, rule) {
    // Navigate to the target property
    const pathParts = rule.path.split('.');
    let current = data;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      if (current[part] === undefined) {
        return; // Path doesn't exist, nothing to map
      }
      
      current = current[part];
    }
    
    // Get the property to map
    const prop = pathParts[pathParts.length - 1];
    
    if (current[prop] !== undefined && rule.mapping[current[prop]] !== undefined) {
      // Apply value mapping
      current[prop] = rule.mapping[current[prop]];
    }
  }
  
  /**
   * Apply conditional set correction rule
   * 
   * @param {Object} data - Data to remediate
   * @param {Object} rule - Conditional set rule
   * @private
   */
  _applyConditionalSet(data, rule) {
    // Evaluate the condition
    let condition = true;
    
    for (const [path, value] of Object.entries(rule.condition)) {
      const pathParts = path.split('.');
      let current = data;
      
      // Navigate to the condition property
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        
        if (current[part] === undefined) {
          condition = false;
          break;
        }
        
        current = current[part];
      }
      
      if (!condition) break;
      
      // Check the condition value
      const prop = pathParts[pathParts.length - 1];
      if (current[prop] !== value) {
        condition = false;
        break;
      }
    }
    
    // If condition is met, set the target property
    if (condition) {
      const pathParts = rule.setPath.split('.');
      let current = data;
      
      // Navigate to the target property
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        
        if (current[part] === undefined) {
          current[part] = {};
        }
        
        current = current[part];
      }
      
      // Set the value
      const prop = pathParts[pathParts.length - 1];
      current[prop] = rule.setValue;
    }
  }
  
  /**
   * Apply data transformation remediation
   * 
   * @param {Object} data - Data to remediate
   * @param {Object} transformation - Transformation to apply
   * @param {Object} validationResult - Validation result
   * @returns {Object} Remediated data
   * @private
   */
  _applyDataTransformation(data, transformation, validationResult) {
    // Create a deep copy of the data
    const remediatedData = JSON.parse(JSON.stringify(data));
    
    switch (transformation.type) {
      case 'trim_strings':
        this._applyTrimStrings(remediatedData);
        break;
        
      case 'convert_types':
        this._applyConvertTypes(remediatedData, transformation.conversions);
        break;
        
      case 'normalize_dates':
        this._applyNormalizeDates(remediatedData, transformation.dateFields);
        break;
        
      default:
        logger.warn(`Unknown transformation type: ${transformation.type}`);
    }
    
    return remediatedData;
  }
  
  /**
   * Apply trim strings transformation
   * 
   * @param {Object} data - Data to transform
   * @private
   */
  _applyTrimStrings(data) {
    // Recursively trim all string values
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'string') {
        data[key] = data[key].trim();
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        this._applyTrimStrings(data[key]);
      }
    }
  }
  
  /**
   * Apply convert types transformation
   * 
   * @param {Object} data - Data to transform
   * @param {Array<Object>} conversions - Type conversions to apply
   * @private
   */
  _applyConvertTypes(data, conversions) {
    // Apply each type conversion
    for (const conversion of conversions) {
      try {
        // Navigate to the target property
        const pathParts = conversion.path.split('.');
        let current = data;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          
          if (current[part] === undefined) {
            break; // Path doesn't exist
          }
          
          current = current[part];
        }
        
        // Get the property to convert
        const prop = pathParts[pathParts.length - 1];
        
        if (current[prop] !== undefined) {
          // Apply type conversion
          switch (conversion.toType) {
            case 'string':
              current[prop] = String(current[prop]);
              break;
              
            case 'number':
              current[prop] = Number(current[prop]);
              break;
              
            case 'boolean':
              current[prop] = Boolean(current[prop]);
              break;
              
            case 'date':
              current[prop] = new Date(current[prop]).toISOString();
              break;
              
            default:
              logger.warn(`Unknown conversion type: ${conversion.toType}`);
          }
        }
      } catch (error) {
        logger.error(`Error applying type conversion: ${error.message}`);
      }
    }
  }
  
  /**
   * Apply normalize dates transformation
   * 
   * @param {Object} data - Data to transform
   * @param {Array<string>} dateFields - Fields containing dates
   * @private
   */
  _applyNormalizeDates(data, dateFields) {
    // Normalize each date field
    for (const field of dateFields) {
      try {
        // Navigate to the date field
        const pathParts = field.split('.');
        let current = data;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          
          if (current[part] === undefined) {
            break; // Path doesn't exist
          }
          
          current = current[part];
        }
        
        // Get the date property
        const prop = pathParts[pathParts.length - 1];
        
        if (current[prop] !== undefined) {
          // Convert to ISO format date
          const date = new Date(current[prop]);
          
          if (!isNaN(date.getTime())) {
            current[prop] = date.toISOString();
          }
        }
      } catch (error) {
        logger.error(`Error normalizing date field ${field}: ${error.message}`);
      }
    }
  }
  
  /**
   * Generate a data quality report
   * 
   * @param {Object} auditResults - Results of a data audit
   * @returns {Object} Formatted quality report
   */
  generateQualityReport(auditResults) {
    try {
      // Calculate overall quality score
      const totalChecks = auditResults.totalChecks || 1;
      const passedChecks = auditResults.passedChecks || 0;
      const qualityScore = Math.round((passedChecks / totalChecks) * 100);
      
      // Determine quality level
      let qualityLevel;
      if (qualityScore >= this.config.alertThresholds.warning) {
        qualityLevel = 'good';
      } else if (qualityScore >= this.config.alertThresholds.error) {
        qualityLevel = 'warning';
      } else if (qualityScore >= this.config.alertThresholds.critical) {
        qualityLevel = 'error';
      } else {
        qualityLevel = 'critical';
      }
      
      // Format the report
      const report = {
        timestamp: new Date().toISOString(),
        qualityScore,
        qualityLevel,
        summary: {
          totalChecks,
          passedChecks,
          failedChecks: totalChecks - passedChecks,
          passRate: `${qualityScore}%`
        },
        domainScores: auditResults.domainScores || {},
        issues: auditResults.issues || [],
        recommendations: auditResults.recommendations || []
      };
      
      logger.info(`Generated data quality report with score ${qualityScore}% (${qualityLevel})`);
      
      return report;
    } catch (error) {
      logger.error(`Error generating quality report: ${error.message}`);
      
      // Return a basic error report
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        qualityScore: 0,
        qualityLevel: 'error'
      };
    }
  }
  
  /**
   * Handle data create event
   * 
   * @param {Object} message - Event message
   * @private
   */
  _handleDataCreateEvent(message) {
    try {
      logger.debug(`Handling data create event for ${message.content.dataType}`);
      
      // Create a validation task
      const task = this.createTask(
        'validate_data',
        `Validate created ${message.content.dataType} data`,
        {
          dataType: message.content.dataType,
          data: message.content.data,
          createEvent: true
        }
      );
      
      // Submit the task
      this.submitTask(task);
    } catch (error) {
      logger.error(`Error handling data create event: ${error.message}`);
    }
  }
  
  /**
   * Handle data update event
   * 
   * @param {Object} message - Event message
   * @private
   */
  _handleDataUpdateEvent(message) {
    try {
      logger.debug(`Handling data update event for ${message.content.dataType}`);
      
      // Create a validation task
      const task = this.createTask(
        'validate_data',
        `Validate updated ${message.content.dataType} data`,
        {
          dataType: message.content.dataType,
          data: message.content.data,
          previousData: message.content.previousData,
          updateEvent: true
        }
      );
      
      // Submit the task
      this.submitTask(task);
    } catch (error) {
      logger.error(`Error handling data update event: ${error.message}`);
    }
  }
  
  /**
   * Handle data delete event
   * 
   * @param {Object} message - Event message
   * @private
   */
  _handleDataDeleteEvent(message) {
    try {
      logger.debug(`Handling data delete event for ${message.content.dataType}`);
      
      // Create a integrity check task
      const task = this.createTask(
        'check_integrity',
        `Check integrity after ${message.content.dataType} deletion`,
        {
          dataType: message.content.dataType,
          dataId: message.content.dataId,
          deleteEvent: true
        }
      );
      
      // Submit the task
      this.submitTask(task);
    } catch (error) {
      logger.error(`Error handling data delete event: ${error.message}`);
    }
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'data_audit':
        return await this._performDataAudit(task.parameters);
      
      case 'validate_data':
        return await this._performDataValidation(task.parameters);
      
      case 'check_integrity':
        return await this._performIntegrityCheck(task.parameters);
      
      case 'apply_remediation':
        return await this._performRemediation(task.parameters);
      
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
  
  /**
   * Perform a data audit
   * 
   * @param {Object} parameters - Audit parameters
   * @returns {Promise<Object>} Audit results
   * @private
   */
  async _performDataAudit(parameters) {
    try {
      logger.info('Performing data audit');
      
      // Get data domains to audit
      const domains = parameters.domains || await this._getDataDomains();
      
      // Initialize audit results
      const auditResults = {
        timestamp: new Date().toISOString(),
        totalChecks: 0,
        passedChecks: 0,
        domainScores: {},
        issues: [],
        recommendations: []
      };
      
      // Audit each domain
      for (const domain of domains) {
        try {
          logger.info(`Auditing domain: ${domain.name}`);
          
          // Get data for this domain
          const data = await this._getDataForDomain(domain);
          
          // Validate data against schema
          let domainResults = {
            domain: domain.name,
            totalChecks: 0,
            passedChecks: 0,
            issues: []
          };
          
          // Process each data item
          for (const item of data) {
            // Validate against schema
            const validationResult = this.validateData(domain.schemaName, item);
            domainResults.totalChecks++;
            
            if (validationResult.valid) {
              domainResults.passedChecks++;
            } else {
              // Record validation issues
              domainResults.issues.push({
                dataId: item.id,
                validationType: 'schema',
                errors: validationResult.errors
              });
            }
            
            // Check consistency if applicable
            if (domain.consistencyRules && domain.consistencyRules.length > 0) {
              const consistencyResult = this.checkConsistency([item], domain.consistencyRules);
              domainResults.totalChecks++;
              
              if (consistencyResult.consistent) {
                domainResults.passedChecks++;
              } else {
                // Record consistency issues
                domainResults.issues.push({
                  dataId: item.id,
                  validationType: 'consistency',
                  inconsistencies: consistencyResult.inconsistencies
                });
              }
            }
          }
          
          // Calculate domain score
          const domainScore = domainResults.totalChecks > 0 
            ? Math.round((domainResults.passedChecks / domainResults.totalChecks) * 100)
            : 100;
          
          // Update domain results
          domainResults.score = domainScore;
          
          // Add domain results to overall results
          auditResults.totalChecks += domainResults.totalChecks;
          auditResults.passedChecks += domainResults.passedChecks;
          auditResults.domainScores[domain.name] = domainScore;
          
          // Add domain issues to overall issues
          auditResults.issues.push(...domainResults.issues.map(issue => ({
            domain: domain.name,
            ...issue
          })));
          
          logger.info(`Domain ${domain.name} audit complete: ${domainScore}%`);
        } catch (error) {
          logger.error(`Error auditing domain ${domain.name}: ${error.message}`);
          
          // Add domain error to results
          auditResults.issues.push({
            domain: domain.name,
            validationType: 'audit',
            error: error.message
          });
        }
      }
      
      // Generate recommendations based on issues
      auditResults.recommendations = await this._generateRecommendations(auditResults.issues);
      
      // Generate and store the report
      const report = this.generateQualityReport(auditResults);
      await this._storeQualityReport(report);
      
      // Return the audit results
      return {
        auditResults,
        report
      };
    } catch (error) {
      logger.error(`Error performing data audit: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get data domains to audit
   * 
   * @returns {Promise<Array<Object>>} Data domains
   * @private
   */
  async _getDataDomains() {
    try {
      // This would typically query a configuration store or database
      // For this implementation, we'll return a hard-coded list
      
      return [
        {
          name: 'teams',
          schemaName: 'team',
          tableName: 'teams',
          consistencyRules: [
            { name: 'Team Names Unique', type: 'logical' }
          ]
        },
        {
          name: 'venues',
          schemaName: 'venue',
          tableName: 'venues',
          consistencyRules: [
            { name: 'Venue Names Unique', type: 'logical' }
          ]
        },
        {
          name: 'games',
          schemaName: 'game',
          tableName: 'games',
          consistencyRules: [
            { name: 'Game Dates Valid', type: 'temporal' },
            { name: 'Teams Exist', type: 'referential' }
          ]
        },
        {
          name: 'schedules',
          schemaName: 'schedule',
          tableName: 'schedules',
          consistencyRules: [
            { name: 'Schedule Dates Valid', type: 'temporal' },
            { name: 'Games Exist', type: 'referential' }
          ]
        },
        {
          name: 'constraints',
          schemaName: 'constraint',
          tableName: 'constraints',
          consistencyRules: [
            { name: 'Constraint Types Valid', type: 'logical' }
          ]
        }
      ];
    } catch (error) {
      logger.error(`Error getting data domains: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get data for a domain
   * 
   * @param {Object} domain - Domain configuration
   * @returns {Promise<Array<Object>>} Domain data
   * @private
   */
  async _getDataForDomain(domain) {
    try {
      // Query the database for this domain's data
      const result = await this.dbClient.query(`SELECT * FROM ${domain.tableName} LIMIT 1000`);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting data for domain ${domain.name}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate recommendations based on issues
   * 
   * @param {Array<Object>} issues - Data quality issues
   * @returns {Promise<Array<Object>>} Recommendations
   * @private
   */
  async _generateRecommendations(issues) {
    try {
      // Group issues by domain and type
      const issueGroups = {};
      
      for (const issue of issues) {
        const key = `${issue.domain}:${issue.validationType}`;
        
        if (!issueGroups[key]) {
          issueGroups[key] = [];
        }
        
        issueGroups[key].push(issue);
      }
      
      // Generate recommendations for each group
      const recommendations = [];
      
      for (const [key, groupIssues] of Object.entries(issueGroups)) {
        const [domain, type] = key.split(':');
        
        // Generate recommendation based on issue type
        switch (type) {
          case 'schema':
            recommendations.push({
              domain,
              type: 'schema_validation',
              priority: groupIssues.length > 10 ? 'high' : 'medium',
              description: `Fix ${groupIssues.length} schema validation issues in ${domain}`,
              details: `Common errors: ${this._summarizeSchemaErrors(groupIssues)}`
            });
            break;
            
          case 'consistency':
            recommendations.push({
              domain,
              type: 'consistency',
              priority: groupIssues.length > 5 ? 'high' : 'medium',
              description: `Resolve ${groupIssues.length} consistency issues in ${domain}`,
              details: `Consistency rules failed: ${this._summarizeConsistencyErrors(groupIssues)}`
            });
            break;
            
          case 'audit':
            recommendations.push({
              domain,
              type: 'audit_process',
              priority: 'high',
              description: `Fix audit process errors for ${domain}`,
              details: `Errors during audit: ${groupIssues.map(i => i.error).join(', ')}`
            });
            break;
        }
      }
      
      return recommendations;
    } catch (error) {
      logger.error(`Error generating recommendations: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Summarize schema validation errors
   * 
   * @param {Array<Object>} issues - Schema validation issues
   * @returns {string} Error summary
   * @private
   */
  _summarizeSchemaErrors(issues) {
    try {
      // Count error types
      const errorCounts = {};
      
      for (const issue of issues) {
        if (issue.errors) {
          for (const error of issue.errors) {
            const key = `${error.keyword}:${error.instancePath || 'root'}`;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
          }
        }
      }
      
      // Get top 3 most common errors
      const topErrors = Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, count]) => {
          const [keyword, path] = key.split(':');
          return `${keyword} at ${path} (${count} occurrences)`;
        });
      
      return topErrors.join(', ');
    } catch (error) {
      logger.error(`Error summarizing schema errors: ${error.message}`);
      return 'Error summarizing schema errors';
    }
  }
  
  /**
   * Summarize consistency validation errors
   * 
   * @param {Array<Object>} issues - Consistency validation issues
   * @returns {string} Error summary
   * @private
   */
  _summarizeConsistencyErrors(issues) {
    try {
      // Count inconsistency types
      const inconsistencyCounts = {};
      
      for (const issue of issues) {
        if (issue.inconsistencies) {
          for (const inconsistency of issue.inconsistencies) {
            const key = inconsistency.rule;
            inconsistencyCounts[key] = (inconsistencyCounts[key] || 0) + 1;
          }
        }
      }
      
      // Get top 3 most common inconsistencies
      const topInconsistencies = Object.entries(inconsistencyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([rule, count]) => `${rule} (${count} occurrences)`);
      
      return topInconsistencies.join(', ');
    } catch (error) {
      logger.error(`Error summarizing consistency errors: ${error.message}`);
      return 'Error summarizing consistency errors';
    }
  }
  
  /**
   * Store a quality report
   * 
   * @param {Object} report - Quality report
   * @returns {Promise<void>}
   * @private
   */
  async _storeQualityReport(report) {
    try {
      // Store in database if available
      if (this.dbClient) {
        // Check if reports table exists
        const tableCheck = await this.dbClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'data_quality_reports'
          );
        `);
        
        // Create table if it doesn't exist
        if (!tableCheck.rows[0].exists) {
          await this.dbClient.query(`
            CREATE TABLE data_quality_reports (
              report_id SERIAL PRIMARY KEY,
              timestamp TIMESTAMP NOT NULL,
              quality_score INTEGER NOT NULL,
              quality_level VARCHAR(20) NOT NULL,
              report JSONB NOT NULL
            );
          `);
        }
        
        // Insert the report
        await this.dbClient.query(`
          INSERT INTO data_quality_reports (timestamp, quality_score, quality_level, report)
          VALUES ($1, $2, $3, $4);
        `, [
          report.timestamp,
          report.qualityScore,
          report.qualityLevel,
          JSON.stringify(report)
        ]);
        
        logger.info(`Stored quality report in database`);
      }
      
      // You could also store to file system, message queue, etc.
    } catch (error) {
      logger.error(`Error storing quality report: ${error.message}`);
    }
  }
  
  /**
   * Perform data validation
   * 
   * @param {Object} parameters - Validation parameters
   * @returns {Promise<Object>} Validation results
   * @private
   */
  async _performDataValidation(parameters) {
    try {
      logger.info(`Validating ${parameters.dataType} data`);
      
      // Get schema for this data type
      const schemaName = parameters.schemaName || parameters.dataType;
      
      // Validate the data
      const validationResult = this.validateData(schemaName, parameters.data);
      
      // If invalid and auto-remediation is enabled, try to fix it
      if (!validationResult.valid && this.config.autoRemediation) {
        // Find appropriate remediation strategy
        const strategyName = this._findRemediationStrategy(parameters.dataType, validationResult);
        
        if (strategyName) {
          // Apply remediation
          const remediationResult = this.applyRemediation(
            strategyName,
            parameters.data,
            validationResult
          );
          
          // If remediation succeeded and doesn't need review, return the fixed data
          if (!remediationResult.needsReview) {
            return {
              valid: true,
              originalResult: validationResult,
              remediationApplied: true,
              strategy: strategyName,
              data: remediationResult.data
            };
          } else {
            // Remediation needs review
            return {
              valid: false,
              originalResult: validationResult,
              remediationAttempted: true,
              strategy: strategyName,
              needsReview: true,
              remediationError: remediationResult.error,
              data: parameters.data
            };
          }
        } else {
          // No remediation strategy found
          return {
            valid: false,
            validationResult,
            remediationAttempted: false,
            data: parameters.data
          };
        }
      } else {
        // Return validation result
        return {
          valid: validationResult.valid,
          validationResult,
          data: parameters.data
        };
      }
    } catch (error) {
      logger.error(`Error performing data validation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Find an appropriate remediation strategy
   * 
   * @param {string} dataType - Type of data
   * @param {Object} validationResult - Validation result
   * @returns {string|null} Strategy name or null if none found
   * @private
   */
  _findRemediationStrategy(dataType, validationResult) {
    try {
      // Find strategies for this data type
      const matchingStrategies = Object.entries(this.remediationStrategies)
        .filter(([name, strategy]) => strategy.dataType === dataType)
        .map(([name, strategy]) => ({ name, strategy }));
      
      if (matchingStrategies.length === 0) {
        return null;
      }
      
      // Find the most appropriate strategy based on error types
      const errorTypes = new Set();
      
      if (validationResult.errors) {
        for (const error of validationResult.errors) {
          errorTypes.add(error.keyword);
        }
      }
      
      // Find strategies that handle these error types
      for (const { name, strategy } of matchingStrategies) {
        // If the strategy handles all the error types, use it
        if (strategy.errorTypes && strategy.errorTypes.some(type => errorTypes.has(type))) {
          return name;
        }
      }
      
      // If no specific match, return the default strategy for this data type
      const defaultStrategy = matchingStrategies.find(({ name, strategy }) => strategy.isDefault);
      return defaultStrategy ? defaultStrategy.name : null;
    } catch (error) {
      logger.error(`Error finding remediation strategy: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Perform integrity check
   * 
   * @param {Object} parameters - Check parameters
   * @returns {Promise<Object>} Check results
   * @private
   */
  async _performIntegrityCheck(parameters) {
    try {
      logger.info(`Performing integrity check for ${parameters.dataType}`);
      
      // This would check for referential integrity, orphaned records, etc.
      // Implementation would depend on the specific data models
      
      // Placeholder implementation
      return {
        dataType: parameters.dataType,
        dataId: parameters.dataId,
        integrityVerified: true
      };
    } catch (error) {
      logger.error(`Error performing integrity check: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Perform data remediation
   * 
   * @param {Object} parameters - Remediation parameters
   * @returns {Promise<Object>} Remediation results
   * @private
   */
  async _performRemediation(parameters) {
    try {
      logger.info(`Performing remediation for ${parameters.dataType} using strategy ${parameters.strategyName}`);
      
      // Apply the specified remediation strategy
      const remediationResult = this.applyRemediation(
        parameters.strategyName,
        parameters.data,
        parameters.validationResult
      );
      
      return remediationResult;
    } catch (error) {
      logger.error(`Error performing remediation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stop the agent and release resources
   */
  async stop() {
    try {
      logger.info('Stopping Data Quality Agent');
      
      // Stop monitoring
      this.monitoringActive = false;
      
      // Close database connection
      if (this.dbClient) {
        await this.dbClient.end();
        this.dbClient = null;
      }
      
      // Stop the base agent
      await super.stop();
      
      logger.info('Data Quality Agent stopped');
      return true;
    } catch (error) {
      logger.error(`Error stopping Data Quality Agent: ${error.message}`);
      return false;
    }
  }
}

module.exports = DataQualityAgent;