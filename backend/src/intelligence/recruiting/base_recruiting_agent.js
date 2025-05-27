/**
 * Base Recruiting Agent
 * 
 * This agent provides core functionality for tracking and analyzing recruiting prospects
 * for collegiate athletics programs. It manages prospect data, evaluations, and interactions.
 */

const Agent = require('../agent');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const AIAdapter = require('../../adapters/ai-adapter');

class BaseRecruitingAgent extends Agent {
  /**
   * Create a new recruiting agent
   * 
   * @param {string} sportCode - Sport code (e.g., 'MBB', 'FBB')
   * @param {string} sportName - Full sport name (e.g., 'Men\'s Basketball')
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(sportCode, sportName, config, mcpConnector) {
    super(`${sportCode.toLowerCase()}_recruiting`, 'specialized', mcpConnector);
    
    this.sportCode = sportCode;
    this.sportName = sportName;
    this.config = config || {};
    
    // Configure data storage
    this.dataDirectory = this.config.dataDirectory || 
      path.join(__dirname, `../../data/recruiting/${sportCode.toLowerCase()}`);
    
    // Initialize AI adapter for analysis
    this.ai = new AIAdapter();
    
    // Initialize recruiting data
    this.recruitingData = {
      prospects: [],
      interactions: {},
      evaluations: {},
      rankings: {},
      commitments: [],
      lastUpdated: null
    };
    
    // Define prospect status types
    this.prospectStatuses = {
      TARGET: 'target',           // Actively targeting for recruitment
      CONTACTED: 'contacted',     // Initial contact made
      INTERESTED: 'interested',   // Prospect has shown interest
      OFFERED: 'offered',         // Scholarship offered
      COMMITTED: 'committed',     // Verbally committed
      SIGNED: 'signed',           // Signed letter of intent
      ENROLLED: 'enrolled',       // Enrolled in school
      DECLINED: 'declined',       // Declined offer/no longer interested
      TRANSFERRED: 'transferred', // Transferred to a different school
      DECOMMITTED: 'decommitted'  // Decommitted from verbal commitment
    };
    
    // Define interaction types
    this.interactionTypes = {
      INITIAL_CONTACT: 'initial_contact',
      CALL: 'call',
      TEXT: 'text',
      EMAIL: 'email',
      SOCIAL_MEDIA: 'social_media',
      CAMPUS_VISIT: 'campus_visit',
      HOME_VISIT: 'home_visit',
      GAME_ATTENDANCE: 'game_attendance',
      CAMP: 'camp',
      FILM_REVIEW: 'film_review',
      MEETING: 'meeting',
      OTHER: 'other'
    };
    
    // Define evaluation categories
    this.evaluationCategories = {
      ATHLETIC: 'athletic',         // Athletic abilities
      TECHNICAL: 'technical',       // Sport-specific technical skills
      TACTICAL: 'tactical',         // Game intelligence/awareness
      PHYSICAL: 'physical',         // Physical attributes
      CHARACTER: 'character',       // Character/personality
      ACADEMIC: 'academic',         // Academic performance
      LEADERSHIP: 'leadership',     // Leadership qualities
      POTENTIAL: 'potential',       // Long-term potential
      COMPATIBILITY: 'compatibility' // Fit with program
    };
    
    // Initialize recruiting calendar
    this.recruitingCalendar = {
      contactPeriods: config?.calendar?.contactPeriods || [],
      evaluationPeriods: config?.calendar?.evaluationPeriods || [],
      quietPeriods: config?.calendar?.quietPeriods || [],
      deadPeriods: config?.calendar?.deadPeriods || []
    };
    
    // Compliance tracking
    this.complianceTracking = {
      contacts: {},
      evaluations: {},
      violations: [],
      notes: []
    };
    
    logger.info(`${sportName} Recruiting Agent (${sportCode}) initialized`);
  }
  
  /**
   * Initialize the agent
   * 
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize() {
    try {
      logger.info(`Initializing ${this.sportName} Recruiting Agent`);
      
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDirectory, { recursive: true });
      
      // Load existing recruiting data if available
      await this._loadRecruitingData();
      
      // Start the agent
      await super.start();
      
      logger.info(`${this.sportName} Recruiting Agent initialized successfully`);
      return true;
    } catch (error) {
      logger.error(`Error initializing ${this.sportName} Recruiting Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Load existing recruiting data
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _loadRecruitingData() {
    try {
      const recruitingDataPath = path.join(this.dataDirectory, 'recruiting_data.json');
      
      try {
        const data = await fs.readFile(recruitingDataPath, 'utf8');
        this.recruitingData = JSON.parse(data);
        logger.info(`Loaded ${this.recruitingData.prospects.length} recruiting prospects for ${this.sportName}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          logger.info(`No existing recruiting data found for ${this.sportName}, creating new dataset`);
          this._initializeEmptyRecruitingData();
          await this._saveRecruitingData();
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error(`Error loading recruiting data: ${error.message}`);
      this._initializeEmptyRecruitingData();
    }
  }
  
  /**
   * Initialize empty recruiting data structure
   * 
   * @private
   */
  _initializeEmptyRecruitingData() {
    this.recruitingData = {
      prospects: [],
      interactions: {},
      evaluations: {},
      rankings: {
        overall: [],
        byPosition: {},
        byMetric: {}
      },
      commitments: [],
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Save recruiting data to disk
   * 
   * @returns {Promise<void>}
   * @private
   */
  async _saveRecruitingData() {
    try {
      const recruitingDataPath = path.join(this.dataDirectory, 'recruiting_data.json');
      
      // Update last modified timestamp
      this.recruitingData.lastUpdated = new Date().toISOString();
      
      // Save to disk
      await fs.writeFile(
        recruitingDataPath,
        JSON.stringify(this.recruitingData, null, 2),
        'utf8'
      );
      
      logger.info(`Saved ${this.recruitingData.prospects.length} recruiting prospects for ${this.sportName}`);
    } catch (error) {
      logger.error(`Error saving recruiting data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Add a new prospect to the recruiting database
   * 
   * @param {Object} prospectData - Prospect data
   * @returns {Promise<Object>} Added prospect
   */
  async addProspect(prospectData) {
    try {
      // Validate required fields
      if (!prospectData.name || !prospectData.position) {
        throw new Error('Prospect name and position are required');
      }
      
      // Generate prospect ID if not provided
      const prospectId = prospectData.id || this._generateProspectId(prospectData.name);
      
      // Check if prospect already exists
      const existingIndex = this.recruitingData.prospects.findIndex(p => 
        p.id === prospectId || p.name === prospectData.name
      );
      
      if (existingIndex >= 0) {
        logger.info(`Prospect ${prospectData.name} already exists, updating`);
        
        // Update existing prospect
        const updatedProspect = {
          ...this.recruitingData.prospects[existingIndex],
          ...prospectData,
          id: prospectId,
          status: prospectData.status || this.recruitingData.prospects[existingIndex].status,
          lastUpdated: new Date().toISOString()
        };
        
        this.recruitingData.prospects[existingIndex] = updatedProspect;
        
        // Save changes
        await this._saveRecruitingData();
        
        return updatedProspect;
      } else {
        // Create new prospect entry
        const newProspect = {
          id: prospectId,
          name: prospectData.name,
          position: prospectData.position,
          hometown: prospectData.hometown || '',
          highSchool: prospectData.highSchool || '',
          graduationYear: prospectData.graduationYear || '',
          height: prospectData.height || '',
          weight: prospectData.weight || '',
          stars: prospectData.stars || 0,
          ranking: prospectData.ranking || null,
          status: prospectData.status || this.prospectStatuses.TARGET,
          metrics: prospectData.metrics || {},
          contact: prospectData.contact || {},
          notes: prospectData.notes || '',
          highlights: prospectData.highlights || [],
          academicInfo: prospectData.academicInfo || {},
          offers: prospectData.offers || [],
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        // Add to prospects array
        this.recruitingData.prospects.push(newProspect);
        
        // Initialize interactions and evaluations
        this.recruitingData.interactions[prospectId] = [];
        this.recruitingData.evaluations[prospectId] = {};
        
        // Save changes
        await this._saveRecruitingData();
        
        logger.info(`Added prospect ${newProspect.name} to ${this.sportName} recruiting database`);
        
        return newProspect;
      }
    } catch (error) {
      logger.error(`Error adding prospect: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a prospect's information
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated prospect
   */
  async updateProspect(prospectId, updateData) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      const prospect = { ...this.recruitingData.prospects[prospectIndex] };
      
      // Update prospect data
      Object.assign(prospect, updateData, {
        lastUpdated: new Date().toISOString()
      });
      
      // Update prospect in array
      this.recruitingData.prospects[prospectIndex] = prospect;
      
      // Save changes
      await this._saveRecruitingData();
      
      logger.info(`Updated prospect ${prospect.name} in ${this.sportName} recruiting database`);
      
      return prospect;
    } catch (error) {
      logger.error(`Error updating prospect: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Log an interaction with a prospect
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} interactionData - Interaction data
   * @returns {Promise<Object>} Logged interaction
   */
  async logInteraction(prospectId, interactionData) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Validate required fields
      if (!interactionData.type || !interactionData.date) {
        throw new Error('Interaction type and date are required');
      }
      
      // Validate interaction type
      if (!Object.values(this.interactionTypes).includes(interactionData.type)) {
        throw new Error(`Invalid interaction type: ${interactionData.type}`);
      }
      
      // Create new interaction
      const interaction = {
        id: `${prospectId}_${Date.now().toString(36)}`,
        type: interactionData.type,
        date: interactionData.date,
        staff: interactionData.staff || '',
        notes: interactionData.notes || '',
        location: interactionData.location || '',
        followUp: interactionData.followUp || null,
        outcome: interactionData.outcome || '',
        created: new Date().toISOString(),
        compliance: interactionData.compliance || { isCompliant: true, notes: '' }
      };
      
      // Initialize interactions array if it doesn't exist
      if (!this.recruitingData.interactions[prospectId]) {
        this.recruitingData.interactions[prospectId] = [];
      }
      
      // Add interaction to array
      this.recruitingData.interactions[prospectId].push(interaction);
      
      // Update prospect's last updated timestamp
      this.recruitingData.prospects[prospectIndex].lastUpdated = new Date().toISOString();
      
      // Update compliance tracking
      this._updateComplianceTracking(prospectId, interaction);
      
      // Save changes
      await this._saveRecruitingData();
      
      logger.info(`Logged ${interaction.type} interaction with prospect ${this.recruitingData.prospects[prospectIndex].name}`);
      
      return interaction;
    } catch (error) {
      logger.error(`Error logging interaction: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Record an evaluation of a prospect
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} evaluationData - Evaluation data
   * @returns {Promise<Object>} Recorded evaluation
   */
  async recordEvaluation(prospectId, evaluationData) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Validate required fields
      if (!evaluationData.category || evaluationData.rating === undefined) {
        throw new Error('Evaluation category and rating are required');
      }
      
      // Validate evaluation category
      if (!Object.values(this.evaluationCategories).includes(evaluationData.category)) {
        throw new Error(`Invalid evaluation category: ${evaluationData.category}`);
      }
      
      // Create new evaluation
      const evaluation = {
        category: evaluationData.category,
        rating: evaluationData.rating, // 1-10 rating scale
        notes: evaluationData.notes || '',
        evaluator: evaluationData.evaluator || '',
        date: evaluationData.date || new Date().toISOString(),
        context: evaluationData.context || '',
        created: new Date().toISOString()
      };
      
      // Initialize evaluations object if it doesn't exist
      if (!this.recruitingData.evaluations[prospectId]) {
        this.recruitingData.evaluations[prospectId] = {};
      }
      
      // Initialize category array if it doesn't exist
      if (!this.recruitingData.evaluations[prospectId][evaluation.category]) {
        this.recruitingData.evaluations[prospectId][evaluation.category] = [];
      }
      
      // Add evaluation to array
      this.recruitingData.evaluations[prospectId][evaluation.category].push(evaluation);
      
      // Update prospect's last updated timestamp
      this.recruitingData.prospects[prospectIndex].lastUpdated = new Date().toISOString();
      
      // Update overall prospect rating
      await this._updateProspectRating(prospectId);
      
      // Save changes
      await this._saveRecruitingData();
      
      logger.info(`Recorded ${evaluation.category} evaluation for prospect ${this.recruitingData.prospects[prospectIndex].name}`);
      
      return evaluation;
    } catch (error) {
      logger.error(`Error recording evaluation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Search for prospects matching specific criteria
   * 
   * @param {Object} filters - Search filters
   * @returns {Promise<Array<Object>>} Matching prospects
   */
  async searchProspects(filters = {}) {
    try {
      let results = [...this.recruitingData.prospects];
      
      // Apply filters
      if (filters.name) {
        const namePattern = new RegExp(filters.name, 'i');
        results = results.filter(prospect => namePattern.test(prospect.name));
      }
      
      if (filters.position) {
        const positionPattern = new RegExp(filters.position, 'i');
        results = results.filter(prospect => positionPattern.test(prospect.position));
      }
      
      if (filters.status) {
        results = results.filter(prospect => prospect.status === filters.status);
      }
      
      if (filters.graduationYear) {
        results = results.filter(prospect => prospect.graduationYear === filters.graduationYear);
      }
      
      if (filters.minStars) {
        results = results.filter(prospect => prospect.stars >= filters.minStars);
      }
      
      if (filters.highSchool) {
        const schoolPattern = new RegExp(filters.highSchool, 'i');
        results = results.filter(prospect => schoolPattern.test(prospect.highSchool));
      }
      
      if (filters.hometown) {
        const hometownPattern = new RegExp(filters.hometown, 'i');
        results = results.filter(prospect => hometownPattern.test(prospect.hometown));
      }
      
      // Sort results if specified
      if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortDirection = filters.sortDirection === 'desc' ? -1 : 1;
        
        results.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortDirection;
          if (a[sortField] > b[sortField]) return 1 * sortDirection;
          return 0;
        });
      }
      
      // Apply pagination if specified
      if (filters.limit) {
        const limit = parseInt(filters.limit);
        const offset = filters.offset ? parseInt(filters.offset) : 0;
        results = results.slice(offset, offset + limit);
      }
      
      return results;
    } catch (error) {
      logger.error(`Error searching prospects: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a prospect's interactions
   * 
   * @param {string} prospectId - Prospect ID
   * @returns {Promise<Array<Object>>} Interactions
   */
  async getProspectInteractions(prospectId) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Get interactions
      const interactions = this.recruitingData.interactions[prospectId] || [];
      
      // Sort by date (newest first)
      return [...interactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      logger.error(`Error getting prospect interactions: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get a prospect's evaluations
   * 
   * @param {string} prospectId - Prospect ID
   * @returns {Promise<Object>} Evaluations
   */
  async getProspectEvaluations(prospectId) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Get evaluations
      const evaluations = this.recruitingData.evaluations[prospectId] || {};
      
      // Calculate average ratings
      const averageRatings = {};
      let overallRating = 0;
      let totalCategories = 0;
      
      Object.entries(evaluations).forEach(([category, categoryEvals]) => {
        if (categoryEvals.length > 0) {
          const sum = categoryEvals.reduce((acc, eval) => acc + eval.rating, 0);
          const avg = sum / categoryEvals.length;
          averageRatings[category] = Number(avg.toFixed(1));
          overallRating += avg;
          totalCategories++;
        }
      });
      
      if (totalCategories > 0) {
        averageRatings.overall = Number((overallRating / totalCategories).toFixed(1));
      } else {
        averageRatings.overall = 0;
      }
      
      return {
        detail: evaluations,
        averageRatings
      };
    } catch (error) {
      logger.error(`Error getting prospect evaluations: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a report of recruiting activity
   * 
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Recruiting report
   */
  async generateReport(options = {}) {
    try {
      const reportType = options.type || 'overview';
      const period = options.period || 'all';
      const format = options.format || 'json';
      
      let reportData;
      
      // Generate different reports based on type
      switch (reportType) {
        case 'overview':
          reportData = await this._generateOverviewReport(period);
          break;
          
        case 'prospects':
          reportData = await this._generateProspectsReport(options.status, period);
          break;
          
        case 'interactions':
          reportData = await this._generateInteractionsReport(period);
          break;
          
        case 'evaluations':
          reportData = await this._generateEvaluationsReport(period);
          break;
          
        case 'compliance':
          reportData = await this._generateComplianceReport(period);
          break;
          
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
      
      // Format the report
      let formattedReport;
      
      switch (format) {
        case 'json':
          formattedReport = reportData;
          break;
          
        case 'text':
          formattedReport = await this._formatReportAsText(reportData, reportType);
          break;
          
        case 'markdown':
          formattedReport = await this._formatReportAsMarkdown(reportData, reportType);
          break;
          
        default:
          formattedReport = reportData;
      }
      
      return {
        type: reportType,
        format: format,
        timestamp: new Date().toISOString(),
        data: formattedReport
      };
    } catch (error) {
      logger.error(`Error generating recruiting report: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Record a commitment from a prospect
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} commitmentData - Commitment data
   * @returns {Promise<Object>} Recorded commitment
   */
  async recordCommitment(prospectId, commitmentData) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Validate required fields
      if (!commitmentData.date) {
        throw new Error('Commitment date is required');
      }
      
      // Create commitment record
      const commitment = {
        id: `${prospectId}_${Date.now().toString(36)}`,
        prospectId,
        date: commitmentData.date,
        type: commitmentData.type || 'verbal', // verbal, signed, enrolled
        notes: commitmentData.notes || '',
        public: commitmentData.public !== undefined ? commitmentData.public : true,
        announcements: commitmentData.announcements || [],
        created: new Date().toISOString()
      };
      
      // Add to commitments array
      this.recruitingData.commitments.push(commitment);
      
      // Update prospect status
      let newStatus;
      if (commitment.type === 'verbal') {
        newStatus = this.prospectStatuses.COMMITTED;
      } else if (commitment.type === 'signed') {
        newStatus = this.prospectStatuses.SIGNED;
      } else if (commitment.type === 'enrolled') {
        newStatus = this.prospectStatuses.ENROLLED;
      }
      
      if (newStatus) {
        this.recruitingData.prospects[prospectIndex].status = newStatus;
      }
      
      // Update prospect's last updated timestamp
      this.recruitingData.prospects[prospectIndex].lastUpdated = new Date().toISOString();
      
      // Save changes
      await this._saveRecruitingData();
      
      logger.info(`Recorded ${commitment.type} commitment for prospect ${this.recruitingData.prospects[prospectIndex].name}`);
      
      return commitment;
    } catch (error) {
      logger.error(`Error recording commitment: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check if an interaction is compliant with NCAA rules
   * 
   * @param {Object} interactionData - Interaction data
   * @returns {Promise<Object>} Compliance check result
   */
  async checkComplianceForInteraction(interactionData) {
    try {
      // This is a simplified compliance check
      // Real implementation would include complex NCAA rule checking
      
      const interactionDate = new Date(interactionData.date);
      const interactionType = interactionData.type;
      
      // Check if in dead period
      const inDeadPeriod = this.recruitingCalendar.deadPeriods.some(period => {
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);
        return interactionDate >= startDate && interactionDate <= endDate;
      });
      
      if (inDeadPeriod) {
        // In dead period, only certain types of contact are allowed
        if (['call', 'text', 'email'].includes(interactionType)) {
          return {
            isCompliant: true,
            status: 'compliant',
            message: 'Permitted communication during dead period'
          };
        } else {
          return {
            isCompliant: false,
            status: 'violation',
            message: 'In-person contact is not permitted during dead period',
            rule: 'NCAA dead period restrictions'
          };
        }
      }
      
      // Check if in quiet period
      const inQuietPeriod = this.recruitingCalendar.quietPeriods.some(period => {
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);
        return interactionDate >= startDate && interactionDate <= endDate;
      });
      
      if (inQuietPeriod) {
        // In quiet period, only on-campus contact is allowed
        if (['campus_visit', 'call', 'text', 'email', 'social_media'].includes(interactionType)) {
          return {
            isCompliant: true,
            status: 'compliant',
            message: 'Permitted activity during quiet period'
          };
        } else if (interactionType === 'home_visit') {
          return {
            isCompliant: false,
            status: 'violation',
            message: 'Home visits are not permitted during quiet period',
            rule: 'NCAA quiet period restrictions'
          };
        }
      }
      
      // For simplicity, assume all other interactions are compliant
      // A real implementation would have much more complex checking
      
      return {
        isCompliant: true,
        status: 'compliant',
        message: 'No compliance issues detected'
      };
    } catch (error) {
      logger.error(`Error checking compliance: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate an overview report
   * 
   * @param {string} period - Time period for the report
   * @returns {Promise<Object>} Overview report
   * @private
   */
  async _generateOverviewReport(period) {
    // Filter prospects based on period
    const prospects = this._filterProspectsByPeriod(period);
    
    // Calculate status counts
    const statusCounts = {};
    Object.values(this.prospectStatuses).forEach(status => {
      statusCounts[status] = prospects.filter(p => p.status === status).length;
    });
    
    // Calculate position breakdown
    const positionBreakdown = {};
    prospects.forEach(prospect => {
      const position = prospect.position;
      positionBreakdown[position] = (positionBreakdown[position] || 0) + 1;
    });
    
    // Calculate star rating breakdown
    const starBreakdown = {
      5: prospects.filter(p => p.stars === 5).length,
      4: prospects.filter(p => p.stars === 4).length,
      3: prospects.filter(p => p.stars === 3).length,
      2: prospects.filter(p => p.stars === 2).length,
      1: prospects.filter(p => p.stars === 1).length,
      0: prospects.filter(p => p.stars === 0).length
    };
    
    // Calculate average star rating
    const totalStars = prospects.reduce((sum, prospect) => sum + prospect.stars, 0);
    const averageStars = prospects.length > 0 ? (totalStars / prospects.length).toFixed(1) : 0;
    
    // Calculate graduation year breakdown
    const gradYearBreakdown = {};
    prospects.forEach(prospect => {
      const year = prospect.graduationYear || 'Unknown';
      gradYearBreakdown[year] = (gradYearBreakdown[year] || 0) + 1;
    });
    
    // Calculate recent activity
    const recentActivity = await this._getRecentActivity(period);
    
    // Calculate top prospects
    const topProspects = [...prospects]
      .sort((a, b) => (b.stars - a.stars) || (a.ranking || Infinity) - (b.ranking || Infinity))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        position: p.position,
        stars: p.stars,
        highSchool: p.highSchool,
        status: p.status
      }));
    
    // Compile report
    return {
      period,
      timestamp: new Date().toISOString(),
      totalProspects: prospects.length,
      statusCounts,
      positionBreakdown,
      starBreakdown,
      averageStars,
      gradYearBreakdown,
      topProspects,
      recentActivity
    };
  }
  
  /**
   * Generate a prospects report
   * 
   * @param {string} status - Prospect status to filter by
   * @param {string} period - Time period for the report
   * @returns {Promise<Object>} Prospects report
   * @private
   */
  async _generateProspectsReport(status, period) {
    // Filter prospects based on period
    let prospects = this._filterProspectsByPeriod(period);
    
    // Filter by status if provided
    if (status) {
      prospects = prospects.filter(p => p.status === status);
    }
    
    // Sort prospects by star rating and then ranking
    prospects.sort((a, b) => (b.stars - a.stars) || (a.ranking || Infinity) - (b.ranking || Infinity));
    
    // Transform to report format
    const prospectDetails = prospects.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position,
      stars: p.stars,
      ranking: p.ranking,
      highSchool: p.highSchool,
      hometown: p.hometown,
      graduationYear: p.graduationYear,
      status: p.status,
      height: p.height,
      weight: p.weight,
      lastUpdated: p.lastUpdated
    }));
    
    // Compile report
    return {
      period,
      status: status || 'all',
      timestamp: new Date().toISOString(),
      totalProspects: prospects.length,
      prospects: prospectDetails
    };
  }
  
  /**
   * Generate an interactions report
   * 
   * @param {string} period - Time period for the report
   * @returns {Promise<Object>} Interactions report
   * @private
   */
  async _generateInteractionsReport(period) {
    // Get all interactions in the period
    const interactions = [];
    
    Object.entries(this.recruitingData.interactions).forEach(([prospectId, prospectInteractions]) => {
      const filteredInteractions = prospectInteractions.filter(interaction => {
        return this._isDateInPeriod(new Date(interaction.date), period);
      });
      
      if (filteredInteractions.length > 0) {
        const prospect = this.recruitingData.prospects.find(p => p.id === prospectId);
        if (prospect) {
          filteredInteractions.forEach(interaction => {
            interactions.push({
              ...interaction,
              prospectName: prospect.name,
              prospectPosition: prospect.position,
              prospectStars: prospect.stars
            });
          });
        }
      }
    });
    
    // Sort interactions by date
    interactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate interaction type counts
    const typeCounts = {};
    Object.values(this.interactionTypes).forEach(type => {
      typeCounts[type] = interactions.filter(i => i.type === type).length;
    });
    
    // Calculate interaction by staff member
    const staffInteractions = {};
    interactions.forEach(interaction => {
      const staff = interaction.staff || 'Unknown';
      if (!staffInteractions[staff]) {
        staffInteractions[staff] = {
          total: 0,
          types: {}
        };
      }
      
      staffInteractions[staff].total++;
      
      if (!staffInteractions[staff].types[interaction.type]) {
        staffInteractions[staff].types[interaction.type] = 0;
      }
      
      staffInteractions[staff].types[interaction.type]++;
    });
    
    // Calculate interaction by prospect
    const prospectInteractions = {};
    interactions.forEach(interaction => {
      const name = interaction.prospectName;
      if (!prospectInteractions[name]) {
        prospectInteractions[name] = 0;
      }
      
      prospectInteractions[name]++;
    });
    
    // Compile report
    return {
      period,
      timestamp: new Date().toISOString(),
      totalInteractions: interactions.length,
      typeCounts,
      staffInteractions,
      prospectInteractions,
      recentInteractions: interactions.slice(0, 20)
    };
  }
  
  /**
   * Generate an evaluations report
   * 
   * @param {string} period - Time period for the report
   * @returns {Promise<Object>} Evaluations report
   * @private
   */
  async _generateEvaluationsReport(period) {
    // Get all evaluations in the period
    const evaluations = [];
    
    Object.entries(this.recruitingData.evaluations).forEach(([prospectId, categories]) => {
      Object.entries(categories).forEach(([category, categoryEvals]) => {
        const filteredEvaluations = categoryEvals.filter(evaluation => {
          return this._isDateInPeriod(new Date(evaluation.date), period);
        });
        
        if (filteredEvaluations.length > 0) {
          const prospect = this.recruitingData.prospects.find(p => p.id === prospectId);
          if (prospect) {
            filteredEvaluations.forEach(evaluation => {
              evaluations.push({
                ...evaluation,
                prospectId,
                prospectName: prospect.name,
                prospectPosition: prospect.position,
                prospectStars: prospect.stars
              });
            });
          }
        }
      });
    });
    
    // Calculate average ratings by category
    const categoryAverages = {};
    Object.values(this.evaluationCategories).forEach(category => {
      const categoryEvals = evaluations.filter(e => e.category === category);
      if (categoryEvals.length > 0) {
        const sum = categoryEvals.reduce((acc, eval) => acc + eval.rating, 0);
        categoryAverages[category] = Number((sum / categoryEvals.length).toFixed(1));
      } else {
        categoryAverages[category] = 0;
      }
    });
    
    // Calculate top rated prospects overall
    const prospectScores = {};
    evaluations.forEach(evaluation => {
      if (!prospectScores[evaluation.prospectId]) {
        prospectScores[evaluation.prospectId] = {
          id: evaluation.prospectId,
          name: evaluation.prospectName,
          position: evaluation.prospectPosition,
          stars: evaluation.prospectStars,
          evaluationCount: 0,
          totalScore: 0,
          average: 0
        };
      }
      
      prospectScores[evaluation.prospectId].evaluationCount++;
      prospectScores[evaluation.prospectId].totalScore += evaluation.rating;
    });
    
    // Calculate averages
    Object.values(prospectScores).forEach(score => {
      score.average = Number((score.totalScore / score.evaluationCount).toFixed(1));
    });
    
    // Sort by average score
    const topProspects = Object.values(prospectScores)
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);
    
    // Calculate evaluations by staff member
    const staffEvaluations = {};
    evaluations.forEach(evaluation => {
      const staff = evaluation.evaluator || 'Unknown';
      if (!staffEvaluations[staff]) {
        staffEvaluations[staff] = {
          total: 0,
          categories: {}
        };
      }
      
      staffEvaluations[staff].total++;
      
      if (!staffEvaluations[staff].categories[evaluation.category]) {
        staffEvaluations[staff].categories[evaluation.category] = 0;
      }
      
      staffEvaluations[staff].categories[evaluation.category]++;
    });
    
    // Compile report
    return {
      period,
      timestamp: new Date().toISOString(),
      totalEvaluations: evaluations.length,
      categoryAverages,
      topProspects,
      staffEvaluations,
      recentEvaluations: evaluations
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20)
    };
  }
  
  /**
   * Generate a compliance report
   * 
   * @param {string} period - Time period for the report
   * @returns {Promise<Object>} Compliance report
   * @private
   */
  async _generateComplianceReport(period) {
    // Get all interactions in the period
    const interactions = [];
    
    Object.entries(this.recruitingData.interactions).forEach(([prospectId, prospectInteractions]) => {
      const filteredInteractions = prospectInteractions.filter(interaction => {
        return this._isDateInPeriod(new Date(interaction.date), period);
      });
      
      if (filteredInteractions.length > 0) {
        const prospect = this.recruitingData.prospects.find(p => p.id === prospectId);
        if (prospect) {
          filteredInteractions.forEach(interaction => {
            interactions.push({
              ...interaction,
              prospectId,
              prospectName: prospect.name,
              prospectStatus: prospect.status
            });
          });
        }
      }
    });
    
    // Find non-compliant interactions
    const violations = interactions.filter(i => i.compliance && i.compliance.isCompliant === false);
    
    // Calculate violations by type
    const violationsByType = {};
    violations.forEach(violation => {
      if (!violationsByType[violation.type]) {
        violationsByType[violation.type] = 0;
      }
      
      violationsByType[violation.type]++;
    });
    
    // Calculate violations by staff member
    const violationsByStaff = {};
    violations.forEach(violation => {
      const staff = violation.staff || 'Unknown';
      if (!violationsByStaff[staff]) {
        violationsByStaff[staff] = 0;
      }
      
      violationsByStaff[staff]++;
    });
    
    // Compile report
    return {
      period,
      timestamp: new Date().toISOString(),
      totalInteractions: interactions.length,
      compliantInteractions: interactions.length - violations.length,
      violations: violations.length,
      violationsByType,
      violationsByStaff,
      violationDetails: violations.map(v => ({
        date: v.date,
        type: v.type,
        staff: v.staff,
        prospectName: v.prospectName,
        compliance: v.compliance
      }))
    };
  }
  
  /**
   * Filter prospects by time period
   * 
   * @param {string} period - Time period for filtering
   * @returns {Array<Object>} Filtered prospects
   * @private
   */
  _filterProspectsByPeriod(period) {
    const now = new Date();
    const prospects = [...this.recruitingData.prospects];
    
    switch (period) {
      case 'day':
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return prospects.filter(prospect => new Date(prospect.lastUpdated) >= oneDayAgo);
        
      case 'week':
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return prospects.filter(prospect => new Date(prospect.lastUpdated) >= oneWeekAgo);
        
      case 'month':
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return prospects.filter(prospect => new Date(prospect.lastUpdated) >= oneMonthAgo);
        
      case 'year':
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return prospects.filter(prospect => new Date(prospect.lastUpdated) >= oneYearAgo);
        
      case 'all':
      default:
        return prospects;
    }
  }
  
  /**
   * Check if a date falls within the specified period
   * 
   * @param {Date} date - Date to check
   * @param {string} period - Time period
   * @returns {boolean} Whether the date is in the period
   * @private
   */
  _isDateInPeriod(date, period) {
    const now = new Date();
    
    switch (period) {
      case 'day':
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return date >= oneDayAgo;
        
      case 'week':
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= oneWeekAgo;
        
      case 'month':
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= oneMonthAgo;
        
      case 'year':
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return date >= oneYearAgo;
        
      case 'all':
      default:
        return true;
    }
  }
  
  /**
   * Get recent recruiting activity
   * 
   * @param {string} period - Time period to include
   * @returns {Promise<Array<Object>>} Recent activity
   * @private
   */
  async _getRecentActivity(period) {
    try {
      const activities = [];
      
      // Collect recent prospect additions
      const recentProspects = this.recruitingData.prospects
        .filter(prospect => this._isDateInPeriod(new Date(prospect.created), period))
        .map(prospect => ({
          type: 'prospect_added',
          date: prospect.created,
          prospect: {
            id: prospect.id,
            name: prospect.name,
            position: prospect.position,
            stars: prospect.stars
          }
        }));
      
      activities.push(...recentProspects);
      
      // Collect recent interactions
      const recentInteractions = [];
      Object.entries(this.recruitingData.interactions).forEach(([prospectId, interactions]) => {
        const prospect = this.recruitingData.prospects.find(p => p.id === prospectId);
        if (prospect) {
          interactions.forEach(interaction => {
            if (this._isDateInPeriod(new Date(interaction.date), period)) {
              recentInteractions.push({
                type: 'interaction',
                date: interaction.date,
                interactionType: interaction.type,
                prospect: {
                  id: prospectId,
                  name: prospect.name,
                  position: prospect.position,
                  stars: prospect.stars
                },
                staff: interaction.staff
              });
            }
          });
        }
      });
      
      activities.push(...recentInteractions);
      
      // Collect recent evaluations
      const recentEvaluations = [];
      Object.entries(this.recruitingData.evaluations).forEach(([prospectId, categories]) => {
        const prospect = this.recruitingData.prospects.find(p => p.id === prospectId);
        if (prospect) {
          Object.values(categories).flat().forEach(evaluation => {
            if (this._isDateInPeriod(new Date(evaluation.date), period)) {
              recentEvaluations.push({
                type: 'evaluation',
                date: evaluation.date,
                category: evaluation.category,
                rating: evaluation.rating,
                prospect: {
                  id: prospectId,
                  name: prospect.name,
                  position: prospect.position,
                  stars: prospect.stars
                },
                evaluator: evaluation.evaluator
              });
            }
          });
        }
      });
      
      activities.push(...recentEvaluations);
      
      // Collect recent commitments
      const recentCommitments = this.recruitingData.commitments
        .filter(commitment => this._isDateInPeriod(new Date(commitment.date), period))
        .map(commitment => {
          const prospect = this.recruitingData.prospects.find(p => p.id === commitment.prospectId);
          return {
            type: 'commitment',
            date: commitment.date,
            commitmentType: commitment.type,
            prospect: prospect ? {
              id: prospect.id,
              name: prospect.name,
              position: prospect.position,
              stars: prospect.stars
            } : { id: commitment.prospectId }
          };
        });
      
      activities.push(...recentCommitments);
      
      // Sort by date (newest first) and limit to 30 activities
      return activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 30);
    } catch (error) {
      logger.error(`Error getting recent activity: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Update a prospect's overall rating based on evaluations
   * 
   * @param {string} prospectId - Prospect ID
   * @returns {Promise<number>} Updated overall rating
   * @private
   */
  async _updateProspectRating(prospectId) {
    try {
      const evaluations = this.recruitingData.evaluations[prospectId] || {};
      
      // Calculate average ratings for each category
      const categoryRatings = {};
      let totalRating = 0;
      let categoryCount = 0;
      
      Object.entries(evaluations).forEach(([category, evals]) => {
        if (evals.length > 0) {
          const sum = evals.reduce((acc, e) => acc + e.rating, 0);
          const average = sum / evals.length;
          categoryRatings[category] = average;
          totalRating += average;
          categoryCount++;
        }
      });
      
      // Calculate overall rating
      const overallRating = categoryCount > 0 ? totalRating / categoryCount : 0;
      
      // Update prospect's star rating based on overall rating
      // This is a simplified approach, real systems would be more complex
      let stars = 0;
      if (overallRating >= 9) stars = 5;
      else if (overallRating >= 7) stars = 4;
      else if (overallRating >= 5) stars = 3;
      else if (overallRating >= 3) stars = 2;
      else if (overallRating > 0) stars = 1;
      
      // Find prospect and update stars
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      if (prospectIndex !== -1) {
        // Only update if calculated stars are higher than current stars
        // This prevents downgrading stars that might have been manually set
        if (stars > this.recruitingData.prospects[prospectIndex].stars) {
          this.recruitingData.prospects[prospectIndex].stars = stars;
        }
      }
      
      return overallRating;
    } catch (error) {
      logger.error(`Error updating prospect rating: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Update compliance tracking with a new interaction
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} interaction - Interaction data
   * @private
   */
  _updateComplianceTracking(prospectId, interaction) {
    // Initialize compliance tracking for prospect if needed
    if (!this.complianceTracking.contacts[prospectId]) {
      this.complianceTracking.contacts[prospectId] = {
        count: 0,
        byType: {},
        byDate: {}
      };
    }
    
    // Update contact count
    this.complianceTracking.contacts[prospectId].count++;
    
    // Update count by type
    if (!this.complianceTracking.contacts[prospectId].byType[interaction.type]) {
      this.complianceTracking.contacts[prospectId].byType[interaction.type] = 0;
    }
    this.complianceTracking.contacts[prospectId].byType[interaction.type]++;
    
    // Update count by date (monthly basis)
    const date = new Date(interaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!this.complianceTracking.contacts[prospectId].byDate[monthKey]) {
      this.complianceTracking.contacts[prospectId].byDate[monthKey] = {
        total: 0,
        byType: {}
      };
    }
    
    this.complianceTracking.contacts[prospectId].byDate[monthKey].total++;
    
    if (!this.complianceTracking.contacts[prospectId].byDate[monthKey].byType[interaction.type]) {
      this.complianceTracking.contacts[prospectId].byDate[monthKey].byType[interaction.type] = 0;
    }
    this.complianceTracking.contacts[prospectId].byDate[monthKey].byType[interaction.type]++;
    
    // Check for compliance issues
    if (interaction.compliance && interaction.compliance.isCompliant === false) {
      this.complianceTracking.violations.push({
        date: interaction.date,
        prospectId,
        interactionId: interaction.id,
        type: interaction.type,
        staff: interaction.staff,
        issue: interaction.compliance.notes,
        recorded: new Date().toISOString()
      });
    }
  }
  
  /**
   * Format a report as plain text
   * 
   * @param {Object} reportData - Report data
   * @param {string} reportType - Report type
   * @returns {Promise<string>} Formatted report
   * @private
   */
  async _formatReportAsText(reportData, reportType) {
    // Simplified implementation
    return JSON.stringify(reportData, null, 2);
  }
  
  /**
   * Format a report as markdown
   * 
   * @param {Object} reportData - Report data
   * @param {string} reportType - Report type
   * @returns {Promise<string>} Formatted report
   * @private
   */
  async _formatReportAsMarkdown(reportData, reportType) {
    // Simplified implementation
    let markdown = `# ${this.sportName} Recruiting Report\n\n`;
    markdown += `Report Type: ${reportType}\n`;
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    markdown += `## Summary\n\n`;
    
    if (reportType === 'overview') {
      markdown += `Total Prospects: ${reportData.totalProspects}\n\n`;
      
      markdown += `### Status Counts\n\n`;
      for (const [status, count] of Object.entries(reportData.statusCounts)) {
        markdown += `- ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}\n`;
      }
      
      markdown += `\n### Position Breakdown\n\n`;
      for (const [position, count] of Object.entries(reportData.positionBreakdown)) {
        markdown += `- ${position}: ${count}\n`;
      }
      
      markdown += `\n### Star Rating\n\n`;
      markdown += `- Average: ${reportData.averageStars}\n`;
      for (const [stars, count] of Object.entries(reportData.starBreakdown)) {
        markdown += `- ${stars} ★: ${count}\n`;
      }
      
      markdown += `\n### Top Prospects\n\n`;
      reportData.topProspects.forEach((prospect, index) => {
        markdown += `${index + 1}. ${prospect.name} (${prospect.position}, ${prospect.stars}★) - ${prospect.highSchool}\n`;
      });
    }
    
    return markdown;
  }
  
  /**
   * Generate a prospect ID based on name
   * 
   * @param {string} name - Prospect name
   * @returns {string} Generated ID
   * @private
   */
  _generateProspectId(name) {
    return name.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      + '_' + Date.now().toString(36).substring(4);
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing ${this.sportName} Recruiting task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'add_prospect':
        return await this.addProspect(task.parameters);
        
      case 'update_prospect':
        return await this.updateProspect(
          task.parameters.prospectId,
          task.parameters.updateData
        );
        
      case 'log_interaction':
        return await this.logInteraction(
          task.parameters.prospectId,
          task.parameters.interactionData
        );
        
      case 'record_evaluation':
        return await this.recordEvaluation(
          task.parameters.prospectId,
          task.parameters.evaluationData
        );
        
      case 'search_prospects':
        return await this.searchProspects(task.parameters);
        
      case 'get_prospect_interactions':
        return await this.getProspectInteractions(task.parameters.prospectId);
        
      case 'get_prospect_evaluations':
        return await this.getProspectEvaluations(task.parameters.prospectId);
        
      case 'generate_report':
        return await this.generateReport(task.parameters);
        
      case 'record_commitment':
        return await this.recordCommitment(
          task.parameters.prospectId,
          task.parameters.commitmentData
        );
        
      case 'check_compliance':
        return await this.checkComplianceForInteraction(task.parameters);
        
      case 'initialize':
        return await this.initialize();
        
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
  
  /**
   * Process a message.
   * 
   * @param {object} message - The message to process
   * @private
   */
  _processMessage(message) {
    if (message.messageType === 'search_request') {
      const task = this.createTask(
        'search_prospects',
        `Search ${this.sportName} recruiting prospects`,
        message.content
      );
      
      this.submitTask(task);
      
      // Log the search for debugging
      logger.info(`Received search request for ${this.sportName} recruiting prospects`);
    } else if (message.messageType === 'report_request') {
      const task = this.createTask(
        'generate_report',
        `Generate ${this.sportName} recruiting report`,
        message.content
      );
      
      this.submitTask(task);
      
      // Log the report request for debugging
      logger.info(`Received report request for ${this.sportName} recruiting data`);
    } else {
      super._processMessage(message);
    }
  }
  
  /**
   * Stop the agent and clean up resources
   */
  async stop() {
    logger.info(`Stopping ${this.sportName} Recruiting Agent`);
    
    // Save any pending changes
    await this._saveRecruitingData();
    
    await super.stop();
  }
}

module.exports = BaseRecruitingAgent;