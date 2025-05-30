import { FlextimeClient } from '@flextime/sdk';

// Initialize the client
const client = new FlextimeClient({
  apiKey: 'your-api-key-here',
  baseURL: 'https://api.flextime.io/v1' // Optional: defaults to production
});

async function basicExample() {
  try {
    // Check API health
    const health = await client.health();
    console.log('API Status:', health.data.status);

    // Get current user
    const currentUser = await client.users.me();
    console.log('Current User:', currentUser.data);

    // List all projects
    const projects = await client.projects.list({ active: true });
    console.log('Active Projects:', projects.data);

    // Create a new time entry
    const newEntry = await client.timeEntries.create({
      projectId: projects.data[0].id,
      description: 'Working on SDK development',
      startTime: new Date().toISOString(),
      tags: ['development', 'sdk'],
      billable: true
    });
    console.log('Created Time Entry:', newEntry.data);

    // Start a timer
    const timer = await client.timeEntries.start(
      projects.data[0].id,
      'Implementing new feature'
    );
    console.log('Started Timer:', timer.data);

    // Stop the timer
    const stopped = await client.timeEntries.stop(timer.data.id);
    console.log('Stopped Timer:', stopped.data);

    // Get time entries for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const entries = await client.timeEntries.list({
      startDate: sevenDaysAgo.toISOString(),
      endDate: new Date().toISOString(),
      limit: 50
    });
    console.log('Recent Time Entries:', entries.data);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
basicExample();