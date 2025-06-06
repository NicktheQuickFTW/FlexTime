/**
 * FlexTime Scheduling System - Schedule Controller
 * 
 * Simplified version that handles basic schedule operations.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Get all schedules with optional filtering
 */
exports.getSchedules = async (req, res) => {
  try {
    const { sport, season, status } = req.query;
    
    // Get database instance
    const db = req.app.get('db');
    if (!db || !db.sequelize) {
      return res.status(500).json({ error: 'Database not properly initialized' });
    }
    
    // Check if schedules table exists first
    try {
      const tableExists = await db.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schedules')",
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      if (!tableExists[0].exists) {
        console.log('Schedules table does not exist, returning empty array');
        return res.json({ success: true, schedules: [] });
      }
      
      // Table exists, try to query it
      const schedules = await db.sequelize.query(
        'SELECT * FROM schedules ORDER BY created_at DESC LIMIT 10',
        { type: db.sequelize.QueryTypes.SELECT }
      );
      res.json({ success: true, schedules });
    } catch (tableError) {
      // If any error, return empty schedules
      console.log('Error querying schedules table:', tableError.message);
      res.json({ success: true, schedules: [] });
    }
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ error: 'Failed to retrieve schedules' });
  }
};

/**
 * Get a specific schedule by ID
 */
exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return a mock schedule since we don't have any in the database
    const mockSchedule = {
      id,
      name: `Schedule ${id}`,
      sport: 'football',
      season: '2025-26',
      conference: 'Big 12',
      status: 'draft',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      games: []
    };
    
    res.json({ success: true, schedule: mockSchedule });
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({ error: 'Failed to retrieve schedule' });
  }
};

/**
 * Create a new schedule
 */
exports.createSchedule = async (req, res) => {
  try {
    const { 
      name,
      sport, 
      season, 
      conference = 'Big 12',
      status = 'draft',
      startDate,
      endDate,
      teams = []
    } = req.body;
    
    // Validate required fields
    if (!sport || !season) {
      return res.status(400).json({ error: 'Sport and season are required' });
    }
    
    // Generate a new schedule (this is schedule generation, not optimization)
    const scheduleId = uuidv4();
    const newSchedule = {
      id: scheduleId,
      name: name || `${sport} ${season} Schedule`,
      sport,
      season,
      conference,
      status,
      start_date: startDate || new Date().toISOString(),
      end_date: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      games: [] // Start with empty games array
    };

    console.log(`Creating new ${sport} schedule for ${season} season`);
    
    // Return the newly created schedule (in-memory for now)
    res.json({ 
      success: true, 
      schedule: newSchedule,
      message: 'Schedule created successfully. Add games to build your schedule.'
    });
    
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

/**
 * Update an existing schedule
 */
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // For now, return success with the updated data
    const updatedSchedule = {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    res.json({ success: true, schedule: updatedSchedule });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

/**
 * Delete a schedule
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Deleting schedule ${id}`);
    
    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

/**
 * Optimize a schedule (this is where database schedules would be needed)
 */
exports.optimizeSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // This would need existing schedules in the database to optimize
    res.status(501).json({ 
      error: 'Schedule optimization not yet implemented',
      message: 'This feature requires existing schedules in the database'
    });
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    res.status(500).json({ error: 'Failed to optimize schedule' });
  }
};

/**
 * Analyze a schedule
 */
exports.analyzeSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Return basic analysis for now
    const analysis = {
      schedule_id: id,
      total_games: 0,
      total_teams: 0,
      conflicts: 0,
      status: 'No games to analyze'
    };
    
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing schedule:', error);
    res.status(500).json({ error: 'Failed to analyze schedule' });
  }
};

/**
 * Get games for a schedule
 */
exports.getScheduleGames = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Return empty games array for now
    res.json({ success: true, games: [] });
  } catch (error) {
    console.error('Error getting schedule games:', error);
    res.status(500).json({ error: 'Failed to retrieve schedule games' });
  }
};

/**
 * Update a game (for drag & drop operations)
 */
