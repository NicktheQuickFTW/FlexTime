#!/usr/bin/env node

/**
 * Master Enhanced Sports Analysis - Summer 2025 Transfer Portal & Recruiting Focus
 * Comprehensive research execution for all Big 12 sports with enhanced methods
 */

const fs = require('fs').promises;
const path = require('path');

// Import all enhanced analysis modules
const EnhancedVolleyballAnalysis = require('./run-enhanced-volleyball-analysis');
const EnhancedSoccerAnalysis = require('./run-enhanced-soccer-analysis');
const EnhancedWomensBasketballAnalysis = require('./run-enhanced-womens-basketball-analysis');
const EnhancedGymnasticsAnalysis = require('./run-enhanced-gymnastics-analysis');
const EnhancedMensTennisAnalysis = require('./run-enhanced-mens-tennis-analysis');
const EnhancedWomensTennisAnalysis = require('./run-enhanced-womens-tennis-analysis');
const EnhancedLacrosseAnalysis = require('./run-enhanced-lacrosse-analysis');

class MasterEnhancedSportsAnalysis {
  constructor() {
    this.startTime = Date.now();
    this.sportsAnalyzers = {
      volleyball: new EnhancedVolleyballAnalysis(),
      soccer: new EnhancedSoccerAnalysis(),
      womensBasketball: new EnhancedWomensBasketballAnalysis(),
      gymnastics: new EnhancedGymnasticsAnalysis(),
      mensTennis: new EnhancedMensTennisAnalysis(),
      womensTennis: new EnhancedWomensTennisAnalysis(),
      lacrosse: new EnhancedLacrosseAnalysis()
    };
  }

  async executeAllEnhancedSportsAnalysis() {
    console.log(`\n🏆 ================================`);
    console.log(`🏆 MASTER ENHANCED SPORTS ANALYSIS`);
    console.log(`🏆 Summer 2025 Transfer Portal & Recruiting Focus`);
    console.log(`🏆 ================================\n`);
    
    console.log(`📊 Sports to Analyze: ${Object.keys(this.sportsAnalyzers).length}`);
    console.log(`🔍 Enhanced Methods: Transfer Portal + Recruiting Focus`);
    console.log(`📅 Focus Period: Spring 2025 - Summer 2025\n`);
    
    const results = {
      masterSummary: {
        title: 'Master Enhanced Big 12 Sports Analysis - Summer 2025 Focus',
        timestamp: new Date().toISOString(),
        sportsAnalyzed: Object.keys(this.sportsAnalyzers),
        totalSports: Object.keys(this.sportsAnalyzers).length,
        focusPeriod: 'Spring 2025 - Summer 2025'
      },
      sportsResults: {},
      executionLog: []
    };

    // Execute each sport analysis
    for (const [sportName, analyzer] of Object.entries(this.sportsAnalyzers)) {
      await this.executeSportAnalysis(sportName, analyzer, results);
    }

    // Generate master summary
    await this.generateMasterSummary(results);
    
    // Save comprehensive results
    await this.saveMasterResults(results);

    this.generateFinalSummary(results);
    
    return results;
  }

