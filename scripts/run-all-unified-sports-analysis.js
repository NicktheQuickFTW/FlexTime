#!/usr/bin/env node

/**
 * Master Unified Sports Analysis - Consolidated 2025-26 Season Assessment
 * Execute all Big 12 sports using unified methodology with comprehensive rankings integration
 */

const UnifiedSportPipelineAnalysis = require('./run-unified-sport-pipeline-analysis');
const fs = require('fs').promises;
const path = require('path');

class MasterUnifiedSportsAnalysis {
  constructor() {
    this.startTime = Date.now();
    this.analyzer = new UnifiedSportPipelineAnalysis();
    
    // Define all sports with gender specifications
    this.sportsToAnalyze = [
      { sport: 'football', gender: null },
      { sport: 'basketball', gender: 'mens' },
      { sport: 'basketball', gender: 'womens' },
      { sport: 'volleyball', gender: null },
      { sport: 'soccer', gender: null },
      { sport: 'tennis', gender: 'mens' },
      { sport: 'tennis', gender: 'womens' },
      { sport: 'gymnastics', gender: null },
      { sport: 'wrestling', gender: null },
      { sport: 'softball', gender: null },
      { sport: 'lacrosse', gender: null },
      { sport: 'baseball', gender: null }
    ];
  }

  async executeAllUnifiedSportsAnalysis() {
    console.log(`\n🏆 ================================`);
    console.log(`🏆 MASTER UNIFIED SPORTS ANALYSIS`);
    console.log(`🏆 Consolidated 2025-26 Season Assessment`);
    console.log(`🏆 ================================\n`);
    
    console.log(`📊 Sports to Analyze: ${this.sportsToAnalyze.length}`);
    console.log(`🔍 Unified Methodology: Complete Pipeline Assessment with Rankings`);
    console.log(`📅 Focus: Complete 2025-26 Season Preparation\n`);
    
    const results = {
      masterSummary: {
        title: 'Master Unified Big 12 Sports Analysis - 2025-26 Season',
        timestamp: new Date().toISOString(),
        methodology: 'Unified Sport Pipeline Assessment',
        sportsAnalyzed: this.sportsToAnalyze.map(s => s.gender ? `${s.gender} ${s.sport}` : s.sport),
        totalSports: this.sportsToAnalyze.length,
        focusPeriod: 'Spring 2025 - Summer 2025 - Complete 2025-26 Preparation'
      },
      sportsResults: {},
      executionLog: []
    };

    // Execute each sport analysis
    for (const sportConfig of this.sportsToAnalyze) {
      await this.executeSportAnalysis(sportConfig, results);
    }

    // Generate master summary
    await this.generateMasterSummary(results);
    
    // Save comprehensive results
    await this.saveMasterResults(results);

    this.generateFinalSummary(results);
    
    return results;
  }

