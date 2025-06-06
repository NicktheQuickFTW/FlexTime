# Frontend API Files Cleanup Guide

## Current API Files

### ✅ Active/Working Files
1. **`/src/utils/scheduleApi.ts`** - Used by schedule builder
   - ✅ Has correct endpoints (`/api/scheduling-service/*`)
   - ✅ Currently working and used in production
   - ✅ Keep this file

### ⚠️ Legacy/Duplicate Files  
2. **`/src/services/api.ts`** - Axios-based service
   - ❌ Uses wrong endpoints (`/api/schedules`, `/api/teams`)
   - ❌ Should use `/api/scheduling-service/teams` instead
   - 🔧 Used by: Dashboard, Schedules page, ConstraintEditor, etc.
   - 🎯 **Action**: Update endpoints or migrate components to scheduleApi.ts

3. **`/lib/api.ts`** - Generic fetch-based service
   - ❌ Uses wrong base URL and generic endpoints
   - 🔧 Used by: connection-status component
   - 🎯 **Action**: Update or replace with scheduleApi.ts

## Components Using Wrong API Files

### Using `/src/services/api.ts` (needs fixing):
- `/src/pages/Dashboard.tsx`
- `/src/pages/Schedules.tsx` 
- `/src/components/constraints/ConstraintEditor.tsx`
- `/src/components/integrations/NotionSyncPanel.tsx`
- `/src/components/constraints/ConstraintManager.tsx`
- `/src/pages/ScheduleDetail.tsx`
- `/src/components/constraints/ConstraintsTable.tsx`
- `/src/components/games/GamesTable.tsx`
- `/src/components/schedules/ScheduleMetrics.tsx`

### Using `/lib/api.ts` (needs fixing):
- `/components/system/connection-status.tsx`

## Recommended Actions

### Option 1: Update Endpoint URLs (Quick Fix)
```typescript
// In /src/services/api.ts, change:
const response = await api.get<ApiResponse<Team[]>>('/teams');
// To:
const response = await api.get<ApiResponse<Team[]>>('/scheduling-service/teams');
```

### Option 2: Standardize on scheduleApi.ts (Better)
Replace imports in all components:
```typescript
// Change from:
import { TeamService } from '../services/api';
// To:
import { scheduleApi } from '../utils/scheduleApi';

// Change usage from:
const teams = await TeamService.getTeams();
// To:  
const teams = await scheduleApi.getTeams();
```

### Option 3: Create API Proxy (Cleanest)
Create a single API entry point that uses the correct endpoints internally.

## Current Status (June 4, 2025)
- ✅ Schedule Builder: Working (uses scheduleApi.ts)
- ❌ Other components: May have "Failed to fetch" errors
- ✅ Backend: Running with correct endpoints
- ✅ CORS: Fixed for frontend port 64880

## Next Steps
1. Fix endpoint URLs in `/src/services/api.ts`
2. Test all components that use services/api.ts
3. Consider consolidating to single API file
4. Update import statements across codebase