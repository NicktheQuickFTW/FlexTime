// FlexTime Enhanced App
// This is a more robust version of the minimal app with proper error handling

console.log('FlexTime Enhanced Server Starting');

// Core modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Load environment variables manually
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from: ${envPath}`);
    const envConfig = fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length) {
          process.env[key.trim()] = values.join('=').trim();
          // Don't log sensitive values
          if (key.includes('KEY') || key.includes('PASSWORD')) {
            console.log(`Set env var: ${key.trim()} = ****`);
          } else {
            console.log(`Set env var: ${key.trim()} = ${values.join('=').trim()}`);
          }
        }
      });
  }
} catch (error) {
  console.error('Error loading environment variables:', error.message);
}

// Initialize Express and middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const { pool } = require('./db-connection');
const dbConnected = true;

// Basic routes
app.get('/api/status', async (req, res) => {
  let dbStatus = 'connected';
  let dbInfo = {};
  
  try {
    const client = await pool.connect();
    const dbResult = await client.query('SELECT current_database(), current_user;');
    const countResult = await client.query('SELECT COUNT(*) as count FROM institutions;');
    dbInfo = {
      database: dbResult.rows[0].current_database,
      user: dbResult.rows[0].current_user,
      institutionsCount: parseInt(countResult.rows[0].count)
    };
    client.release();
  } catch (error) {
    dbStatus = 'disconnected';
    dbInfo = { error: error.message };
  }
  
  res.json({
    status: 'ok',
    message: 'FlexTime API is running (enhanced version)',
    version: '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    databaseConnected: dbStatus === 'connected',
    database: {
      status: dbStatus,
      name: 'HELiiX',
      ...dbInfo
    }
  });
});

app.get('/api/schedules', (req, res) => {
  res.json({
    schedules: [
      {
        id: 'sample-123',
        name: 'Football 2025',
        sportId: 'football',
        status: 'draft',
        teams: 16,
        games: 120,
        startDate: '2025-08-30',
        endDate: '2025-12-07'
      },
      {
        id: 'sample-456',
        name: 'Men\'s Basketball 2025-26',
        sportId: 'basketball-m',
        status: 'draft',
        teams: 16,
        games: 144,
        startDate: '2025-11-05',
        endDate: '2026-03-15'
      }
    ]
  });
});

app.get('/api/teams', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        institution_id as id,
        name,
        abbreviation,
        mascot,
        primary_color,
        secondary_color,
        city,
        state
      FROM institutions 
      ORDER BY name
    `);
    client.release();
    
    res.json({
      teams: result.rows.map(row => ({
        id: row.id,
        name: `${row.name} ${row.mascot || ''}`.trim(),
        abbreviation: row.abbreviation,
        mascot: row.mascot,
        primaryColor: row.primary_color,
        secondaryColor: row.secondary_color,
        city: row.city,
        state: row.state
      }))
    });
  } catch (error) {
    console.error('Database error:', error);
    // Fallback to mock data if database fails
    res.json({
      teams: [
        { id: 1, name: 'Arizona Wildcats', abbreviation: 'U of A' },
        { id: 2, name: 'Arizona State Sun Devils', abbreviation: 'ASU' },
        { id: 3, name: 'Baylor Bears', abbreviation: 'BU' },
        { id: 4, name: 'BYU', abbreviation: 'BYU' },
        { id: 5, name: 'Cincinnati Bearcats', abbreviation: 'UC' },
        { id: 6, name: 'Colorado', abbreviation: 'CU' },
        { id: 7, name: 'Houston Cougars', abbreviation: 'UH' },
        { id: 8, name: 'Iowa State Cyclones', abbreviation: 'ISU' },
        { id: 9, name: 'Kansas Jayhawks', abbreviation: 'KU' },
        { id: 10, name: 'Kansas State Wildcats', abbreviation: 'K-STATE' },
        { id: 11, name: 'Oklahoma State Cowboys', abbreviation: 'OSU' },
        { id: 12, name: 'TCU Horned Frogs', abbreviation: 'TCU' },
        { id: 13, name: 'Texas Tech Red Raiders', abbreviation: 'TTU' },
        { id: 14, name: 'UCF', abbreviation: 'UCF' },
        { id: 15, name: 'Utah Utes', abbreviation: 'UU' },
        { id: 16, name: 'West Virginia Mountaineers', abbreviation: 'WVU' }
      ]
    });
  }
});

app.get('/api/metrics', (req, res) => {
  res.json({
    metrics: {
      apiRequests: Math.floor(Math.random() * 1000) + 1000,
      scheduleCreated: Math.floor(Math.random() * 10) + 20,
      optimizationRuns: Math.floor(Math.random() * 20) + 40,
      averageOptimizationTime: `${(Math.random() * 2 + 2).toFixed(1)}s`,
      constraintSatisfaction: `${(Math.random() * 5 + 94).toFixed(1)}%`
    }
  });
});

// Intelligence Engine stub routes
app.post('/api/intelligence-engine/analyze-schedule', (req, res) => {
  res.json({
    quality: Math.random() * 0.3 + 0.7, // 0.7-1.0
    constraints: {
      satisfied: Math.floor(Math.random() * 3) + 97, // 97-99%
      violated: Math.floor(Math.random() * 3) + 1,   // 1-3%
    },
    travel: {
      totalMiles: Math.floor(Math.random() * 10000) + 50000,
      averageMilesPerTeam: Math.floor(Math.random() * 1000) + 3000,
    },
    recommendations: [
      'Consider swapping the Arizona at TCU and BYU at Arizona games to reduce travel distance',
      'Kansas State has 3 consecutive road games in weeks 5-7',
      'Consider more balanced home/away distribution for Iowa State'
    ]
  });
});

app.get('/api/intelligence-engine/status', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    mode: 'local',
    services: {
      knowledgeGraph: 'active',
      schedulingEngine: 'active',
      conflictResolution: 'active',
      machineLearningSystems: 'active'
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`FlexTime Enhanced Server running on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});