/**
 * Schedule Visualization Tools for FlexTime
 * 
 * This module provides visualization data generators for schedule quality metrics,
 * helping users understand schedule performance through visual representations.
 */

const logger = require('./logger');

class ScheduleVisualizationGenerator {
  /**
   * Create a new ScheduleVisualizationGenerator
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.debug = options.debug || false;
    this.includeRawData = options.includeRawData || false;
    this.colorPalette = options.colorPalette || [
      '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', 
      '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7',
      '#9C755F', '#BAB0AC'
    ];
    
    logger.info('Schedule Visualization Generator initialized');
  }
  
  /**
   * Generate visualization data for a schedule
   * @param {Object} schedule - Schedule to visualize
   * @param {Array} metrics - Metrics to include (or all if not specified)
   * @returns {Object} Visualization data
   */
  generateVisualizations(schedule, metrics = null) {
    logger.info(`Generating visualizations for schedule ${schedule.id}`);
    
    // Determine which metrics to include
    const allMetrics = [
      'teamBalance',
      'travelDistance',
      'constraintSatisfaction',
      'gameDensity',
      'weekdayDistribution',
      'homeAwayPattern',
      'rivalryGames',
      'divisionGames'
    ];
    
    const metricsToGenerate = metrics || allMetrics;
    const visualizations = {};
    
    // Generate each requested visualization
    for (const metric of metricsToGenerate) {
      const generatorMethod = `_generate${this._capitalize(metric)}Data`;
      
      if (typeof this[generatorMethod] === 'function') {
        try {
          visualizations[metric] = this[generatorMethod](schedule);
          
          if (this.debug) {
            logger.info(`Generated ${metric} visualization data`);
          }
        } catch (error) {
          logger.error(`Error generating ${metric} visualization: ${error.message}`);
          visualizations[metric] = { error: error.message };
        }
      } else {
        logger.warn(`No generator available for ${metric} visualization`);
        visualizations[metric] = { error: 'Visualization not implemented' };
      }
    }
    
    return {
      scheduleId: schedule.id,
      sport: schedule.sport,
      visualizations,
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Generate team balance chart data
   * @param {Object} schedule - Schedule to visualize
   * @returns {Object} Team balance visualization data
   * @private
   */
  _generateTeamBalanceData(schedule) {
    // Count home and away games for each team
    const teamData = [];
    
    for (const team of schedule.teams) {
      const homeGames = schedule.games.filter(g => g.homeTeam.id === team.id);
      const awayGames = schedule.games.filter(g => g.awayTeam.id === team.id);
      
      teamData.push({
        team: team.name || team.id,
        homeGames: homeGames.length,
        awayGames: awayGames.length,
        totalGames: homeGames.length + awayGames.length,
        homeRatio: homeGames.length / (homeGames.length + awayGames.length)
      });
    }
    
    // Sort by home ratio for better visualization
    teamData.sort((a, b) => b.homeRatio - a.homeRatio);
    
    // Prepare data for stacked bar chart
    const categories = teamData.map(d => d.team);
    const series = [
      {
        name: 'Home Games',
        data: teamData.map(d => d.homeGames),
        color: this.colorPalette[0]
      },
      {
        name: 'Away Games',
        data: teamData.map(d => d.awayGames),
        color: this.colorPalette[1]
      }
    ];
    
    // Calculate statistics
    const stats = {
      maxHomeRatio: Math.max(...teamData.map(d => d.homeRatio)),
      minHomeRatio: Math.min(...teamData.map(d => d.homeRatio)),
      avgHomeRatio: teamData.reduce((sum, d) => sum + d.homeRatio, 0) / teamData.length,
      idealHomeRatio: 0.5,
      imbalanceScore: this._calculateHomeAwayImbalance(teamData)
    };
    
    // Prepare the final data structure
    const result = {
      title: 'Team Home/Away Balance',
      type: 'bar',
      stacked: true,
      categories,
      series,
      annotations: [
        {
          type: 'line',
          y: stats.idealHomeRatio * 100,
          label: 'Ideal Balance',
          color: '#FF0000',
          dashStyle: 'dash'
        }
      ],
      statistics: stats
    };
    
    // Include raw data if requested
    if (this.includeRawData) {
      result.rawData = teamData;
    }
    
    return result;
  }
  
  /**
   * Generate travel distance heat map
   * @param {Object} schedule - Schedule to visualize
   * @returns {Object} Travel heat map visualization data
   * @private
   */
  _generateTravelDistanceData(schedule) {
    // Prepare team data for travel distance calculation
    const teamLocations = {};
    const venueLocations = {};
    
    // Extract team and venue locations
    for (const team of schedule.teams) {
      teamLocations[team.id] = team.location;
      
      if (team.venues) {
        for (const venue of team.venues) {
          venueLocations[venue.id] = venue.location;
        }
      }
      
      if (team.primaryVenue) {
        venueLocations[team.primaryVenue.id] = team.primaryVenue.location;
      }
    }
    
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push({
        opponent: game.awayTeam.id,
        venue: game.venue,
        date: new Date(game.date),
        isHome: true
      });
      
      teamGames[game.awayTeam.id].push({
        opponent: game.homeTeam.id,
        venue: game.venue,
        date: new Date(game.date),
        isHome: false
      });
    }
    
    // Calculate travel distances
    const travelDistances = [];
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let totalDistance = 0;
      let previousLocation = teamLocations[teamId];
      
      if (!previousLocation) continue;
      
      // Calculate distances between consecutive games
      for (const game of games) {
        if (!game.venue || !game.venue.location) continue;
        
        // Calculate distance to venue
        const distance = this._calculateDistance(
          previousLocation,
          game.venue.location
        );
        
        travelDistances.push({
          team: teamId,
          fromLat: previousLocation.latitude,
          fromLng: previousLocation.longitude,
          toLat: game.venue.location.latitude,
          toLng: game.venue.location.longitude,
          distance,
          date: game.date.toISOString().split('T')[0]
        });
        
        totalDistance += distance;
        previousLocation = game.venue.location;
      }
      
      // Add trip back home after last game
      if (games.length > 0 && games[games.length - 1].venue && 
          games[games.length - 1].venue.location) {
        const distance = this._calculateDistance(
          games[games.length - 1].venue.location,
          teamLocations[teamId]
        );
        
        travelDistances.push({
          team: teamId,
          fromLat: games[games.length - 1].venue.location.latitude,
          fromLng: games[games.length - 1].venue.location.longitude,
          toLat: teamLocations[teamId].latitude,
          toLng: teamLocations[teamId].longitude,
          distance,
          date: games[games.length - 1].date.toISOString().split('T')[0] + ' (return)'
        });
        
        totalDistance += distance;
      }
    }
    
    // Sort distances for heat map
    travelDistances.sort((a, b) => b.distance - a.distance);
    
    // Create matrix for heat map
    const teams = schedule.teams.map(t => t.name || t.id);
    const matrix = [];
    
    for (const team1 of schedule.teams) {
      const row = [];
      
      for (const team2 of schedule.teams) {
        if (team1.id === team2.id) {
          row.push(0); // No travel to self
        } else {
          // Get total travel distance between these teams
          const distance = travelDistances
            .filter(d => 
              (d.team === team1.id && schedule.teams.find(t => t.id === d.team).name === team2.name) ||
              (d.team === team2.id && schedule.teams.find(t => t.id === d.team).name === team1.name)
            )
            .reduce((sum, d) => sum + d.distance, 0);
          
          row.push(distance);
        }
      }
      
      matrix.push(row);
    }
    
    // Calculate statistics
    const allDistances = travelDistances.map(d => d.distance);
    const stats = {
      totalDistance: allDistances.reduce((sum, d) => sum + d, 0),
      averageDistance: allDistances.reduce((sum, d) => sum + d, 0) / allDistances.length,
      maxDistance: Math.max(...allDistances),
      minDistance: Math.min(...allDistances.filter(d => d > 0))
    };
    
    // Prepare result
    const result = {
      title: 'Team Travel Distances',
      type: 'heatmap',
      xAxisCategories: teams,
      yAxisCategories: teams,
      series: [{
        name: 'Travel Distance',
        data: teams.flatMap((team1, i) => 
          teams.map((team2, j) => [i, j, matrix[i][j]])
        ),
        dataLabels: {
          enabled: true,
          color: '#000000'
        }
      }],
      colorAxis: {
        min: 0,
        stops: [
          [0, '#FFFFFF'],
          [0.5, '#FFFF00'],
          [1, '#FF0000']
        ]
      },
      statistics: stats
    };
    
    // Include raw data if requested
    if (this.includeRawData) {
      result.rawData = travelDistances;
    }
    
    return result;
  }
  
