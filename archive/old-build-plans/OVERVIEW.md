# FlexTime Application Overview

## What is FlexTime?

FlexTime is a scheduling platform for the Big 12 Conference that helps create optimal sports schedules while respecting various constraints like travel distances, venue availability, and championship dates.

## Application Structure

The application consists of two main components:

1. **Backend**: A Node.js API server that handles scheduling logic
2. **Frontend**: A React-based UI for visualizing and managing schedules

## How to Run the Application

There are two main ways to run the application:

### Option 1: Simple Direct Approach (Recommended for Development)

This approach runs both parts directly on your machine:

```bash
# Start the backend API
./start.sh

# In a separate terminal, start the frontend UI
./start-ui.sh
```

This will:
- Run the backend on http://localhost:3001
- Run the frontend on http://localhost:3000

To stop everything:
```bash
./stop.sh
```

### Option 2: Docker Approach (Better for Production)

This approach runs everything in Docker containers:

```bash
# Start the entire stack (backend, frontend, PostgreSQL, Redis)
./docker-start.sh
```

This will use Docker to:
- Build and start all containers
- Set up the required network
- Run all services in isolation

To stop the Docker containers:
```bash
./docker-stop.sh
```

## Checking Status

To check if the application is running and get detailed status information:

```bash
./status.sh
```

## Simplified File Structure

```
FlexTime/
├── backend/                  # Backend API server
│   ├── app.js               # Main server entry point
│   ├── clients/             # External service clients
│   ├── config/              # Configuration
│   ├── models/              # Data models
│   ├── public/              # Static files
│   └── utils/               # Utilities
├── frontend/                # React frontend application
│   ├── src/                 # Source code
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   └── services/        # API services
│   └── public/              # Static assets
├── docker-compose.yml       # Docker configuration
├── start.sh                 # Start the backend
├── start-ui.sh              # Start the frontend
├── docker-start.sh          # Start with Docker
└── stop.sh                  # Stop all processes
```

## Key URLs

When running the application:

- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Status**: http://localhost:3001/api/status

## Troubleshooting

If you encounter issues:

1. Check application status: `./status.sh`
2. View backend logs: `tail -f backend/app.log`
3. View frontend logs: Check the terminal where you ran `./start-ui.sh`
4. For Docker issues: `docker logs flextime-backend` or `docker logs flextime-frontend`

## Development Notes

- The React frontend requires Node.js v16+ to build
- The backend API has dependencies on TensorFlow.js for some ML features
- Docker builds take longer due to TensorFlow compilation requirements