/**
 * FlexTime Scheduling System - Database Schedule Model
 * 
 * Updated Sequelize model for storing schedules using season_id instead of championship_id
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Schedule = sequelize.define('Schedule', {
    schedule_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sport_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sports',
        key: 'sport_id'
      }
    },
    season_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'seasons',
        key: 'season_id'
      }
    },
    year: {
      type: DataTypes.STRING,
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
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'schedules',
    timestamps: true,
    underscored: true
  });

  Schedule.associate = (models) => {
    // A schedule belongs to a sport
    Schedule.belongsTo(models.Sport, {
      foreignKey: 'sport_id',
      as: 'sport'
    });

    // A schedule can belong to a season
    Schedule.belongsTo(models.Season, {
      foreignKey: 'season_id',
      as: 'season'
    });

    // A schedule has many games
    Schedule.hasMany(models.Game, {
      foreignKey: 'schedule_id',
      as: 'games'
    });

    // A schedule has many teams through schedule_teams
    Schedule.belongsToMany(models.Team, {
      through: 'schedule_teams',
      foreignKey: 'schedule_id',
      otherKey: 'team_id',
      as: 'teams'
    });

    // A schedule has many constraints
    Schedule.hasMany(models.ScheduleConstraint, {
      foreignKey: 'schedule_id',
      as: 'constraints'
    });
  };

  return Schedule;
};
