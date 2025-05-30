/**
 * FlexTime Scheduling System - Database School Model
 * 
 * School model that matches the actual Neon database structure
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const School = sequelize.define('School', {
    school_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    school: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'school' // Maps to the 'school' column in Neon
    },
    short_display: {
      type: DataTypes.STRING,
      allowNull: true
    },
    primary_color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },
    secondary_color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },
    mascot: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    conference_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    schedule_display: {
      type: DataTypes.STRING,
      allowNull: true
    },
    school_abbreviation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preferred_school_name: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'schools', // Maps to the actual 'schools' table in Neon
    timestamps: true,
    underscored: true
  });

  School.associate = (models) => {
    // A School can have many Teams
    School.hasMany(models.Team, {
      foreignKey: 'school_id',
      as: 'teams'
    });
    
    // A School can have many Venues
    School.hasMany(models.Venue, {
      foreignKey: 'school_id',
      as: 'venues'
    });
  };

  return School;
};