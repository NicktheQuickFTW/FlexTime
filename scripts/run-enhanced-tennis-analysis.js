#!/usr/bin/env node

/**
 * Enhanced Big 12 Tennis Analysis - Summer 2025 Transfer Portal & Recruiting Focus
 * Comprehensive research execution for all Big 12 tennis programs (Men's & Women's)
 */

const PerplexityResearchService = require('../backend/services/perplexityResearchService');
const GeminiResearchService = require('../backend/services/geminiResearchService');
const fs = require('fs').promises;
const path = require('path');

class EnhancedTennisAnalysis {
  constructor() {
    this.perplexityService = new PerplexityResearchService();
    this.geminiService = new GeminiResearchService();
    this.startTime = Date.now();
    
    // Big 12 Men's Tennis Teams (9 teams participate)
    this.mensTeams = [
      'Arizona', 'Arizona State', 'BYU', 'Baylor', 'Oklahoma State', 
      'TCU', 'Texas Tech', 'UCF', 'Utah'
    ];
    
    // Big 12 Women's Tennis Teams (16 teams participate)
    this.womensTeams = [
      'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 
      'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State',
      'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
    ];
  }

  async executeEnhancedTennisAnalysis() {
    console.log(`\n🎾 ENHANCED BIG 12 TENNIS ANALYSIS - SUMMER 2025 FOCUS`);
    console.log(`📊 Men's Teams: ${this.mensTeams.length} | Women's Teams: ${this.womensTeams.length}`);
    console.log(`🔍 Analysis Types: Enhanced Projections, Portal Analysis, Recruiting Updates`);
    console.log(`📅 Focus Period: Spring 2025 - Summer 2025\n`);

    const results = {
      executionSummary: {
        title: 'Big 12 Tennis Summer 2025 Transfer Portal & Recruiting Analysis',
        timestamp: new Date().toISOString(),
        focusPeriod: 'Spring 2025 - Summer 2025',
        mensTeams: this.mensTeams.length,
        womensTeams: this.womensTeams.length,
        totalTeams: this.mensTeams.length + this.womensTeams.length,
        analysisTypes: [
          'Enhanced 2025-26 Projections',
          'Enhanced COMPASS Ratings',
          'Transfer Portal & Recruiting Analysis'
        ]
      },
      mens: {
        enhancedProjections: {},
        enhancedCompassRatings: {}
      },
      womens: {
        enhancedProjections: {},
        enhancedCompassRatings: {}
      }
    };

    console.log(`⚡ Starting parallel research execution...\n`);

    // Execute enhanced projections for men's and women's teams
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
    console.log(`🎯 PHASE 1: Enhanced Tennis Projections (Summer 2025 Focus)`);
    console.log(`📡 Executing parallel Perplexity research queries...\n`);

    // Execute men's and women's projections in parallel
    const mensPromises = this.mensTeams.map(async (team, index) => {
      try {
        console.log(`   📊 [M${index + 1}/${this.mensTeams.length}] ${team} men's enhanced projections...`);
        
        const projectionData = await this.perplexityService.researchEnhancedTennisProjections(`${team} men's tennis`);
        
        results.mens.enhancedProjections[team] = projectionData;
        console.log(`   ✅ ${team} men's enhanced projections complete (${projectionData.usage?.total_tokens || 'N/A'} tokens)`);
        
        return { team, success: true, data: projectionData, gender: 'mens' };
      } catch (error) {
        console.error(`   ❌ ${team} men's enhanced projections failed:`, error.message);
        return { team, success: false, error: error.message, gender: 'mens' };
      }
    });

    const womensPromises = this.womensTeams.map(async (team, index) => {
      try {
        console.log(`   📊 [W${index + 1}/${this.womensTeams.length}] ${team} women's enhanced projections...`);
        
        const projectionData = await this.perplexityService.researchEnhancedTennisProjections(`${team} women's tennis`);
        
        results.womens.enhancedProjections[team] = projectionData;
        console.log(`   ✅ ${team} women's enhanced projections complete (${projectionData.usage?.total_tokens || 'N/A'} tokens)`);
        
        return { team, success: true, data: projectionData, gender: 'womens' };
      } catch (error) {
        console.error(`   ❌ ${team} women's enhanced projections failed:`, error.message);
        return { team, success: false, error: error.message, gender: 'womens' };
      }
    });

    const allPromises = [...mensPromises, ...womensPromises];
    const allResults = await Promise.all(allPromises);
    const successfulProjections = allResults.filter(r => r.success).length;
    
    console.log(`\n✨ Enhanced Projections Complete: ${successfulProjections}/${allResults.length} successful\n`);
  }

