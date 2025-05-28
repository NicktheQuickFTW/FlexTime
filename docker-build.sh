#!/bin/bash

# FlexTime Docker Build Script with Environment Variables
# This script builds the Docker images with proper environment configuration

echo "==== FlexTime Docker Build ===="
echo "Building images at $(date)"
echo ""

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Ensure backend/.env exists
if [ ! -f backend/.env ]; then
    echo "ERROR: backend/.env file not found!"
    echo "Please create the backend/.env file before proceeding."
    exit 1
fi

# Create temporary Docker Compose override file to use explicit env_file directive
cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  backend:
    env_file:
      - ./backend/.env
    environment:
      - REDIS_URL=redis://redis:6379
  
  frontend:
    environment:
      - REACT_APP_API_URL=http://localhost:3001
EOF

echo "Created Docker Compose override with explicit env_file directive"

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/data
mkdir -p backend/exports

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose down

# Build the images
echo "Building Docker images with environment configuration..."
docker-compose build --no-cache

echo "✓ Docker images built successfully!"
echo ""
echo "To start the services, run:"
echo "./docker-start.sh"
echo ""
echo "Build completed at $(date)"
echo "==== FlexTime Docker Build Complete ===="