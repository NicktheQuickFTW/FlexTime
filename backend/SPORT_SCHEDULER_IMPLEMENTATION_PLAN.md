# Sport Scheduler Implementation Plan

## Overview
Refactor the FT Builder Engine to use a hybrid architecture with sport-specific schedulers while maintaining shared infrastructure for common operations.

## Architecture Design

### Core Components

```
FTBuilderEngine (Main Orchestrator)
├── SportSchedulerRegistry
├── Common Services
│   ├── DateAssignmentService
│   ├── VenueSelectionService
│   ├── ConstraintEvaluator
│   └── ScheduleOptimizer
└── Sport Schedulers
    ├── FootballScheduler
    ├── BasketballScheduler
    ├── BaseballScheduler
    ├── LacrosseScheduler
    ├── VolleyballScheduler
    └── DefaultScheduler
```

## Implementation Phases

### Phase 1: Create Base Infrastructure (Week 1)

#### 1.1 SportScheduler Interface
```javascript
// backend/services/schedulers/SportScheduler.js
class SportScheduler {
  constructor(config) {
    this.sportId = config.sportId;
    this.sportConfig = config.sportConfig;
    this.constraints = config.constraints;
  }

  // Abstract methods to implement
  async generateMatchups(teams, parameters) {
    throw new Error('generateMatchups must be implemented');
  }

  async assignDates(matchups, startDate, endDate) {
    throw new Error('assignDates must be implemented');
  }

  getDefaultConstraints() {
    return [];
  }

  validateSchedule(games) {
    return { valid: true, violations: [] };
  }
}
```

#### 1.2 Common Services Extraction
- Extract date assignment logic from SimpleSchedulingService
- Create VenueSelectionService from existing venue logic
- Standardize constraint evaluation interface

### Phase 2: Sport-Specific Schedulers (Week 2)

#### 2.1 FootballScheduler
```javascript
class FootballScheduler extends SportScheduler {
  constructor(config) {
    super(config);
    this.weeksInSeason = 13;
    this.gamesPerTeam = 9;
  }

  async generateMatchups(teams, parameters) {
    // Partial round-robin with rivalry protection
    // Saturday-only scheduling
    // Bye week management
  }
}
```

#### 2.2 BasketballScheduler
```javascript
class BasketballScheduler extends SportScheduler {
  constructor(config) {
    super(config);
    this.gamesPerWeek = 2;
    this.extendedRoundRobin = true;
  }

  async generateMatchups(teams, parameters) {
    // 1.5x round-robin (18 games)
    // Travel partner optimization
    // Back-to-back game prevention
  }
}
```

#### 2.3 BaseballScheduler
```javascript
class BaseballScheduler extends SportScheduler {
  constructor(config) {
    super(config);
    this.seriesLength = 3;
    this.weekendSeries = true;
  }

  async generateMatchups(teams, parameters) {
    // 3-game weekend series
    // Friday-Sunday scheduling
    // Weather consideration for early season
  }
}
```

### Phase 3: Registry and Factory System (Week 3)

#### 3.1 SportSchedulerRegistry
```javascript
class SportSchedulerRegistry {
  constructor() {
    this.schedulers = new Map();
    this.registerDefaultSchedulers();
  }

  register(sportId, schedulerClass) {
    this.schedulers.set(sportId, schedulerClass);
  }

  getScheduler(sportId, config) {
    const SchedulerClass = this.schedulers.get(sportId) || DefaultScheduler;
    return new SchedulerClass(config);
  }

  registerDefaultSchedulers() {
    this.register(8, FootballScheduler);    // Football
    this.register(2, BasketballScheduler);  // Men's Basketball
    this.register(3, BasketballScheduler);  // Women's Basketball
    this.register(1, BaseballScheduler);    // Baseball
    this.register(15, BaseballScheduler);   // Softball
    this.register(13, LacrosseScheduler);   // Lacrosse
    // etc...
  }
}
```

