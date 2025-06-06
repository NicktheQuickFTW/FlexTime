/**
 * Visualization Agent for the FlexTime multi-agent system.
 * 
 * This specialized agent creates visualizations of schedules and analysis results
 * to help users understand and evaluate schedules.
 */

const Agent = require('../agent');
const logger = require("../../lib/logger");;
const plotly = require('plotly.js-dist');
const d3 = require('d3');
const moment = require('moment');

/**
 * Specialized agent for creating visualizations of schedules and analysis.
 */
class VisualizationAgent extends Agent {
  /**
   * Initialize a new Visualization Agent.
   * 
   * @param {object} mcpConnector - MCP server connector
   */
  constructor(mcpConnector) {
    super('visualization', 'specialized', mcpConnector);
    logger.info('Visualization Agent initialized');
  }
  
  /**
   * Process a task to create visualizations.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<object>} Visualization results
   * @private
   */
  async _processTask(task) {
    logger.info(`Visualization Agent processing task: ${task.taskId}`);
    
    const { data, options = {} } = task.parameters;
    const visualizationType = options.type || 'schedule';
    const teamFilter = options.teamFilter || null;
    
    try {
      let visualizationData;
      
      switch (visualizationType) {
        case 'calendar':
          visualizationData = await this._createCalendarVisualization(data, options);
          break;
        case 'travel':
          visualizationData = await this._createTravelVisualization(data, options);
          break;
        case 'metrics':
          visualizationData = await this._createMetricsVisualization(data, options);
          break;
        case 'all':
          visualizationData = {
            calendar: await this._createCalendarVisualization(data, { ...options, teamFilter }),
            travel: await this._createTravelVisualization(data, { ...options, teamFilter }),
            metrics: await this._createMetricsVisualization(data, options)
          };
          break;
        default:
          throw new Error(`Unsupported visualization type: ${visualizationType}`);
      }
      
      return {
        type: visualizationType,
        data: visualizationData,
        format: options.format || 'json'
      };
    } catch (error) {
      logger.error(`Error creating visualization: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a calendar visualization of the schedule.
   * 
   * @param {object} schedule - The schedule to visualize
   * @param {object} options - Visualization options
   * @returns {Promise<object>} Visualization data
   * @private
   */
  async _createCalendarVisualization(schedule, options) {
    const teamFilter = options.teamFilter || null;
    const games = schedule.games || [];
    
    // Filter games if a team filter is specified
    const filteredGames = teamFilter 
      ? games.filter(game => 
          game.homeTeam.name.includes(teamFilter) || 
          game.awayTeam.name.includes(teamFilter))
      : games;
    
    // Group games by date
    const gamesByDate = {};
    filteredGames.forEach(game => {
      const dateKey = moment(game.date).format('YYYY-MM-DD');
      if (!gamesByDate[dateKey]) {
        gamesByDate[dateKey] = [];
      }
      gamesByDate[dateKey].push(game);
    });
    
    // Generate calendar events
    const events = [];
    Object.keys(gamesByDate).forEach(dateKey => {
      gamesByDate[dateKey].forEach(game => {
        // Assign colors based on teams
        const homeTeamColor = this._getTeamColor(game.homeTeam);
        
        events.push({
          id: game.id,
          title: `${game.homeTeam.name} vs ${game.awayTeam.name}`,
          start: moment(game.date).format('YYYY-MM-DD'),
          end: moment(game.date).format('YYYY-MM-DD'),
          backgroundColor: homeTeamColor,
          borderColor: homeTeamColor,
          textColor: this._getContrastColor(homeTeamColor),
          extendedProps: {
            venue: game.venue.name,
            location: `${game.venue.location.city}, ${game.venue.location.state}`,
            homeTeam: game.homeTeam.name,
            awayTeam: game.awayTeam.name
          }
        });
      });
    });
    
    // Generate calendar visualization data
    return {
      title: teamFilter 
        ? `${teamFilter} Schedule Calendar` 
        : 'Schedule Calendar',
      description: 'Calendar visualization of the schedule',
      events: events,
      dateRange: {
        start: moment(schedule.startDate || games[0]?.date).format('YYYY-MM-DD'),
        end: moment(schedule.endDate || games[games.length - 1]?.date).format('YYYY-MM-DD')
      },
      teams: this._formatTeamData(schedule.teams || []),
      options: options
    };
  }
  
  /**
   * Create a travel visualization of the schedule.
   * 
   * @param {object} schedule - The schedule to visualize
   * @param {object} options - Visualization options
   * @returns {Promise<object>} Visualization data
   * @private
   */
  async _createTravelVisualization(schedule, options) {
    const teamFilter = options.teamFilter || null;
    const games = schedule.games || [];
    const teams = schedule.teams || [];
    
    // Filter teams if a team filter is specified
    const filteredTeams = teamFilter 
      ? teams.filter(team => team.name.includes(teamFilter))
      : teams;
    
    // Calculate travel routes for each team
    const routes = [];
    
    for (const team of filteredTeams) {
      // Get all away games for the team
      const awayGames = games.filter(game => game.awayTeam.id === team.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Start from team's home location
      let currentLocation = team.location;
      
      // Add routes for each away game
      for (const game of awayGames) {
        const gameLocation = game.venue.location;
        
        // Calculate distance
        const distance = this._calculateDistance(
          currentLocation.latitude, 
          currentLocation.longitude,
          gameLocation.latitude,
          gameLocation.longitude
        );
        
        routes.push({
          teamId: team.id,
          teamName: team.name,
          from: {
            name: currentLocation.name,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          },
          to: {
            name: gameLocation.name,
            latitude: gameLocation.latitude,
            longitude: gameLocation.longitude
          },
          gameId: game.id,
          gameDate: game.date,
          distance: Math.round(distance),
          opponent: game.homeTeam.name
        });
        
        // Update current location
        currentLocation = gameLocation;
      }
      
      // Return to home after last away game
      if (awayGames.length > 0) {
        const lastGameLocation = awayGames[awayGames.length - 1].venue.location;
        
        // Calculate distance back home
        const distance = this._calculateDistance(
          lastGameLocation.latitude,
          lastGameLocation.longitude,
          team.location.latitude,
          team.location.longitude
        );
        
        routes.push({
          teamId: team.id,
          teamName: team.name,
          from: {
            name: lastGameLocation.name,
            latitude: lastGameLocation.latitude,
            longitude: lastGameLocation.longitude
          },
          to: {
            name: team.location.name,
            latitude: team.location.latitude,
            longitude: team.location.longitude
          },
          gameId: null,
          gameDate: null,
          distance: Math.round(distance),
          opponent: null,
          returnTrip: true
        });
      }
    }
    
    // Calculate total travel distance for each team
    const travelDistances = {};
    
    for (const route of routes) {
      if (!travelDistances[route.teamName]) {
        travelDistances[route.teamName] = 0;
      }
      travelDistances[route.teamName] += route.distance;
    }
    
    // Generate map data for visualization
    const mapData = {
      teams: filteredTeams.map(team => ({
        id: team.id,
        name: team.name,
        location: team.location,
        color: this._getTeamColor(team)
      })),
      routes: routes,
      travelDistances: travelDistances
    };
    
    return {
      title: teamFilter 
        ? `${teamFilter} Travel Visualization` 
        : 'Travel Visualization',
      description: 'Visual representation of team travel routes',
      mapData: mapData,
      options: options
    };
  }
  
  /**
   * Create a metrics visualization of the schedule.
   * 
   * @param {object} schedule - The schedule to visualize
   * @param {object} options - Visualization options
   * @returns {Promise<object>} Visualization data
   * @private
   */
  async _createMetricsVisualization(schedule, options) {
    const games = schedule.games || [];
    const teams = schedule.teams || [];
    
    // Calculate schedule metrics
    const metrics = await this._calculateScheduleMetrics(schedule);
    
    // Generate charts for visualization
    const charts = [
      // Travel distance chart
      {
        type: 'bar',
        title: 'Total Travel Distance by Team',
        data: {
          x: Object.keys(metrics.travelDistanceByTeam),
          y: Object.values(metrics.travelDistanceByTeam),
          type: 'bar',
          marker: {
            color: Object.keys(metrics.travelDistanceByTeam).map(teamName => 
              this._getTeamColor(teams.find(t => t.name === teamName) || {})
            )
          }
        },
        layout: {
          title: 'Total Travel Distance by Team (miles)',
          xaxis: { title: 'Team' },
          yaxis: { title: 'Distance (miles)' }
        }
      },
      
      // Home/Away balance chart
      {
        type: 'bar',
        title: 'Home vs Away Games by Team',
        data: [
          {
            x: Object.keys(metrics.homeGames),
            y: Object.values(metrics.homeGames),
            name: 'Home Games',
            type: 'bar',
            marker: { color: '#4CAF50' }
          },
          {
            x: Object.keys(metrics.awayGames),
            y: Object.values(metrics.awayGames),
            name: 'Away Games',
            type: 'bar',
            marker: { color: '#F44336' }
          }
        ],
        layout: {
          title: 'Home vs Away Games by Team',
          barmode: 'group',
          xaxis: { title: 'Team' },
          yaxis: { title: 'Number of Games' }
        }
      },
      
      // Games per day chart
      {
        type: 'bar',
        title: 'Games per Day',
        data: {
          x: Object.keys(metrics.gamesPerDay),
          y: Object.values(metrics.gamesPerDay),
          type: 'bar',
          marker: { color: '#2196F3' }
        },
        layout: {
          title: 'Number of Games per Day',
          xaxis: { title: 'Date' },
          yaxis: { title: 'Number of Games' }
        }
      }
    ];
    
    return {
      title: 'Schedule Metrics Visualization',
      description: 'Visual representation of schedule quality metrics',
      metrics: metrics,
      charts: charts,
      options: options
    };
  }
  
  /**
   * Calculate comprehensive metrics for a schedule.
   * 
   * @param {object} schedule - The schedule to analyze
   * @returns {Promise<object>} Schedule metrics
   * @private
   */
  async _calculateScheduleMetrics(schedule) {
    const games = schedule.games || [];
    const teams = schedule.teams || [];
    
    // Initialize metrics
    const metrics = {
      totalGames: games.length,
      totalTeams: teams.length,
      homeGames: {},
      awayGames: {},
      travelDistanceByTeam: {},
      gamesPerDay: {},
      consecutiveAwayGames: {},
      consecutiveHomeGames: {},
      restDays: {}
    };
    
    // Initialize team metrics
    teams.forEach(team => {
      metrics.homeGames[team.name] = 0;
      metrics.awayGames[team.name] = 0;
      metrics.travelDistanceByTeam[team.name] = 0;
      metrics.consecutiveAwayGames[team.name] = 0;
      metrics.consecutiveHomeGames[team.name] = 0;
      metrics.restDays[team.name] = 0;
    });
    
    // Count home and away games
    games.forEach(game => {
      // Count home games
      if (metrics.homeGames[game.homeTeam.name] !== undefined) {
        metrics.homeGames[game.homeTeam.name]++;
      }
      
      // Count away games
      if (metrics.awayGames[game.awayTeam.name] !== undefined) {
        metrics.awayGames[game.awayTeam.name]++;
      }
      
      // Count games per day
      const dateKey = moment(game.date).format('YYYY-MM-DD');
      if (!metrics.gamesPerDay[dateKey]) {
        metrics.gamesPerDay[dateKey] = 0;
      }
      metrics.gamesPerDay[dateKey]++;
    });
    
    // Calculate travel distances and consecutive games
    teams.forEach(team => {
      // Get all games for the team, sorted by date
      const teamGames = games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Calculate travel distance and consecutive games
      let currentLocation = team.location;
      let consecutiveAway = 0;
      let consecutiveHome = 0;
      let lastGameDate = null;
      
      teamGames.forEach(game => {
        const isHome = game.homeTeam.id === team.id;
        const gameLocation = isHome ? team.location : game.venue.location;
        
        // Calculate rest days
        if (lastGameDate) {
          const daysBetween = moment(game.date).diff(moment(lastGameDate), 'days');
          metrics.restDays[team.name] += daysBetween - 1;
        }
        lastGameDate = game.date;
        
        // Calculate travel distance (only for away games)
        if (!isHome) {
          const distance = this._calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            gameLocation.latitude,
            gameLocation.longitude
          );
          
          metrics.travelDistanceByTeam[team.name] += distance;
          currentLocation = gameLocation;
        } else {
          // If returning home, calculate distance from last location
          if (currentLocation.name !== team.location.name) {
            const distance = this._calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              team.location.latitude,
              team.location.longitude
            );
            
            metrics.travelDistanceByTeam[team.name] += distance;
            currentLocation = team.location;
          }
        }
        
        // Count consecutive games
        if (isHome) {
          consecutiveAway = 0;
          consecutiveHome++;
        } else {
          consecutiveHome = 0;
          consecutiveAway++;
        }
        
        // Update max consecutive games
        metrics.consecutiveHomeGames[team.name] = Math.max(
          metrics.consecutiveHomeGames[team.name],
          consecutiveHome
        );
        
        metrics.consecutiveAwayGames[team.name] = Math.max(
          metrics.consecutiveAwayGames[team.name],
          consecutiveAway
        );
      });
      
      // Round travel distance to nearest mile
      metrics.travelDistanceByTeam[team.name] = Math.round(metrics.travelDistanceByTeam[team.name]);
    });
    
    // Calculate overall metrics
    metrics.totalTravelDistance = Object.values(metrics.travelDistanceByTeam).reduce((a, b) => a + b, 0);
    metrics.averageTravelDistance = metrics.totalTravelDistance / teams.length;
    metrics.maxConsecutiveAwayGames = Math.max(...Object.values(metrics.consecutiveAwayGames));
    metrics.maxConsecutiveHomeGames = Math.max(...Object.values(metrics.consecutiveHomeGames));
    metrics.averageRestDays = Object.values(metrics.restDays).reduce((a, b) => a + b, 0) / teams.length;
    
    return metrics;
  }
  
  /**
   * Format team data for visualization.
   * 
   * @param {Array<object>} teams - List of teams
   * @returns {Array<object>} Formatted team data
   * @private
   */
  _formatTeamData(teams) {
    return teams.map(team => ({
      id: team.id,
      name: team.name,
      nickname: team.nickname,
      location: team.location,
      venue: team.primaryVenue,
      color: this._getTeamColor(team)
    }));
  }
  
  /**
   * Get a color for a team based on its name or primary color.
   * 
   * @param {object} team - Team object
   * @returns {string} Color hex code
   * @private
   */
  _getTeamColor(team) {
    // Use team's primary color if available
    if (team.primaryColor) {
      return team.primaryColor;
    }
    
    // Big 12 team colors
    const teamColors = {
      'Texas Tech': '#CC0000',
      'Red Raiders': '#CC0000',
      'Baylor': '#003015',
      'Bears': '#003015',
      'TCU': '#4D1979',
      'Horned Frogs': '#4D1979',
      'Texas': '#BF5700',
      'Longhorns': '#BF5700',
      'Oklahoma': '#841617',
      'Sooners': '#841617',
      'Oklahoma State': '#FF7300',
      'Cowboys': '#FF7300',
      'Kansas': '#0051BA',
      'Jayhawks': '#0051BA',
      'Kansas State': '#512888',
      'Wildcats': '#512888',
      'Iowa State': '#C8102E',
      'Cyclones': '#C8102E',
      'West Virginia': '#002855',
      'Mountaineers': '#002855',
      'Cincinnati': '#000000',
      'Bearcats': '#E00122',
      'UCF': '#000000',
      'Knights': '#BA9B37',
      'BYU': '#002E5D',
      'Cougars': '#002E5D',
      'Houston': '#C8102E',
      'Arizona': '#CC0033',
      'Arizona State': '#8C1D40',
      'Sun Devils': '#8C1D40',
      'Colorado': '#CFB87C',
      'Buffaloes': '#000000',
      'Utah': '#CC0000',
      'Utes': '#CC0000'
    };
    
    // Check if team name or nickname matches a known team
    for (const [key, color] of Object.entries(teamColors)) {
      if (team.name && team.name.includes(key)) {
        return color;
      }
      if (team.nickname && team.nickname.includes(key)) {
        return color;
      }
    }
    
    // Generate a color based on team name
    const hash = this._hashString(team.name || 'Team');
    return `#${((hash & 0xFFFFFF) | 0x800000).toString(16).padStart(6, '0')}`;
  }
  
  /**
   * Calculate the distance between two points using the Haversine formula.
   * 
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in miles
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const dLat = this._toRadians(lat2 - lat1);
    const dLon = this._toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRadians(lat1)) * Math.cos(this._toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians.
   * 
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   * @private
   */
  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Generate a hash value for a string.
   * 
   * @param {string} str - Input string
   * @returns {number} Hash value
   * @private
   */
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Get a contrasting text color (black or white) for a background color.
   * 
   * @param {string} hexColor - Background color in hex format
   * @returns {string} Contrasting text color
   * @private
   */
  _getContrastColor(hexColor) {
    // Remove # if present
    hexColor = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }
}

module.exports = VisualizationAgent;
