#!/bin/bash

# Start FlexTime in development mode
echo "Starting FlexTime in development mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start the containers using docker-compose
docker-compose up -d

echo "FlexTime services starting..."
echo "Backend API will be available at: http://localhost:3001"
echo "Frontend UI will be available at: http://localhost:3000"
echo "Database is accessible at: localhost:5432"
echo "Redis is available at: localhost:6379"

echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
