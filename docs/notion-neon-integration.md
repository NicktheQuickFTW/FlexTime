# Notion to Neon DB Integration Guide

This guide explains how to set up and use the bidirectional integration between Notion databases and the FlexTime application's Neon PostgreSQL database.

## Overview

The integration enables:

1. **Contact Synchronization**: Keep Big 12 Conference contacts in sync between Notion and FlexTime
2. **Schedule Management**: Push FlexTime schedules to Notion for collaboration
3. **Schedule Updates**: Pull schedule changes (notes, TV networks) from Notion back to FlexTime

## Prerequisites

- Notion account with admin permissions
- Notion API key (set up in `~/.env/notion.env`)
- FlexTime application with Neon DB configured
- At least one Notion database shared with your integration

## Setup

### 1. Environment Configuration

Ensure your Notion API key and database IDs are properly configured in `~/.env/notion.env`:

```
# Notion API Credentials
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_contacts_database_id
NOTION_SCHEDULE_DATABASE_ID=your_schedule_database_id
```

### 2. Create a Schedule Database in Notion

1. Open Notion in your browser
2. Create a new page or open an existing one
3. Type `/database` and select "Table - Full page"
4. Set up the following properties:

| Property Name | Property Type | Description |
|---------------|---------------|-------------|
| Game Title    | Title         | The title of the game (e.g., "Kansas vs Iowa State") |
| Date          | Date          | Game date and time |
| Home Team     | Select        | The home team |
| Away Team     | Select        | The away team |
| Venue         | Text          | Game venue |
| Sport         | Select        | Sport type (e.g., "Men's Basketball") |
| Conference Game | Checkbox    | Is this a conference game? |
| TV Network    | Select        | Broadcasting network |
| Notes         | Text          | Additional notes |
| Game ID       | Text          | Unique identifier from Neon DB (do not modify!) |

5. Share the database with your integration:
   - Click the "..." (three dots) in the top-right corner
   - Select "Add connections"
   - Find and select your integration
   - Click "Confirm"

6. Copy the database ID from the URL and add it to your environment file as `NOTION_SCHEDULE_DATABASE_ID`

### 3. Test the Integration

Run the test script to verify your connections:

```bash
cd /Users/nickw/Documents/XII-Ops/FlexTime/backend
node scripts/test-notion-neon-sync.js
```

## Usage

### API Endpoints

The integration provides the following API endpoints:

#### Test Connections

```
GET /api/notion-sync/test-connections
```

Tests connections to both Notion and Neon DB.

#### Sync Contacts to Neon DB

```
POST /api/notion-sync/contacts-to-neon
```

Synchronizes contacts from the Notion contacts database to the Neon DB `conference_contacts` table.

#### Sync Schedules to Notion

```
POST /api/notion-sync/schedules-to-notion
Body: { "sportType": "Men's Basketball" } (optional)
```

Synchronizes schedules from Neon DB to the Notion schedule database. You can optionally filter by sport type.

#### Sync Schedule Updates from Notion

```
POST /api/notion-sync/schedule-updates-from-notion
```

Synchronizes schedule updates (notes, TV network) from Notion back to Neon DB.

#### Full Sync

```
POST /api/notion-sync/full-sync
Body: { "sportType": "Men's Basketball" } (optional)
```

Performs a complete bidirectional sync of contacts and schedules.

### Automation Options

#### Manual Sync

Trigger synchronization manually through:

1. **API Requests**: Use the endpoints above with tools like Postman or curl
2. **Admin Interface**: Add sync buttons to the FlexTime admin interface (implementation steps below)

#### Scheduled Sync

Set up automated synchronization:

1. Create a new script in the `backend/scripts` directory:

```javascript
// scheduled-notion-sync.js
const notionNeonSync = require('../adapters/notion-neon-sync-adapter');
const logger = require('../utils/logger');

async function runScheduledSync() {
  try {
    logger.info('Starting scheduled Notion-Neon DB sync');
    
    // Sync contacts from Notion to Neon DB
    await notionNeonSync.syncContactsToNeonDB();
    
    // Sync schedules to Notion (for all sports)
    await notionNeonSync.syncSchedulesToNotion();
    
    // Sync updates back from Notion
    await notionNeonSync.syncScheduleUpdatesFromNotion();
    
    logger.info('Scheduled Notion-Neon DB sync completed successfully');
  } catch (error) {
    logger.error(`Error in scheduled Notion-Neon DB sync: ${error.message}`);
  } finally {
    // Close connections
    await notionNeonSync.close();
  }
}

// Run the sync
runScheduledSync();
```

2. Add a cron job to run this script periodically (e.g., every hour):

```bash
0 * * * * cd /path/to/flextime/backend && node scripts/scheduled-notion-sync.js >> /path/to/logs/notion-sync.log 2>&1
```

## Implementing in the Frontend

### Adding Sync Buttons

Add Notion sync functionality to the FlexTime UI:

1. Create a new component in the frontend:

