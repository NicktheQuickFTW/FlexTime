#!/usr/bin/env node

/**
 * Summer 2025 Transfer Portal & Recruiting Focus
 * Specialized research for current transfer portal activity and 2025-26 recruiting
 */

const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env/flextime.env') });

const ParallelResearchOrchestrator = require('../backend/services/parallelResearchOrchestrator');

// Big 12 Football Teams for Summer 2025 Focus
const BIG12_FOOTBALL_TEAMS = [
  'Colorado', 'Iowa State', 'Oklahoma State', 'Utah', // Elite tier
  'Arizona', 'BYU', 'Cincinnati', 'TCU', // Rising tier
  'Baylor', 'Kansas State', 'Texas Tech', 'West Virginia', // Solid tier
  'Arizona State', 'Houston', 'UCF', 'Kansas' // Development tier
];

class Summer2025FootballFocus {
  constructor() {
    this.orchestrator = new ParallelResearchOrchestrator();
    this.outputDir = path.join(__dirname, '../data/research_results');
  }

  async run() {
    console.log('🏈 SUMMER 2025 TRANSFER PORTAL & RECRUITING FOCUS 🏈');
    console.log('=' * 70);
    console.log(`📅 Focus Period: Spring 2025 - Current (Summer 2025)`);
    console.log(`🎯 Teams: ${BIG12_FOOTBALL_TEAMS.length} Big 12 Football Programs`);
    console.log(`🔄 Transfer Portal: Summer 2025 activity and impact analysis`);
    console.log(`📋 Recruiting: 2025 class status and 2026 early momentum`);
    console.log(`📊 Projections: 2025-26 season outlook with current roster`);
    console.log('=' * 70);

    try {
      await this.ensureOutputDirectory();

      // Run three specialized research phases
      const results = await this.executeSummer2025Analysis();

      // Generate comprehensive report
      await this.generateSummer2025Report(results);

      console.log('\n🎉 SUMMER 2025 ANALYSIS COMPLETED! 🎉');
      return results;

    } catch (error) {
      console.error('💥 SUMMER 2025 ANALYSIS FAILED:', error);
      throw error;
    }
  }

  async executeSummer2025Analysis() {
    const analysisStart = Date.now();
    
    // Phase 1: Enhanced 2025-26 Projections (with portal/recruiting focus)
    console.log('\n🔄 Phase 1: Enhanced 2025-26 Projections with Portal/Recruiting Focus');
    const projectionsResults = await this.runEnhancedProjections();

    // Phase 2: Summer 2025 Transfer Portal Deep Dive
    console.log('\n🔄 Phase 2: Summer 2025 Transfer Portal Deep Dive');
    const portalResults = await this.runTransferPortalAnalysis();

    // Phase 3: Current Recruiting Status Update
    console.log('\n🔄 Phase 3: Current Recruiting Status Update');
    const recruitingResults = await this.runRecruitingAnalysis();

    const analysisEnd = Date.now();
    const totalDuration = (analysisEnd - analysisStart) / 1000;

    return {
      enhancedProjections: projectionsResults,
      transferPortal: portalResults,
      recruiting: recruitingResults,
      metadata: {
        teams: BIG12_FOOTBALL_TEAMS.length,
        totalAnalyses: BIG12_FOOTBALL_TEAMS.length * 3,
        duration: totalDuration,
        completedAt: new Date().toISOString(),
        focus: 'Summer 2025 Transfer Portal & Recruiting'
      }
    };
  }

