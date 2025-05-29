#!/usr/bin/env node

/**
 * Enhanced Big 12 Lacrosse Analysis - Summer 2025 Transfer Portal & Recruiting Focus
 * Comprehensive research execution for all Big 12 lacrosse programs
 */

const PerplexityResearchService = require('../backend/services/perplexityResearchService');
const GeminiResearchService = require('../backend/services/geminiResearchService');
const fs = require('fs').promises;
const path = require('path');

class EnhancedLacrosseAnalysis {
  constructor() {
    this.perplexityService = new PerplexityResearchService();
    this.geminiService = new GeminiResearchService();
    this.startTime = Date.now();
    
    // Big 12 Lacrosse Teams (6 teams participate in lacrosse)
    this.teams = [
      'Arizona State', 'Cincinnati', 'Colorado'
      // Note: Florida, San Diego State, and UC Davis also participate but are associate members
    ];
    
    // Associate members for comprehensive analysis
    this.associateMembers = [
      'Florida', 'San Diego State', 'UC Davis'
    ];
    
    this.allTeams = [...this.teams, ...this.associateMembers];
  }

  async executeEnhancedLacrosseAnalysis() {
    console.log(`\n🥍 ENHANCED BIG 12 LACROSSE ANALYSIS - SUMMER 2025 FOCUS`);
    console.log(`📊 Full Members: ${this.teams.length} | Associate Members: ${this.associateMembers.length}`);
    console.log(`📊 Total Teams: ${this.allTeams.length}`);
    console.log(`🔍 Analysis Types: Enhanced Projections, Portal Analysis, Recruiting Updates`);
    console.log(`📅 Focus Period: Spring 2025 - Summer 2025\n`);

    const results = {
      executionSummary: {
        title: 'Big 12 Lacrosse Summer 2025 Transfer Portal & Recruiting Analysis',
        timestamp: new Date().toISOString(),
        focusPeriod: 'Spring 2025 - Summer 2025',
        fullMembers: this.teams.length,
        associateMembers: this.associateMembers.length,
        totalTeams: this.allTeams.length,
        analysisTypes: [
          'Enhanced 2025-26 Projections',
          'Enhanced COMPASS Ratings',
          'Transfer Portal & Recruiting Analysis'
        ]
      },
      enhancedProjections: {},
      enhancedCompassRatings: {},
      transferPortalAnalysis: {}
    };

    console.log(`⚡ Starting parallel research execution for ${this.allTeams.length} teams...\n`);

    // Execute enhanced projections for all teams in parallel
    await this.executeEnhancedProjections(results);
    
    // Execute enhanced COMPASS ratings sequentially to avoid rate limits
    await this.executeEnhancedCompassRatings(results);
    
    // Save comprehensive results
    await this.saveResults(results);
    
    // Generate execution summary
    this.generateExecutionSummary(results);

    return results;
  }

  async executeEnhancedProjections(results) {
    console.log(`🎯 PHASE 1: Enhanced Lacrosse Projections (Summer 2025 Focus)`);
    console.log(`📡 Executing parallel Perplexity research queries...\n`);

    const projectionPromises = this.allTeams.map(async (team, index) => {
      try {
        console.log(`   📊 [${index + 1}/${this.allTeams.length}] ${team} enhanced projections...`);
        
        const projectionData = await this.perplexityService.researchEnhancedLacrosseProjections(team);
        
        results.enhancedProjections[team] = projectionData;
        console.log(`   ✅ ${team} enhanced projections complete (${projectionData.usage?.total_tokens || 'N/A'} tokens)`);
        
        return { team, success: true, data: projectionData };
      } catch (error) {
        console.error(`   ❌ ${team} enhanced projections failed:`, error.message);
        return { team, success: false, error: error.message };
      }
    });

    const projectionResults = await Promise.all(projectionPromises);
    const successfulProjections = projectionResults.filter(r => r.success).length;
    
    console.log(`\n✨ Enhanced Projections Complete: ${successfulProjections}/${this.allTeams.length} successful\n`);
  }

