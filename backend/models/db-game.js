/**
 * FlexTime Scheduling System - Database Game Model
 * 
 * Sequelize model for storing games in the database.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Game = sequelize.define('Game', {
    game_id: {
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
    home_team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    away_team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    venue_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'venues',
        key: 'venue_id'
      }
    },
    game_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'postponed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    special_designation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tv_network: {
      type: DataTypes.STRING,
      allowNull: true
    },
    broadcast_details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'games',
    timestamps: true,
    underscored: true
  });

  Game.associate = (models) => {
    // A game belongs to a schedule
    Game.belongsTo(models.Schedule, {
      foreignKey: 'schedule_id',
      as: 'schedule'
    });

    // A game has a home team
    Game.belongsTo(models.Team, {
      foreignKey: 'home_team_id',
      as: 'homeTeam'
    });

    // A game has an away team
    Game.belongsTo(models.Team, {
      foreignKey: 'away_team_id',
      as: 'awayTeam'
    });

    // A game can have a venue
    Game.belongsTo(models.Venue, {
      foreignKey: 'venue_id',
      as: 'venue'
    });
  };

  return Game;
};
