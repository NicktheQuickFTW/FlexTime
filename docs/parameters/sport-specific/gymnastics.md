# Gymnastics Scheduling Constraints

## Overview
Big 12 Gymnastics follows a full round-robin format with 7 teams (6 Big 12 + 1 affiliate).

## Core Constraints

### 1. Full Round-Robin Format
- **Type**: Hard constraint
- **Description**: Each team must meet all other teams exactly once
- **Implementation**: Generate all C(7,2) = 21 matchups

### 2. Home/Away Balance
- **Type**: Hard constraint  
- **Pattern**: 3 home, 3 away (consistent for all teams)
- **Reason**: Even number of games (6 total) means perfect balance
- **Venue Rotation**: Home/away venues flip year-to-year for same matchups

### 3. Bye Week Distribution
- **Type**: Hard constraint
- **Description**: Each team must have exactly 1 bye week
- **Season Length**: 7 weeks total (standardized in 2026)
- **Format Change**: Reduced from 2 byes/8 weeks (2025) to 1 bye/7 weeks (2026+)

### 4. Maximum Games Per Team Per Week
- **Type**: Hard constraint
- **Rule**: Each team plays at most 1 game per week
- **Enforcement**: Strict (no exceptions)
- **Purpose**: Prevents team overload and ensures proper rest

### 5. Day of Week Preference
- **Type**: Soft constraint
- **Preferred**: Friday
- **Allowed**: Friday, Saturday, Sunday
- **Note**: Listed as "Fri*" in schedules (may occur Fri-Sun)

### 6. Affiliate Integration
- **Type**: Hard constraint
- **Teams**: Denver (DEN) is a full member
- **Treatment**: No distinction from Big 12 teams in scheduling

## Schedule Pattern Analysis

### Format Evolution

#### 2025 Season (Old Format)
- **Length**: 8 weeks (mid-January to early March)
- **Bye weeks**: 2 per team
- **Games**: 6 per team (3H/3A)
- **Format**: Full round-robin (21 matchups)
- **Density**: Lower (more bye weeks)

#### 2026+ Season (New Format)
- **Length**: 7 weeks (late January to early March)  
- **Bye weeks**: 1 per team
- **Games**: 6 per team (3H/3A)
- **Format**: Full round-robin (21 matchups)
- **Density**: Higher (fewer bye weeks)

### Key Changes (2025 → 2026)
1. **Season compressed**: 8 weeks → 7 weeks
2. **Bye weeks reduced**: 2 per team → 1 per team  
3. **Schedule density increased**: Same games, fewer weeks
4. **Format standardized**: Fixed 7-week format

## Implementation Notes

1. **Venue Flipping**: Most matchups flip home/away venues between years
2. **Season Start**: Mid to late January
3. **Season End**: Early March
4. **Meet Times**: Typically evening (5-7 PM local)

## Example Schedule Structure

```
Week 1: Multiple meets (each team plays ≤1 game, some teams bye)
Week 2: Multiple meets (each team plays ≤1 game, some teams bye)
...
Week 7: Multiple meets (each team plays ≤1 game, some teams bye)
```

**Key Constraints:**
- Each team plays exactly 1 game per week (when not on bye)
- Each team has exactly 1 bye week (in 7-week format)
- Total: 42 team-meets = 21 unique matchups (full round-robin)

**Weekly Distribution Example:**
- Week 1: Arizona vs ASU, BYU vs Denver, ISU vs Utah (WVU bye)
- Week 2: Arizona vs BYU, ASU vs ISU, Utah vs WVU (Denver bye)
- etc.