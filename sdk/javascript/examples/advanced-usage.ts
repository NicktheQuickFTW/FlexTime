import { FlextimeClient, FlextimeError } from '@flextime/sdk';

const client = new FlextimeClient({
  apiKey: process.env.FLEXTIME_API_KEY!,
  timeout: 60000 // 60 second timeout
});

// Error handling example
async function handleErrors() {
  try {
    const entry = await client.timeEntries.get('invalid-id');
  } catch (error) {
    if (error instanceof FlextimeError) {
      console.error('Flextime Error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details
      });

      // Handle specific error codes
      switch (error.code) {
        case 'NOT_FOUND':
          console.log('Time entry not found');
          break;
        case 'UNAUTHORIZED':
          console.log('Invalid API key');
          break;
        case 'RATE_LIMITED':
          console.log('Too many requests');
          break;
      }
    }
  }
}

// Batch operations example
async function batchOperations() {
  const projectId = 'project-123';
  const entries = [
    { description: 'Task 1', duration: 3600 },
    { description: 'Task 2', duration: 5400 },
    { description: 'Task 3', duration: 2700 }
  ];

  // Create multiple entries
  const promises = entries.map(entry => 
    client.timeEntries.create({
      projectId,
      description: entry.description,
      startTime: new Date(Date.now() - entry.duration * 1000).toISOString(),
      endTime: new Date().toISOString(),
      billable: true
    })
  );

  const results = await Promise.allSettled(promises);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Entry ${index + 1} created:`, result.value.data.id);
    } else {
      console.error(`Entry ${index + 1} failed:`, result.reason);
    }
  });
}

// Reporting example
async function generateReports() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);

  // Generate monthly report
  const report = await client.reports.generate({
    type: 'detailed',
    startDate: startOfMonth.toISOString(),
    endDate: endOfMonth.toISOString(),
    filters: {
      billable: true
    },
    format: 'json'
  });

  console.log('Report generated:', report.data.id);

  // Download as CSV
  const csvBlob = await client.reports.download(report.data.id, 'csv');
  
  // Save to file (Node.js)
  if (typeof window === 'undefined') {
    const fs = require('fs');
    const buffer = Buffer.from(await csvBlob.arrayBuffer());
    fs.writeFileSync('report.csv', buffer);
  }
}

// Pagination example
async function paginateTimeEntries() {
  let page = 1;
  let hasMore = true;
  const allEntries = [];

  while (hasMore) {
    const response = await client.timeEntries.list({
      page,
      limit: 100
    });

    allEntries.push(...response.data);

    if (response.meta && response.meta.total) {
      hasMore = page * 100 < response.meta.total;
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`Total entries: ${allEntries.length}`);
}

// Real-time tracking example
async function trackTime() {
  // Check if timer is already running
  const current = await client.timeEntries.current();
  
  if (current.data) {
    console.log('Timer already running:', current.data.description);
    
    // Stop current timer
    await client.timeEntries.stop(current.data.id);
    console.log('Stopped previous timer');
  }

  // Start new timer
  const projects = await client.projects.list({ active: true });
  const timer = await client.timeEntries.start(
    projects.data[0].id,
    'Working on important task'
  );

  console.log('Started new timer:', timer.data.id);

  // Simulate work for 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Stop timer
  const completed = await client.timeEntries.stop(timer.data.id);
  console.log('Time tracked:', completed.data.duration, 'seconds');
}

// Run examples
async function runExamples() {
  await handleErrors();
  await batchOperations();
  await generateReports();
  await paginateTimeEntries();
  await trackTime();
}

runExamples().catch(console.error);