# FlexTime Fix Implementation Plan

## Executive Summary

FlexTime's scheduling system has the correct team_id pattern (school_id + zero-padded sport_id) but suffers from architectural fragmentation:
- Hardcoded data exists but isn't properly utilized
- Agent system is disconnected from real implementation
- Overly complex constraint system with poor integration
- FT Builder is non-functional due to missing data flow
- Multiple incomplete implementations across the codebase

## Core Issues Identified

### 1. Data Layer Fragmentation
- **Problem**: Data is hardcoded in `BIG12_COMPLETE_DATA.js` but not flowing to the UI
- **Impact**: Frontend can't access team/venue data, making scheduling impossible
- **Root Cause**: No proper data service layer connecting hardcoded data to API endpoints

### 2. Agent System Disconnect
- **Problem**: Agent system exists as a "MinimalAgentSystem" placeholder
- **Impact**: No actual scheduling intelligence or optimization
- **Root Cause**: Over-engineered architecture without implementation

### 3. Constraint System Complexity
- **Problem**: 50+ TypeScript files with 17,500+ lines but poor integration
- **Impact**: Constraints aren't properly evaluated during scheduling
- **Root Cause**: Built in isolation without integration planning

### 4. FT Builder Non-Functionality
- **Problem**: FT Builder Engine exists but has no data connection
- **Impact**: Main scheduling interface is completely non-functional
- **Root Cause**: Missing data flow and API integration

## Implementation Plan

### Phase 1: Data Layer Unification (Week 1)
**Goal**: Create a unified data service that properly exposes Big 12 data

#### 1.1 Create Data Service Layer
```javascript
// backend/services/big12DataService.js
const BIG12_DATA = require('../data/hardcoded/BIG12_COMPLETE_DATA');

class Big12DataService {
  static getTeams(filters = {}) {
    const teams = BIG12_DATA.generateBig12Teams();
    // Apply filters for sport, school, etc.
    return this.applyFilters(teams, filters);
  }
  
  static getVenues(filters = {}) {
    const venues = BIG12_DATA.generateBig12Venues();
    return this.applyFilters(venues, filters);
  }
  
  static getTeamById(teamId) {
    const teams = this.getTeams();
    return teams.find(t => t.team_id === parseInt(teamId));
  }
  
  static calculateTeamId(schoolId, sportId) {
    return BIG12_DATA.generateTeamId(schoolId, sportId);
  }
}
```

#### 1.2 Update API Endpoints
```javascript
// backend/routes/scheduleRoutes.js
router.get('/api/teams', async (req, res) => {
  const teams = Big12DataService.getTeams(req.query);
  res.json(teams);
});

router.get('/api/venues', async (req, res) => {
  const venues = Big12DataService.getVenues(req.query);
  res.json(venues);
});

router.get('/api/sports', async (req, res) => {
  res.json(BIG12_DATA.SPORTS);
});

router.get('/api/schools', async (req, res) => {
  res.json(BIG12_DATA.BIG12_SCHOOLS);
});
```

#### 1.3 Fix Frontend API Integration
```javascript
// frontend/lib/api.ts
export const flexTimeAPI = {
  // Teams
  getTeams: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/teams?${params}`);
    return response.json();
  },
  
  // Venues
  getVenues: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/venues?${params}`);
    return response.json();
  },
  
  // Create schedule with proper team IDs
  createSchedule: async (scheduleData) => {
    // Ensure team_ids are calculated correctly
    scheduleData.teams = scheduleData.teams.map(team => ({
      ...team,
      team_id: Big12DataService.calculateTeamId(team.school_id, team.sport_id)
    }));
    
    const response = await fetch(`${API_BASE_URL}/api/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    return response.json();
  }
};
```

### Phase 2: Simplify Scheduling Core (Week 1-2)
**Goal**: Create a simple, working scheduling engine

#### 2.1 Basic Scheduling Service
```javascript
// backend/services/simpleSchedulingService.js
class SimpleSchedulingService {
  static async generateSchedule(params) {
    const {
      sport_id,
      team_ids,
      start_date,
      end_date,
      games_per_team,
      constraints = []
    } = params;
    
    // Get team data
    const teams = team_ids.map(id => Big12DataService.getTeamById(id));
    
    // Generate matchups
    const matchups = this.generateRoundRobin(teams, games_per_team);
    
    // Assign dates with basic constraints
    const schedule = this.assignDates(matchups, start_date, end_date, constraints);
    
    // Apply venue assignments
    const finalSchedule = this.assignVenues(schedule, teams);
    
    return {
      sport_id,
      games: finalSchedule,
      metadata: {
        total_games: finalSchedule.length,
        teams_count: teams.length,
        start_date,
        end_date
      }
    };
  }
  