  /**
   * Generate constraint satisfaction radar chart
   * @param {Object} schedule - Schedule to visualize
   * @returns {Object} Constraint satisfaction visualization data
   * @private
   */
  _generateConstraintSatisfactionData(schedule) {
    // Get constraint information
    const constraints = schedule.constraints || [];
    const constraintTypes = [...new Set(constraints.map(c => c.type))];
    
    // If no constraints, return empty chart
    if (constraintTypes.length === 0) {
      return {
        title: 'Constraint Satisfaction',
        message: 'No constraints defined for this schedule'
      };
    }
    
    // Mock evaluation (would use actual evaluator in production)
    const evaluations = {};
    
    for (const constraintType of constraintTypes) {
      // In production, would call actual evaluator
      evaluations[constraintType] = {
        satisfaction: Math.random() * 100, // Mock value between 0-100
        violations: Math.floor(Math.random() * 5)
      };
    }
    
    // Prepare series for radar chart
    const series = [{
      name: 'Constraint Satisfaction',
      data: constraintTypes.map(type => evaluations[type].satisfaction),
      pointPlacement: 'on',
      color: this.colorPalette[0]
    }];
    
    // Prepare result
    const result = {
      title: 'Constraint Satisfaction',
      type: 'radar',
      categories: constraintTypes,
      series,
      yAxis: {
        min: 0,
        max: 100,
        title: {
          text: 'Satisfaction (%)'
        }
      },
      statistics: {
        averageSatisfaction: series[0].data.reduce((sum, val) => sum + val, 0) / series[0].data.length,
        totalViolations: Object.values(evaluations).reduce((sum, e) => sum + e.violations, 0)
      }
    };
    
    // Include raw data if requested
    if (this.includeRawData) {
      result.rawData = evaluations;
    }
    
    return result;
  }
  
