# FlexTime UI

The modern, responsive frontend user interface for the FlexTime scheduling platform, part of the HELiiX ecosystem.

## Overview

This repository contains the frontend React application for FlexTime, an advanced sports scheduling system. The FlexTime UI provides an intuitive interface for users to create, manage, and visualize schedules created and optimized by the FlexTime backend services.

> **Note:** This README covers only the frontend UI components. For complete FlexTime documentation including backend services, see:
>
> - [FlexTime Complete Guide](https://github.com/your-org/heliix-core-platform/blob/main/src/FlexTime/README.md)
> - [FlexTime Backend Documentation](https://github.com/your-org/heliix-intelligence-engine/blob/main/src/flextime/README.md)

## Frontend Features

- **Interactive Schedule Matrix**: Drag-and-drop interface for manual schedule adjustments
- **Dashboard**: Overview of active schedules, teams, venues, and optimization metrics
- **Schedule Management**: Create, edit, view, and delete schedules
- **Team Management**: Add, edit, and remove teams from schedules
- **Venue Management**: Manage venue availability and assignments
- **Constraint Configuration**: Set and prioritize scheduling constraints
- **Schedule Visualization**: Multiple views (matrix, calendar, list) of generated schedules
- **Feedback System**: Collect and process user feedback on generated schedules
- **Model Context Protocol Integration**: Connection to the Model Context Protocol for AI-enhanced scheduling

## Frontend Technical Stack

- **Framework**: React 18 with TypeScript
- **UI Library**: Material UI (MUI v5)
- **State Management**: React Context API
- **Routing**: React Router v6
- **API Communication**: Axios
- **Data Visualization**: Recharts
- **Form Validation**: React Hook Form
- **Notifications**: Notistack

## Frontend Architecture

The FlexTime UI is structured as follows:

```typescript
FlexTime-ui/
├── public/                # Static assets
├── src/
│   ├── assets/            # Images, icons, and CSS
│   ├── components/        # Reusable UI components
│   │   ├── feedback/      # Feedback collection components
│   │   ├── mcp/           # Model Context Protocol integration components
│   │   ├── schedule/      # Schedule-related components
│   │   └── shared/        # Shared UI elements
│   ├── contexts/          # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Page layout components
│   ├── pages/             # Main application pages
│   ├── services/          # API services and utilities
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Helper functions
│   ├── App.tsx            # Main application component
│   └── index.tsx          # Application entry point
└── package.json           # Dependencies and scripts
```

## Model Context Protocol (MCP) Architecture

The UI connects to the following MCP services as defined in the HELiiX platform architecture:

1. **Primary MCP**: Claude (for scheduling intelligence)
2. **Secondary MCP**: MongoDB (for persistent storage)
3. **Knowledge Base**: Context7 (used by Windsurf and Intelligence Engine)

This aligned architecture ensures that FlexTime leverages the most appropriate AI capabilities for each task, with Claude's advanced reasoning for scheduling intelligence and MongoDB providing reliable persistent storage.

## Frontend Integration Points

The UI connects to the following backend services:

1. **FlexTime API**: RESTful endpoints for schedule data (teams, venues, games)
2. **Intelligence Engine**: Centralized service for AI capabilities and memory management
3. **Feedback Service**: For submitting and retrieving user feedback
4. **Model Context Protocol Services**: AI capabilities through defined protocols

## Docker Integration

The FlexTime UI is built and served within the FlexTime Docker container. Key aspects of this integration:

1. **Build Process**: The UI is built during Docker image creation
2. **Serving**: The compiled UI is served from `/app/src/FlexTime/dist` directory
3. **Configuration**: Environment variables are injected through Docker
4. **Access**: The UI is accessible at [http://localhost:3004/](http://localhost:3004/) when running in Docker

## Frontend Implementation Plan

### Phase 1: Core UI Development (Completed)

- Basic application structure and routing
- Dashboard implementation
- Schedule listing and detail views
- Team and venue management interfaces

### Phase 2: Interactive Features (Completed)

- Interactive matrix visualization
- Schedule editing capabilities
- Constraint configuration interface
- Basic feedback collection

### Phase 3: Intelligence Integration (Current)

- Model Context Protocol integration
- Optimization request handling
- Schedule metrics visualization
- Advanced feedback analysis

### Phase 4: Enhanced Visualization (Upcoming)

- Calendar view improvements
- Travel distance visualization
- Constraint satisfaction reports
- Comparative schedule analysis

### Phase 5: Mobile Optimization (Planned)

- Responsive design for mobile devices
- Touch-optimized interactions
- Offline capabilities
- Progressive Web App (PWA) implementation

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Prerequisites

- Node.js (v14+)
- npm or yarn
- FlexTime backend services running (see backend documentation)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/heliix-core-platform.git

# Navigate to the FlexTime UI directory
cd heliix-core-platform/frontend/FlexTime-ui

# Install dependencies
npm install

# Start the development server
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
REACT_APP_API_URL=http://localhost:3004/api
REACT_APP_CLAUDE_MCP_URL=http://localhost:9002/api
REACT_APP_MONGODB_MCP_URL=http://localhost:9001/api
REACT_APP_NEON_MCP_URL=http://localhost:9004/api
REACT_APP_CONTEXT7_KNOWLEDGE_BASE_URL=http://localhost:9000/api
```

### Docker Development

When working with the Docker configuration:

```bash
# Build and start all services
docker-compose up -d

# Access the UI
# Open http://localhost:3004 in your browser
```

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

## Contributing

Please follow the HELiiX platform contribution guidelines when making changes to this project.

## License

This project is licensed under the proprietary license - see the LICENSE file for details.

## Related Documentation

- [HELiiX Platform Documentation](https://github.com/your-org/heliix-docs/blob/main/README.md)
- [FlexTime API Documentation](https://github.com/your-org/heliix-intelligence-engine/blob/main/src/flextime/README.md)
- [HELiiX Integration Guide](https://github.com/your-org/heliix-integration-layer/blob/main/README.md)
