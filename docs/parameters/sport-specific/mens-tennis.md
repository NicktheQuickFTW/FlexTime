# Men's Tennis Scheduling Constraints

## Overview
Big 12 Men's Tennis features 9 teams in a full round-robin format with a hybrid travel partner model.

## Participating Teams
Only 9 Big 12 schools sponsor men's tennis:
- Arizona
- Arizona State  
- Baylor
- BYU
- Oklahoma State
- TCU
- Texas Tech
- UCF
- Utah

## Core Constraints

### 1. Full Round-Robin Format
- **Type**: Hard constraint
- **Description**: Each team plays all other teams exactly once
- **Implementation**: 36 total matches (C(9,2) = 36)
- **Coverage**: 100% - all teams play each other

### 2. Total Matches Per Team
- **Type**: Hard constraint
- **Number**: 8 matches per team
- **Season**: Late February to early April
- **Conference Play**: 7 weeks total

### 3. Home/Away Balance
- **Type**: Hard constraint
- **Pattern**: 4H/4A (perfect balance)
- **Reason**: Even number of games (8 total) allows perfect balance
- **Consistency**: All teams have identical home/away split

### 4. Weekend Match Limits
- **Type**: Hard constraint
- **Maximum**: 2 matches per weekend (Thursday-Sunday)
- **Enforcement**: Strict for all teams
- **Purpose**: Prevent player fatigue and academic conflicts

### 5. Hybrid Travel Partner Model
- **Type**: Soft constraint (preference)
- **Paired Teams**:
  - Arizona ↔ Arizona State
  - BYU ↔ Utah
  - Baylor ↔ TCU
  - Oklahoma State ↔ Texas Tech
  - UCF (floater - no fixed partner)
- **Implementation**: Partners prefer to travel together when feasible
- **Home/Away**: Partners alternate hosting year-to-year

### 6. Consecutive Games Limits
- **Type**: Soft constraint
- **Away Games**: Maximum 3 consecutive away matches
- **Home Games**: Maximum 3 consecutive home matches
- **Preferred**: No more than 2 consecutive in either direction

### 7. Day of Week Preference
- **Type**: Soft constraint
- **Allowed**: Thursday through Sunday
- **Current Default**: Friday/Sunday matches
- **BYU/Utah**: Thursday/Saturday matches
- **Potential 2026 Change**: All teams may move to Thursday/Saturday
- **Typical Times**: Afternoon matches (2:00 PM - 6:00 PM)
- **BYU Exception**: No Sunday matches
- **Easter Exception**: No matches on Easter Sunday

### 8. Avoid Gender Doubleheaders
- **Type**: Soft constraint
- **Description**: Minimize schools hosting both men's and women's tennis on same weekend
- **Scope**: Thursday through Sunday
- **Purpose**: Facility management, staff resources, and fan experience
- **Weight**: 0.7 (moderate priority)
- **Implementation**: Coordinate with women's tennis schedule to avoid conflicts

### 9. Split Weekend Management
- **Type**: Soft constraint (often unavoidable)
- **Description**: Minimize weekends with both home and away matches
- **Reality**: 8 matches in 5 weeks makes split weekends unavoidable
- **When Split Occurs**: Schedule Thursday/Sunday (not Thu/Sat or Fri/Sun)
- **Purpose**: Maximize recovery time between matches

### 10. Week 1 Conflicts
- **Type**: Hard constraint (2025-2026)
- **Affected Teams**: Baylor and Arizona State
- **Years**: 2025 and 2026 only
- **Resolution**: Normal scheduling resumes in 2027
- **Implementation**: These teams cannot play conference matches in week 1

## Schedule Pattern Analysis

### Format Characteristics
- **Full Round-Robin**: 100% coverage (all 36 possible matchups)
- **Smaller Field**: 9 teams vs 16 in women's tennis
- **Perfect Balance**: 4H/4A for all teams
- **UCF Flexibility**: As floater, can fill scheduling gaps

### Travel Efficiency
- **Partner Travel**: 4 fixed pairs travel together
- **Regional Grouping**: Partners are geographically proximate
- **UCF Advantage**: Flexible scheduling without partner constraints

## Implementation Notes

1. **Schedule Density**: Multiple matches per week allowed within limits
2. **Travel Optimization**: Partner teams coordinate travel plans
3. **Weather Considerations**: Indoor/outdoor venue availability
4. **Academic Calendar**: Avoid spring break periods
5. **BYU Scheduling**: Must avoid Sunday matches

## Example Weekly Pattern

```
Week 1: 
- Thu: Arizona @ Arizona State, BYU @ Utah
- Fri: Baylor @ TCU, Oklahoma State @ Texas Tech
- Sat: UCF @ Arizona, Arizona State @ BYU

Week 2:
- Fri: Utah @ Baylor, TCU @ Oklahoma State  
- Sat: Texas Tech @ UCF, Arizona @ BYU
```

## Key Differences from Women's Tennis

1. **Team Count**: 9 teams vs 16 teams
2. **Round-Robin**: Full (100%) vs Near (87%)
3. **Matches**: 8 per team vs 13 per team
4. **Balance**: Perfect 4H/4A vs 7H/6A or 6H/7A
5. **UCF Status**: Floater in men's vs regular partner in women's

## Scheduling Priorities

1. Honor travel partnerships when possible
2. Respect weekend match limits strictly
3. Maintain perfect home/away balance
4. Accommodate BYU Sunday restriction
5. Utilize UCF flexibility for difficult scheduling scenarios