  async executeEnhancedCompassRatings(results) {
    console.log(`🧭 PHASE 2: Enhanced COMPASS Ratings (Sequential execution to avoid rate limits)`);
    console.log(`🔄 Processing teams sequentially...\n`);

    for (let i = 0; i < this.allTeams.length; i++) {
      const team = this.allTeams[i];
      
      try {
        console.log(`   🧭 [${i + 1}/${this.allTeams.length}] ${team} enhanced COMPASS analysis...`);
        
        // Use enhanced projections data for COMPASS analysis
        const teamData = results.enhancedProjections[team] || {};
        const historicalTrends = { recentProjections: teamData };
        
        const compassData = await this.geminiService.generateEnhancedLacrosseCompassRatings(teamData, historicalTrends);
        
        results.enhancedCompassRatings[team] = compassData;
        console.log(`   ✅ ${team} enhanced COMPASS complete`);
        
        // Small delay to avoid rate limits
        if (i < this.allTeams.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`   ❌ ${team} enhanced COMPASS failed:`, error.message);
        results.enhancedCompassRatings[team] = { error: error.message };
      }
    }
    
    const successfulCompass = Object.values(results.enhancedCompassRatings).filter(r => !r.error).length;
    console.log(`\n🧭 Enhanced COMPASS Ratings Complete: ${successfulCompass}/${this.allTeams.length} successful\n`);
  }

  async saveResults(results) {
    const dataDir = path.join(__dirname, '..', 'data', 'research_results');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      // Save comprehensive lacrosse data
      const filePath = path.join(dataDir, 'summer_2025_lacrosse_data.json');
      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      
      // Save execution summary
      const summaryPath = path.join(dataDir, 'summer_2025_lacrosse_analysis.json');
      const summary = {
        executionSummary: results.executionSummary,
        keyFindings: {
          enhancedProjections: {
            teamsAnalyzed: Object.keys(results.enhancedProjections).length,
            totalCitations: Object.values(results.enhancedProjections).reduce((sum, data) => 
              sum + (data.citations?.length || 0), 0),
            averageContentLength: this.calculateAverageContentLength(results.enhancedProjections)
          },
          enhancedCompassRatings: {
            teamsAnalyzed: Object.keys(results.enhancedCompassRatings).length,
            totalAnalyses: Object.values(results.enhancedCompassRatings).filter(r => !r.error).length
          }
        },
        teamSummaries: this.generateTeamSummaries(results),
        membershipAnalysis: {
          fullMembers: this.teams,
          associateMembers: this.associateMembers
        }
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
    
    this.allTeams.forEach(team => {
      summaries[team] = {
        hasEnhancedProjections: !!results.enhancedProjections[team]?.content,
        hasEnhancedCompass: !!results.enhancedCompassRatings[team]?.content,
        membershipType: this.teams.includes(team) ? 'full' : 'associate',
        completionStatus: (
          results.enhancedProjections[team]?.content && 
          results.enhancedCompassRatings[team]?.content
        ) ? 'complete' : 'partial'
      };
    });
    
    return summaries;
  }

  generateExecutionSummary(results) {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalAnalyses = Object.keys(results.enhancedProjections).length + 
                         Object.keys(results.enhancedCompassRatings).length;
    
    console.log(`\n🎯 ================================`);
    console.log(`🥍 ENHANCED LACROSSE ANALYSIS COMPLETE`);
    console.log(`🎯 ================================`);
    console.log(`⏱️  Duration: ${duration.toFixed(1)} seconds`);
    console.log(`📊 Total Analyses: ${totalAnalyses}`);
    console.log(`🎯 Teams Analyzed: ${this.allTeams.length} (${this.teams.length} full + ${this.associateMembers.length} associate)`);
    console.log(`🔍 Focus: Summer 2025 Transfer Portal & Recruiting`);
    console.log(`✨ Enhanced Methods: Lacrosse-specific projections and COMPASS ratings`);
    console.log(`📈 Success Rate: ${Math.round((totalAnalyses / (this.allTeams.length * 2)) * 100)}%`);
    console.log(`\n🏆 Analysis includes:`);
    console.log(`   • Enhanced 2025-26 lacrosse projections with transfer portal focus`);
    console.log(`   • Current recruiting class status and regional expansion`);
    console.log(`   • Enhanced COMPASS ratings with lacrosse-specific methodology`);
    console.log(`   • Position group construction and championship contention analysis`);
    console.log(`\n🎯 Ready for enhanced lacrosse research insights! 🥍`);
  }
}

// Execute enhanced lacrosse analysis
async function main() {
  try {
    const analyzer = new EnhancedLacrosseAnalysis();
    await analyzer.executeEnhancedLacrosseAnalysis();
    process.exit(0);
  } catch (error) {
    console.error('❌ Enhanced lacrosse analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = EnhancedLacrosseAnalysis;