/**
 * FlexTime Scheduling System - Database Venue Model
 * 
 * Enhanced Venue model with additional fields for scheduling intelligence
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Venue = sequelize.define('Venue', {
    venue_id: {
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
    city: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    facilities: {
      type: DataTypes.JSON,
      allowNull: true
    },
    institution_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'institutions',
        key: 'institution_id'
      }
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Enhanced fields
    supported_sports: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      comment: 'IDs of sports supported at this venue'
    },
    time_zone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Time zone of the venue location'
    },
    setup_time_required: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minutes required for setup between events'
    },
    teardown_time_required: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Minutes required for teardown after events'
    },
    shared_with_venues: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      comment: 'IDs of venues that share resources or space with this venue'
    },
    availability_restrictions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Regular patterns of venue availability restrictions'
    },
    transport_hubs: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Nearby transport hubs (airports, train stations) with distances'
    },
    parking_capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of parking spaces available'
    },
    media_facilities: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Details of media facilities available'
    },
    concessions_available: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: 'Whether concessions are available at this venue'
    },
    venue_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Type of venue (indoor/outdoor/mixed)'
    },
    accessibility_features: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Accessibility features available at the venue'
    },
    weather_impacts: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'How weather typically impacts this venue for scheduling'
    }
  }, {
    tableName: 'venues',
    timestamps: true,
    underscored: true
  });

  Venue.associate = (models) => {
    // A Venue can belong to an Institution
    Venue.belongsTo(models.Institution, {
      foreignKey: 'institution_id',
      as: 'institution'
    });
    
    // A Venue can have many Games
    Venue.hasMany(models.Game, {
      foreignKey: 'venue_id',
      as: 'games'
    });
    
    // A Venue can have many unavailability periods
    Venue.hasMany(models.VenueUnavailability, {
      foreignKey: 'venue_id',
      as: 'unavailabilityPeriods'
    });
  };

  return Venue;
};
