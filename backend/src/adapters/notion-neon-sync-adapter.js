/**
 * Notion to Neon DB Sync Adapter for FlexTime
 * 
 * This adapter provides bidirectional syncing between Notion databases and Neon PostgreSQL.
 * It handles:
 * 1. Syncing Notion contacts to Neon DB
 * 2. Syncing FlexTime schedules from Neon DB to Notion
 * 3. Two-way syncing of specific entities
 */

const { Client } = require('@notionhq/client');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logger = require('../scripts/logger");
const neonConfig = require('../../config/neon_db_config');

// Load Notion environment variables
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
    
    logger.info('Loaded Notion environment variables from: ' + notionEnvPath);
  } catch (error) {
    logger.error('Error loading Notion environment variables:', error.message);
  }
}

// Load environment variables
loadNotionEnv();

class NotionNeonSyncAdapter {
  constructor() {
    // Initialize Notion client
    this.apiKey = process.env.NOTION_API_KEY;
    if (!this.apiKey) {
      throw new Error('NOTION_API_KEY environment variable not set');
    }
    
    this.contactsDatabaseId = process.env.NOTION_DATABASE_ID;
    this.schedulesDatabaseId = process.env.NOTION_SCHEDULE_DATABASE_ID;
    
    this.notionClient = new Client({ auth: this.apiKey });
    
    // Initialize Neon DB connection
    this.sequelize = new Sequelize(neonConfig.connectionString, {
      dialect: 'postgres',
      dialectOptions: neonConfig.connection.dialectOptions,
      logging: neonConfig.logging ? console.log : false,
      pool: neonConfig.pool
    });
    
    logger.info('NotionNeonSyncAdapter initialized');
  }
  
