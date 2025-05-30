#!/bin/bash

# Start FlexTime React UI
echo "==== Starting FlexTime React UI ===="
echo ""

# Kill any existing frontend processes
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start React frontend
cd frontend
echo "Starting React frontend..."
npm start