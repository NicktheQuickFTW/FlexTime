/**
 * Migration Validation Automation
 * 
 * Orchestrates the complete migration testing process
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const logger = require('../utilities/logger');
const config = require('../config/test.config');

class MigrationValidationRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      phases: [],
      summary: {},
      passed: false
    };
    
    this.phases = [
      {
        name: 'Environment Setup',
        description: 'Verify test environment and dependencies',
        command: 'node',
        args: ['utilities/setup-test-environment.js'],
        required: true,
        timeout: 60000
      },
      {
        name: 'Test Data Generation',
        description: 'Generate test scenarios and data',
        command: 'node',
        args: ['test-data/generate-test-scenarios.js'],
        required: true,
        timeout: 120000
      },
      {
        name: 'Functional Equivalence Tests',
        description: 'Validate functional equivalence between systems',
        command: 'npm',
        args: ['run', 'test:functional-equivalence'],
        required: true,
        timeout: 1800000 // 30 minutes
      },
      {
        name: 'Integration Tests',
        description: 'Test microservice communication and integration',
        command: 'npm',
        args: ['run', 'test:integration'],
        required: true,
        timeout: 900000 // 15 minutes
      },
      {
        name: 'Performance Tests',
        description: 'Validate performance and load characteristics',
        command: 'npm',
        args: ['run', 'test:performance'],
        required: false, // Performance tests are not blocking
        timeout: 1200000 // 20 minutes
      },
      {
        name: 'End-to-End Tests',
        description: 'Test complete user workflows',
        command: 'npm',
        args: ['run', 'test:e2e'],
        required: true,
        timeout: 600000 // 10 minutes
      },
      {
        name: 'Report Generation',
        description: 'Generate comprehensive test reports',
        command: 'node',
        args: ['utilities/report-generator.js'],
        required: false,
        timeout: 60000
      }
    ];
  }

  /**
   * Run complete migration validation suite
   */
  async runValidation() {
    console.log(chalk.blue.bold('\n🚀 FlexTime Migration Validation Suite'));
    console.log(chalk.gray('='). repeat(50));
    
    logger.info('Starting migration validation suite');
    
    try {
      for (const phase of this.phases) {
        const result = await this.runPhase(phase);
        this.results.phases.push(result);
        
        if (result.failed && phase.required) {
          throw new Error(`Required phase failed: ${phase.name}`);
        }
      }
      
      this.results.endTime = new Date();
      this.results.passed = this.calculateOverallResult();
      this.results.summary = this.generateSummary();
      
      await this.saveResults();
      this.displayResults();
      
      return this.results;
      
    } catch (error) {
      logger.error('Migration validation failed:', error.message);
      this.results.endTime = new Date();
      this.results.passed = false;
      this.results.error = error.message;
      
      await this.saveResults();
      this.displayResults();
      
      throw error;
    }
  }

  /**
   * Run individual validation phase
   * @param {Object} phase - Phase configuration
   * @returns {Object} Phase result
   */
  async runPhase(phase) {
    const phaseResult = {
      name: phase.name,
      description: phase.description,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      output: '',
      error: null,
      exitCode: null,
      passed: false,
      failed: false,
      skipped: false
    };

    console.log(chalk.yellow(`\n📋 ${phase.name}`));
    console.log(chalk.gray(`   ${phase.description}`));
    
    const timer = logger.startTimer(phase.name);
    
    try {
      const { output, exitCode } = await this.executeCommand(
        phase.command,
        phase.args,
        phase.timeout
      );
      
      phaseResult.output = output;
      phaseResult.exitCode = exitCode;
      phaseResult.passed = exitCode === 0;
      phaseResult.failed = exitCode !== 0;
      
      if (phaseResult.passed) {
        console.log(chalk.green('   ✅ Passed'));
      } else {
        console.log(chalk.red('   ❌ Failed'));
        if (phase.required) {
          console.log(chalk.red('      This is a required phase!'));
        }
      }
      
    } catch (error) {
      phaseResult.error = error.message;
      phaseResult.failed = true;
      
      console.log(chalk.red('   ❌ Error'));
      console.log(chalk.red(`      ${error.message}`));
      
      if (!phase.required) {
        console.log(chalk.yellow('      Continuing as this phase is optional'));
      }
    }
    
    phaseResult.endTime = new Date();
    phaseResult.duration = phaseResult.endTime - phaseResult.startTime;
    
    timer();
    logger.info(`Phase completed: ${phase.name}`, {
      passed: phaseResult.passed,
      duration: phaseResult.duration
    });
    
    return phaseResult;
  }

  /**
   * Execute command with timeout
   * @param {string} command - Command to execute
   * @param {Array} args - Command arguments
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Object>} Execution result
   */
  async executeCommand(command, args, timeout) {
    return new Promise((resolve, reject) => {
      let output = '';
      let timeoutHandle;
      
      const process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..')
      });
      
      // Set timeout
      if (timeout) {
        timeoutHandle = setTimeout(() => {
          process.kill('SIGKILL');
          reject(new Error(`Command timed out after ${timeout}ms`));
        }, timeout);
      }
      
      // Collect output
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      // Handle process completion
      process.on('close', (code) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        
        resolve({
          output,
          exitCode: code
        });
      });
      
      // Handle process errors
      process.on('error', (error) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        
        reject(error);
      });
    });
  }

  /**
   * Calculate overall validation result
   * @returns {boolean} True if validation passed
   */
  calculateOverallResult() {
    const requiredPhases = this.results.phases.filter(p => 
      this.phases.find(phase => phase.name === p.name)?.required
    );
    
    return requiredPhases.every(phase => phase.passed);
  }

  /**
   * Generate validation summary
   * @returns {Object} Summary statistics
   */
  generateSummary() {
    const totalPhases = this.results.phases.length;
    const passedPhases = this.results.phases.filter(p => p.passed).length;
    const failedPhases = this.results.phases.filter(p => p.failed).length;
    const totalDuration = this.results.endTime - this.results.startTime;
    
    return {
      totalPhases,
      passedPhases,
      failedPhases,
      passRate: ((passedPhases / totalPhases) * 100).toFixed(1),
      totalDuration,
      overallResult: this.results.passed ? 'PASSED' : 'FAILED'
    };
  }

  /**
   * Save validation results
   */
  async saveResults() {
    const resultsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `migration-validation-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    
    // Also save as latest
    const latestPath = path.join(resultsDir, 'migration-validation-latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2));
    
    logger.info('Validation results saved', { filepath });
  }

  /**
   * Display validation results
   */
  displayResults() {
    console.log(chalk.blue.bold('\n📊 Migration Validation Results'));
    console.log(chalk.gray('='). repeat(50));
    
    // Overall result
    if (this.results.passed) {
      console.log(chalk.green.bold('✅ VALIDATION PASSED'));
    } else {
      console.log(chalk.red.bold('❌ VALIDATION FAILED'));
    }
    
    // Summary statistics
    console.log(chalk.blue('\n📈 Summary:'));
    console.log(`   Total Phases: ${this.results.summary.totalPhases}`);
    console.log(`   Passed: ${chalk.green(this.results.summary.passedPhases)}`);
    console.log(`   Failed: ${chalk.red(this.results.summary.failedPhases)}`);
    console.log(`   Pass Rate: ${this.results.summary.passRate}%`);
    console.log(`   Duration: ${this.formatDuration(this.results.summary.totalDuration)}`);
    
    // Phase details
    console.log(chalk.blue('\n📋 Phase Details:'));
    this.results.phases.forEach(phase => {
      const status = phase.passed ? chalk.green('✅') : 
                    phase.failed ? chalk.red('❌') : 
                    chalk.yellow('⏭️');
      
      console.log(`   ${status} ${phase.name} (${this.formatDuration(phase.duration)})`);
      
      if (phase.failed && phase.error) {
        console.log(chalk.red(`      Error: ${phase.error}`));
      }
    });
    
    // Migration readiness assessment
    console.log(chalk.blue('\n🎯 Migration Readiness:'));
    const readiness = this.assessMigrationReadiness();
    console.log(`   Status: ${readiness.ready ? chalk.green('READY') : chalk.red('NOT READY')}`);
    console.log(`   Confidence: ${readiness.confidence}%`);
    
    if (readiness.blockers.length > 0) {
      console.log(chalk.red('\n🚫 Blockers:'));
      readiness.blockers.forEach(blocker => {
        console.log(chalk.red(`   • ${blocker}`));
      });
    }
    
    if (readiness.recommendations.length > 0) {
      console.log(chalk.yellow('\n💡 Recommendations:'));
      readiness.recommendations.forEach(rec => {
        console.log(chalk.yellow(`   • ${rec}`));
      });
    }
    
    console.log(chalk.gray('\n' + '='.repeat(50)));
  }

  /**
   * Assess migration readiness based on test results
   * @returns {Object} Readiness assessment
   */
  assessMigrationReadiness() {
    const assessment = {
      ready: this.results.passed,
      confidence: 0,
      blockers: [],
      recommendations: []
    };
    
    // Calculate confidence based on test results
    const functionalEquivalencePhase = this.results.phases.find(p => p.name === 'Functional Equivalence Tests');
    const integrationPhase = this.results.phases.find(p => p.name === 'Integration Tests');
    const performancePhase = this.results.phases.find(p => p.name === 'Performance Tests');
    const e2ePhase = this.results.phases.find(p => p.name === 'End-to-End Tests');
    
    let confidence = 0;
    
    if (functionalEquivalencePhase?.passed) {
      confidence += 40; // Most important
    } else {
      assessment.blockers.push('Functional equivalence tests failed - systems do not produce identical results');
    }
    
    if (integrationPhase?.passed) {
      confidence += 25;
    } else {
      assessment.blockers.push('Integration tests failed - microservice communication issues detected');
    }
    
    if (e2ePhase?.passed) {
      confidence += 25;
    } else {
      assessment.blockers.push('End-to-end tests failed - complete workflows are not functioning');
    }
    
    if (performancePhase?.passed) {
      confidence += 10;
    } else if (performancePhase?.failed) {
      assessment.recommendations.push('Performance tests failed - consider optimization before migration');
    }
    
    assessment.confidence = confidence;
    
    // Add recommendations based on results
    if (assessment.confidence < 100 && assessment.confidence >= 80) {
      assessment.recommendations.push('Migration appears ready with minor issues to monitor');
    } else if (assessment.confidence < 80 && assessment.confidence >= 60) {
      assessment.recommendations.push('Address failing tests before proceeding with migration');
    } else if (assessment.confidence < 60) {
      assessment.recommendations.push('Significant issues detected - migration not recommended');
      assessment.ready = false;
    }
    
    return assessment;
  }

  /**
   * Format duration in human readable format
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }
}

// CLI interface
if (require.main === module) {
  async function main() {
    const runner = new MigrationValidationRunner();
    
    try {
      const results = await runner.runValidation();
      
      if (results.passed) {
        console.log(chalk.green('\n🎉 Migration validation completed successfully!'));
        process.exit(0);
      } else {
        console.log(chalk.red('\n💥 Migration validation failed!'));
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('\n💥 Migration validation suite failed:'), error.message);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = MigrationValidationRunner;