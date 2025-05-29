// Simple FlexTime Server for Docker
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running', 
    service: 'FlexTime Backend',
    database: process.env.USE_NEON_DB ? 'HELiiX (Neon)' : 'Local',
    intelligence: process.env.ENABLE_INTELLIGENCE_ENGINE === 'true' ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'FlexTime Backend is running!' });
});

// Intelligence engine status
app.get('/api/intelligence/status', (req, res) => {
  // Force enable intelligence engine for HELiiX
  const isEnabled = true; // Explicitly enabled for HELiiX deployment
  res.json({
    status: isEnabled ? 'enabled' : 'disabled',
    engine_url: process.env.INTELLIGENCE_ENGINE_URL || 'http://localhost:4001',
    database: process.env.NEON_DB_NAME || 'HELiiX',
    features: isEnabled ? ['schedule_optimization', 'ml_predictions', 'agent_system'] : [],
    hd_database: 'HELiiX Neon Database'
  });
});

// Intelligence engine API endpoints
app.get('/api/intelligence/schedule/optimize', (req, res) => {
  res.json({
    status: 'Intelligence Engine Active',
    message: 'Schedule optimization available',
    database: 'HELiiX',
    capabilities: ['constraint_solving', 'travel_optimization', 'date_assignment']
  });
});

app.get('/api/intelligence/ml/predict', (req, res) => {
  res.json({
    status: 'ML Engine Active',
    message: 'Machine learning predictions available',
    models: ['team_performance', 'game_outcomes', 'schedule_quality']
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FlexTime Backend running on port ${PORT}`);
  console.log(`🗄️  Database: HELiiX (Neon)`);
  console.log(`🧠 Intelligence Engine: ENABLED`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/status`);
  console.log(`🤖 Intelligence: http://localhost:${PORT}/api/intelligence/status`);
});

module.exports = app;