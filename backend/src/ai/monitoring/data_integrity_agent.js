/**
 * Data Integrity Monitoring Agent
 * 
 * Specialized agent for monitoring database integrity and data quality.
 * Detects missing references, null values, type mismatches, and other data problems.
 */

const BaseMonitoringAgent = require('./base_monitoring_agent');
const logger = require("../utils/logger");
const AIAdapter = require('../../adapters/ai-adapter');
const NeonDBAdapter = require('../../adapters/neon-db-adapter');

class DataIntegrityAgent extends BaseMonitoringAgent {
  /**
   * Create a new Data Integrity Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(config, mcpConnector) {
    super('DataIntegrity', 'data_integrity', config, mcpConnector);
    
    // Initialize database adapter
    this.dbAdapter = new NeonDBAdapter(config.dbConfig);
    
    // Define schema mapping (table structure) - this would be loaded from DB in production
    this.schema = config.schema || {};
    
    // Define check configurations
    this.checks = {
      missingReferences: {
        enabled: true,
        description: 'Checks for references to non-existent records',
        tables: config.referenceTables || []
      },
      nullValues: {
        enabled: true,
        description: 'Checks for null values in non-nullable fields',
        tables: config.requiredFieldTables || []
      },
      typeMismatches: {
        enabled: true,
        description: 'Checks for data type mismatches',
        tables: config.typeSensitiveTables || []
      },
      duplicateEntries: {
        enabled: true,
        description: 'Checks for duplicate entries',
        tables: config.uniqueConstraintTables || []
      },
      inconsistentData: {
        enabled: true,
        description: 'Checks for logically inconsistent data',
        rules: config.consistencyRules || []
      },
      dataBoundaries: {
        enabled: true,
        description: 'Checks for data outside acceptable bounds',
        rules: config.boundaryRules || []
      },
      schemaCompliance: {
        enabled: true,
        description: 'Checks for compliance with defined schema',
        tables: config.schemaValidationTables || []
      }
    };
    
    // Define rule evaluators (to be used when checking data validity)
    this.ruleEvaluators = {
      required: (value) => value !== null && value !== undefined,
      minLength: (value, min) => typeof value === 'string' && value.length >= min,
      maxLength: (value, max) => typeof value === 'string' && value.length <= max,
      minValue: (value, min) => typeof value === 'number' && value >= min,
      maxValue: (value, max) => typeof value === 'number' && value <= max,
      format: (value, format) => {
        if (typeof value !== 'string') return false;
        
        switch (format) {
          case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          case 'url':
            return /^https?:\/\//.test(value);
          case 'date':
            return !isNaN(Date.parse(value));
          case 'uuid':
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
          default:
            return true;
        }
      },
      enum: (value, allowedValues) => allowedValues.includes(value),
      type: (value, type) => {
        switch (type.toLowerCase()) {
          case 'string':
            return typeof value === 'string';
          case 'number':
            return typeof value === 'number';
          case 'boolean':
            return typeof value === 'boolean';
          case 'object':
            return typeof value === 'object' && value !== null;
          case 'array':
            return Array.isArray(value);
          case 'date':
            return value instanceof Date || !isNaN(Date.parse(value));
          default:
            return true;
        }
      }
    };
    
    // Configure monitoring schedule (every 6 hours by default)
    this.monitoringSchedule = this.config.schedule || {
      frequency: 'every 6 hours',
      timeUnit: 'hour',
      interval: 6
    };
    
    // AI adapter for data pattern analysis
    this.ai = new AIAdapter();
    
    logger.info('Data Integrity Monitoring Agent initialized');
  }
  
  /**
   * Initialize the agent
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info('Initializing Data Integrity Monitoring Agent');
      
      // Connect to database
      await this.dbAdapter.connect();
      
      // Load schema if not provided
      if (Object.keys(this.schema).length === 0) {
        this.schema = await this._loadSchemaFromDatabase();
      }
      
      // Initialize base
      await super.initialize();
      
      logger.info('Data Integrity Monitoring Agent initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing Data Integrity Monitoring Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load database schema
   * 
   * @returns {Promise<Object>} Database schema
   * @private
   */
  async _loadSchemaFromDatabase() {
    try {
      logger.info('Loading database schema');
      
      // Query to get table information
      const tables = await this.dbAdapter.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const schema = {};
      
      // For each table, get column information
      for (const table of tables.rows) {
        const tableName = table.table_name;
        
        const columns = await this.dbAdapter.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
        `, [tableName]);
        
        schema[tableName] = {
          columns: columns.rows.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default
          })),
          primaryKey: await this._getPrimaryKey(tableName),
          foreignKeys: await this._getForeignKeys(tableName),
          uniqueConstraints: await this._getUniqueConstraints(tableName)
        };
      }
      
      logger.info(`Loaded schema for ${Object.keys(schema).length} tables`);
      return schema;
    } catch (error) {
      logger.error(`Error loading database schema: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get primary key for a table
   * 
   * @param {string} tableName - Table name
   * @returns {Promise<Array<string>>} Primary key columns
   * @private
   */
  async _getPrimaryKey(tableName) {
    const result = await this.dbAdapter.query(`
      SELECT c.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
      JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
        AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1
    `, [tableName]);
    
    return result.rows.map(row => row.column_name);
  }
  
  /**
   * Get foreign keys for a table
   * 
   * @param {string} tableName - Table name
   * @returns {Promise<Array<Object>>} Foreign key constraints
   * @private
   */
  async _getForeignKeys(tableName) {
    const result = await this.dbAdapter.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
    `, [tableName]);
    
    return result.rows.map(row => ({
      column: row.column_name,
      referencesTable: row.foreign_table_name,
      referencesColumn: row.foreign_column_name
    }));
  }
  
  /**
   * Get unique constraints for a table
   * 
   * @param {string} tableName - Table name
   * @returns {Promise<Array<Object>>} Unique constraints
   * @private
   */
  async _getUniqueConstraints(tableName) {
    const result = await this.dbAdapter.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE' AND tc.table_name = $1
    `, [tableName]);
    
    // Group by constraint name
    const constraints = {};
    for (const row of result.rows) {
      if (!constraints[row.constraint_name]) {
        constraints[row.constraint_name] = [];
      }
      constraints[row.constraint_name].push(row.column_name);
    }
    
    return Object.values(constraints);
  }
  
  /**
   * Perform a monitoring scan
   * 
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Scan results
   * @private
   */
  async _performScan(options = {}) {
    try {
      logger.info('Performing data integrity scan');
      
      const startTime = Date.now();
      const issues = [];
      const checkStats = {};
      
      // Determine which checks to run
      const checksToRun = options.checks || Object.keys(this.checks);
      const filteredChecks = checksToRun.filter(check => 
        this.checks[check] && this.checks[check].enabled &&
        !this.monitoringConfig.disabledChecks.includes(check) &&
        (this.monitoringConfig.enabledChecks.includes('all') || 
         this.monitoringConfig.enabledChecks.includes(check))
      );
      
      logger.info(`Running ${filteredChecks.length} data integrity checks`);
      
      // Run each check
      for (const checkName of filteredChecks) {
        const check = this.checks[checkName];
        logger.info(`Running ${checkName} check`);
        
        const checkStartTime = Date.now();
        let checkIssues = [];
        
        try {
          switch (checkName) {
            case 'missingReferences':
              checkIssues = await this._checkMissingReferences(check.tables);
              break;
              
            case 'nullValues':
              checkIssues = await this._checkNullValues(check.tables);
              break;
              
            case 'typeMismatches':
              checkIssues = await this._checkTypeMismatches(check.tables);
              break;
              
            case 'duplicateEntries':
              checkIssues = await this._checkDuplicateEntries(check.tables);
              break;
              
            case 'inconsistentData':
              checkIssues = await this._checkInconsistentData(check.rules);
              break;
              
            case 'dataBoundaries':
              checkIssues = await this._checkDataBoundaries(check.rules);
              break;
              
            case 'schemaCompliance':
              checkIssues = await this._checkSchemaCompliance(check.tables);
              break;
          }
          
          // Add issues to main list
          issues.push(...checkIssues);
          
          // Record check statistics
          const checkDuration = Date.now() - checkStartTime;
          checkStats[checkName] = {
            issues: checkIssues.length,
            duration: checkDuration,
            status: 'success'
          };
          
          logger.info(`${checkName} check completed in ${checkDuration}ms with ${checkIssues.length} issues`);
        } catch (error) {
          logger.error(`Error running ${checkName} check: ${error.message}`);
          
          // Record check failure
          checkStats[checkName] = {
            issues: 0,
            duration: Date.now() - checkStartTime,
            status: 'error',
            error: error.message
          };
        }
      }
      
      // Get scan duration
      const scanDuration = Date.now() - startTime;
      
      logger.info(`Data integrity scan completed in ${scanDuration}ms with ${issues.length} issues`);
      
      return {
        issues,
        checkStats,
        duration: scanDuration
      };
    } catch (error) {
      logger.error(`Error during data integrity scan: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check for missing references
   * 
   * @param {Array<string>} tables - Tables to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkMissingReferences(tables) {
    const issues = [];
    
    // If no tables specified, check all tables with foreign keys
    if (!tables || tables.length === 0) {
      tables = Object.entries(this.schema)
        .filter(([_, tableSchema]) => tableSchema.foreignKeys && tableSchema.foreignKeys.length > 0)
        .map(([tableName]) => tableName);
    }
    
    for (const tableName of tables) {
      const tableSchema = this.schema[tableName];
      
      if (!tableSchema || !tableSchema.foreignKeys || tableSchema.foreignKeys.length === 0) {
        continue;
      }
      
      for (const fk of tableSchema.foreignKeys) {
        // Get all distinct foreign key values from the table
        const valuesQuery = `
          SELECT DISTINCT "${fk.column}" as value
          FROM "${tableName}"
          WHERE "${fk.column}" IS NOT NULL
        `;
        
        const valuesResult = await this.dbAdapter.query(valuesQuery);
        
        if (valuesResult.rows.length === 0) {
          continue;
        }
        
        // Extract the values
        const fkValues = valuesResult.rows.map(row => row.value);
        
        // Check if these values exist in the referenced table
        const verifyQuery = `
          SELECT "${fk.referencesColumn}" as value
          FROM "${fk.referencesTable}"
          WHERE "${fk.referencesColumn}" IN (${fkValues.map((_, i) => `$${i + 1}`).join(',')})
        `;
        
        const verifyResult = await this.dbAdapter.query(verifyQuery, fkValues);
        
        // Find values that don't exist in the referenced table
        const existingValues = new Set(verifyResult.rows.map(row => row.value));
        const missingValues = fkValues.filter(value => !existingValues.has(value));
        
        if (missingValues.length > 0) {
          // Get records with missing references
          for (const missingValue of missingValues) {
            const recordsQuery = `
              SELECT *
              FROM "${tableName}"
              WHERE "${fk.column}" = $1
              LIMIT 10
            `;
            
            const recordsResult = await this.dbAdapter.query(recordsQuery, [missingValue]);
            
            for (const record of recordsResult.rows) {
              issues.push({
                type: 'missing_reference',
                severity: this.severityLevels.HIGH,
                description: `Foreign key reference does not exist`,
                entity: `${tableName}.${fk.column}`,
                details: {
                  tableName,
                  columnName: fk.column,
                  value: missingValue,
                  referencesTable: fk.referencesTable,
                  referencesColumn: fk.referencesColumn,
                  recordId: record[tableSchema.primaryKey[0]]
                },
                source: 'foreign_key_check',
                autoFixable: this.config.autoFixOptions?.missingReferences === true
              });
            }
          }
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check for null values in required fields
   * 
   * @param {Array<string>} tables - Tables to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkNullValues(tables) {
    const issues = [];
    
    // If no tables specified, check all tables
    if (!tables || tables.length === 0) {
      tables = Object.keys(this.schema);
    }
    
    for (const tableName of tables) {
      const tableSchema = this.schema[tableName];
      
      if (!tableSchema) {
        continue;
      }
      
      // Get non-nullable columns
      const requiredColumns = tableSchema.columns
        .filter(col => !col.nullable && col.default === null)
        .map(col => col.name);
      
      if (requiredColumns.length === 0) {
        continue;
      }
      
      // Check for null values in each required column
      for (const columnName of requiredColumns) {
        const query = `
          SELECT ${tableSchema.primaryKey[0]}
          FROM "${tableName}"
          WHERE "${columnName}" IS NULL
          LIMIT 10
        `;
        
        const result = await this.dbAdapter.query(query);
        
        if (result.rows.length > 0) {
          for (const row of result.rows) {
            issues.push({
              type: 'null_value',
              severity: this.severityLevels.MEDIUM,
              description: `Required field has null value`,
              entity: `${tableName}.${columnName}`,
              details: {
                tableName,
                columnName,
                recordId: row[tableSchema.primaryKey[0]]
              },
              source: 'null_check',
              autoFixable: this.config.autoFixOptions?.nullValues === true
            });
          }
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check for data type mismatches
   * 
   * @param {Array<string>} tables - Tables to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkTypeMismatches(tables) {
    const issues = [];
    
    // If no tables specified, check all tables
    if (!tables || tables.length === 0) {
      tables = Object.keys(this.schema);
    }
    
    for (const tableName of tables) {
      const tableSchema = this.schema[tableName];
      
      if (!tableSchema) {
        continue;
      }
      
      // Check data types in each column
      for (const column of tableSchema.columns) {
        // Skip columns that are defined to allow nulls
        if (column.nullable) {
          continue;
        }
        
        let typeCheckQuery;
        let errorDescription;
        
        // Build type-specific checks
        switch (column.type.toLowerCase()) {
          case 'integer':
          case 'bigint':
          case 'smallint':
            typeCheckQuery = `
              SELECT ${tableSchema.primaryKey[0]}, "${column.name}"
              FROM "${tableName}" 
              WHERE "${column.name}" IS NOT NULL 
                AND "${column.name}" != ROUND("${column.name}"::numeric)
              LIMIT 10
            `;
            errorDescription = `Integer field contains non-integer value`;
            break;
            
          case 'numeric':
          case 'decimal':
            typeCheckQuery = `
              SELECT ${tableSchema.primaryKey[0]}, "${column.name}"
              FROM "${tableName}" 
              WHERE "${column.name}" IS NOT NULL 
                AND "${column.name}" !~ '^-?\\d*\\.?\\d*$'
              LIMIT 10
            `;
            errorDescription = `Numeric field contains non-numeric value`;
            break;
            
          case 'boolean':
            typeCheckQuery = `
              SELECT ${tableSchema.primaryKey[0]}, "${column.name}"
              FROM "${tableName}" 
              WHERE "${column.name}" IS NOT NULL 
                AND "${column.name}" NOT IN (TRUE, FALSE)
              LIMIT 10
            `;
            errorDescription = `Boolean field contains non-boolean value`;
            break;
            
          case 'date':
            typeCheckQuery = `
              SELECT ${tableSchema.primaryKey[0]}, "${column.name}"
              FROM "${tableName}" 
              WHERE "${column.name}" IS NOT NULL 
                AND (
                  "${column.name}" !~ '^\\d{4}-\\d{2}-\\d{2}$'
                  OR "${column.name}"::date IS NULL
                )
              LIMIT 10
            `;
            errorDescription = `Date field contains invalid date value`;
            break;
            
          case 'timestamp':
          case 'timestamptz':
            typeCheckQuery = `
              SELECT ${tableSchema.primaryKey[0]}, "${column.name}"
              FROM "${tableName}" 
              WHERE "${column.name}" IS NOT NULL 
                AND "${column.name}"::timestamp IS NULL
              LIMIT 10
            `;
            errorDescription = `Timestamp field contains invalid timestamp value`;
            break;
            
          case 'json':
          case 'jsonb':
            typeCheckQuery = `
              SELECT ${tableSchema.primaryKey[0]}, "${column.name}"
              FROM "${tableName}" 
              WHERE "${column.name}" IS NOT NULL 
                AND "${column.name}"::jsonb IS NULL
              LIMIT 10
            `;
            errorDescription = `JSON field contains invalid JSON value`;
            break;
            
          default:
            // Skip other types
            continue;
        }
        
        try {
          const result = await this.dbAdapter.query(typeCheckQuery);
          
          if (result.rows.length > 0) {
            for (const row of result.rows) {
              issues.push({
                type: 'type_mismatch',
                severity: this.severityLevels.MEDIUM,
                description: errorDescription,
                entity: `${tableName}.${column.name}`,
                details: {
                  tableName,
                  columnName: column.name,
                  expectedType: column.type,
                  actualValue: row[column.name],
                  recordId: row[tableSchema.primaryKey[0]]
                },
                source: 'type_check',
                autoFixable: this.config.autoFixOptions?.typeMismatches === true
              });
            }
          }
        } catch (error) {
          // Log error and continue with next column
          logger.error(`Error checking types for ${tableName}.${column.name}: ${error.message}`);
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check for duplicate entries
   * 
   * @param {Array<string>} tables - Tables to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkDuplicateEntries(tables) {
    const issues = [];
    
    // If no tables specified, check tables with unique constraints
    if (!tables || tables.length === 0) {
      tables = Object.entries(this.schema)
        .filter(([_, tableSchema]) => tableSchema.uniqueConstraints && tableSchema.uniqueConstraints.length > 0)
        .map(([tableName]) => tableName);
    }
    
    for (const tableName of tables) {
      const tableSchema = this.schema[tableName];
      
      if (!tableSchema || !tableSchema.uniqueConstraints || tableSchema.uniqueConstraints.length === 0) {
        continue;
      }
      
      for (const uniqueConstraint of tableSchema.uniqueConstraints) {
        // Skip single-column primary key constraints
        if (uniqueConstraint.length === 1 && 
            tableSchema.primaryKey && 
            tableSchema.primaryKey.includes(uniqueConstraint[0])) {
          continue;
        }
        
        // Build query to find duplicates
        const selectColumns = [
          ...tableSchema.primaryKey,
          ...uniqueConstraint
        ].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
        
        const query = `
          SELECT ${selectColumns.map(col => `"${col}"`).join(', ')}, COUNT(*)
          FROM "${tableName}"
          GROUP BY ${selectColumns.map(col => `"${col}"`).join(', ')}
          HAVING COUNT(*) > 1
          LIMIT 10
        `;
        
        const result = await this.dbAdapter.query(query);
        
        if (result.rows.length > 0) {
          for (const row of result.rows) {
            const duplicateValues = {};
            for (const col of uniqueConstraint) {
              duplicateValues[col] = row[col];
            }
            
            issues.push({
              type: 'duplicate_entry',
              severity: this.severityLevels.HIGH,
              description: `Duplicate values in unique constraint`,
              entity: `${tableName}.${uniqueConstraint.join(',')}`,
              details: {
                tableName,
                columns: uniqueConstraint,
                values: duplicateValues,
                count: parseInt(row.count),
                recordId: row[tableSchema.primaryKey[0]]
              },
              source: 'duplicate_check',
              autoFixable: this.config.autoFixOptions?.duplicateEntries === true
            });
          }
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check for logically inconsistent data
   * 
   * @param {Array<Object>} rules - Consistency rules to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkInconsistentData(rules) {
    const issues = [];
    
    if (!rules || rules.length === 0) {
      return issues;
    }
    
    for (const rule of rules) {
      try {
        // Skip disabled rules
        if (rule.enabled === false) {
          continue;
        }
        
        // Run the rule's query
        const result = await this.dbAdapter.query(rule.query);
        
        if (result.rows.length > 0) {
          for (const row of result.rows) {
            issues.push({
              type: 'inconsistent_data',
              severity: rule.severity || this.severityLevels.MEDIUM,
              description: rule.description || 'Data consistency violation',
              entity: rule.entity || 'Unknown',
              details: {
                rule: rule.name,
                values: row
              },
              source: 'consistency_check',
              autoFixable: rule.autoFixable === true && this.config.autoFixOptions?.inconsistentData === true
            });
          }
        }
      } catch (error) {
        logger.error(`Error checking consistency rule ${rule.name}: ${error.message}`);
      }
    }
    
    return issues;
  }
  
  /**
   * Check for data outside acceptable boundaries
   * 
   * @param {Array<Object>} rules - Boundary rules to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkDataBoundaries(rules) {
    const issues = [];
    
    if (!rules || rules.length === 0) {
      return issues;
    }
    
    for (const rule of rules) {
      try {
        // Skip disabled rules
        if (rule.enabled === false) {
          continue;
        }
        
        // Run the rule's query
        const result = await this.dbAdapter.query(rule.query);
        
        if (result.rows.length > 0) {
          for (const row of result.rows) {
            issues.push({
              type: 'data_boundary',
              severity: rule.severity || this.severityLevels.MEDIUM,
              description: rule.description || 'Data boundary violation',
              entity: rule.entity || 'Unknown',
              details: {
                rule: rule.name,
                boundary: rule.boundary,
                values: row
              },
              source: 'boundary_check',
              autoFixable: rule.autoFixable === true && this.config.autoFixOptions?.dataBoundaries === true
            });
          }
        }
      } catch (error) {
        logger.error(`Error checking boundary rule ${rule.name}: ${error.message}`);
      }
    }
    
    return issues;
  }
  
  /**
   * Check for schema compliance
   * 
   * @param {Array<string>} tables - Tables to check
   * @returns {Promise<Array<Object>>} Issues found
   * @private
   */
  async _checkSchemaCompliance(tables) {
    const issues = [];
    
    // If no tables specified, check all tables
    if (!tables || tables.length === 0) {
      tables = Object.keys(this.schema);
    }
    
    for (const tableName of tables) {
      const tableSchema = this.schema[tableName];
      
      if (!tableSchema) {
        continue;
      }
      
      try {
        // Check if table exists
        const tableCheckQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as exists
        `;
        
        const tableCheckResult = await this.dbAdapter.query(tableCheckQuery, [tableName]);
        
        if (!tableCheckResult.rows[0].exists) {
          issues.push({
            type: 'schema_compliance',
            severity: this.severityLevels.CRITICAL,
            description: `Table does not exist`,
            entity: tableName,
            details: {
              tableName,
              expectedSchema: tableSchema
            },
            source: 'schema_check',
            autoFixable: false
          });
          continue;
        }
        
        // Check columns exist and have correct types
        for (const column of tableSchema.columns) {
          const columnCheckQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = $1
            AND column_name = $2
          `;
          
          const columnCheckResult = await this.dbAdapter.query(columnCheckQuery, [tableName, column.name]);
          
          if (columnCheckResult.rows.length === 0) {
            issues.push({
              type: 'schema_compliance',
              severity: this.severityLevels.HIGH,
              description: `Column does not exist`,
              entity: `${tableName}.${column.name}`,
              details: {
                tableName,
                columnName: column.name,
                expectedType: column.type,
                expectedNullable: column.nullable
              },
              source: 'schema_check',
              autoFixable: false
            });
            continue;
          }
          
          const dbColumn = columnCheckResult.rows[0];
          
          // Check column type
          if (dbColumn.data_type !== column.type) {
            issues.push({
              type: 'schema_compliance',
              severity: this.severityLevels.HIGH,
              description: `Column has incorrect type`,
              entity: `${tableName}.${column.name}`,
              details: {
                tableName,
                columnName: column.name,
                expectedType: column.type,
                actualType: dbColumn.data_type
              },
              source: 'schema_check',
              autoFixable: false
            });
          }
          
          // Check nullability
          const isNullable = dbColumn.is_nullable === 'YES';
          if (isNullable !== column.nullable) {
            issues.push({
              type: 'schema_compliance',
              severity: this.severityLevels.MEDIUM,
              description: `Column has incorrect nullability`,
              entity: `${tableName}.${column.name}`,
              details: {
                tableName,
                columnName: column.name,
                expectedNullable: column.nullable,
                actualNullable: isNullable
              },
              source: 'schema_check',
              autoFixable: false
            });
          }
        }
      } catch (error) {
        logger.error(`Error checking schema compliance for ${tableName}: ${error.message}`);
      }
    }
    
    return issues;
  }
  
  /**
   * Attempt to automatically fix an issue
   * 
   * @param {Object} issue - Issue to fix
   * @returns {Promise<Object>} Fix result
   * @private
   */
  async _attemptAutoFix(issue) {
    try {
      switch (issue.type) {
        case 'missing_reference':
          return await this._fixMissingReference(issue);
          
        case 'null_value':
          return await this._fixNullValue(issue);
          
        case 'duplicate_entry':
          return await this._fixDuplicateEntry(issue);
          
        default:
          return {
            success: false,
            message: `Auto-fix not implemented for issue type: ${issue.type}`
          };
      }
    } catch (error) {
      logger.error(`Error auto-fixing issue ${issue.id}: ${error.message}`);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * Fix a missing reference issue
   * 
   * @param {Object} issue - Issue to fix
   * @returns {Promise<Object>} Fix result
   * @private
   */
  async _fixMissingReference(issue) {
    const { tableName, columnName, recordId } = issue.details;
    
    // Check which fix method to use based on configuration
    const fixMethod = this.config.autoFixOptions?.missingReferenceMethod || 'nullify';
    
    switch (fixMethod) {
      case 'nullify':
        // Set the reference to NULL (if column allows nulls)
        const columnInfo = this.schema[tableName].columns.find(col => col.name === columnName);
        
        if (!columnInfo) {
          return {
            success: false,
            message: `Column information not found for ${tableName}.${columnName}`
          };
        }
        
        if (!columnInfo.nullable) {
          return {
            success: false,
            message: `Cannot nullify non-nullable column ${tableName}.${columnName}`
          };
        }
        
        // Update the record
        const query = `
          UPDATE "${tableName}"
          SET "${columnName}" = NULL
          WHERE ${this.schema[tableName].primaryKey[0]} = $1
        `;
        
        await this.dbAdapter.query(query, [recordId]);
        
        return {
          success: true,
          resolution: 'Set invalid reference to NULL'
        };
        
      case 'delete':
        // Delete the record with the invalid reference
        const deleteQuery = `
          DELETE FROM "${tableName}"
          WHERE ${this.schema[tableName].primaryKey[0]} = $1
        `;
        
        await this.dbAdapter.query(deleteQuery, [recordId]);
        
        return {
          success: true,
          resolution: 'Deleted record with invalid reference'
        };
        
      default:
        return {
          success: false,
          message: `Unknown fix method: ${fixMethod}`
        };
    }
  }
  
  /**
   * Fix a null value issue
   * 
   * @param {Object} issue - Issue to fix
   * @returns {Promise<Object>} Fix result
   * @private
   */
  async _fixNullValue(issue) {
    const { tableName, columnName, recordId } = issue.details;
    
    // Check column type to determine default value
    const columnInfo = this.schema[tableName].columns.find(col => col.name === columnName);
    
    if (!columnInfo) {
      return {
        success: false,
        message: `Column information not found for ${tableName}.${columnName}`
      };
    }
    
    let defaultValue;
    
    // Determine appropriate default value based on type
    switch (columnInfo.type.toLowerCase()) {
      case 'integer':
      case 'bigint':
      case 'smallint':
      case 'numeric':
      case 'decimal':
        defaultValue = 0;
        break;
        
      case 'text':
      case 'character varying':
      case 'varchar':
      case 'char':
        defaultValue = '';
        break;
        
      case 'boolean':
        defaultValue = false;
        break;
        
      case 'date':
      case 'timestamp':
      case 'timestamptz':
        defaultValue = new Date().toISOString();
        break;
        
      case 'json':
      case 'jsonb':
        defaultValue = '{}';
        break;
        
      default:
        return {
          success: false,
          message: `Cannot determine default value for type ${columnInfo.type}`
        };
    }
    
    // Check if there's a configured default value
    if (this.config.autoFixOptions?.defaultValues && 
        this.config.autoFixOptions.defaultValues[`${tableName}.${columnName}`]) {
      defaultValue = this.config.autoFixOptions.defaultValues[`${tableName}.${columnName}`];
    }
    
    // Update the record
    const query = `
      UPDATE "${tableName}"
      SET "${columnName}" = $1
      WHERE ${this.schema[tableName].primaryKey[0]} = $2
    `;
    
    await this.dbAdapter.query(query, [defaultValue, recordId]);
    
    return {
      success: true,
      resolution: `Set null value to default: ${defaultValue}`
    };
  }
  
  /**
   * Fix a duplicate entry issue
   * 
   * @param {Object} issue - Issue to fix
   * @returns {Promise<Object>} Fix result
   * @private
   */
  async _fixDuplicateEntry(issue) {
    const { tableName, columns, values, recordId } = issue.details;
    
    // Check which fix method to use based on configuration
    const fixMethod = this.config.autoFixOptions?.duplicateEntryMethod || 'delete_duplicates';
    
    switch (fixMethod) {
      case 'delete_duplicates':
        // Keep the record with the provided ID and delete duplicates
        const whereConditions = columns.map(col => `"${col}" = $${columns.indexOf(col) + 1}`).join(' AND ');
        const deleteQuery = `
          DELETE FROM "${tableName}"
          WHERE ${whereConditions}
          AND ${this.schema[tableName].primaryKey[0]} != $${columns.length + 1}
        `;
        
        const params = [...columns.map(col => values[col]), recordId];
        const result = await this.dbAdapter.query(deleteQuery, params);
        
        return {
          success: true,
          resolution: `Deleted ${result.rowCount} duplicate records, kept record ID ${recordId}`
        };
        
      default:
        return {
          success: false,
          message: `Unknown fix method: ${fixMethod}`
        };
    }
  }
  
  /**
   * Send an alert for a high-severity issue
   * 
   * @param {Object} alert - Alert to send
   * @returns {Promise<Object>} Alert result
   * @private
   */
  async _sendAlert(alert) {
    try {
      // Check if there are configured alert endpoints
      if (!this.monitoringConfig.alertEndpoints || this.monitoringConfig.alertEndpoints.length === 0) {
        return {
          success: false,
          message: 'No alert endpoints configured'
        };
      }
      
      const sentTo = [];
      
      // Send alert to each endpoint
      for (const endpoint of this.monitoringConfig.alertEndpoints) {
        try {
          switch (endpoint.type) {
            case 'email':
              // Send email alert (implementation would depend on email service)
              logger.info(`Would send email alert to ${endpoint.address}: ${alert.message}`);
              sentTo.push(`email:${endpoint.address}`);
              break;
              
            case 'slack':
              // Send Slack alert (implementation would depend on Slack API)
              logger.info(`Would send Slack alert to ${endpoint.channel}: ${alert.message}`);
              sentTo.push(`slack:${endpoint.channel}`);
              break;
              
            case 'webhook':
              // Send webhook alert (implementation would depend on HTTP client)
              logger.info(`Would send webhook alert to ${endpoint.url}: ${alert.message}`);
              sentTo.push(`webhook:${endpoint.url}`);
              break;
              
            default:
              logger.warn(`Unknown alert endpoint type: ${endpoint.type}`);
          }
        } catch (endpointError) {
          logger.error(`Error sending alert to endpoint ${endpoint.type}: ${endpointError.message}`);
        }
      }
      
      return {
        success: sentTo.length > 0,
        sentTo
      };
    } catch (error) {
      logger.error(`Error sending alert: ${error.message}`);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * Stop the agent and clean up resources
   */
  async stop() {
    logger.info('Stopping Data Integrity Monitoring Agent');
    
    // Close database connection
    await this.dbAdapter.disconnect();
    
    // Call parent implementation
    await super.stop();
  }
}

module.exports = DataIntegrityAgent;