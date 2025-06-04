#!/bin/bash

# FlexTime Next-Gen UI Startup Script
# Comprehensive startup for the new glassmorphic interface

echo "🚀 Starting FlexTime Next-Generation Interface..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run from frontend directory.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d. -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Error: Node.js 16+ required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${CYAN}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Check backend connection
echo -e "${CYAN}🔗 Checking backend connection...${NC}"
BACKEND_URL="http://localhost:3005"

# Check for any processes on port 3000 and 3005
echo -e "${CYAN}🔍 Checking for conflicting processes...${NC}"
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Stopping process on port 3000...${NC}"
    kill $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
fi

if lsof -ti:3005 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Stopping process on port 3005...${NC}"
    kill $(lsof -ti:3005) 2>/dev/null || true
    sleep 2
fi

# Start backend if not running
if ! curl -s "$BACKEND_URL/api/status" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend not running. Starting backend...${NC}"
    
    # Check if backend directory exists
    if [ -d "../backend" ]; then
        cd ../backend
        echo -e "${CYAN}📡 Starting FlexTime Backend API...${NC}"
        npm install > /dev/null 2>&1
        npm start > ../frontend/backend.log 2>&1 &
        BACKEND_PID=$!
        cd ../frontend
        
        echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
        
        # Wait for backend to be ready
        echo -e "${CYAN}⏳ Waiting for backend to be ready...${NC}"
        for i in {1..30}; do
            if curl -s "$BACKEND_URL/api/status" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Backend is ready${NC}"
                break
            fi
            sleep 1
            echo -n "."
        done
        echo "" # New line after dots
    else
        echo -e "${YELLOW}⚠️  Backend directory not found. Frontend will run in development mode.${NC}"
    fi
else
    echo -e "${GREEN}✅ Backend is already running${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${CYAN}⚙️  Creating .env file...${NC}"
    cat > .env << EOF
# FlexTime Frontend Configuration
REACT_APP_API_URL=http://localhost:3005/api
REACT_APP_WS_URL=ws://localhost:3005
REACT_APP_VERSION=2.0.0
REACT_APP_ENVIRONMENT=development
REACT_APP_BIG12_BRANDING=enabled
REACT_APP_GLASSMORPHIC_UI=enabled
REACT_APP_PERFORMANCE_MONITORING=enabled
EOF
    echo -e "${GREEN}✅ Environment file created${NC}"
fi

# Clear previous builds
echo -e "${CYAN}🧹 Cleaning previous builds...${NC}"
rm -rf build/ 2>/dev/null

echo -e "${GREEN}✅ Build cleaned${NC}"

# Display startup info
echo ""
echo -e "${CYAN}🎨 FlexTime Next-Gen UI Features:${NC}"
echo -e "   • Glassmorphic Design System"
echo -e "   • Real-time Collaboration"
echo -e "   • Advanced Drag & Drop Scheduling"
echo -e "   • Big 12 Conference Branding"
echo -e "   • COMPASS Analytics Dashboard"
echo -e "   • Mobile-First Responsive Design"
echo ""

echo -e "${CYAN}🌐 Starting React development server...${NC}"
echo -e "${YELLOW}⏱️  This may take 30-60 seconds for the advanced UI to compile...${NC}"

# Start the React app
echo -e "${GREEN}🚀 FlexTime will be available at: http://localhost:3000${NC}"
echo -e "${GREEN}📊 Backend API available at: http://localhost:3005${NC}"
echo ""
echo -e "${CYAN}Press Ctrl+C to stop all services${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Trap Ctrl+C to cleanup
trap 'echo -e "\n${YELLOW}🛑 Shutting down FlexTime...${NC}"; kill $BACKEND_PID 2>/dev/null; exit 0' INT

# Start React app
npm start

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
echo -e "${GREEN}✅ FlexTime shutdown complete${NC}"