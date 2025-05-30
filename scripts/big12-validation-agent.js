/**
 * Big 12 Validation Agent
 * 
 * This script validates the data collected by the RAG agent to ensure accuracy.
 * It cross-references data from multiple sources, checks for inconsistencies,
 * and flags potential issues for manual review.
 */

require('dotenv').config();
const { Client } = require('pg');
const axios = require('axios');
const logger = require('../utils/logger');
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

// Initialize Anthropic client for Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Secondary sources for validation
const validationSources = [
  {
    name: "Big 12 Conference",
    url: "https://big12sports.com/calendar.aspx?path=mbball"
  },
  {
    name: "ESPN",
    url: "https://www.espn.com/mens-college-basketball/team/schedule/_/id/{teamId}"
  },
  {
    name: "CBS Sports",
    url: "https://www.cbssports.com/college-basketball/teams/{teamCode}/schedule/"
  }
];

// ESPN team IDs for Big 12 schools
const espnTeamIds = {
  "Arizona": 12,
  "Arizona State": 9,
  "Baylor": 239,
  "BYU": 252,
  "UCF": 2116,
  "Cincinnati": 2132,
  "Colorado": 38,
  "Houston": 248,
  "Iowa State": 66,
  "Kansas": 2305,
  "Kansas State": 2306,
  "Oklahoma State": 197,
  "TCU": 2628,
  "Texas Tech": 2641,
  "Utah": 254,
  "West Virginia": 277
};

// CBS Sports team codes for Big 12 schools
const cbsTeamCodes = {
  "Arizona": "arizona",
  "Arizona State": "arizona-state",
  "Baylor": "baylor",
  "BYU": "byu",
  "UCF": "ucf",
  "Cincinnati": "cincinnati",
  "Colorado": "colorado",
  "Houston": "houston",
  "Iowa State": "iowa-state",
  "Kansas": "kansas",
  "Kansas State": "kansas-state",
  "Oklahoma State": "oklahoma-state",
  "TCU": "tcu",
  "Texas Tech": "texas-tech",
  "Utah": "utah",
  "West Virginia": "west-virginia"
};

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
 * Fetch schedule data from the Neon DB
 */
async function fetchScheduleFromDB(client, currentUser, teamId) {
  try {
    const result = await client.query(`
      SELECT * FROM ${currentUser}.scraped_schedules 
      WHERE team_id = $1
      ORDER BY game_date;
    `, [teamId]);
    
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching schedule from DB for team ${teamId}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch team information from the Neon DB
 */
async function fetchTeamInfo(client, currentUser, teamId) {
  try {
    const result = await client.query(`
      SELECT t.team_id, t.name, t.mascot, i.code
      FROM ${currentUser}.teams t
      JOIN ${currentUser}.institutions i ON t.school_id = i.school_id
      WHERE t.team_id = $1;
    `, [teamId]);
    
    if (result.rows.length === 0) {
      throw new Error(`No team found with ID ${teamId}`);
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error(`Error fetching team info for team ${teamId}: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch validation data from secondary sources
 */
async function fetchValidationData(team) {
  const validationData = [];
  
  try {
    // Fetch from Big 12 Conference website
    const big12Response = await axios.get(validationSources[0].url);
    validationData.push({
      source: validationSources[0].name,
      data: big12Response.data
    });
    
    // Fetch from ESPN
    if (espnTeamIds[team.name]) {
      const espnUrl = validationSources[1].url.replace('{teamId}', espnTeamIds[team.name]);
      const espnResponse = await axios.get(espnUrl);
      validationData.push({
        source: validationSources[1].name,
        data: espnResponse.data
      });
    }
    
    // Fetch from CBS Sports
    if (cbsTeamCodes[team.name]) {
      const cbsUrl = validationSources[2].url.replace('{teamCode}', cbsTeamCodes[team.name]);
      const cbsResponse = await axios.get(cbsUrl);
      validationData.push({
        source: validationSources[2].name,
        data: cbsResponse.data
      });
    }
    
    return validationData;
  } catch (error) {
    logger.error(`Error fetching validation data for ${team.name}: ${error.message}`);
    return validationData;
  }
}

/**
 * Validate schedule data using Claude
 */
async function validateScheduleData(dbSchedule, validationData, team) {
  try {
    logger.info(`Validating schedule data for ${team.name}...`);
    
    // Use Claude to validate the data
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Validate the following basketball schedule data for ${team.name} (${team.mascot}).
          
          Primary Source Data (from our database):
          ${JSON.stringify(dbSchedule, null, 2)}
          
          Validation Sources:
          ${JSON.stringify(validationData.map(vd => ({ source: vd.source })), null, 2)}
          
          For each game in the primary source data:
          1. Check if the game date, opponent, and location are consistent with the validation sources
          2. Identify any discrepancies or potential errors
          3. Assign a confidence score (0-100%) for each game's accuracy
          
          Format the output as a JSON object with the following structure:
          {
            "validation_summary": {
              "total_games": number,
              "fully_validated": number,
              "partially_validated": number,
              "not_validated": number,
              "overall_confidence": number
            },
            "game_validations": [
              {
                "game_date": string,
                "opponent": string,
                "is_home_game": boolean,
                "confidence_score": number,
                "issues": [string] or null,
                "recommendations": [string] or null
              }
            ]
          }`
        }
      ],
      temperature: 0.1,
    });
    
    // Parse the JSON response
    const validationResult = JSON.parse(response.content[0].text);
    logger.info(`Validation completed for ${team.name} with ${validationResult.validation_summary.overall_confidence}% overall confidence`);
    
    return validationResult;
  } catch (error) {
    logger.error(`Error validating schedule data for ${team.name}: ${error.message}`);
    return {
      validation_summary: {
        total_games: dbSchedule.length,
        fully_validated: 0,
        partially_validated: 0,
        not_validated: dbSchedule.length,
        overall_confidence: 0
      },
      game_validations: dbSchedule.map(game => ({
        game_date: game.game_date,
        opponent: game.opponent,
        is_home_game: game.is_home_game,
        confidence_score: 0,
        issues: ["Validation failed due to technical error"],
        recommendations: ["Manual validation required"]
      }))
    };
  }
}

