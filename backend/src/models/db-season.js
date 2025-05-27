/**
 * FlexTime Scheduling System - Database Season Model
 * 
 * Renamed version of the Championship model for scheduling service.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Season = sequelize.define('Season', {
    season_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    sport_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sports',
        key: 'sport_id'
      }
    },
    year: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('planned', 'active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'planned'
    }
  }, {
    tableName: 'seasons',
    timestamps: true,
    underscored: true
  });

  Season.associate = (models) => {
    // A Season belongs to a Sport
    Season.belongsTo(models.Sport, {
      foreignKey: 'sport_id',
      as: 'sport'
    });
    
    // A Season has many Teams
    Season.hasMany(models.Team, {
      foreignKey: 'season_id',
      as: 'teams'
    });
    
    // A Season can have many Schedules
    Season.hasMany(models.Schedule, {
      foreignKey: 'season_id',
      as: 'schedules'
    });
  };

  return Season;
};
