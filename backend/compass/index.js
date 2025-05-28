/**
 * COMPASS Integration Module for FlexTime
 * 
 * Integrates the COMPASS (Comprehensive Program Assessment) system
 * into the FlexTime backend, providing advanced metrics, scheduling
 * intelligence, and competitive balance tools.
 */

const COMPASSCore = require('./core');
const PerformanceComponent = require('./components/performance');
const ResourcesComponent = require('./components/resources');
const CompetitiveBalanceComponent = require('./components/competitive_balance');
const PredictiveAnalyticsComponent = require('./components/predictive_analytics');
const logger = require('../utils/logger');

/**
 * Initialize the COMPASS system
 * @param {Object} app - Express app
 * @param {Object} db - Database connection
 * @param {Object} options - Configuration options
 * @returns {Object} COMPASS system instance
 */
async function initializeCOMPASS(app, db, options = {}) {
  try {
    logger.info('Initializing COMPASS system...');
    
    // Create COMPASS core
    const compass = new COMPASSCore(options.core || {});
    
    // Initialize components
    const performanceComponent = new PerformanceComponent(db, options.performance || {});
    const resourcesComponent = new ResourcesComponent(db, options.resources || {});
    const predictiveAnalyticsComponent = new PredictiveAnalyticsComponent(db, options.predictiveAnalytics || {});
    
    // Register essential components
    compass.registerComponent('performance', performanceComponent);
    compass.registerComponent('resources', resourcesComponent);
    
    // Initialize resources component
    await resourcesComponent.initialize();
    
    // Initialize and register predictive analytics component
    await predictiveAnalyticsComponent.initialize();
    compass.registerComponent('talent', predictiveAnalyticsComponent);
    
    // Create and register competitive balance component
    const competitiveBalanceComponent = new CompetitiveBalanceComponent(
      compass,
      options.competitiveBalance || {}
    );
    compass.registerComponent('competitive', competitiveBalanceComponent);
    
    // Make COMPASS available in the app
    app.set('compass', compass);
    
    logger.info('COMPASS system initialized successfully');
    
    return compass;
  } catch (error) {
    logger.error(`Failed to initialize COMPASS system: ${error.message}`);
    throw error;
  }
}

/**
 * Register COMPASS endpoints with the Express app
 * @param {Object} app - Express app
 * @param {Object} compass - COMPASS system instance
 */
