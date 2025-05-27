/**
 * FlexTime Scheduling System - Database Team Model
 * 
 * Updated version with season_id instead of championship_id
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Team = sequelize.define('Team', {
    team_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    season_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'seasons',
        key: 'season_id'
      }
    },
    institution_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions',
        key: 'institution_id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    division: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    seed: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('registered', 'confirmed', 'withdrawn', 'disqualified'),
      allowNull: false,
      defaultValue: 'registered'
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    underscored: true
  });

  Team.associate = (models) => {
    // A Team belongs to a Season
    Team.belongsTo(models.Season, {
      foreignKey: 'season_id',
      as: 'season'
    });

    // A Team belongs to an Institution
    Team.belongsTo(models.Institution, {
      foreignKey: 'institution_id',
      as: 'institution'
    });
    
    // A Team can belong to many Schedules
    Team.belongsToMany(models.Schedule, {
      through: 'schedule_teams',
      foreignKey: 'team_id',
      otherKey: 'schedule_id',
      as: 'schedules'
    });
    
    // A Team can be associated with many Games as home team
    Team.hasMany(models.Game, {
      foreignKey: 'home_team_id',
      as: 'homeGames'
    });
    
    // A Team can be associated with many Games as away team
    Team.hasMany(models.Game, {
      foreignKey: 'away_team_id',
      as: 'awayGames'
    });
    
    // A Team can have many constraints
    Team.belongsToMany(models.ScheduleConstraint, {
      through: 'constraint_teams',
      foreignKey: 'team_id',
      otherKey: 'constraint_id',
      as: 'constraints'
    });
  };

  return Team;
};
