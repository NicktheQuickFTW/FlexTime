#!/bin/bash

# Docker Status Script for FlexTime Platform
# This script checks the status of FlexTime Docker containers

set -e

echo "📊 FlexTime Platform Docker Status"
echo "=================================="

# Set Docker Compose command
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Show running containers
echo ""
echo "🐳 Running Containers:"
$DOCKER_COMPOSE ps

# Show container health
echo ""
echo "💚 Container Health:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep flextime || echo "No FlexTime containers running"

# Check service endpoints
echo ""
echo "🔍 Service Checks:"

# Check frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "   ✅ Frontend is running at http://localhost:3000"
else
    echo "   ❌ Frontend is not responding"
fi

# Check backend
if curl -s http://localhost:3001/api/status > /dev/null 2>&1; then
    echo "   ✅ Backend API is running at http://localhost:3001"
    echo "      Status: $(curl -s http://localhost:3001/api/status | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
else
    echo "   ❌ Backend API is not responding"
fi

# Check database
if $DOCKER_COMPOSE exec -T postgres pg_isready > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL database is ready"
else
    echo "   ❌ PostgreSQL database is not ready"
fi

# Check Redis
if $DOCKER_COMPOSE exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis cache is ready"
else
    echo "   ❌ Redis cache is not ready"
fi

# Show resource usage
echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep flextime || echo "No resource data available"

# Show recent logs summary
echo ""
echo "📜 Recent Logs (last 5 lines per service):"
echo ""
echo "Backend:"
$DOCKER_COMPOSE logs --tail=5 backend 2>/dev/null | tail -5 || echo "No backend logs available"
echo ""
echo "Frontend:"
$DOCKER_COMPOSE logs --tail=5 frontend 2>/dev/null | tail -5 || echo "No frontend logs available"