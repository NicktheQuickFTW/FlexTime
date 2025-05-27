/**
 * Enhanced Big 12 Teams Seed Script for Neon DB
 * 
 * This script populates the Neon DB with Big 12 conference teams data using the enhanced models.
 * It creates Institution, Team, and Venue records with all the new fields we've added
 * for scheduling intelligence.
 */

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Direct connection parameters
const DB_NAME = 'HELiiX';
const DB_USER = 'xii-os_owner';
const DB_PASSWORD = 'npg_4qYJFR0lneIg';
const DB_HOST = 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech';
const DB_PORT = 5432;

// Models to load
const modelFiles = [
  'db-sport.js',
  'db-institution.js',
  'db-team.js',
  'db-venue.js'
];

// Enhanced Big 12 Teams data with additional fields for scheduling intelligence
const big12TeamsData = [
  {
    name: "Texas Tech",
    nickname: "Red Raiders",
    abbreviation: "TTU",
    city: "Lubbock",
    state: "TX",
    latitude: 33.5779,
    longitude: -101.8552,
    primaryColor: "#CC0000",
    secondaryColor: "#000000",
    venueName: "United Supermarkets Arena",
    venueCapacity: 15098,
    website: "https://texastech.com/",
    // Enhanced team fields
    season: "2024-25",
    timeZone: "America/Chicago",
    travelConstraints: {
      maxTravelDistance: 1500,
      preferredTravelDays: ["Thursday", "Friday"]
    },
    schedulingPriorities: {
      homeGamesWeighted: 0.6,
      rivalGamesWeighted: 0.8
    },
    blackoutDates: ["2024-12-24", "2024-12-25", "2025-01-01"],
    mediaContracts: {
      espn: true,
      fox: true,
      streamingServices: ["ESPN+"]
    },
    // Enhanced venue fields
    venueType: "indoor",
    setupTime: 120, // minutes
    teardownTime: 90, // minutes
    supportedSports: ["basketball", "volleyball"],
    mediaFacilities: {
      broadcastBooths: 4,
      cameraPositions: 8,
      pressBoxCapacity: 50
    },
    nearbyTransportHubs: [
      {
        name: "Lubbock Preston Smith International Airport",
        type: "airport",
        distanceInMiles: 9.5
      }
    ],
    accessibilityFeatures: {
      wheelchairSeating: true,
      assistedListeningDevices: true,
      accessibleRestrooms: true
    },
    // Rival teams
    rivals: ["Baylor", "TCU"]
  },
  {
    name: "Baylor",
    nickname: "Bears",
    abbreviation: "BU",
    city: "Waco",
    state: "TX",
    latitude: 31.5493,
    longitude: -97.1467,
    primaryColor: "#003015",
    secondaryColor: "#FFB81C",
    venueName: "Foster Pavilion",
    venueCapacity: 7000,
    website: "https://baylorbears.com/",
    // Enhanced team fields
    season: "2024-25",
    timeZone: "America/Chicago",
    travelConstraints: {
      maxTravelDistance: 1500,
      preferredTravelDays: ["Thursday", "Friday"]
    },
    schedulingPriorities: {
      homeGamesWeighted: 0.7,
      rivalGamesWeighted: 0.9
    },
    blackoutDates: ["2024-12-24", "2024-12-25", "2025-01-01"],
    mediaContracts: {
      espn: true,
      fox: true,
      streamingServices: ["ESPN+"]
    },
    // Enhanced venue fields
    venueType: "indoor",
    setupTime: 90, // minutes
    teardownTime: 60, // minutes
    supportedSports: ["basketball", "volleyball"],
    mediaFacilities: {
      broadcastBooths: 3,
      cameraPositions: 6,
      pressBoxCapacity: 40
    },
    nearbyTransportHubs: [
      {
        name: "Waco Regional Airport",
        type: "airport",
        distanceInMiles: 10.2
      }
    ],
    accessibilityFeatures: {
      wheelchairSeating: true,
      assistedListeningDevices: true,
      accessibleRestrooms: true
    },
    // Rival teams
    rivals: ["Texas Tech", "TCU"]
  },
  {
    name: "TCU",
    nickname: "Horned Frogs",
    abbreviation: "TCU",
    city: "Fort Worth",
    state: "TX",
    latitude: 32.7555,
    longitude: -97.3308,
    primaryColor: "#4D1979",
    secondaryColor: "#A3A9AC",
    venueName: "Schollmaier Arena",
    venueCapacity: 8500,
    website: "https://gofrogs.com/",
    // Enhanced team fields
    season: "2024-25",
    timeZone: "America/Chicago",
    travelConstraints: {
      maxTravelDistance: 1500,
      preferredTravelDays: ["Thursday", "Friday"]
    },
    schedulingPriorities: {
      homeGamesWeighted: 0.6,
      rivalGamesWeighted: 0.8
    },
    blackoutDates: ["2024-12-24", "2024-12-25", "2025-01-01"],
    mediaContracts: {
      espn: true,
      fox: true,
      streamingServices: ["ESPN+"]
    },
    // Enhanced venue fields
    venueType: "indoor",
    setupTime: 100, // minutes
    teardownTime: 70, // minutes
    supportedSports: ["basketball", "volleyball"],
    mediaFacilities: {
      broadcastBooths: 3,
      cameraPositions: 7,
      pressBoxCapacity: 45
    },
    nearbyTransportHubs: [
      {
        name: "Dallas/Fort Worth International Airport",
        type: "airport",
        distanceInMiles: 23.5
      }
    ],
    accessibilityFeatures: {
      wheelchairSeating: true,
      assistedListeningDevices: true,
      accessibleRestrooms: true
    },
    // Rival teams
    rivals: ["Baylor", "Texas Tech"]
  }
];

