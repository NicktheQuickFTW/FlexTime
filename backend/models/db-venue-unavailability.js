/**
 * FlexTime Scheduling System - Database Venue Unavailability Model
 * 
 * Sequelize model for storing dates when venues are unavailable.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VenueUnavailability = sequelize.define('VenueUnavailability', {
    unavailability_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    venue_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'venues',
        key: 'venue_id'
      }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    recurrence_pattern: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'venue_unavailability',
    timestamps: true,
    underscored: true
  });

  VenueUnavailability.associate = (models) => {
    // An unavailability belongs to a venue
    VenueUnavailability.belongsTo(models.Venue, {
      foreignKey: 'venue_id',
      as: 'venue'
    });
  };

  return VenueUnavailability;
};
