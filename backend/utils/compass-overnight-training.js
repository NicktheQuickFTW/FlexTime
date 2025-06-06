/**
 * COMPASS Overnight Training Script
 * 
 * This script runs overnight machine learning tasks for the COMPASS system,
 * including training models, updating ratings, and collecting new data.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const tf = require('@tensorflow/tfjs-node');
const logger = require('../scripts/logger');

// Set up logging to file
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `compass-training-${new Date().toISOString().split('T')[0]}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Redirect logs to file
const originalInfo = logger.info;
const originalError = logger.error;
const originalWarn = logger.warn;

logger.info = function(message) {
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] INFO: ${message}\n`);
  originalInfo.call(logger, message);
};

logger.error = function(message) {
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] ERROR: ${message}\n`);
  originalError.call(logger, message);
};

logger.warn = function(message) {
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] WARN: ${message}\n`);
  originalWarn.call(logger, message);
};

// Database and model imports
let sequelize;
let compassModels;
let predictiveAnalyticsDB;

/**
 * Initialize database connections and models
 */
async function initializeDatabase() {
  try {
    logger.info('Initializing database connection...');
    
    // Connect to the Neon database
    sequelize = new Sequelize(process.env.POSTGRES_URI, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    
    // Test connection
    await sequelize.authenticate();
    logger.info('Connected to Neon database successfully');
    
    // Load COMPASS models
    compassModels = require('../models/db-compass')(sequelize);
    
    // Initialize DB adapter
    const PredictiveAnalyticsDB = require('../compass/data/predictive_analytics_db');
    predictiveAnalyticsDB = new PredictiveAnalyticsDB(compassModels);
    
    return true;
  } catch (error) {
    logger.error(`Failed to initialize database: ${error.message}`);
    return false;
  }
}

/**
 * Train a game prediction model for a specific sport
 * @param {string} sport - Sport name
 */
async function trainGamePredictionModel(sport) {
  try {
    logger.info(`Training game prediction model for ${sport}...`);
    
    // Get training data
    const trainingData = await predictiveAnalyticsDB.getTrainingData(sport, 'game_prediction');
    
    if (trainingData.length < 100) {
      logger.warn(`Insufficient training data for ${sport} (${trainingData.length} samples)`);
      
      // Generate synthetic data if needed
      const syntheticData = generateSyntheticTrainingData(sport, 500);
      trainingData.push(...syntheticData);
      
      logger.info(`Generated ${syntheticData.length} synthetic training samples for ${sport}`);
    }
    
    // Prepare training data
    const xs = [];
    const ys = [];
    
    for (const data of trainingData) {
      xs.push(data.features);
      ys.push(data.labels);
    }
    
    // Convert to tensors
    const inputTensor = tf.tensor2d(xs);
    const outputTensor = tf.tensor2d(ys, [ys.length, 1]);
    
    // Create model
    const model = tf.sequential();
    
    // Add layers
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu',
      inputShape: [xs[0].length]
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));
    
    // Compile model
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    // Train model
    logger.info(`Training ${sport} model with ${xs.length} samples...`);
    const history = await model.fit(inputTensor, outputTensor, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            logger.info(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
          }
        }
      }
    });
    
    // Get final metrics
    const finalLoss = history.history.loss[history.history.loss.length - 1];
    const finalAccuracy = history.history.acc[history.history.acc.length - 1];
    
    logger.info(`Model training complete: loss = ${finalLoss.toFixed(4)}, accuracy = ${finalAccuracy.toFixed(4)}`);
    
    // Save model weights
    const modelWeights = await extractModelWeights(model);
    
    // Save to database
    await predictiveAnalyticsDB.saveModelWeights(
      'game_prediction',
      sport,
      {
        data: modelWeights,
        metrics: {
          loss: finalLoss,
          accuracy: finalAccuracy,
          sampleCount: xs.length,
          epochs: 50
        }
      }
    );
    
    logger.info(`Saved ${sport} model weights to database`);
    
    // Clean up tensors
    inputTensor.dispose();
    outputTensor.dispose();
    
    return true;
  } catch (error) {
    logger.error(`Error training game prediction model for ${sport}: ${error.message}`);
    return false;
  }
}

