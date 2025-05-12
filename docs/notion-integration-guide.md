# FlexTime Notion Integration Guide

This guide walks through the steps to integrate FlexTime schedules with Notion databases.

## Prerequisites

- Notion account with admin permissions
- Notion API key (already set up in your environment)
- FlexTime application

## Step 1: Create a Schedule Database in Notion

1. Open Notion in your browser
2. Create a new page or open an existing one
3. Type `/database` and select "Table - Full page"
4. Set up the following properties:

| Property Name | Property Type | Description |
|---------------|---------------|-------------|
| Game Title    | Title         | The title of the game (e.g., "Kansas vs Iowa State") |
| Date          | Date          | Game date |
| Home Team     | Select        | The home team |
| Away Team     | Select        | The away team |
| Venue         | Text          | Game venue |
| Sport         | Select        | Sport type (e.g., "Men's Basketball") |
| Start Time    | Date          | Game start time |
| Conference    | Select        | Conference game? (Yes/No) |
| TV Network    | Select        | Broadcasting network |
| Notes         | Text          | Additional notes |

5. Add any additional properties specific to your scheduling needs

## Step 2: Share with Your Integration

1. Click the "..." (three dots) in the top-right corner of your database
2. Select "Add connections"
3. Find and select your integration (the one using your API key)
4. Click "Confirm"

## Step 3: Get the Database ID

1. Copy the URL of your database
2. Extract the database ID - it's the 32-character string after the last dash in the URL (before any `?` parameters)
3. Example: In `https://www.notion.so/myworkspace/My-Schedule-1234abcd5678efgh9012ijkl3456mnop?pvs=4`, the ID is `1234abcd5678efgh9012ijkl3456mnop`

## Step 4: Update Your Environment

Add the schedule database ID to your environment file:

```
# In ~/.env/notion.env
NOTION_SCHEDULE_DATABASE_ID=your_schedule_database_id
```

## Step 5: Run the Test Integration Script

```bash
cd /Users/nickw/Documents/XII-Ops/FlexTime/backend
node scripts/test-notion-integration.js
```

## Synchronizing FlexTime Schedules to Notion

### Automatic Sync

To set up automatic synchronization from FlexTime to Notion:

1. Update the `notion-adapter.js` file with your specific schedule data structure
2. Add an endpoint in your API to trigger the sync:

```javascript
// In scheduleRoutes.js
router.post('/sync-to-notion', async (req, res) => {
  try {
    const scheduleId = req.body.scheduleId;
    const schedule = await scheduleService.getScheduleById(scheduleId);
    
    // Convert schedule to the format expected by the Notion adapter
    const notionCompatibleSchedule = convertScheduleForNotion(schedule);
    
    // Sync to Notion
    const syncResult = await notionAdapter.syncScheduleData(
      process.env.NOTION_SCHEDULE_DATABASE_ID, 
      notionCompatibleSchedule
    );
    
    res.json({ success: true, result: syncResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

3. Add a "Sync to Notion" button in your frontend UI:

```tsx
// In ScheduleDetail.tsx
const syncToNotion = async () => {
  try {
    setIsSyncing(true);
    const response = await api.post('/api/schedules/sync-to-notion', { scheduleId });
    if (response.data.success) {
      setNotificationMessage('Schedule successfully synced to Notion!');
    } else {
      setErrorMessage('Failed to sync to Notion');
    }
  } catch (error) {
    setErrorMessage(`Error: ${error.message}`);
  } finally {
    setIsSyncing(false);
  }
};

// In the JSX
<Button 
  onClick={syncToNotion} 
  isLoading={isSyncing}
  colorScheme="purple"
  leftIcon={<NotionIcon />}
>
  Sync to Notion
</Button>
```

### Manual Export/Import

If you prefer a manual process:

1. Export your schedule to CSV format using the existing export functionality
2. Import the CSV into your Notion database:
   - Click "..." in the top-right of your Notion database
   - Select "Merge with CSV"
   - Upload your CSV file
   - Map the columns to the appropriate properties

## Using Contacts in FlexTime

To use the Big 12 Conference Contacts in your FlexTime application:

1. Create a contacts service in your backend:

```javascript
// In contactsService.js
const notionAdapter = require('../adapters/notion-adapter');

async function getContactsBySchool(school) {
  return notionAdapter.getConferenceContacts({ affiliation: school });
}

async function getContactsBySport(sport) {
  return notionAdapter.getConferenceContacts({ sport });
}

module.exports = {
  getContactsBySchool,
  getContactsBySport
};
```

2. Add a contacts API endpoint:

```javascript
// In contactsRoutes.js
const express = require('express');
const router = express.Router();
const contactsService = require('../services/contactsService');

router.get('/by-school/:school', async (req, res) => {
  try {
    const contacts = await contactsService.getContactsBySchool(req.params.school);
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/by-sport/:sport', async (req, res) => {
  try {
    const contacts = await contactsService.getContactsBySport(req.params.sport);
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

3. Display contacts in your frontend UI where relevant (e.g., when viewing team details or sending notifications)

## Troubleshooting

- **Connection Issues**: Make sure your Notion API key is correct and the database is shared with your integration
- **Permission Errors**: Verify that your integration has the necessary permissions to access the database
- **Data Format Errors**: Ensure that your data structure matches what Notion expects
- **API Rate Limits**: Notion has rate limits; batch your operations if you're syncing large datasets

For API-specific errors, check the Notion API documentation: https://developers.notion.com/reference/errors

## Next Steps

- Implement two-way synchronization (changes in Notion reflect in FlexTime)
- Add webhook support to update FlexTime when Notion data changes
- Expand integration to include other Notion databases like venues or teams