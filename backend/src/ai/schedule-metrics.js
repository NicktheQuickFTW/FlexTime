/**
 * FlexTime Scheduling System - Schedule Metrics Analyzer
 * 
 * Comprehensive utility for analyzing schedule quality and fairness.
 * Calculates metrics related to travel distance, home/away balance, rest days,
 * and other important scheduling factors.
 */

class ScheduleMetrics {
  /**
   * Create a new ScheduleMetrics analyzer
   * @param {Schedule} schedule - Schedule to analyze
   * @param {Object} options - Additional options
   */
  constructor(schedule, options = {}) {
    this.schedule = schedule;
    
    // Default options
    this.options = {
      idealRestDays: 2,
      maxConsecutiveGames: 3,
      idealHomeAwayRatio: 1.0,
      ...options
    };
    
    this.metrics = {
      overall: {},
      byTeam: {}
    };
  }

  /**
   * Analyze the schedule and calculate all metrics
   * @returns {Object} Metrics object with analysis results
   */
  analyze() {
    // Reset metrics
    this.metrics = {
      overall: {},
      byTeam: {}
    };
    
    // Initialize team metrics
    for (const team of this.schedule.teams) {
      this.metrics.byTeam[team.id] = {
        teamId: team.id,
        teamName: team.name,
        totalGames: 0,
        homeGames: 0,
        awayGames: 0,
        homeAwayRatio: 0,
        totalTravelDistance: 0,
        averageTravelDistance: 0,
        maxTravelDistance: 0,
        consecutiveAwayGames: {
          max: 0,
          occurrences: []
        },
        consecutiveHomeGames: {
          max: 0,
          occurrences: []
        },
        restDays: {
          average: 0,
          min: Infinity,
          max: 0,
          belowIdeal: 0
        },
        weekendGames: {
          total: 0,
          home: 0,
          away: 0,
          percentage: 0
        },
        backToBackGames: 0,
        longestHomestand: 0,
        longestRoadTrip: 0,
        gamesByMonth: {},
        gamesByDay: {
          0: 0, // Sunday
          1: 0, // Monday
          2: 0, // Tuesday
          3: 0, // Wednesday
          4: 0, // Thursday
          5: 0, // Friday
          6: 0  // Saturday
        }
      };
    }
    
    // Calculate team-specific metrics
    this._calculateTeamMetrics();
    
    // Calculate overall schedule metrics
    this._calculateOverallMetrics();
    
    return this.metrics;
  }
  
  /**
   * Calculate metrics for each team
   * @private
   */
  _calculateTeamMetrics() {
    // Group games by team
    const teamGames = new Map();
    
    for (const team of this.schedule.teams) {
      teamGames.set(team.id, []);
    }
    
    // Populate team games
    for (const game of this.schedule.games) {
      if (!game.date) continue;
      
      if (game.homeTeam && game.homeTeam.id) {
        teamGames.get(game.homeTeam.id).push({
          ...game,
          isHome: true
        });
      }
      
      if (game.awayTeam && game.awayTeam.id) {
        teamGames.get(game.awayTeam.id).push({
          ...game,
          isHome: false
        });
      }
    }
    
    // Calculate metrics for each team
    for (const [teamId, games] of teamGames.entries()) {
      const team = this.schedule.teams.find(t => t.id === teamId);
      if (!team) continue;
      
      const metrics = this.metrics.byTeam[teamId];
      
      // Sort games by date
      const sortedGames = [...games].sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Basic counts
      metrics.totalGames = sortedGames.length;
      metrics.homeGames = sortedGames.filter(g => g.isHome).length;
      metrics.awayGames = sortedGames.filter(g => !g.isHome).length;
      
      // Home/away ratio
      metrics.homeAwayRatio = metrics.homeGames / (metrics.awayGames || 1);
      
      // Travel distance
      this._calculateTravelDistances(team, sortedGames, metrics);
      
      // Consecutive games
      this._calculateConsecutiveGames(sortedGames, metrics);
      
      // Rest days
      this._calculateRestDays(sortedGames, metrics);
      
      // Weekend games
      this._calculateWeekendGames(sortedGames, metrics);
      
      // Games by month and day
      this._calculateGameDistribution(sortedGames, metrics);
    }
  }
  
