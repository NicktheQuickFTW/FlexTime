const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'flextime-jwt-secret-key-change-in-production';

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Neon DB connection
const pool = new Pool({
  connectionString: 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require',
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

// Test database connection and initialize user tables
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to HELiiX database:', err);
  } else {
    console.log('✅ Connected to HELiiX database successfully');
    
    // Initialize user authentication tables
    try {
      await initializeUserTables();
      console.log('✅ User authentication tables initialized');
    } catch (error) {
      console.error('❌ Error initializing user tables:', error);
    }
    
    release();
  }
});

// Initialize user authentication tables
async function initializeUserTables() {
  const client = await pool.connect();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Create user_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create user_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        setting_id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
        settings_json JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add user_id to schedules table if it doesn't exist
    await client.query(`
      ALTER TABLE schedules 
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(user_id)
    `);

    console.log('📋 User tables created/updated successfully');
  } finally {
    client.release();
  }
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Optional auth middleware (allows both authenticated and unauthenticated access)
function optionalAuth(req, res, next) {
  const token = req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
}

// Add CORS headers to allow external scripts
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the React app
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Serve static files
app.use(express.static(__dirname));

// Initialize Agent System (temporarily disabled)
let agentSystem = {
  initialize: () => Promise.resolve(),
  // Add mock methods as needed
};

// Store agent system in app locals for route access
app.locals.agentSystem = agentSystem;

console.log('⚠️  Agent System initialization skipped - running in development mode');

// Travel Optimization Routes (temporarily disabled)
// const travelOptimizationRoutes = require('../backend/routes/travelOptimizationRoutes');
// app.use('/api/travel-optimization', travelOptimizationRoutes);

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints for future integration
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      scheduling: 'active',
      analytics: 'active',
      optimization: 'active',
      'ag-ui-frontend': 'active'
    }
  });
});

// Database test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Database connection test successful',
    timestamp: new Date().toISOString()
  });
});

// Database initialization endpoint
app.get('/api/initialize', (req, res) => {
  res.json({ 
    success: true,
    message: 'API initialized successfully',
    timestamp: new Date().toISOString()
  });
});

// ==================== AUTHENTICATION ENDPOINTS ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING user_id, email, first_name, last_name, created_at',
      [email, passwordHash, firstName, lastName]
    );
    
    const user = result.rows[0];
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set secure cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log(`✅ New user registered: ${email}`);
    
    res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const result = await pool.query(
      'SELECT user_id, email, password_hash, first_name, last_name, is_active FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set secure cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    console.log(`✅ User logged in: ${email}`);
    
    res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout user
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, email, first_name, last_name, created_at, last_login FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
      lastLogin: user.last_login
    });
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW() WHERE user_id = $3 RETURNING user_id, email, first_name, last_name',
      [firstName, lastName, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==================== USER SETTINGS ENDPOINTS ====================

// Get user settings
app.get('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT settings_json FROM user_settings WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({});
    }
    
    res.json(result.rows[0].settings_json);
  } catch (error) {
    console.error('❌ Get user settings error:', error);
    res.status(500).json({ error: 'Failed to get user settings' });
  }
});

// Save user settings
app.post('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    
    // Upsert user settings
    await pool.query(`
      INSERT INTO user_settings (user_id, settings_json) 
      VALUES ($1, $2) 
      ON CONFLICT (user_id) 
      DO UPDATE SET settings_json = $2, updated_at = NOW()
    `, [req.user.userId, JSON.stringify(settings)]);
    
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('❌ Save user settings error:', error);
    res.status(500).json({ error: 'Failed to save user settings' });
  }
});

