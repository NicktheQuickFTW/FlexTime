/**
 * Research to COMPASS Integration Service
 * 
 * This service processes research outputs from Perplexity/Gemini agents and integrates them
 * into the COMPASS system, storing results in both local directories and the Neon database.
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ResearchCompassIntegration {
  constructor(sequelize) {
    this.sequelize = sequelize;
    // Use existing HELiiX database structure
    this.sequelize = sequelize;
    
    // Define paths
    this.inputDir = path.join(__dirname, '../../data/research_results');
    this.outputDir = path.join(__dirname, '../../data/compass_processed');
    this.docsDir = path.join(__dirname, '../../frontend/docs');
    
    // Processing stats
    this.stats = {
      filesProcessed: 0,
      teamsUpdated: 0,
      ratingsCreated: 0,
      errors: []
    };
  }

  async initialize() {
    // Ensure output directories exist
    await this.ensureDirectories();
    
    console.log('🧭 Research-COMPASS Integration Service initialized');
    console.log(`📁 Input Directory: ${this.inputDir}`);
    console.log(`📁 Output Directory: ${this.outputDir}`);
    console.log(`📁 Docs Directory: ${this.docsDir}`);
  }

  async ensureDirectories() {
    const dirs = [this.outputDir, path.join(this.outputDir, 'processed'), path.join(this.outputDir, 'failed')];
    
    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  /**
   * Main integration process - monitors and processes research files
   */
  async processAllResearchFiles() {
    console.log('🔄 Starting comprehensive research file processing...');
    
    try {
      // Get all research files
      const files = await fs.readdir(this.inputDir);
      const researchFiles = files.filter(file => 
        file.endsWith('.json') && 
        (file.includes('research') || file.includes('analysis'))
      );

      console.log(`📊 Found ${researchFiles.length} research files to process`);

      for (const file of researchFiles) {
        try {
          await this.processResearchFile(file);
        } catch (error) {
          console.error(`❌ Failed to process ${file}:`, error.message);
          this.stats.errors.push({ file, error: error.message });
        }
      }

      // Generate summary report
      await this.generateProcessingSummary();
      
      console.log('✅ Research file processing completed');
      
    } catch (error) {
      console.error('💥 Error in processAllResearchFiles:', error);
      throw error;
    }
  }

  /**
   * Process individual research file and extract COMPASS data
   */
  async processResearchFile(filename) {
    const startTime = Date.now();
    console.log(`🔄 Processing research file: ${filename}`);
    
    const filePath = path.join(this.inputDir, filename);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const researchData = JSON.parse(fileContent);

    // Determine sport from filename or content
    const sport = this.extractSportFromFile(filename, researchData);
    console.log(`🏈 Detected sport: ${sport}`);

    // Extract team data and COMPASS ratings
    const extractedData = await this.extractCOMPASSData(researchData, sport);
    
    // Process each team
    for (const teamData of extractedData.teams) {
      await this.processTeamData(teamData, sport);
    }

    // Save processed file
    await this.saveProcessedFile(filename, extractedData);
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Processed ${filename} in ${duration.toFixed(1)}s (${extractedData.teams.length} teams)`);
    
    this.stats.filesProcessed++;
  }

  /**
   * Extract sport from filename or content
   */
  extractSportFromFile(filename, data) {
    // Check filename first
    const filenameChecks = {
      'basketball': ['basketball', 'hoops'],
      'football': ['football'],
      'softball': ['softball'],
      'baseball': ['baseball'],
      'volleyball': ['volleyball'],
      'soccer': ['soccer'],
      'tennis': ['tennis'],
      'wrestling': ['wrestling'],
      'gymnastics': ['gymnastics'],
      'lacrosse': ['lacrosse']
    };

    for (const [sport, keywords] of Object.entries(filenameChecks)) {
      if (keywords.some(keyword => filename.toLowerCase().includes(keyword))) {
        return sport;
      }
    }

    // Check content metadata
    if (data.metadata && data.metadata.sport) {
      return data.metadata.sport;
    }

    // Default fallback
    return 'basketball';
  }

  /**
   * Extract COMPASS-compatible data from research results
   */
  async extractCOMPASSData(researchData, sport) {
    const teams = [];
    
    // Handle different research data structures
    if (researchData.research) {
      // Standard research structure
      for (const [teamName, teamResearch] of Object.entries(researchData.research)) {
        const compassData = await this.extractTeamCOMPASSRating(teamName, teamResearch, sport);
        if (compassData) {
          teams.push(compassData);
        }
      }
    }

    // Check for trends data with COMPASS ratings
    if (researchData.trends) {
      for (const [teamName, trendsData] of Object.entries(researchData.trends)) {
        const compassData = await this.extractTeamCOMPASSFromTrends(teamName, trendsData, sport);
        if (compassData) {
          teams.push(compassData);
        }
      }
    }

    return {
      sport,
      processedAt: new Date().toISOString(),
      teams,
      metadata: researchData.metadata || {}
    };
  }

  /**
   * Extract COMPASS rating from team research data
   */
  async extractTeamCOMPASSRating(teamName, teamResearch, sport) {
    try {
      // Find team in database using school name and sport
      const team = await this.findTeam(teamName, sport);
      
      let compassRating = null;
      let ratingComponents = {};
      let confidence = 0.7;

      // Parse COMPASS rating from research content
      if (teamResearch.history && teamResearch.history.content) {
        compassRating = this.parseCompassRatingFromText(teamResearch.history.content);
        ratingComponents = this.extractRatingComponentsFromText(teamResearch.history.content);
      }

      if (teamResearch.projections && teamResearch.projections.content) {
        const projectionRating = this.parseCompassRatingFromText(teamResearch.projections.content);
        if (projectionRating && !compassRating) {
          compassRating = projectionRating;
        }
        // Merge projection components
        const projectionComponents = this.extractRatingComponentsFromText(teamResearch.projections.content);
        ratingComponents = { ...ratingComponents, ...projectionComponents };
      }

      return {
        teamId: team.team_id,
        schoolId: team.school_id,
        sportId: team.sport_id,
        teamName: team.school_name,
        sport,
        compassRating: compassRating || this.estimateCompassRating(teamResearch, sport),
        ratingComponents,
        confidence,
        sourceData: {
          hasHistory: !!teamResearch.history,
          hasProjections: !!teamResearch.projections,
          citations: this.extractCitations(teamResearch)
        }
      };

    } catch (error) {
      console.error(`❌ Error extracting COMPASS data for ${teamName}:`, error.message);
      return null;
    }
  }

  /**
   * Extract COMPASS rating from trends/analysis data
   */
  async extractTeamCOMPASSFromTrends(teamName, trendsData, sport) {
    try {
      const team = await this.findOrCreateTeam(teamName);
      
      let compassRating = null;
      let ratingComponents = {};

      // Parse COMPASS rating from trends content
      if (trendsData.content) {
        compassRating = this.parseCompassRatingFromText(trendsData.content);
        ratingComponents = this.extractRatingComponentsFromText(trendsData.content);
      }

      return {
        teamId: team.team_id,
        teamName: teamName,
        sport,
        compassRating: compassRating || 50.0, // Default if not found
        ratingComponents,
        confidence: 0.8,
        sourceData: {
          analysisType: trendsData.ratingType || 'trends_analysis',
          model: trendsData.model || 'unknown',
          timestamp: trendsData.timestamp
        }
      };

    } catch (error) {
      console.error(`❌ Error extracting COMPASS data from trends for ${teamName}:`, error.message);
      return null;
    }
  }

  /**
   * Parse COMPASS rating from text content using regex patterns
   */
  parseCompassRatingFromText(text) {
    // Common COMPASS rating patterns
    const patterns = [
      /COMPASS\s+Rating[:\s]+(\d+\.?\d*)/i,
      /COMPASS[:\s]+(\d+\.?\d*)/i,
      /Overall\s+COMPASS[:\s]+(\d+\.?\d*)/i,
      /Rating[:\s]+(\d+\.?\d*)\/100/i,
      /(\d+\.?\d*)\s*\/\s*100/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const rating = parseFloat(match[1]);
        if (rating >= 0 && rating <= 100) {
          return rating;
        }
      }
    }

    return null;
  }

  /**
   * Extract rating components from text
   */
  extractRatingComponentsFromText(text) {
    const components = {};
    
    // Component patterns
    const componentPatterns = {
      competitive: /Competitive\s+Performance.*?(\d+\.?\d*)[%\/]/i,
      operational: /Operational\s+Excellence.*?(\d+\.?\d*)[%\/]/i,
      market: /Market\s+Position.*?(\d+\.?\d*)[%\/]/i,
      trajectory: /Performance\s+Trajectory.*?(\d+\.?\d*)[%\/]/i,
      analytics: /Analytics.*?(\d+\.?\d*)[%\/]/i
    };

    for (const [component, pattern] of Object.entries(componentPatterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        components[component] = parseFloat(match[1]);
      }
    }

    return components;
  }

  /**
   * Extract rating components from research data structure
   */
  extractRatingComponents(teamResearch) {
    const components = {};
    
    // Check for structured data
    if (teamResearch.components) {
      return teamResearch.components;
    }

    // Parse from text content
    const allText = [
      teamResearch.history?.content || '',
      teamResearch.projections?.content || ''
    ].join(' ');

    return this.extractRatingComponentsFromText(allText);
  }

  /**
   * Estimate COMPASS rating based on available data
   */
  estimateCompassRating(teamResearch, sport) {
    // Fallback estimation based on content quality and citations
    let baseRating = 50.0;
    
    // Boost for quality indicators
    const content = (teamResearch.history?.content || '') + (teamResearch.projections?.content || '');
    
    if (content.includes('championship')) baseRating += 10;
    if (content.includes('tournament')) baseRating += 5;
    if (content.includes('elite') || content.includes('top')) baseRating += 5;
    if (content.includes('coaching')) baseRating += 3;
    
    // Citation boost
    const citations = this.extractCitations(teamResearch);
    baseRating += Math.min(citations.length * 2, 10);

    return Math.min(baseRating, 95.0);
  }

  /**
   * Extract citations from research data
   */
  extractCitations(teamResearch) {
    const citations = [];
    
    if (teamResearch.history?.citations) {
      citations.push(...teamResearch.history.citations);
    }
    
    if (teamResearch.projections?.citations) {
      citations.push(...teamResearch.projections.citations);
    }
    
    return citations;
  }

  /**
   * Find team in database using school name and sport
   */
  async findTeam(schoolName, sport) {
    try {
      // Map sport names to sport_ids
      const sportMap = {
        'basketball': { mens: 2, womens: 3 },
        'football': 8,
        'softball': 15,
        'baseball': 1,
        'volleyball': 24,
        'soccer': 14,
        'tennis': { mens: 18, womens: 19 },
        'wrestling': 25,
        'gymnastics': 11,
        'lacrosse': 12
      };

      // Get sport_id
      let sportId;
      if (typeof sportMap[sport] === 'object') {
        // Default to men's for gendered sports if not specified
        sportId = sportMap[sport].mens;
      } else {
        sportId = sportMap[sport];
      }

      if (!sportId) {
        throw new Error(`Unknown sport: ${sport}`);
      }

      // Find school by name (checking both school and short_display)
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
        throw new Error(`Team not found: ${schoolName} ${sport} (school_id: ${school.school_id}, sport_id: ${sportId})`);
      }

      return {
        team_id: teams[0].team_id,
        school_id: teams[0].school_id,
        sport_id: teams[0].sport_id,
        school_name: school.short_display,
        sport_name: sport
      };
    } catch (error) {
      console.error(`❌ Error finding team ${schoolName} ${sport}:`, error.message);
      throw error;
    }
  }

  /**
   * Process and store team data in COMPASS system
   */
  async processTeamData(teamData, sport) {
    try {
      // Store COMPASS rating
      await this.storeCompassRating(teamData);
      
      // Store any roster changes mentioned in research
      await this.storeRosterChanges(teamData);
      
      this.stats.teamsUpdated++;
      this.stats.ratingsCreated++;
      
      console.log(`✅ Processed COMPASS data for ${teamData.teamName}: ${teamData.compassRating.toFixed(1)}`);
      
    } catch (error) {
      console.error(`❌ Error processing team data for ${teamData.teamName}:`, error.message);
      this.stats.errors.push({ 
        team: teamData.teamName, 
        error: error.message 
      });
    }
  }

  /**
   * Store COMPASS rating in database
   */
  async storeCompassRating(teamData) {
    try {
      // Check if rating already exists
      const existingRating = await this.models.TeamRating.findOne({
        where: {
          team_id: teamData.teamId,
          sport: teamData.sport
        }
      });

      const ratingData = {
        team_id: teamData.teamId,
        sport: teamData.sport,
        normalized_rating: teamData.compassRating / 100, // Normalize to 0-1
        raw_rating: teamData.compassRating,
        percentile: this.calculatePercentile(teamData.compassRating),
        tier: this.calculateTier(teamData.compassRating),
        rating_components: teamData.ratingComponents,
        prediction_confidence: teamData.confidence,
        last_updated: new Date()
      };

      if (existingRating) {
        // Update existing rating
        await existingRating.update(ratingData);
        console.log(`🔄 Updated COMPASS rating for ${teamData.teamName}`);
      } else {
        // Create new rating
        await this.models.TeamRating.create({
          rating_id: uuidv4(),
          ...ratingData
        });
        console.log(`✨ Created new COMPASS rating for ${teamData.teamName}`);
      }

    } catch (error) {
      console.error(`❌ Error storing COMPASS rating for ${teamData.teamName}:`, error.message);
      throw error;
    }
  }

  /**
   * Calculate percentile based on rating
   */
  calculatePercentile(rating) {
    // Simple percentile calculation
    if (rating >= 90) return 95;
    if (rating >= 80) return 85;
    if (rating >= 70) return 75;
    if (rating >= 60) return 65;
    if (rating >= 50) return 50;
    return 25;
  }

  /**
   * Calculate tier based on rating
   */
  calculateTier(rating) {
    if (rating >= 90) return 'Elite';
    if (rating >= 80) return 'Strong';
    if (rating >= 70) return 'Solid';
    if (rating >= 60) return 'Average';
    if (rating >= 50) return 'Developing';
    return 'Rebuilding';
  }

  /**
   * Store roster changes mentioned in research
   */
  async storeRosterChanges(teamData) {
    // This would parse research content for roster changes
    // For now, we'll skip this but leave the framework
    console.log(`📝 Roster change processing for ${teamData.teamName} (placeholder)`);
  }

  /**
   * Save processed file to output directory
   */
  async saveProcessedFile(originalFilename, processedData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const processedFilename = `processed_${originalFilename.replace('.json', '')}_${timestamp}.json`;
    const outputPath = path.join(this.outputDir, 'processed', processedFilename);
    
    await fs.writeFile(outputPath, JSON.stringify(processedData, null, 2));
    console.log(`💾 Saved processed file: ${processedFilename}`);
  }

  /**
   * Generate processing summary report
   */
  async generateProcessingSummary() {
    const summary = {
      processedAt: new Date().toISOString(),
      stats: this.stats,
      totalFiles: this.stats.filesProcessed,
      totalTeams: this.stats.teamsUpdated,
      totalRatings: this.stats.ratingsCreated,
      errorCount: this.stats.errors.length,
      errors: this.stats.errors
    };

    const summaryPath = path.join(this.outputDir, 'processing_summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n📊 PROCESSING SUMMARY:');
    console.log(`   📁 Files Processed: ${summary.totalFiles}`);
    console.log(`   👥 Teams Updated: ${summary.totalTeams}`);
    console.log(`   🧭 Ratings Created: ${summary.totalRatings}`);
    console.log(`   ❌ Errors: ${summary.errorCount}`);
    
    if (summary.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      summary.errors.forEach(error => {
        console.log(`   - ${error.file || error.team}: ${error.error}`);
      });
    }
  }

  /**
   * Watch directory for new research files
   */
  async startFileWatcher() {
    console.log('👀 Starting research file watcher...');
    
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(this.inputDir, {
      ignored: /^\./, 
      persistent: true
    });

    watcher.on('add', async (filePath) => {
      const filename = path.basename(filePath);
      if (filename.endsWith('.json') && (filename.includes('research') || filename.includes('analysis'))) {
        console.log(`📥 New research file detected: ${filename}`);
        try {
          await this.processResearchFile(filename);
        } catch (error) {
          console.error(`❌ Error processing new file ${filename}:`, error.message);
        }
      }
    });

    console.log(`👀 Watching: ${this.inputDir}`);
  }
}

module.exports = ResearchCompassIntegration;