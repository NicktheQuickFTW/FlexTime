# Flextime JavaScript/TypeScript SDK

Official JavaScript/TypeScript SDK for the Flextime API.

## Installation

```bash
npm install @flextime/sdk
# or
yarn add @flextime/sdk
# or
pnpm add @flextime/sdk
```

## Quick Start

```typescript
import { FlextimeClient } from '@flextime/sdk';

const client = new FlextimeClient({
  apiKey: 'your-api-key-here'
});

// Start tracking time
const timer = await client.timeEntries.start('project-id', 'Working on task');

// Stop tracking
await client.timeEntries.stop(timer.data.id);
```

## Configuration

```typescript
const client = new FlextimeClient({
  apiKey: 'your-api-key',          // Required
  baseURL: 'https://custom.api',   // Optional: custom API endpoint
  timeout: 30000                   // Optional: request timeout in ms
});
```

## Resources

### Time Entries

```typescript
// List time entries
const entries = await client.timeEntries.list({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  userId: 'user-123',
  projectId: 'project-456',
  billable: true,
  page: 1,
  limit: 50
});

// Get a specific entry
const entry = await client.timeEntries.get('entry-id');

// Create a new entry
const newEntry = await client.timeEntries.create({
  projectId: 'project-id',
  description: 'Task description',
  startTime: '2024-01-01T09:00:00Z',
  endTime: '2024-01-01T17:00:00Z',
  tags: ['development', 'feature'],
  billable: true
});

// Update an entry
const updated = await client.timeEntries.update('entry-id', {
  description: 'Updated description',
  tags: ['development', 'bugfix']
});

// Delete an entry
await client.timeEntries.delete('entry-id');

// Timer functions
const timer = await client.timeEntries.start('project-id', 'Working on feature');
const stopped = await client.timeEntries.stop(timer.data.id);
const current = await client.timeEntries.current();
```

### Projects

```typescript
// List projects
const projects = await client.projects.list({
  active: true,
  billable: true,
  page: 1,
  limit: 20
});

// Create a project
const project = await client.projects.create({
  name: 'New Project',
  description: 'Project description',
  color: '#FF5733',
  billable: true,
  hourlyRate: 150,
  budget: 10000
});

// Archive/unarchive
await client.projects.archive('project-id');
await client.projects.unarchive('project-id');
```

### Users

```typescript
// Get current user
const me = await client.users.me();

// List users
const users = await client.users.list({
  active: true,
  role: 'user'
});

// User management (admin only)
const user = await client.users.create({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user',
  timezone: 'America/New_York'
});

await client.users.deactivate('user-id');
await client.users.activate('user-id');
```

### Reports

```typescript
// Generate a report
const report = await client.reports.generate({
  type: 'detailed',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  filters: {
    userIds: ['user-1', 'user-2'],
    projectIds: ['project-1'],
    billable: true
  },
  format: 'json'
});

// Download report
const csvBlob = await client.reports.download(report.data.id, 'csv');

// Get summary
const summary = await client.reports.summary('2024-01-01', '2024-01-31');
```

## Error Handling

```typescript
import { FlextimeClient, FlextimeError } from '@flextime/sdk';

try {
  const entry = await client.timeEntries.get('invalid-id');
} catch (error) {
  if (error instanceof FlextimeError) {
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    });
  }
}
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions. All response types are properly typed for excellent IDE support.

```typescript
import { TimeEntry, Project, User } from '@flextime/sdk';

// Types are automatically inferred
const entries = await client.timeEntries.list();
entries.data.forEach((entry: TimeEntry) => {
  console.log(entry.description);
});
```

## Examples

See the [examples](./examples) directory for more detailed usage examples:

- [Basic Usage](./examples/basic-usage.ts)
- [Advanced Usage](./examples/advanced-usage.ts)

## Development

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## License

MIT