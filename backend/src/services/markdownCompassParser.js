/**
 * Markdown COMPASS Parser Service
 * 
 * Parses the enhanced research markdown documents and extracts COMPASS ratings
 * for integration into the HELiiX database
 */

const fs = require('fs').promises;
const path = require('path');

class MarkdownCompassParser {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.docsDir = path.join(__dirname, '../../frontend/docs');
    this.stats = {
      filesProcessed: 0,
      teamsProcessed: 0,
      ratingsExtracted: 0,
      errors: []
    };
  }

  /**
   * Process all COMPASS markdown files
   */
  async processAllMarkdownFiles() {
    console.log('📄 Processing COMPASS markdown files...');
    
    try {
      const files = await fs.readdir(this.docsDir);
      const compassFiles = files.filter(file => 
        file.includes('compass') && file.endsWith('.md')
      );

      console.log(`Found ${compassFiles.length} COMPASS files:`, compassFiles);

      for (const file of compassFiles) {
        try {
          await this.processMarkdownFile(file);
        } catch (error) {
          console.error(`❌ Error processing ${file}:`, error.message);
          this.stats.errors.push({ file, error: error.message });
        }
      }

      await this.generateSummary();
      
    } catch (error) {
      console.error('💥 Error processing markdown files:', error);
      throw error;
    }
  }

  /**
   * Process individual markdown file
   */
  async processMarkdownFile(filename) {
    console.log(`📖 Processing: ${filename}`);
    
    const filePath = path.join(this.docsDir, filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Determine sport from filename
    const sport = this.extractSportFromFilename(filename);
    console.log(`🏀 Detected sport: ${sport}`);
    
    // Extract team data from markdown
    const teams = this.extractTeamsFromMarkdown(content, sport);
    console.log(`👥 Found ${teams.length} teams with COMPASS ratings`);
    
    // Update database
    for (const team of teams) {
      try {
        await this.updateTeamInDatabase(team);
        this.stats.teamsProcessed++;
        this.stats.ratingsExtracted++;
      } catch (error) {
        console.error(`❌ Error updating ${team.name}:`, error.message);
        this.stats.errors.push({ 
          team: team.name, 
          error: error.message 
        });
      }
    }
    
    this.stats.filesProcessed++;
    console.log(`✅ Processed ${filename}: ${teams.length} teams updated`);
  }

  /**
   * Extract sport from filename
   */
  extractSportFromFilename(filename) {
    const sportMap = {
      'basketball': 'basketball',
      'baseball': 'baseball', 
      'softball': 'softball',
      'football': 'football',
      'volleyball': 'volleyball',
      'soccer': 'soccer',
      'tennis': 'tennis',
      'wrestling': 'wrestling',
      'gymnastics': 'gymnastics',
      'lacrosse': 'lacrosse'
    };

    for (const [key, sport] of Object.entries(sportMap)) {
      if (filename.toLowerCase().includes(key)) {
        return sport;
      }
    }

    return 'basketball'; // Default
  }

  /**
   * Extract teams and COMPASS ratings from markdown content
   */
  extractTeamsFromMarkdown(content, sport) {
    const teams = [];
    
    // Split content by team sections (marked by ## **Team Name**)
    const teamSections = content.split(/##\s+\*\*([^*]+)\*\*/);
    
    for (let i = 1; i < teamSections.length; i += 2) {
      const teamName = teamSections[i].trim();
      const teamContent = teamSections[i + 1];
      
      // Extract COMPASS rating
      const compassData = this.extractCompassRating(teamContent, teamName);
      
      if (compassData) {
        teams.push({
          name: this.normalizeTeamName(teamName),
          sport: sport,
          ...compassData
        });
      }
    }
    
    return teams;
  }

  /**
   * Extract COMPASS rating and components from team content
   */
  extractCompassRating(content, teamName) {
    try {
      // Find COMPASS Rating line
      const ratingMatch = content.match(/COMPASS\s+Rating[:\s]+(\d+\.?\d*)\/100/i);
      if (!ratingMatch) {
        console.warn(`⚠️ No COMPASS rating found for ${teamName}`);
        return null;
      }

      const overallRating = parseFloat(ratingMatch[1]);
      
      // Extract component ratings
      const components = {};
      
      // Component patterns
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
          const score = parseFloat(match[1]);
          const maxScore = parseFloat(match[2]);
          components[component] = {
            score: score,
            maxScore: maxScore,
            percentage: (score / maxScore * 100).toFixed(1)
          };
        }
      }

      // Extract other relevant data
      const extractField = (pattern, defaultValue = null) => {
        const match = content.match(pattern);
        return match ? match[1].trim() : defaultValue;
      };

      return {
        compassRating: overallRating,
        components: components,
        headCoach: extractField(/Head Coach[:\s]*([^\n]+)/i),
        record: extractField(/Record[:\s]*([^\n]+)/i),
        achievements: this.extractAchievements(content),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error extracting COMPASS data for ${teamName}:`, error.message);
      return null;
    }
  }

  /**
   * Extract achievements from content
   */
  extractAchievements(content) {
    const achievements = [];
    
    // Look for achievements patterns
    const achievementPatterns = [
      /Achievement[:\s]*([^\n]+)/gi,
      /Champions?[:\s]*([^\n]+)/gi,
      /Tournament[:\s]*([^\n]+)/gi
    ];

    for (const pattern of achievementPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        achievements.push(match[1].trim());
      }
    }

    return achievements;
  }

  /**
   * Normalize team name to match database
   */
  normalizeTeamName(teamName) {
    // Remove formatting and common suffixes
    return teamName
      .replace(/\*\*/g, '') // Remove bold markdown
      .replace(/\s+(Jayhawks|Cougars|Cyclones|Wildcats|Bears|Knights|Bearcats|Buffaloes|Red Raiders|Mountaineers|Sun Devils|Horned Frogs|Cowboys|Utes)/i, '') // Remove mascots
      .trim();
  }

  /**
   * Update team in database
   */
  async updateTeamInDatabase(teamData) {
    try {
      // Find team using school name and sport
      const team = await this.findTeam(teamData.name, teamData.sport);
      
      if (!team) {
        throw new Error(`Team not found: ${teamData.name} ${teamData.sport}`);
      }

      // Prepare update data
      const updateData = {
        compass_rating: teamData.compassRating,
        compass_competitive: teamData.components.competitive?.score || null,
        compass_operational: teamData.components.operational?.score || null,
        compass_market: teamData.components.market?.score || null,
        compass_trajectory: teamData.components.trajectory?.score || null,
        compass_analytics: teamData.components.analytics?.score || null,
        last_updated_summer_2025: true,
        head_coach: teamData.headCoach,
        season_record: teamData.record,
        profile_last_updated: new Date(),
        profile_data_source: 'Enhanced COMPASS Analysis 2025'
      };

      // Update team record
      await this.sequelize.query(`
        UPDATE teams 
        SET 
          compass_rating = $1,
          compass_competitive = $2,
          compass_operational = $3,
          compass_market = $4,
          compass_trajectory = $5,
          compass_analytics = $6,
          last_updated_summer_2025 = $7,
          head_coach = $8,
          season_record = $9,
          profile_last_updated = $10,
          profile_data_source = $11
        WHERE team_id = $12
      `, {
        bind: [
          updateData.compass_rating,
          updateData.compass_competitive,
          updateData.compass_operational,
          updateData.compass_market,
          updateData.compass_trajectory,
          updateData.compass_analytics,
          updateData.last_updated_summer_2025,
          updateData.head_coach,
          updateData.season_record,
          updateData.profile_last_updated,
          updateData.profile_data_source,
          team.team_id
        ]
      });

      console.log(`✅ Updated ${teamData.name} ${teamData.sport}: COMPASS ${teamData.compassRating}`);

    } catch (error) {
      console.error(`❌ Error updating team ${teamData.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Find team in database
   */
  async findTeam(schoolName, sport) {
    try {
      // Map sport names to sport_ids (same as researchCompassIntegration.js)
      const sportMap = {
        'basketball': 2, // Default to men's basketball
        'football': 8,
        'softball': 15,
        'baseball': 1,
        'volleyball': 24,
        'soccer': 14,
        'tennis': 18, // Default to men's tennis
        'wrestling': 25,
        'gymnastics': 11,
        'lacrosse': 12
      };

      const sportId = sportMap[sport];
      if (!sportId) {
        throw new Error(`Unknown sport: ${sport}`);
      }

      // Find school
      const [schools] = await this.sequelize.query(`
        SELECT school_id, school, short_display 
        FROM schools 
        WHERE LOWER(short_display) = LOWER($1) 
           OR LOWER(school) LIKE LOWER($2)
           OR LOWER(school) = LOWER($1)
        LIMIT 1
      `, { bind: [schoolName, `%${schoolName}%`] });

      if (schools.length === 0) {
        throw new Error(`School not found: ${schoolName}`);
      }

      const school = schools[0];

      // Find team
      const [teams] = await this.sequelize.query(`
        SELECT team_id, school_id, sport_id 
        FROM teams 
        WHERE school_id = $1 AND sport_id = $2
      `, { bind: [school.school_id, sportId] });

      if (teams.length === 0) {
        throw new Error(`Team not found: ${schoolName} ${sport}`);
      }

      return {
        team_id: teams[0].team_id,
        school_id: teams[0].school_id,
        sport_id: teams[0].sport_id,
        school_name: school.short_display
      };

    } catch (error) {
      console.error(`❌ Error finding team ${schoolName} ${sport}:`, error.message);
      return null;
    }
  }

  /**
   * Generate processing summary
   */
  async generateSummary() {
    console.log('\n📊 MARKDOWN PROCESSING SUMMARY:');
    console.log(`   📁 Files Processed: ${this.stats.filesProcessed}`);
    console.log(`   👥 Teams Processed: ${this.stats.teamsProcessed}`);
    console.log(`   🧭 Ratings Extracted: ${this.stats.ratingsExtracted}`);
    console.log(`   ❌ Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.stats.errors.forEach(error => {
        console.log(`   - ${error.file || error.team}: ${error.error}`);
      });
    }

    // Verify database updates
    await this.verifyDatabaseUpdates();
  }

  /**
   * Verify database updates
   */
  async verifyDatabaseUpdates() {
    try {
      console.log('\n🔍 Verifying database updates...');
      
      const [updatedTeams] = await this.sequelize.query(`
        SELECT 
          s.short_display,
          sp.sport_name,
          t.compass_rating,
          t.last_updated_summer_2025,
          t.head_coach
        FROM teams t
        JOIN schools s ON t.school_id = s.school_id
        JOIN sports sp ON t.sport_id = sp.sport_id
        WHERE t.last_updated_summer_2025 = true
        AND t.compass_rating IS NOT NULL
        ORDER BY t.compass_rating DESC
        LIMIT 10
      `);

      console.log('🧭 Top 10 COMPASS ratings updated:');
      updatedTeams.forEach(team => {
        console.log(`   - ${team.short_display} ${team.sport_name}: ${team.compass_rating} (Coach: ${team.head_coach || 'N/A'})`);
      });

    } catch (error) {
      console.error('❌ Error verifying updates:', error.message);
    }
  }
}

module.exports = MarkdownCompassParser;