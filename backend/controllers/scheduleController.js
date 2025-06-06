/**
 * FlexTime Scheduling System - Schedule Controller
 * 
 * Handles API requests for schedule management.
 */

const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { RoundRobinGenerator, PartialRoundRobinGenerator } = require('../src/algorithms/schedule-generator');
const { SimulatedAnnealingOptimizer, TravelOptimizationPipeline } = require('../src/algorithms/schedule-optimizer');
const DateAssigner = require('../src/algorithms/date-assigner');
const Schedule = require('../models/schedule');
const Team = require('../models/team');
const Game = require('../models/game');
const Venue = require('../models/venue');
const Location = require('../models/location');
const { Constraint, RestDaysConstraint, MaxConsecutiveAwayConstraint } = require('../models/constraint');
const { SportType } = require('../models/types');

/**
 * Get all schedules with optional filtering
 */
exports.getSchedules = async (req, res) => {
  try {
    const { sport, season, status, championship_id } = req.query;
    
    // Build query filters
    const where = {};
    if (sport) where.sport_id = sport;
    if (season) where.season = season;
    if (status) where.status = status;
    if (championship_id) where.championship_id = championship_id;
    
    // Get schedules from database
    const schedules = await req.app.get('db').Schedule.findAll({
      where,
      include: [
        { model: req.app.get('db').Sport, as: 'sport' },
        { model: req.app.get('db').Championship, as: 'championship' }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json(schedules);
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
    
    // Get schedule from database with related data
    const schedule = await req.app.get('db').Schedule.findByPk(id, {
      include: [
        { model: req.app.get('db').Sport, as: 'sport' },
        { model: req.app.get('db').Championship, as: 'championship' },
        { 
          model: req.app.get('db').Team, 
          as: 'teams',
          through: { attributes: [] }
        },
        { 
          model: req.app.get('db').Game, 
          as: 'games',
          include: [
            { model: req.app.get('db').Team, as: 'homeTeam' },
            { model: req.app.get('db').Team, as: 'awayTeam' },
            { model: req.app.get('db').Venue, as: 'venue' }
          ]
        },
        { 
          model: req.app.get('db').ScheduleConstraint, 
          as: 'constraints' 
        }
      ]
    });
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    res.json(schedule);
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
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    
    const { 
      name, 
      sport_id, 
      championship_id, 
      season, 
      season_name,
      year,
      start_date, 
      end_date, 
      team_ids,
      generation_type,
      generation_options,
      useBig12Database = false
    } = req.body;
    
    console.log('Extracted fields:', { name, sport_id, season, season_name, year });
    
    // Validate required fields
    if (!name || !sport_id || !season || !start_date || !end_date || (!team_ids && !useBig12Database) || (!team_ids || !team_ids.length) && !useBig12Database) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create transaction
    const transaction = await req.app.get('db').sequelize.transaction();
    
    try {
      // Create schedule in database
      const schedule = await req.app.get('db').Schedule.create({
        name,
        sport_id,
        championship_id: championship_id || null,
        year: season_name || year || season, // Use season_name first, then year, then season
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status: 'draft',
        created_by: req.user ? req.user.id : null
      }, { transaction });
      
      // Associate teams with schedule
      if (!useBig12Database) {
        await req.app.get('db').sequelize.query(
          `INSERT INTO schedule_teams (schedule_id, team_id) VALUES ${team_ids.map(id => `(${schedule.schedule_id}, ${id})`).join(', ')}`,
          { transaction }
        );
      }
      
      // Fetch teams with venues
      let teams;
      if (useBig12Database) {
        teams = await req.app.get('db').Team.findAll({
          where: { conference_id: 'Big 12' },
          include: [
            { model: req.app.get('db').Institution, as: 'institution' },
            { model: req.app.get('db').Venue, as: 'primaryVenue' }
          ],
          transaction
        });
      } else {
        teams = await req.app.get('db').Team.findAll({
          where: { team_id: { [Op.in]: team_ids } },
          include: [
            { model: req.app.get('db').Institution, as: 'institution' },
            { model: req.app.get('db').Venue, as: 'primaryVenue' }
          ],
          transaction
        });
      }
      
      // Fetch sport
      const sport = await req.app.get('db').Sport.findByPk(sport_id, { transaction });
      
      // Check if we have the agent system available
      const agentSystem = req.app.get('agentSystem');
      
      if (agentSystem && generation_type !== 'legacy') {
        console.log('Using FlexTime v2 Agent System for schedule generation');
        
        // Convert database models to FlexTime models
        const flexTeams = teams.map(team => {
          // Ensure we're using the correct naming conventions for Big 12 institutions
          let teamName = team.institution.name;
          
          // Handle special cases for Big 12 institutions
          if (teamName === 'Texas Christian University') {
            teamName = 'TCU';
          } else if (teamName === 'University of Central Florida') {
            teamName = 'UCF';
          } else if (teamName === 'Brigham Young University') {
            teamName = 'BYU';
          }
          
          // Create location for team's primary venue
          const location = new Location(
            team.primaryVenue.name,
            team.primaryVenue.latitude,
            team.primaryVenue.longitude
          );
          
          // Create venue for team
          const venue = new Venue(
            team.primaryVenue.venue_id,
            team.primaryVenue.name,
            location,
            team.primaryVenue.capacity
          );
          
          // Create team
          return new Team(
            team.team_id,
            teamName,
            location,
            [venue]
          );
        });
        
        // Create default constraints based on sport type
        const constraints = [];
        
        // Add rest days constraint
        constraints.push(new RestDaysConstraint(
          uuidv4(),
          generation_options?.minRestDays || 1
        ));
        
        // Add max consecutive away games constraint
        constraints.push(new MaxConsecutiveAwayConstraint(
          uuidv4(),
          generation_options?.maxConsecutiveAway || 3
        ));
        
        // Create empty FlexTime schedule
        const flexSchedule = new Schedule(
          schedule.schedule_id,
          name,
          sport.name,
          flexTeams,
          [], // No games yet
          constraints,
          new Date(start_date),
          new Date(end_date)
        );
        
        try {
          // Use the agent system to generate the schedule
          const generatedSchedule = await agentSystem.generateSchedule(
            sport.name,
            flexTeams,
            constraints,
            {
              algorithm: generation_options?.algorithm || 'round_robin',
              ...generation_options
            }
          );
          
          // Create games from generated schedule
          for (const game of generatedSchedule.games) {
            await req.app.get('db').Game.create({
              game_id: uuidv4(),
              schedule_id: schedule.schedule_id,
              home_team_id: game.homeTeam.id,
              away_team_id: game.awayTeam.id,
              venue_id: game.venue.id,
              game_date: game.date,
              status: 'scheduled'
            }, { transaction });
          }
          
          // Update schedule status
          await req.app.get('db').Schedule.update(
            { status: 'generated' },
            { 
              where: { schedule_id: schedule.schedule_id },
              transaction
            }
          );
          
          await transaction.commit();
          
          // Return created schedule
          res.status(201).json({
            message: 'Schedule created successfully using FlexTime v2 Agent System',
            schedule_id: schedule.schedule_id,
            name: schedule.name,
            games_count: generatedSchedule.games.length
          });
        } catch (error) {
          await transaction.rollback();
          console.error('Error in agent-based schedule generation:', error);
          return res.status(500).json({ 
            error: 'Failed to generate schedule using agent system',
            details: error.message
          });
        }
      } else {
        // Use legacy schedule generation
        console.log('Using legacy schedule generation');
        
        // Create games based on generation type
        let games = [];
        
        if (generation_type === 'round_robin' || !generation_type) {
          // Create round robin schedule
          const generator = new RoundRobinGenerator();
          games = generator.generateGames(teams);
        } else if (generation_type === 'partial_round_robin') {
          // Create partial round robin schedule
          const generator = new PartialRoundRobinGenerator(generation_options?.gamesPerTeam || 2);
          games = generator.generateGames(teams);
        } else {
          await transaction.rollback();
          return res.status(400).json({ error: `Unsupported generation type: ${generation_type}` });
        }
        
        // Assign dates to games
        const dateAssigner = new DateAssigner(
          new Date(start_date),
          new Date(end_date),
          generation_options?.minDaysBetweenGames || 2
        );
        
        const gamesWithDates = dateAssigner.assignDates(games);
        
        // Create games in database
        for (const game of gamesWithDates) {
          await req.app.get('db').Game.create({
            schedule_id: schedule.schedule_id,
            home_team_id: game.homeTeam.team_id,
            away_team_id: game.awayTeam.team_id,
            venue_id: game.venue.venue_id,
            game_date: game.date,
            status: 'scheduled'
          }, { transaction });
        }
        
        // Update schedule status
        await req.app.get('db').Schedule.update(
          { status: 'generated' },
          { 
            where: { schedule_id: schedule.schedule_id },
            transaction
          }
        );
        
        await transaction.commit();
        
        // Return created schedule
        res.status(201).json({
          message: 'Schedule created successfully',
          schedule_id: schedule.schedule_id,
          name: schedule.name,
          games_count: gamesWithDates.length
        });
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule', details: error.message });
  }
};

/**
 * Update an existing schedule
 */
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, season, start_date, end_date, status } = req.body;
    
    // Get schedule
    const schedule = await req.app.get('db').Schedule.findByPk(id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Update fields
    if (name) schedule.name = name;
    if (season) schedule.season = season;
    if (start_date) schedule.start_date = new Date(start_date);
    if (end_date) schedule.end_date = new Date(end_date);
    if (status) schedule.status = status;
    
    schedule.updated_by = req.user ? req.user.id : null;
    
    // Save changes
    await schedule.save();
    
    res.json(schedule);
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
    
    // Get schedule
    const schedule = await req.app.get('db').Schedule.findByPk(id);
    
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Delete schedule (cascade will delete related records)
    await schedule.destroy();
    
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

/**
 * Optimize a schedule
 */
exports.optimizeSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { algorithm, options } = req.body;
    
    // Get schedule from database with related data
    const dbSchedule = await req.app.get('db').Schedule.findByPk(id, {
      include: [
        { model: req.app.get('db').Sport, as: 'sport' },
        { 
          model: req.app.get('db').Team, 
          as: 'teams',
          include: [
            { model: req.app.get('db').Institution, as: 'institution' },
            { model: req.app.get('db').Venue, as: 'primaryVenue' }
          ]
        },
        { 
          model: req.app.get('db').Game, 
          as: 'games',
          include: [
            { model: req.app.get('db').Team, as: 'homeTeam' },
            { model: req.app.get('db').Team, as: 'awayTeam' },
            { model: req.app.get('db').Venue, as: 'venue' }
          ]
        },
        { 
          model: req.app.get('db').ScheduleConstraint, 
          as: 'constraints' 
        }
      ]
    });
    
    if (!dbSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Check if we have the agent system available
    const agentSystem = req.app.get('agentSystem');
    
    if (agentSystem) {
      console.log('Using FlexTime v2 Agent System for schedule optimization');
      
      // Convert database models to FlexTime models
      const teams = dbSchedule.teams.map(team => {
        // Ensure we're using the correct naming conventions for Big 12 institutions
        let teamName = team.institution.name;
        
        // Handle special cases for Big 12 institutions
        if (teamName === 'Texas Christian University') {
          teamName = 'TCU';
        } else if (teamName === 'University of Central Florida') {
          teamName = 'UCF';
        } else if (teamName === 'Brigham Young University') {
          teamName = 'BYU';
        }
        
        // Create location for team's primary venue
        const location = new Location(
          team.primaryVenue.name,
          team.primaryVenue.latitude,
          team.primaryVenue.longitude
        );
        
        // Create venue for team
        const venue = new Venue(
          team.primaryVenue.venue_id,
          team.primaryVenue.name,
          location,
          team.primaryVenue.capacity
        );
        
        // Create team
        return new Team(
          team.team_id,
          teamName,
          location,
          [venue]
        );
      });
      
      // Convert database constraints to FlexTime constraints
      const constraints = dbSchedule.constraints.map(constraint => {
        // Create appropriate constraint type
        if (constraint.constraint_type === 'RestDays') {
          return new RestDaysConstraint(
            constraint.constraint_id,
            constraint.parameters.minDays || 1
          );
        } else if (constraint.constraint_type === 'MaxConsecutiveAway') {
          return new MaxConsecutiveAwayConstraint(
            constraint.constraint_id,
            constraint.parameters.maxGames || 3
          );
        } else {
          return new Constraint(
            constraint.constraint_id,
            constraint.constraint_type,
            constraint.parameters
          );
        }
      });
      
      // Convert database games to FlexTime games
      const games = dbSchedule.games.map(game => {
        const homeTeam = teams.find(t => t.id === game.home_team_id);
        const awayTeam = teams.find(t => t.id === game.away_team_id);
        const venue = homeTeam.venues[0]; // Simplified - use home team's primary venue
        
        return new Game(
          game.game_id,
          homeTeam,
          awayTeam,
          new Date(game.game_date),
          venue
        );
      });
      
      // Create FlexTime schedule
      const schedule = new Schedule(
        dbSchedule.schedule_id,
        dbSchedule.name,
        dbSchedule.sport.name,
        teams,
        games,
        constraints,
        new Date(dbSchedule.start_date),
        new Date(dbSchedule.end_date)
      );
      
      try {
        // Use the agent system to optimize the schedule
        const optimizedSchedule = await agentSystem.optimizeSchedule(
          schedule,
          algorithm || 'simulated_annealing',
          options || {}
        );
        
        // Update database with optimized schedule
        const transaction = await req.app.get('db').sequelize.transaction();
        
        try {
          // Delete existing games
          await req.app.get('db').Game.destroy({
            where: { schedule_id: id },
            transaction
          });
          
          // Create new games from optimized schedule
          for (const game of optimizedSchedule.games) {
            await req.app.get('db').Game.create({
              game_id: game.id || uuidv4(),
              schedule_id: id,
              home_team_id: game.homeTeam.id,
              away_team_id: game.awayTeam.id,
              venue_id: game.venue.id,
              game_date: game.date,
              status: 'scheduled'
            }, { transaction });
          }
          
          // Update schedule status
          await req.app.get('db').Schedule.update(
            { 
              status: 'optimized',
              last_optimized: new Date(),
              optimization_algorithm: algorithm || 'simulated_annealing'
            },
            { 
              where: { schedule_id: id },
              transaction
            }
          );
          
          await transaction.commit();
          
          // Return optimized schedule
          res.json({
            message: 'Schedule optimized successfully using FlexTime v2 Agent System',
            schedule_id: id,
            algorithm: algorithm || 'simulated_annealing',
            metrics: optimizedSchedule.metrics || {
              totalTravelDistance: optimizedSchedule.getTotalTravelDistance(),
              averageTravelDistance: optimizedSchedule.getAverageTravelDistance(),
              homeAwayBalance: optimizedSchedule.getHomeAwayBalance()
            }
          });
        } catch (error) {
          await transaction.rollback();
          throw error;
        }
      } catch (error) {
        console.error('Error in agent-based optimization:', error);
        return res.status(500).json({ 
          error: 'Failed to optimize schedule using agent system',
          details: error.message
        });
      }
    } else {
      // Fall back to original optimization logic if agent system is not available
      console.log('FlexTime v2 Agent System not available, using legacy optimization');
      
      // Convert database models to FlexTime models
      // ... (existing conversion code)
      
      // Create optimizer based on algorithm
      let optimizer;
      if (algorithm === 'travel_optimization') {
        optimizer = new TravelOptimizationPipeline();
      } else {
        // Default to simulated annealing
        optimizer = new SimulatedAnnealingOptimizer({
          initialTemperature: options?.initialTemperature || 100,
          coolingRate: options?.coolingRate || 0.95,
          iterations: options?.iterations || 10000
        });
      }
      
      // ... (rest of the existing optimization code)
    }
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    res.status(500).json({ error: 'Failed to optimize schedule', details: error.message });
  }
};

/**
 * Analyze a schedule
 */
exports.analyzeSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get schedule from database with related data
    const dbSchedule = await req.app.get('db').Schedule.findByPk(id, {
      include: [
        { model: req.app.get('db').Sport, as: 'sport' },
        { 
          model: req.app.get('db').Team, 
          as: 'teams',
          include: [
            { model: req.app.get('db').Institution, as: 'institution' },
            { model: req.app.get('db').Venue, as: 'primaryVenue' }
          ]
        },
        { 
          model: req.app.get('db').Game, 
          as: 'games',
          include: [
            { model: req.app.get('db').Team, as: 'homeTeam' },
            { model: req.app.get('db').Team, as: 'awayTeam' },
            { model: req.app.get('db').Venue, as: 'venue' }
          ]
        },
        { 
          model: req.app.get('db').ScheduleConstraint, 
          as: 'constraints' 
        }
      ]
    });
    
    if (!dbSchedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    // Check if we have the agent system available
    const agentSystem = req.app.get('agentSystem');
    
    if (agentSystem) {
      console.log('Using FlexTime v2 Agent System for schedule analysis');
      
      // Convert database models to FlexTime models
      const teams = dbSchedule.teams.map(team => {
        // Ensure we're using the correct naming conventions for Big 12 institutions
        let teamName = team.institution.name;
        
        // Handle special cases for Big 12 institutions
        if (teamName === 'Texas Christian University') {
          teamName = 'TCU';
        } else if (teamName === 'University of Central Florida') {
          teamName = 'UCF';
        } else if (teamName === 'Brigham Young University') {
          teamName = 'BYU';
        }
        
        // Create location for team's primary venue
        const location = new Location(
          team.primaryVenue.name,
          team.primaryVenue.latitude,
          team.primaryVenue.longitude
        );
        
        // Create venue for team
        const venue = new Venue(
          team.primaryVenue.venue_id,
          team.primaryVenue.name,
          location,
          team.primaryVenue.capacity
        );
        
        // Create team
        return new Team(
          team.team_id,
          teamName,
          location,
          [venue]
        );
      });
      
      // Convert database constraints to FlexTime constraints
      const constraints = dbSchedule.constraints.map(constraint => {
        // Create appropriate constraint type
        if (constraint.constraint_type === 'RestDays') {
          return new RestDaysConstraint(
            constraint.constraint_id,
            constraint.parameters.minDays || 1
          );
        } else if (constraint.constraint_type === 'MaxConsecutiveAway') {
          return new MaxConsecutiveAwayConstraint(
            constraint.constraint_id,
            constraint.parameters.maxGames || 3
          );
        } else {
          return new Constraint(
            constraint.constraint_id,
            constraint.constraint_type,
            constraint.parameters
          );
        }
      });
      
      // Convert database games to FlexTime games
      const games = dbSchedule.games.map(game => {
        const homeTeam = teams.find(t => t.id === game.home_team_id);
        const awayTeam = teams.find(t => t.id === game.away_team_id);
        const venue = homeTeam.venues[0]; // Simplified - use home team's primary venue
        
        return new Game(
          game.game_id,
          homeTeam,
          awayTeam,
          new Date(game.game_date),
          venue
        );
      });
      
      // Create FlexTime schedule
      const schedule = new Schedule(
        dbSchedule.schedule_id,
        dbSchedule.name,
        dbSchedule.sport.name,
        teams,
        games,
        constraints,
        new Date(dbSchedule.start_date),
        new Date(dbSchedule.end_date)
      );
      
      try {
        // Use the agent system to analyze the schedule
        const analysis = await agentSystem.analyzeSchedule(schedule, {
          detailed: true,
          includeConstraintViolations: true
        });
        
        // Return the analysis
        res.json({
          message: 'Schedule analyzed successfully using FlexTime v2 Agent System',
          schedule_id: dbSchedule.schedule_id,
          analysis
        });
      } catch (error) {
        console.error('Error in agent-based schedule analysis:', error);
        return res.status(500).json({ 
          error: 'Failed to analyze schedule using agent system',
          details: error.message
        });
      }
    } else {
      // Fall back to original analysis logic
      console.log('FlexTime v2 Agent System not available, using legacy analysis');
      
      // Perform analysis
      const analysis = {
        total_games: dbSchedule.games.length,
        games_per_team: {},
        home_away_balance: {},
        travel_distance: {},
        consecutive_games: {},
        games_by_day_of_week: {
          Sunday: 0,
          Monday: 0,
          Tuesday: 0,
          Wednesday: 0,
          Thursday: 0,
          Friday: 0,
          Saturday: 0
        },
        constraint_violations: []
      };
      
      // Calculate games per team and home/away balance
      for (const team of dbSchedule.teams) {
        const homeGames = dbSchedule.games.filter(g => g.home_team_id === team.team_id);
        const awayGames = dbSchedule.games.filter(g => g.away_team_id === team.team_id);
        
        analysis.games_per_team[team.institution.name] = homeGames.length + awayGames.length;
        analysis.home_away_balance[team.institution.name] = {
          home: homeGames.length,
          away: awayGames.length,
          ratio: homeGames.length / (homeGames.length + awayGames.length)
        };
      }
      
      // Calculate travel distance (simplified)
      for (const team of dbSchedule.teams) {
        let totalDistance = 0;
        
        for (const game of dbSchedule.games.filter(g => g.away_team_id === team.team_id)) {
          const venue = dbSchedule.teams.find(t => t.team_id === game.home_team_id).primaryVenue;
          
          // Simple distance calculation using latitude/longitude
          const lat1 = team.primaryVenue.latitude;
          const lon1 = team.primaryVenue.longitude;
          const lat2 = venue.latitude;
          const lon2 = venue.longitude;
          
          // Haversine formula
          const R = 3958.8; // Earth radius in miles
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          totalDistance += distance;
        }
        
        analysis.travel_distance[team.institution.name] = totalDistance;
      }
      
      // Count games by day of week
      for (const game of dbSchedule.games) {
        const date = new Date(game.game_date);
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        analysis.games_by_day_of_week[dayOfWeek]++;
      }
      
      // Return analysis
      res.json(analysis);
    }
  } catch (error) {
    console.error('Error analyzing schedule:', error);
    res.status(500).json({ error: 'Failed to analyze schedule', details: error.message });
  }
};

/**
 * Get games for a schedule
 */
exports.getScheduleGames = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get games for schedule
    const games = await req.app.get('db').Game.findAll({
      where: { schedule_id: id },
      include: [
        { model: req.app.get('db').Team, as: 'homeTeam' },
        { model: req.app.get('db').Team, as: 'awayTeam' },
        { model: req.app.get('db').Venue, as: 'venue' }
      ],
      order: [['game_date', 'ASC']]
    });
    
    res.json(games);
  } catch (error) {
    console.error('Error getting schedule games:', error);
    res.status(500).json({ error: 'Failed to retrieve schedule games' });
  }
};

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
