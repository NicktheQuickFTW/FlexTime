/**
 * Big 12 RAG Agent
 * 
 * This agent scrapes data from Big 12 institution websites and stores it in the Neon DB.
 * It runs overnight to ensure the database is always up-to-date with the latest information.
 */

const Agent = require('../agent');
const { Client } = require('pg');
const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../scripts/logger");
const { Anthropic } = require('@anthropic-ai/sdk');
const cron = require('node-cron');

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

class Big12RagAgent extends Agent {
  /**
   * Initialize a new Big12RagAgent.
   * 
   * @param {object} config - Configuration object
   * @param {object} mcpConnector - MCP connector for LLM interaction
   */
  constructor(config, mcpConnector) {
    super('big12_rag', 'specialized', mcpConnector);
    
    this.config = config;
    this.neonConnection = config.neonConnection || process.env.NEON_DB_CONNECTION_STRING;
    this.currentUser = null;
    this.dbClient = null;
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    logger.info('Big12RagAgent initialized');
  }
  
  /**
   * Start the agent and initialize necessary systems
   */
  async start() {
    try {
      await this.connectToNeonDB();
      await super.start();
      
      logger.info(`Big12RagAgent started with connection to Neon DB as user ${this.currentUser}`);
    } catch (error) {
      logger.error(`Error starting Big12RagAgent: ${error.message}`);
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
      logger.info('Big12RagAgent stopped');
    } catch (error) {
      logger.error(`Error stopping Big12RagAgent: ${error.message}`);
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
   * Scrape schedule data from an institution's website
   */
  async scrapeScheduleData(institution) {
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
  async extractStructuredData(rawData, institution) {
    try {
      logger.info(`Extracting structured data for ${institution.name}...`);
      
      // If no raw data was scraped, return empty array
      if (!rawData || rawData.length === 0) {
        return [];
      }
      
      // Use Claude to extract structured data
      const response = await this.anthropic.messages.create({
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
  async storeDataInNeonDB(data, institution) {
    try {
      logger.info(`Storing data for ${institution.name} in Neon DB...`);
      
      // If no data to store, return
      if (!data || data.length === 0) {
        logger.info(`No data to store for ${institution.name}`);
        return;
      }
      
      // Get the team ID for this institution
      const teamResult = await this.dbClient.query(`
        SELECT team_id FROM ${this.currentUser}.teams 
        WHERE school_id = $1 LIMIT 1;
      `, [institution.id]);
      
      if (teamResult.rows.length === 0) {
        logger.error(`No team found for institution ${institution.name}`);
        return;
      }
      
      const teamId = teamResult.rows[0].team_id;
      
      // Create a table for storing scraped schedule data if it doesn't exist
      await this.dbClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.currentUser}.scraped_schedules (
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
            REFERENCES ${this.currentUser}.teams(team_id)
            ON DELETE CASCADE
        );
      `);
      
      // Delete existing data for this team
      await this.dbClient.query(`
        DELETE FROM ${this.currentUser}.scraped_schedules 
        WHERE team_id = $1;
      `, [teamId]);
      
      // Insert the new data
      for (const game of data) {
        await this.dbClient.query(`
          INSERT INTO ${this.currentUser}.scraped_schedules 
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
      return data.length;
    } catch (error) {
      logger.error(`Error storing data for ${institution.name}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Run the data collection process for all institutions
   */
  async collectData() {
    logger.info('Starting data collection for all institutions...');
    
    const results = {
      successCount: 0,
      errorCount: 0,
      itemsProcessed: 0,
      teamResults: {}
    };
    
    // Process each institution
    for (const institution of big12Institutions) {
      try {
        results.itemsProcessed++;
        
        // Scrape schedule data
        const rawData = await this.scrapeScheduleData(institution);
        
        // Extract structured data
        const structuredData = await this.extractStructuredData(rawData, institution);
        
        // Store the data in the Neon DB
        const gamesStored = await this.storeDataInNeonDB(structuredData, institution);
        
        // Record success
        results.successCount++;
        results.teamResults[institution.id] = {
          status: 'success',
          gamesCollected: structuredData.length,
          gamesStored: gamesStored || 0
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
    
    logger.info(`Data collection completed: ${results.successCount}/${results.itemsProcessed} institutions successful`);
    return results;
  }
  
  /**
   * Schedule the agent to run on a recurring basis
   */
  scheduleRuns(cronExpression = '0 2 * * *') {
    // Default: Schedule the agent to run at 2:00 AM every day
    const job = cron.schedule(cronExpression, async () => {
      logger.info(`Running scheduled Big12RagAgent at ${new Date().toISOString()}`);
      
      const task = this.createTask(
        'collect_data',
        'Scheduled collection of Big 12 basketball schedule data',
        { scheduled: true, timestamp: new Date().toISOString() }
      );
      
      this.submitTask(task);
    });
    
    logger.info(`Big12RagAgent scheduled to run with cron expression: ${cronExpression}`);
    return job;
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
      case 'collect_data':
        return await this.collectData();
      
      case 'collect_institution_data':
        const institution = big12Institutions.find(inst => inst.id === task.parameters.schoolId);
        if (!institution) {
          throw new Error(`Institution with ID ${task.parameters.schoolId} not found`);
        }
        
        const rawData = await this.scrapeScheduleData(institution);
        const structuredData = await this.extractStructuredData(rawData, institution);
        const gamesStored = await this.storeDataInNeonDB(structuredData, institution);
        
        return {
          institution: institution.name,
          gamesCollected: structuredData.length,
          gamesStored: gamesStored || 0
        };
      
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

module.exports = Big12RagAgent;