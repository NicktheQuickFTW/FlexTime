#!/usr/bin/env node

/**
 * Unified Sport Pipeline Analysis - Consolidated 2025-26 Season Assessment
 * Single method to assess any Big 12 sport with comprehensive transfer portal and recruiting data
 */

const PerplexityResearchService = require('../backend/services/perplexityResearchService');
const GeminiResearchService = require('../backend/services/geminiResearchService');
const fs = require('fs').promises;
const path = require('path');

class UnifiedSportPipelineAnalysis {
  constructor() {
    this.perplexityService = new PerplexityResearchService();
    this.geminiService = new GeminiResearchService();
    this.startTime = Date.now();
  }

  async executeUnifiedSportAnalysis(sport, gender = null, teams = null) {
    const sportConfig = this.getSportTeamConfiguration(sport, gender);
    const teamsToAnalyze = teams || sportConfig.teams;
    
    console.log(`\n🎯 UNIFIED ${sport.toUpperCase()}${gender ? ` (${gender.toUpperCase()})` : ''} PIPELINE ANALYSIS - 2025-26 FOCUS`);
    console.log(`📊 Teams: ${teamsToAnalyze.length}`);
    console.log(`🔍 Unified Method: Transfer Portal + Recruiting Rankings + Pipeline Assessment`);
    console.log(`📅 Focus: Complete 2025-26 Season Preparation\n`);

    const results = {
      executionSummary: {
        title: `Big 12 ${sportConfig.displayName} Unified Pipeline Analysis - 2025-26 Season`,
        timestamp: new Date().toISOString(),
        sport: sport,
        gender: gender,
        focusPeriod: 'Spring 2025 - Summer 2025 - Complete 2025-26 Preparation',
        teams: teamsToAnalyze.length,
        methodology: 'Unified Sport Pipeline Assessment',
        totalAnalyses: teamsToAnalyze.length * 2 // Pipeline + COMPASS per team
      },
      unifiedPipelineAssessments: {},
      unifiedCompassRatings: {},
      sportConfiguration: sportConfig
    };

    console.log(`⚡ Starting unified pipeline analysis for ${teamsToAnalyze.length} teams...\n`);

    // Execute unified pipeline assessments for all teams in parallel
    await this.executeUnifiedPipelineAssessments(sport, gender, teamsToAnalyze, results);
    
    // Execute unified COMPASS ratings sequentially to avoid rate limits
    await this.executeUnifiedCompassRatings(sport, gender, teamsToAnalyze, results);
    
    // Save comprehensive results
    await this.saveResults(sport, gender, results);
    
    // Generate execution summary
    this.generateExecutionSummary(sport, gender, results);

    return results;
  }

  async executeUnifiedPipelineAssessments(sport, gender, teams, results) {
    console.log(`🎯 PHASE 1: Unified Pipeline Assessments (Complete 2025-26 Preparation Focus)`);
    console.log(`📡 Executing parallel unified pipeline research for all teams...\n`);

    const pipelinePromises = teams.map(async (team, index) => {
      try {
        console.log(`   📊 [${index + 1}/${teams.length}] ${team} unified pipeline assessment...`);
        
        const pipelineData = await this.perplexityService.researchUnifiedSportPipeline(team, sport, gender);
        
        results.unifiedPipelineAssessments[team] = pipelineData;
        console.log(`   ✅ ${team} pipeline assessment complete (${pipelineData.usage?.total_tokens || 'N/A'} tokens)`);
        
        return { team, success: true, data: pipelineData };
      } catch (error) {
        console.error(`   ❌ ${team} pipeline assessment failed:`, error.message);
        return { team, success: false, error: error.message };
      }
    });

    const pipelineResults = await Promise.all(pipelinePromises);
    const successfulAssessments = pipelineResults.filter(r => r.success).length;
    
    console.log(`\n✨ Unified Pipeline Assessments Complete: ${successfulAssessments}/${teams.length} successful\n`);
  }