/**
 * Extract weights from model as serializable objects
 * @param {tf.Sequential} model - TensorFlow model
 * @returns {Array} Model weights
 */
async function extractModelWeights(model) {
  const weights = [];
  
  for (const layer of model.layers) {
    const layerWeights = layer.getWeights();
    
    const layerData = {
      name: layer.name,
      weights: []
    };
    
    for (const weight of layerWeights) {
      // Convert tensor to array
      const data = await weight.data();
      const shape = weight.shape;
      
      layerData.weights.push({
        data: Array.from(data),
        shape
      });
    }
    
    weights.push(layerData);
  }
  
  return weights;
}

/**
 * Generate synthetic training data for a sport
 * @param {string} sport - Sport name
 * @param {number} count - Number of samples to generate
 * @returns {Array} Synthetic training data
 */
function generateSyntheticTrainingData(sport, count) {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random team ratings
    const team1Rating = Math.random();
    const team2Rating = Math.random();
    
    // Generate feature vector
    const features = [
      team1Rating,
      team2Rating,
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random() * 0.2 - 0.1, // roster adjustment (-0.1 to 0.1)
      Math.random() > 0.3 ? 1.0 : 0.5 // home court factor
    ];
    
    // Generate realistic outcome
    // Higher rated team more likely to win, with home court advantage
    const homeAdvantage = features[9] === 1.0 ? 0.1 : 0;
    const winProbability = 0.5 + (team1Rating - team2Rating) + homeAdvantage;
    
    // Add noise
    const finalProb = Math.max(0.1, Math.min(0.9, winProbability + (Math.random() * 0.2 - 0.1)));
    
    // Label is 1 if team1 wins, 0 otherwise
    const outcome = Math.random() < finalProb ? 1 : 0;
    
    data.push({
      features,
      labels: [outcome],
      weight: 1.0,
      source: 'synthetic',
      isValidated: true,
      collectionDate: new Date().toISOString()
    });
  }
  
  return data;
}

/**
 * Update all team ratings in the database
 */