  /**
   * Generate game density calendar
   * @param {Object} schedule - Schedule to visualize
   * @returns {Object} Game density visualization data
   * @private
   */
  _generateGameDensityData(schedule) {
    // Create date range for entire schedule
    const startDate = new Date(schedule.startDate || schedule.games[0]?.date);
    const endDate = new Date(schedule.endDate || schedule.games[schedule.games.length - 1]?.date);
    
    // Create array of all dates in range
    const dateRange = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count games on each date
    const gameCounts = {};
    
    for (const date of dateRange) {
      const dateString = date.toISOString().split('T')[0];
      gameCounts[dateString] = 0;
    }
    
    for (const game of schedule.games) {
      const dateString = new Date(game.date).toISOString().split('T')[0];
      gameCounts[dateString] = (gameCounts[dateString] || 0) + 1;
    }
    
    // Prepare data for heatmap calendar
    const calendarData = Object.entries(gameCounts).map(([date, count]) => {
      const [year, month, day] = date.split('-').map(Number);
      return [Date.UTC(year, month - 1, day), count];
    });
    
    // Sort data by date
    calendarData.sort((a, b) => a[0] - b[0]);
    
    // Calculate statistics
    const counts = Object.values(gameCounts);
    const stats = {
      totalDates: counts.length,
      datesWithGames: counts.filter(c => c > 0).length,
      maxGamesPerDay: Math.max(...counts),
      avgGamesPerDay: counts.reduce((sum, c) => sum + c, 0) / counts.length,
      weekendPercentage: this._calculateWeekendPercentage(gameCounts)
    };
    
    // Prepare result
    const result = {
      title: 'Game Density Calendar',
      type: 'heatmap',
      series: [{
        name: 'Games',
        data: calendarData,
        dataLabels: {
          enabled: true,
          color: '#000000'
        }
      }],
      colorAxis: {
        min: 0,
        max: stats.maxGamesPerDay,
        stops: [
          [0, '#FFFFFF'],
          [0.5, '#7EB26D'],
          [1, '#1F78C1']
        ]
      },
      statistics: stats
    };
    
    // Include raw data if requested
    if (this.includeRawData) {
      result.rawData = gameCounts;
    }
    
    return result;
  }
  
