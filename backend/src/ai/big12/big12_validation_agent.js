/**
 * Big 12 Validation Agent
 * 
 * This agent validates the data collected by the RAG agent to ensure accuracy.
 * It cross-references data from multiple sources, checks for inconsistencies,
 * and flags potential issues for manual review.
 */

const Agent = require('../agent');
const { Client } = require('pg');
const axios = require('axios');
const logger = require('../../utils/logger');
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

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

class Big12ValidationAgent extends Agent {
  /**
   * Initialize a new Big12ValidationAgent.
   * 
   * @param {object} config - Configuration object
   * @param {object} mcpConnector - MCP connector for LLM interaction
   */
  constructor(config, mcpConnector) {
    super('big12_validation', 'specialized', mcpConnector);
    
    this.config = config;
    this.neonConnection = config.neonConnection || process.env.NEON_DB_CONNECTION_STRING;
    this.currentUser = null;
    this.dbClient = null;
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    logger.info('Big12ValidationAgent initialized');
  }
  
  /**
   * Start the agent and initialize necessary systems
   */
  async start() {
    try {
      await this.connectToNeonDB();
      await super.start();
      
      logger.info(`Big12ValidationAgent started with connection to Neon DB as user ${this.currentUser}`);
    } catch (error) {
      logger.error(`Error starting Big12ValidationAgent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stop the agent and cleanup resources
   */
  async stop() {
    try {
      if (this.dbClient) {
        await this.dbClient.end();
        this.dbClient = null;
      }
      
      await super.stop();
      logger.info('Big12ValidationAgent stopped');
    } catch (error) {
      logger.error(`Error stopping Big12ValidationAgent: ${error.message}`);
    }
  }
  
  /**
   * Connect to the Neon DB
   */
  async connectToNeonDB() {
    this.dbClient = new Client(this.neonConnection);
    await this.dbClient.connect();
    
    // Get the current user
    const userResult = await this.dbClient.query('SELECT current_user;');
    this.currentUser = userResult.rows[0].current_user;
    
    // Set the search path to use the user's schema
    await this.dbClient.query(`SET search_path TO ${this.currentUser}, public;`);
    
    logger.info(`Connected to Neon DB as user ${this.currentUser}`);
  }
  
  /**
   * Fetch schedule data from the Neon DB
   */
  async fetchScheduleFromDB(teamId) {
    try {
      const result = await this.dbClient.query(`
        SELECT * FROM ${this.currentUser}.scraped_schedules 
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
  async fetchTeamInfo(teamId) {
    try {
      const result = await this.dbClient.query(`
        SELECT t.team_id, t.name, t.mascot, i.code
        FROM ${this.currentUser}.teams t
        JOIN ${this.currentUser}.institutions i ON t.institution_id = i.institution_id
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
  async fetchValidationData(team) {
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
  async validateScheduleData(dbSchedule, validationData, team) {
    try {
      logger.info(`Validating schedule data for ${team.name}...`);
      
      // Use Claude to validate the data
      const response = await this.anthropic.messages.create({
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
  async storeValidationResults(teamId, validationResult) {
    try {
      // Create a table for storing validation results if it doesn't exist
      await this.dbClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.currentUser}.schedule_validations (
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
            REFERENCES ${this.currentUser}.teams(team_id)
            ON DELETE CASCADE
        );
      `);
      
      // Insert the validation results
      await this.dbClient.query(`
        INSERT INTO ${this.currentUser}.schedule_validations 
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
      throw error;
    }
  }
  
  /**
   * Generate a validation report
   */
  async generateValidationReport(team, validationResult) {
    try {
      const reportDir = path.join(__dirname, '../../reports');
      
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
   * Validate a single team's schedule data
   */
  async validateTeam(teamId) {
    try {
      // Get team info
      const team = await this.fetchTeamInfo(teamId);
      logger.info(`Validating team: ${team.name} (${team.mascot})`);
      
      // Fetch schedule data from DB
      const dbSchedule = await this.fetchScheduleFromDB(teamId);
      
      if (dbSchedule.length === 0) {
        logger.info(`No schedule data found for ${team.name}, skipping validation`);
        return {
          status: 'skipped',
          reason: 'No schedule data found'
        };
      }
      
      // Fetch validation data from secondary sources
      const validationData = await this.fetchValidationData(team);
      
      // Validate the schedule data
      const validationResult = await this.validateScheduleData(dbSchedule, validationData, team);
      
      // Store validation results
      await this.storeValidationResults(teamId, validationResult);
      
      // Generate validation report
      const reportPath = await this.generateValidationReport(team, validationResult);
      
      // Return the validation result
      const result = {
        status: 'success',
        team: team,
        validation_summary: validationResult.validation_summary,
        report_path: reportPath
      };
      
      // Flag issues that need manual review
      if (validationResult.validation_summary.overall_confidence < 80) {
        logger.warn(`Low confidence (${validationResult.validation_summary.overall_confidence}%) for ${team.name} schedule data, manual review recommended`);
        result.needs_review = true;
      }
      
      return result;
    } catch (error) {
      logger.error(`Error validating team ${teamId}: ${error.message}`);
      return {
        status: 'error',
        team_id: teamId,
        error: error.message
      };
    }
  }
  
  /**
   * Validate all teams
   */
  async validateAllTeams(learningMemories = []) {
    logger.info('Starting validation for all teams...');
    
    const results = {
      successCount: 0,
      errorCount: 0,
      itemsProcessed: 0,
      teamValidations: {},
      successRate: 0
    };
    
    // Apply any learning from previous runs
    if (learningMemories && learningMemories.length > 0) {
      logger.info(`Applying ${learningMemories.length} learning memories to validation process`);
      // In a real implementation, we would adjust validation logic based on past learning
    }
    
    try {
      // Get all teams
      const teamsResult = await this.dbClient.query(`
        SELECT team_id FROM ${this.currentUser}.teams
        ORDER BY team_id;
      `);
      
      // Process each team
      for (const teamRow of teamsResult.rows) {
        const teamId = teamRow.team_id;
        results.itemsProcessed++;
        
        try {
          const teamResult = await this.validateTeam(teamId);
          
          if (teamResult.status === 'success') {
            results.successCount++;
          } else if (teamResult.status === 'error') {
            results.errorCount++;
          }
          
          results.teamValidations[teamId] = teamResult;
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
      
      logger.info(`Validation completed for all teams with ${results.successRate.toFixed(2)}% success rate`);
      return results;
    } catch (error) {
      logger.error(`Error validating all teams: ${error.message}`);
      
      results.errorCount++;
      results.successRate = (results.successCount / Math.max(results.itemsProcessed, 1)) * 100;
      
      return results;
    }
  }
  
  /**
   * Process a task.
   * Implements the abstract method from the base Agent class.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   * @private
   */
  async _processTask(task) {
    logger.info(`Processing task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'validate_all_teams':
        return await this.validateAllTeams(task.parameters.learningMemories);
      
      case 'validate_team':
        return await this.validateTeam(task.parameters.teamId);
      
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
  
  /**
   * Process a non-task message.
   * 
   * @param {object} message - The message to process
   * @private
   */
  _processMessage(message) {
    if (message.messageType === 'query') {
      if (message.content.type === 'status') {
        // Respond with agent status
        this.sendMessage(
          message.senderId,
          'response',
          {
            status: 'active',
            dbConnection: !!this.dbClient,
            metrics: this.metrics
          },
          { inResponseTo: message.messageId }
        );
      } else {
        super._processMessage(message);
      }
    } else {
      super._processMessage(message);
    }
  }
  
  /**
   * Process a subtask result.
   * 
   * @param {string} taskId - ID of the parent task
   * @param {string} subtaskId - ID of the subtask
   * @param {any} result - Subtask result
   * @private
   */
  _processSubtaskResult(taskId, subtaskId, result) {
    logger.info(`Subtask ${subtaskId} for task ${taskId} completed with result: ${JSON.stringify(result)}`);
    
    // Update the parent task with the subtask result
    const task = this.activeTasks.get(taskId);
    if (task) {
      if (!task.subResults) {
        task.subResults = {};
      }
      
      task.subResults[subtaskId] = result;
    }
  }
  
  /**
   * Process a subtask failure.
   * 
   * @param {string} taskId - ID of the parent task
   * @param {string} subtaskId - ID of the subtask
   * @param {string} error - Error message
   * @private
   */
  _processSubtaskFailure(taskId, subtaskId, error) {
    logger.error(`Subtask ${subtaskId} for task ${taskId} failed with error: ${error}`);
    
    // Update the parent task with the subtask failure
    const task = this.activeTasks.get(taskId);
    if (task) {
      if (!task.subErrors) {
        task.subErrors = {};
      }
      
      task.subErrors[subtaskId] = error;
    }
  }
}

module.exports = Big12ValidationAgent;