  async executeSportAnalysis(sportConfig, results) {
    const startTime = Date.now();
    const sportKey = sportConfig.gender ? `${sportConfig.gender}_${sportConfig.sport}` : sportConfig.sport;
    const displayName = sportConfig.gender ? `${sportConfig.gender.toUpperCase()} ${sportConfig.sport.toUpperCase()}` : sportConfig.sport.toUpperCase();
    
    try {
      console.log(`\n🎯 ==============================`);
      console.log(`🎯 STARTING ${displayName} UNIFIED ANALYSIS`);
      console.log(`🎯 ==============================\n`);
      
      const sportResults = await this.analyzer.executeUnifiedSportAnalysis(
        sportConfig.sport, 
        sportConfig.gender
      );
      
      const duration = (Date.now() - startTime) / 1000;
      results.sportsResults[sportKey] = {
        ...sportResults,
        executionTime: duration,
        status: 'completed'
      };
      
      results.executionLog.push({
        sport: sportConfig.sport,
        gender: sportConfig.gender,
        displayName: displayName,
        status: 'completed',
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      console.log(`\n✅ ${displayName} UNIFIED ANALYSIS COMPLETED (${duration.toFixed(1)}s)\n`);
      
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      console.error(`\n❌ ${displayName} UNIFIED ANALYSIS FAILED:`, error.message);
      
      results.sportsResults[sportKey] = {
        status: 'failed',
        error: error.message,
        executionTime: duration
      };
      
      results.executionLog.push({
        sport: sportConfig.sport,
        gender: sportConfig.gender,
        displayName: displayName,
        status: 'failed',
        error: error.message,
        duration: duration,
        timestamp: new Date().toISOString()
      });
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
      successRate: Math.round((successfulSports / this.sportsToAnalyze.length) * 100),
      completedAt: new Date().toISOString()
    };
  }

  async saveMasterResults(results) {
    const dataDir = path.join(__dirname, '..', 'data', 'research_results');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      // Save comprehensive master results
      const masterPath = path.join(dataDir, 'unified_2025_26_master_sports_analysis.json');
      await fs.writeFile(masterPath, JSON.stringify(results, null, 2));
      
      // Save execution summary
      const summaryPath = path.join(dataDir, 'unified_2025_26_execution_summary.json');
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
        }, {}),
        methodology: {
          type: 'Unified Sport Pipeline Assessment',
          features: [
            'Consolidated research methodology across all sports',
            'Comprehensive transfer portal rankings integration',
            'Complete recruiting class rankings analysis',
            'Sport-specific unified COMPASS ratings',
            'Real-time 2025-26 season preparation focus'
          ]
        }
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
    console.log(`🏆 MASTER UNIFIED SPORTS ANALYSIS COMPLETE`);
    console.log(`🏆 ================================`);
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(1)} seconds (${(totalDuration / 60).toFixed(1)} minutes)`);
    console.log(`📊 Sports Analyzed: ${masterSummary.successfulSports}/${this.sportsToAnalyze.length}`);
    console.log(`🎯 Total Teams: ${masterSummary.totalTeams || 'N/A'}`);
    console.log(`📈 Total Analyses: ${masterSummary.totalAnalyses || 'N/A'}`);
    console.log(`✨ Success Rate: ${masterSummary.successRate}%`);
    console.log(`🔍 Methodology: Unified Sport Pipeline Assessment`);
    
    console.log(`\n🏆 Completed Sports with Unified Methodology:`);
    Object.entries(results.sportsResults).forEach(([sport, data]) => {
      if (data.status === 'completed') {
        const teams = data.executionSummary?.teams || 'N/A';
        console.log(`   ✅ ${sport.toUpperCase()}: ${teams} teams analyzed (${data.executionTime?.toFixed(1)}s)`);
      } else {
        console.log(`   ❌ ${sport.toUpperCase()}: Failed (${data.error})`);
      }
    });
    
    if (masterSummary.successfulSports > 0) {
      console.log(`\n🎯 Unified Analysis Features Completed:`);
      console.log(`   • Consolidated research methodology across all sports`);
      console.log(`   • Complete 2025-26 season preparation assessment`);
      console.log(`   • Summer 2025 transfer portal rankings and impact analysis`);
      console.log(`   • Comprehensive recruiting class rankings and pipeline analysis`);
      console.log(`   • Sport-specific unified COMPASS ratings with ranking integration`);
      console.log(`   • Real-time competitive positioning and championship probability`);
      console.log(`   • Roster construction and depth analysis with rankings`);
      console.log(`   • NIL impact assessment on ranked player acquisition`);
    }
    
    console.log(`\n🏆 Unified Big 12 Sports Research Infrastructure Complete! 🏆`);
    console.log(`📊 Ready for comprehensive multi-sport analysis with consolidated methodology`);
    console.log(`🎯 All sports now use the same unified assessment framework for consistency`);
  }
}

// Execute master unified sports analysis
async function main() {
  try {
    const analyzer = new MasterUnifiedSportsAnalysis();
    await analyzer.executeAllUnifiedSportsAnalysis();
    process.exit(0);
  } catch (error) {
    console.error('❌ Master unified sports analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MasterUnifiedSportsAnalysis;