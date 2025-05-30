#!/bin/bash

# FlexTime Scaled Startup Script
# This script starts FlexTime with all manageable scaling features enabled

echo "🚀 Starting FlexTime with Scaling Configuration"
echo "==============================================="

# Check if we're in the right directory
if [ ! -f "index.js" ]; then
    echo "❌ Please run this script from the backend directory"
    echo "   cd backend && ./scripts/start-scaled.sh"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if required packages are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Verify scaling implementation
echo "🔍 Verifying scaling implementation..."
node scripts/verify-scaling-implementation.js

# Check if verification was successful
if [ $? -ne 0 ]; then
    echo "❌ Scaling verification failed"
    exit 1
fi

echo ""
echo "✅ Verification complete - starting FlexTime with scaling"
echo ""

# Set environment variables for production scaling
export NODE_ENV=production
export PORT=${PORT:-3004}

# Optional: Enable specific features
export ENABLE_COMPRESSION=true
export ENABLE_CLUSTERING=true
export ENABLE_CACHING=true
export ENABLE_RATE_LIMITING=true

# Start the application
echo "🚀 Starting FlexTime Scheduling System (Scaled Mode)"
echo "   Environment: $NODE_ENV"
echo "   Port: $PORT"
echo "   PID: $$"
echo ""

# Use exec to replace the shell with Node.js process
exec node index.js

# If we reach here, something went wrong
echo "❌ Failed to start FlexTime"
exit 1