/**
 * Simulation Engine
 * 
 * This module provides a simulation engine for generating realistic test
 * scenarios to evaluate agent behavior under various conditions.
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const logger = require("../utils/logger");

class SimulationEngine {
  /**
   * Create a new Simulation Engine
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      // Simulation configuration
      defaultTestSets: ['basic', 'advanced', 'edge_cases', 'stress'],
      casesPerSet: 25,
      difficultyLevels: ['basic', 'standard', 'challenging', 'extreme'],
      
      // Data sources for scenario generation
      dataDirectory: config.dataDirectory || path.join(__dirname, '../../../data/training/simulations'),
      templateDirectory: config.templateDirectory || path.join(__dirname, 'templates'),
      seedDataDirectory: config.seedDataDirectory || path.join(__dirname, 'seed_data'),
      
      // Randomization and diversity
      randomSeed: config.randomSeed || Date.now(),
      variationEnabled: config.variationEnabled !== false,
      
      // Time-based simulation
      timeDilation: config.timeDilation || 1.0,
      useRealWorldDates: config.useRealWorldDates !== false,
      
      ...config
    };
    
    // Simulation engine state
    this.initialized = false;
    this.templates = {};
    this.seedData = {};
    this.scenarios = {};
    
    // Initialize random generator with seed
    this.random = this._createRandomGenerator(this.config.randomSeed);
    
    logger.info('Simulation Engine initialized');
  }
  
  /**
   * Create a seeded random number generator
   * 
   * @param {number} seed - Random seed
   * @returns {Object} Random number generator
   * @private
   */
  _createRandomGenerator(seed) {
    // Simple xorshift128+ implementation for reproducible randomness
    let state0 = seed >>> 0;
    let state1 = (seed * 16807) >>> 0;
    
    // Ensure non-zero states
    if (state0 === 0) state0 = 1;
    if (state1 === 0) state1 = 2;
    
    function next() {
      // xorshift128+
      let s1 = state0;
      let s0 = state1;
      state0 = s0;
      s1 ^= s1 << 23;
      s1 ^= s1 >>> 17;
      s1 ^= s0;
      s1 ^= s0 >>> 26;
      state1 = s1;
      return (state0 + state1) >>> 0;
    }
    
    return {
      // Random float between 0 and 1
      random() {
        return next() / 4294967296;
      },
      
      // Random integer between min and max (inclusive)
      randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
      },
      
      // Random element from array
      randomElement(array) {
        return array[this.randomInt(0, array.length - 1)];
      },
      
      // Random boolean with given probability
      randomBool(probability = 0.5) {
        return this.random() < probability;
      },
      
      // Random date between start and end
      randomDate(start, end) {
        const startTime = start.getTime();
        const endTime = end.getTime();
        return new Date(startTime + this.random() * (endTime - startTime));
      }
    };
  }
  
  /**
   * Initialize the simulation engine
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info('Initializing Simulation Engine');
      
      // Create data directories if they don't exist
      await fs.mkdir(this.config.dataDirectory, { recursive: true });
      await fs.mkdir(this.config.templateDirectory, { recursive: true });
      await fs.mkdir(this.config.seedDataDirectory, { recursive: true });
      
      // Load simulation templates
      await this._loadTemplates();
      
      // Load seed data
      await this._loadSeedData();
      
      this.initialized = true;
      logger.info('Simulation Engine initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing Simulation Engine: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load simulation templates
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _loadTemplates() {
    try {
      logger.info('Loading simulation templates');
      
      // Check if template directory exists
      try {
        await fs.access(this.config.templateDirectory);
      } catch (error) {
        logger.warn(`Template directory not found: ${this.config.templateDirectory}`);
        
        // Create template directory and add default templates
        await fs.mkdir(this.config.templateDirectory, { recursive: true });
        await this._createDefaultTemplates();
      }
      
      // Get all template files
      const files = await fs.readdir(this.config.templateDirectory);
      
      // Load each template file
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.config.templateDirectory, file);
            const fileData = await fs.readFile(filePath, 'utf8');
            const template = JSON.parse(fileData);
            
            // Store template by agent type and test type
            const agentType = template.agentType || 'generic';
            const testType = template.testType || path.basename(file, '.json');
            
            if (!this.templates[agentType]) {
              this.templates[agentType] = {};
            }
            
            this.templates[agentType][testType] = template;
            
            logger.info(`Loaded template: ${agentType}/${testType}`);
          } catch (error) {
            logger.error(`Error loading template ${file}: ${error.message}`);
          }
        }
      }
      
      const templateCount = Object.values(this.templates)
        .reduce((count, agentTemplates) => count + Object.keys(agentTemplates).length, 0);
      
      logger.info(`Loaded ${templateCount} simulation templates`);
    } catch (error) {
      logger.error(`Error loading templates: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create default templates if none exist
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _createDefaultTemplates() {
    try {
      logger.info('Creating default templates');
      
      // Generic templates
      const genericTemplates = {
        'task_execution': {
          agentType: 'generic',
          testType: 'task_execution',
          description: 'Tests the agent\'s ability to execute tasks',
          parameters: {
            taskTypes: ['process_data', 'make_decision', 'coordinate'],
            complexity: ['simple', 'moderate', 'complex'],
            timeConstraints: [false, true]
          },
          generator: 'generateTaskExecutionTest'
        },
        'message_handling': {
          agentType: 'generic',
          testType: 'message_handling',
          description: 'Tests the agent\'s ability to handle messages',
          parameters: {
            messageTypes: ['request', 'response', 'notification', 'error'],
            priority: ['low', 'medium', 'high', 'critical'],
            hasAttachments: [false, true]
          },
          generator: 'generateMessageHandlingTest'
        },
        'error_handling': {
          agentType: 'generic',
          testType: 'error_handling',
          description: 'Tests the agent\'s ability to handle errors',
          parameters: {
            errorTypes: ['validation', 'timeout', 'access_denied', 'not_found', 'server_error'],
            severity: ['minor', 'major', 'critical'],
            recoverable: [true, false]
          },
          generator: 'generateErrorHandlingTest'
        }
      };
      
      // Director agent templates
      const directorTemplates = {
        'delegation': {
          agentType: 'director',
          testType: 'delegation',
          description: 'Tests the director agent\'s ability to delegate tasks',
          parameters: {
            agentCount: [1, 3, 5, 10],
            taskTypes: ['simple', 'complex', 'coordinated'],
            includeUnavailableAgents: [false, true]
          },
          generator: 'generateDelegationTest'
        },
        'coordination': {
          agentType: 'director',
          testType: 'coordination',
          description: 'Tests the director agent\'s ability to coordinate multiple agents',
          parameters: {
            scenarioTypes: ['sequential', 'parallel', 'mixed'],
            agentCount: [2, 5, 10],
            includeConflicts: [false, true]
          },
          generator: 'generateCoordinationTest'
        }
      };
      
      // Scheduling agent templates
      const schedulingTemplates = {
        'schedule_generation': {
          agentType: 'scheduling',
          testType: 'schedule_generation',
          description: 'Tests the scheduling agent\'s ability to generate schedules',
          parameters: {
            teamCount: [4, 8, 16, 32],
            constraintCount: [1, 5, 10, 20],
            sportType: ['basketball', 'football', 'baseball', 'soccer'],
            includeConflicts: [false, true]
          },
          generator: 'generateScheduleGenerationTest'
        },
        'constraint_handling': {
          agentType: 'scheduling',
          testType: 'constraint_handling',
          description: 'Tests the scheduling agent\'s ability to handle constraints',
          parameters: {
            constraintTypes: ['venue', 'date', 'team', 'travel', 'rest'],
            constraintCount: [1, 5, 10, 20],
            conflictingConstraints: [false, true]
          },
          generator: 'generateConstraintHandlingTest'
        }
      };
      
      // Write templates to files
      const allTemplates = {
        ...genericTemplates,
        ...directorTemplates,
        ...schedulingTemplates
      };
      
      for (const [name, template] of Object.entries(allTemplates)) {
        const filePath = path.join(this.config.templateDirectory, `${name}.json`);
        await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');
        logger.info(`Created template: ${filePath}`);
      }
      
      logger.info(`Created ${Object.keys(allTemplates).length} default templates`);
    } catch (error) {
      logger.error(`Error creating default templates: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load seed data for simulations
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _loadSeedData() {
    try {
      logger.info('Loading seed data');
      
      // Check if seed data directory exists
      try {
        await fs.access(this.config.seedDataDirectory);
      } catch (error) {
        logger.warn(`Seed data directory not found: ${this.config.seedDataDirectory}`);
        
        // Create seed data directory and add default seed data
        await fs.mkdir(this.config.seedDataDirectory, { recursive: true });
        await this._createDefaultSeedData();
      }
      
      // Get all seed data files
      const files = await fs.readdir(this.config.seedDataDirectory);
      
      // Load each seed data file
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(this.config.seedDataDirectory, file);
            const fileData = await fs.readFile(filePath, 'utf8');
            const seedData = JSON.parse(fileData);
            
            // Store seed data by type
            const dataType = path.basename(file, '.json');
            this.seedData[dataType] = seedData;
            
            logger.info(`Loaded seed data: ${dataType} (${Object.keys(seedData).length} items)`);
          } catch (error) {
            logger.error(`Error loading seed data ${file}: ${error.message}`);
          }
        }
      }
      
      logger.info(`Loaded ${Object.keys(this.seedData).length} seed data files`);
    } catch (error) {
      logger.error(`Error loading seed data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create default seed data if none exists
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _createDefaultSeedData() {
    try {
      logger.info('Creating default seed data');
      
      // Teams seed data
      const teamsData = {
        'teams': [
          { id: 'team-1', name: 'Tigers', conference: 'East' },
          { id: 'team-2', name: 'Lions', conference: 'East' },
          { id: 'team-3', name: 'Bears', conference: 'East' },
          { id: 'team-4', name: 'Eagles', conference: 'East' },
          { id: 'team-5', name: 'Wolves', conference: 'West' },
          { id: 'team-6', name: 'Cougars', conference: 'West' },
          { id: 'team-7', name: 'Falcons', conference: 'West' },
          { id: 'team-8', name: 'Hawks', conference: 'West' }
        ]
      };
      
      // Venues seed data
      const venuesData = {
        'venues': [
          { id: 'venue-1', name: 'Memorial Stadium', capacity: 15000, location: 'East City' },
          { id: 'venue-2', name: 'Victory Arena', capacity: 12000, location: 'North City' },
          { id: 'venue-3', name: 'Central Fieldhouse', capacity: 8000, location: 'Central City' },
          { id: 'venue-4', name: 'Western Coliseum', capacity: 20000, location: 'West City' }
        ]
      };
      
      // Constraints seed data
      const constraintsData = {
        'constraints': [
          { id: 'constraint-1', type: 'venue', description: 'Venue unavailable', parameters: { venueId: 'venue-1', dates: ['2023-11-15', '2023-11-16'] } },
          { id: 'constraint-2', type: 'team', description: 'Team unavailable', parameters: { teamId: 'team-3', dates: ['2023-11-20', '2023-11-21'] } },
          { id: 'constraint-3', type: 'travel', description: 'Maximum travel distance', parameters: { maxDistance: 500 } },
          { id: 'constraint-4', type: 'rest', description: 'Minimum rest days', parameters: { minDays: 2 } }
        ]
      };
      
      // Write seed data to files
      const allSeedData = {
        'teams.json': teamsData,
        'venues.json': venuesData,
        'constraints.json': constraintsData
      };
      
      for (const [fileName, data] of Object.entries(allSeedData)) {
        const filePath = path.join(this.config.seedDataDirectory, fileName);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        logger.info(`Created seed data: ${filePath}`);
      }
      
      logger.info(`Created ${Object.keys(allSeedData).length} default seed data files`);
    } catch (error) {
      logger.error(`Error creating default seed data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate simulations for an agent type
   * 
   * @param {string} agentType - Type of agent to generate simulations for
   * @param {Object} options - Simulation options
   * @returns {Promise<Array<Object>>} Generated simulations
   */
  async generateSimulations(agentType, options = {}) {
    try {
      // Ensure the engine is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      const testSets = options.testSets || this.config.defaultTestSets;
      const casesPerSet = options.casesPerSet || this.config.casesPerSet;
      const difficulty = options.difficulty || 'adaptive';
      
      logger.info(`Generating simulations for ${agentType} agent (${testSets.join(', ')})`);
      
      // Find templates for this agent type
      const agentTemplates = this.templates[agentType] || {};
      
      // Use generic templates as fallback
      const genericTemplates = this.templates.generic || {};
      
      // Combined templates
      const templates = { ...genericTemplates, ...agentTemplates };
      
      if (Object.keys(templates).length === 0) {
        logger.warn(`No templates found for agent type: ${agentType}`);
        return [];
      }
      
      // Generate test cases for each test set
      const simulations = [];
      
      for (const testSet of testSets) {
        logger.info(`Generating ${casesPerSet} test cases for set: ${testSet}`);
        
        // Select templates appropriate for this test set
        const setTemplates = this._selectTemplatesForTestSet(templates, testSet);
        
        if (Object.keys(setTemplates).length === 0) {
          logger.warn(`No templates found for test set: ${testSet}`);
          continue;
        }
        
        // Generate cases for this set
        for (let i = 0; i < casesPerSet; i++) {
          // Select test type
          const testType = this._selectTestType(setTemplates, testSet, i);
          
          // Get template
          const template = setTemplates[testType];
          
          if (!template) {
            logger.warn(`Template not found for test type: ${testType}`);
            continue;
          }
          
          // Determine difficulty level for this test
          const testDifficulty = this._determineTestDifficulty(
            difficulty,
            testSet,
            i,
            casesPerSet
          );
          
          // Generate test case
          const testCase = await this._generateTestCase(
            template,
            agentType,
            testType,
            testDifficulty,
            testSet
          );
          
          // Add test case to simulations
          simulations.push({
            id: `${testSet}-${agentType}-${testType}-${i + 1}`,
            agentType,
            testSet,
            type: testType,
            difficulty: testDifficulty,
            ...testCase
          });
        }
      }
      
      logger.info(`Generated ${simulations.length} simulations for ${agentType} agent`);
      
      return simulations;
    } catch (error) {
      logger.error(`Error generating simulations: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Select templates appropriate for a test set
   * 
   * @param {Object} templates - Available templates
   * @param {string} testSet - Test set name
   * @returns {Object} Selected templates
   * @private
   */
  _selectTemplatesForTestSet(templates, testSet) {
    // Select templates based on test set
    switch (testSet) {
      case 'basic':
        // Basic test set uses simple templates that test core functionality
        return Object.entries(templates)
          .filter(([_, template]) => !template.advanced && !template.edgeCase)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        
      case 'advanced':
        // Advanced test set uses more complex templates
        return Object.entries(templates)
          .filter(([_, template]) => template.advanced || !template.edgeCase)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        
      case 'edge_cases':
        // Edge cases test set uses templates that test boundary conditions
        return Object.entries(templates)
          .filter(([_, template]) => template.edgeCase || template.advanced)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        
      case 'stress':
        // Stress test set uses templates that test performance under load
        return Object.entries(templates)
          .filter(([_, template]) => template.stress || template.advanced)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
        
      default:
        // Default to all templates
        return templates;
    }
  }
  
  /**
   * Select a test type for a specific test
   * 
   * @param {Object} templates - Available templates
   * @param {string} testSet - Test set name
   * @param {number} index - Test index
   * @returns {string} Selected test type
   * @private
   */
  _selectTestType(templates, testSet, index) {
    // Get available test types
    const testTypes = Object.keys(templates);
    
    if (testTypes.length === 0) {
      return null;
    }
    
    // Select test type based on distribution appropriate for test set
    switch (testSet) {
      case 'basic':
        // In basic test set, focus on core test types
        if (index < testTypes.length) {
          // First tests cover each test type
          return testTypes[index];
        } else {
          // Remaining tests distributed based on importance
          return this.random.randomElement(testTypes);
        }
        
      case 'advanced':
      case 'edge_cases':
      case 'stress':
        // More randomized selection for advanced sets
        return this.random.randomElement(testTypes);
        
      default:
        // Default to random selection
        return this.random.randomElement(testTypes);
    }
  }
  
  /**
   * Determine difficulty level for a test
   * 
   * @param {string} difficulty - Overall difficulty setting
   * @param {string} testSet - Test set name
   * @param {number} index - Test index
   * @param {number} total - Total tests in set
   * @returns {string} Difficulty level
   * @private
   */
  _determineTestDifficulty(difficulty, testSet, index, total) {
    // Get available difficulty levels
    const difficultyLevels = this.config.difficultyLevels;
    
    // If specific difficulty is requested, use it
    if (difficulty !== 'adaptive' && difficultyLevels.includes(difficulty)) {
      return difficulty;
    }
    
    // For adaptive difficulty, determine based on test set and position
    switch (testSet) {
      case 'basic':
        // Basic test set starts easy and gradually increases
        const basicProgress = index / total;
        if (basicProgress < 0.5) {
          return 'basic';
        } else if (basicProgress < 0.8) {
          return 'standard';
        } else {
          return 'challenging';
        }
        
      case 'advanced':
        // Advanced test set is mostly standard with some challenging
        return this.random.randomBool(0.3) ? 'challenging' : 'standard';
        
      case 'edge_cases':
        // Edge cases are challenging or extreme
        return this.random.randomBool(0.4) ? 'extreme' : 'challenging';
        
      case 'stress':
        // Stress tests are always extreme
        return 'extreme';
        
      default:
        // Default to standard
        return 'standard';
    }
  }
  
  /**
   * Generate a test case from a template
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} testType - Test type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Promise<Object>} Generated test case
   * @private
   */
  async _generateTestCase(template, agentType, testType, difficulty, testSet) {
    try {
      // Use template generator if available
      if (template.generator && typeof this[template.generator] === 'function') {
        return this[template.generator](template, agentType, difficulty, testSet);
      }
      
      // Default generic test case generation
      return this._generateGenericTestCase(template, agentType, difficulty, testSet);
    } catch (error) {
      logger.error(`Error generating test case: ${error.message}`);
      
      // Return a fallback test case
      return {
        description: `Fallback test case for ${testType}`,
        parameters: {},
        difficulty,
        testSet,
        type: testType
      };
    }
  }
  
  /**
   * Generate a generic test case
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Object} Generated test case
   * @private
   */
  _generateGenericTestCase(template, agentType, difficulty, testSet) {
    // Generate a test case with random parameters from the template
    const testCase = {
      description: template.description || `Test case for ${agentType}`,
      parameters: {},
      difficulty,
      testSet,
      type: template.testType
    };
    
    // Fill in parameters from template
    if (template.parameters) {
      for (const [param, values] of Object.entries(template.parameters)) {
        if (Array.isArray(values) && values.length > 0) {
          // Select value based on difficulty
          let value;
          
          switch (difficulty) {
            case 'basic':
              // For basic difficulty, select simpler options
              value = values[0];
              break;
              
            case 'standard':
              // For standard difficulty, select from earlier options
              value = values[Math.floor(this.random.random() * Math.min(values.length, 2))];
              break;
              
            case 'challenging':
              // For challenging difficulty, select from all options
              value = this.random.randomElement(values);
              break;
              
            case 'extreme':
              // For extreme difficulty, select harder options
              value = values[Math.floor(this.random.random() * values.length * 0.5) + Math.floor(values.length * 0.5)];
              break;
              
            default:
              value = this.random.randomElement(values);
          }
          
          testCase.parameters[param] = value;
        }
      }
    }
    
    return testCase;
  }
  
  /**
   * Generate a task execution test case
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Object} Generated test case
   * @private
   */
  generateTaskExecutionTest(template, agentType, difficulty, testSet) {
    // Get parameters from template
    const taskTypes = template.parameters.taskTypes || 
      ['process_data', 'make_decision', 'coordinate'];
    
    const complexity = template.parameters.complexity || 
      ['simple', 'moderate', 'complex'];
    
    const timeConstraints = template.parameters.timeConstraints || 
      [false, true];
    
    // Select parameters based on difficulty
    let taskType, taskComplexity, hasTimeConstraint;
    
    switch (difficulty) {
      case 'basic':
        taskType = taskTypes[0];
        taskComplexity = complexity[0];
        hasTimeConstraint = false;
        break;
        
      case 'standard':
        taskType = this.random.randomElement(taskTypes.slice(0, 2));
        taskComplexity = this.random.randomElement(complexity.slice(0, 2));
        hasTimeConstraint = this.random.randomBool(0.2);
        break;
        
      case 'challenging':
        taskType = this.random.randomElement(taskTypes);
        taskComplexity = this.random.randomElement(complexity.slice(1));
        hasTimeConstraint = this.random.randomBool(0.5);
        break;
        
      case 'extreme':
        taskType = this.random.randomElement(taskTypes);
        taskComplexity = complexity[complexity.length - 1];
        hasTimeConstraint = true;
        break;
        
      default:
        taskType = this.random.randomElement(taskTypes);
        taskComplexity = this.random.randomElement(complexity);
        hasTimeConstraint = this.random.randomBool(0.3);
    }
    
    // Create the task
    const task = {
      taskId: uuidv4(),
      taskType,
      description: `${taskComplexity} ${taskType} task`,
      priority: difficulty === 'extreme' ? 3 : (difficulty === 'challenging' ? 2 : 1),
      parameters: {
        complexity: taskComplexity
      }
    };
    
    // Add time constraint if needed
    if (hasTimeConstraint) {
      task.deadline = new Date(Date.now() + 1000).toISOString();
    }
    
    // Add agent-specific task data
    switch (agentType) {
      case 'director':
        task.subAgents = this.random.randomInt(1, 3);
        break;
        
      case 'scheduling':
        task.parameters.teamCount = this.random.randomInt(4, 16);
        task.parameters.sportType = this.random.randomElement(['basketball', 'football', 'baseball']);
        break;
        
      case 'specialized':
        task.parameters.specializationDegree = this.random.randomInt(1, 5);
        break;
    }
    
    return {
      type: 'task_execution',
      description: `Task execution test (${taskComplexity} ${taskType})`,
      task
    };
  }
  
  /**
   * Generate a message handling test case
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Object} Generated test case
   * @private
   */
  generateMessageHandlingTest(template, agentType, difficulty, testSet) {
    // Get parameters from template
    const messageTypes = template.parameters.messageTypes || 
      ['request', 'response', 'notification', 'error'];
    
    const priority = template.parameters.priority || 
      ['low', 'medium', 'high', 'critical'];
    
    const hasAttachments = template.parameters.hasAttachments || 
      [false, true];
    
    // Select parameters based on difficulty
    let messageType, messagePriority, includeAttachments;
    
    switch (difficulty) {
      case 'basic':
        messageType = this.random.randomElement(messageTypes.slice(0, 2));
        messagePriority = priority[0];
        includeAttachments = false;
        break;
        
      case 'standard':
        messageType = this.random.randomElement(messageTypes);
        messagePriority = this.random.randomElement(priority.slice(0, 2));
        includeAttachments = this.random.randomBool(0.3);
        break;
        
      case 'challenging':
        messageType = this.random.randomElement(messageTypes);
        messagePriority = this.random.randomElement(priority.slice(1, 3));
        includeAttachments = this.random.randomBool(0.7);
        break;
        
      case 'extreme':
        messageType = messageTypes[messageTypes.length - 1];
        messagePriority = priority[priority.length - 1];
        includeAttachments = true;
        break;
        
      default:
        messageType = this.random.randomElement(messageTypes);
        messagePriority = this.random.randomElement(priority);
        includeAttachments = this.random.randomBool(0.5);
    }
    
    // Create the message
    const message = {
      messageId: uuidv4(),
      senderId: `agent-${this.random.randomInt(1, 10)}`,
      recipientId: `${agentType}-agent`,
      messageType,
      priority: messagePriority,
      content: {
        text: `Test ${messageType} message with ${messagePriority} priority`,
        timestamp: new Date().toISOString()
      },
      metadata: {
        priority: messagePriority,
        category: this.random.randomElement(['system', 'user', 'automated'])
      }
    };
    
    // Add attachments if needed
    if (includeAttachments) {
      message.content.attachments = [
        {
          id: uuidv4(),
          type: 'data',
          size: this.random.randomInt(1, 1024)
        }
      ];
    }
    
    // Add agent-specific message data
    switch (agentType) {
      case 'director':
        message.content.targetAgents = this.random.randomInt(1, 5);
        break;
        
      case 'scheduling':
        message.content.scheduleId = uuidv4();
        message.content.teamIds = Array.from(
          { length: this.random.randomInt(2, 8) }, 
          () => `team-${this.random.randomInt(1, 20)}`
        );
        break;
    }
    
    return {
      type: 'message_handling',
      description: `Message handling test (${messageType}, ${messagePriority})`,
      message
    };
  }
  
  /**
   * Generate an error handling test case
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Object} Generated test case
   * @private
   */
  generateErrorHandlingTest(template, agentType, difficulty, testSet) {
    // Get parameters from template
    const errorTypes = template.parameters.errorTypes || 
      ['validation', 'timeout', 'access_denied', 'not_found', 'server_error'];
    
    const severity = template.parameters.severity || 
      ['minor', 'major', 'critical'];
    
    const recoverable = template.parameters.recoverable || 
      [true, false];
    
    // Select parameters based on difficulty
    let errorType, errorSeverity, isRecoverable;
    
    switch (difficulty) {
      case 'basic':
        errorType = errorTypes[0];
        errorSeverity = severity[0];
        isRecoverable = true;
        break;
        
      case 'standard':
        errorType = this.random.randomElement(errorTypes.slice(0, 3));
        errorSeverity = this.random.randomElement(severity.slice(0, 2));
        isRecoverable = this.random.randomBool(0.8);
        break;
        
      case 'challenging':
        errorType = this.random.randomElement(errorTypes.slice(1));
        errorSeverity = this.random.randomElement(severity.slice(1));
        isRecoverable = this.random.randomBool(0.5);
        break;
        
      case 'extreme':
        errorType = errorTypes[errorTypes.length - 1];
        errorSeverity = severity[severity.length - 1];
        isRecoverable = false;
        break;
        
      default:
        errorType = this.random.randomElement(errorTypes);
        errorSeverity = this.random.randomElement(severity);
        isRecoverable = this.random.randomBool(0.7);
    }
    
    // Create the error scenario
    const errorScenario = {
      type: errorType,
      severity: errorSeverity,
      recoverable: isRecoverable,
      message: `Test ${errorSeverity} ${errorType} error`,
      code: this.random.randomInt(400, 599),
      timestamp: new Date().toISOString()
    };
    
    // Add agent-specific error data
    switch (agentType) {
      case 'director':
        errorScenario.affectedAgents = this.random.randomInt(1, 5);
        break;
        
      case 'scheduling':
        errorScenario.scheduleId = uuidv4();
        errorScenario.constraintViolations = this.random.randomInt(0, 3);
        break;
    }
    
    // Add cascading errors for higher difficulties
    if (difficulty === 'challenging' || difficulty === 'extreme') {
      errorScenario.cascading = true;
      errorScenario.subsequentErrors = this.random.randomInt(1, 3);
    }
    
    return {
      type: 'error_handling',
      description: `Error handling test (${errorSeverity} ${errorType})`,
      errorScenario
    };
  }
  
  /**
   * Generate a delegation test case for director agents
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Object} Generated test case
   * @private
   */
  generateDelegationTest(template, agentType, difficulty, testSet) {
    // Only applicable for director agents
    if (agentType !== 'director') {
      return this.generateTaskExecutionTest(template, agentType, difficulty, testSet);
    }
    
    // Get parameters from template
    const agentCounts = template.parameters.agentCount || [1, 3, 5, 10];
    const taskTypes = template.parameters.taskTypes || ['simple', 'complex', 'coordinated'];
    const includeUnavailableAgents = template.parameters.includeUnavailableAgents || [false, true];
    
    // Select parameters based on difficulty
    let agentCount, taskType, hasUnavailableAgents;
    
    switch (difficulty) {
      case 'basic':
        agentCount = agentCounts[0];
        taskType = taskTypes[0];
        hasUnavailableAgents = false;
        break;
        
      case 'standard':
        agentCount = this.random.randomElement(agentCounts.slice(0, 2));
        taskType = this.random.randomElement(taskTypes.slice(0, 2));
        hasUnavailableAgents = this.random.randomBool(0.2);
        break;
        
      case 'challenging':
        agentCount = this.random.randomElement(agentCounts.slice(1));
        taskType = this.random.randomElement(taskTypes.slice(1));
        hasUnavailableAgents = this.random.randomBool(0.5);
        break;
        
      case 'extreme':
        agentCount = agentCounts[agentCounts.length - 1];
        taskType = taskTypes[taskTypes.length - 1];
        hasUnavailableAgents = true;
        break;
        
      default:
        agentCount = this.random.randomElement(agentCounts);
        taskType = this.random.randomElement(taskTypes);
        hasUnavailableAgents = this.random.randomBool(0.3);
    }
    
    // Create the delegation scenario
    const agents = [];
    
    for (let i = 0; i < agentCount; i++) {
      agents.push({
        agentId: `agent-${i + 1}`,
        agentType: this.random.randomElement(['specialized', 'processing', 'analysis']),
        capabilities: [
          this.random.randomElement(['task_a', 'task_b', 'task_c']),
          this.random.randomElement(['capability_x', 'capability_y', 'capability_z'])
        ],
        available: !(hasUnavailableAgents && this.random.randomBool(0.2))
      });
    }
    
    // Create the task to delegate
    const taskToDelegate = {
      taskId: uuidv4(),
      taskType,
      description: `${taskType} task for delegation`,
      priority: difficulty === 'extreme' ? 3 : (difficulty === 'challenging' ? 2 : 1),
      parameters: {
        complexity: this.random.randomElement(['simple', 'moderate', 'complex']),
        requiredCapabilities: [
          this.random.randomElement(['task_a', 'task_b', 'task_c']),
          this.random.randomElement(['capability_x', 'capability_y', 'capability_z'])
        ]
      }
    };
    
    return {
      type: 'delegation',
      description: `Delegation test (${taskType}, ${agentCount} agents)`,
      agents,
      task: taskToDelegate
    };
  }
  
  /**
   * Generate a coordination test case for director agents
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Object} Generated test case
   * @private
   */
  generateCoordinationTest(template, agentType, difficulty, testSet) {
    // Only applicable for director agents
    if (agentType !== 'director') {
      return this.generateTaskExecutionTest(template, agentType, difficulty, testSet);
    }
    
    // Get parameters from template
    const scenarioTypes = template.parameters.scenarioTypes || ['sequential', 'parallel', 'mixed'];
    const agentCounts = template.parameters.agentCount || [2, 5, 10];
    const includeConflicts = template.parameters.includeConflicts || [false, true];
    
    // Select parameters based on difficulty
    let scenarioType, agentCount, hasConflicts;
    
    switch (difficulty) {
      case 'basic':
        scenarioType = scenarioTypes[0];
        agentCount = agentCounts[0];
        hasConflicts = false;
        break;
        
      case 'standard':
        scenarioType = this.random.randomElement(scenarioTypes.slice(0, 2));
        agentCount = this.random.randomElement(agentCounts.slice(0, 2));
        hasConflicts = this.random.randomBool(0.2);
        break;
        
      case 'challenging':
        scenarioType = this.random.randomElement(scenarioTypes.slice(1));
        agentCount = this.random.randomElement(agentCounts.slice(1));
        hasConflicts = this.random.randomBool(0.5);
        break;
        
      case 'extreme':
        scenarioType = scenarioTypes[scenarioTypes.length - 1];
        agentCount = agentCounts[agentCounts.length - 1];
        hasConflicts = true;
        break;
        
      default:
        scenarioType = this.random.randomElement(scenarioTypes);
        agentCount = this.random.randomElement(agentCounts);
        hasConflicts = this.random.randomBool(0.3);
    }
    
    // Create the coordination scenario
    const agents = [];
    
    for (let i = 0; i < agentCount; i++) {
      agents.push({
        agentId: `agent-${i + 1}`,
        agentType: this.random.randomElement(['specialized', 'processing', 'analysis']),
        capabilities: [
          this.random.randomElement(['task_a', 'task_b', 'task_c']),
          this.random.randomElement(['capability_x', 'capability_y', 'capability_z'])
        ],
        priority: this.random.randomInt(1, 3)
      });
    }
    
    // Create the coordination tasks
    const tasks = [];
    const taskCount = scenarioType === 'sequential' ? agentCount : 
      (scenarioType === 'parallel' ? 1 : this.random.randomInt(2, 4));
    
    for (let i = 0; i < taskCount; i++) {
      tasks.push({
        taskId: uuidv4(),
        taskType: this.random.randomElement(['process', 'analyze', 'coordinate']),
        description: `Task ${i + 1} for coordination`,
        priority: this.random.randomInt(1, 3),
        parameters: {
          complexity: this.random.randomElement(['simple', 'moderate', 'complex']),
          requiredCapabilities: [
            this.random.randomElement(['task_a', 'task_b', 'task_c']),
            this.random.randomElement(['capability_x', 'capability_y', 'capability_z'])
          ]
        },
        dependencies: scenarioType === 'sequential' && i > 0 ? 
          [tasks[i - 1].taskId] : []
      });
    }
    
    // Add conflicts if needed
    const conflicts = [];
    
    if (hasConflicts) {
      const conflictCount = this.random.randomInt(1, Math.min(3, agentCount - 1));
      
      for (let i = 0; i < conflictCount; i++) {
        // Create a resource conflict between two random agents
        const agent1Index = this.random.randomInt(0, agentCount - 1);
        let agent2Index;
        
        do {
          agent2Index = this.random.randomInt(0, agentCount - 1);
        } while (agent2Index === agent1Index);
        
        conflicts.push({
          type: this.random.randomElement(['resource', 'priority', 'dependency']),
          description: `Conflict between ${agents[agent1Index].agentId} and ${agents[agent2Index].agentId}`,
          agents: [agents[agent1Index].agentId, agents[agent2Index].agentId],
          resource: this.random.randomElement(['cpu', 'memory', 'access'])
        });
      }
    }
    
    return {
      type: 'coordination',
      description: `Coordination test (${scenarioType}, ${agentCount} agents)`,
      scenarioType,
      agents,
      tasks,
      conflicts
    };
  }
  
  /**
   * Generate a schedule generation test case
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Object} Generated test case
   * @private
   */
  generateScheduleGenerationTest(template, agentType, difficulty, testSet) {
    // Only applicable for scheduling agents
    if (agentType !== 'scheduling') {
      return this.generateTaskExecutionTest(template, agentType, difficulty, testSet);
    }
    
    // Get parameters from template
    const teamCounts = template.parameters.teamCount || [4, 8, 16, 32];
    const constraintCounts = template.parameters.constraintCount || [1, 5, 10, 20];
    const sportTypes = template.parameters.sportType || ['basketball', 'football', 'baseball', 'soccer'];
    const includeConflicts = template.parameters.includeConflicts || [false, true];
    
    // Select parameters based on difficulty
    let teamCount, constraintCount, sportType, hasConflicts;
    
    switch (difficulty) {
      case 'basic':
        teamCount = teamCounts[0];
        constraintCount = constraintCounts[0];
        sportType = sportTypes[0];
        hasConflicts = false;
        break;
        
      case 'standard':
        teamCount = this.random.randomElement(teamCounts.slice(0, 2));
        constraintCount = this.random.randomElement(constraintCounts.slice(0, 2));
        sportType = this.random.randomElement(sportTypes);
        hasConflicts = this.random.randomBool(0.2);
        break;
        
      case 'challenging':
        teamCount = this.random.randomElement(teamCounts.slice(1, 3));
        constraintCount = this.random.randomElement(constraintCounts.slice(1, 3));
        sportType = this.random.randomElement(sportTypes);
        hasConflicts = this.random.randomBool(0.5);
        break;
        
      case 'extreme':
        teamCount = teamCounts[teamCounts.length - 1];
        constraintCount = constraintCounts[constraintCounts.length - 1];
        sportType = this.random.randomElement(sportTypes);
        hasConflicts = true;
        break;
        
      default:
        teamCount = this.random.randomElement(teamCounts);
        constraintCount = this.random.randomElement(constraintCounts);
        sportType = this.random.randomElement(sportTypes);
        hasConflicts = this.random.randomBool(0.3);
    }
    
    // Create the teams based on seed data
    const teams = this.seedData.teams?.teams || [];
    let selectedTeams = [];
    
    if (teams.length > 0) {
      // Use seed data teams
      for (let i = 0; i < teamCount && i < teams.length; i++) {
        selectedTeams.push({ ...teams[i] });
      }
      
      // If we need more teams, generate them
      while (selectedTeams.length < teamCount) {
        selectedTeams.push({
          id: `team-${selectedTeams.length + 1}`,
          name: `Team ${selectedTeams.length + 1}`,
          conference: this.random.randomElement(['East', 'West', 'North', 'South'])
        });
      }
    } else {
      // Generate teams
      for (let i = 0; i < teamCount; i++) {
        selectedTeams.push({
          id: `team-${i + 1}`,
          name: `Team ${i + 1}`,
          conference: this.random.randomElement(['East', 'West', 'North', 'South'])
        });
      }
    }
    
    // Create venues based on seed data
    const venues = this.seedData.venues?.venues || [];
    let selectedVenues = [];
    
    if (venues.length > 0) {
      // Use seed data venues
      for (let i = 0; i < teamCount && i < venues.length; i++) {
        selectedVenues.push({ ...venues[i] });
      }
      
      // If we need more venues, generate them
      while (selectedVenues.length < teamCount) {
        selectedVenues.push({
          id: `venue-${selectedVenues.length + 1}`,
          name: `Venue ${selectedVenues.length + 1}`,
          capacity: this.random.randomInt(5000, 20000),
          location: this.random.randomElement(['East City', 'West City', 'North City', 'South City'])
        });
      }
    } else {
      // Generate venues
      for (let i = 0; i < teamCount; i++) {
        selectedVenues.push({
          id: `venue-${i + 1}`,
          name: `Venue ${i + 1}`,
          capacity: this.random.randomInt(5000, 20000),
          location: this.random.randomElement(['East City', 'West City', 'North City', 'South City'])
        });
      }
    }
    
    // Create constraints based on seed data
    const constraintSeed = this.seedData.constraints?.constraints || [];
    let constraints = [];
    
    // Add seed constraints
    for (let i = 0; i < constraintCount && i < constraintSeed.length; i++) {
      constraints.push({ ...constraintSeed[i] });
    }
    
    // Generate more constraints if needed
    const constraintTypes = ['venue', 'team', 'travel', 'rest', 'date'];
    
    while (constraints.length < constraintCount) {
      const constraintType = this.random.randomElement(constraintTypes);
      
      switch (constraintType) {
        case 'venue':
          constraints.push({
            id: `constraint-venue-${constraints.length + 1}`,
            type: 'venue',
            description: 'Venue unavailable',
            parameters: {
              venueId: this.random.randomElement(selectedVenues).id,
              dates: [
                this._generateRandomDate('2023-11-01', '2024-03-01'),
                this._generateRandomDate('2023-11-01', '2024-03-01')
              ]
            }
          });
          break;
          
        case 'team':
          constraints.push({
            id: `constraint-team-${constraints.length + 1}`,
            type: 'team',
            description: 'Team unavailable',
            parameters: {
              teamId: this.random.randomElement(selectedTeams).id,
              dates: [
                this._generateRandomDate('2023-11-01', '2024-03-01'),
                this._generateRandomDate('2023-11-01', '2024-03-01')
              ]
            }
          });
          break;
          
        case 'travel':
          constraints.push({
            id: `constraint-travel-${constraints.length + 1}`,
            type: 'travel',
            description: 'Maximum travel distance',
            parameters: {
              maxDistance: this.random.randomInt(300, 1000)
            }
          });
          break;
          
        case 'rest':
          constraints.push({
            id: `constraint-rest-${constraints.length + 1}`,
            type: 'rest',
            description: 'Minimum rest days',
            parameters: {
              minDays: this.random.randomInt(1, 3)
            }
          });
          break;
          
        case 'date':
          constraints.push({
            id: `constraint-date-${constraints.length + 1}`,
            type: 'date',
            description: 'Date range constraint',
            parameters: {
              startDate: '2023-11-01',
              endDate: '2024-03-01'
            }
          });
          break;
      }
    }
    
    // Add conflicting constraints if needed
    if (hasConflicts) {
      const conflictCount = this.random.randomInt(1, Math.min(3, constraintCount));
      
      for (let i = 0; i < conflictCount; i++) {
        // Get a random constraint
        const conflictIndex = this.random.randomInt(0, constraints.length - 1);
        const conflictConstraint = constraints[conflictIndex];
        
        // Create a conflicting constraint
        switch (conflictConstraint.type) {
          case 'venue':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'venue',
              description: 'Conflicting venue constraint',
              parameters: {
                venueId: conflictConstraint.parameters.venueId,
                requiredDates: conflictConstraint.parameters.dates
              }
            });
            break;
            
          case 'team':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'team',
              description: 'Conflicting team constraint',
              parameters: {
                teamId: conflictConstraint.parameters.teamId,
                requiredDates: conflictConstraint.parameters.dates
              }
            });
            break;
            
          case 'travel':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'travel',
              description: 'Conflicting travel constraint',
              parameters: {
                minDistance: conflictConstraint.parameters.maxDistance + 100
              }
            });
            break;
            
          case 'rest':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'rest',
              description: 'Conflicting rest constraint',
              parameters: {
                maxDays: conflictConstraint.parameters.minDays - 1
              }
            });
            break;
            
          case 'date':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'date',
              description: 'Conflicting date constraint',
              parameters: {
                startDate: '2024-02-01',
                endDate: '2024-04-01'
              }
            });
            break;
        }
      }
    }
    
    return {
      type: 'schedule_generation',
      description: `Schedule generation test (${sportType}, ${teamCount} teams, ${constraintCount} constraints)`,
      sportType,
      teams: selectedTeams,
      venues: selectedVenues,
      constraints,
      parameters: {
        seasonStartDate: '2023-11-01',
        seasonEndDate: '2024-03-01',
        requiredGamesPerTeam: sportType === 'football' ? 12 : 
          (sportType === 'basketball' ? 30 : 20),
        homeAwayBalance: true
      }
    };
  }
  
  /**
   * Generate a constraint handling test case
   * 
   * @param {Object} template - Template to use
   * @param {string} agentType - Agent type
   * @param {string} difficulty - Difficulty level
   * @param {string} testSet - Test set name
   * @returns {Object} Generated test case
   * @private
   */
  generateConstraintHandlingTest(template, agentType, difficulty, testSet) {
    // Only applicable for scheduling agents
    if (agentType !== 'scheduling') {
      return this.generateTaskExecutionTest(template, agentType, difficulty, testSet);
    }
    
    // Get parameters from template
    const constraintTypes = template.parameters.constraintTypes || 
      ['venue', 'date', 'team', 'travel', 'rest'];
    
    const constraintCounts = template.parameters.constraintCount || 
      [1, 5, 10, 20];
    
    const conflictingConstraints = template.parameters.conflictingConstraints || 
      [false, true];
    
    // Select parameters based on difficulty
    let constraintTypesSelection, constraintCount, hasConflicts;
    
    switch (difficulty) {
      case 'basic':
        constraintTypesSelection = constraintTypes.slice(0, 2);
        constraintCount = constraintCounts[0];
        hasConflicts = false;
        break;
        
      case 'standard':
        constraintTypesSelection = constraintTypes.slice(0, 3);
        constraintCount = this.random.randomElement(constraintCounts.slice(0, 2));
        hasConflicts = this.random.randomBool(0.2);
        break;
        
      case 'challenging':
        constraintTypesSelection = constraintTypes.slice(0, 4);
        constraintCount = this.random.randomElement(constraintCounts.slice(1, 3));
        hasConflicts = this.random.randomBool(0.5);
        break;
        
      case 'extreme':
        constraintTypesSelection = constraintTypes;
        constraintCount = constraintCounts[constraintCounts.length - 1];
        hasConflicts = true;
        break;
        
      default:
        constraintTypesSelection = constraintTypes;
        constraintCount = this.random.randomElement(constraintCounts);
        hasConflicts = this.random.randomBool(0.3);
    }
    
    // Generate a partial schedule with 8 teams
    const teams = [];
    
    for (let i = 0; i < 8; i++) {
      teams.push({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
        conference: this.random.randomElement(['East', 'West'])
      });
    }
    
    // Generate venues
    const venues = [];
    
    for (let i = 0; i < 8; i++) {
      venues.push({
        id: `venue-${i + 1}`,
        name: `Venue ${i + 1}`,
        capacity: this.random.randomInt(5000, 20000),
        location: this.random.randomElement(['East City', 'West City', 'North City', 'South City'])
      });
    }
    
    // Generate a partial schedule
    const games = [];
    
    for (let i = 0; i < 20; i++) {
      const homeTeamIndex = this.random.randomInt(0, 7);
      let awayTeamIndex;
      
      do {
        awayTeamIndex = this.random.randomInt(0, 7);
      } while (awayTeamIndex === homeTeamIndex);
      
      games.push({
        id: `game-${i + 1}`,
        homeTeam: teams[homeTeamIndex].id,
        awayTeam: teams[awayTeamIndex].id,
        venue: venues[homeTeamIndex].id,
        date: this._generateRandomDate('2023-11-01', '2024-03-01'),
        startTime: `${this.random.randomInt(18, 20)}:00`
      });
    }
    
    // Generate constraints
    const constraints = [];
    
    for (let i = 0; i < constraintCount; i++) {
      const constraintType = this.random.randomElement(constraintTypesSelection);
      
      switch (constraintType) {
        case 'venue':
          constraints.push({
            id: `constraint-venue-${i + 1}`,
            type: 'venue',
            description: 'Venue unavailable',
            parameters: {
              venueId: this.random.randomElement(venues).id,
              dates: [
                this._generateRandomDate('2023-11-01', '2024-03-01'),
                this._generateRandomDate('2023-11-01', '2024-03-01')
              ]
            }
          });
          break;
          
        case 'team':
          constraints.push({
            id: `constraint-team-${i + 1}`,
            type: 'team',
            description: 'Team unavailable',
            parameters: {
              teamId: this.random.randomElement(teams).id,
              dates: [
                this._generateRandomDate('2023-11-01', '2024-03-01'),
                this._generateRandomDate('2023-11-01', '2024-03-01')
              ]
            }
          });
          break;
          
        case 'travel':
          constraints.push({
            id: `constraint-travel-${i + 1}`,
            type: 'travel',
            description: 'Maximum travel distance',
            parameters: {
              maxDistance: this.random.randomInt(300, 1000)
            }
          });
          break;
          
        case 'rest':
          constraints.push({
            id: `constraint-rest-${i + 1}`,
            type: 'rest',
            description: 'Minimum rest days',
            parameters: {
              minDays: this.random.randomInt(1, 3)
            }
          });
          break;
          
        case 'date':
          constraints.push({
            id: `constraint-date-${i + 1}`,
            type: 'date',
            description: 'Date range constraint',
            parameters: {
              startDate: '2023-11-01',
              endDate: '2024-03-01'
            }
          });
          break;
      }
    }
    
    // Add conflicting constraints if needed
    if (hasConflicts) {
      const conflictCount = this.random.randomInt(1, Math.min(3, constraintCount));
      
      for (let i = 0; i < conflictCount; i++) {
        // Get a random constraint
        const conflictIndex = this.random.randomInt(0, constraints.length - 1);
        const conflictConstraint = constraints[conflictIndex];
        
        // Create a conflicting constraint
        switch (conflictConstraint.type) {
          case 'venue':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'venue',
              description: 'Conflicting venue constraint',
              parameters: {
                venueId: conflictConstraint.parameters.venueId,
                requiredDates: conflictConstraint.parameters.dates
              }
            });
            break;
            
          case 'team':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'team',
              description: 'Conflicting team constraint',
              parameters: {
                teamId: conflictConstraint.parameters.teamId,
                requiredDates: conflictConstraint.parameters.dates
              }
            });
            break;
            
          case 'travel':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'travel',
              description: 'Conflicting travel constraint',
              parameters: {
                minDistance: conflictConstraint.parameters.maxDistance + 100
              }
            });
            break;
            
          case 'rest':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'rest',
              description: 'Conflicting rest constraint',
              parameters: {
                maxDays: conflictConstraint.parameters.minDays - 1
              }
            });
            break;
            
          case 'date':
            constraints.push({
              id: `constraint-conflict-${i + 1}`,
              type: 'date',
              description: 'Conflicting date constraint',
              parameters: {
                startDate: '2024-02-01',
                endDate: '2024-04-01'
              }
            });
            break;
        }
      }
    }
    
    return {
      type: 'constraint_handling',
      description: `Constraint handling test (${constraintCount} constraints, ${hasConflicts ? 'with' : 'without'} conflicts)`,
      schedule: {
        id: 'schedule-1',
        name: 'Test Schedule',
        sportType: 'basketball',
        seasonStartDate: '2023-11-01',
        seasonEndDate: '2024-03-01',
        teams,
        venues,
        games
      },
      constraints,
      hasConflicts
    };
  }
  
  /**
   * Generate a random date between two dates
   * 
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {string} Random date in YYYY-MM-DD format
   * @private
   */
  _generateRandomDate(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const randomDate = this.random.randomDate(start, end);
    
    // Format as YYYY-MM-DD
    return randomDate.toISOString().split('T')[0];
  }
  
  /**
   * Stop the simulation engine
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async stop() {
    try {
      logger.info('Stopping Simulation Engine');
      
      // No active resources to clean up
      
      logger.info('Simulation Engine stopped');
      return true;
    } catch (error) {
      logger.error(`Error stopping Simulation Engine: ${error.message}`);
      return false;
    }
  }
}

module.exports = SimulationEngine;