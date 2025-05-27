#!/usr/bin/env node

// Quick start script for FlexTime
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting FlexTime Backend...');

// Kill any existing processes on port 3001
const killCmd = spawn('lsof', ['-ti:3001']);
killCmd.stdout.on('data', (data) => {
  const pids = data.toString().trim().split('\n').filter(pid => pid);
  pids.forEach(pid => {
    try {
      process.kill(pid, 'SIGKILL');
      console.log(`Killed existing process ${pid}`);
    } catch (e) {
      // Process already dead
    }
  });
});

// Start the backend after a short delay
setTimeout(() => {
  const backendPath = path.join(__dirname, 'backend', 'app.js');
  console.log(`Starting backend from: ${backendPath}`);
  
  const backend = spawn('node', [backendPath], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    detached: true
  });
  
  backend.unref(); // Allow parent to exit
  
  console.log(`✅ FlexTime Backend starting with PID: ${backend.pid}`);
  console.log('📍 Backend API: http://localhost:3001');
  console.log('🎨 Simple Dashboard: Open frontend/simple-big12-dashboard.html');
  
  // Test the backend after a moment
  setTimeout(() => {
    const http = require('http');
    const req = http.get('http://localhost:3001/api/status', (res) => {
      console.log('✅ Backend is responding!');
      process.exit(0);
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend not yet responding, but should start soon...');
      process.exit(0);
    });
  }, 2000);
  
}, 1000);