  /**
   * Generate weekday distribution data
   * @param {Object} schedule - Schedule to visualize
   * @returns {Object} Weekday distribution visualization data
   * @private
   */
  _generateWeekdayDistributionData(schedule) {
    // Count games by day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = days.map(day => ({ day, count: 0 }));
    
    for (const game of schedule.games) {
      const date = new Date(game.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      dayCounts[dayOfWeek].count++;
    }
    
    // Calculate percentages
    const totalGames = schedule.games.length;
    for (const day of dayCounts) {
      day.percentage = (day.count / totalGames) * 100;
    }
    
    // Prepare data for pie chart
    const series = [{
      name: 'Games',
      data: dayCounts.map((day, i) => ({
        name: day.day,
        y: day.count,
        color: this.colorPalette[i % this.colorPalette.length]
      }))
    }];
    
    // Calculate weekend vs weekday stats
    const weekendCount = dayCounts[0].count + dayCounts[6].count;
    const weekdayCount = totalGames - weekendCount;
    
    // Prepare result
    const result = {
      title: 'Games by Day of Week',
      type: 'pie',
      series,
      statistics: {
        totalGames,
        weekendGames: weekendCount,
        weekdayGames: weekdayCount,
        weekendPercentage: (weekendCount / totalGames) * 100,
        mostCommonDay: dayCounts.reduce((max, day) => 
          day.count > max.count ? day : max, { count: 0 }).day
      }
    };
    
    // Include raw data if requested
    if (this.includeRawData) {
      result.rawData = dayCounts;
    }
    
    return result;
  }
  
  /**
   * Generate home/away pattern data
   * @param {Object} schedule - Schedule to visualize
   * @returns {Object} Home/away pattern visualization data
   * @private
   */
  _generateHomeAwayPatternData(schedule) {
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push({
        date: new Date(game.date),
        opponent: game.awayTeam.id,
        isHome: true
      });
      
      teamGames[game.awayTeam.id].push({
        date: new Date(game.date),
        opponent: game.homeTeam.id,
        isHome: false
      });
    }
    
    // Sort each team's games by date
    for (const games of Object.values(teamGames)) {
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    
    // Find consecutive home/away streaks
    const streaks = [];
    
    for (const [teamId, games] of Object.entries(teamGames)) {
      let currentStreak = { team: teamId, type: null, length: 0, games: [] };
      
      for (const game of games) {
        if (currentStreak.type === null) {
          // Start a new streak
          currentStreak.type = game.isHome ? 'home' : 'away';
          currentStreak.length = 1;
          currentStreak.games = [game];
        } else if (currentStreak.type === 'home' && game.isHome || 
                   currentStreak.type === 'away' && !game.isHome) {
          // Continue current streak
          currentStreak.length++;
          currentStreak.games.push(game);
        } else {
          // End previous streak and start a new one
          if (currentStreak.length >= 2) {
            streaks.push({ ...currentStreak });
          }
          
          currentStreak = { 
            team: teamId, 
            type: game.isHome ? 'home' : 'away',
            length: 1,
            games: [game]
          };
        }
      }
      
      // Add final streak if long enough
      if (currentStreak.length >= 2) {
        streaks.push({ ...currentStreak });
      }
    }
    
    // Sort streaks by length (descending)
    streaks.sort((a, b) => b.length - a.length);
    
    // Prepare data for streaks chart
    const longestStreaks = streaks.slice(0, 10);
    const series = [
      {
        name: 'Home Streaks',
        data: longestStreaks
          .filter(s => s.type === 'home')
          .map(s => ({ 
            name: `${s.team} (${s.length} games)`, 
            y: s.length,
            color: this.colorPalette[0]
          }))
      },
      {
        name: 'Away Streaks',
        data: longestStreaks
          .filter(s => s.type === 'away')
          .map(s => ({ 
            name: `${s.team} (${s.length} games)`,
            y: s.length,
            color: this.colorPalette[1]
          }))
      }
    ];
    
    // Calculate statistics
    const homeStreaks = streaks.filter(s => s.type === 'home');
    const awayStreaks = streaks.filter(s => s.type === 'away');
    
    const stats = {
      longestHomeStreak: homeStreaks.length > 0 ? 
        Math.max(...homeStreaks.map(s => s.length)) : 0,
      longestAwayStreak: awayStreaks.length > 0 ?
        Math.max(...awayStreaks.map(s => s.length)) : 0,
      avgHomeStreak: homeStreaks.length > 0 ?
        homeStreaks.reduce((sum, s) => sum + s.length, 0) / homeStreaks.length : 0,
      avgAwayStreak: awayStreaks.length > 0 ?
        awayStreaks.reduce((sum, s) => sum + s.length, 0) / awayStreaks.length : 0
    };
    
    // Prepare result
    const result = {
      title: 'Consecutive Home/Away Games',
      type: 'column',
      series,
      statistics: stats
    };
    
    // Include raw data if requested
    if (this.includeRawData) {
      result.rawData = streaks;
    }
    
    return result;
  }
  
  /**
   * Generate rivalry games data
   * @param {Object} schedule - Schedule to visualize
   * @returns {Object} Rivalry games visualization data
   * @private
   */
  _generateRivalryGamesData(schedule) {
    // This would use actual rivalry data in production
    // For now, we'll create mock rivalry data
    const rivalries = this._getMockRivalries(schedule.teams);
    
    if (rivalries.length === 0) {
      return {
        title: 'Rivalry Games',
        message: 'No rivalries defined for this schedule'
      };
    }
    
    // Find rivalry games in schedule
    const rivalryGames = [];
    
    for (const game of schedule.games) {
      const homeId = game.homeTeam.id;
      const awayId = game.awayTeam.id;
      
      const isRivalry = rivalries.some(r => 
        (r.team1 === homeId && r.team2 === awayId) ||
        (r.team1 === awayId && r.team2 === homeId)
      );
      
      if (isRivalry) {
        rivalryGames.push({
          date: new Date(game.date),
          home: game.homeTeam.name || homeId,
          away: game.awayTeam.name || awayId,
          venue: game.venue.name,
          dayOfWeek: new Date(game.date).toLocaleDateString('en-US', { weekday: 'long' }),
          isWeekend: [0, 6].includes(new Date(game.date).getDay())
        });
      }
    }
    
    // Sort by date
    rivalryGames.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Group by month for timeline
    const months = {};
    
    for (const game of rivalryGames) {
      const month = game.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!months[month]) {
        months[month] = [];
      }
      months[month].push(game);
    }
    
    // Prepare timeline data
    const timelineData = Object.entries(months).map(([month, games]) => ({
      month,
      count: games.length,
      games
    }));
    
    // Calculate statistics
    const weekendGames = rivalryGames.filter(g => g.isWeekend);
    
    const stats = {
      totalRivalryGames: rivalryGames.length,
      weekendRivalryGames: weekendGames.length,
      weekendPercentage: (weekendGames.length / rivalryGames.length) * 100,
      rivalriesWithMultipleGames: this._countRivalriesWithMultipleGames(rivalryGames, rivalries)
    };
    
    // Prepare result
    const result = {
      title: 'Rivalry Games Distribution',
      type: 'timeline',
      series: [{
        name: 'Rivalry Games',
        data: timelineData.map(d => ({
          x: d.month,
          y: d.count,
          games: d.games
        }))
      }],
      statistics: stats
    };
    
    // Include raw data if requested
    if (this.includeRawData) {
      result.rawData = {
        rivalries,
        rivalryGames
      };
    }
    
    return result;
  }
  
