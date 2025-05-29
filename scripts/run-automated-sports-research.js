#!/usr/bin/env node

/**
 * Automated Sports Research Launcher
 * Launches background research for all Big 12 sports with progress monitoring
 */

const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env/flextime.env') });

const MultiSportResearchOrchestrator = require('../backend/services/multiSportResearchOrchestrator');

class AutomatedSportsResearchLauncher {
  constructor() {
    this.orchestrator = new MultiSportResearchOrchestrator();
    this.logFile = path.join(__dirname, '../logs/automated_research.log');
    this.startTime = Date.now();
  }

  async launch(options = {}) {
    const {
      sports = ['wrestling', 'soccer', 'volleyball', 'tennis_mens', 'tennis_womens', 
               'golf_mens', 'golf_womens', 'track_field', 'swimming_diving', 'gymnastics'],
      maxConcurrentSports = 2,
      pauseBetweenSports = 30000,
      enableLogging = true,
      enableProgressMonitoring = true
    } = options;

    console.log('🚀 AUTOMATED BIG 12 SPORTS RESEARCH LAUNCHER 🚀');
    console.log('=' * 70);
    console.log(`📅 Launch Time: ${new Date().toISOString()}`);
    console.log(`🎯 Sports Queue: ${sports.length} sports`);
    console.log(`⚡ Concurrency: ${maxConcurrentSports} sports simultaneously`);
    console.log(`⏱️ Inter-sport Delay: ${pauseBetweenSports/1000} seconds`);
    console.log(`📊 Progress Monitoring: ${enableProgressMonitoring ? 'Enabled' : 'Disabled'}`);
    console.log(`📝 Logging: ${enableLogging ? 'Enabled' : 'Disabled'}`);
    console.log('=' * 70);

    try {
      // Ensure logs directory exists
      if (enableLogging) {
        await this.ensureLogsDirectory();
        await this.initializeLogFile();
      }

      // Set up progress monitoring
      if (enableProgressMonitoring) {
        this.setupProgressMonitoring();
      }

      // Start the automated research
      console.log('\n🔄 Initiating automated multi-sport research...\n');
      
      const results = await this.orchestrator.startAutomatedResearch({
        sports,
        maxConcurrentSports,
        pauseBetweenSports,
        saveProgress: true
      });

      // Final summary
      const endTime = Date.now();
      const totalDuration = (endTime - this.startTime) / 1000;

      console.log('\n🎊 AUTOMATED RESEARCH COMPLETED SUCCESSFULLY 🎊');
      console.log('=' * 70);
      console.log(`⏱️ Total Duration: ${this.formatDuration(totalDuration)}`);
      console.log(`✅ Sports Completed: ${results.completedSports.length}/${results.totalSports}`);
      console.log(`📊 Success Rate: ${(results.completedSports.length / results.totalSports * 100).toFixed(1)}%`);
      console.log(`🏆 Completed Sports: ${results.completedSports.join(', ')}`);
      console.log('=' * 70);

      if (enableLogging) {
        await this.logFinalSummary(results, totalDuration);
      }

      return results;

    } catch (error) {
      console.error('\n💥 AUTOMATED RESEARCH FAILED:', error);
      
      if (enableLogging) {
        await this.logError(error);
      }
      
      throw error;
    }
  }

  setupProgressMonitoring() {
    console.log('📊 Setting up progress monitoring...');
    
    // Set up periodic progress reporting
    const progressInterval = setInterval(() => {
      const progress = this.orchestrator.getProgress();
      
      console.log(`\n📈 PROGRESS UPDATE:`);
      console.log(`   ✅ Completed: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
      console.log(`   🔄 Active: ${progress.activeSports.join(', ') || 'None'}`);
      console.log(`   🏁 Finished: ${progress.completedSports.join(', ') || 'None'}`);
      
      // Clear interval when complete
      if (progress.completed === progress.total) {
        clearInterval(progressInterval);
      }
    }, 60000); // Update every minute

    // Set up progress callback
    this.orchestrator.onProgress((sportName, status, data) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 📊 ${sportName}: ${status}`);
      
      if (data) {
        console.log(`   Teams: ${data.teams || 'N/A'}, Duration: ${data.duration || 'N/A'}s`);
      }
    });
  }