  async executeSportAnalysis(sportName, analyzer, results) {
    const startTime = Date.now();
    
    try {
      console.log(`\n🎯 ==============================`);
      console.log(`🎯 STARTING ${sportName.toUpperCase()} ANALYSIS`);
      console.log(`🎯 ==============================\n`);
      
      const sportResults = await this.callAnalyzerMethod(analyzer, sportName);
      
      const duration = (Date.now() - startTime) / 1000;
      results.sportsResults[sportName] = {
        ...sportResults,
        executionTime: duration,
        status: 'completed'
      };
      
      results.executionLog.push({
        sport: sportName,
        status: 'completed',
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`\n✅ ${sportName.toUpperCase()} ANALYSIS COMPLETED (${duration.toFixed(1)}s)\n`);
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      console.error(`\n❌ ${sportName.toUpperCase()} ANALYSIS FAILED:`, error.message);
      
      results.sportsResults[sportName] = {
        status: 'failed',
        error: error.message,
        executionTime: duration
      };
      
      results.executionLog.push({
        sport: sportName,
        status: 'failed',
        error: error.message,
        duration: duration,
        timestamp: new Date().toISOString()
      });
    }
  }

  async callAnalyzerMethod(analyzer, sportName) {
    switch (sportName) {
      case 'volleyball':
        return await analyzer.executeEnhancedVolleyballAnalysis();
      case 'soccer':
        return await analyzer.executeEnhancedSoccerAnalysis();
      case 'womensBasketball':
        return await analyzer.executeEnhancedWomensBasketballAnalysis();
      case 'gymnastics':
        return await analyzer.executeEnhancedGymnasticsAnalysis();
      case 'mensTennis':
        return await analyzer.executeEnhancedMensTennisAnalysis();
      case 'womensTennis':
        return await analyzer.executeEnhancedWomensTennisAnalysis();
      case 'lacrosse':
        return await analyzer.executeEnhancedLacrosseAnalysis();
      default:
        throw new Error(`Unknown sport: ${sportName}`);
    }
  }

  async generateMasterSummary(results) {
    const successfulSports = Object.values(results.sportsResults).filter(r => r.status === 'completed').length;
    const failedSports = Object.values(results.sportsResults).filter(r => r.status === 'failed').length;
    const totalExecutionTime = Object.values(results.sportsResults).reduce((sum, r) => sum + (r.executionTime || 0), 0);
    
    // Calculate total analyses across all sports
    let totalAnalyses = 0;
    let totalTeams = 0;
    
    Object.values(results.sportsResults).forEach(sportResult => {
      if (sportResult.status === 'completed' && sportResult.executionSummary) {
        if (sportResult.executionSummary.totalAnalyses) {
          totalAnalyses += sportResult.executionSummary.totalAnalyses;
        }
        if (sportResult.executionSummary.teams) {
          totalTeams += sportResult.executionSummary.teams;
        } else if (sportResult.executionSummary.totalTeams) {
          totalTeams += sportResult.executionSummary.totalTeams;
        }
      }
    });

    results.masterSummary = {
      ...results.masterSummary,
      successfulSports,
      failedSports,
      totalExecutionTime: Math.round(totalExecutionTime),
      totalAnalyses,
      totalTeams,
      successRate: Math.round((successfulSports / Object.keys(this.sportsAnalyzers).length) * 100),
      completedAt: new Date().toISOString()
    };
  }

  async saveMasterResults(results) {
    const dataDir = path.join(__dirname, '..', 'data', 'research_results');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      // Save comprehensive master results
      const masterPath = path.join(dataDir, 'summer_2025_master_sports_analysis.json');
      await fs.writeFile(masterPath, JSON.stringify(results, null, 2));
      
      // Save execution summary
      const summaryPath = path.join(dataDir, 'summer_2025_execution_summary.json');
      const summary = {
        masterSummary: results.masterSummary,
        executionLog: results.executionLog,
        sportsStatus: Object.keys(results.sportsResults).reduce((acc, sport) => {
          acc[sport] = {
            status: results.sportsResults[sport].status,
            executionTime: results.sportsResults[sport].executionTime,
            hasData: !!results.sportsResults[sport].executionSummary
          };
          return acc;
        }, {})
      };
      
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log(`\n💾 Master Results Saved:`);
      console.log(`   📄 Complete data: ${masterPath}`);
      console.log(`   📊 Execution summary: ${summaryPath}\n`);
      
    } catch (error) {
      console.error('❌ Error saving master results:', error.message);
    }
  }

  generateFinalSummary(results) {
    const totalDuration = (Date.now() - this.startTime) / 1000;
    const { masterSummary } = results;
    
    console.log(`\n🏆 ================================`);
    console.log(`🏆 MASTER ENHANCED SPORTS ANALYSIS COMPLETE`);
    console.log(`🏆 ================================`);
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(1)} seconds (${(totalDuration / 60).toFixed(1)} minutes)`);
    console.log(`📊 Sports Analyzed: ${masterSummary.successfulSports}/${Object.keys(this.sportsAnalyzers).length}`);
    console.log(`🎯 Total Teams: ${masterSummary.totalTeams || 'N/A'}`);
    console.log(`📈 Total Analyses: ${masterSummary.totalAnalyses || 'N/A'}`);
    console.log(`✨ Success Rate: ${masterSummary.successRate}%`);
    console.log(`🔍 Focus: Summer 2025 Transfer Portal & Recruiting`);
    
    console.log(`\n🏆 Completed Sports:`);
    Object.entries(results.sportsResults).forEach(([sport, data]) => {
      if (data.status === 'completed') {
        console.log(`   ✅ ${sport.toUpperCase()}: ${data.executionTime?.toFixed(1)}s`);
      } else {
        console.log(`   ❌ ${sport.toUpperCase()}: Failed (${data.error})`);
      }
    });
    
    if (masterSummary.successfulSports > 0) {
      console.log(`\n🎯 Enhanced Analysis Features Completed:`);
      console.log(`   • Summer 2025 transfer portal focus across all sports`);
      console.log(`   • Current recruiting class status and momentum tracking`);
      console.log(`   • Sport-specific enhanced COMPASS ratings`);
      console.log(`   • Conference competitiveness and championship contention`);
      console.log(`   • Position/event-specific depth and improvement analysis`);
      console.log(`   • NIL impact assessment on roster construction`);
    }
    
    console.log(`\n🏆 Enhanced Big 12 Sports Research Infrastructure Complete! 🏆`);
    console.log(`📊 Ready for comprehensive multi-sport analysis and insights`);
  }
}

// Execute master enhanced sports analysis
async function main() {
  try {
    const analyzer = new MasterEnhancedSportsAnalysis();
    await analyzer.executeAllEnhancedSportsAnalysis();
    process.exit(0);
  } catch (error) {
    console.error('❌ Master enhanced sports analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MasterEnhancedSportsAnalysis;