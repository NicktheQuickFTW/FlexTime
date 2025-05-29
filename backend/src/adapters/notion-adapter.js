/**
 * Notion API Adapter for FlexTime
 * This adapter provides functions to interact with Notion databases for the FlexTime application
 */

const { Client } = require('@notionhq/client');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Manually load Notion environment variables
function loadNotionEnv() {
  const notionEnvPath = path.resolve(process.env.HOME, '.env', 'notion.env');

  try {
    const envContent = fs.readFileSync(notionEnvPath, 'utf8');
    const envLines = envContent.split('\n');

    envLines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });

    console.log('Loaded Notion environment variables from:', notionEnvPath);
  } catch (error) {
    console.error('Error loading Notion environment variables:', error.message);
  }
}

// Load environment variables
loadNotionEnv();

class NotionAdapter {
  constructor() {
    // Initialize Notion client with API key from environment variables
    this.apiKey = process.env.NOTION_API_KEY;
    if (!this.apiKey) {
      throw new Error('NOTION_API_KEY environment variable not set. Please ensure your .env/notion.env file is properly configured.');
    }

    this.defaultDatabaseId = process.env.NOTION_DATABASE_ID;
    this.client = new Client({ auth: this.apiKey });

    console.log('Using Notion API Key:', this.apiKey.substring(0, 10) + '...');
    console.log('Using Default Database ID:', this.defaultDatabaseId);

    logger.info('Notion adapter initialized');
  }

  /**
   * Fetch data from a Notion database
   * @param {string} databaseId - The ID of the Notion database to query (optional, uses default if not provided)
   * @param {object} filter - Optional Notion filter object
   * @param {array} sorts - Optional Notion sorts array
   * @return {Promise<array>} Array of database items
   */
  async queryDatabase(databaseId = this.defaultDatabaseId, filter = undefined, sorts = undefined) {
    try {
      const queryParams = {
        database_id: databaseId,
        page_size: 100
      };
      
      if (filter) queryParams.filter = filter;
      if (sorts) queryParams.sorts = sorts;
      
      const response = await this.client.databases.query(queryParams);
      logger.info(`Successfully queried Notion database: ${databaseId}`);
      
      return response.results;
    } catch (error) {
      logger.error(`Error querying Notion database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new page in a Notion database
   * @param {string} databaseId - The ID of the database to add the page to
   * @param {object} properties - The properties for the new page
   * @return {Promise<object>} The created page
   */
  async createDatabaseItem(databaseId = this.defaultDatabaseId, properties) {
    try {
      const response = await this.client.pages.create({
        parent: {
          database_id: databaseId,
        },
        properties
      });
      
      logger.info(`Successfully created item in Notion database: ${databaseId}`);
      return response;
    } catch (error) {
      logger.error(`Error creating item in Notion database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing page in Notion
   * @param {string} pageId - The ID of the page to update
   * @param {object} properties - The properties to update
   * @return {Promise<object>} The updated page
   */
  async updateDatabaseItem(pageId, properties) {
    try {
      const response = await this.client.pages.update({
        page_id: pageId,
        properties
      });
      
      logger.info(`Successfully updated Notion page: ${pageId}`);
      return response;
    } catch (error) {
      logger.error(`Error updating Notion page: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieve all contacts from the Big 12 Conference Contacts database
   * @param {string} filter - Optional filter criteria (e.g., by sport, affiliation)
   * @return {Promise<array>} Array of contacts
   */
  async getConferenceContacts(filter = undefined) {
    try {
      let queryFilter = undefined;
      
      if (filter) {
        if (filter.sport) {
          queryFilter = {
            property: "Sport",
            multi_select: {
              contains: filter.sport
            }
          };
        } else if (filter.affiliation) {
          queryFilter = {
            property: "Affiliation",
            select: {
              equals: filter.affiliation
            }
          };
        }
      }
      
      const results = await this.queryDatabase(this.defaultDatabaseId, queryFilter);
      
      // Transform results into a more usable format
      return results.map(page => {
        const props = page.properties;
        
        return {
          id: page.id,
          name: props.Name?.title?.[0]?.plain_text || 'Unnamed Contact',
          email: props['E-Mail']?.email || null,
          phone: props.Phone?.phone_number || null,
          affiliation: props.Affiliation?.select?.name || null,
          title: props.Title?.select?.name || null,
          sports: props.Sport?.multi_select?.map(s => s.name) || [],
          roles: props['Sport Role']?.multi_select?.map(r => r.name) || []
        };
      });
    } catch (error) {
      logger.error(`Error getting conference contacts: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync schedule data to a Notion database
   * @param {string} scheduleDatabaseId - The ID of the Notion database for schedules
   * @param {array} scheduleData - Array of schedule objects to sync
   * @return {Promise<object>} Result of the sync operation
   */
  async syncScheduleData(scheduleDatabaseId, scheduleData) {
    try {
      // Implementation depends on your schedule data structure and the Notion database structure
      // This is a placeholder for the actual implementation
      
      logger.info(`Starting sync of ${scheduleData.length} schedule items to Notion`);
      
      // For each schedule item, create or update in Notion
      const results = {
        created: 0,
        updated: 0,
        failed: 0
      };
      
      for (const item of scheduleData) {
        try {
          // Convert your schedule item to Notion properties format
          const properties = this.convertScheduleToNotionProperties(item);
          
          // Check if the item already exists in Notion (you'd need to define a unique identifier)
          // For example, you might use a combination of teams and date
          
          // For now, we'll just create new items
          await this.createDatabaseItem(scheduleDatabaseId, properties);
          results.created++;
        } catch (error) {
          logger.error(`Failed to sync schedule item: ${error.message}`);
          results.failed++;
        }
      }
      
      logger.info(`Schedule sync completed. Created: ${results.created}, Updated: ${results.updated}, Failed: ${results.failed}`);
      return results;
    } catch (error) {
      logger.error(`Error syncing schedule data to Notion: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Convert a schedule item to Notion properties format
   * @param {object} scheduleItem - A schedule item from your system
   * @return {object} Notion properties object
   */
  convertScheduleToNotionProperties(scheduleItem) {
    // This implementation depends on your data structure
    // Here's an example assuming a game schedule
    
    return {
      "Game Title": {
        title: [
          {
            type: "text",
            text: {
              content: `${scheduleItem.homeTeam} vs ${scheduleItem.awayTeam}`
            }
          }
        ]
      },
      "Date": {
        date: {
          start: scheduleItem.date
        }
      },
      "Home Team": {
        select: {
          name: scheduleItem.homeTeam
        }
      },
      "Away Team": {
        select: {
          name: scheduleItem.awayTeam
        }
      },
      "Venue": {
        rich_text: [
          {
            type: "text",
            text: {
              content: scheduleItem.venue || ""
            }
          }
        ]
      },
      "Sport": {
        select: {
          name: scheduleItem.sport
        }
      }
      // Add other properties as needed
    };
  }
}

module.exports = new NotionAdapter();