function registerCOMPASSEndpoints(app, compass) {
  const router = require('express').Router();
  
  /**
   * @route   GET /api/compass/scores/:programId
   * @desc    Get COMPASS score for a program
   * @access  Public
   */
  router.get('/scores/:programId', async (req, res) => {
    try {
      const { programId } = req.params;
      const score = await compass.getProgramScore(programId);
      
      if (!score) {
        return res.status(404).json({ error: 'Program not found' });
      }
      
      res.json({
        success: true,
        score
      });
    } catch (error) {
      logger.error(`Error getting COMPASS score: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   GET /api/compass/rankings
   * @desc    Get COMPASS rankings
   * @access  Public
   */
  router.get('/rankings', async (req, res) => {
    try {
      const { sport } = req.query;
      const rankings = await compass.getRankings(sport);
      
      res.json({
        success: true,
        count: rankings.length,
        rankings
      });
    } catch (error) {
      logger.error(`Error getting COMPASS rankings: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   GET /api/compass/analysis/:program1Id/:program2Id
   * @desc    Get competitive analysis between two programs
   * @access  Public
   */
  router.get('/analysis/:program1Id/:program2Id', async (req, res) => {
    try {
      const { program1Id, program2Id } = req.params;
      const analysis = await compass.getCompetitiveAnalysis(program1Id, program2Id);
      
      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      logger.error(`Error getting competitive analysis: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   GET /api/compass/schedule-quality/:teamId/:scheduleId
   * @desc    Get schedule quality assessment for a team
   * @access  Public
   */
  router.get('/schedule-quality/:teamId/:scheduleId', async (req, res) => {
    try {
      const { teamId, scheduleId } = req.params;
      
      // Get schedule from database
      const schedule = await app.get('db').Schedule.findByPk(scheduleId, {
        include: [
          { 
            model: app.get('db').Game, 
            as: 'games',
            include: [
              { model: app.get('db').Team, as: 'homeTeam' },
              { model: app.get('db').Team, as: 'awayTeam' },
              { model: app.get('db').Venue, as: 'venue' }
            ]
          },
          { 
            model: app.get('db').Team, 
            as: 'teams'
          }
        ]
      });
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      const assessment = await compass.getScheduleQualityAssessment(teamId, schedule);
      
      res.json({
        success: true,
        assessment
      });
    } catch (error) {
      logger.error(`Error getting schedule quality: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   GET /api/compass/balance/:scheduleId
   * @desc    Get competitive balance assessment for a schedule
   * @access  Public
   */
  router.get('/balance/:scheduleId', async (req, res) => {
    try {
      const { scheduleId } = req.params;
      
      // Get schedule from database
      const schedule = await app.get('db').Schedule.findByPk(scheduleId, {
        include: [
          { 
            model: app.get('db').Game, 
            as: 'games',
            include: [
              { model: app.get('db').Team, as: 'homeTeam' },
              { model: app.get('db').Team, as: 'awayTeam' },
              { model: app.get('db').Venue, as: 'venue' }
            ]
          },
          { 
            model: app.get('db').Team, 
            as: 'teams'
          }
        ]
      });
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      // Get competitive balance component
      const balanceComponent = compass.getComponents().competitive;
      
      if (!balanceComponent) {
        return res.status(500).json({ error: 'Competitive balance component not available' });
      }
      
      const assessment = await balanceComponent.assessSchedule(schedule);
      
      res.json({
        success: true,
        assessment
      });
    } catch (error) {
      logger.error(`Error getting balance assessment: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   POST /api/compass/optimize/balance
   * @desc    Optimize a schedule for competitive balance
   * @access  Public
   */
  router.post('/optimize/balance', async (req, res) => {
    try {
      const { scheduleId, options } = req.body;
      
      if (!scheduleId) {
        return res.status(400).json({ error: 'Schedule ID is required' });
      }
      
      // Get schedule from database
      const schedule = await app.get('db').Schedule.findByPk(scheduleId, {
        include: [
          { 
            model: app.get('db').Game, 
            as: 'games',
            include: [
              { model: app.get('db').Team, as: 'homeTeam' },
              { model: app.get('db').Team, as: 'awayTeam' },
              { model: app.get('db').Venue, as: 'venue' }
            ]
          },
          { 
            model: app.get('db').Team, 
            as: 'teams'
          }
        ]
      });
      
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      // Get competitive balance component
      const balanceComponent = compass.getComponents().competitive;
      
      if (!balanceComponent) {
        return res.status(500).json({ error: 'Competitive balance component not available' });
      }
      
      // Assess current balance
      const beforeAssessment = await balanceComponent.assessSchedule(schedule);
      
      // Use the advanced metrics optimization
      const advancedMetricsSystem = app.get('advancedMetricsSystem');
      
      if (!advancedMetricsSystem) {
        return res.status(500).json({ error: 'Advanced metrics system not available' });
      }
      
      // Analyze the schedule
      const analysis = advancedMetricsSystem.analyzeSchedule(schedule);
      
      // Get recommendations focused on competitive balance
      const recommendations = analysis.recommendations.filter(
        rec => rec.area === 'competitive balance'
      ).slice(0, 3);
      
      // Return the assessment and recommendations
      res.json({
        success: true,
        balanceScore: beforeAssessment.overallBalance,
        assessment: beforeAssessment,
        recommendations,
        message: 'Schedule balance analyzed and recommendations generated'
      });
    } catch (error) {
      logger.error(`Error optimizing for balance: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   GET /api/compass/rating/:teamId
   * @desc    Get team rating with all predictive data
   * @access  Public
   */
  router.get('/rating/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Get predictive analytics component
      const predictiveComponent = compass.getComponents().talent;
      
      if (!predictiveComponent) {
        return res.status(500).json({ error: 'Predictive analytics component not available' });
      }
      
      // Get team rating
      const rating = await predictiveComponent.getTeamRating(teamId);
      
      res.json({
        success: true,
        rating
      });
    } catch (error) {
      logger.error(`Error getting team rating: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   POST /api/compass/predict-game
   * @desc    Predict outcome of a game between two teams
   * @access  Public
   */
  router.post('/predict-game', async (req, res) => {
    try {
      const { team1Id, team2Id, sport, neutralSite } = req.body;
      
      if (!team1Id || !team2Id) {
        return res.status(400).json({ error: 'Both team IDs are required' });
      }
      
      // Get predictive analytics component
      const predictiveComponent = compass.getComponents().talent;
      
      if (!predictiveComponent) {
        return res.status(500).json({ error: 'Predictive analytics component not available' });
      }
      
      // Predict game outcome
      const prediction = await predictiveComponent.predictGameOutcome(
        team1Id, team2Id, sport || 'Basketball', neutralSite || false
      );
      
      res.json({
        success: true,
        prediction
      });
    } catch (error) {
      logger.error(`Error predicting game outcome: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   POST /api/compass/roster-change
   * @desc    Register a roster change for a team
   * @access  Public
   */
  router.post('/roster-change', async (req, res) => {
    try {
      const { teamId, playerName, type, playerRating } = req.body;
      
      if (!teamId || !playerName || !type) {
        return res.status(400).json({ error: 'Team ID, player name, and change type are required' });
      }
      
      if (!['add', 'remove', 'injury', 'return'].includes(type)) {
        return res.status(400).json({ error: 'Invalid change type' });
      }
      
      // Get predictive analytics component
      const predictiveComponent = compass.getComponents().talent;
      
      if (!predictiveComponent) {
        return res.status(500).json({ error: 'Predictive analytics component not available' });
      }
      
      // Register the roster change
      await predictiveComponent.registerRosterChange(teamId, {
        playerName,
        type,
        playerRating: playerRating || 0.5
      });
      
      // Get updated team rating
      const updatedRating = await predictiveComponent.getTeamRating(teamId);
      
      res.json({
        success: true,
        message: `Roster change registered for ${teamId}: ${type} - ${playerName}`,
        ratingImpact: updatedRating.rosterAdjustment,
        updatedRating
      });
    } catch (error) {
      logger.error(`Error registering roster change: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   POST /api/compass/strength-of-schedule
   * @desc    Calculate strength of schedule for a team
   * @access  Public
   */
  router.post('/strength-of-schedule', async (req, res) => {
    try {
      const { teamId, scheduleId } = req.body;
      
      if (!teamId) {
        return res.status(400).json({ error: 'Team ID is required' });
      }
      
      // Get games either from provided schedule or request body
      let games;
      
      if (scheduleId) {
        // Get schedule from database
        const schedule = await app.get('db').Schedule.findByPk(scheduleId, {
          include: [
            { 
              model: app.get('db').Game, 
              as: 'games',
              include: [
                { model: app.get('db').Team, as: 'homeTeam' },
                { model: app.get('db').Team, as: 'awayTeam' }
              ]
            }
          ]
        });
        
        if (!schedule) {
          return res.status(404).json({ error: 'Schedule not found' });
        }
        
        games = schedule.games;
      } else if (req.body.games && Array.isArray(req.body.games)) {
        games = req.body.games;
      } else {
        return res.status(400).json({ error: 'Either scheduleId or games array must be provided' });
      }
      
      // Get predictive analytics component
      const predictiveComponent = compass.getComponents().talent;
      
      if (!predictiveComponent) {
        return res.status(500).json({ error: 'Predictive analytics component not available' });
      }
      
      // Calculate strength of schedule
      const sos = await predictiveComponent.calculateStrengthOfSchedule(games, teamId);
      
      res.json({
        success: true,
        teamId,
        strengthOfSchedule: sos
      });
    } catch (error) {
      logger.error(`Error calculating strength of schedule: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * @route   GET /api/compass/status
   * @desc    Get COMPASS system status
   * @access  Public
   */
  router.get('/status', async (req, res) => {
    try {
      const components = compass.getComponents();
      const componentStatus = {};
      
      for (const [name, component] of Object.entries(components)) {
        componentStatus[name] = {
          initialized: !!component,
          type: component ? component.constructor.name : 'Not Initialized'
        };
      }
      
      res.json({
        success: true,
        status: 'operational',
        version: '1.0.0',
        components: componentStatus,
        lastUpdated: compass.lastUpdated
      });
    } catch (error) {
      logger.error(`Error getting COMPASS status: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Register the router
  app.use('/api/compass', router);
  logger.info('COMPASS endpoints registered');
}

/**
 * Integrate COMPASS with the Advanced Metrics System
 * @param {Object} app - Express app 
 * @param {Object} compass - COMPASS system instance
 */
function integrateCOMPASSWithMetrics(app, compass) {
  try {
    const advancedMetricsSystem = app.get('advancedMetricsSystem');
    
    if (!advancedMetricsSystem) {
      logger.warn('Advanced Metrics System not available for COMPASS integration');
      return;
    }
    
    // Extend Advanced Metrics with COMPASS-specific metrics
    const originalAnalyzeSchedule = advancedMetricsSystem.analyzeSchedule;
    
    // Override the method to add COMPASS data
    advancedMetricsSystem.analyzeSchedule = async function(schedule, options = {}) {
      // Run original analysis
      const metrics = await originalAnalyzeSchedule.call(this, schedule, options);
      
      // Add COMPASS-specific metrics
      try {
        // Get competitive balance component
        const balanceComponent = compass.getComponents().competitive;
        const predictiveComponent = compass.getComponents().talent;
        
        // Initialize compassData in metrics
        metrics.advancedMetrics.compassData = {};
        
        // Add competitive balance data if available
        if (balanceComponent) {
          // Assess competitive balance
          const balanceAssessment = await balanceComponent.assessSchedule(schedule);
          
          // Add balance data to advanced metrics
          metrics.advancedMetrics.compassData.competitiveBalance = {
            overallScore: balanceAssessment.overallBalance,
            strengthOfScheduleBalance: balanceAssessment.strengthOfSchedule.balanceScore,
            homeAwayBalance: balanceAssessment.homeAwayBalance.balanceScore,
            restAdvantageBalance: balanceAssessment.restAdvantage.balanceScore,
            qualityGameDistribution: balanceAssessment.qualityGameDistribution.balanceScore
          };
          
          // Update composite scores
          if (metrics.compositeScores && metrics.compositeScores.competitiveBalanceScore) {
            // Use COMPASS balance score to enhance the competitive balance score
            const originalScore = metrics.compositeScores.competitiveBalanceScore.score;
            const compassScore = balanceAssessment.overallBalance;
            
            // Blend scores (60% COMPASS, 40% original)
            const blendedScore = (compassScore * 0.6) + (originalScore * 0.4);
            
            metrics.compositeScores.competitiveBalanceScore.score = Math.round(blendedScore);
            metrics.compositeScores.competitiveBalanceScore.description = 
              `Enhanced with COMPASS (${compassScore})`;
          }
        }
        
        // Add predictive analytics data if available
        if (predictiveComponent && schedule.teams) {
          // Calculate strength of schedule for each team
          const teamSoSPromises = schedule.teams.map(async (team) => {
            const teamId = team.id || team.team_id;
            return {
              teamId,
              sos: await predictiveComponent.calculateStrengthOfSchedule(schedule.games, teamId)
            };
          });
          
          const teamSoSResults = await Promise.all(teamSoSPromises);
          
          // Add predictive data to metrics
          metrics.advancedMetrics.compassData.predictiveAnalytics = {
            strengthOfSchedule: Object.fromEntries(
              teamSoSResults.map(result => [result.teamId, result.sos])
            )
          };
          
          // Add game predictions for key matchups
          const gamesPredictions = [];
          
          // Get top 5 games by competitiveness
          for (const game of schedule.games.slice(0, 5)) {
            try {
              const homeTeamId = game.homeTeam?.id || game.homeTeam;
              const awayTeamId = game.awayTeam?.id || game.awayTeam;
              
              if (homeTeamId && awayTeamId) {
                const prediction = await predictiveComponent.predictGameOutcome(
                  homeTeamId, awayTeamId, schedule.sport, false
                );
                
                gamesPredictions.push({
                  gameId: game.id,
                  date: game.date,
                  prediction
                });
              }
            } catch (error) {
              logger.warn(`Failed to predict game outcome: ${error.message}`);
              // Continue with other games
            }
          }
          
          // Add game predictions to metrics
          metrics.advancedMetrics.compassData.predictiveAnalytics.gamePredictions = gamesPredictions;
          
          // Enhance performance score with predictive data if available
          if (metrics.compositeScores && metrics.compositeScores.performancePotential) {
            // Get average strength of schedule
            const avgSoS = teamSoSResults.reduce((sum, result) => {
              return sum + result.sos.overallSoS;
            }, 0) / teamSoSResults.length;
            
            // Enhance performance score based on strength of schedule
            const originalScore = metrics.compositeScores.performancePotential.score;
            const enhancementFactor = avgSoS > 0.7 ? 10 : 
                                     avgSoS > 0.6 ? 7 : 
                                     avgSoS > 0.5 ? 3 : 0;
            
            metrics.compositeScores.performancePotential.score = 
              Math.min(100, originalScore + enhancementFactor);
              
            metrics.compositeScores.performancePotential.description = 
              `Enhanced with COMPASS Predictive Analytics (SoS: ${(avgSoS * 100).toFixed(0)})`;
          }
        }
      } catch (error) {
        logger.warn(`COMPASS integration with metrics failed: ${error.message}`);
        // Continue with original metrics
      }
      
      return metrics;
    };
    
    logger.info('COMPASS integrated with Advanced Metrics System');
  } catch (error) {
    logger.error(`Failed to integrate COMPASS with metrics: ${error.message}`);
  }
}

module.exports = {
  initializeCOMPASS,
  registerCOMPASSEndpoints,
  integrateCOMPASSWithMetrics
};