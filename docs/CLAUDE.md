# CLAUDE.md - FlexTime Development Guide

This file provides guidance for developers and AI assistants working with the FlexTime codebase.

## 🚀 Quick Start for Development

### Prerequisites
- Node.js 16+ (LTS recommended)
- PostgreSQL 13+
- Redis 6+
- Python 3.9+ (for ML components)
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/flextime.git
   cd flextime
   ```

2. **Set up backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   ```

3. **Set up frontend**
   ```bash
   cd ../frontend
   cp .env.example .env
   npm install
   ```

### Running the Application

#### Option 1: Start everything (recommended)
```bash
# From project root
./frontend/start.sh
```

#### Option 2: Start services individually
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### Development URLs
- Frontend: http://localhost:3005
- API: http://localhost:3005/api
- API Status: http://localhost:3005/api/status
- Teams API: http://localhost:3005/api/teams

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
npm test
```

### Linting
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd ../backend
npm run lint
```

## 🛠 Common Development Tasks

### Database Migrations
```bash
cd backend
npx sequelize-cli db:migrate
```

### Reset Database
```bash
cd backend
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

## 🤖 AI/ML Development

### Training Models
```bash
cd backend/src/intelligence/intelligence_engine/ml
python train_models.py
```

### Running Predictions
```bash
cd backend/src/intelligence/intelligence_engine/ml
python predict.py --input data/upcoming_games.csv
```

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start production server
NODE_ENV=production node server.js
```

### Docker Deployment
```bash
docker-compose up --build -d
```

## 🔍 Code Organization

### Frontend Structure
```
frontend/
├── public/           # Static files
├── src/
│   ├── components/   # Reusable UI components
│   ├── pages/         # Page components
│   ├── store/         # Redux store
│   ├── styles/        # Global styles and themes
│   ├── utils/         # Utility functions
│   └── App.tsx        # Main app component
└── package.json
```

### Backend Structure
```
backend/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/   # Route controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
└── package.json
```

## 📝 Coding Standards

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS with custom components
- **State Management**: Redux for global state, React Query for server state
- **API**: RESTful conventions with JSON:API specification

## 🔄 Version Control

### Branch Naming
- `feature/`: New features
- `bugfix/`: Bug fixes
- `hotfix/`: Critical production fixes
- `chore/`: Maintenance tasks

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Example:
```
feat(scheduling): add constraint validation for championship dates

- Add validation for minimum rest days
- Prevent back-to-back away games
- Add tests for new validation rules

Fixes #123
```