  /**
   * Generate division games data
   * @param {Object} schedule - Schedule to visualize
   * @returns {Object} Division games visualization data
   * @private
   */
  _generateDivisionGamesData(schedule) {
    // This would use actual division data in production
    // For now, we'll create mock division data
    const divisions = this._getMockDivisions(schedule.teams);
    
    if (Object.keys(divisions).length === 0) {
      return {
        title: 'Division Games',
        message: 'No divisions defined for this schedule'
      };
    }
    
    // Count division games
    const divisionGames = {
      intraDivision: {},
      interDivision: {}
    };
    
    // Initialize counts
    for (const division of Object.keys(divisions)) {
      divisionGames.intraDivision[division] = 0;
      divisionGames.interDivision[division] = {};
      
      for (const otherDivision of Object.keys(divisions)) {
        if (division !== otherDivision) {
          divisionGames.interDivision[division][otherDivision] = 0;
        }
      }
    }
    
    // Count games
    for (const game of schedule.games) {
      const homeId = game.homeTeam.id;
      const awayId = game.awayTeam.id;
      
      const homeDivision = this._getTeamDivision(homeId, divisions);
      const awayDivision = this._getTeamDivision(awayId, divisions);
      
      if (homeDivision && awayDivision) {
        if (homeDivision === awayDivision) {
          // Intra-division game
          divisionGames.intraDivision[homeDivision]++;
        } else {
          // Inter-division game
          divisionGames.interDivision[homeDivision][awayDivision]++;
          divisionGames.interDivision[awayDivision][homeDivision]++;
        }
      }
    }
    
    // Prepare heatmap data for division matchups
    const divisionNames = Object.keys(divisions);
    const heatmapData = [];
    
    for (let i = 0; i < divisionNames.length; i++) {
      for (let j = 0; j < divisionNames.length; j++) {
        const div1 = divisionNames[i];
        const div2 = divisionNames[j];
        
        let count;
        if (div1 === div2) {
          count = divisionGames.intraDivision[div1];
        } else {
          count = divisionGames.interDivision[div1][div2];
        }
        
        heatmapData.push([i, j, count]);
      }
    }
    
    // Calculate statistics
    const totalIntraDivision = Object.values(divisionGames.intraDivision)
      .reduce((sum, count) => sum + count, 0);
    
    let totalInterDivision = 0;
    for (const div1 of Object.keys(divisionGames.interDivision)) {
      for (const div2 of Object.keys(divisionGames.interDivision[div1])) {
        totalInterDivision += divisionGames.interDivision[div1][div2];
      }
    }
    totalInterDivision /= 2; // Each inter-division game is counted twice
    
    const stats = {
      totalGames: schedule.games.length,
      intraDivisionGames: totalIntraDivision,
      interDivisionGames: totalInterDivision,
      intraDivisionPercentage: (totalIntraDivision / schedule.games.length) * 100
    };
    
    // Prepare result
    const result = {
      title: 'Division Matchups',
      type: 'heatmap',
      xAxisCategories: divisionNames,
      yAxisCategories: divisionNames,
      series: [{
        name: 'Games',
        data: heatmapData,
        dataLabels: {
          enabled: true
        }
      }],
      colorAxis: {
        min: 0,
        stops: [
          [0, '#FFFFFF'],
          [0.5, '#77B7B2'],
          [1, '#AA4643']
        ]
      },
      statistics: stats
    };
    
    // Include raw data if requested
    if (this.includeRawData) {
      result.rawData = {
        divisions,
        divisionGames
      };
    }
    
    return result;
  }
  