  /**
   * Test both connections to ensure they're working
   */
  async testConnections() {
    try {
      // Test Notion connection
      const notionUsers = await this.notionClient.users.list({});
      logger.info(`Connected to Notion API. Found ${notionUsers.results.length} users.`);
      
      // Test Neon DB connection
      await this.sequelize.authenticate();
      logger.info('Connected to Neon DB successfully.');
      
      return {
        notion: true,
        neonDb: true,
        message: 'Successfully connected to both Notion and Neon DB'
      };
    } catch (error) {
      logger.error(`Error testing connections: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync contacts from Notion to Neon DB
   */
  async syncContactsToNeonDB() {
    try {
      logger.info('Starting sync of contacts from Notion to Neon DB');
      
      // 1. Fetch contacts from Notion
      const notionContacts = await this.fetchAllNotionContacts();
      logger.info(`Fetched ${notionContacts.length} contacts from Notion`);
      
      // 2. Prepare contacts for Neon DB
      const transformedContacts = this.transformContactsForNeonDB(notionContacts);
      
      // 3. Sync to Neon DB using a transaction
      const result = await this.sequelize.transaction(async (t) => {
        // Check if contacts table exists, if not create it
        await this.ensureContactsTableExists(t);
        
        // Insert or update contacts
        let created = 0;
        let updated = 0;
        
        for (const contact of transformedContacts) {
          // Try to find existing contact by email (if available) or name
          const whereClause = contact.email 
            ? { email: contact.email }
            : { first_name: contact.first_name, last_name: contact.last_name };
          
          const [contactRecord, wasCreated] = await this.sequelize.models.Contact.findOrCreate({
            where: whereClause,
            defaults: contact,
            transaction: t
          });
          
          if (wasCreated) {
            created++;
          } else {
            // Update existing contact
            await contactRecord.update(contact, { transaction: t });
            updated++;
          }
        }
        
        return { created, updated };
      });
      
      logger.info(`Contacts sync completed. Created: ${result.created}, Updated: ${result.updated}`);
      return result;
    } catch (error) {
      logger.error(`Error syncing contacts to Neon DB: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Fetch all contacts from Notion
   */
  async fetchAllNotionContacts() {
    try {
      // Query the contacts database
      const response = await this.notionClient.databases.query({
        database_id: this.contactsDatabaseId,
        page_size: 100 // Maximum page size
      });
      
      // Transform results into a more usable format
      const contacts = response.results.map(page => {
        const props = page.properties;
        
        // Extract first name and last name from full name
        let firstName = '';
        let lastName = '';
        
        const fullName = props.Name?.title?.[0]?.plain_text || '';
        if (fullName) {
          const nameParts = fullName.split(' ');
          firstName = props['First Name']?.rich_text?.[0]?.plain_text || nameParts[0] || '';
          lastName = props['Last Name']?.rich_text?.[0]?.plain_text || 
                     (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
        }
        
        return {
          id: page.id,
          notion_id: page.id,
          name: fullName,
          first_name: firstName,
          last_name: lastName,
          email: props['E-Mail']?.email || null,
          phone: props.Phone?.phone_number || null,
          affiliation: props.Affiliation?.select?.name || null,
          title: props.Title?.select?.name || null,
          sports: props.Sport?.multi_select?.map(s => s.name) || [],
          roles: props['Sport Role']?.multi_select?.map(r => r.name) || [],
          department: props['Department [Conf. Office]']?.select?.name || null,
          last_synced: new Date()
        };
      });
      
      return contacts;
    } catch (error) {
      logger.error(`Error fetching contacts from Notion: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Transform contacts for Neon DB
   */
  transformContactsForNeonDB(notionContacts) {
    return notionContacts.map(contact => {
      return {
        notion_id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        affiliation: contact.affiliation,
        title: contact.title,
        sports: JSON.stringify(contact.sports),
        roles: JSON.stringify(contact.roles),
        department: contact.department,
        last_synced: contact.last_synced
      };
    });
  }
  
  /**
   * Ensure contacts table exists in Neon DB
   */
  async ensureContactsTableExists(transaction) {
    // Define the Contact model if it doesn't exist
    if (!this.sequelize.models.Contact) {
      const { DataTypes } = Sequelize;
      
      this.sequelize.define('Contact', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        notion_id: {
          type: DataTypes.STRING,
          unique: true
        },
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        email: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: true
        },
        phone: DataTypes.STRING,
        affiliation: DataTypes.STRING,
        title: DataTypes.STRING,
        sports: DataTypes.JSON,
        roles: DataTypes.JSON,
        department: DataTypes.STRING,
        last_synced: DataTypes.DATE
      }, {
        tableName: 'conference_contacts',
        underscored: true,
        timestamps: true
      });
    }
    
    // Sync the model with the database
    await this.sequelize.models.Contact.sync({ transaction });
  }
  
  /**
   * Sync schedules from Neon DB to Notion
   */
  async syncSchedulesToNotion(sportType = null) {
    try {
      if (!this.schedulesDatabaseId) {
        throw new Error('NOTION_SCHEDULE_DATABASE_ID environment variable not set');
      }
      
      logger.info(`Starting sync of ${sportType || 'all'} schedules from Neon DB to Notion`);
      
      // 1. Fetch schedules from Neon DB
      const schedules = await this.fetchSchedulesFromNeonDB(sportType);
      logger.info(`Fetched ${schedules.length} schedules from Neon DB`);
      
      // 2. Transform schedules for Notion
      const transformedSchedules = this.transformSchedulesForNotion(schedules);
      
      // 3. Sync to Notion
      let created = 0;
      let updated = 0;
      let failed = 0;
      
      for (const schedule of transformedSchedules) {
        try {
          // Check if the schedule already exists in Notion
          const existingPages = await this.notionClient.databases.query({
            database_id: this.schedulesDatabaseId,
            filter: {
              and: [
                {
                  property: "Game ID",
                  rich_text: {
                    equals: schedule.neonId.toString()
                  }
                }
              ]
            }
          });
          
          if (existingPages.results.length > 0) {
            // Update existing page
            const pageId = existingPages.results[0].id;
            await this.notionClient.pages.update({
              page_id: pageId,
              properties: schedule.properties
            });
            updated++;
          } else {
            // Create new page
            await this.notionClient.pages.create({
              parent: {
                database_id: this.schedulesDatabaseId
              },
              properties: schedule.properties
            });
            created++;
          }
        } catch (error) {
          logger.error(`Error syncing schedule to Notion: ${error.message}`);
          failed++;
        }
      }
      
      logger.info(`Schedules sync completed. Created: ${created}, Updated: ${updated}, Failed: ${failed}`);
      return { created, updated, failed };
    } catch (error) {
      logger.error(`Error syncing schedules to Notion: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Fetch schedules from Neon DB
   */
  async fetchSchedulesFromNeonDB(sportType = null) {
    try {
      // SQL query to fetch schedules
      let query = `
        SELECT 
          g.id, 
          g.date, 
          g.start_time,
          g.home_team_id, 
          g.away_team_id,
          g.venue_id,
          g.sport_id,
          g.is_conference_game,
          g.tv_network,
          g.notes,
          ht.name as home_team_name,
          at.name as away_team_name,
          v.name as venue_name,
          s.name as sport_name
        FROM games g
        JOIN teams ht ON g.home_team_id = ht.id
        JOIN teams at ON g.away_team_id = at.id
        LEFT JOIN venues v ON g.venue_id = v.id
        JOIN sports s ON g.sport_id = s.id
      `;
      
      // Add sport filter if specified
      if (sportType) {
        query += ` WHERE s.name = :sportType`;
      }
      
      // Order by date
      query += ` ORDER BY g.date, g.start_time`;
      
      // Execute query
      const [schedules] = await this.sequelize.query(query, {
        replacements: sportType ? { sportType } : {},
        type: Sequelize.QueryTypes.SELECT
      });
      
      return schedules;
    } catch (error) {
      logger.error(`Error fetching schedules from Neon DB: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Transform schedules for Notion
   */
  transformSchedulesForNotion(schedules) {
    return schedules.map(schedule => {
      // Format date and time
      const gameDate = schedule.date ? new Date(schedule.date) : null;
      const startTime = schedule.start_time ? schedule.start_time : null;
      
      // Combine date and time if both exist
      let dateTimeString = null;
      if (gameDate) {
        if (startTime) {
          // Parse start_time (assuming format like "19:30:00")
          const [hours, minutes] = startTime.split(':');
          gameDate.setHours(parseInt(hours, 10));
          gameDate.setMinutes(parseInt(minutes, 10));
        }
        dateTimeString = gameDate.toISOString();
      }
      
      // Game title
      const gameTitle = `${schedule.home_team_name} vs ${schedule.away_team_name}`;
      
      return {
        neonId: schedule.id,
        properties: {
          "Game Title": {
            title: [
              {
                type: "text",
                text: {
                  content: gameTitle
                }
              }
            ]
          },
          "Date": dateTimeString ? {
            date: {
              start: dateTimeString
            }
          } : null,
          "Home Team": {
            select: {
              name: schedule.home_team_name
            }
          },
          "Away Team": {
            select: {
              name: schedule.away_team_name
            }
          },
          "Venue": schedule.venue_name ? {
            rich_text: [
              {
                type: "text",
                text: {
                  content: schedule.venue_name
                }
              }
            ]
          } : null,
          "Sport": {
            select: {
              name: schedule.sport_name
            }
          },
          "Conference Game": {
            checkbox: schedule.is_conference_game
          },
          "TV Network": schedule.tv_network ? {
            select: {
              name: schedule.tv_network
            }
          } : null,
          "Notes": schedule.notes ? {
            rich_text: [
              {
                type: "text",
                text: {
                  content: schedule.notes
                }
              }
            ]
          } : null,
          "Game ID": {
            rich_text: [
              {
                type: "text",
                text: {
                  content: schedule.id.toString()
                }
              }
            ]
          }
        }
      };
    });
  }
  
  /**
   * Sync schedule updates from Notion back to Neon DB
   */
  async syncScheduleUpdatesFromNotion() {
    try {
      if (!this.schedulesDatabaseId) {
        throw new Error('NOTION_SCHEDULE_DATABASE_ID environment variable not set');
      }
      
      logger.info('Starting sync of schedule updates from Notion to Neon DB');
      
      // 1. Fetch schedules from Notion
      const response = await this.notionClient.databases.query({
        database_id: this.schedulesDatabaseId,
        page_size: 100
      });
      
      // 2. Process each schedule
      let updated = 0;
      let skipped = 0;
      
      for (const page of response.results) {
        try {
          const props = page.properties;
          
          // Get Game ID from properties
          const gameIdProp = props["Game ID"]?.rich_text?.[0]?.plain_text;
          if (!gameIdProp) {
            logger.warn(`Skipping Notion schedule page ${page.id} with no Game ID`);
            skipped++;
            continue;
          }
          
          const gameId = parseInt(gameIdProp, 10);
          if (isNaN(gameId)) {
            logger.warn(`Skipping Notion schedule page ${page.id} with invalid Game ID: ${gameIdProp}`);
            skipped++;
            continue;
          }
          
          // Extract updatable properties
          const updates = {};
          
          // Notes
          if (props["Notes"]?.rich_text?.[0]?.plain_text) {
            updates.notes = props["Notes"].rich_text[0].plain_text;
          }
          
          // TV Network
          if (props["TV Network"]?.select?.name) {
            updates.tv_network = props["TV Network"].select.name;
          }
          
          // Only update if there are changes
          if (Object.keys(updates).length > 0) {
            // Update the game in Neon DB
            const [rowsAffected] = await this.sequelize.query(
              `UPDATE games SET ${
                Object.keys(updates).map(key => `${key} = :${key}`).join(', ')
              } WHERE id = :gameId`,
              {
                replacements: { ...updates, gameId },
                type: Sequelize.QueryTypes.UPDATE
              }
            );
            
            if (rowsAffected > 0) {
              updated++;
              logger.info(`Updated game ID ${gameId} in Neon DB from Notion changes`);
            } else {
              logger.warn(`Game ID ${gameId} not found in Neon DB`);
              skipped++;
            }
          } else {
            skipped++;
          }
        } catch (error) {
          logger.error(`Error processing Notion schedule page ${page.id}: ${error.message}`);
          skipped++;
        }
      }
      
      logger.info(`Schedule updates sync completed. Updated: ${updated}, Skipped: ${skipped}`);
      return { updated, skipped };
    } catch (error) {
      logger.error(`Error syncing schedule updates from Notion: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Close connections
   */
  async close() {
    try {
      await this.sequelize.close();
      logger.info('Closed Neon DB connection');
    } catch (error) {
      logger.error(`Error closing connections: ${error.message}`);
    }
  }
}

module.exports = new NotionNeonSyncAdapter();