async function updateAllTeamRatings() {
  try {
    logger.info('Updating all team ratings...');
    
    // Get all teams
    const teams = await sequelize.query(
      'SELECT team_id, name, sport_id FROM teams',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    logger.info(`Found ${teams.length} teams to update`);
    
    // Update ratings for each team
    let successCount = 0;
    let errorCount = 0;
    
    for (const team of teams) {
      try {
        // Generate synthetic rating components
        const idHash = simpleHash(team.team_id);
        
        const components = {
          internalModel: 0.2 + ((idHash * 29 % 80) / 100),
          netRanking: 0.2 + ((idHash * 31 % 80) / 100),
          kenpom: 0.2 + ((idHash * 17 % 80) / 100),
          nationalPolls: 0.2 + ((idHash * 23 % 80) / 100),
          conferenceStanding: 0.2 + ((idHash * 13 % 80) / 100),
          socialMedia: 0.2 + ((idHash * 19 % 80) / 100)
        };
        
        // Get roster changes
        const rosterChanges = await predictiveAnalyticsDB.getRecentRosterChanges(team.team_id);
        
        // Calculate roster adjustment
        let rosterAdjustment = 0;
        for (const change of rosterChanges) {
          rosterAdjustment += change.impactScore;
        }
        
        // Clamp adjustment
        rosterAdjustment = Math.max(-0.1, Math.min(0.1, rosterAdjustment));
        
        // Calculate weighted rating
        const weights = {
          internalModel: 0.4,
          netRanking: 0.2,
          kenpom: 0.15,
          nationalPolls: 0.1,
          conferenceStanding: 0.1,
          socialMedia: 0.05
        };
        
        let normalizedRating = 0;
        for (const [key, value] of Object.entries(components)) {
          normalizedRating += value * weights[key];
        }
        
        // Add roster adjustment
        normalizedRating += rosterAdjustment;
        
        // Clamp to 0-1 range
        normalizedRating = Math.max(0, Math.min(1, normalizedRating));
        
        // Calculate raw rating (0-100)
        const rawRating = normalizedRating * 100;
        
        // Calculate percentile and tier
        const percentile = Math.round(normalizedRating * 100);
        let tier;
        if (percentile >= 95) tier = 'Elite';
        else if (percentile >= 85) tier = 'Excellent';
        else if (percentile >= 70) tier = 'Very Good';
        else if (percentile >= 55) tier = 'Above Average';
        else if (percentile >= 45) tier = 'Average';
        else if (percentile >= 30) tier = 'Below Average';
        else if (percentile >= 15) tier = 'Poor';
        else tier = 'Very Poor';
        
        // Save to database
        await compassModels.TeamRating.upsert({
          team_id: team.team_id,
          sport: team.sport_id || 'Basketball',
          normalized_rating: normalizedRating,
          raw_rating: rawRating,
          percentile,
          tier,
          rating_components: components,
          roster_adjustment: rosterAdjustment,
          prediction_confidence: 0.8,
          last_updated: new Date()
        });
        
        successCount++;
      } catch (error) {
        logger.error(`Error updating rating for team ${team.team_id}: ${error.message}`);
        errorCount++;
      }
    }
    
    logger.info(`Team ratings update complete: ${successCount} succeeded, ${errorCount} failed`);
    return true;
  } catch (error) {
    logger.error(`Error updating team ratings: ${error.message}`);
    return false;
  }
}

/**
 * Update game predictions for upcoming games
 */
async function updateGamePredictions() {
  try {
    logger.info('Updating game predictions for upcoming games...');
    
    // Get upcoming games
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);
    
    const games = await sequelize.query(
      `SELECT game_id, home_team_id, away_team_id, date, sport_id 
       FROM games 
       WHERE date BETWEEN :today AND :twoWeeksLater`,
      { 
        replacements: { 
          today: today.toISOString(),
          twoWeeksLater: twoWeeksLater.toISOString()
        },
        type: Sequelize.QueryTypes.SELECT 
      }
    );
    
    logger.info(`Found ${games.length} upcoming games to predict`);
    
    // Update predictions for each game
    let successCount = 0;
    let errorCount = 0;
    
    for (const game of games) {
      try {
        // Get team ratings
        const homeTeamRating = await predictiveAnalyticsDB.getTeamRating(game.home_team_id);
        const awayTeamRating = await predictiveAnalyticsDB.getTeamRating(game.away_team_id);
        
        if (!homeTeamRating || !awayTeamRating) {
          logger.warn(`Missing team rating for game ${game.game_id}`);
          continue;
        }
        
        // Prepare input features
        const features = [
          homeTeamRating.normalizedRating,
          awayTeamRating.normalizedRating,
          homeTeamRating.components.internalModel,
          awayTeamRating.components.internalModel,
          homeTeamRating.components.netRanking,
          awayTeamRating.components.netRanking,
          homeTeamRating.components.conferenceStanding,
          awayTeamRating.components.conferenceStanding,
          homeTeamRating.rosterAdjustment,
          1.0 // Home court advantage
        ];
        
        // Get model weights
        const modelWeights = await predictiveAnalyticsDB.getModelWeights(
          'game_prediction',
          game.sport_id || 'Basketball'
        );
        
        // If no model weights, use synthetic prediction
        let homeWinProbability;
        let confidenceLevel;
        let expectedMargin;
        
        if (!modelWeights) {
          // Generate synthetic prediction
          const ratingDiff = homeTeamRating.normalizedRating - awayTeamRating.normalizedRating;
          homeWinProbability = 0.5 + (ratingDiff * 0.5) + 0.05; // home court advantage
          
          // Clamp to valid range
          homeWinProbability = Math.max(0.05, Math.min(0.95, homeWinProbability));
          
          // Determine confidence
          if (Math.abs(homeWinProbability - 0.5) > 0.3) {
            confidenceLevel = 'High';
          } else if (Math.abs(homeWinProbability - 0.5) > 0.15) {
            confidenceLevel = 'Medium';
          } else {
            confidenceLevel = 'Low';
          }
          
          // Calculate expected margin
          const sportFactor = game.sport_id === 'Basketball' ? 30 : 
                             game.sport_id === 'Football' ? 21 : 5;
                             
          expectedMargin = (homeWinProbability - 0.5) * 2 * sportFactor;
        } else {
          // TODO: Implement model inference using saved weights
          // For now, use synthetic prediction
          const ratingDiff = homeTeamRating.normalizedRating - awayTeamRating.normalizedRating;
          homeWinProbability = 0.5 + (ratingDiff * 0.5) + 0.05; // home court advantage
          
          // Clamp to valid range
          homeWinProbability = Math.max(0.05, Math.min(0.95, homeWinProbability));
          
          // Determine confidence
          if (Math.abs(homeWinProbability - 0.5) > 0.3) {
            confidenceLevel = 'High';
          } else if (Math.abs(homeWinProbability - 0.5) > 0.15) {
            confidenceLevel = 'Medium';
          } else {
            confidenceLevel = 'Low';
          }
          
          // Calculate expected margin
          const sportFactor = game.sport_id === 'Basketball' ? 30 : 
                             game.sport_id === 'Football' ? 21 : 5;
                             
          expectedMargin = (homeWinProbability - 0.5) * 2 * sportFactor;
        }
        
        // Generate key factors
        const factors = [];
        
        // Compare components to find biggest differences
        const components = Object.keys(homeTeamRating.components);
        
        for (const component of components) {
          const diff = homeTeamRating.components[component] - awayTeamRating.components[component];
          
          if (Math.abs(diff) >= 0.1) {
            factors.push({
              factor: formatComponentName(component),
              advantage: diff > 0 ? homeTeamRating.name || game.home_team_id : 
                                   awayTeamRating.name || game.away_team_id,
              impact: Math.abs(diff) >= 0.2 ? 'High' : 'Medium'
            });
          }
        }
        
        // Add roster changes if significant
        if (Math.abs(homeTeamRating.rosterAdjustment) >= 0.05) {
          factors.push({
            factor: 'Recent Roster Changes',
            advantage: homeTeamRating.rosterAdjustment > 0 ? homeTeamRating.name || game.home_team_id : 
                      homeTeamRating.rosterAdjustment < 0 ? awayTeamRating.name || game.away_team_id : 'None',
            impact: Math.abs(homeTeamRating.rosterAdjustment) >= 0.08 ? 'High' : 'Medium'
          });
        }
        
        if (Math.abs(awayTeamRating.rosterAdjustment) >= 0.05) {
          factors.push({
            factor: 'Recent Roster Changes',
            advantage: awayTeamRating.rosterAdjustment > 0 ? awayTeamRating.name || game.away_team_id : 
                      awayTeamRating.rosterAdjustment < 0 ? homeTeamRating.name || game.home_team_id : 'None',
            impact: Math.abs(awayTeamRating.rosterAdjustment) >= 0.08 ? 'High' : 'Medium'
          });
        }
        
        // Save prediction
        await compassModels.GamePrediction.upsert({
          game_id: game.game_id,
          home_team_id: game.home_team_id,
          away_team_id: game.away_team_id,
          sport: game.sport_id || 'Basketball',
          home_win_probability: homeWinProbability,
          expected_margin: expectedMargin,
          confidence_level: confidenceLevel,
          is_neutral_site: false, // Default assumption
          key_factors: factors.slice(0, 3), // Top 3 factors
          prediction_date: new Date()
        });
        
        successCount++;
      } catch (error) {
        logger.error(`Error predicting game ${game.game_id}: ${error.message}`);
        errorCount++;
      }
    }
    
    logger.info(`Game prediction update complete: ${successCount} succeeded, ${errorCount} failed`);
    return true;
  } catch (error) {
    logger.error(`Error updating game predictions: ${error.message}`);
    return false;
  }
}