// Teams API - get teams for a specific conference
app.get('/api/teams', async (req, res) => {
  try {
    const { conference = 'BIG12', sport } = req.query;
    
    let query = `
      SELECT 
        s.school_id as id,
        s.school as name,
        s.short_display as short_name,
        s.school_abbreviation as abbreviation,
        s.mascot,
        COALESCE(s.location, '') as location,
        s.primary_color,
        s.secondary_color,
        'BIG12' as conference,
        s.website
      FROM schools s
    `;
    
    // Add sport filter if provided
    if (sport) {
      query += `
        JOIN teams t ON s.school_id = t.school_id
        JOIN sports sp ON t.sport_id = sp.sport_id
        WHERE LOWER(sp.code) = LOWER($1)
      `;
    } else {
      query += `
        WHERE $1 = 'all' OR EXISTS (
          SELECT 1 FROM teams t 
          WHERE t.school_id = s.school_id
        )
      `;
    }
    
    query += `
      ORDER BY s.school;
    `;
    
    console.log('Executing query:', query, [sport || 'all']);
    const result = await pool.query(query, [sport || 'all']);
    
    console.log(`📊 Found ${result.rows.length} teams for ${sport || 'all sports'}`);
    
    // Transform the data to match the expected frontend format
    const teams = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      short_name: row.short_name || row.name,
      abbreviation: row.abbreviation,
      mascot: row.mascot || '',
      location: row.location || '',
      primary_color: row.primary_color || '#000000',
      secondary_color: row.secondary_color || '#FFFFFF',
      conference: row.conference || 'BIG12',
      website: row.website || ''
    }));
    
    res.json(teams);
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teams',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Schedules API - get schedules by sport and season (user-specific)
app.get('/api/schedules', optionalAuth, async (req, res) => {
  try {
    const { sport, season } = req.query;
    
    // Check if schedules table exists first
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schedules'
      );
    `;
    
    const tableExists = await pool.query(tableCheckQuery);
    
    if (!tableExists.rows[0].exists) {
      console.log('📊 Schedules table does not exist yet, returning empty array');
      return res.json([]);
    }
    
    let query = `
      SELECT 
        s.schedule_id as id,
        s.year,
        s.sport_id,
        COALESCE(s.user_id, NULL) as user_id
      FROM schedules s
    `;
    
    const params = [];
    const conditions = [];
    
    // Only show user's schedules if authenticated
    if (req.user) {
      conditions.push(`(s.user_id = $${params.length + 1} OR s.user_id IS NULL)`);
      params.push(req.user.userId);
    } else {
      // Show only public schedules for unauthenticated users
      conditions.push('(s.user_id IS NULL OR s.user_id IS NULL)');
    }
    
    if (season) {
      conditions.push(`s.year = $${params.length + 1}`);
      params.push(season);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY s.schedule_id DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    console.log(`📊 Found ${result.rows.length} schedules for ${sport}/${season} (user: ${req.user?.userId || 'anonymous'})`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching schedules:', error);
    // Return empty array instead of error to prevent frontend crashes
    res.json([]);
  }
});

// Games API - get games for a specific schedule
app.get('/api/schedules/:scheduleId/games', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const query = `
      SELECT 
        g.game_id as id,
        g.game_date as date,
        g.start_time as time,
        ht.name as home_team,
        at.name as away_team,
        hi.abbreviation as home_abbr,
        ai.abbreviation as away_abbr,
        v.name as venue,
        g.tv_network as tv,
        g.status,
        g.special_designation
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.team_id
      JOIN teams at ON g.away_team_id = at.team_id
      JOIN institutions hi ON ht.school_id = hi.school_id
      JOIN institutions ai ON at.school_id = ai.school_id
      LEFT JOIN venues v ON g.venue_id = v.venue_id
      WHERE g.schedule_id = $1
      ORDER BY g.game_date, g.start_time
    `;
    
    const result = await pool.query(query, [scheduleId]);
    console.log(`📊 Found ${result.rows.length} games for schedule ${scheduleId}`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Create new schedule (user-specific)
app.post('/api/schedules', optionalAuth, async (req, res) => {
  try {
    const { sport, season, conference, games, generatedAt, status } = req.body;
    
    // First, get or create the sport
    let sportQuery = 'SELECT sport_id FROM sports WHERE LOWER(name) LIKE $1';
    let sportResult = await pool.query(sportQuery, [`%${sport.toLowerCase()}%`]);
    
    let sportId;
    if (sportResult.rows.length === 0) {
      // Create new sport if it doesn't exist
      const insertSport = 'INSERT INTO sports (name, abbreviation) VALUES ($1, $2) RETURNING sport_id';
      const newSport = await pool.query(insertSport, [sport, sport.toUpperCase()]);
      sportId = newSport.rows[0].sport_id;
    } else {
      sportId = sportResult.rows[0].sport_id;
    }
    
    // Create the schedule with user association
    const scheduleQuery = `
      INSERT INTO schedules (sport_id, year, start_date, end_date, status, metadata, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING schedule_id
    `;
    
    const startDate = games.length > 0 ? games[0].date : new Date();
    const endDate = games.length > 0 ? games[games.length - 1].date : new Date();
    
    const scheduleResult = await pool.query(scheduleQuery, [
      sportId,
      season,
      startDate,
      endDate,
      status || 'active',
      JSON.stringify({ generatedAt, conference, gameCount: games.length }),
      req.user?.userId || null // Associate with user if authenticated
    ]);
    
    const scheduleId = scheduleResult.rows[0].schedule_id;
    const userName = req.user ? `user ${req.user.userId}` : 'anonymous';
    console.log(`✅ Created schedule ${scheduleId} with ${games.length} games for ${userName}`);
    
    res.json({ 
      success: true, 
      id: scheduleId, 
      name: `${sport} ${season}`,
      gameCount: games.length 
    });
  } catch (error) {
    console.error('❌ Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// AG-UI Frontend Agent endpoint
app.post('/api/frontend-agent', express.json(), (req, res) => {
  const { command, params } = req.body;
  
  // Process frontend modification commands
  res.json({
    success: true,
    command,
    params,
    timestamp: new Date().toISOString(),
    message: `Frontend command '${command}' received and processed`
  });
});

// AG-UI event streaming endpoint (Server-Sent Events)
app.get('/api/frontend-events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection event
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'AG-UI frontend events stream connected'
  })}\n\n`);
  
  // Keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 30000);
  
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

app.get('/api/teams', (req, res) => {
  const teams = [
    { id: 1, name: 'Arizona Wildcats', code: 'ARIZ', conference: 'Big 12' },
    { id: 2, name: 'Arizona State Sun Devils', code: 'ASU', conference: 'Big 12' },
    { id: 3, name: 'Baylor Bears', code: 'BAY', conference: 'Big 12' },
    { id: 4, name: 'BYU Cougars', code: 'BYU', conference: 'Big 12' },
    { id: 5, name: 'Cincinnati Bearcats', code: 'CIN', conference: 'Big 12' },
    { id: 6, name: 'Colorado Buffaloes', code: 'COL', conference: 'Big 12' },
    { id: 7, name: 'Houston Cougars', code: 'HOU', conference: 'Big 12' },
    { id: 8, name: 'Iowa State Cyclones', code: 'ISU', conference: 'Big 12' },
    { id: 9, name: 'Kansas Jayhawks', code: 'KU', conference: 'Big 12' },
    { id: 10, name: 'Kansas State Wildcats', code: 'KSU', conference: 'Big 12' },
    { id: 11, name: 'Oklahoma State Cowboys', code: 'OSU', conference: 'Big 12' },
    { id: 12, name: 'TCU Horned Frogs', code: 'TCU', conference: 'Big 12' },
    { id: 13, name: 'Texas Tech Red Raiders', code: 'TTU', conference: 'Big 12' },
    { id: 14, name: 'UCF Knights', code: 'UCF', conference: 'Big 12' },
    { id: 15, name: 'Utah Utes', code: 'UTAH', conference: 'Big 12' },
    { id: 16, name: 'West Virginia Mountaineers', code: 'WVU', conference: 'Big 12' }
  ];
  res.json({ success: true, data: teams });
});

app.get('/api/schedules', (req, res) => {
  const schedules = [
    { id: 1, homeTeam: 'KU', awayTeam: 'OSU', date: '2025-01-15', venue: 'Allen Fieldhouse', sport: 'Basketball' },
    { id: 2, homeTeam: 'BYU', awayTeam: 'CIN', date: '2025-01-18', venue: 'Marriott Center', sport: 'Basketball' },
    { id: 3, homeTeam: 'TTU', awayTeam: 'WVU', date: '2025-01-22', venue: 'United Supermarkets Arena', sport: 'Basketball' },
    { id: 4, homeTeam: 'UCF', awayTeam: 'HOU', date: '2025-01-25', venue: 'Addition Financial Arena', sport: 'Basketball' }
  ];
  res.json({ success: true, data: schedules });
});

// Serve static assets in production
if (isProduction) {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, 'build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running in ${isProduction ? 'production' : 'development'} mode on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API Status: http://localhost:${PORT}/api/status`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});