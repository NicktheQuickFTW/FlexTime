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
    sport_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'sport_name' // Maps to 'sport_name' column in Neon
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'code' // Maps to 'code' column in Neon
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    season_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    team_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    championship_format: {
      type: DataTypes.STRING,
      allowNull: true
    },
    championship_location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    championship_date: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sponsorship_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sport_abbrev: {
      type: DataTypes.STRING,
      allowNull: true
    },
    scheduled_by_flextime: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    selection_criteria: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rpi_weight: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    analytics_platform: {
      type: DataTypes.STRING,
      allowNull: true
    },
    recruiting_season: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transfer_portal_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
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
