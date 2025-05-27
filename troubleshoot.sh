#!/bin/bash

# FlexTime Troubleshooting Script
# This script helps diagnose issues with FlexTime deployment

echo "==== FlexTime Troubleshooting ===="
echo "Running diagnostics at $(date)"
echo ""

# Check Docker is installed and running
echo "Checking Docker status..."
if ! command -v docker >/dev/null 2>&1; then
    echo "✗ Docker is not installed"
    exit 1
else
    echo "✓ Docker is installed"
    if docker info >/dev/null 2>&1; then
        echo "✓ Docker daemon is running"
    else
        echo "✗ Docker daemon is not running"
        echo "  Please start Docker and try again"
        exit 1
    fi
fi

# Check Docker Compose is installed
echo ""
echo "Checking Docker Compose status..."
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "✗ Docker Compose is not installed"
    exit 1
else
    echo "✓ Docker Compose is installed"
    docker-compose --version
fi

# Check environment configuration
echo ""
echo "Checking environment configuration..."
if [ -f backend/.env ]; then
    echo "✓ Found backend/.env file"
    
    # Check Neon DB configuration
    if grep -q "NEON_DB_CONNECTION_STRING" backend/.env; then
        echo "✓ Found Neon DB connection string"
    else
        echo "✗ Missing Neon DB connection string in backend/.env"
    fi
    
    # Check API keys
    if grep -q "ANTHROPIC_API_KEY" backend/.env; then
        echo "✓ Found Anthropic API key"
    else
        echo "✗ Missing Anthropic API key in backend/.env"
    fi
    
    if grep -q "OPENAI_API_KEY" backend/.env; then
        echo "✓ Found OpenAI API key"
    else
        echo "✗ Missing OpenAI API key in backend/.env"
    fi
else
    echo "✗ backend/.env file not found"
    echo "  Please create a .env file based on .env.example"
    exit 1
fi

# Check Docker containers
echo ""
echo "Checking Docker containers..."
RUNNING_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -c "flextime")
STOPPED_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -c "flextime")

echo "Running FlexTime containers: $RUNNING_CONTAINERS"
echo "Stopped FlexTime containers: $((STOPPED_CONTAINERS - RUNNING_CONTAINERS))"

# If containers are running, check their logs
if [ $RUNNING_CONTAINERS -gt 0 ]; then
    echo ""
    echo "Checking container logs..."
    
    # Check backend logs
    if docker ps --format "{{.Names}}" | grep -q "flextime-backend"; then
        echo ""
        echo "Backend logs (last 20 lines):"
        docker logs flextime-backend --tail 20
    fi
    
    # Check frontend logs
    if docker ps --format "{{.Names}}" | grep -q "flextime-frontend"; then
        echo ""
        echo "Frontend logs (last 20 lines):"
        docker logs flextime-frontend --tail 20
    fi
fi

# Check backend accessibility
echo ""
echo "Checking backend API accessibility..."
if curl -s http://localhost:3001/api/status >/dev/null 2>&1; then
    echo "✓ Backend API is accessible at http://localhost:3001"
    echo "API Status:"
    curl -s http://localhost:3001/api/status
else
    echo "✗ Backend API is not accessible at http://localhost:3001"
fi

# Check frontend accessibility
echo ""
echo "Checking frontend accessibility..."
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✓ Frontend is accessible at http://localhost:3000"
else
    echo "✗ Frontend is not accessible at http://localhost:3000"
fi

# Provide next steps
echo ""
echo "==== Troubleshooting Complete ===="
echo ""
echo "Next steps based on diagnostics:"
echo ""
echo "If no containers are running:"
echo "1. Try starting the containers again with: ./docker-start.sh"
echo "2. Start each service individually for debugging:"
echo "   cd backend && node index.js"
echo "   cd frontend && npm start"
echo ""
echo "If containers are running but services aren't accessible:"
echo "1. Check for port conflicts: netstat -an | grep '3000\\|3001'"
echo "2. Check Docker logs with: docker logs flextime-backend -f"
echo "3. Restart services with: docker-compose restart"
echo ""
echo "If configuration issues were found:"
echo "1. Correct the backend/.env file"
echo "2. Restart services with: ./docker-start.sh"
echo ""
echo "Troubleshooting completed at $(date)"