# FT Builder Scripts

Organized script collection for FT Builder operations and development.

## 📁 Directory Structure

### `/core` - Essential FT Builder Operations
- **`/data`** - Core data management
  - `BIG12_COMPLETE_DATA.js` - Foundational Big 12 conference data
  - `/team-management` - Team CRUD operations and updates
- **`/database`** - Database setup and management
  - Neon DB initialization, migration, and seeding scripts
- **`/scheduling`** - Core scheduling functionality
  - Schedule builder API, optimization, and scenario management
- **`/ai-ml`** - AI/ML training and models
  - COMPASS rating system, metrics, and training pipelines

### `/development` - Development Tools
- **`/validation`** - Testing and validation scripts
- Build utilities, logging, and performance metrics

### `/utilities` - General Utilities
- AI services configuration and connection testing

## 🚀 Common Usage

### Database Setup
```bash
node core/database/init-neon-db.js
node core/database/create-neon-tables.js
node core/database/seed-neon-complete-big12.js
```

### AI/ML Training
```bash
node core/ai-ml/advanced_metrics_system.js
bash core/ai-ml/compass/train-compass-models.sh
```

### Development
```bash
node development/validation/verify-implementation.js
node utilities/test_connection.js
```

## 🧹 Clean Architecture

All FlexTime-specific integrations have been removed. These scripts are designed for standalone FT Builder operation with monolithic architecture.