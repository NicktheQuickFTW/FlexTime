/**
 * ConstraintExtractor for FlexTime Microservices Migration
 * 
 * Extracts and catalogs all scheduling constraints from the existing FlexTime codebase
 * for migration to microservices architecture.
 * 
 * Usage:
 *   const extractor = new ConstraintExtractor({
 *     basePath: '/path/to/flextime',
 *     outputPath: './migration/constraints'
 *   });
 *   
 *   const constraints = await extractor.extractAllConstraints();
 */

const fs = require('fs');
const path = require('path');

class ConstraintExtractor {
  constructor(options = {}) {
    this.basePath = options.basePath || '/Users/nickw/Documents/GitHub/Flextime';
    this.outputPath = options.outputPath || './migration/constraints';
    this.constraints = {
      hard: [],
      soft: [],
      global: [],
      sportSpecific: {},
      venue: [],
      travel: [],
      database: [],
      algorithmic: []
    };
    this.dependencies = new Map();
    this.migrationComplexity = new Map();
    this.statistics = {
      totalConstraints: 0,
      filesProcessed: 0,
      constraintsByType: {},
      constraintsBySport: {}
    };
  }

  /**
   * Extract all constraints from the FlexTime codebase
   * @returns {Object} Extracted constraints object
   */
  async extractAllConstraints() {
    console.log('🚀 Starting FlexTime constraint extraction...');
    console.log(`📂 Base path: ${this.basePath}`);
    console.log(`📤 Output path: ${this.outputPath}`);
    
    try {
      // Extract sport-specific constraints
      await this.extractSportConstraints();
      
      // Extract global constraints
      await this.extractGlobalConstraints();
      
      // Extract venue constraints
      await this.extractVenueConstraints();
      
      // Extract travel constraints
      await this.extractTravelConstraints();
      
      // Extract database constraints
      await this.extractDatabaseConstraints();
      
      // Extract algorithmic constraints
      await this.extractAlgorithmicConstraints();
      
      // Analyze dependencies
      this.analyzeDependencies();
      
      // Assess migration complexity
      this.assessMigrationComplexity();
      
      // Calculate statistics
      this.calculateStatistics();
      
      // Generate migration reports
      await this.generateMigrationReports();
      
      console.log('✅ Constraint extraction completed successfully');
      console.log(`📊 Total constraints extracted: ${this.statistics.totalConstraints}`);
      console.log(`📄 Files processed: ${this.statistics.filesProcessed}`);
      
      return {
        constraints: this.constraints,
        dependencies: this.dependencies,
        migrationComplexity: this.migrationComplexity,
        statistics: this.statistics
      };
    } catch (error) {
      console.error('❌ Error during constraint extraction:', error.message);
      throw error;
    }
  }

  /**
   * Extract sport-specific constraints from specialized constraint files
   */
  async extractSportConstraints() {
    console.log('🏈 Extracting sport-specific constraints...');
    
    const sportFiles = [
      { file: 'football_constraints.js', sport: 'football' },
      { file: 'basketball_scheduling_constraints.js', sport: 'basketball' },
      { file: 'baseball_softball_constraints.js', sport: 'baseball_softball' },
      { file: 'tennis_constraints.js', sport: 'tennis' },
      { file: 'soccer_volleyball_constraints.js', sport: 'soccer_volleyball' },
      { file: 'wrestling_constraints.js', sport: 'wrestling' },
      { file: 'gymnastics_constraints.js', sport: 'gymnastics' }
    ];

    for (const { file, sport } of sportFiles) {
      const filePath = path.join(this.basePath, 'backend/src/ai/specialized', file);
      
      if (fs.existsSync(filePath)) {
        console.log(`  📋 Processing ${sport} constraints from ${file}...`);
        
        const constraints = this.parseConstraintFile(filePath);
        this.constraints.sportSpecific[sport] = constraints;
        
        // Categorize as hard or soft
        if (constraints.hard) {
          this.constraints.hard.push(...this.normalizeConstraints(constraints.hard, sport, 'hard'));
        }
        if (constraints.soft) {
          this.constraints.soft.push(...this.normalizeConstraints(constraints.soft, sport, 'soft'));
        }
        
        this.statistics.filesProcessed++;
        console.log(`    ✓ Found ${Object.keys(constraints.hard || {}).length} hard and ${Object.keys(constraints.soft || {}).length} soft constraints`);
      } else {
        console.log(`    ⚠️  File not found: ${file}`);
      }
    }
  }

  /**
   * Extract global constraints that apply across all sports
   */
  async extractGlobalConstraints() {
    console.log('🌐 Extracting global constraints...');
    
    const globalFile = path.join(this.basePath, 'backend/src/ai/specialized/global_constraints.js');
    
    if (fs.existsSync(globalFile)) {
      console.log('  📋 Processing global constraints...');
      
      const globalConstraints = this.parseConstraintFile(globalFile);
      this.constraints.global = globalConstraints;
      
      // BYU Sunday restriction is critical
      if (globalConstraints.teamSpecificConstraints?.BYU) {
        this.migrationComplexity.set('BYU_SUNDAY_RESTRICTION', 'CRITICAL');
        console.log('    🚨 Critical constraint identified: BYU Sunday Restriction');
      }
      
      this.statistics.filesProcessed++;
      console.log(`    ✓ Processed global constraints`);
    } else {
      console.log('    ⚠️  Global constraints file not found');
    }
  }

