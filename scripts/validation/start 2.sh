#!/bin/bash

# FlexTime Full Application Startup Script

echo "==== FlexTime Full Application Startup ===="
echo ""

# Kill any existing processes
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start backend
cd backend
echo "Starting FlexTime backend API..."
node app.js > app.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "FlexTime backend started with PID $BACKEND_PID"
echo ""
echo "The backend API is available at: http://localhost:3001"
echo ""
echo "- Backend logs: tail -f backend/app.log"

# Create stop script
cat > stop.sh << INNEREOF
#!/bin/bash
echo "Stopping FlexTime..."
kill $BACKEND_PID 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
echo "FlexTime stopped"
INNEREOF

chmod +x stop.sh
echo ""

echo "To start the React frontend UI, run the following command in a new terminal:"
echo "cd frontend && npm start"
echo ""
echo "To stop the backend, run: ./stop.sh"