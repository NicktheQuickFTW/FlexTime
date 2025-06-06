/**
 * Test script for Notion to Neon DB Sync
 * 
 * This script tests the bidirectional synchronization between 
 * Notion databases and Neon PostgreSQL.
 */

const notionNeonSync = require('../adapters/notion-neon-sync-adapter');
const logger = require('../scripts/logger');

async function testNotionNeonSync() {
  try {
    logger.info('Starting Notion to Neon DB sync test');
    
    // 1. Test connections
    logger.info('Testing connections to Notion and Neon DB...');
    const connectionTest = await notionNeonSync.testConnections();
    console.log('Connection test results:', connectionTest);
    
    // 2. Sync contacts from Notion to Neon DB
    logger.info('Syncing contacts from Notion to Neon DB...');
    console.log('\nThis will create/update a "conference_contacts" table in your Neon DB.');
    console.log('IMPORTANT: Before proceeding, make sure you want to perform this operation.');
    console.log('To continue with contacts sync, uncomment the line in this script.');
    
    // Uncomment the following line to perform the sync
    // const contactsResult = await notionNeonSync.syncContactsToNeonDB();
    // console.log('Contacts sync result:', contactsResult);
    
    // 3. Demo of scheduling sync
    console.log('\nTo sync FlexTime schedules to Notion:');
    console.log('1. Create a new database in Notion with these properties:');
    console.log('   - Game Title (title)');
    console.log('   - Date (date)');
    console.log('   - Home Team (select)');
    console.log('   - Away Team (select)');
    console.log('   - Venue (rich_text)');
    console.log('   - Sport (select)');
    console.log('   - Conference Game (checkbox)');
    console.log('   - TV Network (select)');
    console.log('   - Notes (rich_text)');
    console.log('   - Game ID (rich_text) - important for syncing!');
    console.log('2. Share the database with your integration');
    console.log('3. Add the database ID to your ~/.env/notion.env file:');
    console.log('   NOTION_SCHEDULE_DATABASE_ID=your_notion_schedule_database_id');
    console.log('4. Uncomment the schedules sync code in this script');
    
    // Uncomment the following lines to perform the schedule sync
    /*
    // Sync Men's Basketball schedules
    console.log('\nSyncing Men\'s Basketball schedules to Notion...');
    const schedulesResult = await notionNeonSync.syncSchedulesToNotion("Men's Basketball");
    console.log('Schedules sync result:', schedulesResult);
    
    // Sync schedule updates back from Notion to Neon DB
    console.log('\nSyncing schedule updates from Notion to Neon DB...');
    const updatesResult = await notionNeonSync.syncScheduleUpdatesFromNotion();
    console.log('Schedule updates sync result:', updatesResult);
    */
    
    // Close connections
    await notionNeonSync.close();
    logger.info('Notion to Neon DB sync test completed successfully');
  } catch (error) {
    logger.error(`Error in Notion to Neon DB sync test: ${error.message}`);
    console.error(`Test failed: ${error.message}`);
    
    // Ensure connections are closed on error
    try {
      await notionNeonSync.close();
    } catch (closeError) {
      logger.error(`Error closing connections: ${closeError.message}`);
    }
  }
}

// Run the test
testNotionNeonSync();