  async executeEnhancedCompassRatings(results) {
    console.log(`🧭 PHASE 2: Enhanced COMPASS Ratings (Sequential execution to avoid rate limits)`);
    console.log(`🔄 Processing teams sequentially...\n`);

    // Process men's teams
    for (let i = 0; i < this.mensTeams.length; i++) {
      const team = this.mensTeams[i];
      
      try {
        console.log(`   🧭 [M${i + 1}/${this.mensTeams.length}] ${team} men's enhanced COMPASS analysis...`);
        
        const teamData = results.mens.enhancedProjections[team] || {};
        const historicalTrends = { recentProjections: teamData };
        
        const compassData = await this.geminiService.generateEnhancedTennisCompassRatings(teamData, historicalTrends);
        
        results.mens.enhancedCompassRatings[team] = compassData;
        console.log(`   ✅ ${team} men's enhanced COMPASS complete`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`   ❌ ${team} men's enhanced COMPASS failed:`, error.message);
        results.mens.enhancedCompassRatings[team] = { error: error.message };
      }
    }

    // Process women's teams
    for (let i = 0; i < this.womensTeams.length; i++) {
      const team = this.womensTeams[i];
      
      try {
        console.log(`   🧭 [W${i + 1}/${this.womensTeams.length}] ${team} women's enhanced COMPASS analysis...`);
        
        const teamData = results.womens.enhancedProjections[team] || {};
        const historicalTrends = { recentProjections: teamData };
        
        const compassData = await this.geminiService.generateEnhancedTennisCompassRatings(teamData, historicalTrends);
        
        results.womens.enhancedCompassRatings[team] = compassData;
        console.log(`   ✅ ${team} women's enhanced COMPASS complete`);
        
        // Small delay to avoid rate limits
        if (i < this.womensTeams.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`   ❌ ${team} women's enhanced COMPASS failed:`, error.message);
        results.womens.enhancedCompassRatings[team] = { error: error.message };
      }
    }
    
    const mensCompassSuccess = Object.values(results.mens.enhancedCompassRatings).filter(r => !r.error).length;
    const womensCompassSuccess = Object.values(results.womens.enhancedCompassRatings).filter(r => !r.error).length;
    const totalCompassSuccess = mensCompassSuccess + womensCompassSuccess;
    const totalCompassAttempts = this.mensTeams.length + this.womensTeams.length;
    
    console.log(`\n🧭 Enhanced COMPASS Ratings Complete: ${totalCompassSuccess}/${totalCompassAttempts} successful\n`);
  }

