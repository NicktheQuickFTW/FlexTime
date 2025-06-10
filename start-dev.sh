#!/bin/bash

# FlexTime Development Startup Script
# Starts both backend and frontend servers for local development

set -e

echo "🚀 Starting FlexTime Development Environment"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the FlexTime root directory."
    exit 1
fi

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is already in use. Stopping existing process..."
        kill $(lsof -t -i:$port) || true
        sleep 2
    fi
}

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check and kill processes on required ports
check_port 3000
check_port 3004
check_port 3005

# Start backend server
echo "🔧 Starting backend server on port 3005..."
NODE_ENV=development node server.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server on port 3000..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ FlexTime Development Environment Started!"
echo "=============================================="
echo "📍 Frontend:  http://localhost:3000"
echo "📍 Backend:   http://localhost:3005"
echo "📍 Health:    http://localhost:3005/health"
echo ""
echo "📖 Available Pages:"
echo "   • Home:             http://localhost:3000"
echo "   • Schedule Builder: http://localhost:3000/schedule-builder"
echo "   • Analytics:        http://localhost:3000/analytics"
echo "   • Sports Showcase:  http://localhost:3000/sports"
echo ""
echo "🔍 To stop both servers, press Ctrl+C"
echo ""

# Function to cleanup on script exit
cleanup() {
    echo ""
    echo "🛑 Stopping FlexTime servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped successfully"
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait