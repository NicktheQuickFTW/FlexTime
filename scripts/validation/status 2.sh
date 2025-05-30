#!/bin/bash

# FlexTime Status Script
# Shows the current status of the FlexTime application

echo "==== FlexTime Status ===="

# Check if the backend is running
BACKEND_STATUS=$(lsof -i:3001 | grep LISTEN)
FRONTEND_STATUS=$(lsof -i:3000 | grep LISTEN)

if [ -n "$BACKEND_STATUS" ] && [ -n "$FRONTEND_STATUS" ]; then
    echo "✓ FlexTime Full Application is RUNNING"
    
    # Backend details
    BACKEND_PID=$(echo $BACKEND_STATUS | awk '{print $2}')
    echo ""
    echo "Backend API (port 3001):"
    echo "  Process ID: $BACKEND_PID"
    
    # Check uptime of the process
    if [ "$(uname)" == "Darwin" ]; then  # macOS
        BACKEND_START_TIME=$(ps -p $BACKEND_PID -o lstart= 2>/dev/null)
        echo "  Started: $BACKEND_START_TIME"
    else  # Linux
        BACKEND_START_TIME=$(ps -p $BACKEND_PID -o lstart= 2>/dev/null)
        echo "  Started: $BACKEND_START_TIME"
    fi
    
    # Frontend details
    FRONTEND_PID=$(echo $FRONTEND_STATUS | awk '{print $2}')
    echo ""
    echo "Frontend UI (port 3000):"
    echo "  Process ID: $FRONTEND_PID"
    
    # Check uptime of the process
    if [ "$(uname)" == "Darwin" ]; then  # macOS
        FRONTEND_START_TIME=$(ps -p $FRONTEND_PID -o lstart= 2>/dev/null)
        echo "  Started: $FRONTEND_START_TIME"
    else  # Linux
        FRONTEND_START_TIME=$(ps -p $FRONTEND_PID -o lstart= 2>/dev/null)
        echo "  Started: $FRONTEND_START_TIME"
    fi
    
    # Get API status
    echo ""
    echo "API Status:"
    curl -s http://localhost:3001/api/status | sed 's/[{},]/\n/g' | sed 's/"//g' | sed 's/:/: /'
    
    echo ""
    echo "Access Points:"
    echo "- React UI: http://localhost:3000"
    echo "- API Endpoint: http://localhost:3001"
    echo ""
    echo "Stop with: ./stop.sh"
elif [ -n "$BACKEND_STATUS" ]; then
    echo "⚠️ FlexTime Partial Status: Backend running but Frontend NOT running"
    
    # Backend details
    BACKEND_PID=$(echo $BACKEND_STATUS | awk '{print $2}')
    echo ""
    echo "Backend API (port 3001):"
    echo "  Process ID: $BACKEND_PID"
    
    # Check uptime of the process
    if [ "$(uname)" == "Darwin" ]; then  # macOS
        BACKEND_START_TIME=$(ps -p $BACKEND_PID -o lstart= 2>/dev/null)
        echo "  Started: $BACKEND_START_TIME"
    else  # Linux
        BACKEND_START_TIME=$(ps -p $BACKEND_PID -o lstart= 2>/dev/null)
        echo "  Started: $BACKEND_START_TIME"
    fi
    
    echo ""
    echo "Frontend is not running. To restart the full application:"
    echo "1. Stop the current instance: ./stop.sh"
    echo "2. Start the full application: ./start.sh"
elif [ -n "$FRONTEND_STATUS" ]; then
    echo "⚠️ FlexTime Partial Status: Frontend running but Backend NOT running"
    
    # Frontend details
    FRONTEND_PID=$(echo $FRONTEND_STATUS | awk '{print $2}')
    echo ""
    echo "Frontend UI (port 3000):"
    echo "  Process ID: $FRONTEND_PID"
    
    # Check uptime of the process
    if [ "$(uname)" == "Darwin" ]; then  # macOS
        FRONTEND_START_TIME=$(ps -p $FRONTEND_PID -o lstart= 2>/dev/null)
        echo "  Started: $FRONTEND_START_TIME"
    else  # Linux
        FRONTEND_START_TIME=$(ps -p $FRONTEND_PID -o lstart= 2>/dev/null)
        echo "  Started: $FRONTEND_START_TIME"
    fi
    
    echo ""
    echo "Backend is not running. To restart the full application:"
    echo "1. Stop the current instance: ./stop.sh"
    echo "2. Start the full application: ./start.sh"
else
    echo "✗ FlexTime is NOT RUNNING"
    echo ""
    echo "Start with: ./start.sh"
fi