  async executeUnifiedCompassRatings(sport, gender, teams, results) {
    console.log(`🧭 PHASE 2: Unified COMPASS Ratings (Sequential execution to avoid rate limits)`);
    console.log(`🔄 Processing teams sequentially with sport-specific methodology...\n`);

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      
      try {
        console.log(`   🧭 [${i + 1}/${teams.length}] ${team} unified COMPASS analysis...`);
        
        // Use unified pipeline data for COMPASS analysis
        const teamData = results.unifiedPipelineAssessments[team] || {};
        const historicalTrends = { pipelineData: teamData };
        
        const compassData = await this.geminiService.generateUnifiedSportCompassRatings(teamData, historicalTrends, sport, gender);
        
        results.unifiedCompassRatings[team] = compassData;
        console.log(`   ✅ ${team} unified COMPASS complete`);
        
        // Small delay to avoid rate limits
        if (i < teams.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`   ❌ ${team} unified COMPASS failed:`, error.message);
        results.unifiedCompassRatings[team] = { error: error.message };
      }
    }
    
    const successfulCompass = Object.values(results.unifiedCompassRatings).filter(r => !r.error).length;
    console.log(`\n🧭 Unified COMPASS Ratings Complete: ${successfulCompass}/${teams.length} successful\n`);
  }

  getSportTeamConfiguration(sport, gender = null) {
    const configs = {
      football: {
        displayName: 'Football',
        teams: ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
      },
      basketball: {
        displayName: gender === 'womens' ? 'Women\'s Basketball' : 'Men\'s Basketball',
        teams: ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
      },
      volleyball: {
        displayName: 'Volleyball',
        teams: ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'] // 15 teams
      },
      soccer: {
        displayName: 'Soccer',
        teams: ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
      },
      tennis: {
        displayName: gender === 'womens' ? 'Women\'s Tennis' : 'Men\'s Tennis',
        teams: gender === 'mens' ? 
          ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah'] : // 9 teams
          ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'] // 16 teams
      },
      gymnastics: {
        displayName: 'Gymnastics',
        teams: ['Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia', 'Denver'] // 7 teams
      },
      wrestling: {
        displayName: 'Wrestling',
        teams: ['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia', 'Air Force', 'Cal Baptist', 'Missouri', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'Oklahoma', 'South Dakota State', 'Utah Valley', 'Wyoming'] // 14 teams
      },
      softball: {
        displayName: 'Softball',
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Houston', 'Iowa State', 'Kansas', 'Oklahoma State', 'Texas Tech', 'UCF', 'Utah'] // 11 teams
      },
      lacrosse: {
        displayName: 'Lacrosse',
        teams: ['Arizona State', 'Cincinnati', 'Colorado', 'Florida', 'San Diego State', 'UC Davis'] // 3 full + 3 associate
      },
      baseball: {
        displayName: 'Baseball',
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Houston', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'] // 14 teams
      }
    };

    return configs[sport.toLowerCase()] || configs.football;
  }

  async saveResults(sport, gender, results) {
    const dataDir = path.join(__dirname, '..', 'data', 'research_results');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      // Create sport-specific filename
      const sportIdentifier = gender ? `${gender}_${sport}` : sport;
      const filePath = path.join(dataDir, `unified_2025_26_${sportIdentifier}_pipeline_data.json`);
      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      
      // Save execution summary
      const summaryPath = path.join(dataDir, `unified_2025_26_${sportIdentifier}_analysis.json`);
      const summary = {
        executionSummary: results.executionSummary,
        keyFindings: {
          unifiedPipelineAssessments: {
            teamsAnalyzed: Object.keys(results.unifiedPipelineAssessments).length,
            totalCitations: Object.values(results.unifiedPipelineAssessments).reduce((sum, data) => 
              sum + (data.citations?.length || 0), 0),
            averageContentLength: this.calculateAverageContentLength(results.unifiedPipelineAssessments)
          },
          unifiedCompassRatings: {
            teamsAnalyzed: Object.keys(results.unifiedCompassRatings).length,
            totalAnalyses: Object.values(results.unifiedCompassRatings).filter(r => !r.error).length
          }
        },
        teamSummaries: this.generateTeamSummaries(results),
        methodology: 'Unified Sport Pipeline Assessment with Comprehensive Rankings Integration'
      };
      
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log(`💾 Results saved:`);
      console.log(`   📄 Complete data: ${filePath}`);
      console.log(`   📊 Analysis summary: ${summaryPath}\n`);
      
    } catch (error) {
      console.error('❌ Error saving results:', error.message);
    }
  }

  calculateAverageContentLength(data) {
    const contents = Object.values(data).map(item => item.content?.length || 0);
    return contents.length > 0 ? Math.round(contents.reduce((a, b) => a + b, 0) / contents.length) : 0;
  }

  generateTeamSummaries(results) {
    const summaries = {};
    
    Object.keys(results.unifiedPipelineAssessments).forEach(team => {
      summaries[team] = {
        hasUnifiedPipeline: !!results.unifiedPipelineAssessments[team]?.content,
        hasUnifiedCompass: !!results.unifiedCompassRatings[team]?.content,
        completionStatus: (
          results.unifiedPipelineAssessments[team]?.content && 
          results.unifiedCompassRatings[team]?.content
        ) ? 'complete' : 'partial'
      };
    });
    
    return summaries;
  }

  generateExecutionSummary(sport, gender, results) {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalAnalyses = Object.keys(results.unifiedPipelineAssessments).length + 
                         Object.keys(results.unifiedCompassRatings).length;
    const teamCount = Object.keys(results.unifiedPipelineAssessments).length;
    
    console.log(`\n🎯 ================================`);
    console.log(`🏆 UNIFIED ${sport.toUpperCase()}${gender ? ` (${gender.toUpperCase()})` : ''} PIPELINE ANALYSIS COMPLETE`);
    console.log(`🎯 ================================`);
    console.log(`⏱️  Duration: ${duration.toFixed(1)} seconds`);
    console.log(`📊 Total Analyses: ${totalAnalyses}`);
    console.log(`🎯 Teams Analyzed: ${teamCount}`);
    console.log(`🔍 Methodology: Unified Sport Pipeline Assessment`);
    console.log(`✨ Features: Comprehensive 2025-26 preparation with rankings integration`);
    console.log(`📈 Success Rate: ${Math.round((totalAnalyses / (teamCount * 2)) * 100)}%`);
    console.log(`\n🏆 Unified Analysis includes:`);
    console.log(`   • Complete 2025-26 season preparation assessment`);
    console.log(`   • Summer 2025 transfer portal rankings and impact analysis`);
    console.log(`   • Comprehensive recruiting class rankings and pipeline analysis`);
    console.log(`   • Sport-specific unified COMPASS ratings with ranking integration`);
    console.log(`   • Real-time competitive positioning and championship probability`);
    console.log(`   • Roster construction and depth analysis with rankings`);
    console.log(`\n🎯 Ready for comprehensive ${sport} insights with unified methodology! 🏆`);
  }
}

// Execute unified sport pipeline analysis
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node run-unified-sport-pipeline-analysis.js <sport> [gender] [teams]

Examples:
  node run-unified-sport-pipeline-analysis.js football
  node run-unified-sport-pipeline-analysis.js basketball mens
  node run-unified-sport-pipeline-analysis.js basketball womens
  node run-unified-sport-pipeline-analysis.js tennis mens
  node run-unified-sport-pipeline-analysis.js volleyball
  node run-unified-sport-pipeline-analysis.js soccer

Available sports: football, basketball, volleyball, soccer, tennis, gymnastics, wrestling, softball, lacrosse, baseball
Note: basketball and tennis require gender specification (mens/womens)
    `);
    process.exit(1);
  }

  const sport = args[0];
  const gender = args[1] || null;
  
  try {
    const analyzer = new UnifiedSportPipelineAnalysis();
    await analyzer.executeUnifiedSportAnalysis(sport, gender);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Unified ${sport} pipeline analysis failed:`, error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = UnifiedSportPipelineAnalysis;