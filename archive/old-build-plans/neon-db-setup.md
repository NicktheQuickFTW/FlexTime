# HELiiX Neon DB Integration

This document explains how to set up and use the Neon DB with the HELiiX scheduling service.

## Overview

The HELiiX system uses a primarily PostgreSQL-based database approach:

- **Neon DB** (PostgreSQL-compatible):
  - Stores structured business data for domain-specific services like FlexTime
  - Stores agent memories and learning data for the Intelligence Engine
  - Manages training and feedback data for the learning system
- **Redis**: Provides caching capabilities and short-term memory for performance optimization

This guide focuses on the Neon DB setup for the scheduling service.

## Connection Details

The scheduling service is configured to connect to the Neon DB instance `br-dry-truth-aaf5qyua` with the following details:

- **Host**: ep-dry-truth-aaf5qyua.us-east-2.aws.neon.tech
- **Port**: 5432
- **Database**: neondb
- **Username**: nickw

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the scheduling service directory with the following content:

```
# Neon DB Configuration
NEON_DB_CONNECTION_STRING=postgresql://nickw:your_password_here@ep-dry-truth-aaf5qyua.us-east-2.aws.neon.tech/neondb?sslmode=require

# Alternative individual connection parameters
NEON_DB_HOST=ep-dry-truth-aaf5qyua.us-east-2.aws.neon.tech
NEON_DB_PORT=5432
NEON_DB_NAME=neondb
NEON_DB_USER=nickw
NEON_DB_PASSWORD=your_password_here

# Enable Neon DB for specific components
USE_NEON_DB=true
ENABLE_NEON_MEMORY=true
```

Replace `your_password_here` with your actual Neon DB password.

The direct connection string method is recommended for improved reliability and security.

### 2. Initialize the Database

Run the initialization script to set up the database schema:

```bash
npm run init-neon-db
```

This will:
- Create all necessary tables based on the Sequelize models
- Set up relationships between tables
- Seed initial data (sports, championships, etc.)

### 3. Start the Service

Once the database is initialized, you can start the scheduling service:

```bash
npm run dev
```

The service will automatically connect to the Neon DB using the configuration in your `.env` file.

## Database Structure

The Neon DB stores the following data for the scheduling service:

- **Sports**: Football, basketball, etc.
- **Championships**: Conferences like Big 12
- **Institutions**: Universities and colleges
- **Teams**: Sports teams associated with institutions
- **Venues**: Locations where games are played
- **Schedules**: Collections of games for a season
- **Games**: Individual matchups between teams
- **Constraints**: Rules and requirements for scheduling

## Advantages of Neon DB

1. **Serverless**: Automatically scales based on demand
2. **PostgreSQL-compatible**: Works with existing Sequelize models
3. **Branching**: Supports development and testing branches
4. **Performance**: Low-latency, high-throughput database operations
5. **Cost-effective**: Pay only for what you use

## Troubleshooting

If you encounter connection issues:

1. Verify your `.env` file has the correct credentials
2. Check that your IP is allowed in the Neon DB security settings
3. Ensure you're using the correct branch in the Neon DB project
4. Try connecting with a PostgreSQL client like `psql` to verify credentials

For more help, refer to the [Neon DB documentation](https://neon.tech/docs/connect/connect-from-any-app).
