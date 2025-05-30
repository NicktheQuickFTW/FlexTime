#!/bin/bash

# Docker Start Script for FlexTime Platform
# This script starts the FlexTime application using Docker Compose

set -e

echo "🚀 Starting FlexTime Platform with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Set Docker Compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Load environment variables if .env exists
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required environment variables
if [ -z "$NEON_DB_CONNECTION_STRING" ] && [ "$USE_NEON_DB" = "true" ]; then
    echo "⚠️  Warning: NEON_DB_CONNECTION_STRING not set but USE_NEON_DB is true"
    echo "   FlexTime will use local PostgreSQL instead"
fi

# Determine environment
ENVIRONMENT=${NODE_ENV:-production}
echo "🌍 Environment: $ENVIRONMENT"

# Build images if needed
echo "🏗️  Building Docker images..."
$DOCKER_COMPOSE build

# Start services based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Starting production services..."
    $DOCKER_COMPOSE --profile production up -d
else
    echo "🚀 Starting development services..."
    $DOCKER_COMPOSE up -d
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service health
$DOCKER_COMPOSE ps

# Display access information
echo ""
echo "✅ FlexTime Platform is starting up!"
echo ""
echo "🌐 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo "   API Docs:  http://localhost:3001/api/docs"

if [ "$ENVIRONMENT" = "development" ]; then
    echo "   Database:  http://localhost:8080 (Adminer)"
fi

echo ""
echo "📊 Check logs:"
echo "   All services:  $DOCKER_COMPOSE logs -f"
echo "   Backend only:  $DOCKER_COMPOSE logs -f backend"
echo "   Frontend only: $DOCKER_COMPOSE logs -f frontend"
echo ""
echo "🛑 To stop: ./scripts/docker-stop.sh"