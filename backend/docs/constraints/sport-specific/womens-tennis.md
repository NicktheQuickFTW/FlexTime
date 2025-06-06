# Women's Tennis Scheduling Constraints

## Overview
Big 12 Women's Tennis follows a near round-robin format with all 16 Big 12 members participating (no affiliate teams).

## Core Constraints

### 1. Near Round-Robin Format
- **Type**: Hard constraint
- **Description**: Teams play approximately 86.7% of possible matchups
- **Implementation**: 104 matches out of 120 possible (C(16,2) = 120)
- **Coverage**: Each team plays 13 of 15 possible opponents

### 2. Total Matches Per Team
- **Type**: Hard constraint
- **Number**: 13 matches per team
- **Season**: Late February to early April
- **Conference Play**: 7 weeks total

### 3. Home/Away Balance
- **Type**: Hard constraint
- **Pattern**: 7H/6A or 6H/7A (alternates by team)
- **Reason**: Odd number of games (13 total) means offset by 1
- **Distribution**: Half teams get 7H/6A, half get 6H/7A
- **Travel Partner Rotation**: Travel partners rotate home/away hosting yearly

### 4. Consecutive Games Limits
- **Type**: Soft constraint
- **Away Games**: Maximum 4 consecutive away matches
- **Home Games**: Maximum 4 consecutive home matches
- **Preferred**: No more than 3 consecutive in either direction

### 5. Weekend Match Limits
- **Type**: Hard constraint for specific teams
- **Description**: Maximum 2 matches per weekend (Thursday-Sunday)
- **Critical Teams**: BYU and Utah especially must adhere to this limit
- **Implementation**: Prevents scheduling conflicts and player fatigue

### 6. Day of Week Preference
- **Type**: Soft constraint
- **Allowed**: Thursday through Sunday
- **Current Default**: Friday/Sunday matches
- **BYU/Utah**: Thursday/Saturday matches
- **Potential 2026 Change**: All teams may move to Thursday/Saturday
- **Typical Times**: Afternoon matches (2:00 PM - 6:00 PM)
- **BYU Exception**: Cannot play on Sunday
- **Easter Exception**: No matches on Easter Sunday

## Travel Partnerships and Pods

### 7. Travel Partner System
- **Type**: Hard constraint
- **Description**: Teams travel together with specific weekend patterns
- **Travel Partners**:
  - Arizona & Arizona State
  - BYU & Utah (altitude pair)
  - Colorado & Texas Tech (altitude pair)
  - Baylor & TCU
  - UCF & Houston
  - Cincinnati & West Virginia
  - Iowa State & Kansas
  - Kansas State & Oklahoma State

#### Travel Partner Weekend Structure:
- **2 Home-Home Weekends**: Partners host other partner pairs together
- **2 Away-Away Weekends**: Partners travel to other partner pairs together
- **1 Single Play Weekend**: Partners play each other only (Saturday match)

### 8. Pod System
- **Type**: Hard constraint
- **Description**: Teams must play all teams within their pod
- **Pods**:
  - **Pod 1**: Arizona, Arizona State, BYU, Utah
  - **Pod 2**: Colorado, Texas Tech, Baylor, TCU
  - **Pod 3**: UCF, Houston, Cincinnati, West Virginia
  - **Pod 4**: Iowa State, Kansas, Kansas State, Oklahoma State

### 9. Altitude Considerations
- **Type**: Soft constraint (Hard for rotation schedule)
- **Altitude Teams**: BYU, Utah, Colorado
- **Altitude Pairs**: 
  - BYU & Utah
  - Colorado & Texas Tech
- **Primary Constraint**: Teams should avoid playing both altitude pairs in same season
- **Rotation Schedule**: Non-altitude pairs must travel to altitude once every 4 years:
  - 2025: Iowa State & Kansas
  - 2026: Oklahoma State & Kansas State
  - 2027: Arizona & Arizona State
  - 2028: Baylor & TCU
  - 2029: UCF & Houston
  - 2030: Cincinnati & West Virginia

### 10. Avoid Gender Doubleheaders
- **Type**: Soft constraint
- **Description**: Minimize schools hosting both men's and women's tennis on same weekend
- **Scope**: Thursday through Sunday
- **Purpose**: Facility management, staff resources, and fan experience
- **Weight**: 0.7 (moderate priority)
- **Implementation**: Coordinate with men's tennis schedule to avoid conflicts

## Schedule Pattern Analysis

### Match Distribution
- **Total Matches**: 104 (out of 120 possible)
- **Weekly Pattern**: Varies from 0-6 matches per week
- **Season Length**: 28 total weeks with matches spread across 7 conference weeks

### Format Characteristics
- **Near Round-Robin**: ~87% coverage of all possible matchups
- **No Affiliate Teams**: All 16 participants are Big 12 members
- **Balanced Schedule**: All teams play exactly 13 matches
- **Format Stability**: Consistent format between 2025-2026 seasons
- **Pod Coverage**: All teams must play their 3 pod opponents (3 of 13 matches)

## Implementation Notes

1. **Schedule Density**: Multiple matches per week allows compact scheduling
2. **Travel Optimization**: Weekend clusters (Thu-Sun) minimize travel
3. **Weather Considerations**: Indoor/outdoor venue availability in early spring
4. **Academic Calendar**: Avoid spring break periods

## Example Weekly Pattern

```
Week 1: Thu-Sun matches (varying number per day)
Week 2: Thu-Sun matches (teams may play 2-3 times)
...
Week 7: Thu-Sun matches (conference schedule concludes)
```

## Travel Partner Weekend Examples

### Home-Home Weekend
```
Friday:   Arizona vs Iowa State, Arizona State vs Kansas
Saturday: Arizona vs Kansas, Arizona State vs Iowa State
(Arizona/ASU host Iowa State/Kansas together)
```

### Away-Away Weekend  
```
Friday:   Baylor vs BYU, TCU vs Utah
Saturday: Baylor vs Utah, TCU vs BYU
(Baylor/TCU travel to BYU/Utah together)
```

### Single Play Weekend
```
Saturday: Arizona vs Arizona State (only match that weekend)
(Travel partners play each other exclusively)
```

## Key Differences from Other Sports

1. **Not Full Round-Robin**: Unlike gymnastics (100%), tennis is ~87%
2. **Multiple Weekly Matches**: Unlike basketball/football (1 per week)
3. **Odd Game Count**: Creates 7/6 or 6/7 home/away split
4. **No Bye Weeks**: All teams active throughout conference season
5. **Compressed Schedule**: 13 matches in 7 weeks vs spread across full season

## Format History

### 2025-2026 Comparison
- **No Format Change**: Both years feature identical structure
- **Consistent Coverage**: 86.7% (104 of 120 matchups) in both years
- **Same Match Count**: 13 matches per team
- **Home/Away Patterns**: Teams alternate between 7H/6A and 6H/7A year-to-year
- **Consecutive Limits**: Maximum 4 consecutive home or away matches maintained