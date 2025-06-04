/**
 * FlexTime COMPASS Database Models - DISABLED (Future Enhancement Q1 2026)
 * 
 * This module defines Sequelize models for storing COMPASS data in the Neon database,
 * including team ratings, predictions, strength of schedule metrics, and training data.
 * Currently disabled as COMPASS ratings are planned for future implementation.
 */

module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  // Team Rating model
  const TeamRating = sequelize.define('TeamRating', {
    rating_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    sport: {
      type: DataTypes.STRING,
      allowNull: false
    },
    normalized_rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1
      }
    },
    raw_rating: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    percentile: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tier: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rating_components: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    roster_adjustment: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    prediction_confidence: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.7
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'compass_team_ratings',
    timestamps: true,
    indexes: [
      {
        fields: ['team_id']
      },
      {
        fields: ['sport']
      },
      {
        fields: ['last_updated']
      }
    ]
  });
  
  // Roster Change model
  const RosterChange = sequelize.define('RosterChange', {
    change_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    player_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    change_type: {
      type: DataTypes.ENUM('add', 'remove', 'injury', 'return'),
      allowNull: false
    },
    player_rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1
      }
    },
    impact_score: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'compass_roster_changes',
    timestamps: true,
    indexes: [
      {
        fields: ['team_id']
      },
      {
        fields: ['change_type']
      },
      {
        fields: ['createdAt']
      }
    ]
  });
  
  // Game Prediction model
  const GamePrediction = sequelize.define('GamePrediction', {
    prediction_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    game_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'games',
        key: 'game_id'
      }
    },
    home_team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    away_team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    sport: {
      type: DataTypes.STRING,
      allowNull: false
    },
    home_win_probability: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1
      }
    },
    expected_margin: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    confidence_level: {
      type: DataTypes.ENUM('High', 'Medium', 'Low'),
      allowNull: false
    },
    is_neutral_site: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    key_factors: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    prediction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    actual_outcome: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'compass_game_predictions',
    timestamps: true,
    indexes: [
      {
        fields: ['game_id']
      },
      {
        fields: ['home_team_id', 'away_team_id']
      },
      {
        fields: ['prediction_date']
      }
    ]
  });
  
  // Strength of Schedule model
  const StrengthOfSchedule = sequelize.define('StrengthOfSchedule', {
    sos_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    schedule_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'schedules',
        key: 'schedule_id'
      }
    },
    sport: {
      type: DataTypes.STRING,
      allowNull: false
    },
    season: {
      type: DataTypes.STRING,
      allowNull: false
    },
    overall_sos: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    home_sos: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    away_sos: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    past_sos: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    future_sos: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    difficulty_tier: {
      type: DataTypes.STRING,
      allowNull: false
    },
    opponent_metrics: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    calculation_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'compass_strength_of_schedule',
    timestamps: true,
    indexes: [
      {
        fields: ['team_id']
      },
      {
        fields: ['schedule_id']
      },
      {
        fields: ['season']
      }
    ]
  });
  
  // External Rating model (for NET, KenPom, etc.)
  const ExternalRating = sequelize.define('ExternalRating', {
    external_rating_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rating_value: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    normalized_value: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 1
      }
    },
    ranking: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    season: {
      type: DataTypes.STRING,
      allowNull: false
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    fetch_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'compass_external_ratings',
    timestamps: true,
    indexes: [
      {
        fields: ['team_id']
      },
      {
        fields: ['source']
      },
      {
        fields: ['season']
      }
    ]
  });
  
  // Model Training Data
  const ModelTrainingData = sequelize.define('ModelTrainingData', {
    training_data_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sport: {
      type: DataTypes.STRING,
      allowNull: false
    },
    data_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    features: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    labels: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_validated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    collection_date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'compass_model_training_data',
    timestamps: true,
    indexes: [
      {
        fields: ['sport']
      },
      {
        fields: ['data_type']
      },
      {
        fields: ['is_validated']
      }
    ]
  });
  
  // Model Weights Storage
  const ModelWeights = sequelize.define('ModelWeights', {
    model_weights_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    model_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sport: {
      type: DataTypes.STRING,
      allowNull: false
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false
    },
    weights_data: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    performance_metrics: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    training_date: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'compass_model_weights',
    timestamps: true,
    indexes: [
      {
        fields: ['model_name']
      },
      {
        fields: ['sport']
      },
      {
        fields: ['is_active']
      }
    ]
  });
  
  // Define relationships
  TeamRating.hasMany(RosterChange, { foreignKey: 'team_id', sourceKey: 'team_id' });
  RosterChange.belongsTo(TeamRating, { foreignKey: 'team_id', targetKey: 'team_id' });
  
  return {
    TeamRating,
    RosterChange,
    GamePrediction,
    StrengthOfSchedule,
    ExternalRating,
    ModelTrainingData,
    ModelWeights
  };
};