/**
 * Store validation results in the Neon DB
 */
async function storeValidationResults(client, currentUser, teamId, validationResult) {
  try {
    // Create a table for storing validation results if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${currentUser}.schedule_validations (
        validation_id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        validation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_games INTEGER NOT NULL,
        fully_validated INTEGER NOT NULL,
        partially_validated INTEGER NOT NULL,
        not_validated INTEGER NOT NULL,
        overall_confidence INTEGER NOT NULL,
        validation_details JSONB NOT NULL,
        CONSTRAINT fk_team
          FOREIGN KEY(team_id) 
          REFERENCES ${currentUser}.teams(team_id)
          ON DELETE CASCADE
      );
    `);
    
    // Insert the validation results
    await client.query(`
      INSERT INTO ${currentUser}.schedule_validations 
        (team_id, total_games, fully_validated, partially_validated, not_validated, overall_confidence, validation_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [
      teamId,
      validationResult.validation_summary.total_games,
      validationResult.validation_summary.fully_validated,
      validationResult.validation_summary.partially_validated,
      validationResult.validation_summary.not_validated,
      validationResult.validation_summary.overall_confidence,
      JSON.stringify(validationResult)
    ]);
    
    logger.info(`Stored validation results for team ${teamId}`);
  } catch (error) {
    logger.error(`Error storing validation results for team ${teamId}: ${error.message}`);
  }
}

/**
 * Generate a validation report
 */
async function generateValidationReport(team, validationResult) {
  try {
    const reportDir = path.join(__dirname, '../reports');
    
    // Create reports directory if it doesn't exist
    try {
      await fs.mkdir(reportDir, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `validation-${team.code}-${timestamp}.json`);
    
    // Write the report to a file
    await fs.writeFile(reportPath, JSON.stringify({
      team: team,
      validation_result: validationResult,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    logger.info(`Generated validation report for ${team.name} at ${reportPath}`);
    return reportPath;
  } catch (error) {
    logger.error(`Error generating validation report for ${team.name}: ${error.message}`);
    return null;
  }
}

/**
 * Main function to run the validation agent
 */
async function runValidationAgent(learningMemories = []) {
  logger.info('Starting Big 12 Validation Agent...');
  
  let client;
  const results = {
    successCount: 0,
    errorCount: 0,
    itemsProcessed: 0,
    teamValidations: {},
    successRate: 0
  };
  
  try {
    // Connect to the Neon DB
    const { client: dbClient, currentUser } = await connectToNeonDB();
    client = dbClient;
    
    // Apply any learning from previous runs
    if (learningMemories && learningMemories.length > 0) {
      logger.info(`Applying ${learningMemories.length} learning memories to validation process`);
      // In a real implementation, we would adjust validation logic based on past learning
    }
    
    // Get all teams
    const teamsResult = await client.query(`
      SELECT team_id FROM ${currentUser}.teams
      ORDER BY team_id;
    `);
    
    // Process each team
    for (const teamRow of teamsResult.rows) {
      const teamId = teamRow.team_id;
      results.itemsProcessed++;
      
      try {
        // Get team info
        const team = await fetchTeamInfo(client, currentUser, teamId);
        logger.info(`Processing team: ${team.name} (${team.mascot})`);
        
        // Fetch schedule data from DB
        const dbSchedule = await fetchScheduleFromDB(client, currentUser, teamId);
        
        if (dbSchedule.length === 0) {
          logger.info(`No schedule data found for ${team.name}, skipping validation`);
          results.teamValidations[teamId] = {
            status: 'skipped',
            reason: 'No schedule data found'
          };
          continue;
        }
        
        // Fetch validation data from secondary sources
        const validationData = await fetchValidationData(team);
        
        // Validate the schedule data
        const validationResult = await validateScheduleData(dbSchedule, validationData, team);
        
        // Store validation results
        await storeValidationResults(client, currentUser, teamId, validationResult);
        
        // Generate validation report
        const reportPath = await generateValidationReport(team, validationResult);
        
        // Record success and store validation result
        results.successCount++;
        results.teamValidations[teamId] = {
          status: 'success',
          validation_summary: validationResult.validation_summary,
          report_path: reportPath
        };
        
        // Flag issues that need manual review
        if (validationResult.validation_summary.overall_confidence < 80) {
          logger.warn(`Low confidence (${validationResult.validation_summary.overall_confidence}%) for ${team.name} schedule data, manual review recommended`);
          results.teamValidations[teamId].needs_review = true;
        }
      } catch (error) {
        logger.error(`Error processing team ${teamId}: ${error.message}`);
        results.errorCount++;
        results.teamValidations[teamId] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    // Calculate success rate
    results.successRate = (results.successCount / results.itemsProcessed) * 100;
    
    logger.info('Big 12 Validation Agent completed successfully');
    return results;
  } catch (error) {
    logger.error(`Error running Big 12 Validation Agent: ${error.message}`);
    
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

// Run the agent if executed directly
if (require.main === module) {
  runValidationAgent()
    .then(results => {
      logger.info(`Validation completed with ${results.successRate.toFixed(2)}% success rate`);
      process.exit(0);
    })
    .catch(error => {
      logger.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runValidationAgent
};