async function seedEnhancedBig12Teams() {
  logger.info('Starting Enhanced Big 12 Teams seed for Neon DB...');
  
  try {
    // Create Sequelize instance with direct configuration
    const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    });
    
    // Test connection
    await sequelize.authenticate();
    logger.info('Connection to Neon DB established successfully');
    
    // Load models
    const models = {};
    
    for (const file of modelFiles) {
      const modelPath = path.join(__dirname, '../models', file);
      if (fs.existsSync(modelPath)) {
        const model = require(modelPath)(sequelize);
        models[model.name] = model;
        logger.info(`Loaded model: ${model.name}`);
      } else {
        logger.warn(`Model file not found: ${modelPath}`);
      }
    }
    
    // Skip associations for now as they're causing issues
    // We'll use direct queries instead
    
    // Get the sport ID for Men's Basketball
    const basketballSport = await models.Sport.findOne({
      where: { 
        abbreviation: "MBB"
      }
    });
    
    if (!basketballSport) {
      throw new Error("Men's Basketball sport not found. Please run the database initialization script first.");
    }
    
    logger.info(`Found Men's Basketball sport with ID: ${basketballSport.id}`);
    
    // Process each team
    for (const teamData of big12TeamsData) {
      // Create or update institution
      const [institution, institutionCreated] = await models.Institution.findOrCreate({
        where: { 
          abbreviation: teamData.abbreviation 
        },
        defaults: {
          name: teamData.name,
          short_name: teamData.nickname,
          code: teamData.abbreviation
        }
      });
      
      if (institutionCreated) {
        logger.info(`Created institution: ${teamData.name} (ID: ${institution.id})`);
      } else {
        await institution.update({
          name: teamData.name,
          short_name: teamData.nickname
        });
        logger.info(`Updated institution: ${teamData.name} (ID: ${institution.id})`);
      }
      
      // Create or update team with enhanced fields
      const [team, teamCreated] = await models.Team.findOrCreate({
        where: { 
          institution_id: institution.id,
          sport_id: basketballSport.id
        },
        defaults: {
          name: teamData.name,
          mascot: teamData.nickname,
          season: teamData.season,
          time_zone: teamData.timeZone,
          travel_constraints: JSON.stringify(teamData.travelConstraints),
          scheduling_priorities: JSON.stringify(teamData.schedulingPriorities),
          blackout_dates: JSON.stringify(teamData.blackoutDates),
          media_contracts: JSON.stringify(teamData.mediaContracts),
          rival_teams: JSON.stringify(teamData.rivals)
        }
      });
      
      if (teamCreated) {
        logger.info(`Created team: ${teamData.name} ${teamData.nickname} (ID: ${team.id})`);
      } else {
        await team.update({
          name: teamData.name,
          mascot: teamData.nickname,
          season: teamData.season,
          time_zone: teamData.timeZone,
          travel_constraints: JSON.stringify(teamData.travelConstraints),
          scheduling_priorities: JSON.stringify(teamData.schedulingPriorities),
          blackout_dates: JSON.stringify(teamData.blackoutDates),
          media_contracts: JSON.stringify(teamData.mediaContracts),
          rival_teams: JSON.stringify(teamData.rivals)
        });
        logger.info(`Updated team: ${teamData.name} ${teamData.nickname} (ID: ${team.id})`);
      }
      
      // Create or update venue with enhanced fields
      const [venue, venueCreated] = await models.Venue.findOrCreate({
        where: { 
          name: teamData.venueName 
        },
        defaults: {
          city: teamData.city,
          state: teamData.state,
          capacity: teamData.venueCapacity,
          team_id: team.id,
          venue_type: teamData.venueType,
          setup_time: teamData.setupTime,
          teardown_time: teamData.teardownTime,
          supported_sports: JSON.stringify(teamData.supportedSports),
          media_facilities: JSON.stringify(teamData.mediaFacilities),
          nearby_transport_hubs: JSON.stringify(teamData.nearbyTransportHubs),
          accessibility_features: JSON.stringify(teamData.accessibilityFeatures),
          latitude: teamData.latitude,
          longitude: teamData.longitude
        }
      });
      
      if (venueCreated) {
        logger.info(`Created venue: ${teamData.venueName} (ID: ${venue.id})`);
      } else {
        await venue.update({
          city: teamData.city,
          state: teamData.state,
          capacity: teamData.venueCapacity,
          team_id: team.id,
          venue_type: teamData.venueType,
          setup_time: teamData.setupTime,
          teardown_time: teamData.teardownTime,
          supported_sports: JSON.stringify(teamData.supportedSports),
          media_facilities: JSON.stringify(teamData.mediaFacilities),
          nearby_transport_hubs: JSON.stringify(teamData.nearbyTransportHubs),
          accessibility_features: JSON.stringify(teamData.accessibilityFeatures),
          latitude: teamData.latitude,
          longitude: teamData.longitude
        });
        logger.info(`Updated venue: ${teamData.venueName} (ID: ${venue.id})`);
      }
    }
    
    logger.info('Enhanced Big 12 Teams seed for Neon DB completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to seed Enhanced Big 12 Teams: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
}

// Run the script if executed directly
if (require.main === module) {
  seedEnhancedBig12Teams()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  seedEnhancedBig12Teams
};
