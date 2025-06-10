# API Usage Breakdown - What Uses Which API Files

## 📊 `/frontend/src/services/api.ts` (Axios-based, Wrong Endpoints)

**Used by 9 components:**

### Pages:
1. **`/src/pages/Dashboard.tsx`**
   - Uses: `ScheduleService.getSchedules()`
   - Purpose: Loads all schedules for dashboard overview
   - ❌ Problem: Uses `/api/schedules` instead of `/api/scheduling-service/schedules`

2. **`/src/pages/Schedules.tsx`** 
   - Uses: `ScheduleService.getSchedules()`
   - Purpose: Main schedules listing page
   - ❌ Problem: Same endpoint issue

3. **`/src/pages/ScheduleDetail.tsx`**
   - Uses: `ScheduleService.getScheduleById(id)`
   - Purpose: Shows detailed view of a single schedule
   - ❌ Problem: Uses `/api/schedules/{id}` instead of correct endpoint

### Components - Constraints:
4. **`/src/components/constraints/ConstraintEditor.tsx`**
   - Uses: `TeamService.getTeams()`
   - Purpose: Loads teams for constraint configuration
   - ❌ Problem: Uses `/api/teams` instead of `/api/scheduling-service/teams`

5. **`/src/components/constraints/ConstraintManager.tsx`**
   - Uses: `ScheduleService` methods
   - Purpose: Manages schedule constraints
   - ❌ Problem: Schedule endpoint issues

6. **`/src/components/constraints/ConstraintsTable.tsx`**
   - Uses: `ScheduleService` methods  
   - Purpose: Displays constraints in table format
   - ❌ Problem: Schedule endpoint issues

### Components - Other:
7. **`/src/components/games/GamesTable.tsx`**
   - Uses: `ScheduleService` methods
   - Purpose: Displays games in table format
   - ❌ Problem: Schedule endpoint issues

8. **`/src/components/schedules/ScheduleMetrics.tsx`**
   - Uses: `ScheduleService.getScheduleMetrics(id)`
   - Purpose: Shows schedule performance metrics
   - ❌ Problem: Uses `/api/schedules/{id}/metrics` instead of correct endpoint

9. **`/src/components/integrations/NotionSyncPanel.tsx`**
   - Uses: `api` (default export)
   - Purpose: Notion integration functionality
   - ❌ Problem: General API endpoint issues

## 📱 `/frontend/lib/api.ts` (Generic Fetch-based)

**Used by 1 component:**

1. **`/components/system/connection-status.tsx`**
   - Uses: `apiService.checkConnection()`
   - Purpose: System health monitoring
   - ⚠️ Problem: Generic API service, may need specific endpoints

## ✅ `/frontend/src/utils/scheduleApi.ts` (Working Correctly)

**Used by 3 components:**

1. **`/app/schedule-builder/page.tsx`** (Main schedule builder)
   - Uses: `scheduleApi.getTeams()`, `scheduleApi.getConstraints()`, etc.
   - Purpose: Primary schedule building interface
   - ✅ Status: Working correctly

2. **`/src/components/scheduler/MatchupMatrix.tsx`**
   - Uses: Types from scheduleApi (`Game`, `Team`)
   - Purpose: Display team matchup matrix
   - ✅ Status: Working correctly

3. **`/src/components/scheduler/ScheduleGanttMatrix.tsx`**
   - Uses: Types from scheduleApi (`Game`, `Team`)
   - Purpose: Gantt chart view of schedule
   - ✅ Status: Working correctly

## 🔥 Impact Assessment

### High Priority (User-facing features that may be broken):
1. **Dashboard** - Users can't see schedule overview
2. **Schedules page** - Users can't browse schedules  
3. **Schedule detail** - Users can't view individual schedules
4. **Constraint editor** - Users can't configure constraints

### Medium Priority (Admin/advanced features):
5. **Constraint manager/table** - Constraint management may fail
6. **Games table** - Game data display issues
7. **Schedule metrics** - Performance data unavailable
8. **Notion sync** - Integration features broken

### Low Priority (System monitoring):
9. **Connection status** - Health monitoring may be affected

## 🛠️ Recommended Fix Priority

1. **Fix `/src/services/api.ts` endpoints** (affects 9 components)
2. **Test all affected pages/components**
3. **Fix `/lib/api.ts` if needed** (affects 1 component)
4. **Consider consolidating to single API** (long-term cleanup)

## 🎯 Quick Fix Commands

```typescript
// In /src/services/api.ts, change these lines:

// Line 188: Teams endpoint
const response = await api.get<ApiResponse<Team[]>>('/teams');
// TO:
const response = await api.get<ApiResponse<Team[]>>('/scheduling-service/teams');

// Line 29: Schedules endpoint  
const response = await api.get<ApiResponse<Schedule[]>>('/schedules');
// TO:
const response = await api.get<ApiResponse<Schedule[]>>('/scheduling-service/schedules');
```

This would fix 9 components with just a few line changes!