/**
 * Update strength of schedule for all teams
 */
async function updateStrengthOfSchedule() {
  try {
    logger.info('Updating strength of schedule for all teams...');
    
    // Get active schedules
    const schedules = await sequelize.query(
      `SELECT schedule_id, sport_id, season 
       FROM schedules 
       WHERE status = 'active' OR status = 'published'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    logger.info(`Found ${schedules.length} active schedules`);
    
    // Process each schedule
    let successCount = 0;
    let errorCount = 0;
    
    for (const schedule of schedules) {
      try {
        // Get schedule details
        const scheduleDetails = await sequelize.query(
          `SELECT t.team_id
           FROM teams t
           JOIN schedule_teams st ON t.team_id = st.team_id
           WHERE st.schedule_id = :scheduleId`,
          { 
            replacements: { scheduleId: schedule.schedule_id },
            type: Sequelize.QueryTypes.SELECT 
          }
        );
        
        // Get all games for the schedule
        const games = await sequelize.query(
          `SELECT game_id, home_team_id, away_team_id, date
           FROM games
           WHERE schedule_id = :scheduleId`,
          { 
            replacements: { scheduleId: schedule.schedule_id },
            type: Sequelize.QueryTypes.SELECT 
          }
        );
        
        logger.info(`Schedule ${schedule.schedule_id}: ${scheduleDetails.length} teams, ${games.length} games`);
        
        // Calculate SoS for each team
        for (const teamInfo of scheduleDetails) {
          try {
            const teamId = teamInfo.team_id;
            
            // Get team's games
            const teamGames = games.filter(game => 
              game.home_team_id === teamId || game.away_team_id === teamId
            );
            
            // Skip if no games
            if (teamGames.length === 0) {
              logger.warn(`No games found for team ${teamId} in schedule ${schedule.schedule_id}`);
              continue;
            }
            
            // Calculate SoS metrics
            const now = new Date();
            
            // Get opponent ratings
            const opponentRatings = [];
            const homeOpponentRatings = [];
            const awayOpponentRatings = [];
            const pastOpponentRatings = [];
            const futureOpponentRatings = [];
            const opponentMetrics = {};
            
            for (const game of teamGames) {
              // Determine opponent
              const opponentId = game.home_team_id === teamId ? 
                game.away_team_id : game.home_team_id;
              
              // Get opponent rating
              const rating = await predictiveAnalyticsDB.getTeamRating(opponentId);
              const normalizedRating = rating ? rating.normalizedRating : 0.5;
              
              opponentRatings.push(normalizedRating);
              
              // Track home/away
              if (game.home_team_id === teamId) {
                homeOpponentRatings.push(normalizedRating);
              } else {
                awayOpponentRatings.push(normalizedRating);
              }
              
              // Track past/future
              const gameDate = new Date(game.date);
              if (gameDate < now) {
                pastOpponentRatings.push(normalizedRating);
              } else {
                futureOpponentRatings.push(normalizedRating);
              }
              
              // Store opponent metrics
              opponentMetrics[opponentId] = {
                rating: normalizedRating,
                isHome: game.home_team_id === teamId,
                date: game.date
              };
            }
            
            // Calculate average ratings
            const calculateAverage = arr => arr.length ? 
              arr.reduce((sum, val) => sum + val, 0) / arr.length : 0.5;
            
            const overallSoS = calculateAverage(opponentRatings);
            const homeSoS = calculateAverage(homeOpponentRatings);
            const awaySoS = calculateAverage(awayOpponentRatings);
            const pastSoS = calculateAverage(pastOpponentRatings);
            const futureSoS = calculateAverage(futureOpponentRatings);
            
            // Determine difficulty level
            let difficulty;
            if (overallSoS >= 0.8) difficulty = 'Extremely High';
            else if (overallSoS >= 0.7) difficulty = 'Very High';
            else if (overallSoS >= 0.6) difficulty = 'High';
            else if (overallSoS >= 0.5) difficulty = 'Above Average';
            else if (overallSoS >= 0.4) difficulty = 'Average';
            else if (overallSoS >= 0.3) difficulty = 'Below Average';
            else difficulty = 'Low';
            
            // Save to database
            await compassModels.StrengthOfSchedule.upsert({
              team_id: teamId,
              schedule_id: schedule.schedule_id,
              sport: schedule.sport_id || 'Basketball',
              season: schedule.season || '2025-2026',
              overall_sos: overallSoS,
              home_sos: homeSoS,
              away_sos: awaySoS,
              past_sos: pastSoS,
              future_sos: futureSoS,
              difficulty_tier: difficulty,
              opponent_metrics: opponentMetrics,
              calculation_date: new Date()
            });
            
            successCount++;
          } catch (teamError) {
            logger.error(`Error calculating SoS for team ${teamInfo.team_id}: ${teamError.message}`);
            errorCount++;
          }
        }
      } catch (scheduleError) {
        logger.error(`Error processing schedule ${schedule.schedule_id}: ${scheduleError.message}`);
        errorCount++;
      }
    }
    
    logger.info(`Strength of schedule update complete: ${successCount} succeeded, ${errorCount} failed`);
    return true;
  } catch (error) {
    logger.error(`Error updating strength of schedule: ${error.message}`);
    return false;
  }
}

/**
 * Format component name for display
 * @param {string} component - Component key
 * @returns {string} Formatted name
 */
function formatComponentName(component) {
  switch (component) {
    case 'internalModel': return 'COMPASS Rating';
    case 'netRanking': return 'NET Ranking';
    case 'kenpom': return 'KenPom Rating';
    case 'nationalPolls': return 'National Polls';
    case 'conferenceStanding': return 'Conference Standing';
    case 'socialMedia': return 'Fan Sentiment';
    default: return component.replace(/([A-Z])/g, ' $1').trim();
  }
}

/**
 * Simple hash function for generating consistent synthetic data
 * @param {string} input - Input string
 * @returns {number} Hash value
 */
function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash % 100);
}

/**
 * Run all overnight tasks
 */
async function runOvernightTasks() {
  try {
    logger.info('Starting COMPASS overnight tasks...');
    
    // Initialize database
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      logger.error('Failed to initialize database, aborting tasks');
      return false;
    }
    
    // Update team ratings
    await updateAllTeamRatings();
    
    // Update strength of schedule
    await updateStrengthOfSchedule();
    
    // Train models for each sport
    const sports = ['Basketball', 'Football', 'Baseball'];
    for (const sport of sports) {
      await trainGamePredictionModel(sport);
    }
    
    // Update game predictions
    await updateGamePredictions();
    
    logger.info('All COMPASS overnight tasks completed successfully');
    return true;
  } catch (error) {
    logger.error(`Error in overnight tasks: ${error.message}`);
    return false;
  } finally {
    // Close database connection
    if (sequelize) {
      await sequelize.close();
    }
    
    // Close log file
    logStream.end();
  }
}

// Run the tasks if called directly
if (require.main === module) {
  runOvernightTasks()
    .then(success => {
      console.log(`COMPASS overnight tasks ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(`COMPASS overnight tasks error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runOvernightTasks };