  async saveResults(results) {
    const dataDir = path.join(__dirname, '..', 'data', 'research_results');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      // Save separate men's and women's tennis data files
      const mensFilePath = path.join(dataDir, 'summer_2025_mens_tennis_data.json');
      const womensFilePath = path.join(dataDir, 'summer_2025_womens_tennis_data.json');
      
      const mensResults = {
        executionSummary: {
          ...results.executionSummary,
          title: 'Big 12 Men\'s Tennis Summer 2025 Transfer Portal & Recruiting Analysis',
          teams: this.mensTeams.length,
          gender: 'mens'
        },
        enhancedProjections: results.mens.enhancedProjections,
        enhancedCompassRatings: results.mens.enhancedCompassRatings
      };
      
      const womensResults = {
        executionSummary: {
          ...results.executionSummary,
          title: 'Big 12 Women\'s Tennis Summer 2025 Transfer Portal & Recruiting Analysis',
          teams: this.womensTeams.length,
          gender: 'womens'
        },
        enhancedProjections: results.womens.enhancedProjections,
        enhancedCompassRatings: results.womens.enhancedCompassRatings
      };
      
      await fs.writeFile(mensFilePath, JSON.stringify(mensResults, null, 2));
      await fs.writeFile(womensFilePath, JSON.stringify(womensResults, null, 2));
      
      // Save separate execution summaries
      const mensSummaryPath = path.join(dataDir, 'summer_2025_mens_tennis_analysis.json');
      const womensSummaryPath = path.join(dataDir, 'summer_2025_womens_tennis_analysis.json');
      
      const mensSummary = {
        executionSummary: mensResults.executionSummary,
        keyFindings: {
          enhancedProjections: {
            teamsAnalyzed: Object.keys(results.mens.enhancedProjections).length,
            totalCitations: Object.values(results.mens.enhancedProjections).reduce((sum, data) => 
              sum + (data.citations?.length || 0), 0),
            averageContentLength: this.calculateAverageContentLength(results.mens.enhancedProjections)
          },
          enhancedCompassRatings: {
            teamsAnalyzed: Object.keys(results.mens.enhancedCompassRatings).length,
            totalAnalyses: Object.values(results.mens.enhancedCompassRatings).filter(r => !r.error).length
          }
        },
        teamSummaries: this.generateMensTeamSummaries(results)
      };
      
      const womensSummary = {
        executionSummary: womensResults.executionSummary,
        keyFindings: {
          enhancedProjections: {
            teamsAnalyzed: Object.keys(results.womens.enhancedProjections).length,
            totalCitations: Object.values(results.womens.enhancedProjections).reduce((sum, data) => 
              sum + (data.citations?.length || 0), 0),
            averageContentLength: this.calculateAverageContentLength(results.womens.enhancedProjections)
          },
          enhancedCompassRatings: {
            teamsAnalyzed: Object.keys(results.womens.enhancedCompassRatings).length,
            totalAnalyses: Object.values(results.womens.enhancedCompassRatings).filter(r => !r.error).length
          }
        },
        teamSummaries: this.generateWomensTeamSummaries(results)
      };
      
      await fs.writeFile(mensSummaryPath, JSON.stringify(mensSummary, null, 2));
      await fs.writeFile(womensSummaryPath, JSON.stringify(womensSummary, null, 2));
      
      console.log(`💾 Results saved:`);
      console.log(`   📄 Men's Tennis data: ${mensFilePath}`);
      console.log(`   📄 Women's Tennis data: ${womensFilePath}`);
      console.log(`   📊 Men's Tennis summary: ${mensSummaryPath}`);
      console.log(`   📊 Women's Tennis summary: ${womensSummaryPath}\n`);
      
    } catch (error) {
      console.error('❌ Error saving results:', error.message);
    }
  }

  calculateAverageContentLength(data) {
    const contents = Object.values(data).map(item => item.content?.length || 0);
    return contents.length > 0 ? Math.round(contents.reduce((a, b) => a + b, 0) / contents.length) : 0;
  }

  generateTeamSummaries(results) {
    const summaries = {
      mens: {},
      womens: {}
    };
    
    this.mensTeams.forEach(team => {
      summaries.mens[team] = {
        hasEnhancedProjections: !!results.mens.enhancedProjections[team]?.content,
        hasEnhancedCompass: !!results.mens.enhancedCompassRatings[team]?.content,
        completionStatus: (
          results.mens.enhancedProjections[team]?.content && 
          results.mens.enhancedCompassRatings[team]?.content
        ) ? 'complete' : 'partial'
      };
    });
    
    this.womensTeams.forEach(team => {
      summaries.womens[team] = {
        hasEnhancedProjections: !!results.womens.enhancedProjections[team]?.content,
        hasEnhancedCompass: !!results.womens.enhancedCompassRatings[team]?.content,
        completionStatus: (
          results.womens.enhancedProjections[team]?.content && 
          results.womens.enhancedCompassRatings[team]?.content
        ) ? 'complete' : 'partial'
      };
    });
    
    return summaries;
  }

  generateMensTeamSummaries(results) {
    const summaries = {};
    
    this.mensTeams.forEach(team => {
      summaries[team] = {
        hasEnhancedProjections: !!results.mens.enhancedProjections[team]?.content,
        hasEnhancedCompass: !!results.mens.enhancedCompassRatings[team]?.content,
        completionStatus: (
          results.mens.enhancedProjections[team]?.content && 
          results.mens.enhancedCompassRatings[team]?.content
        ) ? 'complete' : 'partial'
      };
    });
    
    return summaries;
  }

  generateWomensTeamSummaries(results) {
    const summaries = {};
    
    this.womensTeams.forEach(team => {
      summaries[team] = {
        hasEnhancedProjections: !!results.womens.enhancedProjections[team]?.content,
        hasEnhancedCompass: !!results.womens.enhancedCompassRatings[team]?.content,
        completionStatus: (
          results.womens.enhancedProjections[team]?.content && 
          results.womens.enhancedCompassRatings[team]?.content
        ) ? 'complete' : 'partial'
      };
    });
    
    return summaries;
  }

  generateExecutionSummary(results) {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalProjections = Object.keys(results.mens.enhancedProjections).length + 
                            Object.keys(results.womens.enhancedProjections).length;
    const totalCompass = Object.keys(results.mens.enhancedCompassRatings).length + 
                        Object.keys(results.womens.enhancedCompassRatings).length;
    const totalAnalyses = totalProjections + totalCompass;
    
    console.log(`\n🎯 ================================`);
    console.log(`🎾 ENHANCED TENNIS ANALYSIS COMPLETE`);
    console.log(`🎯 ================================`);
    console.log(`⏱️  Duration: ${duration.toFixed(1)} seconds`);
    console.log(`📊 Total Analyses: ${totalAnalyses}`);
    console.log(`🎯 Men's Teams: ${this.mensTeams.length} | Women's Teams: ${this.womensTeams.length}`);
    console.log(`🔍 Focus: Summer 2025 Transfer Portal & Recruiting`);
    console.log(`✨ Enhanced Methods: Tennis-specific projections and COMPASS ratings`);
    console.log(`📈 Success Rate: ${Math.round((totalAnalyses / ((this.mensTeams.length + this.womensTeams.length) * 2)) * 100)}%`);
    console.log(`\n🏆 Analysis includes:`);
    console.log(`   • Enhanced 2025-26 tennis projections with transfer portal focus`);
    console.log(`   • Current recruiting class status and international pipeline`);
    console.log(`   • Enhanced COMPASS ratings with tennis-specific methodology`);
    console.log(`   • Singles/doubles lineup construction and championship contention`);
    console.log(`\n🎯 Ready for enhanced tennis research insights! 🎾`);
  }
}

// Execute enhanced tennis analysis
async function main() {
  try {
    const analyzer = new EnhancedTennisAnalysis();
    await analyzer.executeEnhancedTennisAnalysis();
    process.exit(0);
  } catch (error) {
    console.error('❌ Enhanced tennis analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = EnhancedTennisAnalysis;