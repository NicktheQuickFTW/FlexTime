#!/usr/bin/env node

/**
 * Remaining 8 Big 12 Sports Research
 * Execute research for the 8 remaining scheduled Big 12 sports
 */

const path = require('path');
const MultiSportResearchOrchestrator = require('../backend/services/multiSportResearchOrchestrator');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env/flextime.env') });

class RemainingBig12SportsRunner {
  constructor() {
    this.orchestrator = new MultiSportResearchOrchestrator();
  }

  // Override sports config for the 8 remaining scheduled sports
  getSportsConfig() {
    return {
      'football': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        priority: 1,
        researchMethods: ['history', 'projections']
      },
      'volleyball': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'TCU', 'Texas Tech', 
                'UCF', 'Utah', 'West Virginia'],
        priority: 1,
        researchMethods: ['history', 'projections']
      },
      'soccer': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        priority: 1,
        researchMethods: ['history', 'projections']
      },
      'womens_basketball': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        priority: 2,
        researchMethods: ['history', 'projections']
      },
      'gymnastics': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia', 
                'Denver'],
        priority: 3,
        researchMethods: ['history', 'projections']
      },
      'womens_tennis': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 
                'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 
                'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
        priority: 3,
        researchMethods: ['history', 'projections']
      },
      'mens_tennis': {
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Oklahoma State', 'TCU', 
                'Texas Tech', 'UCF', 'Utah'],
        priority: 3,
        researchMethods: ['history', 'projections']
      },
      'lacrosse': {
        teams: ['Arizona State', 'Cincinnati', 'Colorado', 'Florida', 'San Diego State', 
                'UC Davis'],
        priority: 4,
        researchMethods: ['history', 'projections']
      }
    };
  }

  async run() {
    console.log('🏆 BIG 12 REMAINING SPORTS RESEARCH 🏆');
    console.log('=' * 50);
    console.log('📊 Executing research for 8 remaining scheduled sports');
    console.log('🎯 Sports: Football, Volleyball, Soccer, WBB, Gymnastics, WTN, MTN, LAX');
    console.log('⚡ 20-Worker Parallel System Active');
    console.log('=' * 50);

    try {
      // Override the orchestrator's sports config
      this.orchestrator.getSportsConfig = () => this.getSportsConfig();

      const sports = Object.keys(this.getSportsConfig());
      
      const results = await this.orchestrator.startAutomatedResearch({
        sports: sports,
        maxConcurrentSports: 2, // Process 2 sports simultaneously
        pauseBetweenSports: 20000, // 20 second pause between sport batches
        saveProgress: true
      });

      console.log('\n🎉 ALL REMAINING BIG 12 SPORTS COMPLETED! 🎉');
      console.log(`✅ Sports Completed: ${results.completedSports.length}/8`);
      console.log(`🏆 Completed: ${results.completedSports.join(', ')}`);

      return results;

    } catch (error) {
      console.error('💥 REMAINING SPORTS RESEARCH FAILED:', error);
      throw error;
    }
  }

  async runPriorityBatch() {
    console.log('🚀 PRIORITY BATCH: Football, Volleyball, Soccer');
    
    // Override to run just priority sports
    const prioritySports = ['football', 'volleyball', 'soccer'];
    
    this.orchestrator.getSportsConfig = () => {
      const fullConfig = this.getSportsConfig();
      const priorityConfig = {};
      prioritySports.forEach(sport => {
        if (fullConfig[sport]) {
          priorityConfig[sport] = fullConfig[sport];
        }
      });
      return priorityConfig;
    };

    return await this.orchestrator.startAutomatedResearch({
      sports: prioritySports,
      maxConcurrentSports: 2,
      pauseBetweenSports: 15000,
      saveProgress: true
    });
  }
}

// CLI execution
if (require.main === module) {
  const runner = new RemainingBig12SportsRunner();
  
  const command = process.argv[2] || 'all';
  
  switch (command) {
    case 'all':
      runner.run().catch(console.error);
      break;
    case 'priority':
      runner.runPriorityBatch().catch(console.error);
      break;
    default:
      console.log('Usage: node run-remaining-sports.js [all|priority]');
      console.log('');
      console.log('Commands:');
      console.log('  all        - Research all 8 remaining sports');
      console.log('  priority   - Research priority sports (Football, Volleyball, Soccer)');
      break;
  }
}

module.exports = RemainingBig12SportsRunner;