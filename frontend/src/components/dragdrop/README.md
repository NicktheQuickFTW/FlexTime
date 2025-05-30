# FlexTime Drag & Drop System

A comprehensive drag & drop system with real-time conflict detection for the FlexTime scheduling platform.

## Features

- **Real-time Conflict Detection**: Automatically detects scheduling conflicts as items are dragged
- **Multiple Item Types**: Support for games, teams, dates, and constraints
- **Flexible Drop Targets**: Matrix cells, planners, constraint zones, and trash areas
- **Conflict Severity Levels**: Low, medium, high, and critical conflict classification
- **Auto-resolution Suggestions**: Intelligent recommendations for conflict resolution
- **Debounced Validation**: Performance-optimized conflict checking
- **Visual Feedback**: Immediate visual indicators for conflicts and valid drop zones
- **Customizable Styling**: Theme-aware components with Material-UI integration

## Core Components

### `DragDropProvider`
The main context provider that wraps your application and manages drag & drop state.

```tsx
import { DragDropProvider } from './components/dragdrop';

<DragDropProvider
  onDrop={handleDrop}
  onConflictDetected={handleConflictDetected}
  constraints={constraints}
  scheduleData={scheduleData}
  enableRealTimeValidation={true}
>
  {/* Your app components */}
</DragDropProvider>
```

### `useDragItem`
Hook for making components draggable.

```tsx
import { useDragItem, DragItem } from './components/dragdrop';

const DraggableGame = ({ game }) => {
  const dragItem: DragItem = {
    id: `game-${game.id}`,
    type: 'game',
    data: game
  };
  
  const { dragProps, isDragging } = useDragItem(dragItem);
  
  return <div {...dragProps}>Game Component</div>;
};
```

### `useDropTarget`
Hook for creating drop zones.

```tsx
import { useDropTarget, DropTarget } from './components/dragdrop';

const MatrixCell = ({ row, col, date }) => {
  const dropTarget: DropTarget = {
    id: `cell-${row}-${col}`,
    type: 'matrix-cell',
    position: { row, col },
    accepts: ['game', 'team'],
    metadata: { date }
  };
  
  const { dropProps, canDrop, hasConflicts } = useDropTarget(dropTarget);
  
  return <div {...dropProps}>Drop Zone</div>;
};
```

## Conflict Detection

### Supported Conflict Types

1. **Rest Days**: Insufficient time between games for the same team
2. **Venue Unavailability**: Venue is not available on the selected date
3. **Team Unavailability**: Team already has a game scheduled
4. **Consecutive Games**: Too many consecutive home/away games
5. **Travel Burden**: Excessive travel requirements
6. **Resource Conflicts**: Capacity or equipment conflicts

### Conflict Severity Levels

- **Critical**: Must be resolved before proceeding
- **High**: Strongly recommended to resolve
- **Medium**: Should be reviewed and potentially resolved
- **Low**: Minor issues that may be acceptable

### Example Conflict Detection

```tsx
const handleConflictDetected = (conflicts: Conflict[]) => {
  conflicts.forEach(conflict => {
    console.log(`${conflict.severity}: ${conflict.message}`);
    if (conflict.autoResolvable) {
      console.log(`Suggestion: ${conflict.suggestedResolution}`);
    }
  });
};
```

## Data Types

### DragItem
```tsx
interface DragItem {
  id: string;
  type: 'game' | 'team' | 'date' | 'constraint';
  data: Game | Team | string | any;
  metadata?: {
    originalPosition?: { row: number; col: number };
    source?: string;
    [key: string]: any;
  };
}
```

### DropTarget
```tsx
interface DropTarget {
  id: string;
  type: 'matrix-cell' | 'planner' | 'constraint-zone' | 'trash';
  position?: { row: number; col: number };
  accepts: string[];
  data?: any;
  metadata?: {
    date?: string;
    venue?: Venue;
    homeTeam?: Team;
    awayTeam?: Team;
    [key: string]: any;
  };
}
```