```tsx
// src/components/notion/NotionSyncPanel.tsx
import React, { useState } from 'react';
import { Button, Box, Stack, Alert, Text, Select } from '@chakra-ui/react';
import { FaSync, FaNotebook } from 'react-icons/fa';
import api from '../../services/api';

const NotionSyncPanel = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sportType, setSportType] = useState<string>('');

  const handleSync = async (endpoint: string, params = {}) => {
    setIsSyncing(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await api.post(`/api/notion-sync/${endpoint}`, params);
      setResult(response.data.result);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Text fontSize="xl" mb={4}>Notion Synchronization</Text>
      
      <Stack spacing={4}>
        <Button 
          leftIcon={<FaSync />} 
          onClick={() => handleSync('test-connections')}
          isLoading={isSyncing}
          loadingText="Testing"
          colorScheme="purple"
        >
          Test Connections
        </Button>
        
        <Button 
          leftIcon={<FaNotebook />} 
          onClick={() => handleSync('contacts-to-neon')}
          isLoading={isSyncing}
          loadingText="Syncing Contacts"
          colorScheme="blue"
        >
          Sync Contacts to FlexTime
        </Button>
        
        <Box>
          <Select 
            placeholder="Select sport (optional)" 
            mb={2}
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
          >
            <option value="Men's Basketball">Men's Basketball</option>
            <option value="Women's Basketball">Women's Basketball</option>
            <option value="Football">Football</option>
            <option value="Baseball">Baseball</option>
            <option value="Softball">Softball</option>
            {/* Add other sports */}
          </Select>
          
          <Button 
            leftIcon={<FaSync />} 
            onClick={() => handleSync('schedules-to-notion', sportType ? { sportType } : {})}
            isLoading={isSyncing}
            loadingText="Syncing Schedules"
            colorScheme="green"
            width="100%"
          >
            Sync Schedules to Notion
          </Button>
        </Box>
        
        <Button 
          leftIcon={<FaSync />} 
          onClick={() => handleSync('schedule-updates-from-notion')}
          isLoading={isSyncing}
          loadingText="Syncing Updates"
          colorScheme="orange"
        >
          Sync Schedule Updates from Notion
        </Button>
        
        <Button 
          leftIcon={<FaSync />} 
          onClick={() => handleSync('full-sync', sportType ? { sportType } : {})}
          isLoading={isSyncing}
          loadingText="Syncing"
          colorScheme="teal"
        >
          Full Sync
        </Button>
      </Stack>
      
      {error && (
        <Alert status="error" mt={4}>
          {error}
        </Alert>
      )}
      
      {result && (
        <Box mt={4} p={3} borderWidth="1px" borderRadius="md">
          <Text fontWeight="bold">Sync Results:</Text>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Box>
      )}
    </Box>
  );
};

export default NotionSyncPanel;
```

2. Add this component to your admin interface or create a dedicated Notion integration page.

## Data Flow

### Contacts Synchronization

1. **Direction**: Notion → Neon DB
2. **Triggered by**: 
   - Manual sync via API or UI
   - Scheduled sync
3. **Data mapped**:
   - Name (parsed into first_name and last_name)
   - Email
   - Phone
   - Affiliation (school)
   - Title
   - Sports (as JSON array)
   - Roles (as JSON array)

### Schedule Synchronization

1. **Direction**: Neon DB → Notion
2. **Triggered by**:
   - Manual sync via API or UI
   - Scheduled sync
3. **Data mapped**:
   - Game title
   - Date and time
   - Home team
   - Away team
   - Venue
   - Sport
   - Conference game flag
   - TV network
   - Notes
   - Game ID (for reference)

### Schedule Updates

1. **Direction**: Notion → Neon DB
2. **Triggered by**:
   - Manual sync via API or UI
   - Scheduled sync
3. **Data mapped**:
   - Notes
   - TV network

## Limitations

- The integration only syncs specific fields and does not handle structural changes to databases
- Large databases (>100 items) may require pagination (not implemented in the current version)
- Notion API rate limits may apply (currently 3 requests per second)
- Deletions are not synchronized automatically

## Troubleshooting

### Connection Issues

- Verify your Notion API key is correct
- Ensure the database is shared with your integration
- Check Neon DB connection string and credentials

### Sync Failures

- Check the logs for specific error messages
- Verify that database schemas match expectations
- Ensure required properties exist in both systems

### Missing Data

- Confirm field mappings in the adapter code
- Check for data type mismatches
- Verify that both systems are accessible

## Advanced Features

### Adding More Sync Fields

To sync additional fields between systems, modify the adapter code:

1. For contacts, update the `transformContactsForNeonDB` method
2. For schedules, update the `transformSchedulesForNotion` method
3. For schedule updates, update the `syncScheduleUpdatesFromNotion` method

### Adding Webhooks

For real-time updates, implement Notion webhooks:

1. Set up a webhook endpoint in your server
2. Register the webhook with Notion API
3. Process incoming webhook events to trigger syncs

## Support

For issues or questions regarding the Notion-Neon DB integration, contact the FlexTime development team.

## References

- [Notion API Documentation](https://developers.notion.com/reference/intro)
- [Neon DB Documentation](https://neon.tech/docs/introduction)