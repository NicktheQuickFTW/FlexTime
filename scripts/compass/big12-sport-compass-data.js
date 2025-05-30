#!/usr/bin/env node

/**
 * 🧭 BIG 12 SPORT COMPASS DATA SYSTEM
 * Advanced Multi-Sport Research & Analysis Platform
 * 
 * The definitive consolidated system for comprehensive Big 12 sports analysis
 * combining transfer portal data, recruiting rankings, and predictive modeling
 * across all 12 scheduled sports with unified methodology and dynamic optimization.
 */

const PerplexityResearchService = require('../backend/services/perplexityResearchService');
const GeminiResearchService = require('../backend/services/geminiResearchService');
const fs = require('fs').promises;
const path = require('path');

class Big12SportCompassData {
  constructor() {
    this.perplexityService = new PerplexityResearchService();
    this.geminiService = new GeminiResearchService();
    this.startTime = Date.now();
    this.systemName = "BIG 12 SPORT COMPASS DATA";
    this.version = "2.0.0";
  }

  // ========================================
  // 🎯 UNIFIED SPORT DATA ANALYSIS
  // ========================================

  async executeCompassData(sport, gender = null, teams = null, options = {}) {
    const {
      includeTransferPortal = true,
      includeRecruitingRankings = true,
      includeCompassRatings = true,
      focusSeasons = ['2025-26', '2026-27'],
      analysisDepth = 'comprehensive'
    } = options;

    const sportConfig = this.getSportConfiguration(sport, gender);
    const teamsToAnalyze = teams || sportConfig.teams;
    
    console.log(`\n🧭 ================================`);
    console.log(`🧭 ${this.systemName}`);
    console.log(`🧭 ${sportConfig.displayName.toUpperCase()} DATA ANALYSIS`);
    console.log(`🧭 ================================\n`);
    
    console.log(`📊 Teams: ${teamsToAnalyze.length}`);
    console.log(`🔍 Analysis Depth: ${analysisDepth}`);
    console.log(`📅 Focus Seasons: ${focusSeasons.join(', ')}`);
    console.log(`🎯 Transfer Portal: ${includeTransferPortal ? '✅' : '❌'}`);
    console.log(`📈 Recruiting Rankings: ${includeRecruitingRankings ? '✅' : '❌'}`);
    console.log(`🧭 COMPASS Ratings: ${includeCompassRatings ? '✅' : '❌'}\n`);

    const results = {
      dataSummary: {
        systemName: this.systemName,
        version: this.version,
        sport: sport,
        gender: gender,
        displayName: sportConfig.displayName,
        timestamp: new Date().toISOString(),
        focusSeasons: focusSeasons,
        teamsAnalyzed: teamsToAnalyze.length,
        analysisComponents: {
          transferPortalData: includeTransferPortal,
          recruitingRankingsAnalysis: includeRecruitingRankings,
          compassRatingsProjections: includeCompassRatings
        },
        methodology: 'Unified Sport Compass Data with Dynamic Optimization'
      },
      transferPortalData: {},
      compassRatingsProjections: {},
      sportConfiguration: sportConfig,
      executionMetrics: {}
    };

    // Phase 1: Transfer Portal & Recruiting Data
    if (includeTransferPortal || includeRecruitingRankings) {
      await this.executeTransferPortalData(sport, gender, teamsToAnalyze, results);
    }
    
    // Phase 2: COMPASS Ratings & Projections
    if (includeCompassRatings) {
      await this.executeCompassRatingsProjections(sport, gender, teamsToAnalyze, results);
    }
    
    // Save comprehensive results
    await this.saveDataResults(sport, gender, results);
    
    // Generate data summary
    this.generateDataSummary(sport, gender, results);

    return results;
  }

  async executeTransferPortalData(sport, gender, teams, results) {
    console.log(`🎯 PHASE 1: Transfer Portal & Recruiting Data`);
    console.log(`📡 Executing parallel data gathering for all teams...\n`);

    const dataPromises = teams.map(async (team, index) => {
      try {
        console.log(`   🔍 [${index + 1}/${teams.length}] ${team} transfer portal data...`);
        
        const teamData = await this.perplexityService.researchUnifiedSportPipeline(team, sport, gender);
        
        results.transferPortalData[team] = teamData;
        console.log(`   ✅ ${team} data complete (${teamData.usage?.total_tokens || 'N/A'} tokens)`);
        
        return { team, success: true, data: teamData };
      } catch (error) {
        console.error(`   ❌ ${team} data failed:`, error.message);
        return { team, success: false, error: error.message };
      }
    });

    const dataResults = await Promise.all(dataPromises);
    const successfulData = dataResults.filter(r => r.success).length;
    
    console.log(`\n✨ Transfer Portal Data Complete: ${successfulData}/${teams.length} successful\n`);
  }