  // Helper methods
  
  /**
   * Calculate distance between two locations
   * @param {Object} loc1 - First location
   * @param {Object} loc2 - Second location
   * @returns {number} Distance in miles
   * @private
   */
  _calculateDistance(loc1, loc2) {
    // Implementation of haversine formula
    const R = 3958.8; // Earth radius in miles
    
    const lat1 = loc1.latitude * Math.PI / 180;
    const lat2 = loc2.latitude * Math.PI / 180;
    const deltaLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const deltaLng = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }
  
  /**
   * Calculate home/away imbalance
   * @param {Array} teamData - Team game data
   * @returns {number} Imbalance score
   * @private
   */
  _calculateHomeAwayImbalance(teamData) {
    const idealRatio = 0.5;
    let totalSquaredDeviation = 0;
    
    for (const team of teamData) {
      const deviation = team.homeRatio - idealRatio;
      totalSquaredDeviation += deviation * deviation;
    }
    
    return Math.sqrt(totalSquaredDeviation / teamData.length);
  }
  
  /**
   * Calculate percentage of games on weekends
   * @param {Object} gameCounts - Game counts by date
   * @returns {number} Weekend percentage
   * @private
   */
  _calculateWeekendPercentage(gameCounts) {
    let weekendGames = 0;
    let totalGames = 0;
    
    for (const [dateStr, count] of Object.entries(gameCounts)) {
      if (count > 0) {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        
        totalGames += count;
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendGames += count;
        }
      }
    }
    
