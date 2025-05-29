/**
 * Complete Big 12 Seed Script for Neon DB
 * 
 * This script populates the Neon DB with all Big 12 conference teams
 * and their enhanced data for scheduling intelligence.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../utils/logger');

// Connection string from environment
const connectionString = process.env.NEON_DB_CONNECTION_STRING || 
  'postgresql://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech/HELiiX?sslmode=prefer';

// Complete Big 12 Teams data with enhanced fields
const allBig12TeamsData = [
  // Teams we've already added
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
    venueType: "indoor",
    setupTime: 120,
    teardownTime: 90,
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
    venueType: "indoor",
    setupTime: 90,
    teardownTime: 60,
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
    venueType: "indoor",
    setupTime: 100,
    teardownTime: 70,
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
    rivals: ["Baylor", "Texas Tech"]
  },
  
  // Additional Big 12 Teams
  {
    name: "Oklahoma",
    nickname: "Sooners",
    abbreviation: "OU",
    city: "Norman",
    state: "OK",
    latitude: 35.2226,
    longitude: -97.4395,
    primaryColor: "#841617",
    secondaryColor: "#FDF9D8",
    venueName: "Lloyd Noble Center",
    venueCapacity: 11562,
    website: "https://soonersports.com/",
    season: "2024-25",
    timeZone: "America/Chicago",
    travelConstraints: {
      maxTravelDistance: 1200,
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
    venueType: "indoor",
    setupTime: 110,
    teardownTime: 80,
    mediaFacilities: {
      broadcastBooths: 5,
      cameraPositions: 9,
      pressBoxCapacity: 60
    },
    nearbyTransportHubs: [
      {
        name: "Will Rogers World Airport",
        type: "airport",
        distanceInMiles: 24.3
      }
    ],
    accessibilityFeatures: {
      wheelchairSeating: true,
      assistedListeningDevices: true,
      accessibleRestrooms: true
    },
    rivals: ["Oklahoma State"]
  },
  {
    name: "Oklahoma State",
    nickname: "Cowboys",
    abbreviation: "OSU",
    city: "Stillwater",
    state: "OK",
    latitude: 36.1156,
    longitude: -97.0584,
    primaryColor: "#FF7300",
    secondaryColor: "#000000",
    venueName: "Gallagher-Iba Arena",
    venueCapacity: 13611,
    website: "https://okstate.com/",
    season: "2024-25",
    timeZone: "America/Chicago",
    travelConstraints: {
      maxTravelDistance: 1300,
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
    venueType: "indoor",
    setupTime: 105,
    teardownTime: 75,
    mediaFacilities: {
      broadcastBooths: 4,
      cameraPositions: 8,
      pressBoxCapacity: 50
    },
    nearbyTransportHubs: [
      {
        name: "Stillwater Regional Airport",
        type: "airport",
        distanceInMiles: 4.2
      }
    ],
    accessibilityFeatures: {
      wheelchairSeating: true,
      assistedListeningDevices: true,
      accessibleRestrooms: true
    },
    rivals: ["Oklahoma"]
  },
  {
    name: "Kansas",
    nickname: "Jayhawks",
    abbreviation: "KU",
    city: "Lawrence",
    state: "KS",
    latitude: 38.9717,
    longitude: -95.2353,
    primaryColor: "#0051BA",
    secondaryColor: "#E8000D",
    venueName: "Allen Fieldhouse",
    venueCapacity: 16300,
    website: "https://kuathletics.com/",
    season: "2024-25",
    timeZone: "America/Chicago",
    travelConstraints: {
      maxTravelDistance: 1400,
      preferredTravelDays: ["Thursday", "Friday"]
    },
    schedulingPriorities: {
      homeGamesWeighted: 0.8,
      rivalGamesWeighted: 0.9
    },
    blackoutDates: ["2024-12-24", "2024-12-25", "2025-01-01"],
    mediaContracts: {
      espn: true,
      fox: true,
      streamingServices: ["ESPN+"]
    },
    venueType: "indoor",
    setupTime: 120,
    teardownTime: 90,
    mediaFacilities: {
      broadcastBooths: 6,
      cameraPositions: 10,
      pressBoxCapacity: 70
    },
    nearbyTransportHubs: [
      {
        name: "Kansas City International Airport",
        type: "airport",
        distanceInMiles: 50.1
      }
    ],
    accessibilityFeatures: {
      wheelchairSeating: true,
      assistedListeningDevices: true,
      accessibleRestrooms: true
    },
    rivals: ["K-State"]
  },
  {
    name: "K-State",
    nickname: "Wildcats",
    abbreviation: "KSU",
    city: "Manhattan",
    state: "KS",
    latitude: 39.1836,
    longitude: -96.5717,
    primaryColor: "#512888",
    secondaryColor: "#FFFFFF",
    venueName: "Bramlage Coliseum",
    venueCapacity: 12528,
    website: "https://kstatesports.com/",
    season: "2024-25",
    timeZone: "America/Chicago",
    travelConstraints: {
      maxTravelDistance: 1300,
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
    venueType: "indoor",
    setupTime: 100,
    teardownTime: 70,
    mediaFacilities: {
      broadcastBooths: 4,
      cameraPositions: 8,
      pressBoxCapacity: 50
    },
    nearbyTransportHubs: [
      {
        name: "Manhattan Regional Airport",
        type: "airport",
        distanceInMiles: 7.8
      }
    ],
    accessibilityFeatures: {
      wheelchairSeating: true,
      assistedListeningDevices: true,
      accessibleRestrooms: true
    },
    rivals: ["Kansas"]
  }
];

function getSupportedSportsArray(teamName) {
  // Return arrays of sport IDs (integers)
  // Sport IDs from database: 
  // 1 = Football, 2 = Men's Basketball, 3 = Women's Basketball
  switch (teamName) {
    case "Texas Tech":
    case "Baylor":
    case "Oklahoma":
    case "Oklahoma State":
    case "Kansas":
    case "K-State":
      return '{2,3}'; // Men's and Women's Basketball
    case "TCU":
      return '{1,2,3}'; // Football, Men's and Women's Basketball
    default:
      return '{2,3}'; // Default to Men's and Women's Basketball
  }
}

async function seedCompleteBig12() {
  logger.info('Starting Complete Big 12 seed for Neon DB...');
  
  // Create a client with the direct connection string
  const client = new Client(connectionString);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Get the sport ID for Men's Basketball
    const sportResult = await client.query(`
      SELECT sport_id FROM sports WHERE abbreviation = 'MBB' LIMIT 1;
    `);
    
    let sportId;
    
    if (sportResult.rows.length === 0) {
      throw new Error("Men's Basketball sport not found. Please run the database initialization script first.");
    } else {
      sportId = sportResult.rows[0].sport_id;
      logger.info(`Found Men's Basketball sport with ID: ${sportId}`);
    }
    
    // Process each team
    for (const teamData of allBig12TeamsData) {
      // Create or update institution
      const institutionResult = await client.query(`
        SELECT institution_id FROM institutions WHERE abbreviation = $1 LIMIT 1;
      `, [teamData.abbreviation]);
      
      let institutionId;
      
      if (institutionResult.rows.length === 0) {
        // Insert new institution
        const insertInstitutionResult = await client.query(`
          INSERT INTO institutions (
            name, abbreviation, mascot, primary_color, secondary_color,
            city, state, latitude, longitude,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING institution_id;
        `, [
          teamData.name, 
          teamData.abbreviation, 
          teamData.nickname,
          teamData.primaryColor,
          teamData.secondaryColor,
          teamData.city,
          teamData.state,
          teamData.latitude,
          teamData.longitude
        ]);
        
        institutionId = insertInstitutionResult.rows[0].institution_id;
        logger.info(`Created institution: ${teamData.name} (ID: ${institutionId})`);
      } else {
        // Update existing institution
        institutionId = institutionResult.rows[0].institution_id;
        await client.query(`
          UPDATE institutions 
          SET name = $1, mascot = $2, primary_color = $3, secondary_color = $4,
              city = $5, state = $6, latitude = $7, longitude = $8
          WHERE institution_id = $9;
        `, [
          teamData.name, 
          teamData.nickname,
          teamData.primaryColor,
          teamData.secondaryColor,
          teamData.city,
          teamData.state,
          teamData.latitude,
          teamData.longitude,
          institutionId
        ]);
        
        logger.info(`Updated institution: ${teamData.name} (ID: ${institutionId})`);
      }
      
      // Create or update team with enhanced fields
      const teamResult = await client.query(`
        SELECT team_id FROM teams 
        WHERE institution_id = $1 AND sport_id = $2 LIMIT 1;
      `, [institutionId, sportId]);
      
      let teamId;
      
      if (teamResult.rows.length === 0) {
        // Insert new team with enhanced fields
        const insertTeamResult = await client.query(`
          INSERT INTO teams (
            name, institution_id, sport_id, season, time_zone,
            travel_constraints, rival_teams, scheduling_priority, 
            blackout_dates, media_contracts, code,
            created_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
            NOW(), NOW()
          )
          RETURNING team_id;
        `, [
          teamData.name, 
          institutionId, 
          sportId,
          teamData.season,
          teamData.timeZone,
          JSON.stringify(teamData.travelConstraints),
          '{1,2,3}', // Placeholder for rival_teams as integer array
          8, // Scheduling priority
          '{2024-12-24,2024-12-25,2025-01-01}', // Blackout dates as date array
          JSON.stringify(teamData.mediaContracts),
          teamData.abbreviation
        ]);
        
        teamId = insertTeamResult.rows[0].team_id;
        logger.info(`Created team: ${teamData.name} (ID: ${teamId})`);
      } else {
        // Update existing team
        teamId = teamResult.rows[0].team_id;
        await client.query(`
          UPDATE teams 
          SET name = $1, season = $2, time_zone = $3,
              travel_constraints = $4, scheduling_priority = $5,
              blackout_dates = $6, media_contracts = $7,
              code = $8
          WHERE team_id = $9;
        `, [
          teamData.name,
          teamData.season,
          teamData.timeZone,
          JSON.stringify(teamData.travelConstraints),
          8, // Scheduling priority
          '{2024-12-24,2024-12-25,2025-01-01}', // Blackout dates as date array
          JSON.stringify(teamData.mediaContracts),
          teamData.abbreviation,
          teamId
        ]);
        
        logger.info(`Updated team: ${teamData.name} (ID: ${teamId})`);
      }
      
      // Create or update venue with enhanced fields
      const venueResult = await client.query(`
        SELECT venue_id FROM venues WHERE name = $1 LIMIT 1;
      `, [teamData.venueName]);
      
      let venueId;
      
      if (venueResult.rows.length === 0) {
        // Insert new venue with enhanced fields
        const insertVenueResult = await client.query(`
          INSERT INTO venues (
            name, city, state, capacity, institution_id,
            venue_type, setup_time_required, teardown_time_required, 
            media_facilities, transport_hubs, accessibility_features,
            latitude, longitude, supported_sports,
            created_at, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            NOW(), NOW()
          )
          RETURNING venue_id;
        `, [
          teamData.venueName,
          teamData.city,
          teamData.state,
          teamData.venueCapacity,
          institutionId,
          teamData.venueType,
          teamData.setupTime,
          teamData.teardownTime,
          JSON.stringify(teamData.mediaFacilities),
          JSON.stringify(teamData.nearbyTransportHubs),
          JSON.stringify(teamData.accessibilityFeatures),
          teamData.latitude,
          teamData.longitude,
          getSupportedSportsArray(teamData.name)
        ]);
        
        venueId = insertVenueResult.rows[0].venue_id;
        logger.info(`Created venue: ${teamData.venueName} (ID: ${venueId})`);
      } else {
        // Update existing venue
        venueId = venueResult.rows[0].venue_id;
        await client.query(`
          UPDATE venues 
          SET city = $1, state = $2, capacity = $3, institution_id = $4,
              venue_type = $5, setup_time_required = $6, teardown_time_required = $7,
              media_facilities = $8, transport_hubs = $9, accessibility_features = $10,
              latitude = $11, longitude = $12, supported_sports = $13
          WHERE venue_id = $14;
        `, [
          teamData.city,
          teamData.state,
          teamData.venueCapacity,
          institutionId,
          teamData.venueType,
          teamData.setupTime,
          teamData.teardownTime,
          JSON.stringify(teamData.mediaFacilities),
          JSON.stringify(teamData.nearbyTransportHubs),
          JSON.stringify(teamData.accessibilityFeatures),
          teamData.latitude,
          teamData.longitude,
          getSupportedSportsArray(teamData.name),
          venueId
        ]);
        
        logger.info(`Updated venue: ${teamData.venueName} (ID: ${venueId})`);
      }
    }
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Complete Big 12 seed completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to seed Complete Big 12: ${error.message}`);
    logger.error(error.stack);
    
    // Try to close the connection if it was opened
    try {
      await client.end();
    } catch (closeError) {
      // Ignore errors when closing
    }
    
    return false;
  }
}

// Run the script if executed directly
if (require.main === module) {
  seedCompleteBig12()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  seedCompleteBig12
};
