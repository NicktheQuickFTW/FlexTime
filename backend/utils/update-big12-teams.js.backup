/**
 * Update Big 12 Teams in Neon DB
 * 
 * This script updates the Big 12 conference teams with the correct IDs
 * and removes Texas completely.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../utils/logger');

// Corrected Big 12 Teams data with specific IDs
const big12TeamsData = [
  {
    id: 1,
    name: "Arizona",
    nickname: "Wildcats",
    city: "Tucson",
    state: "AZ",
    latitude: 32.2319,
    longitude: -110.9501,
    primaryColor: "#CC0033",
    secondaryColor: "#003366",
    venueName: "McKale Center",
    venueCapacity: 14545,
    website: "https://arizonawildcats.com/"
  },
  {
    id: 2,
    name: "Arizona State",
    nickname: "Sun Devils",
    city: "Tempe",
    state: "AZ",
    latitude: 33.4255,
    longitude: -111.9400,
    primaryColor: "#8C1D40",
    secondaryColor: "#FFC627",
    venueName: "Desert Financial Arena",
    venueCapacity: 14000,
    website: "https://thesundevils.com/"
  },
  {
    id: 3,
    name: "Baylor",
    nickname: "Bears",
    city: "Waco",
    state: "TX",
    latitude: 31.5493,
    longitude: -97.1467,
    primaryColor: "#003015",
    secondaryColor: "#FFB81C",
    venueName: "Foster Pavilion",
    venueCapacity: 7000,
    website: "https://baylorbears.com/"
  },
  {
    id: 4,
    name: "BYU",
    nickname: "Cougars",
    city: "Provo",
    state: "UT",
    latitude: 40.2338,
    longitude: -111.6585,
    primaryColor: "#002E5D",
    secondaryColor: "#FFFFFF",
    venueName: "Marriott Center",
    venueCapacity: 19000,
    website: "https://byucougars.com/"
  },
  {
    id: 5,
    name: "UCF",
    nickname: "Knights",
    city: "Orlando",
    state: "FL",
    latitude: 28.6024,
    longitude: -81.2001,
    primaryColor: "#000000",
    secondaryColor: "#BA9B37",
    venueName: "Addition Financial Arena",
    venueCapacity: 10000,
    website: "https://ucfknights.com/"
  },
  {
    id: 6,
    name: "Cincinnati",
    nickname: "Bearcats",
    city: "Cincinnati",
    state: "OH",
    latitude: 39.1329,
    longitude: -84.5150,
    primaryColor: "#000000",
    secondaryColor: "#E00122",
    venueName: "Fifth Third Arena",
    venueCapacity: 12012,
    website: "https://gobearcats.com/"
  },
  {
    id: 7,
    name: "Colorado",
    nickname: "Buffaloes",
    city: "Boulder",
    state: "CO",
    latitude: 40.0076,
    longitude: -105.2659,
    primaryColor: "#CFB87C",
    secondaryColor: "#000000",
    venueName: "CU Events Center",
    venueCapacity: 11064,
    website: "https://cubuffs.com/"
  },
  {
    id: 8,
    name: "Houston",
    nickname: "Cougars",
    city: "Houston",
    state: "TX",
    latitude: 29.7604,
    longitude: -95.3698,
    primaryColor: "#C8102E",
    secondaryColor: "#FFFFFF",
    venueName: "Fertitta Center",
    venueCapacity: 7100,
    website: "https://uhcougars.com/"
  },
  {
    id: 9,
    name: "Iowa State",
    nickname: "Cyclones",
    city: "Ames",
    state: "IA",
    latitude: 42.0308,
    longitude: -93.6319,
    primaryColor: "#C8102E",
    secondaryColor: "#F1BE48",
    venueName: "Hilton Coliseum",
    venueCapacity: 14384,
    website: "https://cyclones.com/"
  },
  {
    id: 10,
    name: "Kansas",
    nickname: "Jayhawks",
    city: "Lawrence",
    state: "KS",
    latitude: 38.9717,
    longitude: -95.2353,
    primaryColor: "#0051BA",
    secondaryColor: "#E8000D",
    venueName: "Allen Fieldhouse",
    venueCapacity: 16300,
    website: "https://kuathletics.com/"
  },
  {
    id: 11,
    name: "Kansas State",
    nickname: "Wildcats",
    city: "Manhattan",
    state: "KS",
    latitude: 39.1836,
    longitude: -96.5717,
    primaryColor: "#512888",
    secondaryColor: "#FFFFFF",
    venueName: "Bramlage Coliseum",
    venueCapacity: 12528,
    website: "https://kstatesports.com/"
  },
  {
    id: 12,
    name: "Oklahoma State",
    nickname: "Cowboys",
    city: "Stillwater",
    state: "OK",
    latitude: 36.1156,
    longitude: -97.0584,
    primaryColor: "#FF7300",
    secondaryColor: "#000000",
    venueName: "Gallagher-Iba Arena",
    venueCapacity: 13611,
    website: "https://okstate.com/"
  },
  {
    id: 13,
    name: "TCU",
    nickname: "Horned Frogs",
    city: "Fort Worth",
    state: "TX",
    latitude: 32.7555,
    longitude: -97.3308,
    primaryColor: "#4D1979",
    secondaryColor: "#A3A9AC",
    venueName: "Schollmaier Arena",
    venueCapacity: 8500,
    website: "https://gofrogs.com/"
  },
  {
    id: 14,
    name: "Texas Tech",
    nickname: "Red Raiders",
    city: "Lubbock",
    state: "TX",
    latitude: 33.5779,
    longitude: -101.8552,
    primaryColor: "#CC0000",
    secondaryColor: "#000000",
    venueName: "United Supermarkets Arena",
    venueCapacity: 15098,
    website: "https://texastech.com/"
  },
  {
    id: 15,
    name: "Utah",
    nickname: "Utes",
    city: "Salt Lake City",
    state: "UT",
    latitude: 40.7608,
    longitude: -111.8910,
    primaryColor: "#CC0000",
    secondaryColor: "#FFFFFF",
    venueName: "Jon M. Huntsman Center",
    venueCapacity: 15000,
    website: "https://utahutes.com/"
  },
  {
    id: 16,
    name: "West Virginia",
    nickname: "Mountaineers",
    city: "Morgantown",
    state: "WV",
    latitude: 39.6295,
    longitude: -79.9559,
    primaryColor: "#002855",
    secondaryColor: "#EAAA00",
    venueName: "WVU Coliseum",
    venueCapacity: 14000,
    website: "https://wvusports.com/"
  }
];

async function updateBig12Teams() {
  logger.info('Starting Big 12 Teams update for Neon DB...');
  
  // Create a client with the direct connection string
  const client = new Client(process.env.NEON_DB_CONNECTION_STRING);
  
  try {
    // Connect to the database
    await client.connect();
    logger.info('Connected to Neon DB successfully');
    
    // Get the current user
    const userResult = await client.query('SELECT current_user;');
    const currentUser = userResult.rows[0].current_user;
    logger.info(`Current user: ${currentUser}`);
    
    // Set the search path to use the user's schema
    await client.query(`SET search_path TO ${currentUser}, public;`);
    logger.info(`Set search path to: ${currentUser}, public`);
    
    // First, remove Texas from Big 12
    await client.query(`
      DELETE FROM ${currentUser}.teams 
      WHERE name = 'Texas' 
      AND championship_id IN (
        SELECT championship_id FROM ${currentUser}.championships 
        WHERE code = 'BIG12'
      );
    `);
    logger.info('Removed Texas from Big 12');
    
    // Remove Oklahoma from all Big 12 sports
    await client.query(`
      DELETE FROM ${currentUser}.teams 
      WHERE name = 'Oklahoma';
    `);
    logger.info('Removed Oklahoma from all sports');
    
    // Get the championship ID for Big 12
    const championshipResult = await client.query(`
      SELECT championship_id FROM ${currentUser}.championships 
      WHERE code = 'BIG12' LIMIT 1;
    `);
    
    if (championshipResult.rows.length === 0) {
      throw new Error('Big 12 Championship not found. Please run create-neon-tables.js first.');
    }
    
    const championshipId = championshipResult.rows[0].championship_id;
    logger.info(`Found Big 12 Championship with ID: ${championshipId}`);
    
    // Get the sport ID for Basketball
    const sportResult = await client.query(`
      SELECT sport_id FROM ${currentUser}.sports 
      WHERE code = 'MBB' LIMIT 1;
    `);
    
    if (sportResult.rows.length === 0) {
      throw new Error('Basketball sport not found. Please run create-neon-tables.js first.');
    }
    
    const basketballSportId = sportResult.rows[0].sport_id;
    logger.info(`Found Basketball sport with ID: ${basketballSportId}`);
    
    // Reset sequences for institutions and teams
    await client.query(`
      SELECT setval('${currentUser}.institutions_institution_id_seq', 1, false);
      SELECT setval('${currentUser}.teams_team_id_seq', 1, false);
      SELECT setval('${currentUser}.venues_venue_id_seq', 1, false);
    `);
    logger.info('Reset sequences for institutions, teams, and venues');
    
    // Clear existing data to start fresh
    await client.query(`
      DELETE FROM ${currentUser}.venues;
      DELETE FROM ${currentUser}.teams;
      DELETE FROM ${currentUser}.institutions;
    `);
    logger.info('Cleared existing data to start fresh');
    
    // Process each team
    for (const teamData of big12TeamsData) {
      // Create institution with specific ID
      let institutionCode;
      
      // Use unique codes for each institution
      switch(teamData.name) {
        case "Arizona":
          institutionCode = "AZ";
          break;
        case "Arizona State":
          institutionCode = "ASU";
          break;
        case "Baylor":
          institutionCode = "BAY";
          break;
        case "BYU":
          institutionCode = "BYU";
          break;
        case "UCF":
          institutionCode = "UCF";
          break;
        case "Cincinnati":
          institutionCode = "CIN";
          break;
        case "Colorado":
          institutionCode = "COL";
          break;
        case "Houston":
          institutionCode = "HOU";
          break;
        case "Iowa State":
          institutionCode = "ISU";
          break;
        case "Kansas":
          institutionCode = "KU";
          break;
        case "Kansas State":
          institutionCode = "KSU";
          break;
        case "Oklahoma State":
          institutionCode = "OSU";
          break;
        case "TCU":
          institutionCode = "TCU";
          break;
        case "Texas Tech":
          institutionCode = "TTU";
          break;
        case "Utah":
          institutionCode = "UTA";
          break;
        case "West Virginia":
          institutionCode = "WVU";
          break;
        default:
          institutionCode = teamData.name.substring(0, 3).toUpperCase();
      }
      
      const institutionResult = await client.query(`
        INSERT INTO ${currentUser}.institutions (institution_id, name, short_name, code)
        VALUES ($1, $2, $3, $4)
        RETURNING institution_id;
      `, [teamData.id, teamData.name, teamData.nickname, institutionCode]);
      
      const institutionId = institutionResult.rows[0].institution_id;
      logger.info(`Created institution: ${teamData.name} (ID: ${institutionId})`);
      
      // Create team with specific ID
      const teamResult = await client.query(`
        INSERT INTO ${currentUser}.teams (team_id, name, mascot, institution_id, sport_id, championship_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING team_id;
      `, [teamData.id, teamData.name, teamData.nickname, institutionId, basketballSportId, championshipId]);
      
      const teamId = teamResult.rows[0].team_id;
      logger.info(`Created team: ${teamData.name} ${teamData.nickname} (ID: ${teamId})`);
      
      // Create venue with specific ID
      const venueResult = await client.query(`
        INSERT INTO ${currentUser}.venues (venue_id, name, city, state, capacity, team_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING venue_id;
      `, [teamData.id, teamData.venueName, teamData.city, teamData.state, teamData.venueCapacity, teamId]);
      
      const venueId = venueResult.rows[0].venue_id;
      logger.info(`Created venue: ${teamData.venueName} (ID: ${venueId})`);
    }
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Big 12 Teams update for Neon DB completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to update Big 12 Teams: ${error.message}`);
    
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
  updateBig12Teams()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  updateBig12Teams
};
