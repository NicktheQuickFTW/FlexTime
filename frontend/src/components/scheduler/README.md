# Scheduler Components

This directory contains components related to the drag-and-drop scheduling interface for the FlexTime system.

## Components

### GameCard

A draggable card component that represents a single game in the scheduling interface.

**Features:**
- Drag and drop functionality using react-dnd
- Team colors and logos
- Conflict indicators
- AI optimization status
- Responsive design
- Accessibility support

**Props:**
- `game`: Game object containing team and scheduling information
- `onUpdate`: Callback function for game updates
- `conflicts`: Array of constraint conflicts
- `isOptimized`: Boolean indicating if the game is AI-optimized
- `isSelected`: Boolean for selection state
- `onClick`: Click handler
- `onEdit`: Edit handler

**Dependencies Required:**
```bash
npm install react-dnd react-dnd-html5-backend framer-motion @mui/material @mui/icons-material
```

## Usage Example

```tsx
import { GameCard } from '../scheduler';

const MyScheduler = () => {
  const handleGameUpdate = async (gameId: string, updates: Partial<Game>) => {
    // Handle game updates
  };

  return (
    <GameCard
      game={gameData}
      onUpdate={handleGameUpdate}
      conflicts={gameConflicts}
      isOptimized={true}
    />
  );
};
```

## Styling

The component uses a combination of:
- Material-UI theming
- Custom CSS classes with `ft-game-card` prefix
- CSS custom properties for team colors
- Framer Motion for animations

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- High contrast mode support
- Reduced motion preferences respected
- Screen reader friendly

## Team Colors

Team colors are automatically applied based on Big 12 Conference team branding guidelines. The component includes a built-in color mapping for all 16 Big 12 schools.