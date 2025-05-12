/**
 * FlexTime Scheduling System - Database Sport Model
 * 
 * Enhanced version of the Sport model with additional fields to support scheduling intelligence.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sport = sequelize.define('Sport', {
    sport_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    abbreviation: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.ENUM('men', 'women', 'mixed'),
      allowNull: false,
      defaultValue: 'mixed'
    },
    team_based: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    season_start_month: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12
      }
    },
    season_end_month: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 12
      }
    },
    default_days_between_games: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Recommended days between games for this sport'
    },
    typical_game_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Typical duration of a game in minutes'
    },
    max_games_per_week: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum number of games a team should play per week'
    },
    is_winter_sport: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this is a winter sport that spans calendar years'
    },
    conference_games_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Typical number of conference games in a season'
    },
    media_requirements: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Media and broadcasting requirements for this sport'
    },
    scheduling_constraints: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Default scheduling constraints for this sport'
    }
  }, {
    tableName: 'sports',
    timestamps: true,
    underscored: true
  });

  Sport.associate = (models) => {
    // A Sport can have many Teams
    Sport.hasMany(models.Team, {
      foreignKey: 'sport_id',
      as: 'teams'
    });
    
    // A Sport can have many Schedules
    Sport.hasMany(models.Schedule, {
      foreignKey: 'sport_id',
      as: 'schedules'
    });
  };

  return Sport;
};