  /**
   * Extract venue sharing and facility constraints
   */
  async extractVenueConstraints() {
    console.log('🏟️  Extracting venue constraints...');
    
    const venueFile = path.join(this.basePath, 'backend/src/ai/specialized/venue_sharing_constraints.js');
    
    if (fs.existsSync(venueFile)) {
      console.log('  📋 Processing venue sharing constraints...');
      
      const venueConstraints = this.parseConstraintFile(venueFile);
      this.constraints.venue = venueConstraints;
      
      // Add dependency on venue management systems
      this.dependencies.set('venue_sharing', [
        'venue_management_system',
        'equipment_coordination',
        'priority_scheduling_system'
      ]);
      
      this.statistics.filesProcessed++;
      console.log(`    ✓ Processed venue sharing constraints`);
    } else {
      console.log('    ⚠️  Venue constraints file not found');
    }
  }

  /**
   * Extract travel optimization constraints
   */
  async extractTravelConstraints() {
    console.log('✈️  Extracting travel constraints...');
    
    const travelFile = path.join(this.basePath, 'backend/src/ai/specialized/travel_optimization_agent.js');
    
    if (fs.existsSync(travelFile)) {
      console.log('  📋 Processing travel optimization constraints...');
      
      const travelConstraints = this.parseTravelOptimizationFile(travelFile);
      this.constraints.travel = travelConstraints;
      
      // Add dependencies on external travel systems
      this.dependencies.set('travel_optimization', [
        'charter_booking_systems',
        'hotel_booking_systems',
        'weather_services',
        'cost_tracking_systems',
        'transport_coordination'
      ]);
      
      this.statistics.filesProcessed++;
      console.log(`    ✓ Found ${travelConstraints.length} travel optimization strategies`);
    } else {
      console.log('    ⚠️  Travel optimization file not found');
    }
  }

  /**
   * Extract database-level constraints
   */
  async extractDatabaseConstraints() {
    console.log('🗄️  Extracting database constraints...');
    
    const dbFiles = [
      'db-constraint.js',
      'constraint.js',
      'types.js',
      'db-venue.js'
    ];

    for (const file of dbFiles) {
      const filePath = path.join(this.basePath, 'backend/models', file);
      
      if (fs.existsSync(filePath)) {
        console.log(`  📋 Processing database constraints from ${file}...`);
        
        const dbConstraints = this.parseDatabaseConstraintFile(filePath);
        this.constraints.database.push(...dbConstraints);
        
        this.statistics.filesProcessed++;
        console.log(`    ✓ Found ${dbConstraints.length} database constraints`);
      } else {
        console.log(`    ⚠️  Database file not found: ${file}`);
      }
    }
  }

  /**
   * Extract algorithmic constraints from constraint evaluator
   */
  async extractAlgorithmicConstraints() {
    console.log('🧮 Extracting algorithmic constraints...');
    
    const algoFile = path.join(this.basePath, 'backend/src/algorithms/improvements/constraint_evaluator.js');
    
    if (fs.existsSync(algoFile)) {
      console.log('  📋 Processing algorithmic constraint evaluator...');
      
      const algoConstraints = this.parseAlgorithmicConstraintFile(algoFile);
      this.constraints.algorithmic = algoConstraints;
      
      // Add dependency on ML/AI systems
      this.dependencies.set('algorithmic_constraints', [
        'machine_learning_pipeline',
        'feedback_processing_system',
        'performance_analytics',
        'constraint_learning_system'
      ]);
      
      this.statistics.filesProcessed++;
      console.log(`    ✓ Found ${algoConstraints.length} algorithmic constraint evaluators`);
    } else {
      console.log('    ⚠️  Algorithmic constraints file not found');
    }
  }

  /**
   * Parse constraint file and extract constraint definitions
   * @param {string} filePath - Path to the constraint file
   * @returns {Object} Parsed constraints
   */
  parseConstraintFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract constraint objects using regex patterns
      const hardConstraintsMatch = content.match(/hard:\s*{([\s\S]*?)},?\s*(?:soft:|\/\/|$)/);
      const softConstraintsMatch = content.match(/soft:\s*{([\s\S]*?)},?\s*(?:\/\/|seasonParameters|mediaRights|$)/);
      
      const constraints = {};
      
      if (hardConstraintsMatch) {
        constraints.hard = this.parseConstraintObject(hardConstraintsMatch[1]);
      }
      
      if (softConstraintsMatch) {
        constraints.soft = this.parseConstraintObject(softConstraintsMatch[1]);
      }
      
      // Extract season parameters if present
      const seasonParamsMatch = content.match(/seasonParameters:\s*{([\s\S]*?)}/);
      if (seasonParamsMatch) {
        constraints.seasonParameters = this.parseSeasonParameters(seasonParamsMatch[1]);
      }
      
