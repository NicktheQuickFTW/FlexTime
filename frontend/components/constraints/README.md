# Scheduling Rules Management Components

This directory contains React components for managing scheduling rules in the FlexTime application using the unified Parameters vs Constraints architecture.

## Unified Architecture Overview

FlexTime uses a 4-tier system for scheduling rules:

1. **Parameters** - Business rules (games per team, season structure, travel partners)
2. **Constraints** - Physical/logical restrictions (rest days, travel limits, venue availability) 
3. **Conflicts** - Blackout dates (campus conflicts, graduations, religious observances)
4. **Preferences** - Team desires (preferred game times, home during exams)

## Components

### ConstraintManager
The main scheduling rules management UI component that orchestrates all rule-related operations.

**Features:**
- Tab-based navigation between Parameters, Constraints, Conflicts, and Preferences
- Quick stats overview (total rules by type, violation counts)
- Speed dial for quick actions
- Real-time validation and conflict detection
- Error and success notifications

**Usage:**
```tsx
import { ConstraintManager } from '@/components/constraints';

<ConstraintManager />
```

### ConstraintList
Displays all scheduling rules in a filterable, sortable table organized by rule type.

**Features:**
- Filter by rule type (Parameters, Constraints, Conflicts, Preferences)
- Search and filter by category, priority, and entity
- Expandable rows showing detailed rule definitions
- Statistics cards showing rule distribution and status
- Batch operations support
- Pagination support

**Props:**
- `rules`: Array of scheduling rule objects (parameters, constraints, conflicts, preferences)
- `onEdit`: Callback when edit button is clicked
- `onDelete`: Callback when delete button is clicked
- `scheduleId`: ID of the current schedule
- `ruleType`: Filter for specific rule type

### ConstraintEditor
Create and edit scheduling rules with a step-by-step wizard interface that adapts to rule type.

**Features:**
- Rule type selection (Parameter, Constraint, Conflict, Preference)
- Dynamic form fields based on rule type and category
- Entity selection (sport, school, team, venue)
- Rule definition with JSON schema validation
- Weight/priority assignment
- Real-time validation and preview
- Review before saving

**Props:**
- `rule`: Existing rule to edit (null for new)
- `ruleType`: Type of rule to create/edit
- `scheduleId`: ID of the current schedule
- `onSave`: Callback with rule data
- `onCancel`: Callback to cancel editing

### ConflictResolver
Interactive conflict detection and resolution interface for rule violations.

**Features:**
- Automatic conflict detection between all rule types
- Rule hierarchy resolution (Parameters > Constraints > Conflicts > Preferences)
- Severity-based conflict categorization
- Multiple resolution options with confidence scores
- Auto-resolution for simple conflicts
- Manual resolution with detailed notes
- Impact analysis for proposed changes

**Props:**
- `scheduleId`: ID of the current schedule
- `rules`: Array of all scheduling rules
- `onResolve`: Callback when conflict is resolved

### ConstraintMonitor
Real-time monitoring dashboard for scheduling rule satisfaction and system performance.

**Features:**
- Rule satisfaction metrics by type and category
- Trend charts showing satisfaction over time
- Rule type distribution and priority analysis
- Violation tracking and resolution history
- Performance impact analysis
- Auto-refresh every 30 seconds
- Export capabilities for reporting

**Props:**
- `scheduleId`: ID of the current schedule
- `rules`: Array of all scheduling rules

## Rule Type Definitions

### 1. Parameters (Business Rules)
Configuration that defines how scheduling should work:

- **Season Structure**: `games_per_team`, `conference_games`, `non_conference_games`
- **Home/Away Distribution**: `home_games`, `away_games`, `home_game_distribution`
- **Travel Configuration**: `travel_partners`, `travel_pods`, `geographic_regions`
- **Format Rules**: `series_format`, `weekend_structure`, `bye_weeks`

### 2. Constraints (Physical/Logical Restrictions)
Hard and soft limits that restrict scheduling options:

- **Rest Requirements**: `minimum_rest_days`, `maximum_games_per_week`
- **Travel Limits**: `maximum_travel_distance`, `consecutive_away_limit`
- **Venue Restrictions**: `venue_availability`, `capacity_requirements`
- **Format Constraints**: `back_to_back_prevention`, `doubleheader_limits`

### 3. Conflicts (Blackout Dates)
Specific dates/periods when teams or venues cannot participate:

- **Campus Calendar**: `finals_week`, `graduation_dates`, `spring_break`
- **Religious Observances**: `byu_sunday_restriction`, `religious_holidays`
- **Facility Conflicts**: `venue_maintenance`, `other_events`, `renovations`
- **Academic Restrictions**: `exam_periods`, `class_schedules`

### 4. Preferences (Team Desires)
Soft preferences that improve satisfaction but aren't mandatory:

- **Scheduling Preferences**: `preferred_game_times`, `preferred_days`
- **Home Game Timing**: `home_during_exams`, `rivalry_game_timing`
- **Travel Preferences**: `minimize_long_trips`, `avoid_red_eye_flights`
- **Competition Timing**: `peak_performance_periods`, `avoid_academic_stress`

## Rule Categories

### By Entity Type
- **Sport-Specific**: Rules that apply to specific sports
- **School-Specific**: Rules that apply to specific institutions
- **Team-Specific**: Rules that apply to specific teams
- **Venue-Specific**: Rules that apply to specific facilities
- **Conference-Wide**: Rules that apply to all Big 12 teams

### By Priority/Weight
- **Critical (8-10)**: Hard constraints that must be satisfied
- **Important (5-7)**: Strong preferences with flexibility
- **Moderate (3-4)**: Nice-to-have preferences
- **Low (1-2)**: Minor optimizations

## Integration

These components integrate with the existing FlexTime API through the `ScheduleService`:

```typescript
import { ScheduleService } from '@/services/api';

// Add constraint
await ScheduleService.addConstraint(scheduleId, constraint);

// Delete constraint
await ScheduleService.deleteConstraint(scheduleId, constraintId);
```

## Styling

The components use:
- Material-UI components and theming
- Custom Tailwind CSS classes (see `styles/constraints.css`)
- Recharts for data visualization
- Responsive design for mobile and desktop

## State Management

Currently uses React hooks for local state management. The components are designed to be easily integrated with Redux or other state management solutions if needed in the future.

## Future Enhancements

1. **Machine Learning Integration**: Predict constraint conflicts before they occur
2. **Batch Operations**: Apply constraints to multiple schedules
3. **Templates**: Save and reuse common constraint combinations
4. **Export/Import**: Share constraint configurations
5. **History Tracking**: View constraint modification history
6. **Performance Optimization**: Lazy loading for large constraint sets