  /**
   * Calculate travel distances for a team
   * @param {Object} team - Team object
   * @param {Array<Object>} games - Team's games
   * @param {Object} metrics - Team's metrics object
   * @private
   */
  _calculateTravelDistances(team, games, metrics) {
    if (!team.location || games.length === 0) return;
    
    let totalDistance = 0;
    let maxDistance = 0;
    let currentLocation = team.location;
    
    for (const game of games) {
      if (!game.venue || !game.venue.location) continue;
      
      // Calculate distance from current location to venue
      const distance = this._calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        game.venue.location.latitude,
        game.venue.location.longitude
      );
      
      totalDistance += distance;
      maxDistance = Math.max(maxDistance, distance);
      
      // Update current location
      currentLocation = game.venue.location;
    }
    
    // Final trip back home
    if (games.length > 0) {
      const lastGame = games[games.length - 1];
      if (lastGame.venue && lastGame.venue.location) {
        const distance = this._calculateDistance(
          lastGame.venue.location.latitude,
          lastGame.venue.location.longitude,
          team.location.latitude,
          team.location.longitude
        );
        
        totalDistance += distance;
        maxDistance = Math.max(maxDistance, distance);
      }
    }
    
    metrics.totalTravelDistance = Math.round(totalDistance);
    metrics.averageTravelDistance = Math.round(totalDistance / games.length);
    metrics.maxTravelDistance = Math.round(maxDistance);
  }
  
  /**
   * Calculate consecutive games metrics
   * @param {Array<Object>} games - Team's games
   * @param {Object} metrics - Team's metrics object
   * @private
   */
  _calculateConsecutiveGames(games, metrics) {
    if (games.length === 0) return;
    
    let currentHomeStreak = 0;
    let currentAwayStreak = 0;
    let maxHomeStreak = 0;
    let maxAwayStreak = 0;
    let homeStreaks = [];
    let awayStreaks = [];
    
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      
      if (game.isHome) {
        currentHomeStreak++;
        currentAwayStreak = 0;
        
        if (currentHomeStreak > maxHomeStreak) {
          maxHomeStreak = currentHomeStreak;
        }
      } else {
        currentAwayStreak++;
        currentHomeStreak = 0;
        
        if (currentAwayStreak > maxAwayStreak) {
          maxAwayStreak = currentAwayStreak;
        }
      }
      
      // Check if streak ends
      const nextGame = games[i + 1];
      if (!nextGame || (game.isHome && !nextGame.isHome)) {
        if (currentHomeStreak >= 2) {
          homeStreaks.push({
            length: currentHomeStreak,
            startDate: new Date(games[i - currentHomeStreak + 1].date),
            endDate: new Date(game.date)
          });
        }
      }
      
      if (!nextGame || (!game.isHome && nextGame.isHome)) {
        if (currentAwayStreak >= 2) {
          awayStreaks.push({
            length: currentAwayStreak,
            startDate: new Date(games[i - currentAwayStreak + 1].date),
            endDate: new Date(game.date)
          });
        }
      }
    }
    
    metrics.consecutiveHomeGames.max = maxHomeStreak;
    metrics.consecutiveHomeGames.occurrences = homeStreaks;
    metrics.consecutiveAwayGames.max = maxAwayStreak;
    metrics.consecutiveAwayGames.occurrences = awayStreaks;
    metrics.longestHomestand = maxHomeStreak;
    metrics.longestRoadTrip = maxAwayStreak;
  }
  
  /**
   * Calculate rest days metrics
   * @param {Array<Object>} games - Team's games
   * @param {Object} metrics - Team's metrics object
   * @private
   */
  _calculateRestDays(games, metrics) {
    if (games.length <= 1) return;
    
    let totalRestDays = 0;
    let minRestDays = Infinity;
    let maxRestDays = 0;
    let belowIdealCount = 0;
    let backToBackCount = 0;
    
    for (let i = 1; i < games.length; i++) {
      const prevGame = games[i - 1];
      const currentGame = games[i];
      
      const daysBetween = Math.round(
        (currentGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Days between games minus 1 is rest days
      const restDays = daysBetween - 1;
      
      totalRestDays += restDays;
      minRestDays = Math.min(minRestDays, restDays);
      maxRestDays = Math.max(maxRestDays, restDays);
      
      if (restDays < this.options.idealRestDays) {
        belowIdealCount++;
      }
      
      if (restDays === 0) {
        backToBackCount++;
      }
    }
    
    metrics.restDays.average = totalRestDays / (games.length - 1);
    metrics.restDays.min = minRestDays === Infinity ? 0 : minRestDays;
    metrics.restDays.max = maxRestDays;
    metrics.restDays.belowIdeal = belowIdealCount;
    metrics.backToBackGames = backToBackCount;
  }
  
  /**
   * Calculate weekend games metrics
   * @param {Array<Object>} games - Team's games
   * @param {Object} metrics - Team's metrics object
   * @private
   */
  _calculateWeekendGames(games, metrics) {
    if (games.length === 0) return;
    
    let totalWeekendGames = 0;
    let homeWeekendGames = 0;
    let awayWeekendGames = 0;
    
    for (const game of games) {
      const day = game.date.getDay();
      const isWeekend = day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
      
      if (isWeekend) {
        totalWeekendGames++;
        
        if (game.isHome) {
          homeWeekendGames++;
        } else {
          awayWeekendGames++;
        }
      }
    }
    
    metrics.weekendGames.total = totalWeekendGames;
    metrics.weekendGames.home = homeWeekendGames;
    metrics.weekendGames.away = awayWeekendGames;
    metrics.weekendGames.percentage = (totalWeekendGames / games.length) * 100;
  }
  
  /**
   * Calculate game distribution by month and day of week
   * @param {Array<Object>} games - Team's games
   * @param {Object} metrics - Team's metrics object
   * @private
   */
  _calculateGameDistribution(games, metrics) {
    if (games.length === 0) return;
    
    // Initialize months
    const months = {
      0: 0, // January
      1: 0, // February
      2: 0, // March
      3: 0, // April
      4: 0, // May
      5: 0, // June
      6: 0, // July
      7: 0, // August
      8: 0, // September
      9: 0, // October
      10: 0, // November
      11: 0  // December
    };
    
    for (const game of games) {
      // Count by month
      const month = game.date.getMonth();
      months[month] = (months[month] || 0) + 1;
      
      // Count by day of week
      const day = game.date.getDay();
      metrics.gamesByDay[day] = (metrics.gamesByDay[day] || 0) + 1;
    }
    
    metrics.gamesByMonth = months;
  }
  
  /**
   * Calculate overall schedule metrics
   * @private
   */
  _calculateOverallMetrics() {
    const teamMetrics = Object.values(this.metrics.byTeam);
    if (teamMetrics.length === 0) return;
    
    // Total games
    const totalGames = this.schedule.games.length;
    
    // Average metrics across teams
    const avgTravelDistance = teamMetrics.reduce((sum, m) => sum + m.totalTravelDistance, 0) / teamMetrics.length;
    const maxTravelDistance = Math.max(...teamMetrics.map(m => m.totalTravelDistance));
    const minTravelDistance = Math.min(...teamMetrics.map(m => m.totalTravelDistance));
    const travelDistanceRange = maxTravelDistance - minTravelDistance;
    
    // Home/away balance
    const homeAwayRatios = teamMetrics.map(m => m.homeAwayRatio);
    const avgHomeAwayRatio = homeAwayRatios.reduce((sum, ratio) => sum + ratio, 0) / homeAwayRatios.length;
    const maxHomeAwayRatio = Math.max(...homeAwayRatios);
    const minHomeAwayRatio = Math.min(...homeAwayRatios);
    const homeAwayRatioRange = maxHomeAwayRatio - minHomeAwayRatio;
    
    // Rest days
    const avgRestDays = teamMetrics.reduce((sum, m) => sum + m.restDays.average, 0) / teamMetrics.length;
    const minRestDays = Math.min(...teamMetrics.map(m => m.restDays.min));
    
    // Back-to-back games
    const totalBackToBack = teamMetrics.reduce((sum, m) => sum + m.backToBackGames, 0);
    const avgBackToBack = totalBackToBack / teamMetrics.length;
    const maxBackToBack = Math.max(...teamMetrics.map(m => m.backToBackGames));
    
    // Weekend games
    const totalWeekendGames = teamMetrics.reduce((sum, m) => sum + m.weekendGames.total, 0);
    const avgWeekendPercentage = teamMetrics.reduce((sum, m) => sum + m.weekendGames.percentage, 0) / teamMetrics.length;
    
    // Fairness metrics (standard deviations)
    const travelDistanceStdDev = this._calculateStandardDeviation(teamMetrics.map(m => m.totalTravelDistance));
    const homeAwayRatioStdDev = this._calculateStandardDeviation(homeAwayRatios);
    const restDaysStdDev = this._calculateStandardDeviation(teamMetrics.map(m => m.restDays.average));
    const weekendGamesStdDev = this._calculateStandardDeviation(teamMetrics.map(m => m.weekendGames.percentage));
    
    // Store overall metrics
    this.metrics.overall = {
      totalGames,
      totalTeams: teamMetrics.length,
      averageGamesPerTeam: totalGames / teamMetrics.length,
      travel: {
        averageDistance: Math.round(avgTravelDistance),
        maxDistance: Math.round(maxTravelDistance),
        minDistance: Math.round(minTravelDistance),
        range: Math.round(travelDistanceRange),
        standardDeviation: Math.round(travelDistanceStdDev)
      },
      homeAwayBalance: {
        averageRatio: avgHomeAwayRatio.toFixed(2),
        maxRatio: maxHomeAwayRatio.toFixed(2),
        minRatio: minHomeAwayRatio.toFixed(2),
        range: homeAwayRatioRange.toFixed(2),
        standardDeviation: homeAwayRatioStdDev.toFixed(2)
      },
      restDays: {
        average: avgRestDays.toFixed(1),
        minimum: minRestDays,
        standardDeviation: restDaysStdDev.toFixed(1)
      },
      backToBackGames: {
        total: totalBackToBack,
        average: avgBackToBack.toFixed(1),
        maximum: maxBackToBack
      },
      weekendGames: {
        total: totalWeekendGames,
        averagePercentage: avgWeekendPercentage.toFixed(1),
        standardDeviation: weekendGamesStdDev.toFixed(1)
      },
      fairnessScore: this._calculateFairnessScore(
        travelDistanceStdDev,
        homeAwayRatioStdDev,
        restDaysStdDev,
        weekendGamesStdDev
      )
    };
  }
  
  /**
   * Calculate standard deviation of an array of numbers
   * @param {Array<number>} values - Array of numeric values
   * @returns {number} Standard deviation
   * @private
   */
  _calculateStandardDeviation(values) {
    const n = values.length;
    if (n === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Calculate overall fairness score based on standard deviations
   * @param {number} travelStdDev - Standard deviation of travel distances
   * @param {number} homeAwayStdDev - Standard deviation of home/away ratios
   * @param {number} restDaysStdDev - Standard deviation of rest days
   * @param {number} weekendStdDev - Standard deviation of weekend games
   * @returns {number} Fairness score (0-100)
   * @private
   */
  _calculateFairnessScore(travelStdDev, homeAwayStdDev, restDaysStdDev, weekendStdDev) {
    // Normalize each standard deviation to a 0-25 scale (lower is better)
    // These weights can be adjusted based on importance
    const travelScore = Math.max(0, 25 - (travelStdDev / 500) * 25);
    const homeAwayScore = Math.max(0, 25 - (homeAwayStdDev / 0.5) * 25);
    const restDaysScore = Math.max(0, 25 - (restDaysStdDev / 1) * 25);
    const weekendScore = Math.max(0, 25 - (weekendStdDev / 15) * 25);
    
    // Sum the scores for a 0-100 scale
    return Math.round(travelScore + homeAwayScore + restDaysScore + weekendScore);
  }
  
  /**
   * Calculate the distance between two points using the Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in miles
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
        typeof lat2 !== 'number' || typeof lon2 !== 'number') {
      return 0;
    }
    
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
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   * @private
   */
  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = ScheduleMetrics;
