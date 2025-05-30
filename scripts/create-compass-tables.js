/**
 * Create COMPASS Tables Migration Script
 * 
 * This script creates all necessary database tables for the COMPASS system
 * in the Neon database. It handles creating tables, indexes, and relationships.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const neonConfig = require('../backend/config/neon_db_config');
const logger = require('../utils/logger');

async function createCompassTables() {
  let sequelize;
  
  try {
    logger.info('Starting COMPASS tables migration...');
    
    // Connect to the Neon database
    sequelize = new Sequelize(process.env.POSTGRES_URI, {
      dialect: 'postgres',
      logging: msg => logger.debug(msg),
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
    const compassModels = require('../models/db-compass')(sequelize);
    
    // Define the migration SQL
    const migrationSQL = `
-- Create enum types
CREATE TYPE change_type_enum AS ENUM ('add', 'remove', 'injury', 'return');
CREATE TYPE confidence_level_enum AS ENUM ('High', 'Medium', 'Low');

-- Create compass_team_ratings table
CREATE TABLE IF NOT EXISTS compass_team_ratings (
  rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(team_id),
  sport VARCHAR(255) NOT NULL,
  normalized_rating FLOAT NOT NULL CHECK (normalized_rating BETWEEN 0 AND 1),
  raw_rating FLOAT NOT NULL,
  percentile INTEGER NOT NULL,
  tier VARCHAR(255) NOT NULL,
  rating_components JSONB NOT NULL,
  roster_adjustment FLOAT NOT NULL DEFAULT 0,
  prediction_confidence FLOAT NOT NULL DEFAULT 0.7,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for compass_team_ratings
CREATE INDEX IF NOT EXISTS idx_team_ratings_team_id ON compass_team_ratings(team_id);
CREATE INDEX IF NOT EXISTS idx_team_ratings_sport ON compass_team_ratings(sport);
CREATE INDEX IF NOT EXISTS idx_team_ratings_last_updated ON compass_team_ratings(last_updated);

-- Create compass_roster_changes table
CREATE TABLE IF NOT EXISTS compass_roster_changes (
  change_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(team_id),
  player_name VARCHAR(255) NOT NULL,
  change_type change_type_enum NOT NULL,
  player_rating FLOAT NOT NULL CHECK (player_rating BETWEEN 0 AND 1),
  impact_score FLOAT NOT NULL,
  details TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for compass_roster_changes
CREATE INDEX IF NOT EXISTS idx_roster_changes_team_id ON compass_roster_changes(team_id);
CREATE INDEX IF NOT EXISTS idx_roster_changes_change_type ON compass_roster_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_roster_changes_created_at ON compass_roster_changes("createdAt");

-- Create compass_game_predictions table
CREATE TABLE IF NOT EXISTS compass_game_predictions (
  prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(game_id),
  home_team_id UUID NOT NULL REFERENCES teams(team_id),
  away_team_id UUID NOT NULL REFERENCES teams(team_id),
  sport VARCHAR(255) NOT NULL,
  home_win_probability FLOAT NOT NULL CHECK (home_win_probability BETWEEN 0 AND 1),
  expected_margin FLOAT NOT NULL,
  confidence_level confidence_level_enum NOT NULL,
  is_neutral_site BOOLEAN NOT NULL DEFAULT FALSE,
  key_factors JSONB NOT NULL,
  prediction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actual_outcome JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for compass_game_predictions
CREATE INDEX IF NOT EXISTS idx_game_predictions_game_id ON compass_game_predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_predictions_teams ON compass_game_predictions(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_game_predictions_date ON compass_game_predictions(prediction_date);

-- Create compass_strength_of_schedule table
CREATE TABLE IF NOT EXISTS compass_strength_of_schedule (
  sos_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(team_id),
  schedule_id UUID REFERENCES schedules(schedule_id),
  sport VARCHAR(255) NOT NULL,
  season VARCHAR(255) NOT NULL,
  overall_sos FLOAT NOT NULL,
  home_sos FLOAT NOT NULL,
  away_sos FLOAT NOT NULL,
  past_sos FLOAT NOT NULL,
  future_sos FLOAT NOT NULL,
  difficulty_tier VARCHAR(255) NOT NULL,
  opponent_metrics JSONB NOT NULL,
  calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for compass_strength_of_schedule
CREATE INDEX IF NOT EXISTS idx_sos_team_id ON compass_strength_of_schedule(team_id);
CREATE INDEX IF NOT EXISTS idx_sos_schedule_id ON compass_strength_of_schedule(schedule_id);
CREATE INDEX IF NOT EXISTS idx_sos_season ON compass_strength_of_schedule(season);

-- Create compass_external_ratings table
CREATE TABLE IF NOT EXISTS compass_external_ratings (
  external_rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(team_id),
  source VARCHAR(255) NOT NULL,
  rating_value FLOAT NOT NULL,
  normalized_value FLOAT NOT NULL CHECK (normalized_value BETWEEN 0 AND 1),
  ranking INTEGER,
  season VARCHAR(255) NOT NULL,
  raw_data JSONB,
  fetch_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for compass_external_ratings
CREATE INDEX IF NOT EXISTS idx_external_ratings_team_id ON compass_external_ratings(team_id);
CREATE INDEX IF NOT EXISTS idx_external_ratings_source ON compass_external_ratings(source);
CREATE INDEX IF NOT EXISTS idx_external_ratings_season ON compass_external_ratings(season);

-- Create compass_model_training_data table
CREATE TABLE IF NOT EXISTS compass_model_training_data (
  training_data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport VARCHAR(255) NOT NULL,
  data_type VARCHAR(255) NOT NULL,
  features JSONB NOT NULL,
  labels JSONB NOT NULL,
  weight FLOAT NOT NULL DEFAULT 1.0,
  source VARCHAR(255) NOT NULL,
  is_validated BOOLEAN NOT NULL DEFAULT FALSE,
  collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for compass_model_training_data
CREATE INDEX IF NOT EXISTS idx_training_data_sport ON compass_model_training_data(sport);
CREATE INDEX IF NOT EXISTS idx_training_data_type ON compass_model_training_data(data_type);
CREATE INDEX IF NOT EXISTS idx_training_data_validated ON compass_model_training_data(is_validated);

-- Create compass_model_weights table
CREATE TABLE IF NOT EXISTS compass_model_weights (
  model_weights_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(255) NOT NULL,
  sport VARCHAR(255) NOT NULL,
  version VARCHAR(255) NOT NULL,
  weights_data JSONB NOT NULL,
  performance_metrics JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  training_date TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for compass_model_weights
CREATE INDEX IF NOT EXISTS idx_model_weights_name ON compass_model_weights(model_name);
CREATE INDEX IF NOT EXISTS idx_model_weights_sport ON compass_model_weights(sport);
CREATE INDEX IF NOT EXISTS idx_model_weights_active ON compass_model_weights(is_active);
    `;
    
    // Execute the migration
    await sequelize.query(migrationSQL, { 
      type: Sequelize.QueryTypes.RAW 
    });
    
    logger.info('COMPASS tables created successfully');
    
    // Return success
    return {
      success: true,
      message: 'COMPASS tables created successfully'
    };
  } catch (error) {
    logger.error(`Error creating COMPASS tables: ${error.message}`);
    
    // Return error
    return {
      success: false,
      message: `Failed to create COMPASS tables: ${error.message}`
    };
  } finally {
    // Close the connection
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run the migration if called directly
if (require.main === module) {
  createCompassTables()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(`Migration failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { createCompassTables };