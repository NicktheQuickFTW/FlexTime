#!/bin/bash

# Start FlexTime backend with mock database configuration
# This script configures the backend to use mock implementations
# for database connections and external services.

echo "Starting FlexTime backend with mock database..."

# Set up environment variables
export NODE_ENV=development
export PORT=3004
export DISABLE_DATABASE=true
export USE_NEON_DB=true
export ENABLE_NEON_MEMORY=true
export DISABLE_COMPASS=true
export LOG_LEVEL=info

# Change to backend directory
cd "$(dirname "$0")/backend"

# Ensure we have a valid .env file
cp .env.mock .env

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the backend
echo "Starting FlexTime backend on port 3004..."
node index.js