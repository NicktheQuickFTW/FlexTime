# FlexTime - Big 12 Conference Scheduling Platform

![XII-Ops FlexTime](https://img.shields.io/badge/XII--Ops-FlexTime-blue)
![Node.js](https://img.shields.io/badge/Node.js-16+-green)
![License](https://img.shields.io/badge/License-Proprietary-red)

## Overview

FlexTime is an intelligent sports scheduling platform specifically designed for the Big 12 Conference. It combines advanced machine learning, constraint-based optimization, and real-time data integration to generate optimal schedules for 16 member schools across 23 different sports.

### Key Features

- 🏈 **Multi-Sport Support**: Handles all 23 Big 12 sports from football to wrestling
- 🤖 **AI-Powered Optimization**: Uses machine learning to continuously improve scheduling decisions
- 📊 **Real-Time Analytics**: Provides comprehensive metrics and visualizations
- 🏟️ **Venue Management**: Integrates venue availability and capacity constraints
- ✈️ **Travel Optimization**: Minimizes travel costs and fatigue across the conference
- 📅 **Championship Compliance**: Ensures schedules respect conference and NCAA championship dates
- 🔄 **Notion Integration**: Syncs with conference management systems

## Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or pnpm
- Neon PostgreSQL database account
- Environment variables configured (see `.env.example`)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd Flextime

# Install dependencies
npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit .env with your database credentials and API keys

# Start the application
./scripts/start.sh
```

### Running the Application

```bash
# Start everything (recommended)
./scripts/start.sh

# Or start components individually:
# Backend API (port 3001)
cd backend && npm start

# Frontend UI (port 3000)  
cd frontend && npm start

# Check status
./scripts/status.sh

# Stop all services
./scripts/stop.sh
```

### Access Points

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/status

## Big 12 Conference Configuration

The platform is configured for all 16 Big 12 member schools:

**Full Members**: Arizona, Arizona State, Baylor, BYU, UCF, Cincinnati, Colorado, Houston, Iowa State, Kansas, Kansas State, Oklahoma State, TCU, Texas Tech, Utah, West Virginia

### Supported Sports (23 Total)

- **Major Sports**: Football, Men's Basketball, Women's Basketball
- **Olympic Sports**: Baseball, Softball, Soccer, Volleyball, Tennis, Golf, Track & Field, Cross Country, Swimming & Diving
- **Specialty Sports**: Wrestling, Gymnastics, Rowing, Beach Volleyball, Equestrian, Lacrosse

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FlexTime Platform                        │
├─────────────────────────┬────────────────────┬─────────────────┤
│      Frontend UI        │    Backend API     │   Intelligence  │
│  - React Dashboard      │  - Express Server  │   Engine        │
│  - Schedule Builder     │  - REST API        │  - ML Models    │
│  - Analytics Views      │  - WebSocket       │  - Agents       │
└─────────────────────────┴────────────────────┴─────────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │   Neon PostgreSQL  │
                          │   - Teams/Venues   │
                          │   - Schedules      │
                          │   - Analytics      │
                          └───────────────────┘
```

### Core Components

1. **Backend Services** (`/backend`)
   - Scheduling Service with constraint optimization
   - Intelligence Engine with predictive analytics
   - Multi-Agent System for distributed optimization
   - Real-time feedback and learning system

2. **Frontend Application** (`/frontend`)
   - Interactive scheduling matrix
   - Advanced metrics dashboard
   - Travel optimization visualizations
   - Conference management tools

3. **Intelligence System** (`/backend/src/intelligence`)
   - COMPASS predictive models
   - Machine learning workflow manager
   - Specialized scheduling agents
   - Continuous improvement system

## API Documentation

### Core Endpoints

```bash
# System Status
GET /api/status

# Teams & Venues
GET /api/teams
GET /api/teams/:sport
GET /api/venues

# Scheduling
POST /api/schedule/generate
GET /api/schedule/:id
PUT /api/schedule/:id/optimize

# Analytics
GET /api/metrics/travel
GET /api/metrics/competitive-balance
GET /api/metrics/venue-utilization

# Intelligence Engine
POST /api/intelligence/analyze
GET /api/intelligence/recommendations
```

For complete API documentation, visit http://localhost:3001/api/docs when running locally.

## Development

### Project Structure

```
Flextime/
├── backend/           # Node.js API server
│   ├── src/          # Source code
│   ├── data/         # Database connections
│   ├── services/     # Business logic
│   └── tools/        # Utility scripts
├── frontend/         # React application
│   ├── src/          # React components
│   ├── public/       # Static assets
│   └── ft-builder/   # Schedule builder UI
├── docs/             # Documentation
├── scripts/          # Deployment scripts
└── ag-ui/           # Advanced UI components
```

### Testing

```bash
# Run all tests
npm test

# Backend tests only
cd backend && npm test

# Test specific components
npm run test:agents
npm run test:scheduling
npm run test:ml
```

### Building for Production

```bash
# Build everything
npm run build

# Deploy to production
./scripts/deploy.sh
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- [Overview](docs/OVERVIEW.md) - Complete system overview
- [Technical Details](docs/TECHNICAL_DETAILS.md) - Architecture deep dive
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment
- [Agent System](docs/AGENTS.md) - Multi-agent architecture
- [API Reference](backend/docs/intelligence-engine-api.md) - Complete API docs

## Support

For questions or issues:
- Check the [troubleshooting guide](./scripts/troubleshoot.sh)
- Review the [documentation](./docs)
- Contact the XII-Ops team

## License

© 2025 XII-Ops. All rights reserved. This is proprietary software for the Big 12 Conference.

---

Built with ❤️ for the Big 12 Conference by XII-Ops