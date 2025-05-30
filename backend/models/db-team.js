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
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'institutions',
        key: 'school_id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true // Updated to match Neon schema
    },
    abbreviation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    primary_color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    secondary_color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    conference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    founded_year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    athletic_budget: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    enrollment: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // COMPASS rating fields
    compass_rating: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    compass_competitive: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    compass_operational: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    compass_market: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    compass_trajectory: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    compass_analytics: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    last_updated_summer_2025: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    compass_overall_score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    compass_competitive_performance: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    compass_recruiting_success: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    compass_coaching_stability: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    compass_resource_investment: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    season_record: {
      type: DataTypes.STRING,
      allowNull: true
    },
    conference_record: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ncaa_tournament_result: {
      type: DataTypes.STRING,
      allowNull: true
    },
    national_ranking: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    head_coach: {
      type: DataTypes.STRING,
      allowNull: true
    },
    coach_tenure: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    facility_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    facility_capacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    scheduling_tier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    scheduling_considerations: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    competitive_analysis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recruiting_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    profile_last_updated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profile_data_source: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    underscored: true
  });

  // Helper functions for team_id calculation and parsing
  Team.calculateTeamId = (schoolId, sportId) => {
    return parseInt(`${schoolId}${sportId.toString().padStart(2, '0')}`);
  };

  Team.parseTeamId = (teamId) => {
    const teamIdStr = teamId.toString();
    if (teamIdStr.length < 3) return null;
    
    const sportId = parseInt(teamIdStr.slice(-2));
    const schoolId = parseInt(teamIdStr.slice(0, -2));
    
    return { schoolId, sportId };
  };

  Team.associate = (models) => {
    // A Team belongs to a Season
    Team.belongsTo(models.Season, {
      foreignKey: 'season_id',
      as: 'season'
    });

    // A Team belongs to a School
    Team.belongsTo(models.School, {
      foreignKey: 'school_id',
      as: 'school'
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
