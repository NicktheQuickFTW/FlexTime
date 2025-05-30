# Constraint Management Components

This directory contains React components for managing scheduling constraints in the FlexTime application.

## Components

### ConstraintManager
The main constraint management UI component that orchestrates all constraint-related operations.

**Features:**
- Tab-based navigation between different constraint management views
- Quick stats overview (total constraints, high priority count)
- Speed dial for quick actions
- Error and success notifications

**Usage:**
```tsx
import { ConstraintManager } from '@/components/constraints';

<ConstraintManager />
```

### ConstraintList
Displays all constraints in a filterable, sortable table with expandable rows for details.

**Features:**
- Search and filter by type, category, and priority
- Expandable rows showing detailed parameters
- Statistics cards showing constraint distribution
- Pagination support

**Props:**
- `constraints`: Array of Constraint objects
- `onEdit`: Callback when edit button is clicked
- `onDelete`: Callback when delete button is clicked
- `scheduleId`: ID of the current schedule

### ConstraintEditor
Create and edit constraints with a step-by-step wizard interface.

**Features:**
- Guided constraint creation with 4 steps
- Dynamic form fields based on constraint type
- Parameter validation
- Team selection
- Priority slider
- Review before saving

**Props:**
- `constraint`: Existing constraint to edit (null for new)
- `scheduleId`: ID of the current schedule
- `onSave`: Callback with constraint data
- `onCancel`: Callback to cancel editing

### ConflictResolver
Interactive conflict detection and resolution interface.

**Features:**
- Automatic conflict detection between constraints
- Severity-based conflict categorization
- Multiple resolution options with confidence scores
- Auto-resolution for simple conflicts
- Manual resolution with notes

**Props:**
- `scheduleId`: ID of the current schedule
- `constraints`: Array of constraints to analyze
- `onResolve`: Callback when conflict is resolved

### ConstraintMonitor
Real-time monitoring dashboard for constraint satisfaction.

**Features:**
- Performance metrics and scores
- Trend charts showing satisfaction over time
- Category and priority distribution
- Constraint type radar chart
- Detailed status table
- Auto-refresh every 30 seconds

**Props:**
- `scheduleId`: ID of the current schedule
- `constraints`: Array of constraints to monitor

## Constraint Types

The system supports the following constraint types:

1. **RestDays**: Minimum/maximum days between games
2. **MaxConsecutiveAway**: Limit consecutive away games
3. **MaxConsecutiveHome**: Limit consecutive home games
4. **VenueUnavailability**: Mark venue unavailable dates
5. **TeamUnavailability**: Mark team unavailable dates
6. **RequiredMatchup**: Ensure specific teams play
7. **AvoidBackToBack**: Prevent consecutive day games

## Constraint Categories

- **Team**: Constraints affecting specific teams
- **Venue**: Constraints related to venue availability
- **Schedule**: General scheduling constraints

## Priority Levels

- **High (8-10)**: Critical constraints that must be satisfied
- **Medium (5-7)**: Important but flexible constraints
- **Low (1-4)**: Nice-to-have constraints

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