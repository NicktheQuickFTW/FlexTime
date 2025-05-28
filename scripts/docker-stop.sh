#!/bin/bash

# Docker Stop Script for FlexTime Platform
# This script stops the FlexTime application and cleans up Docker resources

set -e

echo "🛑 Stopping FlexTime Platform..."

# Set Docker Compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Stop all services
$DOCKER_COMPOSE down

# Ask if user wants to remove volumes
read -p "Do you want to remove data volumes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing volumes..."
    $DOCKER_COMPOSE down -v
fi

# Ask if user wants to remove images
read -p "Do you want to remove Docker images? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing images..."
    $DOCKER_COMPOSE down --rmi local
fi

echo "✅ FlexTime Platform stopped successfully!"