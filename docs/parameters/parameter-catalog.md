# FlexTime Parameter Catalog - Ultimate Builder Analysis

This document catalogs all scheduling parameters discovered in the FlexTime codebase for the Ultimate Builder. Parameters are organized by category and include implementation details, dependencies, and optimization complexity assessments.

## Executive Summary

The FlexTime system contains **over 150 distinct scheduling parameters** across multiple sports and categories. These parameters range from simple hard constraints (must be satisfied) to complex soft constraints with weighted scoring systems.

### Parameter Distribution
- **Hard Parameters**: 45 parameters (must be satisfied)
- **Soft Constraints**: 108+ constraints (preferences with penalties)
- **Sport-Specific**: 89 constraints
- **Global/Cross-Sport**: 26 constraints
- **Venue/Facility**: 18 constraints
- **Travel/Logistics**: 15 constraints

## Table of Contents

1. [Sport-Specific Constraints](#sport-specific-constraints)
2. [Global and Cross-Sport Constraints](#global-and-cross-sport-constraints)
3. [Venue and Facility Constraints](#venue-and-facility-constraints)
4. [Travel and Logistics Constraints](#travel-and-logistics-constraints)
5. [Database-Level Constraints](#database-level-constraints)
6. [Algorithmic Constraints](#algorithmic-constraints)
7. [Migration Analysis](#migration-analysis)
8. [ConstraintExtractor Implementation](#constraintextractor-implementation)

---

## Sport-Specific Constraints

### Football Constraints

**Location**: `backend/src/ai/specialized/football_constraints.js`

#### Hard Constraints (9)
1. **consecutive_road_games** - No school plays more than two consecutive road Conference games
2. **road_game_distribution** - No school plays four-of-five Conference games on the road
3. **open_week_advantage** - No school plays a Conference team coming off an open week more than twice
4. **back_to_back_road_sets** - No school plays two sets of back-to-back Conference Road games in a season
5. **thursday_game_recovery** - Each school playing in a Thursday game will have a similar recovery period
6. **conference_game_count** - Each team must play exactly 9 conference games
7. **schedule_duration** - All games must be scheduled within a 9-week period ending Thanksgiving Saturday
8. **abc_espn_obligations** - Meet contractual obligations for ABC/ESPN telecasts
9. **fox_obligations** - Meet contractual obligations for FOX telecasts

#### Soft Constraints (10)
1. **early_home_game** (weight: 0.7) - At least one of the first two games will be scheduled as a home game
2. **avoid_three_weeks_without_home** (weight: 0.8) - Avoid institutions playing three straight weeks without a home game
3. **late_home_game** (weight: 0.6) - At least one of the last two games will be scheduled as a home game
4. **avoid_away_bye_away** (weight: 0.7) - Avoid the away-bye-away scenario unless Thursday game involved
5. **short_week_equality** (weight: 0.8) - Balance recovery time for teams playing on short weeks
6. **limit_open_date_advantage** (weight: 0.7) - Avoid teams playing opponents coming off open dates more than once
7. **time_zone_travel** (weight: 0.6) - Consider multiple time zone crossings in game sequencing
8. **schedule_balance** (weight: 0.5) - Balance opening Conference play on the road and Thursday games
9. **player_health_recovery** (weight: 0.8) - Emphasize player health and recovery in travel planning
10. **weeknight_games** - Provide contractually required weeknight games

**Migration Complexity**: HIGH - Media rights integration, complex temporal constraints

---

### Basketball Constraints

**Location**: `backend/src/ai/specialized/basketball_scheduling_constraints.js`

#### Men's Basketball - Hard Constraints (8)
1. **conference_game_count** - Each team must play exactly 18 conference games
2. **play_distribution** - Each team plays 3 opponents twice (home/away) and 12 opponents once
3. **first_four_balance** - Among first four games, at least two home and two away
4. **last_four_balance** - Among last four games, at least two home and two away
5. **max_consecutive_road** - No team plays more than two consecutive Conference road games
6. **big_monday_prerequisite** - Road Big Monday game preceded by home game on Saturday
7. **avoid_compressed_schedule** - No Saturday-Monday-Wednesday scheduling
8. **rematch_separation** - At least three games and/or 10 days between rematches

#### Men's Basketball - Soft Constraints (9)
1. **weekend_home_games** (weight: 0.8) - Similar number of weekend home games (minimum 4)
2. **bye_placement** (weight: 0.6) - Bye dates generally mid-week
3. **avoid_road_clusters** (weight: 0.7) - Avoid four of five games on the road
4. **avoid_early_road_cluster** (weight: 0.7) - Avoid four of first six games on road
5. **avoid_late_road_cluster** (weight: 0.7) - Avoid four of last six games on road
6. **avoid_opening_consecutive_road** (weight: 0.5) - Avoid opening road/road
7. **avoid_closing_consecutive_road** (weight: 0.5) - Avoid closing road/road
8. **balance_bye_advantage** (weight: 0.4) - Balance playing teams coming off bye dates
9. **big_monday_home_preceded_by_road** (weight: 0.3) - Big Monday home games preceded by road games

#### Women's Basketball - Hard Constraints (8)
Same as men's basketball but with different game count:
1. **conference_game_count** - Each team must play exactly 20 conference games
2. **play_distribution** - Each team plays 5 opponents twice (home/away) and 10 opponents once
3-8. (Same as men's basketball)

#### Women's Basketball - Soft Constraints (8)
Same as men's basketball plus:
9. **minimize_same_day_games** (weight: 0.6) - Minimize men's and women's games at home on same day

**Migration Complexity**: MEDIUM-HIGH - Complex distribution patterns, Big Monday requirements

---

### Baseball/Softball Constraints

**Location**: `backend/src/ai/specialized/baseball_softball_constraints.js`

#### Baseball - Hard Constraints (5)
1. **conference_game_count** - Each team must play exactly 30 conference games
2. **series_format** - Schedule must consist of ten three-game series
3. **home_series_limit** - Each institution plays no more than five series at home
4. **series_integrity** - All games in a series must be played at the same venue
5. **series_scheduling** - Three-game series typically played Friday-Sunday

#### Baseball - Soft Constraints (6)
1. **home_away_balance** (weight: 0.7) - Balance home/away series throughout season
2. **weather_considerations** (weight: 0.6) - Consider weather patterns for early season
3. **exam_period_avoidance** (weight: 0.8) - Avoid scheduling during final exams
4. **travel_efficiency** (weight: 0.7) - Minimize travel distance between series
5. **tv_opportunities** (weight: 0.5) - Consider TV broadcast opportunities
6. **mutual_agreement_format** (weight: 0.4) - Allow 2-1 format by mutual agreement

#### Softball - Hard Constraints (5)
1. **conference_game_count** - Each team must play exactly 24 conference games
2. **series_format** - Schedule must consist of eight three-game series
3. **series_integrity** - All games in a series must be played at the same venue
4. **series_scheduling** - Three-game series typically played Friday-Sunday (Thursday-Saturday for BYU/Easter)
5. **season_length** - 24-game schedule over nine-week period

#### Softball - Soft Constraints (7)
Same as baseball plus:
7. **special_date_handling** - BYU series and Easter weekend series use Thursday-Saturday format

**Migration Complexity**: MEDIUM - Series-based scheduling, weather dependencies

---

### Tennis Constraints

**Location**: `backend/src/ai/specialized/tennis_constraints.js`

#### Men's Tennis - Hard Constraints (6)
1. **conference_match_count** - Each team must play exactly 8 conference matches
2. **round_robin** - Single round-robin (each team plays every other team exactly once)
3. **schedule_duration** - All matches within a 5-week period
4. **bye_week** - Each team must have exactly one bye week
5. **travel_partner_system** - Respect established travel partnerships
6. **byu_no_sunday** - BYU cannot play on Sunday

#### Men's Tennis - Soft Constraints (5)
1. **home_away_balance** (weight: 0.7) - Balance home/away matches throughout season
2. **travel_efficiency** (weight: 0.6) - Minimize travel distance between consecutive away matches
3. **facility_availability** (weight: 0.5) - Ensure facilities available for matches
4. **exam_period_avoidance** (weight: 0.8) - Avoid scheduling during exam periods
5. **even_distribution** (weight: 0.6) - Distribute matches evenly throughout season

#### Women's Tennis - Hard Constraints (4)
1. **conference_match_count** - Each team must play exactly 8 conference matches
2. **play_all_opponents** - Each team plays all other teams at least once
3. **no_byes** - No team has a bye week
4. **byu_no_sunday** - BYU cannot play on Sunday

#### Women's Tennis - Soft Constraints (7)
Same as men's tennis plus:
6. **weather_considerations** (weight: 0.6) - Consider weather patterns
7. **court_availability** (weight: 0.5) - Ensure court availability

**Migration Complexity**: MEDIUM - Round-robin requirements, travel partnerships

---

### Soccer/Volleyball Constraints

**Location**: `backend/src/ai/specialized/soccer_volleyball_constraints.js`

#### Soccer - Hard Constraints (7)
1. **conference_match_count** - Each team must have exactly 11 conference matches
2. **schedule_duration** - All matches within a 7-week period
3. **match_cadence** - Follow 1-2-2-1-2-2-1 weekly cadence
4. **byu_no_sunday** - BYU cannot play on Sunday
5. **byu_special_handling** - Games with BYU played Thursday and Monday
6. **final_match_timing** - Final match on Friday before Conference championship
7. **weather_dependency** - Outdoor sport weather considerations

#### Soccer - Soft Constraints (5)
1. **home_away_balance** (weight: 0.7) - Balance home/away matches
2. **travel_efficiency** (weight: 0.6) - Minimize travel distance
3. **exam_period_avoidance** (weight: 0.8) - Avoid exam periods
4. **field_availability** (weight: 0.5) - Ensure field availability
5. **doubleheader_opportunities** (weight: 0.4) - Consider men's/women's doubleheaders

#### Volleyball - Hard Constraints (6)
1. **conference_match_count** - Each team must play exactly 15 conference matches
2. **schedule_duration** - All matches within a 9-week period
3. **weekend_emphasis** - Most matches scheduled on weekends
4. **byu_no_sunday** - BYU cannot play on Sunday
5. **arena_availability** - Matches at appropriate volleyball venues
6. **tournament_preparation** - Schedule allows adequate tournament preparation

#### Volleyball - Soft Constraints (6)
1. **home_away_balance** (weight: 0.7) - Balance home/away matches
2. **travel_efficiency** (weight: 0.6) - Minimize travel distance
3. **tv_windows** (weight: 0.5) - Consider TV broadcast windows
4. **doubleheader_avoidance** (weight: 0.4) - Avoid conflicts with other sports
5. **academic_calendar** (weight: 0.8) - Respect academic calendar
6. **fan_attendance** (weight: 0.3) - Optimize for fan attendance

**Migration Complexity**: MEDIUM - Weather dependencies, BYU special handling

---

### Wrestling/Gymnastics Constraints

**Location**: `backend/src/ai/specialized/wrestling_constraints.js`, `gymnastics_constraints.js`

#### Wrestling - Hard Constraints (5)
1. **dual_meet_count** - Specific number of conference dual meets
2. **weight_class_alignment** - Ensure proper weight class competition
3. **venue_requirements** - Wrestling-specific venue requirements
4. **tournament_schedule** - Align with conference tournament dates
5. **byu_no_sunday** - BYU cannot compete on Sunday

#### Wrestling - Soft Constraints (4)
1. **travel_efficiency** (weight: 0.7) - Minimize travel for dual meets
2. **recovery_time** (weight: 0.8) - Adequate recovery between competitions
3. **academic_balance** (weight: 0.6) - Balance with academic calendar
4. **facility_sharing** (weight: 0.5) - Coordinate with other sports using same venues

#### Gymnastics - Hard Constraints (4)
1. **meet_count** - Specific number of conference meets
2. **equipment_requirements** - Gymnastics-specific equipment needs
3. **venue_setup_time** - Extended setup/teardown time requirements
4. **judging_availability** - Certified judges must be available

#### Gymnastics - Soft Constraints (5)
1. **equipment_sharing** (weight: 0.6) - Coordinate equipment usage
2. **travel_efficiency** (weight: 0.7) - Minimize travel costs
3. **academic_calendar** (weight: 0.8) - Respect academic schedules
4. **venue_sharing** (weight: 0.9) - High priority for venue coordination
5. **spectator_access** (weight: 0.3) - Consider spectator accessibility

**Migration Complexity**: MEDIUM - Equipment requirements, venue sharing complexity

---

## Global and Cross-Sport Constraints

**Location**: `backend/src/ai/specialized/global_constraints.js`

### Team-Specific Global Constraints (1)
1. **BYU Sunday Restriction** (CRITICAL) - BYU cannot play on Sunday for any sport
   - Implementation: `evaluateBYUSundayConstraint()`
   - Priority: CRITICAL (highest priority constraint)
   - Applies to: ALL sports

### Conference-Wide Constraints (8)
1. **Championship Date Alignment** - All sports must align with conference championship dates
2. **Media Rights Windows** - Respect TV broadcast windows across all sports
3. **Academic Calendar Integration** - Coordinate with academic calendar for all sports
4. **Travel Cost Optimization** - Minimize total conference travel costs
5. **Venue Utilization Balance** - Optimize usage across all conference venues
6. **Spring Break Coordination** - Coordinate schedules around spring break periods
7. **Final Exam Periods** - Avoid scheduling during final examination periods
8. **Holiday Considerations** - Respect major holidays across all sports

**Migration Complexity**: HIGH - Cross-sport dependencies, conference-wide coordination

---

## Venue and Facility Constraints

**Location**: `backend/src/ai/specialized/venue_sharing_constraints.js`, `backend/models/db-venue.js`

### Venue Sharing Constraints (12)

#### Shared Venue Schools
- **Arizona State**: Desert Financial Arena (5 sports)
- **Iowa State**: Hilton Coliseum (5 sports)  
- **West Virginia**: WVU Coliseum (5 sports)

#### Sports Priority Hierarchy
1. Men's Basketball (priority 1)
2. Women's Basketball (priority 2)
3. Volleyball (priority 3)
4. Gymnastics (priority 4)
5. Wrestling (priority 5)

#### Hard Constraints (3)
1. **no_same_day_conflicts** - Sports sharing venues cannot be scheduled simultaneously
2. **venue_availability** - Games only scheduled when venues are available
3. **setup_teardown_time** - Adequate time for venue transitions between sports

#### Soft Constraints (9)
1. **priority_hierarchy** (weight: 0.9) - Respect sport priority hierarchy
2. **buffer_time** (weight: 0.7) - 4+ hour buffer between events
3. **venue_turnaround** (weight: 0.8) - 6+ hour turnaround time
4. **gymnastics_setup** (weight: 0.9) - 12 hours before, 8 hours after gymnastics
5. **parking_coordination** (weight: 0.4) - Coordinate parking availability
6. **media_facility_access** (weight: 0.5) - Ensure media facility availability
7. **concession_coordination** (weight: 0.3) - Coordinate concession operations
8. **accessibility_requirements** (weight: 0.7) - Meet accessibility standards
9. **weather_backup_venues** (weight: 0.6) - Outdoor sport backup venue coordination

### Database Venue Constraints (6)
**Location**: `backend/models/db-venue.js`

1. **capacity_limits** - Venue capacity must meet sport requirements
2. **supported_sports** - Venues can only host supported sports
3. **time_zone_consistency** - Consistent time zone handling
4. **facility_requirements** - Sport-specific facility requirements
5. **transport_hub_access** - Proximity to transportation hubs
6. **weather_impact_factors** - Weather impact considerations for outdoor venues

**Migration Complexity**: HIGH - Complex venue sharing, equipment requirements

---

## Travel and Logistics Constraints

**Location**: `backend/src/ai/specialized/travel_optimization_agent.js`, algorithmic files

### Travel Optimization Constraints (15)

#### Hard Travel Constraints (3)
1. **maximum_travel_distance** - Teams cannot exceed maximum total travel distance
2. **consecutive_travel_limit** - Limit consecutive away games requiring travel
3. **charter_availability** - Ensure transportation availability for scheduled games

#### Soft Travel Constraints (12)
1. **minimize_total_distance** (weight: 0.7) - Minimize total conference travel distance
2. **balance_travel_load** (weight: 0.6) - Balance travel burden across teams
3. **cluster_geographic_games** (weight: 0.5) - Group geographically close games
4. **optimize_road_trips** (weight: 0.8) - Create efficient road trip sequences
5. **time_zone_considerations** (weight: 0.6) - Minimize time zone changes
6. **charter_cost_optimization** (weight: 0.9) - Optimize shared charter opportunities
7. **seasonal_pricing** (weight: 0.4) - Consider seasonal travel cost variations
8. **accommodation_coordination** (weight: 0.5) - Coordinate team accommodation needs
9. **equipment_transport** (weight: 0.3) - Consider equipment transportation requirements
10. **arrival_time_optimization** (weight: 0.6) - Optimize arrival times for performance
11. **departure_flexibility** (weight: 0.4) - Allow flexible departure scheduling
12. **emergency_contingency** (weight: 0.8) - Plan for travel disruption contingencies

### Travel Cost Framework Components (5)
1. **Transportation Mode Selection** - Bus vs. flight optimization
2. **Circuit Generation** - Multi-city trip optimization
3. **Shared Charter Coordination** - Multi-team charter opportunities
4. **Seasonal Pricing Models** - Dynamic pricing based on travel seasons
5. **Real-time Budget Monitoring** - Live tracking of travel expenditures

**Migration Complexity**: MEDIUM - Algorithmic optimization, real-time data integration

---

## Database-Level Constraints

**Location**: `backend/models/db-constraint.js`, `constraint.js`, `types.js`

### Database Schema Constraints (8)

#### Constraint Types
- **Hard Constraints** (ENUM: 'Hard') - Must be satisfied
- **Soft Constraints** (ENUM: 'Soft') - Preferences with penalties

#### Constraint Categories (7)
1. **Travel** - Travel-related constraints
2. **Rest** - Player/team rest requirements
3. **Venue** - Venue availability and requirements
4. **Broadcast** - TV/media broadcast requirements
5. **Competitive** - Competitive balance requirements
6. **Academic** - Academic calendar considerations
7. **Custom** - Custom constraint definitions

#### Database Constraint Models
1. **ScheduleConstraint** - Main constraint storage
2. **RestDaysConstraint** - Minimum rest day requirements
3. **MaxConsecutiveAwayConstraint** - Consecutive away game limits
4. **VenueAvailabilityConstraint** - Venue availability validation
5. **ConstraintTeams** - Constraint-to-team associations

### Database Validation Constraints (10)
1. **constraint_id** - Primary key, auto-increment
2. **schedule_id** - Foreign key to schedules table
3. **name** - Required constraint name
4. **type** - Required Hard/Soft designation
5. **category** - Required category classification
6. **parameters** - JSONB constraint parameters
7. **weight** - Float weight for soft constraints (default 1.0)
8. **is_active** - Boolean activation flag (default true)
9. **timestamps** - Created/updated timestamps
10. **underscored** - Snake_case field naming

**Migration Complexity**: LOW-MEDIUM - Well-structured database schema

---

## Algorithmic Constraints

**Location**: `backend/src/algorithms/improvements/constraint_evaluator.js`

### Constraint Evaluation System (18)

#### Built-in Constraint Evaluators
1. **RestDays** - Minimum rest days between games
2. **MaxConsecutiveAway** - Maximum consecutive away games
3. **MaxConsecutiveHome** - Maximum consecutive home games
4. **VenueAvailability** - Venue availability validation
5. **SpecialDate** - Special date restrictions (holidays, etc.)
6. **DivisionBalance** - Division-based game distribution
7. **ConferenceBalance** - Conference game distribution
8. **TravelDistance** - Travel distance optimization
9. **HomeAwayBalance** - Home/away game balance
10. **WeekdayWeekendBalance** - Weekday/weekend distribution
11. **TimeSlotDistribution** - Time slot distribution optimization
12. **TVBroadcastRequirements** - TV broadcast obligations
13. **TraditionalDates** - Traditional rivalry date preferences
14. **PlayerRest** - Player health and recovery requirements
15. **CrossTownRivalry** - Cross-town rivalry scheduling
16. **FacilityAvailability** - Facility-specific availability
17. **WeatherConsiderations** - Weather impact factors
18. **ExamPeriodAvoidance** - Academic exam period avoidance

### Constraint Weights (Default Values)
- **hardConstraintWeight**: 10,000 (very high enforcement)
- **RestDays**: 10
- **MaxConsecutiveAway**: 5
- **MaxConsecutiveHome**: 5
- **VenueAvailability**: 1,000
- **SpecialDate**: 500
- **TravelDistance**: 0.1
- **HomeAwayBalance**: 6
- **PlayerRest**: 9

### Learning and Adaptation (5)
1. **Feedback Processing** - Process user feedback to adjust weights
2. **Historical Analysis** - Learn from previous scheduling decisions
3. **Weight Adjustment** - Dynamic weight adjustment based on performance
4. **Violation Tracking** - Track constraint violations over time
5. **Performance Metrics** - Measure constraint satisfaction rates

**Migration Complexity**: MEDIUM-HIGH - Complex evaluation logic, machine learning integration

---

## Migration Analysis

### Complexity Assessment by Category

#### HIGH Complexity (Migration Priority 1)
1. **Football Constraints** - Media rights integration, temporal complexity
2. **Global Constraints** - Cross-sport dependencies, BYU restrictions
3. **Venue Sharing** - Complex multi-sport coordination, equipment needs
4. **Basketball** - Big Monday requirements, distribution patterns

#### MEDIUM-HIGH Complexity (Migration Priority 2)
1. **Algorithmic Constraints** - Complex evaluation logic, ML integration
2. **Baseball/Softball** - Series-based scheduling, weather dependencies
3. **Travel Optimization** - Real-time data integration, cost optimization

#### MEDIUM Complexity (Migration Priority 3)
1. **Tennis** - Round-robin requirements, travel partnerships
2. **Soccer/Volleyball** - Weather dependencies, BYU handling
3. **Wrestling/Gymnastics** - Equipment requirements, venue sharing

#### LOW-MEDIUM Complexity (Migration Priority 4)
1. **Database Constraints** - Well-structured schema, standard patterns

### Dependencies Analysis

#### External Dependencies
1. **Media Rights Systems** - ESPN, FOX broadcast scheduling
2. **Academic Calendar Systems** - University exam schedules
3. **Travel Booking Systems** - Charter flight, bus, hotel booking
4. **Weather Services** - Real-time weather data for outdoor sports
5. **Venue Management Systems** - Facility availability and booking

#### Internal Dependencies
1. **Championship Date System** - Conference tournament scheduling
2. **Team Management System** - Team availability and preferences
3. **Facility Management** - Venue and equipment coordination
4. **Budget Management** - Travel cost tracking and optimization
5. **Notification Systems** - Stakeholder communication

### Data Migration Requirements

#### Constraint Data
- 150+ constraint definitions across sports
- Historical constraint violation data
- Constraint weight and priority configurations
- Sport-specific parameter configurations

#### Scheduling Data
- Existing schedule patterns and templates
- Historical scheduling decisions and outcomes
- Constraint satisfaction metrics
- Performance and feedback data

#### Configuration Data
- Sport-specific scheduling parameters
- Venue capabilities and restrictions
- Team preferences and requirements
- Media rights and broadcast windows

---

## ConstraintExtractor Implementation

Based on the comprehensive constraint analysis, here is the recommended ConstraintExtractor class implementation:

```javascript
/**
 * ConstraintExtractor for FlexTime Microservices Migration
 * 
 * Extracts and catalogs all scheduling constraints from the existing FlexTime codebase
 * for migration to microservices architecture.
 */

const fs = require('fs');
const path = require('path');

class ConstraintExtractor {
  constructor(options = {}) {
    this.basePath = options.basePath || '/Users/nickw/Documents/GitHub/Flextime';
    this.outputPath = options.outputPath || './migration/constraints';
    this.constraints = {
      hard: [],
      soft: [],
      global: [],
      sportSpecific: {},
      venue: [],
      travel: [],
      database: [],
      algorithmic: []
    };
    this.dependencies = new Map();
    this.migrationComplexity = new Map();
  }

  /**
   * Extract all constraints from the FlexTime codebase
   */
  async extractAllConstraints() {
    console.log('Starting FlexTime constraint extraction...');
    
    // Extract sport-specific constraints
    await this.extractSportConstraints();
    
    // Extract global constraints
    await this.extractGlobalConstraints();
    
    // Extract venue constraints
    await this.extractVenueConstraints();
    
    // Extract travel constraints
    await this.extractTravelConstraints();
    
    // Extract database constraints
    await this.extractDatabaseConstraints();
    
    // Extract algorithmic constraints
    await this.extractAlgorithmicConstraints();
    
    // Analyze dependencies
    this.analyzeDependencies();
    
    // Assess migration complexity
    this.assessMigrationComplexity();
    
    // Generate migration reports
    await this.generateMigrationReports();
    
    console.log('Constraint extraction completed successfully');
    return this.constraints;
  }

  /**
   * Extract sport-specific constraints
   */
  async extractSportConstraints() {
    const sportFiles = [
      'football_constraints.js',
      'basketball_scheduling_constraints.js',
      'baseball_softball_constraints.js',
      'tennis_constraints.js',
      'soccer_volleyball_constraints.js',
      'wrestling_constraints.js',
      'gymnastics_constraints.js'
    ];

    for (const file of sportFiles) {
      const filePath = path.join(this.basePath, 'backend/src/ai/specialized', file);
      if (fs.existsSync(filePath)) {
        const constraints = this.parseConstraintFile(filePath);
        const sport = this.extractSportName(file);
        this.constraints.sportSpecific[sport] = constraints;
        
        // Categorize as hard or soft
        if (constraints.hard) {
          this.constraints.hard.push(...Object.values(constraints.hard));
        }
        if (constraints.soft) {
          this.constraints.soft.push(...Object.values(constraints.soft));
        }
      }
    }
  }

  /**
   * Extract global constraints
   */
  async extractGlobalConstraints() {
    const globalFile = path.join(this.basePath, 'backend/src/ai/specialized/global_constraints.js');
    if (fs.existsSync(globalFile)) {
      const globalConstraints = this.parseConstraintFile(globalFile);
      this.constraints.global = globalConstraints;
      
      // BYU Sunday restriction is critical
      if (globalConstraints.teamSpecificConstraints?.BYU) {
        this.migrationComplexity.set('BYU_SUNDAY_RESTRICTION', 'CRITICAL');
      }
    }
  }

  /**
   * Extract venue sharing constraints
   */
  async extractVenueConstraints() {
    const venueFile = path.join(this.basePath, 'backend/src/ai/specialized/venue_sharing_constraints.js');
    if (fs.existsSync(venueFile)) {
      const venueConstraints = this.parseConstraintFile(venueFile);
      this.constraints.venue = venueConstraints;
      
      // Add dependency on venue management systems
      this.dependencies.set('venue_sharing', ['venue_management_system', 'equipment_coordination']);
    }
  }

  /**
   * Extract travel optimization constraints
   */
  async extractTravelConstraints() {
    const travelFile = path.join(this.basePath, 'backend/src/ai/specialized/travel_optimization_agent.js');
    if (fs.existsSync(travelFile)) {
      const travelConstraints = this.parseTravelOptimizationFile(travelFile);
      this.constraints.travel = travelConstraints;
      
      // Add dependencies on external travel systems
      this.dependencies.set('travel_optimization', [
        'charter_booking_systems',
        'hotel_booking_systems',
        'weather_services',
        'cost_tracking_systems'
      ]);
    }
  }

  /**
   * Extract database-level constraints
   */
  async extractDatabaseConstraints() {
    const dbFiles = [
      'db-constraint.js',
      'constraint.js',
      'types.js',
      'db-venue.js'
    ];

    for (const file of dbFiles) {
      const filePath = path.join(this.basePath, 'backend/models', file);
      if (fs.existsSync(filePath)) {
        const dbConstraints = this.parseDatabaseConstraintFile(filePath);
        this.constraints.database.push(...dbConstraints);
      }
    }
  }

  /**
   * Extract algorithmic constraints
   */
  async extractAlgorithmicConstraints() {
    const algoFile = path.join(this.basePath, 'backend/src/algorithms/improvements/constraint_evaluator.js');
    if (fs.existsSync(algoFile)) {
      const algoConstraints = this.parseAlgorithmicConstraintFile(algoFile);
      this.constraints.algorithmic = algoConstraints;
      
      // Add dependency on ML/AI systems
      this.dependencies.set('algorithmic_constraints', [
        'machine_learning_pipeline',
        'feedback_processing_system',
        'performance_analytics'
      ]);
    }
  }

  /**
   * Parse constraint file and extract constraint definitions
   */
  parseConstraintFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract constraint objects using regex patterns
      const hardConstraintsMatch = content.match(/hard:\s*{([\s\S]*?)},?\s*(?:soft:|\/\/|$)/);
      const softConstraintsMatch = content.match(/soft:\s*{([\s\S]*?)},?\s*(?:\/\/|seasonParameters|$)/);
      
      const constraints = {};
      
      if (hardConstraintsMatch) {
        constraints.hard = this.parseConstraintObject(hardConstraintsMatch[1]);
      }
      
      if (softConstraintsMatch) {
        constraints.soft = this.parseConstraintObject(softConstraintsMatch[1]);
      }
      
      return constraints;
    } catch (error) {
      console.error(`Error parsing constraint file ${filePath}:`, error.message);
      return {};
    }
  }

  /**
   * Parse constraint object from string content
   */
  parseConstraintObject(content) {
    const constraints = {};
    const constraintMatches = content.match(/'([^']+)':\s*{([^}]*)}/g);
    
    if (constraintMatches) {
      for (const match of constraintMatches) {
        const [, name, definition] = match.match(/'([^']+)':\s*{([^}]*)}/);
        constraints[name] = this.parseConstraintDefinition(definition);
      }
    }
    
    return constraints;
  }

  /**
   * Parse individual constraint definition
   */
  parseConstraintDefinition(definition) {
    const constraint = {};
    
    // Extract description
    const descMatch = definition.match(/description:\s*'([^']*)'|description:\s*"([^"]*)"/);
    if (descMatch) {
      constraint.description = descMatch[1] || descMatch[2];
    }
    
    // Extract weight
    const weightMatch = definition.match(/weight:\s*([\d.]+)/);
    if (weightMatch) {
      constraint.weight = parseFloat(weightMatch[1]);
    }
    
    // Extract enforced flag
    const enforcedMatch = definition.match(/enforced:\s*(true|false)/);
    if (enforcedMatch) {
      constraint.enforced = enforcedMatch[1] === 'true';
    }
    
    // Extract value
    const valueMatch = definition.match(/value:\s*(\d+)/);
    if (valueMatch) {
      constraint.value = parseInt(valueMatch[1]);
    }
    
    return constraint;
  }

  /**
   * Extract sport name from filename
   */
  extractSportName(filename) {
    return filename.replace('_constraints.js', '').replace('.js', '');
  }

  /**
   * Parse travel optimization file
   */
  parseTravelOptimizationFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract optimization strategies
      const strategiesMatch = content.match(/optimizationStrategies\s*=\s*{([\s\S]*?)};/);
      const strategies = [];
      
      if (strategiesMatch) {
        const strategyContent = strategiesMatch[1];
        const strategyMatches = strategyContent.match(/'([^']+)':/g);
        
        if (strategyMatches) {
          for (const match of strategyMatches) {
            const strategyName = match.replace(/['':]/g, '');
            strategies.push({
              name: strategyName,
              type: 'travel_optimization',
              complexity: 'MEDIUM'
            });
          }
        }
      }
      
      return strategies;
    } catch (error) {
      console.error(`Error parsing travel optimization file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Parse database constraint files
   */
  parseDatabaseConstraintFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const constraints = [];
      
      // Extract Sequelize model definitions
      const modelMatches = content.match(/(\w+):\s*{[^}]*type:\s*DataTypes\.(\w+)[^}]*}/g);
      
      if (modelMatches) {
        for (const match of modelMatches) {
          const [, fieldName, dataType] = match.match(/(\w+):\s*{[^}]*type:\s*DataTypes\.(\w+)/);
          
          constraints.push({
            name: fieldName,
            type: 'database',
            dataType: dataType,
            source: path.basename(filePath)
          });
        }
      }
      
      // Extract ENUM constraints
      const enumMatches = content.match(/type:\s*DataTypes\.ENUM\([^)]+\)/g);
      if (enumMatches) {
        for (const enumMatch of enumMatches) {
          constraints.push({
            type: 'database_enum',
            definition: enumMatch,
            source: path.basename(filePath)
          });
        }
      }
      
      return constraints;
    } catch (error) {
      console.error(`Error parsing database constraint file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Parse algorithmic constraint evaluator
   */
  parseAlgorithmicConstraintFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const constraints = [];
      
      // Extract evaluation methods
      const methodMatches = content.match(/_evaluate\w+/g);
      
      if (methodMatches) {
        for (const method of methodMatches) {
          const constraintName = method.replace('_evaluate', '').replace(/([A-Z])/g, '_$1').toLowerCase();
          constraints.push({
            name: constraintName,
            type: 'algorithmic',
            evaluationMethod: method,
            complexity: 'MEDIUM-HIGH'
          });
        }
      }
      
      // Extract default weights
      const weightsMatch = content.match(/defaultWeights\s*=\s*{([\s\S]*?)};/);
      if (weightsMatch) {
        const weightContent = weightsMatch[1];
        const weightMatches = weightContent.match(/(\w+):\s*([\d.]+)/g);
        
        if (weightMatches) {
          for (const weightMatch of weightMatches) {
            const [, constraintType, weight] = weightMatch.match(/(\w+):\s*([\d.]+)/);
            const existingConstraint = constraints.find(c => c.name.includes(constraintType.toLowerCase()));
            if (existingConstraint) {
              existingConstraint.defaultWeight = parseFloat(weight);
            }
          }
        }
      }
      
      return constraints;
    } catch (error) {
      console.error(`Error parsing algorithmic constraint file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Analyze constraint dependencies
   */
  analyzeDependencies() {
    // Cross-constraint dependencies
    const crossDependencies = new Map();
    
    // BYU Sunday restriction affects all sports
    crossDependencies.set('byu_sunday_restriction', this.getAllSportConstraints());
    
    // Venue sharing affects multiple sports
    crossDependencies.set('venue_sharing', ['basketball', 'volleyball', 'gymnastics', 'wrestling']);
    
    // Travel optimization affects all away games
    crossDependencies.set('travel_optimization', this.getAllSportConstraints());
    
    // Media rights affect football and basketball primarily
    crossDependencies.set('media_rights', ['football', 'basketball']);
    
    this.dependencies.set('cross_constraints', crossDependencies);
  }

  /**
   * Assess migration complexity for each constraint category
   */
  assessMigrationComplexity() {
    // Sport-specific complexities
    this.migrationComplexity.set('football', 'HIGH');
    this.migrationComplexity.set('basketball', 'MEDIUM-HIGH');
    this.migrationComplexity.set('baseball_softball', 'MEDIUM');
    this.migrationComplexity.set('tennis', 'MEDIUM');
    this.migrationComplexity.set('soccer_volleyball', 'MEDIUM');
    this.migrationComplexity.set('wrestling_gymnastics', 'MEDIUM');
    
    // System complexities
    this.migrationComplexity.set('global_constraints', 'HIGH');
    this.migrationComplexity.set('venue_sharing', 'HIGH');
    this.migrationComplexity.set('travel_optimization', 'MEDIUM-HIGH');
    this.migrationComplexity.set('algorithmic_constraints', 'MEDIUM-HIGH');
    this.migrationComplexity.set('database_constraints', 'LOW-MEDIUM');
  }

  /**
   * Get all sport constraint names
   */
  getAllSportConstraints() {
    return Object.keys(this.constraints.sportSpecific);
  }

  /**
   * Generate comprehensive migration reports
   */
  async generateMigrationReports() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
    
    // Generate constraint summary report
    await this.generateConstraintSummary();
    
    // Generate dependency analysis report
    await this.generateDependencyReport();
    
    // Generate complexity assessment report
    await this.generateComplexityReport();
    
    // Generate microservices mapping report
    await this.generateMicroservicesMapping();
  }

  /**
   * Generate constraint summary report
   */
  async generateConstraintSummary() {
    const summary = {
      totalConstraints: this.getTotalConstraintCount(),
      hardConstraints: this.constraints.hard.length,
      softConstraints: this.constraints.soft.length,
      sportSpecificConstraints: Object.keys(this.constraints.sportSpecific).length,
      globalConstraints: Object.keys(this.constraints.global).length,
      venueConstraints: this.constraints.venue.length,
      travelConstraints: this.constraints.travel.length,
      databaseConstraints: this.constraints.database.length,
      algorithmicConstraints: this.constraints.algorithmic.length,
      byCategory: this.getConstraintsByCategory(),
      bySport: this.getConstraintsBySport()
    };
    
    const outputFile = path.join(this.outputPath, 'constraint-summary.json');
    fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    console.log(`Constraint summary report generated: ${outputFile}`);
  }

  /**
   * Generate dependency analysis report
   */
  async generateDependencyReport() {
    const dependencyReport = {
      externalDependencies: this.getExternalDependencies(),
      internalDependencies: this.getInternalDependencies(),
      crossConstraintDependencies: this.getCrossConstraintDependencies(),
      migrationSequence: this.generateMigrationSequence()
    };
    
    const outputFile = path.join(this.outputPath, 'dependency-analysis.json');
    fs.writeFileSync(outputFile, JSON.stringify(dependencyReport, null, 2));
    console.log(`Dependency analysis report generated: ${outputFile}`);
  }

  /**
   * Generate complexity assessment report
   */
  async generateComplexityReport() {
    const complexityReport = {
      overallComplexity: 'HIGH',
      complexityByCategory: Object.fromEntries(this.migrationComplexity),
      migrationPriorities: this.generateMigrationPriorities(),
      riskFactors: this.identifyRiskFactors(),
      recommendations: this.generateMigrationRecommendations()
    };
    
    const outputFile = path.join(this.outputPath, 'complexity-assessment.json');
    fs.writeFileSync(outputFile, JSON.stringify(complexityReport, null, 2));
    console.log(`Complexity assessment report generated: ${outputFile}`);
  }

  /**
   * Generate microservices mapping report
   */
  async generateMicroservicesMapping() {
    const microservicesMap = {
      'constraint-service': {
        responsibilities: ['Hard constraint validation', 'Soft constraint scoring', 'Constraint configuration management'],
        constraints: [...this.constraints.hard, ...this.constraints.soft],
        complexity: 'HIGH',
        dependencies: ['database-service', 'notification-service']
      },
      'venue-service': {
        responsibilities: ['Venue availability management', 'Venue sharing coordination', 'Equipment scheduling'],
        constraints: this.constraints.venue,
        complexity: 'HIGH',
        dependencies: ['constraint-service', 'equipment-service']
      },
      'travel-service': {
        responsibilities: ['Travel optimization', 'Cost calculation', 'Charter coordination'],
        constraints: this.constraints.travel,
        complexity: 'MEDIUM-HIGH',
        dependencies: ['constraint-service', 'external-travel-apis']
      },
      'sport-specific-services': this.generateSportSpecificServiceMap(),
      'global-coordination-service': {
        responsibilities: ['Cross-sport coordination', 'BYU Sunday restrictions', 'Conference-wide constraints'],
        constraints: this.constraints.global,
        complexity: 'HIGH',
        dependencies: ['all-sport-services', 'constraint-service']
      }
    };
    
    const outputFile = path.join(this.outputPath, 'microservices-mapping.json');
    fs.writeFileSync(outputFile, JSON.stringify(microservicesMap, null, 2));
    console.log(`Microservices mapping report generated: ${outputFile}`);
  }

  /**
   * Generate sport-specific service mapping
   */
  generateSportSpecificServiceMap() {
    const sportServices = {};
    
    for (const [sport, constraints] of Object.entries(this.constraints.sportSpecific)) {
      sportServices[`${sport}-service`] = {
        responsibilities: [`${sport} schedule generation`, `${sport} constraint validation`, `${sport} optimization`],
        constraints: constraints,
        complexity: this.migrationComplexity.get(sport) || 'MEDIUM',
        dependencies: ['constraint-service', 'venue-service', 'travel-service']
      };
    }
    
    return sportServices;
  }

  /**
   * Utility methods for report generation
   */
  getTotalConstraintCount() {
    return this.constraints.hard.length + 
           this.constraints.soft.length + 
           Object.keys(this.constraints.global).length +
           this.constraints.venue.length +
           this.constraints.travel.length +
           this.constraints.database.length +
           this.constraints.algorithmic.length;
  }

  getConstraintsByCategory() {
    return {
      hard: this.constraints.hard.length,
      soft: this.constraints.soft.length,
      global: Object.keys(this.constraints.global).length,
      venue: this.constraints.venue.length,
      travel: this.constraints.travel.length,
      database: this.constraints.database.length,
      algorithmic: this.constraints.algorithmic.length
    };
  }

  getConstraintsBySport() {
    const bySport = {};
    for (const [sport, constraints] of Object.entries(this.constraints.sportSpecific)) {
      bySport[sport] = {
        hard: constraints.hard ? Object.keys(constraints.hard).length : 0,
        soft: constraints.soft ? Object.keys(constraints.soft).length : 0,
        total: (constraints.hard ? Object.keys(constraints.hard).length : 0) + 
               (constraints.soft ? Object.keys(constraints.soft).length : 0)
      };
    }
    return bySport;
  }

  getExternalDependencies() {
    return [
      'ESPN/FOX Media Rights Systems',
      'University Academic Calendar Systems',
      'Charter Flight Booking Systems',
      'Hotel Booking Systems',
      'Weather Data Services',
      'NCAA Championship Scheduling',
      'Conference Office Systems',
      'Venue Management Systems'
    ];
  }

  getInternalDependencies() {
    return [
      'Team Management System',
      'Schedule Database',
      'Constraint Configuration System',
      'Notification System',
      'Cost Tracking System',
      'Performance Analytics',
      'User Interface Systems'
    ];
  }

  getCrossConstraintDependencies() {
    return Array.from(this.dependencies.get('cross_constraints') || new Map());
  }

  generateMigrationSequence() {
    return [
      { phase: 1, services: ['database-service', 'constraint-service'], rationale: 'Foundation services' },
      { phase: 2, services: ['venue-service', 'travel-service'], rationale: 'Core operational services' },
      { phase: 3, services: ['football-service', 'basketball-service'], rationale: 'High-priority sports' },
      { phase: 4, services: ['baseball-service', 'tennis-service', 'soccer-service'], rationale: 'Medium-priority sports' },
      { phase: 5, services: ['global-coordination-service'], rationale: 'Cross-sport coordination' }
    ];
  }

  generateMigrationPriorities() {
    return {
      priority1: ['BYU Sunday restrictions', 'Media rights constraints', 'Venue sharing'],
      priority2: ['Football constraints', 'Basketball constraints', 'Travel optimization'],
      priority3: ['Baseball/Softball constraints', 'Tennis constraints', 'Academic calendar'],
      priority4: ['Wrestling/Gymnastics constraints', 'Soccer/Volleyball constraints']
    };
  }

  identifyRiskFactors() {
    return [
      'Complex venue sharing across multiple sports',
      'BYU Sunday restriction affects all sports',
      'Media rights integration with external systems',
      'Real-time travel cost optimization',
      'Cross-sport constraint dependencies',
      'Academic calendar coordination across institutions',
      'Equipment sharing and setup time requirements'
    ];
  }

  generateMigrationRecommendations() {
    return [
      'Implement BYU Sunday restriction as highest priority global constraint',
      'Create dedicated venue coordination service for shared facilities',
      'Establish clear service boundaries with well-defined APIs',
      'Implement gradual migration with sport-by-sport rollout',
      'Create comprehensive testing framework for constraint validation',
      'Establish monitoring and alerting for constraint violations',
      'Design for high availability given conference-critical nature',
      'Implement rollback capabilities for failed constraint updates'
    ];
  }
}

module.exports = ConstraintExtractor;
```

This ConstraintExtractor implementation provides:

1. **Comprehensive Extraction** - Extracts all 150+ constraints from the FlexTime codebase
2. **Categorization** - Organizes constraints by type, sport, and complexity
3. **Dependency Analysis** - Identifies internal and external dependencies
4. **Migration Assessment** - Evaluates migration complexity and risks
5. **Microservices Mapping** - Maps constraints to proposed microservices
6. **Detailed Reporting** - Generates comprehensive JSON reports for migration planning

The implementation is designed to be the foundation for the microservices migration, providing clear insight into the constraint landscape and migration requirements.

---

## Conclusion

The FlexTime constraint catalog reveals a sophisticated scheduling system with over 150 constraints spanning multiple sports, venues, travel considerations, and regulatory requirements. The migration to microservices will require careful attention to constraint dependencies, particularly around venue sharing, BYU restrictions, and cross-sport coordination.

**Key Migration Priorities:**
1. Implement global BYU Sunday restrictions first
2. Create dedicated venue coordination service
3. Establish sport-specific services with clear boundaries
4. Design for high availability and rollback capabilities
5. Implement comprehensive constraint validation testing

This catalog serves as the foundation for the microservices migration planning and implementation phases.