    return totalGames > 0 ? (weekendGames / totalGames) * 100 : 0;
  }
  
  /**
   * Count rivalries with multiple games
   * @param {Array} rivalryGames - Rivalry games
   * @param {Array} rivalries - Rivalry definitions
   * @returns {number} Count of rivalries with multiple games
   * @private
   */
  _countRivalriesWithMultipleGames(rivalryGames, rivalries) {
    const gamesPerRivalry = {};
    
    // Initialize counts
    for (const rivalry of rivalries) {
      const key = [rivalry.team1, rivalry.team2].sort().join('-');
      gamesPerRivalry[key] = 0;
    }
    
    // Count games
    for (const game of rivalryGames) {
      const key = [game.home, game.away].sort().join('-');
      gamesPerRivalry[key] = (gamesPerRivalry[key] || 0) + 1;
    }
    
    // Count rivalries with multiple games
    return Object.values(gamesPerRivalry).filter(count => count > 1).length;
  }
  
  /**
   * Get team's division
   * @param {string} teamId - Team ID
   * @param {Object} divisions - Division mapping
   * @returns {string|null} Division name
   * @private
   */
  _getTeamDivision(teamId, divisions) {
    for (const [division, teams] of Object.entries(divisions)) {
      if (teams.includes(teamId)) {
        return division;
      }
    }
    
    return null;
  }
  
  /**
   * Get mock rivalries for testing
   * @param {Array} teams - Teams
   * @returns {Array} Mock rivalries
   * @private
   */
  _getMockRivalries(teams) {
    // Create some mock rivalries for demonstration
    const rivalries = [];
    
    // Create rivalries between sequential teams
    for (let i = 0; i < teams.length - 1; i += 2) {
      rivalries.push({
        team1: teams[i].id,
        team2: teams[i + 1].id,
        intensity: Math.random()
      });
    }
    
    return rivalries;
  }
  
  /**
   * Get mock divisions for testing
   * @param {Array} teams - Teams
   * @returns {Object} Mock divisions
   * @private
   */
  _getMockDivisions(teams) {
    // Create some mock divisions for demonstration
    const divisions = {};
    const divisionCount = Math.ceil(teams.length / 4);
    
    // Create divisions
    for (let i = 0; i < divisionCount; i++) {
      divisions[`Division ${i + 1}`] = [];
    }
    
    // Assign teams to divisions
    for (let i = 0; i < teams.length; i++) {
      const divisionIndex = i % divisionCount;
      divisions[`Division ${divisionIndex + 1}`].push(teams[i].id);
    }
    
    return divisions;
  }
  
  /**
   * Capitalize first letter of a string
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   * @private
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = ScheduleVisualizationGenerator;