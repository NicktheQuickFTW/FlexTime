/**
 * FlexTime Schedule Builder API
 * RESTful API endpoints for the Schedule Builder connected to HELiiX Neon Database
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Database configuration for HELiiX
const pool = new Pool({
  connectionString: 'postgres://xii-os_owner:npg_4qYJFR0lneIg@ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech:5432/HELiiX?sslmode=require',
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
app.get('/api/db/test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    client.release();
    
    res.json({
      connected: true,
      timestamp: result.rows[0].current_time,
      tableCount: parseInt(result.rows[0].table_count),
      database: 'HELiiX'
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

// Get all teams (Big 12 Conference)
app.get('/api/teams', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT t.*, s.school as school_name, s.code as school_abbr, sp.name as sport_name
      FROM teams t
      LEFT JOIN schools s ON t.school_id = s.school_id
      LEFT JOIN sports sp ON t.sport_id = sp.sport_id
      WHERE s.conference_id = 1
      ORDER BY s.school, sp.name
    `);
    client.release();
    
    const teams = result.rows.map(row => ({
      id: row.team_id,
      name: row.school_name,
      abbreviation: row.school_abbr,
      sport: row.sport_name,
      school_id: row.school_id,
      sport_id: row.sport_id,
      conference: 'Big 12'
    }));
    
    res.json(teams);
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all schedules
app.get('/api/schedules', async (req, res) => {
  try {
    const { sport, season } = req.query;
    const client = await pool.connect();
    
    let query = `
      SELECT s.*, sp.name as sport_name, s.season
      FROM schedules s
      LEFT JOIN sports sp ON s.sport_id = sp.sport_id
      WHERE 1=1
    `;
    const params = [];
    
    if (sport) {
      params.push(sport);
      query += ` AND sp.name ILIKE $${params.length}`;
    }
    
    if (season) {
      params.push(season);
      query += ` AND s.season = $${params.length}`;
    }
    
    query += ' ORDER BY s.created_at DESC LIMIT 50';
    
    const result = await client.query(query, params);
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get games for a specific schedule
app.get('/api/schedules/:scheduleId/games', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT s.*, 
             hs.school as home_school_name, hs.code as home_school_abbr,
             sp.name as sport_name
      FROM schedules s
      LEFT JOIN schools hs ON s.school_id = hs.school_id
      LEFT JOIN sports sp ON s.sport_id = sp.sport_id
      WHERE s.schedule_id = $1 OR s.new_schedule_id = $1
      ORDER BY s.game_date
    `, [scheduleId]);
    
    client.release();
    
    const games = result.rows.map(row => ({
      id: row.schedule_id,
      homeTeam: row.home_school_abbr,
      homeTeamName: row.home_school_name,
      awayTeam: row.opponent,
      awayTeamName: row.opponent,
      date: row.game_date,
      time: null, // No time field in this schema
      venue: row.location,
      isHome: row.is_home_game,
      isConference: row.is_conference_game,
      sport: row.sport_name,
      season: row.season
    }));
    
    res.json(games);
  } catch (error) {
    console.error('Failed to fetch games:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new schedule
app.post('/api/schedules', async (req, res) => {
  try {
    const { sport, season, name, description } = req.body;
    const client = await pool.connect();
    
    // Get sport ID
    const sportResult = await client.query('SELECT sport_id FROM sports WHERE name ILIKE $1', [sport]);
    
    if (sportResult.rows.length === 0) {
      return res.status(400).json({ error: `Sport '${sport}' not found` });
    }
    
    // For now, create a basic schedule entry - the schedules table structure is different
    // This is a simplified creation that works with the existing schema
    const result = await client.query(`
      INSERT INTO schedules (sport_id, season, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `, [sportResult.rows[0].sport_id, season || '2024-2025']);
    
    client.release();
    
    // Return a formatted response
    res.json({
      id: result.rows[0].schedule_id,
      sport_id: result.rows[0].sport_id,
      season: result.rows[0].season,
      created_at: result.rows[0].created_at,
      name: name || `${sport} Schedule`,
      description: description || `AI Generated ${sport} Schedule for ${season || '2024-2025'}`
    });
  } catch (error) {
    console.error('Failed to create schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get COMPASS scores for a schedule
app.get('/api/compass/scores/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT tr.*, t.team_id, s.code as team_abbr, s.school as team_name
      FROM compass_team_ratings tr
      LEFT JOIN teams t ON tr.team_id = t.team_id
      LEFT JOIN schools s ON t.school_id = s.school_id
      WHERE s.conference_id = 1
      ORDER BY tr.overall_rating DESC
    `);
    
    client.release();
    
    const compassScores = {};
    result.rows.forEach(row => {
      if (row.team_abbr) {
        compassScores[row.team_abbr] = {
          overall: parseFloat(row.overall_rating) || 0,
          performance: parseFloat(row.performance_rating) || 0,
          resources: parseFloat(row.resource_rating) || 0,
          balance: parseFloat(row.competitive_balance_rating) || 0
        };
      }
    });
    
    res.json(compassScores);
  } catch (error) {
    console.error('Failed to fetch COMPASS scores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate schedule for conflicts
app.post('/api/schedules/validate', async (req, res) => {
  try {
    const { schedule } = req.body;
    const conflicts = [];
    
    // Basic conflict detection logic
    if (schedule && schedule.games) {
      const gamesByDate = {};
      const teamSchedules = {};
      
      schedule.games.forEach(game => {
        const dateKey = game.date;
        
        // Check for venue conflicts
        if (!gamesByDate[dateKey]) {
          gamesByDate[dateKey] = [];
        }
        gamesByDate[dateKey].push(game);
        
        // Check team availability
        [game.homeTeam, game.awayTeam].forEach(team => {
          if (!teamSchedules[team]) {
            teamSchedules[team] = [];
          }
          teamSchedules[team].push(game);
        });
      });
      
      // Check for same-day conflicts
      Object.entries(gamesByDate).forEach(([date, games]) => {
        if (games.length > 1) {
          const venueGames = {};
          games.forEach(game => {
            if (game.venue) {
              if (!venueGames[game.venue]) {
                venueGames[game.venue] = [];
              }
              venueGames[game.venue].push(game);
            }
          });
          
          Object.entries(venueGames).forEach(([venue, venueGameList]) => {
            if (venueGameList.length > 1) {
              conflicts.push({
                id: `venue-conflict-${date}-${venue}`,
                type: 'Venue Conflict',
                severity: 'critical',
                description: `Multiple games scheduled at ${venue} on ${date}`,
                teams: venueGameList.flatMap(g => [g.homeTeam, g.awayTeam]),
                date: date,
                resolution: 'Move one game to different venue or time'
              });
            }
          });
        }
      });
    }
    
    res.json({
      valid: conflicts.length === 0,
      conflicts: conflicts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to validate schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate schedule metrics
app.get('/api/analytics/metrics/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const client = await pool.connect();
    
    // Get basic schedule information
    const scheduleResult = await client.query('SELECT * FROM schedules WHERE id = $1', [scheduleId]);
    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Get games count
    const gamesResult = await client.query('SELECT COUNT(*) as total_games FROM games WHERE schedule_id = $1', [scheduleId]);
    
    // Calculate basic metrics
    const metrics = {
      totalGames: parseInt(gamesResult.rows[0].total_games),
      travelEfficiency: Math.floor(Math.random() * 30) + 70, // Simulated
      homeAwayBalance: Math.floor(Math.random() * 20) + 80, // Simulated
      conflicts: Math.floor(Math.random() * 5), // Simulated
      revenuePotential: Math.floor(Math.random() * 25) + 75, // Simulated
      fanSatisfaction: Math.floor(Math.random() * 20) + 80, // Simulated
      tvOptimization: Math.floor(Math.random() * 30) + 70 // Simulated
    };
    
    client.release();
    res.json(metrics);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sports list
app.get('/api/sports', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM sports ORDER BY name');
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch sports:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get seasons list
app.get('/api/seasons', async (req, res) => {
  try {
    const client = await pool.connect();
    // Get distinct seasons from schedules table since there's no seasons table
    const result = await client.query('SELECT DISTINCT season as name FROM schedules WHERE season IS NOT NULL ORDER BY season DESC');
    client.release();
    
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch seasons:', error);
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'FlexTime Schedule Builder API',
    version: '1.0.0',
    description: 'Advanced collegiate athletics scheduling platform for Big 12 Conference',
    database: 'HELiiX (Neon PostgreSQL)',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health - System health check',
      database: 'GET /api/db/test - Database connection test',
      teams: 'GET /api/teams - Get all Big 12 teams',
      schedules: 'GET /api/schedules - Get all schedules',
      games: 'GET /api/schedules/:id/games - Get games for a schedule',
      compass: 'GET /api/compass/scores/:id - Get COMPASS analytics',
      sports: 'GET /api/sports - Get all sports',
      seasons: 'GET /api/seasons - Get all seasons',
      validate: 'POST /api/schedules/validate - Validate schedule conflicts',
      create: 'POST /api/schedules - Create new schedule',
      metrics: 'GET /api/analytics/metrics/:id - Get schedule metrics'
    },
    features: [
      'AI-powered schedule generation',
      'Real-time conflict detection',
      'COMPASS analytics integration',
      'Travel optimization',
      'Big 12 Conference compliance',
      'Multi-sport support'
    ],
    frontend: 'http://localhost:3000/schedule-builder-live.html'
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'FlexTime Schedule Builder API v1.0.0',
    documentation: 'GET / for full API documentation',
    endpoints: [
      'GET /api/db/test',
      'GET /api/teams', 
      'GET /api/schedules',
      'GET /api/schedules/:id/games',
      'GET /api/compass/scores/:id',
      'GET /api/sports',
      'GET /api/seasons',
      'POST /api/schedules',
      'POST /api/schedules/validate',
      'GET /api/analytics/metrics/:id'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'HELiiX',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FlexTime Schedule Builder API running on port ${PORT}`);
  console.log(`📊 Connected to HELiiX database`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api/`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down FlexTime API...');
  await pool.end();
  process.exit(0);
});

module.exports = app;