  async ensureLogsDirectory() {
    const logsDir = path.dirname(this.logFile);
    try {
      await fs.access(logsDir);
    } catch {
      await fs.mkdir(logsDir, { recursive: true });
      console.log(`📁 Created logs directory: ${logsDir}`);
    }
  }

  async initializeLogFile() {
    const logHeader = [
      '# Automated Sports Research Log',
      `# Started: ${new Date().toISOString()}`,
      `# Process ID: ${process.pid}`,
      '# ================================',
      ''
    ].join('\n');

    await fs.writeFile(this.logFile, logHeader);
    console.log(`📝 Log file initialized: ${this.logFile}`);
  }

  async logProgress(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async logFinalSummary(results, totalDuration) {
    const summary = [
      '',
      '# FINAL SUMMARY',
      '# =============',
      `# Completion Time: ${new Date().toISOString()}`,
      `# Total Duration: ${this.formatDuration(totalDuration)}`,
      `# Sports Completed: ${results.completedSports.length}/${results.totalSports}`,
      `# Success Rate: ${(results.completedSports.length / results.totalSports * 100).toFixed(1)}%`,
      `# Completed Sports: ${results.completedSports.join(', ')}`,
      ''
    ].join('\n');

    await fs.appendFile(this.logFile, summary);
  }

  async logError(error) {
    const errorLog = [
      '',
      '# ERROR OCCURRED',
      '# =============',
      `# Time: ${new Date().toISOString()}`,
      `# Error: ${error.message}`,
      `# Stack: ${error.stack}`,
      ''
    ].join('\n');

    await fs.appendFile(this.logFile, errorLog);
  }

  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Method to start research for specific sports only
  async launchSpecificSports(sportsList) {
    return await this.launch({
      sports: sportsList,
      maxConcurrentSports: 1, // More conservative for specific sports
      pauseBetweenSports: 15000 // Shorter pause
    });
  }

  // Method to continue interrupted research
  async continueResearch() {
    console.log('🔄 Checking for interrupted research...');
    
    try {
      const progressPath = path.join(__dirname, '../data/research_results/automation_progress.json');
      const progressData = JSON.parse(await fs.readFile(progressPath, 'utf8'));
      
      const allSports = Object.keys(this.orchestrator.getSportsConfig());
      const remainingSports = allSports.filter(sport => 
        !progressData.completedSports.includes(sport)
      );

      if (remainingSports.length > 0) {
        console.log(`📊 Found ${remainingSports.length} incomplete sports: ${remainingSports.join(', ')}`);
        return await this.launch({
          sports: remainingSports,
          maxConcurrentSports: 2,
          pauseBetweenSports: 30000
        });
      } else {
        console.log('✅ All sports research appears to be complete');
        return { message: 'All sports already completed' };
      }

    } catch (error) {
      console.log('ℹ️ No previous progress found, starting fresh research');
      return await this.launch();
    }
  }
}

// CLI execution
if (require.main === module) {
  const launcher = new AutomatedSportsResearchLauncher();
  
  const command = process.argv[2] || 'all';
  
  switch (command) {
    case 'all':
      launcher.launch().catch(console.error);
      break;
    case 'wrestling':
      launcher.launchSpecificSports(['wrestling']).catch(console.error);
      break;
    case 'continue':
      launcher.continueResearch().catch(console.error);
      break;
    case 'priority':
      launcher.launchSpecificSports(['wrestling', 'soccer', 'volleyball']).catch(console.error);
      break;
    default:
      console.log('Usage: node run-automated-sports-research.js [all|wrestling|continue|priority]');
      console.log('');
      console.log('Commands:');
      console.log('  all        - Research all Big 12 sports (default)');
      console.log('  wrestling  - Research wrestling only');
      console.log('  continue   - Continue interrupted research');
      console.log('  priority   - Research priority sports first');
      break;
  }
}

module.exports = AutomatedSportsResearchLauncher;