# FlexTime API Structure Documentation

## Frontend API Files Overview

### 1. **Primary API File (Schedule Builder)**
**File:** `/frontend/src/utils/scheduleApi.ts`
**Used by:** Schedule Builder, Constraint Management, Games Management
**Purpose:** Comprehensive API for schedule operations
**Status:** ✅ **ACTIVE** - Uses correct endpoints

**Key Methods:**
- `getTeams()` → `/api/scheduling-service/teams`
- `getConstraints()` → `/api/scheduling-service/constraints`
- `createSchedule()`, `optimizeSchedule()`, etc.

### 2. **General API Service** 
**File:** `/frontend/lib/api.ts`
**Used by:** General application features
**Purpose:** Basic API operations for teams, constraints, health checks
**Status:** ✅ **FIXED** - Updated to use correct endpoints

**Key Methods:**
- `getTeams()` → `/api/scheduling-service/teams`
- `getConstraints()` → `/api/scheduling-service/constraints`
- `getHealth()`, `getStatus()`, etc.

### 3. **Legacy API Service**
**File:** `/frontend/src/services/api.ts`
**Used by:** Older components (may be unused)
**Purpose:** Legacy API with different structure
**Status:** ⚠️ **LEGACY** - Consider removing or updating

## Backend API Routes

### **Main Scheduling Service**
**File:** `/backend/routes/schedulingServiceRoutes.js`
**Endpoints:**
- `GET /api/scheduling-service/teams` ✅
- `GET /api/scheduling-service/constraints` ✅
- `POST /api/scheduling-service/schedules` ✅

**Registration in routes.js:**
```javascript
app.use('/api/scheduling-service', schedulingServiceRoutes);
```

### **Legacy Routes (if any)**
**File:** `/backend/routes/scheduleRoutes.js`
**Purpose:** Basic schedule CRUD operations
**Endpoints:** `/api/schedules/*`

## Best Practices

### ✅ **DO:**
1. **Use `/src/utils/scheduleApi.ts`** for schedule builder functionality
2. **Use `/lib/api.ts`** for general app features
3. **Always use full endpoint paths:** `/api/scheduling-service/teams`
4. **Start both servers:** Backend (3005) + Frontend (3000)

### ❌ **DON'T:**
1. **Don't use** `/api/teams` or `/api/constraints` (wrong endpoints)
2. **Don't forget** to start the backend server
3. **Don't mix** different API files in the same component

## Endpoint Mapping

| Frontend Method | Correct Endpoint | Backend Handler |
|-----------------|------------------|-----------------|
| `getTeams()` | `/api/scheduling-service/teams` | `schedulingServiceRoutes.js:428` |
| `getConstraints()` | `/api/scheduling-service/constraints` | `schedulingServiceRoutes.js:390` |
| `createSchedule()` | `/api/scheduling-service/schedules` | `scheduleController.js` |

## Troubleshooting Quick Reference

1. **"Failed to fetch" errors:**
   - Check backend is running: `lsof -i :3005`
   - Test endpoint: `curl http://localhost:3005/api/scheduling-service/teams`

2. **Wrong API called:**
   - Verify import: `from '../../src/utils/scheduleApi'`
   - Check endpoint in API file

3. **Port issues:**
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3005`

---

*Last updated: June 4, 2025*  
*Fixed: API endpoint mismatches and missing backend server*