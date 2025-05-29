/**
 * COMPASS Predictive Model Trainer
 * 
 * This module handles the overnight training of neural network models for
 * predictive analytics in the COMPASS system. It uses TensorFlow.js to create,
 * train, and save models for game prediction, team rating, and other analytics.
 */

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PredictiveModelTrainer {
  /**
   * Create a new predictive model trainer
   * @param {Object} db - Database connection (null for file-based storage)
   * @param {Object} options - Configuration options
   */
  constructor(db, options = {}) {
    this.db = db;
    this.options = {
      modelDirectory: path.join(__dirname, '../../data/compass/models'),
      historyDirectory: path.join(__dirname, '../../data/compass/training_history'),
      batchSize: 32,
      epochs: 50,
      validationSplit: 0.2,
      useNeonDB: process.env.USE_NEON_DB === 'true',
      neonConnectionString: process.env.NEON_DB_CONNECTION_STRING,
      ...options
    };

    // Create directories if they don't exist
    if (!fs.existsSync(this.options.modelDirectory)) {
      fs.mkdirSync(this.options.modelDirectory, { recursive: true });
    }

    if (!fs.existsSync(this.options.historyDirectory)) {
      fs.mkdirSync(this.options.historyDirectory, { recursive: true });
    }

    // Initialize Neon DB connection if enabled
    if (this.options.useNeonDB && this.options.neonConnectionString) {
      const { Pool } = require('pg');
      this.neonClient = new Pool({
        connectionString: this.options.neonConnectionString,
        ssl: {
          rejectUnauthorized: false
        }
      });
      logger.info('Neon DB connection initialized for model training');
    } else {
      logger.info('Using file-based storage for model training');
    }

    logger.info('Predictive Model Trainer initialized');
  }
  
  /**
   * Train all models
   * @returns {Promise<Object>} Training results
   */
  async trainAllModels() {
    try {
      logger.info('Starting overnight model training');
      
      const startTime = Date.now();
      const results = {
        gamePredictor: await this.trainGamePredictionModel(),
        teamRating: await this.trainTeamRatingModel(),
        playerImpact: await this.trainPlayerImpactModel(),
        strengthOfSchedule: await this.trainStrengthOfScheduleModel(),
        trainingTime: 0
      };
      
      results.trainingTime = (Date.now() - startTime) / 1000;
      
      logger.info(`Completed overnight model training in ${results.trainingTime} seconds`);
      return results;
    } catch (error) {
      logger.error(`Error in overnight model training: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Train game prediction model
   * @returns {Promise<Object>} Training results
   */
  async trainGamePredictionModel() {
    try {
      logger.info('Training game prediction model');
      
      // Load training data
      const trainingData = await this._loadGamePredictionData();
      
      if (!trainingData || trainingData.inputs.length === 0) {
        logger.warn('No game prediction training data available');
        return { success: false, reason: 'No training data' };
      }
      
      // Prepare the datasets
      const { inputs, outputs } = trainingData;
      
      const inputTensor = tf.tensor2d(inputs);
      const outputTensor = tf.tensor2d(outputs);
      
      // Build the model
      const model = tf.sequential();
      
      // Input layer
      model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        inputShape: [inputs[0].length]
      }));
      
      // Hidden layers
      model.add(tf.layers.dropout({ rate: 0.3 }));
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      
      // Output layer
      model.add(tf.layers.dense({
        units: outputs[0].length,
        activation: 'sigmoid'
      }));
      
      // Compile the model
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['accuracy']
      });
      
      // Train the model
      const history = await model.fit(inputTensor, outputTensor, {
        epochs: this.options.epochs,
        batchSize: this.options.batchSize,
        validationSplit: this.options.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug(`Game prediction model - Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
          }
        }
      });
      
      // Save the model
      const modelId = `game_prediction_${new Date().toISOString().split('T')[0]}`;
      const modelPath = path.join(this.options.modelDirectory, modelId);
      await model.save(`file://${modelPath}`);
      
      // Save training history
      const historyPath = path.join(this.options.historyDirectory, `${modelId}_history.json`);
      fs.writeFileSync(historyPath, JSON.stringify(history.history, null, 2));
      
      // Clean up memory
      tf.dispose([inputTensor, outputTensor, model]);
      
      logger.info(`Game prediction model training complete. Model saved to ${modelPath}`);
      
      return {
        success: true,
        modelId,
        modelPath,
        historyPath,
        epochs: history.epoch.length,
        finalLoss: history.history.loss[history.epoch.length - 1],
        finalAccuracy: history.history.acc[history.epoch.length - 1]
      };
    } catch (error) {
      logger.error(`Error training game prediction model: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Train team rating model
   * @returns {Promise<Object>} Training results
   */
  async trainTeamRatingModel() {
    try {
      logger.info('Training team rating model');
      
      // Load training data
      const trainingData = await this._loadTeamRatingData();
      
      if (!trainingData || trainingData.inputs.length === 0) {
        logger.warn('No team rating training data available');
        return { success: false, reason: 'No training data' };
      }
      
      // Prepare the datasets
      const { inputs, outputs } = trainingData;
      
      const inputTensor = tf.tensor2d(inputs);
      const outputTensor = tf.tensor2d(outputs);
      
      // Build the model
      const model = tf.sequential();
      
      // Input layer
      model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        inputShape: [inputs[0].length]
      }));
      
      // Hidden layers
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
      
      // Output layer
      model.add(tf.layers.dense({
        units: outputs[0].length,
        activation: 'linear'
      }));
      
      // Compile the model
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
      
      // Train the model
      const history = await model.fit(inputTensor, outputTensor, {
        epochs: this.options.epochs,
        batchSize: this.options.batchSize,
        validationSplit: this.options.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug(`Team rating model - Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      });
      
      // Save the model
      const modelId = `team_rating_${new Date().toISOString().split('T')[0]}`;
      const modelPath = path.join(this.options.modelDirectory, modelId);
      await model.save(`file://${modelPath}`);
      
      // Save training history
      const historyPath = path.join(this.options.historyDirectory, `${modelId}_history.json`);
      fs.writeFileSync(historyPath, JSON.stringify(history.history, null, 2));
      
      // Clean up memory
      tf.dispose([inputTensor, outputTensor, model]);
      
      logger.info(`Team rating model training complete. Model saved to ${modelPath}`);
      
      return {
        success: true,
        modelId,
        modelPath,
        historyPath,
        epochs: history.epoch.length,
        finalLoss: history.history.loss[history.epoch.length - 1]
      };
    } catch (error) {
      logger.error(`Error training team rating model: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Train player impact model
   * @returns {Promise<Object>} Training results
   */
  async trainPlayerImpactModel() {
    try {
      logger.info('Training player impact model');
      
      // Load training data
      const trainingData = await this._loadPlayerImpactData();
      
      if (!trainingData || trainingData.inputs.length === 0) {
        logger.warn('No player impact training data available');
        return { success: false, reason: 'No training data' };
      }
      
      // Prepare the datasets
      const { inputs, outputs } = trainingData;
      
      const inputTensor = tf.tensor2d(inputs);
      const outputTensor = tf.tensor2d(outputs);
      
      // Build the model
      const model = tf.sequential();
      
      // Input layer
      model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        inputShape: [inputs[0].length]
      }));
      
      // Hidden layers
      model.add(tf.layers.dropout({ rate: 0.3 }));
      model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      
      // Output layer
      model.add(tf.layers.dense({
        units: outputs[0].length,
        activation: 'linear'
      }));
      
      // Compile the model
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
      
      // Train the model
      const history = await model.fit(inputTensor, outputTensor, {
        epochs: this.options.epochs,
        batchSize: this.options.batchSize,
        validationSplit: this.options.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug(`Player impact model - Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      });
      
      // Save the model
      const modelId = `player_impact_${new Date().toISOString().split('T')[0]}`;
      const modelPath = path.join(this.options.modelDirectory, modelId);
      await model.save(`file://${modelPath}`);
      
      // Save training history
      const historyPath = path.join(this.options.historyDirectory, `${modelId}_history.json`);
      fs.writeFileSync(historyPath, JSON.stringify(history.history, null, 2));
      
      // Clean up memory
      tf.dispose([inputTensor, outputTensor, model]);
      
      logger.info(`Player impact model training complete. Model saved to ${modelPath}`);
      
      return {
        success: true,
        modelId,
        modelPath,
        historyPath,
        epochs: history.epoch.length,
        finalLoss: history.history.loss[history.epoch.length - 1]
      };
    } catch (error) {
      logger.error(`Error training player impact model: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Train strength of schedule model
   * @returns {Promise<Object>} Training results
   */
  async trainStrengthOfScheduleModel() {
    try {
      logger.info('Training strength of schedule model');
      
      // Load training data
      const trainingData = await this._loadStrengthOfScheduleData();
      
      if (!trainingData || trainingData.inputs.length === 0) {
        logger.warn('No strength of schedule training data available');
        return { success: false, reason: 'No training data' };
      }
      
      // Prepare the datasets
      const { inputs, outputs } = trainingData;
      
      const inputTensor = tf.tensor2d(inputs);
      const outputTensor = tf.tensor2d(outputs);
      
      // Build the model
      const model = tf.sequential();
      
      // Input layer
      model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        inputShape: [inputs[0].length]
      }));
      
      // Hidden layers
      model.add(tf.layers.dropout({ rate: 0.2 }));
      model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
      
      // Output layer
      model.add(tf.layers.dense({
        units: outputs[0].length,
        activation: 'linear'
      }));
      
      // Compile the model
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });
      
      // Train the model
      const history = await model.fit(inputTensor, outputTensor, {
        epochs: this.options.epochs,
        batchSize: this.options.batchSize,
        validationSplit: this.options.validationSplit,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            logger.debug(`Strength of schedule model - Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
          }
        }
      });
      
      // Save the model
      const modelId = `strength_of_schedule_${new Date().toISOString().split('T')[0]}`;
      const modelPath = path.join(this.options.modelDirectory, modelId);
      await model.save(`file://${modelPath}`);
      
      // Save training history
      const historyPath = path.join(this.options.historyDirectory, `${modelId}_history.json`);
      fs.writeFileSync(historyPath, JSON.stringify(history.history, null, 2));
      
      // Clean up memory
      tf.dispose([inputTensor, outputTensor, model]);
      
      logger.info(`Strength of schedule model training complete. Model saved to ${modelPath}`);
      
      return {
        success: true,
        modelId,
        modelPath,
        historyPath,
        epochs: history.epoch.length,
        finalLoss: history.history.loss[history.epoch.length - 1]
      };
    } catch (error) {
      logger.error(`Error training strength of schedule model: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Load game prediction training data
   * @returns {Promise<Object>} Training data
   * @private
   */
  async _loadGamePredictionData() {
    try {
      logger.info('Loading game prediction training data');
      
      // In a real implementation, this would load from a database
      // For this prototype, we'll use mock data
      
      const inputs = [];
      const outputs = [];
      
      // Generate mock training data
      // Input features: [team1_rating, team2_rating, team1_home, neutral_site, days_rest_team1, days_rest_team2, ...]
      // Output: [team1_win_probability, expected_point_difference]
      
      for (let i = 0; i < 1000; i++) {
        // Team ratings (0-100)
        const team1Rating = Math.random() * 100;
        const team2Rating = Math.random() * 100;
        
        // Home court advantage
        const team1Home = Math.random() > 0.5 ? 1 : 0;
        const neutralSite = team1Home === 0 ? (Math.random() > 0.8 ? 1 : 0) : 0;
        
        // Rest days
        const daysRestTeam1 = Math.floor(Math.random() * 7);
        const daysRestTeam2 = Math.floor(Math.random() * 7);
        
        // Recent form (last 5 games win %)
        const team1Form = Math.random();
        const team2Form = Math.random();
        
        // Injury impact (0-20)
        const team1InjuryImpact = Math.random() * 20;
        const team2InjuryImpact = Math.random() * 20;
        
        // Create input vector
        inputs.push([
          team1Rating / 100, // Normalize to 0-1
          team2Rating / 100,
          team1Home,
          neutralSite,
          daysRestTeam1 / 7, // Normalize to 0-1
          daysRestTeam2 / 7,
          team1Form,
          team2Form,
          team1InjuryImpact / 20, // Normalize to 0-1
          team2InjuryImpact / 20
        ]);
        
        // Calculate win probability based on inputs
        // This is a simplified model for generating mock data
        let winProbability = 0.5 + (team1Rating - team2Rating) / 200; // Base on rating difference
        
        // Adjust for home court advantage
        if (team1Home === 1) winProbability += 0.1;
        if (neutralSite === 1) winProbability -= 0.05;
        
        // Adjust for rest days
        winProbability += (daysRestTeam1 - daysRestTeam2) * 0.01;
        
        // Adjust for form
        winProbability += (team1Form - team2Form) * 0.05;
        
        // Adjust for injury impact
        winProbability -= (team1InjuryImpact - team2InjuryImpact) * 0.005;
        
        // Clamp probability between 0.05 and 0.95
        winProbability = Math.max(0.05, Math.min(0.95, winProbability));
        
        // Calculate expected point difference
        // This is a simplified model for generating mock data
        const pointDifference = (winProbability - 0.5) * 30;
        
        // Normalize point difference to -1 to 1 range (assuming max 30 point difference)
        const normalizedPointDiff = pointDifference / 30;
        
        outputs.push([winProbability, normalizedPointDiff]);
      }
      
      logger.info(`Loaded ${inputs.length} game prediction training examples`);
      
      return { inputs, outputs };
    } catch (error) {
      logger.error(`Error loading game prediction data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load team rating training data
   * @returns {Promise<Object>} Training data
   * @private
   */
  async _loadTeamRatingData() {
    try {
      logger.info('Loading team rating training data');
      
      // In a real implementation, this would load from a database
      // For this prototype, we'll use mock data
      
      const inputs = [];
      const outputs = [];
      
      // Generate mock training data
      // Input features: [offensive_efficiency, defensive_efficiency, tempo, strength_of_schedule, ...]
      // Output: [overall_rating, offensive_rating, defensive_rating, efficiency_rating]
      
      for (let i = 0; i < 1000; i++) {
        // Team stats
        const offEfficiency = 0.8 + Math.random() * 0.4; // 0.8-1.2
        const defEfficiency = 0.8 + Math.random() * 0.4; // 0.8-1.2
        const tempo = 60 + Math.random() * 20; // 60-80 possessions
        const strengthOfSchedule = Math.random() * 2 - 1; // -1 to 1
        const winPercentage = Math.random();
        const homeWinPercentage = Math.random();
        const awayWinPercentage = Math.random();
        const pointsPerGame = 60 + Math.random() * 30; // 60-90
        const pointsAllowedPerGame = 60 + Math.random() * 30; // 60-90
        const reboundMargin = Math.random() * 10 - 5; // -5 to 5
        
        // Create input vector
        inputs.push([
          offEfficiency,
          defEfficiency,
          tempo / 80, // Normalize to 0-1
          strengthOfSchedule / 2 + 0.5, // Normalize to 0-1
          winPercentage,
          homeWinPercentage,
          awayWinPercentage,
          pointsPerGame / 90, // Normalize to 0-1
          pointsAllowedPerGame / 90, // Normalize to 0-1
          reboundMargin / 10 + 0.5 // Normalize to 0-1
        ]);
        
        // Calculate ratings based on inputs
        // This is a simplified model for generating mock data
        const overallRating = (
          offEfficiency * 0.4 +
          (2 - defEfficiency) * 0.4 +
          winPercentage * 0.15 +
          strengthOfSchedule * 0.05
        ) * 100;
        
        const offensiveRating = (
          offEfficiency * 0.6 +
          pointsPerGame / 90 * 0.3 +
          tempo / 80 * 0.1
        ) * 100;
        
        const defensiveRating = (
          (2 - defEfficiency) * 0.6 +
          (1 - pointsAllowedPerGame / 90) * 0.3 +
          (reboundMargin / 10 + 0.5) * 0.1
        ) * 100;
        
        const efficiencyRating = (
          offEfficiency * 0.5 +
          (2 - defEfficiency) * 0.5
        ) * 100;
        
        // Normalize ratings to 0-1 range
        outputs.push([
          overallRating / 100,
          offensiveRating / 100,
          defensiveRating / 100,
          efficiencyRating / 100
        ]);
      }
      
      logger.info(`Loaded ${inputs.length} team rating training examples`);
      
      return { inputs, outputs };
    } catch (error) {
      logger.error(`Error loading team rating data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load player impact training data
   * @returns {Promise<Object>} Training data
   * @private
   */
  async _loadPlayerImpactData() {
    try {
      logger.info('Loading player impact training data');
      
      // In a real implementation, this would load from a database
      // For this prototype, we'll use mock data
      
      const inputs = [];
      const outputs = [];
      
      // Generate mock training data
      // Input features: [player_stats_per_game, team_stats_with_player, team_stats_without_player, ...]
      // Output: [offensive_impact, defensive_impact, overall_impact, win_impact]
      
      for (let i = 0; i < 1000; i++) {
        // Player stats
        const pointsPerGame = Math.random() * 30;
        const reboundsPerGame = Math.random() * 15;
        const assistsPerGame = Math.random() * 10;
        const stealsPerGame = Math.random() * 3;
        const blocksPerGame = Math.random() * 3;
        const turnoversPerGame = Math.random() * 5;
        const minutesPerGame = 10 + Math.random() * 30;
        const fieldGoalPercentage = 0.3 + Math.random() * 0.3;
        const threePointPercentage = 0.2 + Math.random() * 0.3;
        const freeThrowPercentage = 0.5 + Math.random() * 0.4;
        
        // Team stats with player
        const teamOffRtgWithPlayer = 80 + Math.random() * 40;
        const teamDefRtgWithPlayer = 80 + Math.random() * 40;
        const teamNetRtgWithPlayer = teamOffRtgWithPlayer - teamDefRtgWithPlayer;
        const teamWinPctWithPlayer = Math.random();
        
        // Team stats without player
        const teamOffRtgWithoutPlayer = 80 + Math.random() * 40;
        const teamDefRtgWithoutPlayer = 80 + Math.random() * 40;
        const teamNetRtgWithoutPlayer = teamOffRtgWithoutPlayer - teamDefRtgWithoutPlayer;
        const teamWinPctWithoutPlayer = Math.random();
        
        // Create input vector
        inputs.push([
          pointsPerGame / 30, // Normalize to 0-1
          reboundsPerGame / 15,
          assistsPerGame / 10,
          stealsPerGame / 3,
          blocksPerGame / 3,
          turnoversPerGame / 5,
          minutesPerGame / 40,
          fieldGoalPercentage,
          threePointPercentage,
          freeThrowPercentage,
          teamOffRtgWithPlayer / 120,
          teamDefRtgWithPlayer / 120,
          teamNetRtgWithPlayer / 40 + 0.5, // Normalize to 0-1
          teamWinPctWithPlayer,
          teamOffRtgWithoutPlayer / 120,
          teamDefRtgWithoutPlayer / 120,
          teamNetRtgWithoutPlayer / 40 + 0.5, // Normalize to 0-1
          teamWinPctWithoutPlayer
        ]);
        
        // Calculate impacts based on inputs
        // This is a simplified model for generating mock data
        const offensiveImpact = (
          (teamOffRtgWithPlayer - teamOffRtgWithoutPlayer) / 40 +
          pointsPerGame / 30 * 0.4 +
          assistsPerGame / 10 * 0.3 +
          fieldGoalPercentage * 0.2 +
          threePointPercentage * 0.1
        ) / 2; // Normalize to -1 to 1 range
        
        const defensiveImpact = (
          (teamDefRtgWithoutPlayer - teamDefRtgWithPlayer) / 40 +
          reboundsPerGame / 15 * 0.3 +
          stealsPerGame / 3 * 0.3 +
          blocksPerGame / 3 * 0.4
        ) / 2; // Normalize to -1 to 1 range
        
        const overallImpact = (
          (teamNetRtgWithPlayer - teamNetRtgWithoutPlayer) / 40 +
          offensiveImpact * 0.5 +
          defensiveImpact * 0.5
        ) / 2; // Normalize to -1 to 1 range
        
        const winImpact = (
          (teamWinPctWithPlayer - teamWinPctWithoutPlayer) +
          overallImpact * 0.5
        ) / 1.5; // Normalize to -1 to 1 range
        
        // Normalize impacts to 0-1 range
        outputs.push([
          offensiveImpact / 2 + 0.5,
          defensiveImpact / 2 + 0.5,
          overallImpact / 2 + 0.5,
          winImpact / 2 + 0.5
        ]);
      }
      
      logger.info(`Loaded ${inputs.length} player impact training examples`);
      
      return { inputs, outputs };
    } catch (error) {
      logger.error(`Error loading player impact data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load strength of schedule training data
   * @returns {Promise<Object>} Training data
   * @private
   */
  async _loadStrengthOfScheduleData() {
    try {
      logger.info('Loading strength of schedule training data');
      
      // In a real implementation, this would load from a database
      // For this prototype, we'll use mock data
      
      const inputs = [];
      const outputs = [];
      
      // Generate mock training data
      // Input features: [opponent_ratings, home_away_neutral, conference_games, ...]
      // Output: [overall_sos, past_sos, future_sos, home_sos, away_sos]
      
      for (let i = 0; i < 1000; i++) {
        // Generate a mock schedule
        const numGames = 20 + Math.floor(Math.random() * 10); // 20-30 games
        const opponentRatings = [];
        const gameLocations = [];
        const conferenceGames = [];
        
        for (let j = 0; j < numGames; j++) {
          opponentRatings.push(Math.random());
          gameLocations.push(Math.floor(Math.random() * 3)); // 0=away, 1=home, 2=neutral
          conferenceGames.push(Math.random() > 0.3 ? 1 : 0);
        }
        
        // Calculate averaged inputs for the model
        const avgOpponentRating = opponentRatings.reduce((sum, val) => sum + val, 0) / numGames;
        const homeGamePct = gameLocations.filter(loc => loc === 1).length / numGames;
        const awayGamePct = gameLocations.filter(loc => loc === 0).length / numGames;
        const neutralGamePct = gameLocations.filter(loc => loc === 2).length / numGames;
        const conferenceGamePct = conferenceGames.reduce((sum, val) => sum + val, 0) / numGames;
        
        // Calculate top 25 opponents
        const top25Pct = opponentRatings.filter(rating => rating > 0.75).length / numGames;
        const top50Pct = opponentRatings.filter(rating => rating > 0.5).length / numGames;
        
        // Calculate road difficulty
        const roadDifficulty = opponentRatings
          .filter((_, idx) => gameLocations[idx] === 0)
          .reduce((sum, val) => sum + val, 0) / (awayGamePct * numGames || 1);
        
        inputs.push([
          avgOpponentRating,
          homeGamePct,
          awayGamePct,
          neutralGamePct,
          conferenceGamePct,
          top25Pct,
          top50Pct,
          roadDifficulty,
          numGames / 40 // Normalize to 0-1 range
        ]);
        
        // Calculate outputs based on inputs
        // This is a simplified model for generating mock data
        const overallSos = (
          avgOpponentRating * 0.6 +
          awayGamePct * 0.2 +
          top25Pct * 0.2
        );
        
        // Split the schedule in half to calculate past/future SOS
        const halfwayPoint = Math.floor(numGames / 2);
        const pastOpponentRatings = opponentRatings.slice(0, halfwayPoint);
        const futureOpponentRatings = opponentRatings.slice(halfwayPoint);
        
        const pastSos = pastOpponentRatings.length > 0 
          ? pastOpponentRatings.reduce((sum, val) => sum + val, 0) / pastOpponentRatings.length
          : 0.5;
          
        const futureSos = futureOpponentRatings.length > 0
          ? futureOpponentRatings.reduce((sum, val) => sum + val, 0) / futureOpponentRatings.length
          : 0.5;
        
        // Home/away SOS
        const homeSos = opponentRatings
          .filter((_, idx) => gameLocations[idx] === 1)
          .reduce((sum, val) => sum + val, 0) / (homeGamePct * numGames || 1);
          
        const awaySos = opponentRatings
          .filter((_, idx) => gameLocations[idx] === 0)
          .reduce((sum, val) => sum + val, 0) / (awayGamePct * numGames || 1);
        
        outputs.push([
          overallSos,
          pastSos,
          futureSos,
          homeSos,
          awaySos
        ]);
      }
      
      logger.info(`Loaded ${inputs.length} strength of schedule training examples`);
      
      return { inputs, outputs };
    } catch (error) {
      logger.error(`Error loading strength of schedule data: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PredictiveModelTrainer;