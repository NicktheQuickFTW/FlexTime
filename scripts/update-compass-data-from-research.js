#!/usr/bin/env node

/**
 * Update COMPASS Data from Research Results
 * 
 * This script reads generated research results and updates:
 * 1. Hardcoded COMPASS data in BIG12_COMPLETE_DATA.js
 * 2. Database COMPASS tables
 * 3. Frontend sport configurations
 * 
 * Does NOT generate new data - only updates existing systems.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// FlexTime's 12 core sports (matching frontend pages)
const FLEXTIME_SPORTS = [
  'baseball',
  'mens-basketball',
  'womens-basketball', 
  'football',
  'gymnastics',
  'lacrosse',
  'mens-tennis',
  'womens-tennis',
  'soccer',
  'softball',
  'volleyball',
  'wrestling'
];

// Big 12 teams
const BIG12_TEAMS = [
  'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
  'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
  'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
];

class COMPASSDataUpdater {
  constructor() {
    this.researchResultsPath = path.join(__dirname, '..', 'data', 'research_results');
    this.hardcodedDataPath = path.join(__dirname, '..', 'backend', 'data', 'hardcoded', 'BIG12_COMPLETE_DATA.js');
    this.updatedData = {};
    this.summary = {
      sportsProcessed: 0,
      teamsUpdated: 0,
      historicalYears: [],
      projectionYears: [],
      errors: []
    };
  }

  async run() {
    console.log(chalk.cyan('🔄 COMPASS Data Update System'));
    console.log(chalk.cyan('📊 Reading generated research results...'));
    console.log('');

    try {
      // Step 1: Read all research result files
      const researchFiles = await this.findResearchFiles();
      console.log(chalk.yellow(`📁 Found ${researchFiles.length} research result files`));

      // Step 2: Parse COMPASS data from research results  
      for (const file of researchFiles) {
        await this.parseResearchFile(file);
      }

      // Step 3: Update hardcoded data file
      await this.updateHardcodedData();

      // Step 4: Update database (if available)
      await this.updateDatabase();

      // Step 5: Generate summary report
      this.generateSummaryReport();

    } catch (error) {
      console.error(chalk.red('💥 Update failed:'), error.message);
      process.exit(1);
    }
  }

  async findResearchFiles() {
    const files = fs.readdirSync(this.researchResultsPath);
    
    return files.filter(file => {
      return file.endsWith('.json') && (
        file.includes('compass') ||
        file.includes('unified') ||
        file.includes('research') ||
        file.includes('analysis')
      );
    }).map(file => ({
      path: path.join(this.researchResultsPath, file),
      name: file,
      sport: this.extractSportFromFilename(file),
      type: this.extractTypeFromFilename(file)
    }));
  }

  extractSportFromFilename(filename) {
    const lowercased = filename.toLowerCase();
    
    // Check for sport names in filename
    for (const sport of FLEXTIME_SPORTS) {
      if (lowercased.includes(sport.replace('-', '')) || 
          lowercased.includes(sport)) {
        return sport;
      }
    }
    
    // Special cases
    if (lowercased.includes('basketball')) return 'basketball';
    if (lowercased.includes('football')) return 'football';
    
    return 'unknown';
  }

  extractTypeFromFilename(filename) {
    const lowercased = filename.toLowerCase();
    
    if (lowercased.includes('projection')) return 'projection';
    if (lowercased.includes('historical')) return 'historical';
    if (lowercased.includes('compass')) return 'compass';
    if (lowercased.includes('analysis')) return 'analysis';
    
    return 'general';
  }

  async parseResearchFile(file) {
    try {
      console.log(chalk.gray(`  📄 Processing: ${file.name}`));
      
      const content = fs.readFileSync(file.path, 'utf8');
      const data = JSON.parse(content);
      
      // Extract COMPASS data based on file structure
      const compassData = this.extractCOMPASSFromData(data, file.sport, file.type);
      
      if (compassData && Object.keys(compassData).length > 0) {
        this.mergeCOMPASSData(file.sport, compassData, file.type);
        console.log(chalk.green(`    ✅ Extracted COMPASS data for ${Object.keys(compassData).length} teams`));
      } else {
        console.log(chalk.yellow(`    ⚠️  No COMPASS data found`));
      }
      
    } catch (error) {
      console.log(chalk.red(`    ❌ Error processing ${file.name}: ${error.message}`));
      this.summary.errors.push({ file: file.name, error: error.message });
    }
  }

  extractCOMPASSFromData(data, sport, type) {
    const compassData = {};
    
    // Handle different data structures
    if (data.unifiedCompassRatings) {
      // Unified analysis format
      for (const [team, ratings] of Object.entries(data.unifiedCompassRatings)) {
        if (ratings && !ratings.error && ratings.compass) {
          compassData[team] = this.normalizeCOMPASSRatings(ratings.compass);
        }
      }
    } else if (data.teamData) {
      // Individual team format  
      for (const [team, teamData] of Object.entries(data.teamData)) {
        if (teamData.compass) {
          compassData[team] = this.normalizeCOMPASSRatings(teamData.compass);
        }
      }
    } else if (data.compass) {
      // Direct COMPASS format
      compassData[data.teamName || 'Unknown'] = this.normalizeCOMPASSRatings(data.compass);
    }
    
    return compassData;
  }

  normalizeCOMPASSRatings(compass) {
    // Normalize COMPASS ratings to standard format
    return {
      overall: compass.overall || compass.overallRating || 0,
      competitive: compass.competitive || compass.competitivePerformance || 0,
      operational: compass.operational || compass.operationalExcellence || 0,
      market: compass.market || compass.marketPosition || 0,
      trajectory: compass.trajectory || compass.performanceTrajectory || 0,
      analytics: compass.analytics || compass.analyticsScore || 0,
      year: compass.year || new Date().getFullYear(),
      confidence: compass.confidence || 0.8
    };
  }

  mergeCOMPASSData(sport, compassData, type) {
    if (!this.updatedData[sport]) {
      this.updatedData[sport] = {};
    }
    
    for (const [team, ratings] of Object.entries(compassData)) {
      if (!this.updatedData[sport][team]) {
        this.updatedData[sport][team] = {
          historical: {},
          projections: {}
        };
      }
      
      if (type === 'projection') {
        this.updatedData[sport][team].projections[ratings.year] = ratings;
      } else {
        this.updatedData[sport][team].historical[ratings.year] = ratings;
      }
    }
  }

  async updateHardcodedData() {
    console.log(chalk.yellow('\n📝 Updating hardcoded COMPASS data...'));
    
    try {
      // Read current hardcoded data
      const currentData = fs.readFileSync(this.hardcodedDataPath, 'utf8');
      
      // Create backup
      const backupPath = this.hardcodedDataPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, currentData);
      console.log(chalk.gray(`  💾 Backup created: ${path.basename(backupPath)}`));
      
      // Generate new COMPASS data section
      const newCompassSection = this.generateHardcodedCOMPASSSection();
      
      // Replace COMPASS section in file
      const updatedData = this.replaceCOMPASSSection(currentData, newCompassSection);
      
      // Write updated file
      fs.writeFileSync(this.hardcodedDataPath, updatedData);
      console.log(chalk.green('  ✅ Hardcoded data updated successfully'));
      
    } catch (error) {
      console.log(chalk.red(`  ❌ Failed to update hardcoded data: ${error.message}`));
      this.summary.errors.push({ section: 'hardcoded-data', error: error.message });
    }
  }

  generateHardcodedCOMPASSSection() {
    let compassSection = '  // COMPASS Ratings (Updated from Research Results)\n';
    compassSection += '  compassRatings: {\n';
    
    for (const [sport, sportData] of Object.entries(this.updatedData)) {
      compassSection += `    ${sport}: {\n`;
      
      for (const [team, teamData] of Object.entries(sportData)) {
        // Use most recent historical data or latest projection
        const latestHistorical = this.getLatestRating(teamData.historical);
        const latestProjection = this.getLatestRating(teamData.projections);
        const currentRating = latestHistorical || latestProjection;
        
        if (currentRating) {
          compassSection += `      "${team}": {\n`;
          compassSection += `        overall: ${currentRating.overall},\n`;
          compassSection += `        competitive: ${currentRating.competitive},\n`;
          compassSection += `        operational: ${currentRating.operational},\n`;
          compassSection += `        market: ${currentRating.market},\n`;
          compassSection += `        trajectory: ${currentRating.trajectory},\n`;
          compassSection += `        analytics: ${currentRating.analytics},\n`;
          compassSection += `        lastUpdated: "${new Date().toISOString()}"\n`;
          compassSection += `      },\n`;
        }
      }
      
      compassSection += `    },\n`;
    }
    
    compassSection += '  }';
    return compassSection;
  }

  getLatestRating(ratings) {
    if (!ratings || Object.keys(ratings).length === 0) return null;
    
    const years = Object.keys(ratings).sort().reverse();
    return ratings[years[0]];
  }

  replaceCOMPASSSection(data, newSection) {
    // Find and replace COMPASS section
    const compassStart = data.indexOf('compassRatings:');
    if (compassStart === -1) {
      // Append new section before closing brace
      const lastBrace = data.lastIndexOf('}');
      return data.slice(0, lastBrace) + ',\n\n' + newSection + '\n' + data.slice(lastBrace);
    }
    
    // Find end of COMPASS section
    let braceCount = 0;
    let compassEnd = compassStart;
    let inObject = false;
    
    for (let i = compassStart; i < data.length; i++) {
      if (data[i] === '{') {
        inObject = true;
        braceCount++;
      } else if (data[i] === '}') {
        braceCount--;
        if (inObject && braceCount === 0) {
          compassEnd = i + 1;
          break;
        }
      }
    }
    
    return data.slice(0, compassStart) + newSection + data.slice(compassEnd);
  }

  async updateDatabase() {
    console.log(chalk.yellow('\n🗃️  Database update not implemented yet'));
    console.log(chalk.gray('  Future: Update COMPASS tables in Neon database'));
  }

  generateSummaryReport() {
    console.log(chalk.cyan('\n📋 Update Summary'));
    console.log('═'.repeat(50));
    
    const totalSports = Object.keys(this.updatedData).length;
    let totalTeams = 0;
    
    for (const sportData of Object.values(this.updatedData)) {
      totalTeams += Object.keys(sportData).length;
    }
    
    console.log(chalk.green(`✅ Sports Updated: ${totalSports}/${FLEXTIME_SPORTS.length}`));
    console.log(chalk.green(`✅ Team Records Updated: ${totalTeams}`));
    
    if (this.summary.errors.length > 0) {
      console.log(chalk.red(`❌ Errors: ${this.summary.errors.length}`));
      this.summary.errors.forEach(error => {
        console.log(chalk.red(`   ${error.file || error.section}: ${error.error}`));
      });
    }
    
    console.log(chalk.cyan('\n🎯 Next Steps:'));
    console.log('   1. Verify updated COMPASS data in BIG12_COMPLETE_DATA.js');
    console.log('   2. Test frontend with new COMPASS scores');
    console.log('   3. Update database when ready');
    console.log('   4. Deploy updated system');
    
    // Save detailed summary
    const summaryPath = path.join(this.researchResultsPath, `compass_update_summary_${Date.now()}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: this.summary,
      updatedData: this.updatedData
    }, null, 2));
    
    console.log(chalk.gray(`\n📄 Detailed summary saved: ${path.basename(summaryPath)}`));
  }
}

// Run if called directly
if (require.main === module) {
  const updater = new COMPASSDataUpdater();
  updater.run().catch(console.error);
}

module.exports = COMPASSDataUpdater;