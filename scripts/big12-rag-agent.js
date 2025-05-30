/**
 * Big 12 RAG Agent
 * 
 * This script scrapes data from Big 12 institution websites and stores it in the Neon DB.
 * It runs overnight to ensure the database is always up-to-date with the latest information.
 */

require('dotenv').config();
const { Client } = require('pg');
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');
const { Anthropic } = require('@anthropic-ai/sdk');
const cron = require('node-cron');

// Initialize Anthropic client for Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Big 12 institution data with their websites
const big12Institutions = [
  {
    id: 1,
    name: "Arizona",
    code: "AZ",
    website: "https://arizonawildcats.com/",
    scheduleUrl: "https://arizonawildcats.com/sports/mens-basketball/schedule"
  },
  {
    id: 2,
    name: "Arizona State",
    code: "ASU",
    website: "https://thesundevils.com/",
    scheduleUrl: "https://thesundevils.com/sports/mens-basketball/schedule"
  },
  {
    id: 3,
    name: "Baylor",
    code: "BAY",
    website: "https://baylorbears.com/",
    scheduleUrl: "https://baylorbears.com/sports/mens-basketball/schedule"
  },
  {
    id: 4,
    name: "BYU",
    code: "BYU",
    website: "https://byucougars.com/",
    scheduleUrl: "https://byucougars.com/sports/m-basketball/schedule"
  },
  {
    id: 5,
    name: "UCF",
    code: "UCF",
    website: "https://ucfknights.com/",
    scheduleUrl: "https://ucfknights.com/sports/mens-basketball/schedule"
  },
  {
    id: 6,
    name: "Cincinnati",
    code: "CIN",
    website: "https://gobearcats.com/",
    scheduleUrl: "https://gobearcats.com/sports/mens-basketball/schedule"
  },
  {
    id: 7,
    name: "Colorado",
    code: "COL",
    website: "https://cubuffs.com/",
    scheduleUrl: "https://cubuffs.com/sports/mens-basketball/schedule"
  },
  {
    id: 8,
    name: "Houston",
    code: "HOU",
    website: "https://uhcougars.com/",
    scheduleUrl: "https://uhcougars.com/sports/mens-basketball/schedule"
  },
  {
    id: 9,
    name: "Iowa State",
    code: "ISU",
    website: "https://cyclones.com/",
    scheduleUrl: "https://cyclones.com/sports/mens-basketball/schedule"
  },
  {
    id: 10,
    name: "Kansas",
    code: "KU",
    website: "https://kuathletics.com/",
    scheduleUrl: "https://kuathletics.com/sports/mbball/schedule/"
  },
  {
    id: 11,
    name: "Kansas State",
    code: "KSU",
    website: "https://kstatesports.com/",
    scheduleUrl: "https://kstatesports.com/sports/mens-basketball/schedule"
  },
  {
    id: 12,
    name: "Oklahoma State",
    code: "OSU",
    website: "https://okstate.com/",
    scheduleUrl: "https://okstate.com/sports/mens-basketball/schedule"
  },
  {
    id: 13,
    name: "TCU",
    code: "TCU",
    website: "https://gofrogs.com/",
    scheduleUrl: "https://gofrogs.com/sports/mens-basketball/schedule"
  },
  {
    id: 14,
    name: "Texas Tech",
    code: "TTU",
    website: "https://texastech.com/",
    scheduleUrl: "https://texastech.com/sports/mens-basketball/schedule"
  },
  {
    id: 15,
    name: "Utah",
    code: "UTA",
    website: "https://utahutes.com/",
    scheduleUrl: "https://utahutes.com/sports/mens-basketball/schedule"
  },
  {
    id: 16,
    name: "West Virginia",
    code: "WVU",
    website: "https://wvusports.com/",
    scheduleUrl: "https://wvusports.com/sports/mens-basketball/schedule"
  }
];

/**
 * Connect to the Neon DB
 */
async function connectToNeonDB() {
  const client = new Client(process.env.NEON_DB_CONNECTION_STRING);
  await client.connect();
  
  // Get the current user
  const userResult = await client.query('SELECT current_user;');
  const currentUser = userResult.rows[0].current_user;
  
  // Set the search path to use the user's schema
  await client.query(`SET search_path TO ${currentUser}, public;`);
  
  return { client, currentUser };
}

/**
 * Scrape schedule data from an institution's website
 */
async function scrapeScheduleData(institution) {
  try {
    logger.info(`Scraping schedule data for ${institution.name}...`);
    
    // Fetch the schedule page
    const response = await axios.get(institution.scheduleUrl);
    const $ = cheerio.load(response.data);
    
    // Extract schedule data using cheerio
    // This is a simplified example - actual implementation would need to be adapted for each site
    const scheduleData = [];
    
    // Find schedule elements - this selector would need to be customized for each site
    $('.sidearm-schedule-game').each((i, el) => {
      const date = $(el).find('.sidearm-schedule-game-opponent-date').text().trim();
      const opponent = $(el).find('.sidearm-schedule-game-opponent-name').text().trim();
      const location = $(el).find('.sidearm-schedule-game-location').text().trim();
      
      scheduleData.push({
        date,
        opponent,
        location
      });
    });
    
    logger.info(`Found ${scheduleData.length} schedule items for ${institution.name}`);
    return scheduleData;
  } catch (error) {
    logger.error(`Error scraping schedule data for ${institution.name}: ${error.message}`);
    return [];
  }
}