  async runEnhancedProjections() {
    const startTime = Date.now();
    console.log(`📊 Running enhanced 2025-26 projections for ${BIG12_FOOTBALL_TEAMS.length} teams...`);

    const jobs = BIG12_FOOTBALL_TEAMS.map((team, index) => ({
      id: `${team}-enhanced-projections`,
      team: team,
      type: 'enhanced_projections',
      priority: this.getTeamPriority(team),
      workerIndex: index % this.orchestrator.perplexityWorkers.length
    }));

    // Sort by priority
    jobs.sort((a, b) => b.priority - a.priority);

    const promises = jobs.map(job => 
      this.orchestrator.perplexityWorkers[job.workerIndex].researchFootballTeamProjections(job.team)
    );

    const results = await Promise.allSettled(promises);
    const projectionsData = {};

    results.forEach((result, index) => {
      const team = jobs[index].team;
      if (result.status === 'fulfilled') {
        projectionsData[team] = result.value;
        console.log(`✅ ${team} enhanced projections completed`);
      } else {
        console.error(`❌ ${team} enhanced projections failed:`, result.reason?.message);
      }
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`✅ Enhanced projections completed in ${duration.toFixed(1)} seconds`);

    return projectionsData;
  }

  async runTransferPortalAnalysis() {
    const startTime = Date.now();
    console.log(`🔄 Running Summer 2025 transfer portal analysis for ${BIG12_FOOTBALL_TEAMS.length} teams...`);

    const jobs = BIG12_FOOTBALL_TEAMS.map((team, index) => ({
      id: `${team}-portal-analysis`,
      team: team,
      type: 'portal_analysis',
      priority: this.getTeamPriority(team),
      workerIndex: index % this.orchestrator.perplexityWorkers.length
    }));

    jobs.sort((a, b) => b.priority - a.priority);

    const promises = jobs.map(job => 
      this.orchestrator.perplexityWorkers[job.workerIndex].researchSummer2025TransferPortal(job.team)
    );

    const results = await Promise.allSettled(promises);
    const portalData = {};

    results.forEach((result, index) => {
      const team = jobs[index].team;
      if (result.status === 'fulfilled') {
        portalData[team] = result.value;
        console.log(`✅ ${team} transfer portal analysis completed`);
      } else {
        console.error(`❌ ${team} transfer portal analysis failed:`, result.reason?.message);
      }
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`✅ Transfer portal analysis completed in ${duration.toFixed(1)} seconds`);

    return portalData;
  }

  async runRecruitingAnalysis() {
    const startTime = Date.now();
    console.log(`📋 Running 2025-26 recruiting analysis for ${BIG12_FOOTBALL_TEAMS.length} teams...`);

    const jobs = BIG12_FOOTBALL_TEAMS.map((team, index) => ({
      id: `${team}-recruiting-analysis`,
      team: team,
      type: 'recruiting_analysis',
      priority: this.getTeamPriority(team),
      workerIndex: index % this.orchestrator.perplexityWorkers.length
    }));

    jobs.sort((a, b) => b.priority - a.priority);

    const promises = jobs.map(job => 
      this.orchestrator.perplexityWorkers[job.workerIndex].research2025RecruitingUpdate(job.team)
    );

    const results = await Promise.allSettled(promises);
    const recruitingData = {};

    results.forEach((result, index) => {
      const team = jobs[index].team;
      if (result.status === 'fulfilled') {
        recruitingData[team] = result.value;
        console.log(`✅ ${team} recruiting analysis completed`);
      } else {
        console.error(`❌ ${team} recruiting analysis failed:`, result.reason?.message);
      }
    });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(`✅ Recruiting analysis completed in ${duration.toFixed(1)} seconds`);

    return recruitingData;
  }

  async generateSummer2025Report(results) {
    console.log('📋 Generating Summer 2025 comprehensive report...');

    const report = {
      executionSummary: {
        title: 'Big 12 Football Summer 2025 Transfer Portal & Recruiting Analysis',
        timestamp: new Date().toISOString(),
        focusPeriod: 'Spring 2025 - Summer 2025',
        teams: results.metadata.teams,
        totalAnalyses: results.metadata.totalAnalyses,
        duration: results.metadata.duration,
        analysisTypes: ['Enhanced 2025-26 Projections', 'Transfer Portal Analysis', 'Recruiting Updates']
      },
      keyFindings: {
        transferPortalActivity: this.analyzePortalTrends(results.transferPortal),
        recruitingMomentum: this.analyzeRecruitingTrends(results.recruiting),
        seasonProjections: this.analyzeProjectionTrends(results.enhancedProjections)
      },
      teamSummaries: this.generateTeamSummaries(results),
      competitiveAnalysis: {
        portalWinners: [],
        recruitingLeaders: [],
        seasonOutlook: {}
      }
    };

    // Save comprehensive report
    const reportPath = path.join(this.outputDir, 'summer_2025_football_analysis.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Save raw data
    const dataPath = path.join(this.outputDir, 'summer_2025_football_data.json');
    await fs.writeFile(dataPath, JSON.stringify(results, null, 2));

    console.log(`📊 Summer 2025 report saved: ${reportPath}`);
    console.log(`📊 Raw data saved: ${dataPath}`);

    this.printSummary(report);
  }

  analyzePortalTrends(portalData) {
    const teams = Object.keys(portalData);
    return {
      teamsAnalyzed: teams.length,
      totalCitations: this.countCitations(portalData),
      averageContentLength: this.calculateAverageLength(portalData)
    };
  }

  analyzeRecruitingTrends(recruitingData) {
    const teams = Object.keys(recruitingData);
    return {
      teamsAnalyzed: teams.length,
      totalCitations: this.countCitations(recruitingData),
      averageContentLength: this.calculateAverageLength(recruitingData)
    };
  }

  analyzeProjectionTrends(projectionsData) {
    const teams = Object.keys(projectionsData);
    return {
      teamsAnalyzed: teams.length,
      totalCitations: this.countCitations(projectionsData),
      averageContentLength: this.calculateAverageLength(projectionsData)
    };
  }

  generateTeamSummaries(results) {
    const summaries = {};
    const allTeams = new Set([
      ...Object.keys(results.enhancedProjections || {}),
      ...Object.keys(results.transferPortal || {}),
      ...Object.keys(results.recruiting || {})
    ]);

    for (const team of allTeams) {
      summaries[team] = {
        hasProjections: !!results.enhancedProjections[team],
        hasPortalAnalysis: !!results.transferPortal[team],
        hasRecruitingData: !!results.recruiting[team],
        completionStatus: 'complete'
      };
    }

    return summaries;
  }

  countCitations(data) {
    let total = 0;
    Object.values(data).forEach(item => {
      if (item?.citations) total += item.citations.length;
    });
    return total;
  }

  calculateAverageLength(data) {
    const lengths = Object.values(data)
      .filter(item => item?.content)
      .map(item => item.content.length);
    
    return lengths.length > 0 ? 
      Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
  }

  printSummary(report) {
    console.log('\n📈 SUMMER 2025 ANALYSIS SUMMARY:');
    console.log('=' * 50);
    console.log(`📅 Focus Period: ${report.executionSummary.focusPeriod}`);
    console.log(`🏈 Teams Analyzed: ${report.executionSummary.teams}`);
    console.log(`📊 Total Analyses: ${report.executionSummary.totalAnalyses}`);
    console.log(`⏱️ Duration: ${report.executionSummary.duration.toFixed(1)} seconds`);
    console.log('');
    console.log('🔄 Transfer Portal Analysis:');
    console.log(`   Teams: ${report.keyFindings.transferPortalActivity.teamsAnalyzed}`);
    console.log(`   Citations: ${report.keyFindings.transferPortalActivity.totalCitations}`);
    console.log('');
    console.log('📋 Recruiting Analysis:');
    console.log(`   Teams: ${report.keyFindings.recruitingMomentum.teamsAnalyzed}`);
    console.log(`   Citations: ${report.keyFindings.recruitingMomentum.totalCitations}`);
    console.log('');
    console.log('📊 Enhanced Projections:');
    console.log(`   Teams: ${report.keyFindings.seasonProjections.teamsAnalyzed}`);
    console.log(`   Citations: ${report.keyFindings.seasonProjections.totalCitations}`);
  }

  getTeamPriority(team) {
    const elitePrograms = ['Colorado', 'Iowa State', 'Oklahoma State', 'Utah'];
    const risingPrograms = ['Arizona', 'BYU', 'Cincinnati', 'TCU'];
    const solidPrograms = ['Baylor', 'Kansas State', 'Texas Tech', 'West Virginia'];
    
    if (elitePrograms.includes(team)) return 100;
    if (risingPrograms.includes(team)) return 80;
    if (solidPrograms.includes(team)) return 60;
    return 40;
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new Summer2025FootballFocus();
  analyzer.run().catch(console.error);
}

module.exports = Summer2025FootballFocus;