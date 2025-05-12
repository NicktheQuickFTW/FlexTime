/**
 * Big 12 Teams Database Seed
 * 
 * This script populates the HELiiX database with Big 12 conference teams data.
 * It creates Institution and Venue records for each team, ensuring accurate location data
 * for travel optimization and visualization.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const logger = require('../agents/utils/logger');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB connected successfully');
    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    return false;
  }
};

// Load models
const Institution = require('../../../mongodb/models/Institution');
const Venue = require('../../../mongodb/models/Venue');
const Championship = require('../../../mongodb/models/Championship');
const Team = require('../../../mongodb/models/Team');

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
    name: "Texas",
    nickname: "Longhorns",
    city: "Austin",
    state: "TX",
    latitude: 30.2672,
    longitude: -97.7431,
    primaryColor: "#BF5700",
    secondaryColor: "#FFFFFF",
    venueName: "Moody Center",
    venueCapacity: 15500,
    website: "https://texassports.com/"
  },
  {
    name: "Oklahoma",
    nickname: "Sooners",
    city: "Norman",
    state: "OK",
    latitude: 35.2226,
    longitude: -97.4395,
    primaryColor: "#841617",
    secondaryColor: "#FDF9D8",
    venueName: "Lloyd Noble Center",
    venueCapacity: 11562,
    website: "https://soonersports.com/"
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
    latitude: 39.1320,
    longitude: -84.5155,
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
    secondaryColor: "#000000",
    venueName: "Fertitta Center",
    venueCapacity: 7100,
    website: "https://uhcougars.com/"
  },
  {
    name: "Arizona",
    nickname: "Wildcats",
    city: "Tucson",
    state: "AZ",
    latitude: 32.2226,
    longitude: -110.9747,
    primaryColor: "#CC0033",
    secondaryColor: "#003366",
    venueName: "McKale Center",
    venueCapacity: 14644,
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

// Create a championship for Big 12 if it doesn't exist
const createBig12Championship = async () => {
  try {
    let championship = await Championship.findOne({ championship_name: "Big 12 Conference" });
    
    if (!championship) {
      championship = new Championship({
        championship_name: "Big 12 Conference",
        championship_abbreviation: "Big 12",
        championship_type: "Conference",
        sport: "Basketball",
        season: "2025-2026",
        start_date: new Date("2025-11-01"),
        end_date: new Date("2026-03-15")
      });
      
      await championship.save();
      logger.info("Created Big 12 Championship record");
    }
    
    return championship;
  } catch (error) {
    logger.error(`Error creating Big 12 Championship: ${error.message}`);
    throw error;
  }
};

// Seed the database with Big 12 teams
const seedBig12Teams = async () => {
  try {
    // Connect to the database
    const connected = await connectDB();
    if (!connected) {
      logger.error("Failed to connect to MongoDB. Aborting seed operation.");
      return;
    }
    
    // Create the Big 12 championship
    const championship = await createBig12Championship();
    
    // Process each team
    for (const teamData of big12TeamsData) {
      // Check if institution already exists
      let institution = await Institution.findOne({ 
        institution_name: teamData.name 
      });
      
      // Create institution if it doesn't exist
      if (!institution) {
        institution = new Institution({
          institution_name: teamData.name,
          institution_abbreviation: teamData.name.substring(0, 3).toUpperCase(),
          institution_location: `${teamData.city}, ${teamData.state}`,
          primary_color: teamData.primaryColor,
          secondary_color: teamData.secondaryColor,
          mascot: teamData.nickname,
          website_url: teamData.website,
          active_status: true
        });
        
        await institution.save();
        logger.info(`Created institution: ${teamData.name}`);
      }
      
      // Check if venue already exists
      let venue = await Venue.findOne({ 
        venue_name: teamData.venueName 
      });
      
      // Create venue if it doesn't exist
      if (!venue) {
        venue = new Venue({
          venue_name: teamData.venueName,
          venue_abbreviation: teamData.venueName.split(' ').map(word => word[0]).join(''),
          city: teamData.city,
          state: teamData.state,
          capacity: teamData.venueCapacity,
          indoor_outdoor: 'Indoor' // Default for basketball venues
        });
        
        await venue.save();
        logger.info(`Created venue: ${teamData.venueName}`);
      }
      
      // Check if team already exists
      let team = await Team.findOne({
        championship: championship._id,
        institution: institution._id
      });
      
      // Create team if it doesn't exist
      if (!team) {
        team = new Team({
          championship: championship._id,
          institution: institution._id,
          qualification_method: 'automatic',
          // Add location data as metadata for travel optimization
          metadata: {
            latitude: teamData.latitude,
            longitude: teamData.longitude,
            venue_id: venue._id
          }
        });
        
        await team.save();
        logger.info(`Created team: ${teamData.name} (${teamData.nickname})`);
      }
    }
    
    logger.info("Big 12 Teams database seed completed successfully");
    
    // Disconnect from the database
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
    
  } catch (error) {
    logger.error(`Error seeding Big 12 Teams: ${error.message}`);
    
    // Disconnect from the database
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  }
};

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedBig12Teams();
}

module.exports = { seedBig12Teams };