  async executeCompassRatingsProjections(sport, gender, teams, results) {
    console.log(`🧭 PHASE 2: COMPASS Ratings & Projections Data`);
    console.log(`🔄 Processing teams sequentially with advanced analytics...\n`);

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      
      try {
        console.log(`   🧭 [${i + 1}/${teams.length}] ${team} COMPASS data analysis...`);
        
        // Use transfer portal data for COMPASS analysis
        const teamData = results.transferPortalData[team] || {};
        const historicalContext = { teamData: teamData };
        
        const compassData = await this.geminiService.generateUnifiedSportCompassRatings(
          teamData, 
          historicalContext, 
          sport, 
          gender
        );
        
        results.compassRatingsProjections[team] = compassData;
        console.log(`   ✅ ${team} COMPASS data complete`);
        
        // Intelligent rate limiting
        if (i < teams.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`   ❌ ${team} COMPASS data failed:`, error.message);
        results.compassRatingsProjections[team] = { error: error.message };
      }
    }
    
    const successfulCompass = Object.values(results.compassRatingsProjections).filter(r => !r.error).length;
    console.log(`\n🧭 COMPASS Data Complete: ${successfulCompass}/${teams.length} successful\n`);
  }

  // ========================================
  // 🏆 MASTER DATA EXECUTION
  // ========================================

  async executeMasterCompassData(options = {}) {
    const sportsToAnalyze = [
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

    console.log(`\n🧭 ========================================`);
    console.log(`🧭 ${this.systemName} - MASTER EXECUTION`);
    console.log(`🧭 Complete Big 12 Sports Data Analysis`);
    console.log(`🧭 ========================================\n`);
    
    console.log(`📊 Sports to Analyze: ${sportsToAnalyze.length}`);
    console.log(`🔍 Advanced Multi-Sport Data Platform`);
    console.log(`📅 Focus: Complete 2025-26 Season Data\n`);
    
    const masterResults = {
      masterDataSummary: {
        systemName: this.systemName,
        version: this.version,
        timestamp: new Date().toISOString(),
        sportsAnalyzed: sportsToAnalyze.map(s => s.gender ? `${s.gender} ${s.sport}` : s.sport),
        totalSports: sportsToAnalyze.length,
        methodology: 'Master Big 12 Sport Compass Data',
        analysisScope: 'Complete transfer portal, recruiting, and COMPASS data'
      },
      sportDataResults: {},
      executionMetrics: {}
    };

    for (let i = 0; i < sportsToAnalyze.length; i++) {
      const { sport, gender } = sportsToAnalyze[i];
      const sportKey = gender ? `${gender}_${sport}` : sport;
      
      console.log(`\n🎯 ==============================`);
      console.log(`🎯 SPORT ${i + 1}/${sportsToAnalyze.length}: ${sportKey.toUpperCase()} DATA`);
      console.log(`🎯 ==============================\n`);
      
      try {
        const sportResults = await this.executeCompassData(sport, gender, null, options);
        masterResults.sportDataResults[sportKey] = sportResults;
        
        console.log(`✅ ${sportKey} data analysis complete\n`);
        
        // Intelligent pause between sports
        if (i < sportsToAnalyze.length - 1) {
          console.log(`⏸️  Intelligent pause before next sport analysis...\n`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error) {
        console.error(`❌ ${sportKey} data analysis failed:`, error.message);
        masterResults.sportDataResults[sportKey] = { error: error.message };
      }
    }

    // Save master results
    await this.saveMasterDataResults(masterResults);
    
    // Generate master summary
    this.generateMasterDataSummary(masterResults);

    return masterResults;
  }

  // ========================================
  // 🔧 CONFIGURATION & UTILITIES
  // ========================================

  getSportConfiguration(sport, gender = null) {
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
        teams: ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
      },
      soccer: {
        displayName: 'Soccer',
        teams: ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
      },
      tennis: {
        displayName: gender === 'womens' ? 'Women\'s Tennis' : 'Men\'s Tennis',
        teams: gender === 'mens' ? 
          ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah'] :
          ['Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
      },
      gymnastics: {
        displayName: 'Gymnastics',
        teams: ['Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia', 'Denver']
      },
      wrestling: {
        displayName: 'Wrestling',
        teams: ['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia', 'Air Force', 'Cal Baptist', 'Missouri', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'Oklahoma', 'South Dakota State', 'Utah Valley', 'Wyoming']
      },
      softball: {
        displayName: 'Softball',
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Houston', 'Iowa State', 'Kansas', 'Oklahoma State', 'Texas Tech', 'UCF', 'Utah']
      },
      lacrosse: {
        displayName: 'Lacrosse',
        teams: ['Arizona State', 'Cincinnati', 'Colorado', 'Florida', 'San Diego State', 'UC Davis']
      },
      baseball: {
        displayName: 'Baseball',
        teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Houston', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
      }
    };

    return configs[sport.toLowerCase()] || configs.football;
  }

  async saveDataResults(sport, gender, results) {
    const dataDir = path.join(__dirname, '..', 'data', 'compass_data');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      const sportIdentifier = gender ? `${gender}_${sport}` : sport;
      const filePath = path.join(dataDir, `compass_data_${sportIdentifier}_${new Date().toISOString().split('T')[0]}.json`);
      await fs.writeFile(filePath, JSON.stringify(results, null, 2));
      
      console.log(`💾 Data results saved: ${filePath}\n`);
      
    } catch (error) {
      console.error('❌ Error saving data results:', error.message);
    }
  }

  async saveMasterDataResults(masterResults) {
    const dataDir = path.join(__dirname, '..', 'data', 'compass_data');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      
      const filePath = path.join(dataDir, `master_compass_data_${new Date().toISOString().split('T')[0]}.json`);
      await fs.writeFile(filePath, JSON.stringify(masterResults, null, 2));
      
      console.log(`💾 Master data results saved: ${filePath}`);
      
    } catch (error) {
      console.error('❌ Error saving master data results:', error.message);
    }
  }

  generateDataSummary(sport, gender, results) {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalAnalyses = Object.keys(results.transferPortalData).length + 
                         Object.keys(results.compassRatingsProjections).length;
    const teamCount = Object.keys(results.transferPortalData).length;
    
    console.log(`\n🧭 ========================================`);
    console.log(`🏆 ${sport.toUpperCase()}${gender ? ` (${gender.toUpperCase()})` : ''} COMPASS DATA COMPLETE`);
    console.log(`🧭 ========================================`);
    console.log(`⏱️  Duration: ${duration.toFixed(1)} seconds`);
    console.log(`📊 Total Analyses: ${totalAnalyses}`);
    console.log(`🎯 Teams Analyzed: ${teamCount}`);
    console.log(`🔍 System: ${this.systemName} v${this.version}`);
    console.log(`✨ Success Rate: ${Math.round((totalAnalyses / (teamCount * 2)) * 100)}%`);
    console.log(`\n🏆 Compass Data includes:`);
    console.log(`   • Complete 2025-26 season preparation data`);
    console.log(`   • Advanced transfer portal rankings and impact analysis`);
    console.log(`   • Comprehensive recruiting class data with pipeline analysis`);
    console.log(`   • Dynamic COMPASS ratings with predictive projections`);
    console.log(`   • Real-time competitive positioning and championship probability`);
    console.log(`   • Advanced roster construction and depth analysis`);
    console.log(`\n🎯 Ready for advanced ${sport} data insights! 🧭`);
  }

  generateMasterDataSummary(masterResults) {
    const duration = (Date.now() - this.startTime) / 1000;
    const successfulSports = Object.values(masterResults.sportDataResults).filter(r => !r.error).length;
    const totalSports = Object.keys(masterResults.sportDataResults).length;
    
    console.log(`\n🧭 ==========================================`);
    console.log(`🏆 BIG 12 SPORT COMPASS DATA COMPLETE`);
    console.log(`🧭 Master Multi-Sport Data Platform`);
    console.log(`🧭 ==========================================`);
    console.log(`⏱️  Total Duration: ${(duration / 60).toFixed(1)} minutes`);
    console.log(`📊 Sports Analyzed: ${successfulSports}/${totalSports}`);
    console.log(`🔍 System: ${this.systemName} v${this.version}`);
    console.log(`✨ Success Rate: ${Math.round((successfulSports / totalSports) * 100)}%`);
    console.log(`\n🏆 Master Data Platform includes:`);
    console.log(`   • Complete Big 12 sports ecosystem data`);
    console.log(`   • Unified transfer portal and recruiting analysis across all sports`);
    console.log(`   • Advanced COMPASS ratings with cross-sport comparisons`);
    console.log(`   • Predictive modeling for 2025-26 championship contention`);
    console.log(`   • Real-time competitive data and market positioning`);
    console.log(`   • Comprehensive program trajectory analysis`);
    console.log(`\n🎯 Big 12 Sport Compass Data System Ready! 🧭🏆`);
  }
}

// ========================================
// 🚀 EXECUTION INTERFACE
// ========================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🧭 BIG 12 SPORT COMPASS DATA SYSTEM

Usage: node big12-sport-compass-data.js <command> [options]

Commands:
  single <sport> [gender]     Analyze individual sport
  master                      Execute complete Big 12 data analysis
  
Examples:
  node big12-sport-compass-data.js single football
  node big12-sport-compass-data.js single basketball mens
  node big12-sport-compass-data.js single tennis womens
  node big12-sport-compass-data.js master

Available sports: football, basketball, volleyball, soccer, tennis, gymnastics, wrestling, softball, lacrosse, baseball
Note: basketball and tennis require gender specification (mens/womens)
    `);
    process.exit(1);
  }

  const command = args[0];
  
  try {
    const compassData = new Big12SportCompassData();
    
    if (command === 'single') {
      const sport = args[1];
      const gender = args[2] || null;
      
      if (!sport) {
        console.error('❌ Sport required for single analysis');
        process.exit(1);
      }
      
      await compassData.executeCompassData(sport, gender);
      
    } else if (command === 'master') {
      await compassData.executeMasterCompassData();
      
    } else {
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`❌ Big 12 Sport Compass Data failed:`, error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = Big12SportCompassData;