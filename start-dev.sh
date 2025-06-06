#!/bin/bash

# FlexTime Development Startup Script
# Starts both backend and frontend servers for development

echo "🚀 Starting FlexTime Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        echo -e "${YELLOW}Warning: Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to wait for server to start
wait_for_server() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    echo "Waiting for $name to start on port $port..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$port" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is running on port $port${NC}"
            return 0
        fi
        
        if [ $port -eq 3005 ]; then
            # For backend, check the API status endpoint
            if curl -s "http://localhost:$port/api/status" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ $name is running on port $port${NC}"
                return 0
            fi
        fi
        
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $name failed to start within 30 seconds${NC}"
    return 1
}

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Please run this script from the FlexTime root directory${NC}"
    exit 1
fi

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*3005" 2>/dev/null || true
pkill -f "next.*3000" 2>/dev/null || true
sleep 2

# Start Backend
echo "🔧 Starting Backend Server (port 3005)..."
cd backend
if [ ! -f "index.js" ]; then
    echo -e "${RED}❌ Backend index.js not found${NC}"
    exit 1
fi

# Start backend in background
node index.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
if wait_for_server 3005 "Backend"; then
    echo -e "${GREEN}Backend logs: tail -f backend.log${NC}"
else
    echo -e "${RED}❌ Backend failed to start. Check backend.log for errors${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Test API endpoints
echo "🧪 Testing API endpoints..."
if curl -s "http://localhost:3005/api/scheduling-service/teams" >/dev/null; then
    echo -e "${GREEN}✅ Teams API working${NC}"
else
    echo -e "${YELLOW}⚠️  Teams API not responding yet${NC}"
fi

if curl -s "http://localhost:3005/api/scheduling-service/constraints" >/dev/null; then
    echo -e "${GREEN}✅ Constraints API working${NC}"
else
    echo -e "${YELLOW}⚠️  Constraints API not responding yet${NC}"
fi

# Start Frontend
echo "🎨 Starting Frontend Server (port 3000)..."
cd frontend
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Frontend package.json not found${NC}"
    exit 1
fi

# Start frontend in background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
if wait_for_server 3000 "Frontend"; then
    echo -e "${GREEN}Frontend logs: tail -f frontend.log${NC}"
else
    echo -e "${RED}❌ Frontend failed to start. Check frontend.log for errors${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 FlexTime Development Environment is ready!${NC}"
echo ""
echo "📋 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3005"
echo "   Schedule Builder: http://localhost:3000/schedule-builder"
echo ""
echo "📊 API Endpoints:"
echo "   Teams: http://localhost:3005/api/scheduling-service/teams"
echo "   Constraints: http://localhost:3005/api/scheduling-service/constraints"
echo "   Status: http://localhost:3005/api/status"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or: pkill -f 'node.*3005' && pkill -f 'next.*3000'"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Keep script running and handle Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup INT

# Wait for background processes
wait