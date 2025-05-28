#!/bin/bash

# FlexTime Deployment Script
# This script handles the deployment of the FlexTime scheduling platform

echo "==== FlexTime Deployment ===="
echo "Starting deployment at $(date)"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Step 1: Checking prerequisites..."

if ! command_exists docker; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command_exists node; then
    echo "ERROR: Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✓ All prerequisites met"
echo ""

# Create environment file if it doesn't exist
echo "Step 2: Setting up environment configuration..."
if [ ! -f backend/.env ]; then
    echo "Creating .env file from example..."
    cp backend/.env.example backend/.env
    echo "WARNING: Please edit backend/.env with your actual configuration values"
fi

# Create necessary directories
echo ""
echo "Step 3: Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/data
mkdir -p backend/exports
echo "✓ Directories created"

# Install dependencies
echo ""
echo "Step 4: Installing dependencies..."
cd backend && npm install --production && cd ..
cd frontend && npm install && cd ..
echo "✓ Dependencies installed"

# Build frontend
echo ""
echo "Step 5: Building frontend..."
cd frontend && npm run build && cd ..
echo "✓ Frontend built"

# Stop any existing containers
echo ""
echo "Step 6: Stopping existing containers..."
docker-compose down
echo "✓ Existing containers stopped"

# Export environment variables from backend/.env to current shell
echo ""
echo "Step 7: Loading environment variables from backend/.env..."
export $(grep -v '^#' backend/.env | xargs)
echo "✓ Environment variables loaded"

# Build and start containers
echo ""
echo "Step 8: Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d
echo "✓ Containers started"

# Wait for services to be ready
echo ""
echo "Step 9: Waiting for services to be ready..."
sleep 15

# Check service health
echo ""
echo "Step 10: Checking service health..."
if curl -s http://localhost:3001/api/status > /dev/null; then
    echo "✓ Backend API is running"
else
    echo "✗ Backend API is not responding"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✓ Frontend is running"
else
    echo "✗ Frontend is not responding"
fi

# Initialize database (only if needed)
echo ""
echo "Step 11: Checking database initialization..."
cd backend
if node scripts/test-neon-api.js; then
    echo "✓ Database connection successful"
else
    echo "Running database initialization..."
    if node scripts/init-neon-db.js; then
        echo "✓ Database initialized"
    else
        echo "✗ Database initialization failed"
    fi
fi
cd ..

# Seed Big 12 data
echo ""
echo "Step 12: Checking Big 12 data..."
cd backend
if node scripts/seed-neon-big12-teams.js; then
    echo "✓ Big 12 teams seeded"
else
    echo "✗ Big 12 team seeding failed"
fi
cd ..

# Display deployment information
echo ""
echo "==== Deployment Complete ===="
echo "FlexTime is now running at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- API Documentation: http://localhost:3001/api-docs"
echo ""
echo "To view logs:"
echo "- Backend: docker logs flextime-backend"
echo "- Frontend: docker logs flextime-frontend"
echo "- Redis: docker logs flextime-redis"
echo ""
echo "To stop the application:"
echo "- docker-compose down"
echo ""
echo "Next steps:"
echo "1. Verify the application is working correctly"
echo "2. Access the dashboard at http://localhost:3000"
echo "3. Configure additional sports and teams as needed"
echo "4. Set up SSL/TLS for production deployment"
echo ""
echo "Deployment completed at $(date)"
echo "==== FlexTime Deployment Complete ===="