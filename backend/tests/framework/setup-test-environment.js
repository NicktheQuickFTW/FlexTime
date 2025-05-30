/**
 * Test Environment Setup
 * 
 * Sets up and validates the testing environment for migration validation
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Redis = require('ioredis');
const logger = require('./logger');
const config = require('../config/test.config');

class TestEnvironmentSetup {
  constructor() {
    this.checks = [];
    this.setupTasks = [];
  }

  /**
   * Run complete environment setup
   */
  async setup() {
    logger.info('Setting up test environment');
    
    try {
      // Create necessary directories
      await this.createDirectories();
      
      // Verify system dependencies
      await this.verifyDependencies();
      
      // Check service availability
      await this.checkServiceAvailability();
      
      // Setup test databases
      await this.setupTestDatabases();
      
      // Initialize test data directories
      await this.initializeTestData();
      
      // Validate configuration
      await this.validateConfiguration();
      
      logger.info('Test environment setup completed successfully');
      return true;
      
    } catch (error) {
      logger.error('Test environment setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Create necessary directories
   */
  async createDirectories() {
    logger.info('Creating test directories');
    
    const directories = [
      config.testData.generatedDataPath,
      config.testData.fixturesPath,
      config.testData.scenariosPath,
      config.reporting.outputPath,
      path.join(__dirname, '../logs'),
      path.join(__dirname, '../reports/coverage'),
      path.join(__dirname, '../reports/html'),
      path.join(__dirname, '../reports/junit')
    ];
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.debug(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Verify system dependencies
   */
  async verifyDependencies() {
    logger.info('Verifying system dependencies');
    
    const dependencies = [
      { name: 'Node.js', command: 'node', args: ['--version'], minVersion: '16.0.0' },
      { name: 'npm', command: 'npm', args: ['--version'], minVersion: '8.0.0' },
      { name: 'Jest', command: 'npx', args: ['jest', '--version'], minVersion: '29.0.0' }
    ];
    
    for (const dep of dependencies) {
      try {
        const version = await this.getCommandVersion(dep.command, dep.args);
        logger.debug(`${dep.name} version: ${version}`);
        
        if (this.compareVersions(version, dep.minVersion) < 0) {
          throw new Error(`${dep.name} version ${version} is below minimum required ${dep.minVersion}`);
        }
        
      } catch (error) {
        throw new Error(`Dependency check failed for ${dep.name}: ${error.message}`);
      }
    }
  }

  /**
   * Check service availability
   */
  async checkServiceAvailability() {
    logger.info('Checking service availability');
    
    const services = [
      {
        name: 'Legacy System',
        url: `${config.legacy.baseUrl}/api/status`,
        required: true
      },
      {
        name: 'API Gateway',
        url: `${config.microservices.apiGateway.baseUrl}/health`,
        required: true
      },
      {
        name: 'Scheduler Service',
        url: `${config.microservices.services.scheduler.baseUrl}/health`,
        required: true
      },
      {
        name: 'Team Service',
        url: `${config.microservices.services.teamManagement.baseUrl}/health`,
        required: false // Optional for some tests
      }
    ];
    
    const results = [];
    
    for (const service of services) {
      try {
        const response = await axios.get(service.url, { timeout: 5000 });
        const available = response.status === 200;
        
        results.push({
          name: service.name,
          available,
          status: response.status,
          url: service.url
        });
        
        if (!available && service.required) {
          throw new Error(`Required service ${service.name} is not available`);
        }
        
        logger.debug(`${service.name}: ${available ? 'Available' : 'Unavailable'}`);
        
      } catch (error) {
        if (service.required) {
          throw new Error(`Required service ${service.name} is not available: ${error.message}`);
        } else {
          logger.warn(`Optional service ${service.name} is not available: ${error.message}`);
          results.push({
            name: service.name,
            available: false,
            error: error.message,
            url: service.url
          });
        }
      }
    }
    
    this.serviceAvailability = results;
  }

  /**
   * Setup test databases
   */
  async setupTestDatabases() {
    logger.info('Setting up test databases');
    
    try {
      // Check Redis availability for event testing
      const redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        db: 1, // Use test database
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100
      });
      
      await redis.ping();
      logger.debug('Redis connection successful');
      
      // Clear test database
      await redis.flushdb();
      logger.debug('Test Redis database cleared');
      
      await redis.disconnect();
      
    } catch (error) {
      logger.warn('Redis setup failed (optional for some tests):', error.message);
    }
    
    // Note: Database connection testing is handled by individual test suites
    // as they may use different connection methods and credentials
  }

  /**
   * Initialize test data
   */
  async initializeTestData() {
    logger.info('Initializing test data');
    
    // Create basic fixture files if they don't exist
    const fixtures = {
      'big12-teams.json': this.generateBig12Teams(),
      'sample-constraints.json': this.generateSampleConstraints(),
      'test-venues.json': this.generateTestVenues()
    };
    
    for (const [filename, data] of Object.entries(fixtures)) {
      const filepath = path.join(config.testData.fixturesPath, filename);
      
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        logger.debug(`Created fixture file: ${filename}`);
      }
    }
  }

  /**
   * Validate configuration
   */
  async validateConfiguration() {
    logger.info('Validating test configuration');
    
    const requiredConfig = [
      'legacy.baseUrl',
      'microservices.apiGateway.baseUrl',
      'testData.generatedDataPath',
      'reporting.outputPath'
    ];
    
    for (const configPath of requiredConfig) {
      const value = this.getNestedProperty(config, configPath);
      if (!value) {
        throw new Error(`Missing required configuration: ${configPath}`);
      }
    }
    
    // Validate timeout values
    if (config.timeout < 1000) {
      throw new Error('Timeout values should be at least 1000ms');
    }
    
    // Validate performance thresholds
    if (config.performance.loadTesting.errorThreshold > 0.5) {
      logger.warn('Error threshold is very high (>50%)');
    }
    
    logger.debug('Configuration validation passed');
  }

  /**
   * Get command version
   * @param {string} command - Command to execute
   * @param {Array} args - Command arguments
   * @returns {Promise<string>} Version string
   */
  async getCommandVersion(command, args) {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      let output = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          // Extract version number from output
          const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            resolve(versionMatch[1]);
          } else {
            reject(new Error('Version not found in output'));
          }
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      process.on('error', reject);
    });
  }

  /**
   * Compare version strings
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {number} -1, 0, or 1 for less than, equal, or greater than
   */
  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  /**
   * Get nested property from object
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {*} Property value
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate Big 12 teams fixture data
   * @returns {Array} Team data
   */
  generateBig12Teams() {
    return [
      { id: 'arizona', name: 'Arizona', mascot: 'Wildcats', city: 'Tucson', state: 'AZ' },
      { id: 'arizona_state', name: 'Arizona State', mascot: 'Sun Devils', city: 'Tempe', state: 'AZ' },
      { id: 'baylor', name: 'Baylor', mascot: 'Bears', city: 'Waco', state: 'TX' },
      { id: 'byu', name: 'BYU', mascot: 'Cougars', city: 'Provo', state: 'UT' },
      { id: 'cincinnati', name: 'Cincinnati', mascot: 'Bearcats', city: 'Cincinnati', state: 'OH' },
      { id: 'colorado', name: 'Colorado', mascot: 'Buffaloes', city: 'Boulder', state: 'CO' },
      { id: 'houston', name: 'Houston', mascot: 'Cougars', city: 'Houston', state: 'TX' },
      { id: 'iowa_state', name: 'Iowa State', mascot: 'Cyclones', city: 'Ames', state: 'IA' },
      { id: 'kansas', name: 'Kansas', mascot: 'Jayhawks', city: 'Lawrence', state: 'KS' },
      { id: 'kansas_state', name: 'Kansas State', mascot: 'Wildcats', city: 'Manhattan', state: 'KS' },
      { id: 'oklahoma_state', name: 'Oklahoma State', mascot: 'Cowboys', city: 'Stillwater', state: 'OK' },
      { id: 'tcu', name: 'TCU', mascot: 'Horned Frogs', city: 'Fort Worth', state: 'TX' },
      { id: 'texas_tech', name: 'Texas Tech', mascot: 'Red Raiders', city: 'Lubbock', state: 'TX' },
      { id: 'ucf', name: 'UCF', mascot: 'Knights', city: 'Orlando', state: 'FL' },
      { id: 'utah', name: 'Utah', mascot: 'Utes', city: 'Salt Lake City', state: 'UT' },
      { id: 'west_virginia', name: 'West Virginia', mascot: 'Mountaineers', city: 'Morgantown', state: 'WV' }
    ];
  }

  /**
   * Generate sample constraints fixture data
   * @returns {Array} Constraint data
   */
  generateSampleConstraints() {
    return [
      {
        id: 'minimum_rest',
        type: 'temporal',
        description: 'Minimum rest days between games',
        rule: 'minimum_rest_days >= 1'
      },
      {
        id: 'venue_availability',
        type: 'venue',
        description: 'Venue must be available',
        rule: 'venue_available = true'
      },
      {
        id: 'championship_blackout',
        type: 'temporal',
        description: 'No games during championship week',
        rule: 'no_games_during_championship_week'
      }
    ];
  }

  /**
   * Generate test venues fixture data
   * @returns {Array} Venue data
   */
  generateTestVenues() {
    const teams = this.generateBig12Teams();
    return teams.map(team => ({
      id: `${team.id}_stadium`,
      name: `${team.name} Stadium`,
      teamId: team.id,
      city: team.city,
      state: team.state,
      capacity: 50000,
      type: 'primary'
    }));
  }
}

// CLI interface
if (require.main === module) {
  async function main() {
    const setup = new TestEnvironmentSetup();
    
    try {
      await setup.setup();
      console.log('✅ Test environment setup completed successfully');
    } catch (error) {
      console.error('❌ Test environment setup failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = TestEnvironmentSetup;