  static generateRoundRobin(teams, gamesPerTeam) {
    const matchups = [];
    const n = teams.length;
    
    // Simple round-robin algorithm
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        matchups.push({
          home_team_id: teams[i].team_id,
          away_team_id: teams[j].team_id,
          home_team: teams[i],
          away_team: teams[j]
        });
      }
    }
    
    return matchups;
  }
  
  static assignDates(matchups, startDate, endDate, constraints) {
    // Simple date assignment with basic constraint checking
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysBetween = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    const gamesPerDay = Math.ceil(matchups.length / daysBetween);
    
    let currentDate = new Date(start);
    let gameIndex = 0;
    
    const scheduledGames = [];
    
    while (gameIndex < matchups.length && currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip if constraint says no games on this day
      if (this.checkDateConstraints(currentDate, constraints)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      // Schedule games for this day
      for (let i = 0; i < gamesPerDay && gameIndex < matchups.length; i++) {
        scheduledGames.push({
          ...matchups[gameIndex],
          date: new Date(currentDate),
          time: this.getGameTime(i) // Stagger game times
        });
        gameIndex++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return scheduledGames;
  }
  
  static assignVenues(schedule, teams) {
    // Simple venue assignment - home team's venue
    return schedule.map(game => {
      const homeTeam = teams.find(t => t.team_id === game.home_team_id);
      const venue = Big12DataService.getVenues({ 
        school_id: homeTeam.school_id,
        sport_id: homeTeam.sport_id 
      })[0];
      
      return {
        ...game,
        venue_id: venue?.venue_id || null,
        venue: venue
      };
    });
  }
}
```

#### 2.2 Integrate with FT Builder
```javascript
// backend/services/FT_Builder_Engine.js
class FTBuilderEngine {
  async generateSchedule(parameters) {
    try {
      // Use simple scheduling service instead of complex agent system
      const schedule = await SimpleSchedulingService.generateSchedule({
        sport_id: parameters.sportId,
        team_ids: parameters.teamIds,
        start_date: parameters.startDate,
        end_date: parameters.endDate,
        games_per_team: parameters.gamesPerTeam || 10,
        constraints: parameters.constraints || []
      });
      
      // Store in database
      const savedSchedule = await this.saveSchedule(schedule);
      
      return {
        success: true,
        schedule_id: savedSchedule.id,
        schedule: savedSchedule
      };
    } catch (error) {
      logger.error('FT Builder schedule generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

### Phase 3: Fix FT Builder UI (Week 2)
**Goal**: Make the FT Builder interface functional

#### 3.1 Update Schedule Builder Component
```typescript
// frontend/app/schedule-builder/ScheduleBuilderClient.tsx
export function ScheduleBuilderClient() {
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [sport, setSport] = useState(null);
  
  // Load teams when sport is selected
  useEffect(() => {
    if (sport) {
      flexTimeAPI.getTeams({ sport_id: sport.id })
        .then(setTeams);
    }
  }, [sport]);
  
  const handleGenerateSchedule = async () => {
    const schedule = await flexTimeAPI.createSchedule({
      sport_id: sport.id,
      team_ids: selectedTeams.map(t => t.team_id),
      start_date: startDate,
      end_date: endDate,
      constraints: getActiveConstraints()
    });
    
    // Navigate to schedule view
    router.push(`/schedules/${schedule.schedule_id}`);
  };
}
```

### Phase 4: Constraint System Integration (Week 2-3)
**Goal**: Properly integrate constraints without over-complexity

#### 4.1 Simple Constraint Evaluator
```javascript
// backend/services/constraintEvaluator.js
class ConstraintEvaluator {
  static evaluateSchedule(schedule, constraints) {
    const violations = [];
    
    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'REST_DAYS':
          violations.push(...this.checkRestDays(schedule, constraint));
          break;
        case 'NO_BACK_TO_BACK_AWAY':
          violations.push(...this.checkBackToBackAway(schedule, constraint));
          break;
        case 'VENUE_AVAILABILITY':
          violations.push(...this.checkVenueAvailability(schedule, constraint));
          break;
        case 'EXAM_BLACKOUT':
          violations.push(...this.checkExamBlackout(schedule, constraint));
          break;
      }
    }
    
    return {
      valid: violations.length === 0,
      violations,
      score: this.calculateScore(violations)
    };
  }
}
```

### Phase 5: Database Synchronization (Week 3)
**Goal**: Ensure database properly stores schedules

#### 5.1 Migration to Add Missing Fields
```sql
-- Add missing fields to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS mascot VARCHAR(100);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS sport_name VARCHAR(100);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS sport_code VARCHAR(10);

-- Add missing fields to schedules table
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS optimization_score DECIMAL;

-- Create proper indexes
CREATE INDEX idx_teams_school_sport ON teams(school_id, sport_id);
CREATE INDEX idx_games_schedule_date ON games(schedule_id, date);
CREATE INDEX idx_venues_school_type ON venues(school_id, venue_type);
```

## Priority Implementation Order

### Week 1: Core Functionality
1. **Day 1-2**: Implement Big12DataService and update API endpoints
2. **Day 3-4**: Create SimpleSchedulingService with basic round-robin
3. **Day 5**: Fix frontend API integration and test data flow

### Week 2: FT Builder Integration
1. **Day 1-2**: Update FT Builder Engine to use SimpleSchedulingService
2. **Day 3-4**: Fix Schedule Builder UI component
3. **Day 5**: Test end-to-end schedule creation

### Week 3: Polish and Constraints
1. **Day 1-2**: Integrate basic constraint evaluation
2. **Day 3-4**: Add database synchronization
3. **Day 5**: Testing and bug fixes

## Success Metrics

1. **Data Flow**: Frontend can successfully retrieve teams/venues
2. **Schedule Creation**: Can create a basic round-robin schedule
3. **FT Builder**: Interface allows schedule creation and viewing
4. **Constraints**: Basic constraints (rest days, venue availability) work
5. **Performance**: Schedule generation takes < 5 seconds for 16 teams

## Technical Debt to Address Later

1. **Agent System**: Rebuild with simpler architecture
2. **Constraint System**: Refactor TypeScript implementation
3. **Optimization**: Add travel optimization as enhancement
4. **ML Integration**: Connect to HELiiX engine when stable

## Testing Strategy

### Unit Tests
```javascript
// Test team ID generation
test('generates correct team ID', () => {
  const teamId = Big12DataService.calculateTeamId(1, 8); // Arizona Football
  expect(teamId).toBe(108);
});

// Test schedule generation
test('generates round-robin schedule', () => {
  const schedule = SimpleSchedulingService.generateSchedule({
    sport_id: 2,
    team_ids: [102, 202, 302, 402], // 4 teams
    start_date: '2025-11-01',
    end_date: '2025-12-31'
  });
  expect(schedule.games.length).toBe(6); // 4 teams = 6 games
});
```

### Integration Tests
- Test full flow from UI to database
- Verify constraint evaluation
- Check schedule persistence

## Rollback Plan

If implementation causes issues:
1. Keep existing code paths intact
2. Add feature flags for new implementation
3. Gradual rollout with monitoring
4. Maintain backwards compatibility

## Conclusion

This plan focuses on pragmatic fixes rather than architectural perfection. By simplifying the core scheduling logic and properly connecting the data layer, we can make FlexTime functional within 3 weeks. The key is to avoid over-engineering and focus on getting basic functionality working first.