#!/bin/bash
# Script to test FlexTime application with Intelligence Engine removed

echo "Testing FlexTime application without Intelligence Engine..."

# Set environment variable to disable Intelligence Engine
export ENABLE_INTELLIGENCE_ENGINE=false

# Start the backend in the background
echo "Starting FlexTime backend..."
cd backend && npm run start &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 5

# Test basic endpoints
echo "Testing basic API endpoints..."
curl -s http://localhost:3004/api/status | jq .
echo ""

# Test schedule endpoints
echo "Testing schedule endpoints..."
curl -s http://localhost:3004/api/schedule/types | jq .
echo ""

# Test Intelligence Engine stub
echo "Testing Intelligence Engine stub endpoints..."
curl -s http://localhost:3004/api/intelligence-engine/status | jq .
echo ""

# Cleanup
echo "Stopping backend process..."
kill $BACKEND_PID

echo "Test complete!"