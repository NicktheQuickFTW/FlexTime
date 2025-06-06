# Incorrect Import Paths Analysis

## Summary
Found multiple files in the backend codebase with incorrect import paths for lib modules that should be in src/lib.

## Import Path Patterns Found

### Pattern 1: `require('./lib/...`)`
- **File:** `/backend/index.js`
  - Line 17: `const logger = require('./lib/logger');`
  - Should be: `const logger = require('./src/lib/logger');`

### Pattern 2: `require('../lib/...')`
- **File:** `/backend/src/api/exportRoutes.js`
  - Line 9: `const ScheduleExporter = require('../lib/schedule_export');`
  - Should be: `const ScheduleExporter = require('../lib/schedule_export');` (This is actually correct from src/api)

- **File:** `/backend/src/api/metricsRoutes.js`
  - Line 9: `const AdvancedMetricsSystem = require('../lib/advanced_metrics_system');`
  - Should be: `const AdvancedMetricsSystem = require('../lib/advanced_metrics_system');` (This is actually correct from src/api)

### Pattern 3: `require('../../../lib/...')`
- **File:** `/backend/services/schedulers/sports/BasketballScheduler.js`
  - Line 17: `const logger = require('../../../lib/logger');`
  - Should be: `const logger = require('../../../src/lib/logger');`

- **File:** `/backend/services/schedulers/sports/VolleyballScheduler.js`
  - Has similar pattern (needs ../../../src/lib/...)

- **File:** `/backend/services/schedulers/sports/WrestlingScheduler.js`
  - Has similar pattern (needs ../../../src/lib/...)

- **File:** `/backend/services/schedulers/sports/SoccerScheduler.js`
  - Has similar pattern (needs ../../../src/lib/...)

- **File:** `/backend/services/schedulers/sports/FootballScheduler.js`
  - Has similar pattern (needs ../../../src/lib/...)

- **File:** `/backend/services/schedulers/sports/FootballSchedulerV2.js`
  - Has similar pattern (needs ../../../src/lib/...)

- **File:** `/backend/services/schedulers/base/SportScheduler.js`
  - Line 9: `const logger = require('../../../lib/logger');`
  - Should be: `const logger = require('../../../src/lib/logger');`

### Pattern 4: `require('../scripts/...')`
Multiple files in /backend/utils/ directory have imports like:
- `require('../scripts/logger')` 
- Should be: `require('../src/lib/logger')`

## Files Needing Updates

### High Priority (Core Files)
1. `/backend/index.js` - Main entry point
2. `/backend/services/schedulers/base/SportScheduler.js` - Base class for all sport schedulers
3. All sport-specific schedulers in `/backend/services/schedulers/sports/`

### Medium Priority (Service Files)
1. Various service files with incorrect lib imports
2. Route files that may have incorrect paths
3. Controller files with incorrect imports

### Low Priority (Utils/Scripts)
1. Files in `/backend/utils/` directory
2. Test scripts in `/backend/scripts/`

## Recommended Fix Strategy
1. First update the main index.js file
2. Update all scheduler files (base and sports-specific)
3. Update service files
4. Update utility and script files

The correct pattern should be:
- From `/backend/` root: `require('./src/lib/...')`
- From `/backend/src/`: `require('./lib/...')`
- From `/backend/src/api/`: `require('../lib/...')`
- From `/backend/services/schedulers/sports/`: `require('../../../src/lib/...')`
- From `/backend/services/schedulers/base/`: `require('../../../src/lib/...')`