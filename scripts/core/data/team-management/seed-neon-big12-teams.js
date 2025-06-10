/**
 * Seed Big 12 Teams for Neon DB
 * 
 * This script populates the Neon DB with Big 12 conference teams data.
 * It creates Institution and Venue records for each team, ensuring accurate location data
 * for travel optimization and visualization.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('/Users/nickw/Documents/GitHub/Flextime/FlexTime/utils/logger.js');

// Big 12 Teams data
const big12TeamsData = [
  {
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
    name: "K-State",
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
  },
  {
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
  }
];

async function seedBig12Teams() {
  logger.info('Starting Big 12 Teams seed for Neon DB...');
  
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
    
    // Add unique constraints if they don't exist
    await addUniqueConstraints(client, currentUser);
    
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
    
    const sportId = sportResult.rows[0].sport_id;
    logger.info(`Found Basketball sport with ID: ${sportId}`);
    
    // Process each team
    for (const teamData of big12TeamsData) {
      // Create institution if it doesn't exist
      const institutionCode = teamData.name.substring(0, 3).toUpperCase();
      
      // First check if institution exists
      const checkInstitution = await client.query(`
        SELECT school_id FROM ${currentUser}.institutions 
        WHERE code = $1 LIMIT 1;
      `, [institutionCode]);
      
      let schoolId;
      
      if (checkInstitution.rows.length === 0) {
        // Insert new institution
        const institutionResult = await client.query(`
          INSERT INTO ${currentUser}.institutions (name, short_name, code)
          VALUES ($1, $2, $3)
          RETURNING school_id;
        `, [teamData.name, teamData.nickname, institutionCode]);
        
        schoolId = institutionResult.rows[0].school_id;
        logger.info(`Created institution: ${teamData.name} (ID: ${schoolId})`);
      } else {
        // Update existing institution
        schoolId = checkInstitution.rows[0].school_id;
        await client.query(`
          UPDATE ${currentUser}.institutions 
          SET name = $1, short_name = $2
          WHERE school_id = $3;
        `, [teamData.name, teamData.nickname, schoolId]);
        
        logger.info(`Updated institution: ${teamData.name} (ID: ${schoolId})`);
      }
      
      // Check if team exists
      const checkTeam = await client.query(`
        SELECT team_id FROM ${currentUser}.teams 
        WHERE school_id = $1 AND sport_id = $2 AND championship_id = $3 LIMIT 1;
      `, [schoolId, sportId, championshipId]);
      
      let teamId;
      
      if (checkTeam.rows.length === 0) {
        // Insert new team
        const teamResult = await client.query(`
          INSERT INTO ${currentUser}.teams (name, mascot, school_id, sport_id, championship_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING team_id;
        `, [teamData.name, teamData.nickname, schoolId, sportId, championshipId]);
        
        teamId = teamResult.rows[0].team_id;
        logger.info(`Created team: ${teamData.name} ${teamData.nickname} (ID: ${teamId})`);
      } else {
        // Update existing team
        teamId = checkTeam.rows[0].team_id;
        await client.query(`
          UPDATE ${currentUser}.teams 
          SET name = $1, mascot = $2
          WHERE team_id = $3;
        `, [teamData.name, teamData.nickname, teamId]);
        
        logger.info(`Updated team: ${teamData.name} ${teamData.nickname} (ID: ${teamId})`);
      }
      
      // Check if venue exists
      const checkVenue = await client.query(`
        SELECT venue_id FROM ${currentUser}.venues 
        WHERE name = $1 LIMIT 1;
      `, [teamData.venueName]);
      
      let venueId;
      
      if (checkVenue.rows.length === 0) {
        // Insert new venue
        const venueResult = await client.query(`
          INSERT INTO ${currentUser}.venues (name, city, state, capacity, team_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING venue_id;
        `, [teamData.venueName, teamData.city, teamData.state, teamData.venueCapacity, teamId]);
        
        venueId = venueResult.rows[0].venue_id;
        logger.info(`Created venue: ${teamData.venueName} (ID: ${venueId})`);
      } else {
        // Update existing venue
        venueId = checkVenue.rows[0].venue_id;
        await client.query(`
          UPDATE ${currentUser}.venues 
          SET city = $1, state = $2, capacity = $3, team_id = $4
          WHERE venue_id = $5;
        `, [teamData.city, teamData.state, teamData.venueCapacity, teamId, venueId]);
        
        logger.info(`Updated venue: ${teamData.venueName} (ID: ${venueId})`);
      }
    }
    
    // Close the connection
    await client.end();
    logger.info('Connection closed');
    
    logger.info('Big 12 Teams seed for Neon DB completed successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to seed Big 12 Teams: ${error.message}`);
    
    // Try to close the connection if it was opened
    try {
      await client.end();
    } catch (closeError) {
      // Ignore errors when closing
    }
    
    return false;
  }
}

async function addUniqueConstraints(client, schema) {
  try {
    // Add unique constraint to teams table
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'teams_name_sport_championship_unique' 
          AND conrelid = '${schema}.teams'::regclass
        ) THEN
          ALTER TABLE ${schema}.teams 
          ADD CONSTRAINT teams_name_sport_championship_unique 
          UNIQUE (name, sport_id, championship_id);
        END IF;
      EXCEPTION
        WHEN undefined_table THEN
          RAISE NOTICE 'Table ${schema}.teams does not exist';
      END $$;
    `);
    
    // Add unique constraint to venues table
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'venues_name_unique' 
          AND conrelid = '${schema}.venues'::regclass
        ) THEN
          ALTER TABLE ${schema}.venues 
          ADD CONSTRAINT venues_name_unique 
          UNIQUE (name);
        END IF;
      EXCEPTION
        WHEN undefined_table THEN
          RAISE NOTICE 'Table ${schema}.venues does not exist';
      END $$;
    `);
    
    logger.info('Added unique constraints to tables');
  } catch (error) {
    logger.error(`Error adding unique constraints: ${error.message}`);
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  seedBig12Teams()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  seedBig12Teams
};
