/**
 * FlexTime Scheduling System - Database Institution Model
 * 
 * Simplified version of the Institution model for scheduling service.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Institution = sequelize.define('Institution', {
    school_id: {
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
    mascot: {
      type: DataTypes.STRING(50),
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
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'USA'
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'institutions',
    timestamps: true,
    underscored: true
  });

  Institution.associate = (models) => {
    // An Institution can have many Teams
    Institution.hasMany(models.Team, {
      foreignKey: 'school_id',
      as: 'teams'
    });
  };

  return Institution;
};