#### 3.2 Updated FTBuilderEngine
```javascript
class FTBuilderEngine {
  constructor(config) {
    this.config = config;
    this.registry = new SportSchedulerRegistry();
    this.commonServices = {
      dateAssignment: new DateAssignmentService(),
      venueSelection: new VenueSelectionService(),
      constraintEvaluator: new ConstraintEvaluator()
    };
  }

  async generateSchedule(parameters) {
    // Get appropriate scheduler
    const scheduler = this.registry.getScheduler(parameters.sportId, {
      sportId: parameters.sportId,
      sportConfig: this.SPORT_CONFIGS[parameters.sportId],
      constraints: parameters.constraints
    });

    // Generate matchups using sport-specific logic
    const matchups = await scheduler.generateMatchups(
      parameters.teams,
      parameters
    );

    // Use common services for shared operations
    const datedGames = await this.commonServices.dateAssignment.assign(
      matchups,
      parameters.startDate,
      parameters.endDate,
      scheduler.getDatePreferences()
    );

    // Assign venues
    const venueAssignedGames = await this.commonServices.venueSelection.assign(
      datedGames,
      parameters.teams
    );

    // Evaluate constraints
    const evaluation = await this.commonServices.constraintEvaluator.evaluate(
      venueAssignedGames,
      parameters.constraints
    );

    return {
      schedule_id: uuidv4(),
      sport_id: parameters.sportId,
      games: venueAssignedGames,
      evaluation,
      metadata: {
        scheduler: scheduler.constructor.name,
        generated_at: new Date().toISOString()
      }
    };
  }
}
```

### Phase 4: Testing and Migration (Week 4)

#### 4.1 Test Structure
```
tests/
├── unit/
│   ├── schedulers/
│   │   ├── FootballScheduler.test.js
│   │   ├── BasketballScheduler.test.js
│   │   └── BaseballScheduler.test.js
│   └── services/
│       ├── DateAssignmentService.test.js
│       └── VenueSelectionService.test.js
└── integration/
    ├── FTBuilderEngine.test.js
    └── sport-specific/
        ├── football-season.test.js
        └── basketball-season.test.js
```

#### 4.2 Migration Strategy
1. Keep existing SimpleSchedulingService as fallback
2. Gradually migrate sports one by one
3. Run parallel testing (old vs new)
4. Feature flag for rollout

## File Structure

```
backend/
├── services/
│   ├── FT_Builder_Engine.js (updated)
│   ├── schedulers/
│   │   ├── base/
│   │   │   ├── SportScheduler.js
│   │   │   └── DefaultScheduler.js
│   │   ├── sports/
│   │   │   ├── FootballScheduler.js
│   │   │   ├── BasketballScheduler.js
│   │   │   ├── BaseballScheduler.js
│   │   │   ├── LacrosseScheduler.js
│   │   │   ├── VolleyballScheduler.js
│   │   │   ├── SoccerScheduler.js
│   │   │   ├── WrestlingScheduler.js
│   │   │   └── TennisScheduler.js
│   │   └── SportSchedulerRegistry.js
│   └── common/
│       ├── DateAssignmentService.js
│       ├── VenueSelectionService.js
│       └── ScheduleOptimizer.js
└── config/
    └── sport-scheduling-configs.js
```

## Key Benefits

1. **Modularity**: Each sport's logic is isolated
2. **Testability**: Can test each scheduler independently
3. **Extensibility**: Easy to add new sports
4. **Maintainability**: Clear separation of concerns
5. **Performance**: Can optimize per sport without affecting others
6. **Reusability**: Common services shared across all sports

## Success Metrics

- [ ] All existing tests pass with new architecture
- [ ] Performance remains same or improves
- [ ] Code coverage > 80% for new modules
- [ ] Successfully generate schedules for all sports
- [ ] Clean separation between sport-specific and common logic

## Rollback Plan

1. Keep feature flag `USE_NEW_SCHEDULERS`
2. Maintain SimpleSchedulingService until fully migrated
3. Log comparison metrics between old and new
4. Have database rollback scripts ready

## Next Steps

1. Review and approve plan
2. Create base SportScheduler class
3. Start with FootballScheduler as proof of concept
4. Implement one sport at a time
5. Run parallel testing
6. Graduate rollout by sport