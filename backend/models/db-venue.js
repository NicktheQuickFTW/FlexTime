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
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'team_id'
      }
    },
    // Enhanced fields (removed supported_sports since team_id contains sport info)
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

  // Helper function to calculate team_id from school_id and sport_id
  Venue.calculateTeamId = (schoolId, sportId) => {
    return parseInt(`${schoolId}${sportId.toString().padStart(2, '0')}`);
  };

  // Venue ID generation helpers
  Venue.generateVenueId = (schoolId, venueType = 1) => {
    // Format: SSVV (school + venue type)
    // 01 = Football Stadium, 02 = Arena, 03 = Baseball, etc.
    const school = schoolId.toString().padStart(2, '0');
    const venue = venueType.toString().padStart(2, '0');
    return parseInt(`${school}${venue}`);
  };

  Venue.parseVenueId = (venueId) => {
    const venueStr = venueId.toString();
    
    // School-venue pattern (4 digits: SSVV)
    if (venueStr.length === 4) {
      return {
        schoolId: parseInt(venueStr.substring(0, 2)),
        venueType: parseInt(venueStr.substring(2, 4)),
        pattern: 'school-venue-type'
      };
    }
    
    // Legacy pattern (1-3 digits)
    if (venueStr.length <= 3) {
      return { venueId: venueId, pattern: 'legacy' };
    }
    
    return null;
  };

  // Venue type constants
  Venue.VENUE_TYPES = {
    FOOTBALL_STADIUM: 1,
    ARENA_GYMNASIUM: 2,     // Basketball, Gymnastics
    BASEBALL_COMPLEX: 3,    // Baseball
    SOFTBALL_COMPLEX: 4,    // Softball  
    SOCCER_FIELD: 5,        // Soccer
    VOLLEYBALL_FACILITY: 6, // Volleyball
    TENNIS_COMPLEX: 7,      // Tennis
    TRACK_FIELD: 8,         // Track & Field, Cross Country
    SWIMMING_POOL: 9,       // Swimming & Diving
    GOLF_COURSE: 10         // Golf
  };

  // Helper to get venue ID by type
  Venue.getVenueId = (schoolId, venueType) => {
    return Venue.generateVenueId(schoolId, venueType);
  };

  Venue.associate = (models) => {
    // A Venue belongs to a Team (which contains school and sport info)
    Venue.belongsTo(models.Team, {
      foreignKey: 'team_id',
      as: 'team'
    });
    
    // A Venue can have many Games
    Venue.hasMany(models.Game, {
      foreignKey: 'venue_id',
      as: 'games'
    });
    
    // Note: VenueUnavailability model association removed - model doesn't exist
    // Venue.hasMany(models.VenueUnavailability, {
    //   foreignKey: 'venue_id',
    //   as: 'unavailabilityPeriods'
    // });
  };

  return Venue;
};