      return constraints;
    } catch (error) {
      console.error(`❌ Error parsing constraint file ${filePath}:`, error.message);
      return {};
    }
  }

  /**
   * Parse constraint object from string content
   * @param {string} content - String content to parse
   * @returns {Object} Parsed constraint object
   */
  parseConstraintObject(content) {
    const constraints = {};
    
    // Match constraint definitions including nested objects
    const constraintPattern = /'([^']+)':\s*{([^{}]*(?:{[^{}]*}[^{}]*)*)}/g;
    let match;
    
    while ((match = constraintPattern.exec(content)) !== null) {
      const [, name, definition] = match;
      constraints[name] = this.parseConstraintDefinition(definition);
    }
    
    return constraints;
  }

  /**
   * Parse individual constraint definition
   * @param {string} definition - Constraint definition string
   * @returns {Object} Parsed constraint
   */
  parseConstraintDefinition(definition) {
    const constraint = {};
    
    // Extract description
    const descMatch = definition.match(/description:\s*['"`]([^'"`]*?)['"`]/);
    if (descMatch) {
      constraint.description = descMatch[1];
    }
    
    // Extract weight
    const weightMatch = definition.match(/weight:\s*([\d.]+)/);
    if (weightMatch) {
      constraint.weight = parseFloat(weightMatch[1]);
    }
    
    // Extract enforced flag
    const enforcedMatch = definition.match(/enforced:\s*(true|false)/);
    if (enforcedMatch) {
      constraint.enforced = enforcedMatch[1] === 'true';
    }
    
    // Extract value
    const valueMatch = definition.match(/value:\s*(\d+)/);
    if (valueMatch) {
      constraint.value = parseInt(valueMatch[1]);
    }
    
    // Extract weeks
    const weeksMatch = definition.match(/weeks:\s*(\d+)/);
    if (weeksMatch) {
      constraint.weeks = parseInt(weeksMatch[1]);
    }
    
    // Extract priority
    const priorityMatch = definition.match(/priority:\s*['"`]([^'"`]*?)['"`]/);
    if (priorityMatch) {
      constraint.priority = priorityMatch[1];
    }
    
    return constraint;
  }

  /**
   * Parse season parameters
   * @param {string} content - Season parameters content
   * @returns {Object} Parsed season parameters
   */
  parseSeasonParameters(content) {
    const params = {};
    
    // Extract numeric parameters
    const numericMatches = content.match(/(\w+):\s*(\d+)/g);
    if (numericMatches) {
      for (const match of numericMatches) {
        const [, key, value] = match.match(/(\w+):\s*(\d+)/);
        params[key] = parseInt(value);
      }
    }
    
    // Extract boolean parameters
    const booleanMatches = content.match(/(\w+):\s*(true|false)/g);
    if (booleanMatches) {
      for (const match of booleanMatches) {
        const [, key, value] = match.match(/(\w+):\s*(true|false)/);
        params[key] = value === 'true';
      }
    }
    
    // Extract string parameters
    const stringMatches = content.match(/(\w+):\s*['"`]([^'"`]*?)['"`]/g);
    if (stringMatches) {
      for (const match of stringMatches) {
        const [, key, value] = match.match(/(\w+):\s*['"`]([^'"`]*?)['"`]/);
        params[key] = value;
      }
    }
    
    return params;
  }

  /**
   * Normalize constraints to a standard format
   * @param {Object} constraints - Raw constraints object
   * @param {string} sport - Sport name
   * @param {string} type - Constraint type (hard/soft)
   * @returns {Array} Normalized constraints
   */
  normalizeConstraints(constraints, sport, type) {
    return Object.entries(constraints).map(([name, definition]) => ({
      id: `${sport}_${name}`,
      name,
      sport,
      type,
      description: definition.description || '',
      weight: definition.weight || (type === 'hard' ? 10000 : 1.0),
      enforced: definition.enforced || (type === 'hard'),
      value: definition.value,
      weeks: definition.weeks,
      priority: definition.priority || 'medium',
      source: 'sport_specific'
    }));
  }

  /**
   * Parse travel optimization file for constraint strategies
   * @param {string} filePath - Path to travel optimization file
   * @returns {Array} Travel optimization constraints
   */
  parseTravelOptimizationFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract optimization strategies
      const strategiesMatch = content.match(/optimizationStrategies\s*=\s*{([\s\S]*?)};/);
      const strategies = [];
      
      if (strategiesMatch) {
        const strategyContent = strategiesMatch[1];
        const strategyMatches = strategyContent.match(/'([^']+)':/g);
        
        if (strategyMatches) {
          for (const match of strategyMatches) {
            const strategyName = match.replace(/['':]/g, '');
            strategies.push({
              id: `travel_${strategyName}`,
              name: strategyName,
              type: 'travel_optimization',
              category: 'travel',
              complexity: 'MEDIUM',
              source: 'travel_optimization_agent'
            });
          }
        }
      }
      
      // Extract constraint weights if present
      const weightsMatch = content.match(/constraintWeights\s*=\s*{([\s\S]*?)}/);
      if (weightsMatch) {
        const weightContent = weightsMatch[1];
        const weightMatches = weightContent.match(/(\w+):\s*([\d.]+)/g);
        
        if (weightMatches) {
          for (const weightMatch of weightMatches) {
            const [, constraintType, weight] = weightMatch.match(/(\w+):\s*([\d.]+)/);
            strategies.push({
              id: `travel_weight_${constraintType}`,
              name: constraintType,
              type: 'travel_weight',
              weight: parseFloat(weight),
              category: 'travel',
              source: 'travel_optimization_agent'
            });
          }
        }
      }
      
      return strategies;
    } catch (error) {
      console.error(`❌ Error parsing travel optimization file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Parse database constraint files for schema constraints
   * @param {string} filePath - Path to database file
   * @returns {Array} Database constraints
   */
  parseDatabaseConstraintFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const constraints = [];
      
      // Extract Sequelize model field definitions
      const fieldPattern = /(\w+):\s*{[^}]*type:\s*DataTypes\.(\w+)[^}]*}/g;
      let match;
      
      while ((match = fieldPattern.exec(content)) !== null) {
        const [fullMatch, fieldName, dataType] = match;
        
        // Extract additional properties
        const allowNullMatch = fullMatch.match(/allowNull:\s*(true|false)/);
        const defaultValueMatch = fullMatch.match(/defaultValue:\s*([^,}]+)/);
        const primaryKeyMatch = fullMatch.match(/primaryKey:\s*true/);
        const autoIncrementMatch = fullMatch.match(/autoIncrement:\s*true/);
        
        constraints.push({
          id: `db_${path.basename(filePath, '.js')}_${fieldName}`,
          name: fieldName,
          type: 'database_field',
          dataType: dataType,
          allowNull: allowNullMatch ? allowNullMatch[1] === 'true' : true,
          defaultValue: defaultValueMatch ? defaultValueMatch[1] : null,
          isPrimaryKey: !!primaryKeyMatch,
          isAutoIncrement: !!autoIncrementMatch,
          source: path.basename(filePath),
          category: 'database'
        });
      }
      
      // Extract ENUM constraints
      const enumPattern = /type:\s*DataTypes\.ENUM\(([^)]+)\)/g;
      while ((match = enumPattern.exec(content)) !== null) {
        const [fullMatch, enumValues] = match;
        
        constraints.push({
          id: `db_enum_${constraints.length}`,
          name: 'enum_constraint',
          type: 'database_enum',
          enumValues: enumValues.split(',').map(v => v.trim().replace(/['"]/g, '')),
          definition: fullMatch,
          source: path.basename(filePath),
          category: 'database'
        });
      }
      
      // Extract validation constraints
      const validatePattern = /validate:\s*{([^}]+)}/g;
      while ((match = validatePattern.exec(content)) !== null) {
        const [fullMatch, validationRules] = match;
        
        constraints.push({
          id: `db_validation_${constraints.length}`,
          name: 'validation_constraint',
          type: 'database_validation',
          rules: validationRules,
          source: path.basename(filePath),
          category: 'database'
        });
      }
      
      return constraints;
    } catch (error) {
      console.error(`❌ Error parsing database constraint file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Parse algorithmic constraint evaluator file
   * @param {string} filePath - Path to algorithmic constraints file
   * @returns {Array} Algorithmic constraints
   */
  parseAlgorithmicConstraintFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const constraints = [];
      
      // Extract evaluation methods
      const methodPattern = /_evaluate(\w+)/g;
      let match;
      
      while ((match = methodPattern.exec(content)) !== null) {
        const [fullMethod, constraintName] = match;
        
        // Convert camelCase to snake_case
        const normalizedName = constraintName.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        constraints.push({
          id: `algo_${normalizedName}`,
          name: normalizedName,
          type: 'algorithmic_evaluator',
          evaluationMethod: fullMethod,
          complexity: 'MEDIUM-HIGH',
          category: 'algorithmic',
          source: 'constraint_evaluator'
        });
      }
      
      // Extract default weights
      const weightsMatch = content.match(/defaultWeights\s*=\s*{([\s\S]*?)};/);
      if (weightsMatch) {
        const weightContent = weightsMatch[1];
        const weightPattern = /(\w+):\s*([\d.]+)/g;
        
        while ((match = weightPattern.exec(weightContent)) !== null) {
          const [, constraintType, weight] = match;
          
          // Find corresponding constraint and add weight
          const existingConstraint = constraints.find(c => 
            c.name.includes(constraintType.toLowerCase()) || 
            constraintType.toLowerCase().includes(c.name)
          );
          
          if (existingConstraint) {
            existingConstraint.defaultWeight = parseFloat(weight);
          } else {
            // Create weight-only constraint
            constraints.push({
              id: `algo_weight_${constraintType}`,
              name: constraintType,
              type: 'algorithmic_weight',
              defaultWeight: parseFloat(weight),
              category: 'algorithmic',
              source: 'constraint_evaluator'
            });
          }
        }
      }
      
      return constraints;
    } catch (error) {
      console.error(`❌ Error parsing algorithmic constraint file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Analyze constraint dependencies
   */
  analyzeDependencies() {
    console.log('🔗 Analyzing constraint dependencies...');
    
    // Cross-constraint dependencies
    const crossDependencies = new Map();
    
    // BYU Sunday restriction affects all sports
    crossDependencies.set('byu_sunday_restriction', this.getAllSportConstraints());
    
    // Venue sharing affects multiple sports
    crossDependencies.set('venue_sharing', ['basketball', 'volleyball', 'gymnastics', 'wrestling']);
    
    // Travel optimization affects all away games
    crossDependencies.set('travel_optimization', this.getAllSportConstraints());
    
    // Media rights affect football and basketball primarily
    crossDependencies.set('media_rights', ['football', 'basketball']);
    
    // Academic calendar affects all sports
    crossDependencies.set('academic_calendar', this.getAllSportConstraints());
    
    this.dependencies.set('cross_constraints', crossDependencies);
    
    console.log(`    ✓ Identified ${crossDependencies.size} cross-constraint dependencies`);
  }

  /**
   * Assess migration complexity for each constraint category
   */
  assessMigrationComplexity() {
    console.log('📊 Assessing migration complexity...');
    
    // Sport-specific complexities
    this.migrationComplexity.set('football', 'HIGH');
    this.migrationComplexity.set('basketball', 'MEDIUM-HIGH');
    this.migrationComplexity.set('baseball_softball', 'MEDIUM');
    this.migrationComplexity.set('tennis', 'MEDIUM');
    this.migrationComplexity.set('soccer_volleyball', 'MEDIUM');
    this.migrationComplexity.set('wrestling', 'MEDIUM');
    this.migrationComplexity.set('gymnastics', 'MEDIUM');
    
    // System complexities
    this.migrationComplexity.set('global_constraints', 'HIGH');
    this.migrationComplexity.set('venue_sharing', 'HIGH');
    this.migrationComplexity.set('travel_optimization', 'MEDIUM-HIGH');
    this.migrationComplexity.set('algorithmic_constraints', 'MEDIUM-HIGH');
    this.migrationComplexity.set('database_constraints', 'LOW-MEDIUM');
    
    console.log(`    ✓ Assessed complexity for ${this.migrationComplexity.size} categories`);
  }

  /**
   * Calculate extraction statistics
   */
  calculateStatistics() {
    this.statistics.totalConstraints = this.getTotalConstraintCount();
    this.statistics.constraintsByType = this.getConstraintsByCategory();
    this.statistics.constraintsBySport = this.getConstraintsBySport();
  }

  /**
   * Get all sport constraint names
   * @returns {Array} Array of sport names
   */
  getAllSportConstraints() {
    return Object.keys(this.constraints.sportSpecific);
  }

  /**
   * Generate comprehensive migration reports
   */
  async generateMigrationReports() {
    console.log('📋 Generating migration reports...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
      console.log(`    📁 Created output directory: ${this.outputPath}`);
    }
    
    // Generate constraint summary report
    await this.generateConstraintSummary();
    
    // Generate dependency analysis report
    await this.generateDependencyReport();
    
    // Generate complexity assessment report
    await this.generateComplexityReport();
    
    // Generate microservices mapping report
    await this.generateMicroservicesMapping();
    
    // Generate migration plan
    await this.generateMigrationPlan();
    
    console.log('    ✅ All migration reports generated successfully');
  }

  /**
   * Generate constraint summary report
   */
  async generateConstraintSummary() {
    const summary = {
      extractionTimestamp: new Date().toISOString(),
      totalConstraints: this.statistics.totalConstraints,
      filesProcessed: this.statistics.filesProcessed,
      constraintCounts: {
        hardConstraints: this.constraints.hard.length,
        softConstraints: this.constraints.soft.length,
        sportSpecificConstraints: Object.keys(this.constraints.sportSpecific).length,
        globalConstraints: Array.isArray(this.constraints.global) ? this.constraints.global.length : Object.keys(this.constraints.global).length,
        venueConstraints: this.constraints.venue.length,
        travelConstraints: this.constraints.travel.length,
        databaseConstraints: this.constraints.database.length,
        algorithmicConstraints: this.constraints.algorithmic.length
      },
      byCategory: this.statistics.constraintsByType,
      bySport: this.statistics.constraintsBySport,
      extractionSource: this.basePath
    };
    
    const outputFile = path.join(this.outputPath, 'constraint-summary.json');
    fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    console.log(`    📄 Constraint summary: ${outputFile}`);
  }

  /**
   * Generate dependency analysis report
   */
  async generateDependencyReport() {
    const dependencyReport = {
      extractionTimestamp: new Date().toISOString(),
      externalDependencies: this.getExternalDependencies(),
      internalDependencies: this.getInternalDependencies(),
      crossConstraintDependencies: this.getCrossConstraintDependencies(),
      migrationSequence: this.generateMigrationSequence(),
      dependencyGraph: this.buildDependencyGraph()
    };
    
    const outputFile = path.join(this.outputPath, 'dependency-analysis.json');
    fs.writeFileSync(outputFile, JSON.stringify(dependencyReport, null, 2));
    console.log(`    📄 Dependency analysis: ${outputFile}`);
  }

  /**
   * Generate complexity assessment report
   */
  async generateComplexityReport() {
    const complexityReport = {
      extractionTimestamp: new Date().toISOString(),
      overallComplexity: 'HIGH',
      complexityByCategory: Object.fromEntries(this.migrationComplexity),
      migrationPriorities: this.generateMigrationPriorities(),
      riskFactors: this.identifyRiskFactors(),
      recommendations: this.generateMigrationRecommendations(),
      complexityMatrix: this.buildComplexityMatrix()
    };
    
    const outputFile = path.join(this.outputPath, 'complexity-assessment.json');
    fs.writeFileSync(outputFile, JSON.stringify(complexityReport, null, 2));
    console.log(`    📄 Complexity assessment: ${outputFile}`);
  }

  /**
   * Generate microservices mapping report
   */
  async generateMicroservicesMapping() {
    const microservicesMap = {
      extractionTimestamp: new Date().toISOString(),
      'constraint-service': {
        responsibilities: [
          'Hard constraint validation',
          'Soft constraint scoring',
          'Constraint configuration management',
          'Cross-sport constraint coordination'
        ],
        constraints: [...this.constraints.hard, ...this.constraints.soft],
        complexity: 'HIGH',
        dependencies: ['database-service', 'notification-service', 'analytics-service'],
        estimatedEffort: '12-16 weeks'
      },
      'venue-service': {
        responsibilities: [
          'Venue availability management',
          'Venue sharing coordination',
          'Equipment scheduling',
          'Setup/teardown time management'
        ],
        constraints: this.constraints.venue,
        complexity: 'HIGH',
        dependencies: ['constraint-service', 'equipment-service', 'calendar-service'],
        estimatedEffort: '8-10 weeks'
      },
      'travel-service': {
        responsibilities: [
          'Travel optimization',
          'Cost calculation',
          'Charter coordination',
          'Multi-city trip planning'
        ],
        constraints: this.constraints.travel,
        complexity: 'MEDIUM-HIGH',
        dependencies: ['constraint-service', 'external-travel-apis', 'cost-tracking-service'],
        estimatedEffort: '6-8 weeks'
      },
      'sport-specific-services': this.generateSportSpecificServiceMap(),
      'global-coordination-service': {
        responsibilities: [
          'Cross-sport coordination',
          'BYU Sunday restrictions',
          'Conference-wide constraints',
          'Academic calendar integration'
        ],
        constraints: this.constraints.global,
        complexity: 'HIGH',
        dependencies: ['all-sport-services', 'constraint-service', 'academic-calendar-service'],
        estimatedEffort: '10-12 weeks'
      }
    };
    
    const outputFile = path.join(this.outputPath, 'microservices-mapping.json');
    fs.writeFileSync(outputFile, JSON.stringify(microservicesMap, null, 2));
    console.log(`    📄 Microservices mapping: ${outputFile}`);
  }

  /**
   * Generate migration plan
   */
  async generateMigrationPlan() {
    const migrationPlan = {
      extractionTimestamp: new Date().toISOString(),
      overview: {
        totalPhases: 5,
        estimatedDuration: '32-40 weeks',
        totalServices: this.calculateTotalServices(),
        criticalPath: ['constraint-service', 'global-coordination-service', 'venue-service']
      },
      phases: this.generateDetailedMigrationPhases(),
      riskMitigation: this.generateRiskMitigationPlan(),
      testing: this.generateTestingStrategy(),
      rollback: this.generateRollbackStrategy()
    };
    
    const outputFile = path.join(this.outputPath, 'migration-plan.json');
    fs.writeFileSync(outputFile, JSON.stringify(migrationPlan, null, 2));
    console.log(`    📄 Migration plan: ${outputFile}`);
  }

  /**
   * Generate sport-specific service mapping
   * @returns {Object} Sport-specific services mapping
   */
  generateSportSpecificServiceMap() {
    const sportServices = {};
    
    for (const [sport, constraints] of Object.entries(this.constraints.sportSpecific)) {
      const complexity = this.migrationComplexity.get(sport) || 'MEDIUM';
      const effortWeeks = this.calculateEffortWeeks(complexity);
      
      sportServices[`${sport}-service`] = {
        responsibilities: [
          `${sport} schedule generation`,
          `${sport} constraint validation`,
          `${sport} optimization`,
          `${sport} conflict resolution`
        ],
        constraints: constraints,
        complexity: complexity,
        dependencies: ['constraint-service', 'venue-service', 'travel-service'],
        estimatedEffort: effortWeeks
      };
    }
    
    return sportServices;
  }

  /**
   * Calculate effort weeks based on complexity
   * @param {string} complexity - Complexity level
   * @returns {string} Effort estimate in weeks
   */
  calculateEffortWeeks(complexity) {
    const effortMap = {
      'LOW': '2-4 weeks',
      'LOW-MEDIUM': '3-5 weeks',
      'MEDIUM': '4-6 weeks',
      'MEDIUM-HIGH': '6-8 weeks',
      'HIGH': '8-12 weeks',
      'CRITICAL': '12-16 weeks'
    };
    
    return effortMap[complexity] || '4-6 weeks';
  }

  /**
   * Utility methods for report generation
   */
  getTotalConstraintCount() {
    return this.constraints.hard.length + 
           this.constraints.soft.length + 
           (Array.isArray(this.constraints.global) ? this.constraints.global.length : Object.keys(this.constraints.global).length) +
           this.constraints.venue.length +
           this.constraints.travel.length +
           this.constraints.database.length +
           this.constraints.algorithmic.length;
  }

  getConstraintsByCategory() {
    return {
      hard: this.constraints.hard.length,
      soft: this.constraints.soft.length,
      global: Array.isArray(this.constraints.global) ? this.constraints.global.length : Object.keys(this.constraints.global).length,
      venue: this.constraints.venue.length,
      travel: this.constraints.travel.length,
      database: this.constraints.database.length,
      algorithmic: this.constraints.algorithmic.length
    };
  }

  getConstraintsBySport() {
    const bySport = {};
    for (const [sport, constraints] of Object.entries(this.constraints.sportSpecific)) {
      bySport[sport] = {
        hard: constraints.hard ? Object.keys(constraints.hard).length : 0,
        soft: constraints.soft ? Object.keys(constraints.soft).length : 0,
        total: (constraints.hard ? Object.keys(constraints.hard).length : 0) + 
               (constraints.soft ? Object.keys(constraints.soft).length : 0)
      };
    }
    return bySport;
  }

  getExternalDependencies() {
    return [
      'ESPN/FOX Media Rights Systems',
      'University Academic Calendar Systems',
      'Charter Flight Booking Systems',
      'Hotel Booking Systems',
      'Weather Data Services',
      'NCAA Championship Scheduling',
      'Conference Office Systems',
      'Venue Management Systems',
      'Equipment Coordination Systems',
      'Cost Tracking and Budgeting Systems'
    ];
  }

  getInternalDependencies() {
    return [
      'Team Management System',
      'Schedule Database',
      'Constraint Configuration System',
      'Notification System',
      'Performance Analytics',
      'User Interface Systems',
      'Authentication and Authorization',
      'Audit and Logging Systems',
      'Backup and Recovery Systems'
    ];
  }

  getCrossConstraintDependencies() {
    const crossDeps = this.dependencies.get('cross_constraints');
    return crossDeps ? Array.from(crossDeps.entries()) : [];
  }

  generateMigrationSequence() {
    return [
      { 
        phase: 1, 
        services: ['database-service', 'constraint-service'], 
        rationale: 'Foundation services required by all other services',
        duration: '8-10 weeks'
      },
      { 
        phase: 2, 
        services: ['venue-service', 'travel-service'], 
        rationale: 'Core operational services with cross-sport impact',
        duration: '6-8 weeks'
      },
      { 
        phase: 3, 
        services: ['football-service', 'basketball-service'], 
        rationale: 'High-priority, high-revenue sports with complex constraints',
        duration: '8-12 weeks'
      },
      { 
        phase: 4, 
        services: ['baseball-service', 'tennis-service', 'soccer-service', 'volleyball-service'], 
        rationale: 'Medium-priority sports with moderate constraint complexity',
        duration: '6-10 weeks'
      },
      { 
        phase: 5, 
        services: ['global-coordination-service', 'wrestling-service', 'gymnastics-service'], 
        rationale: 'Cross-sport coordination and remaining sport services',
        duration: '4-8 weeks'
      }
    ];
  }

  generateMigrationPriorities() {
    return {
      priority1: [
        'BYU Sunday restrictions (CRITICAL)',
        'Media rights constraints (HIGH)',
        'Venue sharing coordination (HIGH)'
      ],
      priority2: [
        'Football constraint complexity (HIGH)',
        'Basketball constraint complexity (MEDIUM-HIGH)',
        'Travel optimization (MEDIUM-HIGH)'
      ],
      priority3: [
        'Baseball/Softball series constraints (MEDIUM)',
        'Tennis round-robin constraints (MEDIUM)',
        'Academic calendar integration (MEDIUM)'
      ],
      priority4: [
        'Wrestling/Gymnastics equipment constraints (MEDIUM)',
        'Soccer/Volleyball weather constraints (MEDIUM)',
        'Database schema migration (LOW-MEDIUM)'
      ]
    };
  }

  identifyRiskFactors() {
    return [
      {
        risk: 'Complex venue sharing across multiple sports',
        impact: 'HIGH',
        probability: 'MEDIUM',
        mitigation: 'Implement dedicated venue coordination service with comprehensive testing'
      },
      {
        risk: 'BYU Sunday restriction affects all sports',
        impact: 'CRITICAL',
        probability: 'LOW',
        mitigation: 'Implement as highest priority global constraint with extensive validation'
      },
      {
        risk: 'Media rights integration with external systems',
        impact: 'HIGH',
        probability: 'MEDIUM',
        mitigation: 'Establish clear API contracts and fallback mechanisms'
      },
      {
        risk: 'Real-time travel cost optimization complexity',
        impact: 'MEDIUM',
        probability: 'HIGH',
        mitigation: 'Phase implementation with offline optimization first'
      },
      {
        risk: 'Cross-sport constraint dependencies',
        impact: 'HIGH',
        probability: 'MEDIUM',
        mitigation: 'Design clear service boundaries with event-driven architecture'
      },
      {
        risk: 'Academic calendar coordination across institutions',
        impact: 'MEDIUM',
        probability: 'MEDIUM',
        mitigation: 'Standardize calendar integration APIs'
      },
      {
        risk: 'Equipment sharing and setup time requirements',
        impact: 'MEDIUM',
        probability: 'HIGH',
        mitigation: 'Implement detailed equipment scheduling with buffer times'
      }
    ];
  }

  generateMigrationRecommendations() {
    return [
      'Implement BYU Sunday restriction as highest priority global constraint',
      'Create dedicated venue coordination service for shared facilities',
      'Establish clear service boundaries with well-defined APIs',
      'Implement gradual migration with sport-by-sport rollout',
      'Create comprehensive testing framework for constraint validation',
      'Establish monitoring and alerting for constraint violations',
      'Design for high availability given conference-critical nature',
      'Implement rollback capabilities for failed constraint updates',
      'Use event-driven architecture for cross-sport coordination',
      'Implement circuit breakers for external service dependencies',
      'Create detailed documentation for constraint business rules',
      'Establish performance benchmarks for constraint evaluation'
    ];
  }

  buildDependencyGraph() {
    const graph = {};
    
    // Build dependency relationships
    for (const [service, deps] of this.dependencies.entries()) {
      graph[service] = Array.isArray(deps) ? deps : Array.from(deps.values()).flat();
    }
    
    return graph;
  }

  buildComplexityMatrix() {
    const matrix = {};
    
    for (const [category, complexity] of this.migrationComplexity.entries()) {
      matrix[category] = {
        complexity,
        constraintCount: this.getConstraintCountForCategory(category),
        estimatedEffort: this.calculateEffortWeeks(complexity),
        dependencies: this.getDependenciesForCategory(category)
      };
    }
    
    return matrix;
  }

  getConstraintCountForCategory(category) {
    switch (category) {
      case 'football':
      case 'basketball':
      case 'baseball_softball':
      case 'tennis':
      case 'soccer_volleyball':
      case 'wrestling':
      case 'gymnastics':
        const constraints = this.constraints.sportSpecific[category];
        return constraints ? 
          (Object.keys(constraints.hard || {}).length + Object.keys(constraints.soft || {}).length) : 0;
      case 'global_constraints':
        return Array.isArray(this.constraints.global) ? 
          this.constraints.global.length : Object.keys(this.constraints.global).length;
      case 'venue_sharing':
        return this.constraints.venue.length;
      case 'travel_optimization':
        return this.constraints.travel.length;
      case 'algorithmic_constraints':
        return this.constraints.algorithmic.length;
      case 'database_constraints':
        return this.constraints.database.length;
      default:
        return 0;
    }
  }

  getDependenciesForCategory(category) {
    return this.dependencies.get(category) || [];
  }

  calculateTotalServices() {
    return 5 + Object.keys(this.constraints.sportSpecific).length; // 5 core services + sport services
  }

  generateDetailedMigrationPhases() {
    const sequence = this.generateMigrationSequence();
    
    return sequence.map((phase, index) => ({
      ...phase,
      prerequisites: index === 0 ? ['Infrastructure setup', 'Team training'] : 
                    [`Phase ${index} completion`, 'Service validation'],
      deliverables: phase.services.map(service => `${service} deployed and tested`),
      acceptanceCriteria: [
        'All services pass integration tests',
        'Performance benchmarks met',
        'Constraint validation accuracy > 99%'
      ]
    }));
  }

  generateRiskMitigationPlan() {
    return {
      preemptive: [
        'Comprehensive constraint validation testing',
        'Gradual rollout with feature flags',
        'Real-time monitoring and alerting',
        'Automated rollback mechanisms'
      ],
      reactive: [
        'Emergency rollback procedures',
        'Manual constraint override capabilities',
        'Emergency contact procedures',
        'Fallback to legacy system'
      ],
      monitoring: [
        'Constraint violation alerts',
        'Performance degradation alerts',
        'External dependency failure alerts',
        'Data integrity validation alerts'
      ]
    };
  }

  generateTestingStrategy() {
    return {
      unit: 'Individual constraint validation logic',
      integration: 'Service-to-service constraint coordination',
      endToEnd: 'Complete schedule generation with all constraints',
      performance: 'Constraint evaluation under load',
      regression: 'Existing schedule validation',
      userAcceptance: 'Conference staff validation of constraint behavior'
    };
  }

  generateRollbackStrategy() {
    return {
      immediate: 'Feature flags to disable new constraint services',
      shortTerm: 'Database rollback to previous constraint configurations',
      longTerm: 'Complete revert to legacy constraint system',
      dataProtection: 'Preserve all schedule and constraint history',
      validation: 'Verify constraint behavior after rollback'
    };
  }
}

module.exports = ConstraintExtractor;