/**
 * Test script for Notion integration with FlexTime
 * 
 * This script demonstrates how to use the Notion adapter to:
 * 1. Fetch contacts from the Big 12 Conference Contacts database
 * 2. Create a simple schedule in a Notion database
 */

const notionAdapter = require('../adapters/notion-adapter');
const logger = require('../scripts/logger');

// Sample schedule data that would come from your FlexTime system
const sampleScheduleData = [
  {
    homeTeam: 'Kansas',
    awayTeam: 'Iowa State',
    date: '2025-01-15',
    venue: 'Allen Fieldhouse',
    sport: 'Men\'s Basketball'
  },
  {
    homeTeam: 'Baylor',
    awayTeam: 'Texas Tech',
    date: '2025-01-18',
    venue: 'Foster Pavilion',
    sport: 'Men\'s Basketball'
  },
  {
    homeTeam: 'BYU',
    awayTeam: 'UCF',
    date: '2025-01-22',
    venue: 'Marriott Center',
    sport: 'Men\'s Basketball'
  }
];

async function testNotionIntegration() {
  try {
    logger.info('Starting Notion integration test');
    
    // PART 1: Test fetching contacts
    logger.info('Fetching contacts from Big 12 Conference Contacts database');
    
    // Get all basketball contacts
    const basketballContacts = await notionAdapter.getConferenceContacts({ 
      sport: 'Men\'s Basketball' 
    });
    
    logger.info(`Found ${basketballContacts.length} Men's Basketball contacts`);
    console.log('\nMen\'s Basketball Contacts:');
    basketballContacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.affiliation}): ${contact.email || 'No email'}`);
    });
    
    // Get contacts from a specific school
    const kansasContacts = await notionAdapter.getConferenceContacts({ 
      affiliation: 'Kansas' 
    });
    
    logger.info(`Found ${kansasContacts.length} Kansas contacts`);
    console.log('\nKansas Contacts:');
    kansasContacts.forEach(contact => {
      console.log(`- ${contact.name} (${contact.sports.join(', ')}): ${contact.email || 'No email'}`);
    });
    
    // PART 2: To create a schedule database in Notion, you would first need to:
    // 1. Manually create a new database in Notion with the appropriate properties
    // 2. Share that database with your integration
    // 3. Get the database ID and use it in the syncScheduleData function
    
    console.log('\nTo sync schedules to Notion:');
    console.log('1. Create a new database in Notion with these properties:');
    console.log('   - Game Title (title)');
    console.log('   - Date (date)');
    console.log('   - Home Team (select)');
    console.log('   - Away Team (select)');
    console.log('   - Venue (rich_text)');
    console.log('   - Sport (select)');
    console.log('2. Share the database with your integration');
    console.log('3. Get the database ID from the URL');
    console.log('4. Run the syncScheduleData function with that ID');
    
    // Uncomment the following code once you have created a schedule database
    /*
    const scheduleDatabaseId = 'YOUR_SCHEDULE_DATABASE_ID';
    console.log('\nSyncing sample schedule data to Notion...');
    const syncResult = await notionAdapter.syncScheduleData(scheduleDatabaseId, sampleScheduleData);
    console.log(`Sync completed: ${syncResult.created} items created, ${syncResult.updated} updated, ${syncResult.failed} failed`);
    */
    
    logger.info('Notion integration test completed successfully');
  } catch (error) {
    logger.error(`Error in Notion integration test: ${error.message}`);
    console.error(`Test failed: ${error.message}`);
  }
}

// Run the test
testNotionIntegration();