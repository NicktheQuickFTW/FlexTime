# FlexTime Troubleshooting Guide

## "Failed to fetch" API Errors

### Problem
Frontend shows "TypeError: Failed to fetch" errors when trying to load teams or constraints in the schedule builder.

### Root Causes & Solutions

#### 1. **Backend Server Not Running** (Most Common)
**Symptoms:**
- "Failed to fetch" errors in browser console
- `curl` to API endpoints shows "Connection refused"
- Schedule builder page loads but shows no data

**Solution:**
```bash
# Check if backend is running
ps aux | grep "node.*3005" | grep -v grep

# If not running, start the backend
cd /Users/nickw/Documents/GitHub/Flextime/backend
node index.js

# Verify it's working
curl http://localhost:3005/api/scheduling-service/teams
```

#### 2. **Wrong API Endpoints in Frontend**
**Symptoms:**
- Backend is running but frontend still shows "Failed to fetch"
- Network tab shows 404 errors for API calls

**Problem:** Multiple API files exist with different endpoint configurations:
- `/Users/nickw/Documents/GitHub/Flextime/frontend/lib/api.ts`
- `/Users/nickw/Documents/GitHub/Flextime/frontend/src/services/api.ts` 
- `/Users/nickw/Documents/GitHub/Flextime/frontend/src/utils/scheduleApi.ts`

**Solution:** Ensure all API files use correct endpoints:

**Correct endpoints:**
- ✅ `/api/scheduling-service/teams`
- ✅ `/api/scheduling-service/constraints`

**Wrong endpoints:**
- ❌ `/api/teams`
- ❌ `/api/constraints`

**Fix example:**
```typescript
// WRONG
const response = await fetch(`${this.baseUrl}/api/teams`);

// CORRECT  
const response = await fetch(`${this.baseUrl}/api/scheduling-service/teams`);
```

#### 3. **CORS Configuration Issues**
**Symptoms:**
- Backend is running and API endpoints work via curl
- Frontend still shows "Failed to fetch" errors
- Browser console shows CORS policy errors

**Problem:** Frontend port not included in backend CORS configuration

**Solution:** Add frontend port to CORS allowlist in `/backend/src/middleware/middleware.js`:

```javascript
// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3005',
    'http://localhost:64880',  // ← Add actual frontend port
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3005',
    'http://127.0.0.1:64880'   // ← Add actual frontend port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

**How to find frontend port:**
```bash
# Check what port Next.js is actually using
netstat -an | grep LISTEN | grep tcp4
# Look for the port shown in browser URL bar
```

#### 4. **Port Mismatches**
**Verify correct ports:**
- Frontend (Next.js): Usually `http://localhost:3000` (but can vary)
- Backend (Node.js): `http://localhost:3005`

### Quick Diagnosis Commands

```bash
# 1. Check what's running on ports
lsof -i :3000  # Frontend
lsof -i :3005  # Backend

# 2. Test API endpoints
curl http://localhost:3005/api/scheduling-service/teams
curl http://localhost:3005/api/scheduling-service/constraints

# 3. Check backend logs
cd /Users/nickw/Documents/GitHub/Flextime/backend
node index.js

# 4. Check frontend compilation
cd /Users/nickw/Documents/GitHub/Flextime/frontend
npm run dev
```

### Prevention

1. **Always start both servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && node index.js
   
   # Terminal 2: Frontend  
   cd frontend && npm run dev
   ```

2. **Use correct API file:** The schedule builder uses `/src/utils/scheduleApi.ts`

3. **Verify endpoints match backend routes** in `/backend/routes/schedulingServiceRoutes.js`

### Files That Were Fixed

1. **Backend CORS configuration:**
   - `/backend/src/middleware/middleware.js` - Added frontend port 64880 to CORS allowlist

2. **Frontend API files:**
   - `/frontend/src/utils/scheduleApi.ts` - ✅ Already had correct endpoints (used by schedule builder)
   - `/frontend/src/services/api.ts` - ⚠️ Still uses wrong endpoints (used by other components)
   - `/frontend/lib/api.ts` - ⚠️ Generic API service (minimal usage)

3. **Backend routes:**
   - `/backend/routes/schedulingServiceRoutes.js` - Working correctly
   - Registered at `/api/scheduling-service/*` endpoints

### Additional Cleanup Needed

**Components that may still have "Failed to fetch" errors:**

#### Using `/src/services/api.ts` (9 components with wrong endpoints):
- **Pages**: Dashboard, Schedules listing, Schedule detail  
- **Components**: Constraint editor/manager, Games table, Schedule metrics, Notion sync

#### Using `/lib/api.ts` (1 component):
- **System**: Connection status monitoring

**📋 See `/frontend/API_USAGE_BREAKDOWN.md` for detailed breakdown and fix instructions.**

**🔧 Quick fix**: Update endpoints in `/src/services/api.ts` from `/api/teams` → `/api/scheduling-service/teams`

### Verification Steps

After fixing:
1. ✅ Backend running on port 3005
2. ✅ Frontend running on port 3000  
3. ✅ API calls succeed: `curl http://localhost:3005/api/scheduling-service/teams`
4. ✅ Schedule builder loads teams/constraints without errors

---

## "Failed to fetch constraint violations" Error

### Problem
Schedule builder shows "Failed to fetch constraint violations" after generating a schedule.

### Root Cause & Solution
**Problem:** `scheduleApi.ts` was using wrong endpoint `/api/schedule/schedules/{id}/violations`

**Solution:** Fixed to use correct endpoint `/api/scheduling-service/schedules/{id}/conflicts`

**Files Fixed:**
- `/frontend/src/utils/scheduleApi.ts` - Updated `getConstraintViolations()` method
- `/frontend/src/services/api.ts` - Already had correct endpoint

**Backend Endpoint:** `GET /api/scheduling-service/schedules/:scheduleId/conflicts`

### Other Fixed Endpoints
- Export: `/api/export/schedules/{id}` (was `/api/schedule/schedules/{id}/export`)
- Auto-fix: Disabled temporarily (needs proper implementation)

---

*Last updated: June 4, 2025*
*Issue resolved: Multiple API files + backend not running + constraint violations endpoint*