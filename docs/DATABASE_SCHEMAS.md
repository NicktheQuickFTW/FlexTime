# FlexTime Database Schemas Reference

> **Comprehensive reference for all FlexTime database schemas, ID patterns, and relationships**

## 📋 **Table of Contents**
- [Core ID Patterns](#core-id-patterns)
- [Primary Entities](#primary-entities)
- [Microservices Schemas](#microservices-schemas)
- [Sport & Venue Mappings](#sport--venue-mappings)
- [Schema Files Reference](#schema-files-reference)

---

## 🔑 **Core ID Patterns**

### **Team ID Pattern**
```
team_id = school_id + zero-padded sport_id
Format: SSS (school) + PP (sport) = SSSPP
```

**Examples:**
- Arizona Baseball: 1 + 01 = **101**
- UCF Football: 5 + 08 = **508** 
- Kansas Basketball: 10 + 02 = **1002**

### **Venue ID Pattern** 
```
venue_id = school_id + venue_type
Format: SS (school) + VV (venue type) = SSVV
```

**Venue Types:**
- **01** = Football Stadium 🏈
- **02** = Arena/Gymnasium 🏀 (Basketball, Gymnastics)
- **03** = Baseball Complex ⚾
- **04** = Softball Complex 🥎 
- **05** = Soccer Field ⚽
- **06** = Volleyball Facility 🏐
- **07** = Tennis Complex 🎾
- **08** = Track & Field 🏃
- **09** = Swimming Pool 🏊
- **10** = Golf Course ⛳

**Examples:**
- Arizona Football Stadium: 1 + 01 = **0101**
- UCF Arena: 5 + 02 = **0502**
- Kansas Baseball Complex: 10 + 03 = **1003**

---

## 🏫 **Primary Entities**

### **Schools Table**
```sql
schools (
  school_id INTEGER PRIMARY KEY,
  school VARCHAR NOT NULL,              -- University name
  school_abbreviation VARCHAR,          -- School code
  short_display VARCHAR,
  preferred_school_name VARCHAR,
  location VARCHAR,                     -- Geographic location
  primary_color VARCHAR,
  secondary_color VARCHAR,
  mascot VARCHAR,
  website VARCHAR,
  conference_id INTEGER
)
```

### **Sports Table**
```sql
sports (
  sport_id INTEGER PRIMARY KEY,
  sport_name VARCHAR NOT NULL,          -- Full sport name
  code VARCHAR,                         -- Sport abbreviation (BSB, MBB, etc.)
  gender VARCHAR,                       -- Men, Women, Mixed
  season_type VARCHAR,                  -- fall, winter, spring
  team_count INTEGER,                   -- Number of teams in Big 12
  scheduled_by_flextime BOOLEAN         -- Managed by FlexTime
)
```

**FlexTime Managed Sports (12 active):**

| ID | Code | Sport Name | Season | Teams | Status |
|----|------|------------|--------|-------|--------|
| 1  | BSB  | Baseball   | Spring | 14    | ✅ Active |
| 2  | MBB  | Men's Basketball | Winter | 16 | ✅ Active |
| 3  | WBB  | Women's Basketball | Winter | 16 | ✅ Active |
| 8  | FB   | Football   | Fall   | 16    | ✅ Active |
| 11 | GYM  | Gymnastics (Women's) | Winter | 7 | ✅ Active (6 Big 12 + Denver affiliate) |
| 13 | LAX  | Lacrosse (Women's) | Spring | 6 | ✅ Active (3 Big 12 + 3 affiliates) |
| 14 | SOC  | Soccer (Women's) | Fall | 16 | ✅ Active |
| 15 | SB   | Softball   | Spring | 11    | ✅ Active |
| 18 | MTN  | Men's Tennis | Spring | 9 | ✅ Active |
| 19 | WTN  | Women's Tennis | Spring | 16 | ✅ Active |
| 24 | VB   | Volleyball (Women's) | Fall | 15 | ✅ Active |
| 25 | WRE  | Wrestling  | Winter | 14    | ✅ Active (4 Big 12 + 10 affiliates) |

**Other Big 12 Sports (not managed by FlexTime):**
| ID | Code | Sport Name | Teams |
|----|------|------------|-------|
| 4 | BVB | Beach Volleyball | 3 |
| 5 | MXC | Men's Cross Country | 13 |
| 6 | WXC | Women's Cross Country | 16 |
| 7 | EQ | Equestrian | 4 |
| 9 | MGO | Men's Golf | 16 |
| 10 | WGO | Women's Golf | 14 |
| 13 | ROW | Rowing | 6 |
| 16 | MSD | Men's Swimming & Diving | 7 |
| 17 | WSD | Women's Swimming & Diving | 10 |
| 20 | MITF | Men's Indoor Track & Field | 13 |
| 21 | WITF | Women's Indoor Track & Field | 16 |
| 22 | MOTF | Men's Outdoor Track & Field | 13 |
| 23 | WOTF | Women's Outdoor Track & Field | 16 |

---

## 🤝 **Affiliate Team Support**

### **Big 12 Sports with Affiliate Members**

The FlexTime FT Builder Engine now supports all affiliate teams across Big 12 sports. This ensures complete scheduling coverage for sports where the Big 12 Conference includes non-member institutions.

#### **Complete Affiliate Team Listings:**

**🥍 Lacrosse (6 teams total)**
- **Big 12 Members (3)**: Arizona State, Cincinnati, Colorado
- **Affiliates (3)**: Florida, San Diego State, UC Davis

**🤸 Gymnastics (7 teams total)**
- **Big 12 Members (6)**: Arizona, Arizona State, BYU, Iowa State, Utah, West Virginia
- **Affiliates (1)**: Denver

**🤼 Wrestling (14 teams total)**
- **Big 12 Members (4)**: Arizona State, Iowa State, Oklahoma State, West Virginia
- **Affiliates (10)**: Air Force, Cal Baptist, Missouri, North Dakota State, Northern Colorado, Northern Iowa, Oklahoma, South Dakota State, Utah Valley, Wyoming

**🚣 Rowing (6 teams total)**
- **Big 12 Members (4)**: Kansas, Kansas State, UCF, West Virginia
- **Affiliates (2)**: Old Dominion, Tulsa

**🐎 Equestrian (4 teams total)**
- **Big 12 Members (3)**: Baylor, Oklahoma State, TCU
- **Affiliates (1)**: Fresno State

**🏐 Beach Volleyball (3 teams total)**
- **Big 12 Members (3)**: Arizona, Arizona State, TCU
- **Affiliates**: None

#### **FT Builder Engine Support Status**

✅ **All affiliate teams are now supported** in the FT Builder Engine configuration (`backend/services/FT_Builder_Engine.js` lines 1388-1396).

The `sportParticipation` mapping includes complete team lists for all sports with affiliates, ensuring that schedule generation includes all participating teams, not just Big 12 members.

---

### **Teams Table**
```sql
teams (
  team_id INTEGER PRIMARY KEY,         -- Generated: school_id + sport_id
  name VARCHAR,                        -- Team name
  mascot VARCHAR,
  school_id INTEGER REFERENCES schools(school_id),
  sport_id INTEGER REFERENCES sports(sport_id),
  abbreviation VARCHAR,
  primary_color VARCHAR,
  secondary_color VARCHAR,
  
  -- COMPASS Rating Fields
  compass_rating DECIMAL,
  compass_competitive DECIMAL,
  compass_operational DECIMAL,
  compass_market DECIMAL,
  compass_trajectory DECIMAL,
  compass_analytics DECIMAL,
  compass_overall_score INTEGER,
  
  -- Performance Data
  season_record VARCHAR,
  conference_record VARCHAR,
  national_ranking INTEGER,
  head_coach VARCHAR,
  coach_tenure INTEGER,
  
  -- Facility Information
  facility_name VARCHAR,
  facility_capacity INTEGER,
  
  -- Enhanced Analytics
  scheduling_tier VARCHAR,
  scheduling_considerations TEXT,
  competitive_analysis TEXT,
  recruiting_notes TEXT
)
```

### **Venues Table**
```sql
venues (
  venue_id INTEGER PRIMARY KEY,        -- Generated: school_id + venue_type
  name VARCHAR NOT NULL,               -- Venue name
  city VARCHAR,
  state VARCHAR,
  capacity INTEGER,
  team_id INTEGER REFERENCES teams(team_id)
)
```

---

## 🏗 **Microservices Schemas**

### **1. Team Availability Service**
**Schema:** `team_availability`
**Tables:**
- `team_scheduling_profiles` - Core scheduling preferences
- `team_rest_requirements` - Rest and recovery requirements  
- `team_travel_constraints` - Travel limitations
- `team_availability_windows` - Available time periods
- `team_blackout_dates` - Unavailable periods
- `team_availability_preferences` - Detailed preferences

### **2. Venue Management Service**
**Schema:** `venue_management`
**Tables:**
- `venue_profiles` - Enhanced venue information
- `venue_operational_hours` - Operating schedules
- `venue_sport_configurations` - Sport-specific setups
- `venue_unavailability_periods` - Maintenance/booking conflicts
- `venue_capacity_configurations` - Capacity variations
- `venue_equipment_inventory` - Equipment tracking

### **3. Constraint Validation Service**
**Schema:** `constraint_validation`
**Tables:**
- `constraint_definitions` - Constraint templates
- `constraint_instances` - Active constraints
- `constraint_violations` - Violation tracking
- `constraint_resolution_history` - Resolution logs

### **4. Schedule Generation Service**
**Schema:** `schedule_generation`
**Tables:**
- `schedule_requests` - Generation requests
- `schedule_generations` - Generated schedules
- `schedule_evaluations` - Quality metrics
- `schedule_optimizations` - Optimization history

---

## 🏟 **Sport & Venue Mappings**

### **Venue Type by Sport**
```javascript
const SPORT_TO_VENUE_MAP = {
  1: 3,   // Baseball → Baseball Complex
  2: 2,   // Men's Basketball → Arena
  3: 2,   // Women's Basketball → Arena  
  4: 6,   // Beach Volleyball → Volleyball Facility
  5: 8,   // Men's Cross Country → Track & Field
  6: 8,   // Women's Cross Country → Track & Field
  7: 2,   // Equestrian → Arena (special events)
  8: 1,   // Football → Football Stadium
  9: 10,  // Men's Golf → Golf Course
  10: 10, // Women's Golf → Golf Course
  11: 2,  // Gymnastics → Arena
  12: 5,  // Lacrosse → Soccer Field (shared)
  13: 9,  // Rowing → Swimming Pool (training)
  14: 5,  // Soccer → Soccer Field
  15: 4,  // Softball → Softball Complex
  16: 9,  // Men's Swimming → Swimming Pool
  17: 9,  // Women's Swimming → Swimming Pool
  18: 7,  // Men's Tennis → Tennis Complex
  19: 7,  // Women's Tennis → Tennis Complex
  20: 8,  // Men's Indoor Track → Track & Field
  21: 8,  // Women's Indoor Track → Track & Field
  22: 8,  // Men's Outdoor Track → Track & Field
  23: 8,  // Women's Outdoor Track → Track & Field
  24: 6,  // Volleyball → Volleyball Facility
  25: 2   // Wrestling → Arena
};
```

### **Big 12 School IDs**
| School | ID | Football Team ID | Arena ID |
|--------|----|------------------|----------|
| Arizona | 1 | 108 (0101) | 0102 |
| Arizona State | 2 | 208 (0201) | 0202 |
| Baylor | 3 | 308 (0301) | 0302 |
| BYU | 4 | 408 (0401) | 0402 |
| UCF | 5 | 508 (0501) | 0502 |
| Cincinnati | 6 | 608 (0601) | 0602 |
| Colorado | 7 | 708 (0701) | 0702 |
| Houston | 8 | 808 (0801) | 0802 |
| Iowa State | 9 | 908 (0901) | 0902 |
| Kansas | 10 | 1008 (1001) | 1002 |
| Kansas State | 11 | 1108 (1101) | 1102 |
| Oklahoma State | 12 | 1208 (1201) | 1202 |
| TCU | 13 | 1308 (1301) | 1302 |
| Texas Tech | 14 | 1408 (1401) | 1402 |
| Utah | 15 | 1508 (1501) | 1502 |
| West Virginia | 16 | 1608 (1601) | 1602 |

---

## 📁 **Schema Files Reference**

### **Core Schemas**
- `/backend/db/schemas/team-availability-service.sql`
- `/backend/db/schemas/venue-management-service.sql` 
- `/backend/db/schemas/constraint-validation-service.sql`
- `/backend/db/schemas/schedule-generation-service.sql`

### **Migration Files**
- `/backend/db/migrations/001_create_microservice_schemas.sql`
- `/backend/db/migrations/002_migrate_team_availability_service.sql`

### **Model Files**
- `/backend/models/db-school.js` - School model
- `/backend/models/db-sport.js` - Sport model  
- `/backend/models/db-team.js` - Team model with helper functions
- `/backend/models/db-venue.js` - Venue model with ID generation
- `/backend/models/venue-id-helpers.js` - Venue ID utilities

### **SQL Data Files**
- `/backend/src/ai/add-football-teams.sql` - Big 12 football teams
- `/backend/src/ai/add-football-venues.sql` - Big 12 football stadiums

### **Documentation**
- `/migration/database-schema/docs/migration-guide.md` - **COMPREHENSIVE MIGRATION GUIDE**
- `/migration/constraint-catalog.md` - Constraint documentation
- `/backend/docs/FlexTime Scheduling - Detailed Functional Specification.md` - Entity specifications
- `/backend/src/constraints/v2/IMPLEMENTATION_SUMMARY.md` - Constraint system v2

---

## 🔧 **Helper Functions**

### **JavaScript Model Helpers**
```javascript
// Team ID calculation
Team.calculateTeamId(schoolId, sportId)
Team.parseTeamId(teamId) // Returns {schoolId, sportId}

// Venue ID calculation  
Venue.generateVenueId(schoolId, venueType)
Venue.parseVenueId(venueId) // Returns {schoolId, venueType}
Venue.getVenueId(schoolId, venueType)

// Sport to venue mapping
mapSportToVenueType(sportId) // Returns venue type for sport
```

### **SQL Helper Examples**
```sql
-- Get team ID for Arizona Football
SELECT 1::text || LPAD(8::text, 2, '0')::integer; -- Returns 108

-- Get venue ID for Arizona Football Stadium  
SELECT 1::text || LPAD(1::text, 2, '0')::integer; -- Returns 0101

-- Get all venues for a school
SELECT * FROM venues WHERE venue_id::text LIKE '01%'; -- Arizona venues
```

---

## 📚 **Additional Resources**

- **Master Playbook**: `/docs/FlexTime_Playbook.md`
- **API Documentation**: `/backend/docs/`
- **Constraint System**: `/backend/src/constraints/v2/`
- **Intelligence Engine**: `/backend/src/ai/intelligence_engine/`

---

*Last Updated: December 2024*  
*Schema Version: 2.0*