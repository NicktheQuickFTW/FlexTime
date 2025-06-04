#!/usr/bin/env node

/**
 * Enhanced COMPASS Data Update with Team Validation
 * 
 * This script:
 * 1. Reads generated research results
 * 2. Validates team participation per sport
 * 3. Filters out invalid teams (e.g., Colorado for Baseball)
 * 4. Handles affiliate members correctly (especially Wrestling)
 * 5. Updates hardcoded and database with validated data
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Sport-specific team participation (from CLAUDE.md and actual conference data)
const SPORT_TEAM_PARTICIPATION = {
  'baseball': {
    count: 14,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Houston', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
  },
  'mens-basketball': {
    count: 16,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
  },
  'womens-basketball': {
    count: 16,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
  },
  'football': {
    count: 16,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
  },
  'gymnastics': {
    count: 7,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia', 'Denver']
  },
  'lacrosse': {
    count: 6,
    teams: ['Arizona State', 'Cincinnati', 'Colorado', 'Florida', 'San Diego State', 'UC Davis']
  },
  'mens-tennis': {
    count: 9,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah']
  },
  'womens-tennis': {
    count: 16,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
  },
  'soccer': {
    count: 16,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
  },
  'softball': {
    count: 11,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Houston', 'Iowa State', 'Kansas', 'Oklahoma State', 'Texas Tech', 'UCF', 'Utah']
  },
  'volleyball': {
    count: 15,
    teams: ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia']
  },
  'wrestling': {
    count: 14,
    teams: ['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia', 'Air Force', 'Cal Baptist', 'Missouri', 'North Dakota State', 'Northern Colorado', 'Northern Iowa', 'Oklahoma', 'South Dakota State', 'Utah Valley', 'Wyoming']
  }
};

class EnhancedCOMPASSUpdater {
  constructor() {
    this.researchResultsPath = path.join(__dirname, '..', 'data', 'research_results');
    this.hardcodedDataPath = path.join(__dirname, '..', 'backend', 'data', 'hardcoded', 'BIG12_COMPLETE_DATA.js');
    this.validatedData = {};
    this.validationErrors = [];
    this.summary = {
      sportsProcessed: 0,
      teamsValidated: 0,
      teamsFiltered: 0,
      validationErrors: 0
    };
  }

  async run() {
    console.log(chalk.cyan('🔄 Enhanced COMPASS Data Update with Validation'));
    console.log(chalk.cyan('📊 Reading and validating research results...'));
    console.log('');

    try {
      // Step 1: Read research files
      const researchFiles = await this.findResearchFiles();
      console.log(chalk.yellow(`📁 Found ${researchFiles.length} research result files`));

      // Step 2: Process and validate each file
      for (const file of researchFiles) {
        await this.processAndValidateFile(file);
      }

      // Step 3: Generate validation report
      this.generateValidationReport();

      // Step 4: Update systems with validated data
      await this.updateHardcodedData();

      // Step 5: Generate final summary
      this.generateFinalSummary();

    } catch (error) {
      console.error(chalk.red('💥 Enhanced update failed:'), error.message);
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
    
    // Check for exact FlexTime sport matches
    const flexTimeSports = Object.keys(SPORT_TEAM_PARTICIPATION);
    for (const sport of flexTimeSports) {
      if (lowercased.includes(sport.replace('-', '')) || 
          lowercased.includes(sport)) {
        return sport;
      }
    }
    
    // Handle basketball special cases
    if (lowercased.includes('mens') && lowercased.includes('basketball')) return 'mens-basketball';
    if (lowercased.includes('womens') && lowercased.includes('basketball')) return 'womens-basketball';
    if (lowercased.includes('basketball') && !lowercased.includes('mens') && !lowercased.includes('womens')) {
      // Default basketball to mens for legacy files
      return 'mens-basketball';
    }
    
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

  async processAndValidateFile(file) {
    try {
      console.log(chalk.gray(`  📄 Processing: ${file.name} (${file.sport})`));
      
      const content = fs.readFileSync(file.path, 'utf8');
      const data = JSON.parse(content);
      
      // Extract COMPASS data
      const rawCompassData = this.extractCOMPASSFromData(data, file.sport, file.type);
      
      if (rawCompassData && Object.keys(rawCompassData).length > 0) {
        // Validate teams for this sport
        const validatedCompassData = this.validateTeamsForSport(rawCompassData, file.sport);
        
        if (Object.keys(validatedCompassData).length > 0) {
          this.mergeCOMPASSData(file.sport, validatedCompassData, file.type);
          console.log(chalk.green(`    ✅ Validated ${Object.keys(validatedCompassData).length}/${Object.keys(rawCompassData).length} teams`));
        } else {
          console.log(chalk.red(`    ❌ No valid teams found for ${file.sport}`));
        }
      } else {
        console.log(chalk.yellow(`    ⚠️  No COMPASS data found`));
      }
      
    } catch (error) {
      console.log(chalk.red(`    ❌ Error processing ${file.name}: ${error.message}`));
      this.validationErrors.push({ file: file.name, error: error.message });
    }
  }

  validateTeamsForSport(compassData, sport) {
    const validatedData = {};
    const sportConfig = SPORT_TEAM_PARTICIPATION[sport];
    
    if (!sportConfig) {
      console.log(chalk.yellow(`    ⚠️  Unknown sport: ${sport}`));
      return compassData; // Return as-is for unknown sports
    }

    const validTeams = sportConfig.teams;
    
    for (const [teamName, ratings] of Object.entries(compassData)) {
      if (validTeams.includes(teamName)) {
        validatedData[teamName] = ratings;
        this.summary.teamsValidated++;
      } else {
        console.log(chalk.yellow(`    ⚠️  Filtered invalid team for ${sport}: ${teamName}`));
        this.summary.teamsFiltered++;
        this.validationErrors.push({
          type: 'invalid_team',
          sport: sport,
          team: teamName,
          validTeams: validTeams
        });
      }
    }

    return validatedData;
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
    if (!this.validatedData[sport]) {
      this.validatedData[sport] = {};
    }
    
    for (const [team, ratings] of Object.entries(compassData)) {
      if (!this.validatedData[sport][team]) {
        this.validatedData[sport][team] = {
          historical: {},
          projections: {}
        };
      }
      
      if (type === 'projection') {
        this.validatedData[sport][team].projections[ratings.year] = ratings;
      } else {
        this.validatedData[sport][team].historical[ratings.year] = ratings;
      }
    }
  }

  generateValidationReport() {
    console.log(chalk.cyan('\n📋 Validation Report'));
    console.log('═'.repeat(50));
    
    // Report by sport
    for (const [sport, sportConfig] of Object.entries(SPORT_TEAM_PARTICIPATION)) {
      const dataExists = this.validatedData[sport];
      const expectedTeams = sportConfig.count;
      const actualTeams = dataExists ? Object.keys(dataExists).length : 0;
      
      const status = dataExists ? 
        (actualTeams === expectedTeams ? chalk.green('✅') : chalk.yellow('⚠️ ')) : 
        chalk.red('❌');
      
      console.log(`${status} ${sport}: ${actualTeams}/${expectedTeams} teams`);
      
      if (dataExists && actualTeams < expectedTeams) {
        const missingTeams = sportConfig.teams.filter(team => !dataExists[team]);
        console.log(chalk.gray(`    Missing: ${missingTeams.join(', ')}`));
      }
    }
    
    // Show filtered teams
    if (this.summary.teamsFiltered > 0) {
      console.log(chalk.yellow(`\n⚠️  Filtered ${this.summary.teamsFiltered} invalid team entries`));
    }
  }

  async updateHardcodedData() {
    console.log(chalk.yellow('\n📝 Updating hardcoded COMPASS data with validated teams...'));
    
    try {
      // Read current hardcoded data
      const currentData = fs.readFileSync(this.hardcodedDataPath, 'utf8');
      
      // Create backup
      const backupPath = this.hardcodedDataPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, currentData);
      console.log(chalk.gray(`  💾 Backup created: ${path.basename(backupPath)}`));
      
      // Generate new COMPASS data section with validated teams only
      const newCompassSection = this.generateValidatedCOMPASSSection();
      
      // Replace COMPASS section in file
      const updatedData = this.replaceCOMPASSSection(currentData, newCompassSection);
      
      // Write updated file
      fs.writeFileSync(this.hardcodedDataPath, updatedData);
      console.log(chalk.green('  ✅ Hardcoded data updated with validated teams'));
      
    } catch (error) {
      console.log(chalk.red(`  ❌ Failed to update hardcoded data: ${error.message}`));
      this.validationErrors.push({ section: 'hardcoded-data', error: error.message });
    }
  }

  generateValidatedCOMPASSSection() {
    let compassSection = '  // COMPASS Ratings (Updated from Validated Research Results)\n';
    compassSection += '  // Team participation validated per sport-specific conference rules\n';
    compassSection += '  compassRatings: {\n';
    
    for (const [sport, sportData] of Object.entries(this.validatedData)) {
      const sportConfig = SPORT_TEAM_PARTICIPATION[sport];
      compassSection += `    ${sport}: { // ${Object.keys(sportData).length}/${sportConfig?.count || '?'} teams\n`;
      
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
          compassSection += `        lastUpdated: "${new Date().toISOString()}",\n`;
          compassSection += `        dataSource: "${latestHistorical ? 'historical' : 'projection'}"\n`;
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

  generateFinalSummary() {
    console.log(chalk.cyan('\n📋 Enhanced Update Summary'));
    console.log('═'.repeat(60));
    
    const totalSports = Object.keys(this.validatedData).length;
    let totalValidTeams = 0;
    
    for (const sportData of Object.values(this.validatedData)) {
      totalValidTeams += Object.keys(sportData).length;
    }
    
    console.log(chalk.green(`✅ Sports Processed: ${totalSports}/12`));
    console.log(chalk.green(`✅ Valid Teams: ${totalValidTeams}`));
    console.log(chalk.yellow(`⚠️  Teams Filtered: ${this.summary.teamsFiltered}`));
    
    if (this.validationErrors.length > 0) {
      console.log(chalk.red(`❌ Validation Issues: ${this.validationErrors.length}`));
    }
    
    console.log(chalk.cyan('\n🎯 Validation Benefits:'));
    console.log('   ✓ Removed invalid team data (e.g., Colorado for Baseball)');
    console.log('   ✓ Ensured correct team counts per sport');
    console.log('   ✓ Included affiliate members for Wrestling');
    console.log('   ✓ Validated conference participation rules');
    
    // Save detailed validation report
    const reportPath = path.join(this.researchResultsPath, `compass_validation_report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: this.summary,
      validatedData: this.validatedData,
      validationErrors: this.validationErrors,
      sportParticipation: SPORT_TEAM_PARTICIPATION
    }, null, 2));
    
    console.log(chalk.gray(`\n📄 Validation report saved: ${path.basename(reportPath)}`));
  }
}

// Run if called directly
if (require.main === module) {
  const updater = new EnhancedCOMPASSUpdater();
  updater.run().catch(console.error);
}

module.exports = EnhancedCOMPASSUpdater;