#!/usr/bin/env node

/**
 * Parse Markdown COMPASS Data Script
 * 
 * Extracts detailed COMPASS ratings, recruiting data, transfer portal info,
 * and other research data from the enhanced markdown documents and imports
 * them into the HELiiX database comprehensive research tables.
 */

const fs = require('fs').promises;
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../config/neon_db_config');
const ComprehensiveResearchProcessor = require('../services/comprehensiveResearchProcessor');

class MarkdownCompassDataParser {
  constructor() {
    this.docsDir = path.join(__dirname, '../../frontend/docs');
    this.sequelize = null;
    this.processor = null;
    this.stats = {
      filesProcessed: 0,
      teamsExtracted: 0,
      compassRatingsFound: 0,
      transferDataFound: 0,
      recruitingDataFound: 0,
      coachingDataFound: 0
    };
  }

  async initialize() {
    this.sequelize = new Sequelize(config.connectionString, {
      dialectOptions: config.connection.dialectOptions,
      logging: false
    });
    
    await this.sequelize.authenticate();
    this.processor = new ComprehensiveResearchProcessor(this.sequelize);
    console.log('✅ Connected to HELiiX database');
  }

  async parseAllMarkdownFiles() {
    console.log('📖 Parsing COMPASS markdown documents...');
    
    const files = [
      'big12-basketball-compass-analysis.md',
      'big12-softball-compass-analysis.md', 
      'big12-baseball-compass-analysis-2025.md',
      'big12-comprehensive-sports-analysis-2025.md'
    ];

    for (const file of files) {
      try {
        console.log(`\n🔄 Processing: ${file}`);
        await this.parseMarkdownFile(file);
        this.stats.filesProcessed++;
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }

    await this.generateSummary();
  }

  async parseMarkdownFile(filename) {
    const filePath = path.join(this.docsDir, filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Determine sport
    const sport = this.extractSportFromFilename(filename);
    console.log(`🏀 Sport: ${sport}`);
    
    // Extract team sections
    const teamSections = this.extractTeamSections(content);
    console.log(`👥 Found ${teamSections.length} team sections`);
    
    // Process each team
    for (const teamSection of teamSections) {
      await this.processTeamSection(teamSection, sport);
    }
  }

  extractSportFromFilename(filename) {
    if (filename.includes('basketball')) return 'basketball';
    if (filename.includes('baseball')) return 'baseball';
    if (filename.includes('softball')) return 'softball';
    if (filename.includes('comprehensive')) return 'multiple';
    return 'basketball';
  }

  extractTeamSections(content) {
    const sections = [];
    
    // Split by team headers (## **Team Name** or ### **Team Name**)
    const teamHeaderRegex = /#{2,3}\s+\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;
    
    while ((match = teamHeaderRegex.exec(content)) !== null) {
      if (lastIndex > 0) {
        // Add previous section
        const sectionContent = content.substring(lastIndex, match.index);
        sections.push({
          name: sections[sections.length - 1]?.name,
          content: sectionContent
        });
      }
      
      sections.push({
        name: match[1].trim(),
        startIndex: match.index
      });
      lastIndex = match.index;
    }
    
    // Add final section
    if (sections.length > 0 && lastIndex > 0) {
      const finalContent = content.substring(lastIndex);
      sections[sections.length - 1].content = finalContent;
    }
    
    return sections.filter(section => section.content);
  }

  async processTeamSection(teamSection, sport) {
    try {
      const teamName = this.normalizeTeamName(teamSection.name);
      console.log(`  🔍 Processing: ${teamName}`);
      
      // Find team in database
      const team = await this.findTeam(teamName, sport);
      if (!team) {
        console.warn(`  ⚠️ Team not found in database: ${teamName} ${sport}`);
        return;
      }

      // Extract COMPASS rating
      const compassData = this.extractCompassData(teamSection.content);
      if (compassData) {
        await this.updateTeamCompassData(team, compassData);
        this.stats.compassRatingsFound++;
      }

      // Extract comprehensive research data
      const researchData = this.extractResearchData(teamSection.content);
      if (researchData) {
        await this.updateComprehensiveResearchData(team, researchData);
        
        // Use comprehensive processor for detailed extraction
        await this.processor.processTeamResearchData(
          { teamId: team.team_id, teamName: teamName, sport: sport },
          { history: { content: teamSection.content } },
          '2024-25'
        );
      }

      this.stats.teamsExtracted++;
      console.log(`  ✅ Updated: ${teamName}`);
      
    } catch (error) {
      console.error(`  ❌ Error processing ${teamSection.name}:`, error.message);
    }
  }

  normalizeTeamName(teamName) {
    return teamName
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/^\d+\.\s+/, '') // Remove numbering
      .replace(/\s+(Jayhawks|Cougars|Cyclones|Wildcats|Bears|Knights|Bearcats|Buffaloes|Red Raiders|Mountaineers|Sun Devils|Horned Frogs|Cowboys|Utes|Cowgirls)/i, '')
      .trim();
  }

  async findTeam(schoolName, sport) {
    try {
      const sportMap = {
        'basketball': 2, 'baseball': 1, 'softball': 15, 'football': 8,
        'volleyball': 24, 'soccer': 14, 'tennis': 18, 'wrestling': 25
      };
      
      const sportId = sportMap[sport] || 2;
      
      const [schools] = await this.sequelize.query(`
        SELECT school_id, short_display FROM schools 
        WHERE LOWER(short_display) = LOWER($1) 
           OR LOWER(school) LIKE LOWER($2)
        LIMIT 1
      `, { bind: [schoolName, `%${schoolName}%`] });

      if (schools.length === 0) return null;

      const [teams] = await this.sequelize.query(`
        SELECT team_id, school_id, sport_id FROM teams 
        WHERE school_id = $1 AND sport_id = $2
      `, { bind: [schools[0].school_id, sportId] });

      return teams.length > 0 ? teams[0] : null;
    } catch (error) {
      console.error(`Error finding team:`, error.message);
      return null;
    }
  }

  extractCompassData(content) {
    // Extract overall COMPASS rating
    const ratingMatch = content.match(/COMPASS\s+Rating[:\s]+(\d+\.?\d*)\/100/i);
    if (!ratingMatch) return null;

    const overallRating = parseFloat(ratingMatch[1]);
    
    // Extract component ratings
    const components = {};
    const componentPatterns = {
      competitive: /Competitive\s+Performance[^:]*:\s*(\d+\.?\d*)\/(\d+)/i,
      operational: /Operational\s+Excellence[^:]*:\s*(\d+\.?\d*)\/(\d+)/i,
      market: /Market\s+Position[^:]*:\s*(\d+\.?\d*)\/(\d+)/i,
      trajectory: /Performance\s+Trajectory[^:]*:\s*(\d+\.?\d*)\/(\d+)/i,
      analytics: /Analytics[^:]*:\s*(\d+\.?\d*)\/(\d+)/i
    };

    for (const [component, pattern] of Object.entries(componentPatterns)) {
      const match = content.match(pattern);
      if (match) {
        components[component] = parseFloat(match[1]);
      }
    }

    // Extract additional data
    const headCoach = this.extractField(content, /Head Coach[:\s]*([^\n]+)/i);
    const record = this.extractField(content, /Record[:\s]*([^\n]+)/i);

    return {
      overallRating,
      components,
      headCoach,
      record
    };
  }

  extractResearchData(content) {
    const data = {};
    
    // Transfer portal data
    const transferMatches = content.match(/transfer.*?(\w+\s+\w+)/gi);
    if (transferMatches) {
      data.transfers = transferMatches;
      this.stats.transferDataFound++;
    }
    
    // Recruiting data
    const recruitingMatches = content.match(/recruit.*?(?:class|ranking).*?#?(\d+)/gi);
    if (recruitingMatches) {
      data.recruiting = recruitingMatches;
      this.stats.recruitingDataFound++;
    }
    
    // Coaching data
    const coachingMatches = content.match(/coach.*?(?:hire|appoint|sign)/gi);
    if (coachingMatches) {
      data.coaching = coachingMatches;
      this.stats.coachingDataFound++;
    }
    
    return Object.keys(data).length > 0 ? data : null;
  }

  extractField(content, pattern) {
    const match = content.match(pattern);
    return match ? match[1].trim() : null;
  }

  async updateTeamCompassData(team, compassData) {
    try {
      await this.sequelize.query(`
        UPDATE teams SET
          compass_rating = $1,
          compass_competitive = $2,
          compass_operational = $3,
          compass_market = $4,
          compass_trajectory = $5,
          compass_analytics = $6,
          head_coach = $7,
          season_record = $8,
          last_updated_summer_2025 = true,
          profile_last_updated = NOW(),
          profile_data_source = 'Enhanced Markdown Analysis'
        WHERE team_id = $9
      `, {
        bind: [
          compassData.overallRating,
          compassData.components.competitive || null,
          compassData.components.operational || null,
          compassData.components.market || null,
          compassData.components.trajectory || null,
          compassData.components.analytics || null,
          compassData.headCoach,
          compassData.record,
          team.team_id
        ]
      });
    } catch (error) {
      console.error('Error updating COMPASS data:', error.message);
    }
  }

  async updateComprehensiveResearchData(team, researchData) {
    try {
      await this.sequelize.query(`
        INSERT INTO comprehensive_research_data (
          team_id, season, research_source, research_confidence,
          last_research_update, created_at, updated_at
        ) VALUES ($1, '2024-25', 'markdown_analysis', 0.9, NOW(), NOW(), NOW())
        ON CONFLICT (team_id, season) DO UPDATE SET
          research_source = 'markdown_analysis',
          research_confidence = 0.9,
          last_research_update = NOW(),
          updated_at = NOW()
      `, { bind: [team.team_id] });
    } catch (error) {
      console.error('Error updating research data:', error.message);
    }
  }

  async generateSummary() {
    console.log('\n📊 MARKDOWN PARSING SUMMARY:');
    console.log(`   📁 Files Processed: ${this.stats.filesProcessed}`);
    console.log(`   👥 Teams Extracted: ${this.stats.teamsExtracted}`);
    console.log(`   🧭 COMPASS Ratings: ${this.stats.compassRatingsFound}`);
    console.log(`   📥 Transfer Data: ${this.stats.transferDataFound}`);
    console.log(`   🎯 Recruiting Data: ${this.stats.recruitingDataFound}`);
    console.log(`   👔 Coaching Data: ${this.stats.coachingDataFound}`);

    // Show database results
    const [results] = await this.sequelize.query(`
      SELECT 
        s.short_display,
        sp.sport_name,
        t.compass_rating,
        t.head_coach
      FROM teams t
      JOIN schools s ON t.school_id = s.school_id
      JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE t.last_updated_summer_2025 = true
      AND t.compass_rating IS NOT NULL
      ORDER BY t.compass_rating DESC
      LIMIT 15
    `);

    console.log('\n🏆 Top COMPASS ratings imported:');
    results.forEach((team, index) => {
      console.log(`   ${index + 1}. ${team.short_display} ${team.sport_name}: ${team.compass_rating} (${team.head_coach || 'No coach'})`);
    });

    await this.sequelize.close();
  }
}

async function main() {
  console.log('📖 Starting Markdown COMPASS Data Import');
  console.log('=' * 50);
  
  const parser = new MarkdownCompassDataParser();
  await parser.initialize();
  await parser.parseAllMarkdownFiles();
  
  console.log('\n✅ Markdown parsing completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MarkdownCompassDataParser;