/**
 * Use Claude to extract structured data from the scraped content
 */
async function extractStructuredData(rawData, institution) {
  try {
    logger.info(`Extracting structured data for ${institution.name}...`);
    
    // If no raw data was scraped, return empty array
    if (!rawData || rawData.length === 0) {
      return [];
    }
    
    // Use Claude to extract structured data
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Extract the following information from this basketball schedule data for ${institution.name}:
          1. Game date (in YYYY-MM-DD format)
          2. Opponent name
          3. Whether it's a home or away game
          4. Venue name if available
          5. Game time if available (in 24-hour format)
          
          Format the output as a JSON array of objects with the following properties:
          - game_date
          - opponent
          - is_home_game (boolean)
          - venue
          - game_time
          
          Here's the raw data:
          ${JSON.stringify(rawData, null, 2)}`
        }
      ],
      temperature: 0.1,
    });
    
    // Parse the JSON response
    const structuredData = JSON.parse(response.content[0].text);
    logger.info(`Extracted structured data for ${institution.name}`);
    
    return structuredData.games || [];
  } catch (error) {
    logger.error(`Error extracting structured data for ${institution.name}: ${error.message}`);
    return [];
  }
}

/**
 * Store the structured data in the Neon DB
 */
async function storeDataInNeonDB(data, institution, client, currentUser) {
  try {
    logger.info(`Storing data for ${institution.name} in Neon DB...`);
    
    // If no data to store, return
    if (!data || data.length === 0) {
      logger.info(`No data to store for ${institution.name}`);
      return;
    }
    
    // Get the team ID for this institution
    const teamResult = await client.query(`
      SELECT team_id FROM ${currentUser}.teams 
      WHERE school_id = $1 LIMIT 1;
    `, [institution.id]);
    
    if (teamResult.rows.length === 0) {
      logger.error(`No team found for institution ${institution.name}`);
      return;
    }
    
    const teamId = teamResult.rows[0].team_id;
    
    // Create a table for storing scraped schedule data if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${currentUser}.scraped_schedules (
        schedule_id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        game_date DATE NOT NULL,
        opponent VARCHAR(255) NOT NULL,
        is_home_game BOOLEAN NOT NULL,
        venue VARCHAR(255),
        game_time VARCHAR(50),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_team
          FOREIGN KEY(team_id) 
          REFERENCES ${currentUser}.teams(team_id)
          ON DELETE CASCADE
      );
    `);
    
    // Delete existing data for this team
    await client.query(`
      DELETE FROM ${currentUser}.scraped_schedules 
      WHERE team_id = $1;
    `, [teamId]);
    
    // Insert the new data
    for (const game of data) {
      await client.query(`
        INSERT INTO ${currentUser}.scraped_schedules 
          (team_id, game_date, opponent, is_home_game, venue, game_time)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        teamId,
        game.game_date,
        game.opponent,
        game.is_home_game,
        game.venue || null,
        game.game_time || null
      ]);
    }
    
    logger.info(`Stored ${data.length} games for ${institution.name}`);
  } catch (error) {
    logger.error(`Error storing data for ${institution.name}: ${error.message}`);
  }
}

/**
 * Main function to run the RAG agent
 */
async function runRagAgent() {
  logger.info('Starting Big 12 RAG Agent...');
  
  let client;
  const results = {
    successCount: 0,
    errorCount: 0,
    itemsProcessed: 0,
    teamResults: {}
  };
  
  try {
    // Connect to the database
    const { client: dbClient, currentUser } = await connectToNeonDB();
    client = dbClient;
    
    // Process each institution
    for (const institution of big12Institutions) {
      try {
        results.itemsProcessed++;
        
        // Scrape schedule data
        const rawData = await scrapeScheduleData(institution);
        
        // Extract structured data
        const structuredData = await extractStructuredData(rawData, institution);
        
        // Store the data in the Neon DB
        await storeDataInNeonDB(structuredData, institution, client, currentUser);
        
        // Record success
        results.successCount++;
        results.teamResults[institution.id] = {
          status: 'success',
          gamesCollected: structuredData.length
        };
      } catch (error) {
        // Record error
        results.errorCount++;
        results.teamResults[institution.id] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    // Calculate success rate
    results.successRate = (results.successCount / results.itemsProcessed) * 100;
    
    logger.info('Big 12 RAG Agent completed successfully');
    return results;
  } catch (error) {
    logger.error(`Error running Big 12 RAG Agent: ${error.message}`);
    
    results.errorCount++;
    results.successRate = (results.successCount / Math.max(results.itemsProcessed, 1)) * 100;
    
    return results;
  } finally {
    // Close the database connection
    if (client) {
      await client.end();
    }
  }
}

/**
 * Schedule the RAG agent to run overnight
 */
function scheduleRagAgent() {
  // Schedule the agent to run at 2:00 AM every day
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running scheduled Big 12 RAG Agent...');
    await runRagAgent();
  });
  
  logger.info('Big 12 RAG Agent scheduled to run at 2:00 AM daily');
}

// Run the agent if executed directly
if (require.main === module) {
  if (process.argv.includes('--schedule')) {
    // Schedule the agent to run overnight
    scheduleRagAgent();
  } else {
    // Run the agent immediately
    runRagAgent()
      .then(() => {
        process.exit(0);
      })
      .catch(error => {
        logger.error(`Unexpected error: ${error.message}`);
        process.exit(1);
      });
  }
}

module.exports = {
  runRagAgent,
  scheduleRagAgent
};
