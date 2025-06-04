/**
 * FlexTime Scheduling System - Database Schedule Model
 * 
 * Updated Sequelize model for storing schedules using season_id instead of championship_id
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Schedule = sequelize.define('Schedule', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    sport: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    season: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    conference: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'big12'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'draft'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'schedules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Schedule.associate = (models) => {
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
  };

  return Schedule;
};
