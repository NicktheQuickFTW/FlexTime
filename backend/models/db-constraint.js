/**
 * FlexTime Scheduling System - Database Constraint Model
 * 
 * Sequelize model for storing scheduling constraints in the database.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScheduleConstraint = sequelize.define('ScheduleConstraint', {
    constraint_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'schedules',
        key: 'schedule_id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('Hard', 'Soft'),
      allowNull: false,
      defaultValue: 'Soft'
    },
    category: {
      type: DataTypes.ENUM('Travel', 'Rest', 'Venue', 'Broadcast', 'Competitive', 'Academic', 'Custom'),
      allowNull: false
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'schedule_constraints',
    timestamps: true,
    underscored: true
  });

  ScheduleConstraint.associate = (models) => {
    // A constraint belongs to a schedule
    ScheduleConstraint.belongsTo(models.Schedule, {
      foreignKey: 'schedule_id',
      as: 'schedule'
    });
    
    // A constraint can be associated with specific teams
    ScheduleConstraint.belongsToMany(models.Team, {
      through: 'constraint_teams',
      foreignKey: 'constraint_id',
      otherKey: 'team_id',
      as: 'teams'
    });
  };

  return ScheduleConstraint;
};
