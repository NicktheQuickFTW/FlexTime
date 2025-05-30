/**
 * FlexTime Migration Testing Framework
 * 
 * Main entry point for the comprehensive migration testing framework
 */

const MigrationValidationRunner = require('./automation/run-migration-validation');
const ResultComparisonEngine = require('./utilities/result-comparison-engine');
const TestScenarioGenerator = require('./test-data/generate-test-scenarios');
const LoadTestingSuite = require('./performance-tests/load-testing-suite');
const TestEnvironmentSetup = require('./utilities/setup-test-environment');
const logger = require('./utilities/logger');
const config = require('./config/test.config');

class MigrationTestingFramework {
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.logger = logger.child({ framework: 'migration-testing' });
    
    // Initialize components
    this.validationRunner = new MigrationValidationRunner();
    this.comparisonEngine = new ResultComparisonEngine();
    this.scenarioGenerator = new TestScenarioGenerator();
    this.loadTester = new LoadTestingSuite();
    this.environmentSetup = new TestEnvironmentSetup();
  }

  /**
   * Run complete migration validation suite
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results
   */
  async runFullValidation(options = {}) {
    this.logger.info('Starting full migration validation');
    
    try {
      // Setup environment if needed
      if (options.setupEnvironment !== false) {
        await this.environmentSetup.setup();
      }
      
      // Run validation suite
      const results = await this.validationRunner.runValidation();
      
      this.logger.info('Full migration validation completed', {
        passed: results.passed,
        phases: results.phases.length,
        duration: results.endTime - results.startTime
      });
      
      return results;
      
    } catch (error) {
      this.logger.error('Full migration validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Run functional equivalence testing only
   * @param {Object} scenarios - Test scenarios
   * @returns {Promise<Object>} Equivalence test results
   */
  async runFunctionalEquivalenceTests(scenarios = null) {
    this.logger.info('Running functional equivalence tests');
    
    try {
      // Generate scenarios if not provided
      if (!scenarios) {
        await this.scenarioGenerator.generateAllScenarios();
      }
      
      // This would integrate with the Jest test runner
      // For now, we'll return a placeholder structure
      const results = {
        timestamp: new Date().toISOString(),
        type: 'functional-equivalence',
        summary: {
          totalScenarios: scenarios?.length || 0,
          passedScenarios: 0,
          failedScenarios: 0,
          equivalenceRate: 0
        },
        details: []
      };
      
      this.logger.info('Functional equivalence tests completed', results.summary);
      return results;
      
    } catch (error) {
      this.logger.error('Functional equivalence tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Run performance testing suite
   * @param {Object} options - Performance test options
   * @returns {Promise<Object>} Performance test results
   */
  async runPerformanceTests(options = {}) {
    this.logger.info('Running performance tests');
    
    try {
      const results = await this.loadTester.runLoadTests();
      
      this.logger.info('Performance tests completed', {
        totalTests: results.tests.length,
        duration: results.endTime - results.startTime
      });
      
      return results;
      
    } catch (error) {
      this.logger.error('Performance tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate test scenarios
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated scenarios
   */
  async generateTestScenarios(options = {}) {
    this.logger.info('Generating test scenarios');
    
    try {
      const scenarios = await this.scenarioGenerator.generateAllScenarios();
      
      this.logger.info('Test scenarios generated', {
        totalScenarios: Object.values(scenarios).flat().length
      });
      
      return scenarios;
      
    } catch (error) {
      this.logger.error('Test scenario generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Compare results between systems
   * @param {Object} legacyResult - Legacy system result
   * @param {Object} microserviceResult - Microservice result
   * @param {string} testId - Test identifier
   * @returns {Promise<Object>} Comparison result
   */
  async compareResults(legacyResult, microserviceResult, testId) {
    this.logger.info('Comparing system results', { testId });
    
    try {
      const comparison = await this.comparisonEngine.compareSchedules(
        legacyResult,
        microserviceResult,
        testId
      );
      
      this.logger.comparisonResult(testId, comparison.equivalent, comparison.summary);
      return comparison;
      
    } catch (error) {
      this.logger.error('Result comparison failed:', error.message);
      throw error;
    }
  }

  /**
   * Setup test environment
   * @returns {Promise<boolean>} Setup success
   */
  async setupEnvironment() {
    this.logger.info('Setting up test environment');
    
    try {
      const success = await this.environmentSetup.setup();
      this.logger.info('Test environment setup completed');
      return success;
      
    } catch (error) {
      this.logger.error('Test environment setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get framework status
   * @returns {Object} Framework status
   */
  getStatus() {
    return {
      framework: 'FlexTime Migration Testing Framework',
      version: '1.0.0',
      environment: this.config.environment,
      components: {
        validationRunner: !!this.validationRunner,
        comparisonEngine: !!this.comparisonEngine,
        scenarioGenerator: !!this.scenarioGenerator,
        loadTester: !!this.loadTester,
        environmentSetup: !!this.environmentSetup
      },
      config: {
        legacy: {
          baseUrl: this.config.legacy.baseUrl,
          timeout: this.config.legacy.timeout
        },
        microservices: {
          apiGateway: this.config.microservices.apiGateway.baseUrl
        },
        performance: {
          concurrent: this.config.performance.loadTesting.concurrent,
          duration: this.config.performance.loadTesting.duration
        }
      }
    };
  }
}

// Export main class and utilities
module.exports = {
  MigrationTestingFramework,
  MigrationValidationRunner,
  ResultComparisonEngine,
  TestScenarioGenerator,
  LoadTestingSuite,
  TestEnvironmentSetup,
  logger,
  config
};

// CLI interface
if (require.main === module) {
  const framework = new MigrationTestingFramework();
  
  async function main() {
    const command = process.argv[2];
    
    try {
      switch (command) {
        case 'validate':
          await framework.runFullValidation();
          break;
          
        case 'functional':
          await framework.runFunctionalEquivalenceTests();
          break;
          
        case 'performance':
          await framework.runPerformanceTests();
          break;
          
        case 'generate':
          await framework.generateTestScenarios();
          break;
          
        case 'setup':
          await framework.setupEnvironment();
          break;
          
        case 'status':
          console.log(JSON.stringify(framework.getStatus(), null, 2));
          break;
          
        default:
          console.log('FlexTime Migration Testing Framework');
          console.log('');
          console.log('Commands:');
          console.log('  validate     Run full migration validation suite');
          console.log('  functional   Run functional equivalence tests');
          console.log('  performance  Run performance tests');
          console.log('  generate     Generate test scenarios');
          console.log('  setup        Setup test environment');
          console.log('  status       Show framework status');
          break;
      }
      
    } catch (error) {
      console.error('Framework execution failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}