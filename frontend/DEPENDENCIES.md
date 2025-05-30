# Frontend Dependencies

This document lists the required dependencies for the FlexTime frontend application.

## Current Dependencies

The following dependencies are already installed (see `package.json`):

- React 18.2.0
- React DOM 18.2.0
- React Router DOM 6.8.2
- Material-UI (implied by usage)

## Additional Dependencies Required

To use the new GameCard component and complete drag-and-drop functionality, install these additional dependencies:

```bash
npm install react-dnd react-dnd-html5-backend framer-motion @mui/material @mui/icons-material
```

### Dependency Details

1. **react-dnd** (^16.0.1): Core drag and drop library
2. **react-dnd-html5-backend** (^16.0.1): HTML5 backend for react-dnd
3. **framer-motion** (^10.0.0): Animation library for React
4. **@mui/material** (^5.0.0): Material-UI core components
5. **@mui/icons-material** (^5.0.0): Material-UI icons

## Installation

```bash
# Install all required dependencies at once
npm install react-dnd react-dnd-html5-backend framer-motion @mui/material @mui/icons-material

# Or install individually
npm install react-dnd
npm install react-dnd-html5-backend
npm install framer-motion
npm install @mui/material
npm install @mui/icons-material
```

## Usage Setup

After installing dependencies, wrap your app with the DragDropProvider:

```tsx
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      {/* Your app components */}
    </DndProvider>
  );
}
```

## Version Compatibility

These versions have been tested to work together:
- React 18.x
- react-dnd 16.x
- framer-motion 10.x
- Material-UI 5.x

## Development Dependencies

For development and testing:

```bash
npm install --save-dev @types/react-dnd
```