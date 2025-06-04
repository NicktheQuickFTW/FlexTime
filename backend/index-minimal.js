// FlexTime Scheduling System - Minimal Entry Point
console.log('🚀 FlexTime Scheduling System Starting (Minimal Configuration)');

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0-minimal'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    message: 'FlexTime API is running',
    status: 'active',
    timestamp: new Date().toISOString(),
    version: '2.0.0-minimal'
  });
});

app.get('/api/teams', (req, res) => {
  res.json({
    message: 'Teams endpoint available',
    data: [],
    timestamp: new Date().toISOString()
  });
});

// Serve static files for development
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Basic error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl
  });
});

// Port setting
const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 FlexTime Minimal Server running on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;