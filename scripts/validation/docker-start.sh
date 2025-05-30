#!/bin/bash

# FlexTime Docker Startup Script
# This script uses Docker to run the complete FlexTime application stack

echo "==== FlexTime Docker Startup ===="
echo "Starting containers at $(date)"
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

# Create temporary Docker Compose override file if it doesn't exist
if [ ! -f docker-compose.override.yml ]; then
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
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/data
mkdir -p backend/exports

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose down >/dev/null 2>&1

# Start the containers
echo "Starting containers..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
echo "This may take a bit longer due to TensorFlow initialization..."
sleep 30

# Check if services are running
echo ""
echo "Checking service status:"

# Check backend
if curl -s http://localhost:3001/api/status > /dev/null; then
    echo "✓ Backend API is running at http://localhost:3001"
else
    echo "✗ Backend API is not responding"
    echo "  Checking backend logs:"
    docker logs flextime-backend | tail -n 20
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ Frontend UI is running at http://localhost:3000"
else
    echo "✗ Frontend UI is not responding"
    echo "  Checking frontend logs:"
    docker logs flextime-frontend | tail -n 20
fi

echo ""
echo "The complete FlexTime application should now be running!"
echo "- Frontend UI: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo ""
echo "To view logs:"
echo "- Backend: docker logs flextime-backend -f"
echo "- Frontend: docker logs flextime-frontend -f"
echo ""
echo "To stop all services:"
echo "./docker-stop.sh or docker-compose down"