### Conflict
```tsx
interface Conflict {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'rest-days' | 'venue-unavailable' | 'team-unavailable' | 'consecutive-games' | 'travel-burden' | 'resource-conflict';
  message: string;
  details: string;
  affectedItems: string[];
  suggestedResolution?: string;
  autoResolvable: boolean;
  timestamp: number;
}
```

## Usage Examples

### Basic Schedule Matrix

```tsx
import { DragDropProvider, useDragItem, useDropTarget } from './components/dragdrop';

const ScheduleMatrix = () => {
  const handleDrop = async (item, target) => {
    // Handle the drop operation
    console.log('Dropped', item, 'onto', target);
  };

  const handleConflictDetected = (conflicts) => {
    // Handle detected conflicts
    console.log('Conflicts:', conflicts);
  };

  return (
    <DragDropProvider 
      onDrop={handleDrop}
      onConflictDetected={handleConflictDetected}
    >
      <ScheduleGrid />
      <GamePlanner />
    </DragDropProvider>
  );
};
```

### Custom Conflict Detection

```tsx
const customConflictDetection = async (item, target) => {
  const conflicts = [];
  
  // Custom business logic
  if (item.type === 'game' && target.type === 'matrix-cell') {
    const game = item.data;
    const targetDate = target.metadata.date;
    
    // Check custom constraints
    if (isBlackoutDate(targetDate)) {
      conflicts.push({
        id: 'blackout-date',
        severity: 'critical',
        type: 'venue-unavailable',
        message: 'Date is during blackout period',
        details: 'This date falls within a conference blackout period',
        affectedItems: [game.id],
        autoResolvable: false,
        timestamp: Date.now()
      });
    }
  }
  
  return conflicts;
};
```

## Performance Considerations

- **Debouncing**: Conflict detection is debounced (150ms) to prevent excessive API calls
- **Memoization**: Conflict results are cached based on item-target combinations
- **Lazy Evaluation**: Conflicts are only checked when items are actively being dragged
- **Batch Processing**: Multiple conflicts are processed together for efficiency

## Integration with FlexTime

The drag & drop system integrates seamlessly with existing FlexTime components:

- **Schedule Matrix**: Enhanced interactive matrix with drag & drop support
- **Constraint System**: Real-time validation against defined constraints
- **Team Management**: Drag teams between different scheduling contexts
- **Venue Management**: Validate venue availability during drag operations

## Styling and Theming

The system respects FlexTime's design system:

- Uses Material-UI components and theme
- Follows the glassmorphic design patterns
- Maintains consistent color scheme and spacing
- Supports dark/light theme switching

## Testing

```tsx
import { render, fireEvent } from '@testing-library/react';
import { DragDropProvider } from './components/dragdrop';

test('drag and drop functionality', () => {
  const onDrop = jest.fn();
  const onConflictDetected = jest.fn();
  
  render(
    <DragDropProvider onDrop={onDrop} onConflictDetected={onConflictDetected}>
      <DraggableItem />
      <DropZone />
    </DragDropProvider>
  );
  
  // Test drag and drop interactions
});
```

## Future Enhancements

- **Multi-select Dragging**: Support for dragging multiple items simultaneously
- **Undo/Redo**: Track operations for undo/redo functionality
- **Advanced Animations**: Enhanced visual feedback during drag operations
- **Touch Support**: Mobile-optimized drag and drop interactions
- **Keyboard Navigation**: Accessibility improvements for keyboard users

## Troubleshooting

### Common Issues

1. **Conflicts not detecting**: Ensure `enableRealTimeValidation` is true
2. **Performance issues**: Check if debouncing is properly configured
3. **Styling conflicts**: Verify Material-UI theme integration
4. **Drop not working**: Ensure target `accepts` array includes the dragged item type

### Debug Mode

Enable debug logging:

```tsx
<DragDropProvider
  onDrop={handleDrop}
  onConflictDetected={handleConflictDetected}
  enableRealTimeValidation={true}
  debugMode={true} // Enable debug logging
>
```