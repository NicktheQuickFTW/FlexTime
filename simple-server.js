// Simple FlexTime Server
const express = require('express');
const cors = require('cors');
const path = require('path');

console.log('🚀 Starting Simple FlexTime Server...');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Basic routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'FlexTime API is running (simple version)',
    version: '3.0.0',
    environment: 'development',
    databaseConnected: true
  });
});

app.get('/api/schedules', (req, res) => {
  res.json({
    schedules: [
      {
        id: 'football-2025',
        name: '2025 Football Schedule',
        sportId: 'football',
        status: 'draft',
        teams: 16,
        games: 96,
        startDate: '2025-08-30',
        endDate: '2025-12-07'
      },
      {
        id: 'basketball-m-2025',
        name: "2025-26 Men's Basketball",
        sportId: 'basketball-m',
        status: 'draft',
        teams: 16,
        games: 144,
        startDate: '2025-11-05',
        endDate: '2026-03-15'
      },
      {
        id: 'basketball-w-2025',
        name: "2025-26 Women's Basketball",
        sportId: 'basketball-w',
        status: 'draft',
        teams: 16,
        games: 144,
        startDate: '2025-11-05',
        endDate: '2026-03-15'
      }
    ]
  });
});

app.get('/api/teams', (req, res) => {
  res.json({
    teams: [
      { id: 1, name: 'Arizona Wildcats', abbreviation: 'ARIZ' },
      { id: 2, name: 'Arizona State Sun Devils', abbreviation: 'ASU' },
      { id: 3, name: 'Baylor Bears', abbreviation: 'BAY' },
      { id: 4, name: 'BYU Cougars', abbreviation: 'BYU' },
      { id: 5, name: 'Cincinnati Bearcats', abbreviation: 'CIN' },
      { id: 6, name: 'Colorado Buffaloes', abbreviation: 'COLO' },
      { id: 7, name: 'Houston Cougars', abbreviation: 'HOU' },
      { id: 8, name: 'Iowa State Cyclones', abbreviation: 'ISU' },
      { id: 9, name: 'Kansas Jayhawks', abbreviation: 'KU' },
      { id: 10, name: 'Kansas State Wildcats', abbreviation: 'KSU' },
      { id: 11, name: 'Oklahoma State Cowboys', abbreviation: 'OKST' },
      { id: 12, name: 'TCU Horned Frogs', abbreviation: 'TCU' },
      { id: 13, name: 'Texas Tech Red Raiders', abbreviation: 'TTU' },
      { id: 14, name: 'UCF Knights', abbreviation: 'UCF' },
      { id: 15, name: 'Utah Utes', abbreviation: 'UTAH' },
      { id: 16, name: 'West Virginia Mountaineers', abbreviation: 'WVU' }
    ]
  });
});

app.get('/api/metrics', (req, res) => {
  res.json({
    metrics: {
      apiRequests: Math.floor(Math.random() * 1000) + 1000,
      scheduleCreated: 3,
      optimizationRuns: Math.floor(Math.random() * 20) + 40,
      averageOptimizationTime: `${(Math.random() * 2 + 2).toFixed(1)}s`,
      constraintSatisfaction: `${(Math.random() * 5 + 94).toFixed(1)}%`
    }
  });
});

// Serve the simple dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'simple-big12-dashboard.html'));
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`✅ FlexTime Server running on http://localhost:${PORT}`);
  console.log(`🎨 Dashboard: http://localhost:${PORT}`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shut down');
    process.exit(0);
  });
});

// Keep the process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});