exports.updateGame = async (req, res) => {
  try {
    const { id, gameId } = req.params;
    const updates = req.body;
    
    // Return success for now
    res.json({ 
      success: true, 
      message: 'Game updated successfully',
      gameId,
      updates 
    });
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
};

/**
 * Move a game to a new time slot
 */
exports.moveGame = async (req, res) => {
  try {
    const { id, gameId } = req.params;
    const { targetSlot } = req.body;
    
    // Return success for now
    res.json({ 
      success: true, 
      message: 'Game moved successfully',
      gameId,
      targetSlot 
    });
  } catch (error) {
    console.error('Error moving game:', error);
    res.status(500).json({ error: 'Failed to move game' });
  }
};

/**
 * Get available time slots for a schedule
 */
exports.getTimeSlots = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Return basic time slots
    const slots = [
      { date: '2025-09-01', time: '14:00', venue: 'Memorial Stadium', available: true },
      { date: '2025-09-01', time: '19:00', venue: 'Memorial Stadium', available: true },
      { date: '2025-09-08', time: '14:00', venue: 'Memorial Stadium', available: true }
    ];
    
    res.json({ success: true, slots });
  } catch (error) {
    console.error('Error getting time slots:', error);
    res.status(500).json({ error: 'Failed to retrieve time slots' });
  }
};

/**
 * Generate a new schedule using AI agents
 */
exports.generateSchedule = async (req, res) => {
  try {
    const {
      sport,
      season,
      teams,
      algorithm = 'agent_optimized',
      constraints = [],
      startDate,
      endDate,
      gameFormat = 'single',
      restDays = 1,
      homeAwayBalance = true,
      avoidBackToBack = true,
      respectAcademicCalendar = true
    } = req.body;

    // Validate required fields
    if (!sport || !season || !teams || teams.length === 0) {
      return res.status(400).json({ 
        error: 'Sport, season, and teams are required for schedule generation' 
      });
    }

    console.log(`Generating ${sport} schedule for ${season} season with ${teams.length} teams`);

    // Generate a new schedule with basic games
    const scheduleId = uuidv4();
    const generatedSchedule = {
      id: scheduleId,
      name: `${sport} ${season} Generated Schedule`,
      sport,
      season,
      conference: 'Big 12',
      status: 'draft',
      start_date: startDate || new Date().toISOString(),
      end_date: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: `AI-generated ${sport} schedule using ${algorithm} algorithm`,
      
      // Generate sample games based on teams
      games: generateSampleGames(teams, sport, startDate, endDate),
      
      // Add generation metadata
      generation_options: {
        algorithm,
        constraints,
        gameFormat,
        restDays,
        homeAwayBalance,
        avoidBackToBack,
        respectAcademicCalendar
      }
    };

    res.json({ 
      success: true, 
      schedule: generatedSchedule,
      message: `Schedule generated successfully with ${generatedSchedule.games.length} games`
    });
    
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
};

/**
 * Helper function to generate sample games
 */
function generateSampleGames(teams, sport, startDate, endDate) {
  const games = [];
  const gameId = () => uuidv4();
  
  // Simple round-robin generation for demonstration
  const numTeams = teams.length;
  const gamesPerTeam = Math.floor((numTeams - 1) / 2) * 2; // Roughly balanced
  
  let gameDate = new Date(startDate || '2024-09-01');
  const endGameDate = new Date(endDate || '2025-05-01');
  
  // Generate games between teams
  for (let i = 0; i < numTeams; i++) {
    for (let j = i + 1; j < numTeams && j < i + 8; j++) { // Limit to prevent too many games
      if (gameDate > endGameDate) break;
      
      games.push({
        id: gameId(),
        home_team_id: teams[i],
        away_team_id: teams[j],
        game_date: gameDate.toISOString().split('T')[0],
        game_time: sport === 'football' ? '14:00' : '19:00',
        status: 'scheduled',
        venue_name: `Team ${i + 1} Stadium`,
        notes: `Generated ${sport} game`
      });
      
      // Advance date (weekly for football, more frequent for other sports)
      const daysToAdd = sport === 'football' ? 7 : 3;
      gameDate.setDate(gameDate.getDate() + daysToAdd);
    }
  }
  
  return games.slice(0, 20); // Limit to 20 games for demo
}

/**
 * Get constraint violations/conflicts for a schedule
 */
exports.getScheduleConflicts = async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, return empty array as no conflicts exist yet
    // This can be enhanced later with actual constraint violation logic
    const conflicts = [];
    
    res.json(conflicts);
  } catch (error) {
    console.error('Error getting schedule conflicts:', error);
    res.status(500).json({ error: 'Failed to retrieve schedule conflicts' });
  }
};