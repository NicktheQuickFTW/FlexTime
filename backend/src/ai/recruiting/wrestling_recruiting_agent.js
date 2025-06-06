/**
 * Wrestling Recruiting Agent
 * 
 * Specialized agent for tracking and analyzing wrestling recruiting prospects.
 */

const BaseRecruitingAgent = require('./base_recruiting_agent');
const logger = require('../scripts/logger");
const axios = require('axios');
const cheerio = require('cheerio');

class WrestlingRecruitingAgent extends BaseRecruitingAgent {
  /**
   * Create a new Wrestling Recruiting Agent
   * 
   * @param {Object} config - Configuration options
   * @param {Object} mcpConnector - MCP connector for model interactions
   */
  constructor(config, mcpConnector) {
    super('WRES', 'Wrestling', config, mcpConnector);
    
    // NCAA weight classes
    this.positions = [
      '125', '133', '141', '149', '157', 
      '165', '174', '184', '197', '285', 
      'Multiple'  // For wrestlers who compete at multiple weight classes
    ];
    
    // Wrestling-specific eligibility options
    this.eligibilityOptions = [
      'Freshman',
      'Redshirt Freshman',
      'Sophomore',
      'Redshirt Sophomore',
      'Junior',
      'Redshirt Junior',
      'Senior',
      'Redshirt Senior',
      'Graduate',
      'COVID Year'
    ];
    
    // Wrestling-specific metrics
    this.metrics = {
      // Technical skills
      technical: [
        'neutral_offense', 'neutral_defense', 'bottom', 'top', 'takedowns',
        'escapes', 'reversals', 'near_falls', 'pins', 'technique'
      ],
      
      // Physical attributes
      physical: [
        'strength', 'speed', 'conditioning', 'explosiveness', 'flexibility',
        'balance', 'agility', 'power'
      ],
      
      // Wrestling IQ and strategy
      strategy: [
        'match_awareness', 'time_management', 'score_awareness', 'adaptability',
        'positioning', 'setups', 'hand_fighting', 'defense_awareness'
      ],
      
      // Mental attributes
      mental: [
        'toughness', 'confidence', 'focus', 'discipline', 'poise',
        'intensity', 'resilience', 'coachability'
      ]
    };
    
    // Initialize NCAA recruiting calendar for wrestling
    this.recruitingCalendar = {
      contactPeriods: [
        { start: '2023-07-01', end: '2023-07-31', description: 'July contact period' },
        { start: '2023-08-01', end: '2023-08-31', description: 'August contact period' },
        { start: '2023-09-01', end: '2023-05-31', description: 'Academic year contact period' }
      ],
      evaluationPeriods: [
        { start: '2023-09-01', end: '2023-05-31', description: 'Academic year evaluation period' }
      ],
      quietPeriods: [
        { start: '2023-06-01', end: '2023-06-30', description: 'June quiet period' }
      ],
      deadPeriods: [
        { start: '2023-11-01', end: '2023-11-02', description: 'Fall signing dead period' },
        { start: '2024-04-08', end: '2024-04-12', description: 'Spring signing dead period' }
      ]
    };
    
    // Configure data sources
    this.dataSources = {
      rankings: config?.dataSources?.rankings || 'https://example.com/wrestling-rankings', // Placeholder
      events: config?.dataSources?.events || 'https://example.com/wrestling-events', // Placeholder
      stats: config?.dataSources?.stats || 'https://example.com/wrestling-stats' // Placeholder
    };
    
    // Wrestling-specific evaluation measures
    this.evaluationTemplates = {
      weightClasses: {
        // Technical evaluation by weight class
        '125': { speed: 9, technique: 8, conditioning: 7 },
        '133': { speed: 8, technique: 8, conditioning: 7 },
        '141': { speed: 8, technique: 7, conditioning: 7 },
        '149': { speed: 7, technique: 7, conditioning: 7 },
        '157': { speed: 7, technique: 7, conditioning: 7 },
        '165': { speed: 7, technique: 7, power: 7 },
        '174': { speed: 6, technique: 7, power: 8 },
        '184': { speed: 6, technique: 7, power: 8 },
        '197': { speed: 6, technique: 6, power: 9 },
        '285': { speed: 5, technique: 6, power: 10 }
      }
    };
    
    // Academic evaluation measures
    this.academicMetrics = [
      'gpa', 'core_gpa', 'act', 'sat', 'academic_awards', 'study_habits', 'major_interests'
    ];
    
    logger.info('Wrestling Recruiting Agent initialized');
  }
  
  /**
   * Fetch latest prospect rankings from external sources
   * 
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Updated rankings
   */
  async fetchLatestRankings(options = {}) {
    try {
      logger.info('Fetching latest Wrestling prospect rankings');
      
      // This would typically call an API or scrape a website
      // For demonstration, we'll generate mock ranking data
      const mockRankings = await this._generateMockRankings(options);
      
      // Update the rankings in our data
      this.recruitingData.rankings = {
        source: 'Mock Wrestling Rankings Service',
        lastUpdated: new Date().toISOString(),
        overall: mockRankings.overall,
        byWeightClass: mockRankings.byWeightClass,
        byClass: mockRankings.byClass
      };
      
      // Update prospect rankings if they exist in our database
      for (const rankedProspect of mockRankings.overall) {
        // Try to find matching prospect by name
        const prospect = this.recruitingData.prospects.find(p => 
          p.name.toLowerCase() === rankedProspect.name.toLowerCase()
        );
        
        if (prospect) {
          logger.info(`Updating ranking for prospect: ${prospect.name} to ${rankedProspect.rank}`);
          
          // Update the prospect's ranking and stars
          await this.updateProspect(prospect.id, {
            ranking: rankedProspect.rank,
            stars: rankedProspect.stars,
            metrics: { ...prospect.metrics, ...rankedProspect.metrics }
          });
        }
      }
      
      // Save the updated data
      await this._saveRecruitingData();
      
      return {
        updated: true,
        rankingsCount: mockRankings.overall.length,
        source: 'Mock Wrestling Rankings Service',
        date: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error fetching wrestling rankings: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate mock wrestling prospect rankings
   * 
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Mock rankings
   * @private
   */
  async _generateMockRankings(options = {}) {
    // Generate a list of mock prospect rankings
    const count = options.count || 200;
    const classYear = options.classYear || 2024;
    
    // Names for generating mock data
    const firstNames = [
      'Spencer', 'Aaron', 'David', 'Carter', 'Yianni', 
      'Gable', 'Roman', 'Nick', 'Ryan', 'Mason', 
      'Shane', 'Austin', 'Bryce', 'Anthony', 'Michael',
      'Kyle', 'Logan', 'Connor', 'Seth', 'Zain',
      'Hayden', 'Caleb', 'Jordan', 'Mekhi', 'Evan'
    ];
    
    const lastNames = [
      'Lee', 'Brooks', 'Taylor', 'Steveson', 'Diakomihalis',
      'Dean', 'Bravo-Young', 'Gwiazdowski', 'Deakin', 'Parris',
      'Griffith', 'DeSanto', 'Young', 'Cassioppi', 'Kemerer',
      'Ferrari', 'Berge', 'Hidlay', 'Amine', 'Retherford',
      'Shields', 'O\'Connor', 'Burroughs', 'Lewis', 'Suriano'
    ];
    
    const highSchools = [
      'Blair Academy', 'Wyoming Seminary', 'St. Edward', 'Montini Catholic',
      'Oak Park River Forest', 'Bergen Catholic', 'Malvern Prep', 'St. Paris Graham',
      'Nazareth Academy', 'Lake Highland Prep', 'Stillwater', 'Allen', 'Buchanan',
      'Tuttle', 'Broken Arrow', 'Easton', 'Apple Valley', 'Perry', 'Poway', 'Detroit Catholic Central'
    ];
    
    const states = [
      'PA', 'OH', 'NJ', 'IL', 'IA', 
      'MN', 'OK', 'NY', 'CA', 'MI',
      'MO', 'WI', 'NC', 'VA', 'IN',
      'CO', 'FL', 'TX', 'GA', 'KS'
    ];
    
    // Generate overall rankings
    const overall = [];
    
    // Weight class counter to distribute evenly
    const weightClassCounter = {};
    this.positions.forEach(wc => {
      if (wc !== 'Multiple') {
        weightClassCounter[wc] = 0;
      }
    });
    
    for (let i = 1; i <= count; i++) {
      // Generate random name
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      
      // Determine star rating based on rank
      let stars;
      if (i <= 20) stars = 5;
      else if (i <= 75) stars = 4;
      else if (i <= 150) stars = 3;
      else stars = 2;
      
      // Assign a weight class - ensure more balanced distribution
      const availableWeightClasses = Object.keys(weightClassCounter)
        .sort((a, b) => weightClassCounter[a] - weightClassCounter[b]);
      
      // Pick from the least populated weight classes
      const position = availableWeightClasses[Math.floor(Math.random() * Math.min(3, availableWeightClasses.length))];
      weightClassCounter[position]++;
      
      // Generate mock metrics
      const metrics = {};
      
      // Generate random metrics (higher for higher-ranked players)
      const rankFactor = Math.max(0.5, 1 - (i / count));
      
      for (const category in this.metrics) {
        metrics[category] = {};
        
        for (const skill of this.metrics[category]) {
          // Base score between 6-10 for top picks, scaling down for lower ranks
          metrics[category][skill] = Math.round((Math.random() * 4 + 6) * rankFactor * 10) / 10;
        }
      }
      
      // Generate record
      const wins = Math.floor(Math.random() * 30) + 10;
      const losses = Math.floor(Math.random() * 10);
      
      metrics.record = {
        wins,
        losses,
        pins: Math.floor(Math.random() * wins * 0.7),
        techs: Math.floor(Math.random() * wins * 0.3),
        majors: Math.floor(Math.random() * wins * 0.4)
      };
      
      // State
      const state = states[Math.floor(Math.random() * states.length)];
      
      // Add to rankings
      overall.push({
        rank: i,
        name,
        position,
        stars,
        highSchool: highSchools[Math.floor(Math.random() * highSchools.length)],
        state,
        record: `${wins}-${losses}`,
        height: `${Math.floor(Math.random() * 12) + 64}`, // 5'4" to 6'4"
        weight: Math.floor(Math.random() * 160) + 120, // 120-280 lbs (covers all weight classes)
        graduationYear: classYear,
        metrics
      });
    }
    
    // Generate weight class rankings
    const byWeightClass = {};
    this.positions.forEach(weightClass => {
      if (weightClass !== 'Multiple') {
        const weightClassProspects = overall
          .filter(p => p.position === weightClass)
          .sort((a, b) => a.rank - b.rank);
        
        if (weightClassProspects.length > 0) {
          byWeightClass[weightClass] = weightClassProspects.map((p, idx) => ({
            ...p,
            weightClassRank: idx + 1
          }));
        }
      }
    });
    
    // Return mock rankings
    return {
      overall,
      byWeightClass,
      byClass: {
        [classYear]: overall
      }
    };
  }
  
  /**
   * Record a prospect's match performance
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} matchData - Match performance data
   * @returns {Promise<Object>} Recorded match
   */
  async recordMatch(prospectId, matchData) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Validate required fields
      if (!matchData.event || !matchData.date || !matchData.opponent) {
        throw new Error('Event name, date, and opponent are required');
      }
      
      // Create match record
      const match = {
        id: `match_${Date.now().toString(36)}`,
        event: matchData.event,
        date: matchData.date,
        opponent: matchData.opponent,
        opponent_school: matchData.opponent_school || '',
        weight_class: matchData.weight_class || this.recruitingData.prospects[prospectIndex].position,
        result: matchData.result || '',
        score: matchData.score || '',
        stats: matchData.stats || {},
        notes: matchData.notes || '',
        evaluator: matchData.evaluator || '',
        highlights: matchData.highlights || [],
        created: new Date().toISOString()
      };
      
      // Add wrestling-specific stats structure if not provided
      if (Object.keys(match.stats).length === 0) {
        match.stats = {
          takedowns: matchData.takedowns || 0,
          escapes: matchData.escapes || 0,
          reversals: matchData.reversals || 0,
          near_falls: matchData.near_falls || 0,
          pins: matchData.pins || 0,
          techs: matchData.techs || 0,
          majors: matchData.majors || 0,
          riding_time: matchData.riding_time || 0,
          result_type: matchData.result_type || ''  // pin, tech, major, decision, etc.
        };
      }
      
      // Parse match result to determine win/loss
      if (match.result && !match.stats.win) {
        match.stats.win = match.result.toLowerCase().includes('win');
      }
      
      // Initialize matches array if it doesn't exist
      if (!this.recruitingData.matches) {
        this.recruitingData.matches = {};
      }
      
      if (!this.recruitingData.matches[prospectId]) {
        this.recruitingData.matches[prospectId] = [];
      }
      
      // Add match to array
      this.recruitingData.matches[prospectId].push(match);
      
      // Update prospect's last updated timestamp
      this.recruitingData.prospects[prospectIndex].lastUpdated = new Date().toISOString();
      
      // Automatically generate evaluation based on match
      await this._generateEvaluationFromMatch(prospectId, match);
      
      // Save changes
      await this._saveRecruitingData();
      
      logger.info(`Recorded match for prospect ${this.recruitingData.prospects[prospectIndex].name} at ${match.event}`);
      
      return match;
    } catch (error) {
      logger.error(`Error recording match: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate an evaluation based on a match
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} match - Match data
   * @returns {Promise<Object>} Generated evaluation
   * @private
   */
  async _generateEvaluationFromMatch(prospectId, match) {
    try {
      const prospect = this.recruitingData.prospects.find(p => p.id === prospectId);
      
      if (!prospect) {
        throw new Error(`Prospect ${prospectId} not found`);
      }
      
      // Extract stats
      const stats = match.stats;
      
      // Generate technical evaluation
      const technicalEval = {
        category: this.evaluationCategories.TECHNICAL,
        rating: Math.min(10, Math.max(1, 
          5 + // Base rating
          ((stats.takedowns || 0) > 3 ? 1 : 0) + // Takedown bonus
          ((stats.near_falls || 0) > 2 ? 1 : 0) + // Near fall bonus
          ((stats.pins || 0) > 0 ? 2 : ((stats.techs || 0) > 0 ? 1 : 0)) + // Pin/tech bonus
          (stats.win ? 1 : 0) // Win bonus
        )),
        notes: `Technical evaluation based on match against ${match.opponent} (${match.opponent_school}). Key stats: ${stats.takedowns || 0} takedowns, ${stats.near_falls || 0} near falls${stats.pins ? ', secured pin' : ''}${stats.techs ? ', tech fall' : ''}${stats.majors ? ', major decision' : ''}`,
        evaluator: match.evaluator || 'Match Analyzer',
        date: match.date,
        context: `${match.event} - ${match.weight_class}`,
        created: new Date().toISOString()
      };
      
      // Generate tactical evaluation
      const tacticalEval = {
        category: this.evaluationCategories.TACTICAL,
        rating: Math.min(10, Math.max(1, 
          5 + // Base rating
          (stats.win ? 1 : 0) + // Win bonus
          ((stats.takedowns || 0) > (stats.escapes || 0) ? 1 : 0) + // Offensive bonus
          ((stats.riding_time || 0) > 1 ? 1 : 0) + // Control bonus
          (match.notes && match.notes.includes('good strategy') ? 1 : 0) // Strategy noted
        )),
        notes: `Tactical evaluation based on strategy and execution against ${match.opponent}`,
        evaluator: match.evaluator || 'Match Analyzer',
        date: match.date,
        context: `${match.event} - ${match.weight_class}`,
        created: new Date().toISOString()
      };
      
      // Generate physical evaluation for higher level/important matches
      let physicalEval = null;
      if (match.event.includes('State') || match.event.includes('National') || match.event.includes('Tournament')) {
        physicalEval = {
          category: this.evaluationCategories.PHYSICAL,
          rating: Math.min(10, Math.max(1, 
            5 + // Base rating
            (stats.win ? 1 : 0) + // Win bonus
            ((stats.riding_time || 0) > 1 ? 1 : 0) + // Endurance bonus
            ((stats.takedowns || 0) > 4 ? 1 : 0) + // Repeated takedown bonus
            (match.notes && match.notes.includes('physical dominance') ? 1 : 0) // Physicality noted
          )),
          notes: `Physical evaluation based on strength, conditioning and explosiveness in a ${match.event} match`,
          evaluator: match.evaluator || 'Match Analyzer',
          date: match.date,
          context: `${match.event} - ${match.weight_class}`,
          created: new Date().toISOString()
        };
      }
      
      // Record the evaluations
      const technicalResult = await this.recordEvaluation(prospectId, technicalEval);
      const tacticalResult = await this.recordEvaluation(prospectId, tacticalEval);
      let physicalResult = null;
      if (physicalEval) {
        physicalResult = await this.recordEvaluation(prospectId, physicalEval);
      }
      
      return {
        technical: technicalResult,
        tactical: tacticalResult,
        physical: physicalResult
      };
    } catch (error) {
      logger.error(`Error generating evaluation from match: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get a prospect's match history
   * 
   * @param {string} prospectId - Prospect ID
   * @returns {Promise<Array<Object>>} Match history
   */
  async getProspectMatches(prospectId) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Get matches
      const matches = this.recruitingData.matches?.[prospectId] || [];
      
      // Sort by date (newest first)
      return [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      logger.error(`Error getting prospect matches: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Record a tournament result for a prospect
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} tournamentData - Tournament data
   * @returns {Promise<Object>} Recorded tournament result
   */
  async recordTournamentResult(prospectId, tournamentData) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Validate required fields
      if (!tournamentData.tournament || !tournamentData.date || !tournamentData.placement) {
        throw new Error('Tournament name, date, and placement are required');
      }
      
      // Create tournament record
      const tournament = {
        id: `tourn_${Date.now().toString(36)}`,
        tournament: tournamentData.tournament,
        date: tournamentData.date,
        weight_class: tournamentData.weight_class || this.recruitingData.prospects[prospectIndex].position,
        placement: tournamentData.placement,
        record: tournamentData.record || '',
        num_competitors: tournamentData.num_competitors || 0,
        notes: tournamentData.notes || '',
        evaluator: tournamentData.evaluator || '',
        match_results: tournamentData.match_results || [],
        created: new Date().toISOString()
      };
      
      // Initialize tournaments array if it doesn't exist
      if (!this.recruitingData.tournaments) {
        this.recruitingData.tournaments = {};
      }
      
      if (!this.recruitingData.tournaments[prospectId]) {
        this.recruitingData.tournaments[prospectId] = [];
      }
      
      // Add tournament to array
      this.recruitingData.tournaments[prospectId].push(tournament);
      
      // Update prospect's last updated timestamp
      this.recruitingData.prospects[prospectIndex].lastUpdated = new Date().toISOString();
      
      // Add individual matches if provided
      if (tournamentData.matches && tournamentData.matches.length > 0) {
        for (const matchData of tournamentData.matches) {
          await this.recordMatch(prospectId, {
            ...matchData,
            event: tournamentData.tournament,
            date: matchData.date || tournamentData.date
          });
        }
      }
      
      // Generate tournament-based evaluation
      await this._generateEvaluationFromTournament(prospectId, tournament);
      
      // Save changes
      await this._saveRecruitingData();
      
      logger.info(`Recorded tournament result for prospect ${this.recruitingData.prospects[prospectIndex].name} at ${tournament.tournament}`);
      
      return tournament;
    } catch (error) {
      logger.error(`Error recording tournament result: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate an evaluation based on tournament performance
   * 
   * @param {string} prospectId - Prospect ID
   * @param {Object} tournament - Tournament data
   * @returns {Promise<Object>} Generated evaluation
   * @private
   */
  async _generateEvaluationFromTournament(prospectId, tournament) {
    try {
      // Score based on placement and tournament size/prestige
      let placementScore = 5; // Base score
      
      // Add or subtract based on placement
      const placement = parseInt(tournament.placement) || 0;
      const competitors = tournament.num_competitors || 0;
      
      // Calculate placement percentage if both values are available
      if (placement > 0 && competitors > 0) {
        const placementPercentile = (competitors - placement + 1) / competitors;
        
        // Adjust score based on percentile
        if (placementPercentile >= 0.9) placementScore += 4; // Top 10%
        else if (placementPercentile >= 0.75) placementScore += 3; // Top 25% 
        else if (placementPercentile >= 0.5) placementScore += 2; // Top 50%
        else if (placementPercentile >= 0.25) placementScore += 1; // Top 75%
        else placementScore -= 1; // Bottom 25%
      } else {
        // If we don't have exact numbers, use the placement directly
        if (placement === 1) placementScore += 4; // Champion
        else if (placement === 2) placementScore += 3; // Runner-up
        else if (placement <= 4) placementScore += 2; // Placed top 4
        else if (placement <= 8) placementScore += 1; // Placed top 8
        else placementScore -= 1; // Didn't place in top 8
      }
      
      // Adjust for tournament prestige
      const tournamentName = tournament.tournament.toLowerCase();
      if (
        tournamentName.includes('national') || 
        tournamentName.includes('super 32') ||
        tournamentName.includes('fargo') ||
        tournamentName.includes('walsh') ||
        tournamentName.includes('powerade') ||
        tournamentName.includes('ironman')
      ) {
        placementScore += 2; // Major national tournament
      } else if (
        tournamentName.includes('state') || 
        tournamentName.includes('regional') ||
        tournamentName.includes('conference')
      ) {
        placementScore += 1; // State or regional tournament
      }
      
      // Ensure score is within range
      placementScore = Math.min(10, Math.max(1, placementScore));
      
      // Create evaluation based on tournament
      const evaluation = {
        category: this.evaluationCategories.POTENTIAL,
        rating: placementScore,
        notes: `Tournament evaluation based on ${tournament.placement}${ordinalSuffix(tournament.placement)} place finish at ${tournament.tournament} in the ${tournament.weight_class} weight class${tournament.num_competitors ? ` out of ${tournament.num_competitors} competitors` : ''}.`,
        evaluator: tournament.evaluator || 'Tournament Analyzer',
        date: tournament.date,
        context: `${tournament.tournament}`,
        created: new Date().toISOString()
      };
      
      // Record the evaluation
      return await this.recordEvaluation(prospectId, evaluation);
    } catch (error) {
      logger.error(`Error generating evaluation from tournament: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Calculate win-loss record and statistics
   * 
   * @param {string} prospectId - Prospect ID
   * @returns {Promise<Object>} Record summary
   */
  async calculateRecord(prospectId) {
    try {
      // Find prospect
      const prospectIndex = this.recruitingData.prospects.findIndex(p => p.id === prospectId);
      
      if (prospectIndex === -1) {
        throw new Error(`Prospect ${prospectId} not found in recruiting database`);
      }
      
      // Get matches
      const matches = this.recruitingData.matches?.[prospectId] || [];
      
      // Initialize record object
      const record = {
        total: {
          wins: 0,
          losses: 0,
          win_pct: 0
        },
        pins: 0,
        techs: 0,
        majors: 0,
        decisions: 0,
        by_weight_class: {},
        by_year: {},
        against: {
          state_placers: 0,
          state_champs: 0,
          nationally_ranked: 0
        },
        summary: '',
        updated: new Date().toISOString()
      };
      
      // Process each match
      for (const match of matches) {
        // Skip matches without a clear result
        if (!match.stats || match.stats.win === undefined) continue;
        
        // Count win or loss
        if (match.stats.win) {
          record.total.wins++;
          
          // Count win types
          if (match.stats.pins > 0) record.pins++;
          else if (match.stats.techs > 0) record.techs++;
          else if (match.stats.majors > 0) record.majors++;
          else record.decisions++;
        } else {
          record.total.losses++;
        }
        
        // Track by weight class
        const weightClass = match.weight_class || 'unknown';
        if (!record.by_weight_class[weightClass]) {
          record.by_weight_class[weightClass] = { wins: 0, losses: 0 };
        }
        if (match.stats.win) record.by_weight_class[weightClass].wins++;
        else record.by_weight_class[weightClass].losses++;
        
        // Track by year
        const year = new Date(match.date).getFullYear().toString();
        if (!record.by_year[year]) {
          record.by_year[year] = { wins: 0, losses: 0 };
        }
        if (match.stats.win) record.by_year[year].wins++;
        else record.by_year[year].losses++;
        
        // Track quality wins
        if (match.stats.win) {
          if (match.notes && match.notes.includes('state place')) record.against.state_placers++;
          if (match.notes && match.notes.includes('state champ')) record.against.state_champs++;
          if (match.notes && match.notes.includes('nationally ranked')) record.against.nationally_ranked++;
        }
      }
      
      // Calculate win percentage
      const totalMatches = record.total.wins + record.total.losses;
      record.total.win_pct = totalMatches > 0 ? 
        Math.round((record.total.wins / totalMatches) * 1000) / 10 : 0;
      
      // Create summary string
      record.summary = `${record.total.wins}-${record.total.losses} (${record.pins} pins, ${record.techs} techs, ${record.majors} majors)`;
      
      // Update prospect metrics with record
      const prospect = this.recruitingData.prospects[prospectIndex];
      
      if (!prospect.metrics) {
        prospect.metrics = {};
      }
      
      if (!prospect.metrics.record) {
        prospect.metrics.record = {};
      }
      
      prospect.metrics.record = {
        wins: record.total.wins,
        losses: record.total.losses,
        pins: record.pins,
        techs: record.techs,
        majors: record.majors,
        win_pct: record.total.win_pct
      };
      
      // Save changes
      await this._saveRecruitingData();
      
      return record;
    } catch (error) {
      logger.error(`Error calculating record: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate recommended prospects by weight class
   * 
   * @param {Object} teamNeeds - Team needs by weight class
   * @param {Object} options - Recommendation options
   * @returns {Promise<Object>} Recommended prospects
   */
  async generateRecommendations(teamNeeds = {}, options = {}) {
    try {
      const limit = options.limit || 3;
      const minStars = options.minStars || 3;
      const excludeStatuses = options.excludeStatuses || [
        this.prospectStatuses.COMMITTED,
        this.prospectStatuses.SIGNED,
        this.prospectStatuses.ENROLLED,
        this.prospectStatuses.DECLINED
      ];
      
      // Get available prospects
      let availableProspects = this.recruitingData.prospects.filter(p => 
        !excludeStatuses.includes(p.status) && p.stars >= minStars
      );
      
      // Set default needs if none provided
      if (Object.keys(teamNeeds).length === 0) {
        teamNeeds = {
          '125': 1, '133': 1, '141': 1, '149': 1, '157': 1,
          '165': 1, '174': 1, '184': 1, '197': 1, '285': 1
        };
      }
      
      // Group prospects by weight class
      const prospectsByWeightClass = {};
      
      this.positions.forEach(weightClass => {
        if (weightClass !== 'Multiple') {
          prospectsByWeightClass[weightClass] = availableProspects
            .filter(p => p.position === weightClass)
            .sort((a, b) => (b.stars - a.stars) || (a.ranking || Infinity) - (b.ranking || Infinity));
        }
      });
      
      // Handle "Multiple" weight class prospects - assign to preferred weight class if possible
      const multiples = availableProspects.filter(p => p.position === 'Multiple');
      multiples.forEach(prospect => {
        if (prospect.preferredWeightClass) {
          // If they have a preferred weight class, add them there
          if (!prospectsByWeightClass[prospect.preferredWeightClass]) {
            prospectsByWeightClass[prospect.preferredWeightClass] = [];
          }
          prospectsByWeightClass[prospect.preferredWeightClass].push(prospect);
        } else {
          // Otherwise add them to adjacent weight classes
          const potentialClasses = ['149', '157', '165']; // Middle weights as default
          potentialClasses.forEach(wc => {
            if (!prospectsByWeightClass[wc]) {
              prospectsByWeightClass[wc] = [];
            }
            prospectsByWeightClass[wc].push({...prospect, position: wc});
          });
        }
      });
      
      // Re-sort any weight classes that had multiple wrestlers added
      Object.keys(prospectsByWeightClass).forEach(wc => {
        prospectsByWeightClass[wc] = prospectsByWeightClass[wc]
          .sort((a, b) => (b.stars - a.stars) || (a.ranking || Infinity) - (b.ranking || Infinity));
      });
      
      // Generate recommendations
      const recommendations = {};
      const recommendationDetails = {};
      
      for (const [weightClass, count] of Object.entries(teamNeeds)) {
        if (count > 0) {
          // Find matching prospects
          let matchingProspects = [];
          
          if (prospectsByWeightClass[weightClass]) {
            matchingProspects = [...prospectsByWeightClass[weightClass]];
          }
          
          // Add prospects from adjacent weight classes if needed
          if (matchingProspects.length < count * limit && options.includeAdjacent) {
            const adjacentWeightClasses = getAdjacentWeightClasses(weightClass);
            for (const adjWC of adjacentWeightClasses) {
              if (prospectsByWeightClass[adjWC]) {
                // Add wrestlers who could move up/down
                const adjacentProspects = prospectsByWeightClass[adjWC]
                  .filter(p => !matchingProspects.some(mp => mp.id === p.id))
                  .map(p => ({...p, notes: `Normally wrestles at ${p.position}`}));
                
                matchingProspects = [...matchingProspects, ...adjacentProspects];
              }
            }
          }
          
          // Take top prospects based on count and limit
          const topProspects = matchingProspects.slice(0, count * limit);
          
          // Format recommendations
          recommendations[weightClass] = topProspects.map(p => ({
            id: p.id,
            name: p.name,
            stars: p.stars,
            position: p.position,
            highSchool: p.highSchool,
            status: p.status,
            notes: p.notes
          }));
          
          // Store recommendation details
          recommendationDetails[weightClass] = {
            need: count,
            available: matchingProspects.length,
            avgStars: matchingProspects.length > 0 
              ? (matchingProspects.reduce((sum, p) => sum + p.stars, 0) / matchingProspects.length).toFixed(1) 
              : 0
          };
        }
      }
      
      return {
        teamNeeds,
        recommendations,
        details: recommendationDetails,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Error generating recommendations: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process a task (Agent base class implementation).
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing Wrestling Recruiting task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'fetch_rankings':
        return await this.fetchLatestRankings(task.parameters);
        
      case 'record_match':
        return await this.recordMatch(
          task.parameters.prospectId,
          task.parameters.matchData
        );
        
      case 'get_matches':
        return await this.getProspectMatches(task.parameters.prospectId);
        
      case 'record_tournament':
        return await this.recordTournamentResult(
          task.parameters.prospectId,
          task.parameters.tournamentData
        );
        
      case 'calculate_record':
        return await this.calculateRecord(task.parameters.prospectId);
        
      case 'generate_recommendations':
        return await this.generateRecommendations(
          task.parameters.teamNeeds,
          task.parameters.options
        );
        
      default:
        // Use base implementation for other task types
        return await super._processTask(task);
    }
  }
}

/**
 * Get adjacent weight classes for a given weight class
 * 
 * @param {string} weightClass - The weight class
 * @returns {Array<string>} Adjacent weight classes
 */
function getAdjacentWeightClasses(weightClass) {
  const weightClasses = ['125', '133', '141', '149', '157', '165', '174', '184', '197', '285'];
  const index = weightClasses.indexOf(weightClass);
  
  if (index === -1) return [];
  
  const adjacent = [];
  if (index > 0) adjacent.push(weightClasses[index - 1]);
  if (index < weightClasses.length - 1) adjacent.push(weightClasses[index + 1]);
  
  return adjacent;
}

/**
 * Get ordinal suffix for a number
 * 
 * @param {number} num - The number
 * @returns {string} Ordinal suffix
 */
function ordinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}

module.exports = WrestlingRecruitingAgent;