/**
 * Basketball-Specific Schedule Optimizer for FlexTime
 * 
 * This specialized optimizer implements basketball-specific scheduling requirements
 * and optimization strategies.
 */

const { ScheduleOptimizer } = require('../../algorithms/schedule-optimizer');
const Schedule = require('../../models/schedule');
const Game = require('../../models/game');
const logger = require("../../lib/logger");;

class BasketballScheduleOptimizer extends ScheduleOptimizer {
  /**
   * Create a new BasketballScheduleOptimizer
   * @param {Schedule} schedule - Schedule to optimize
   * @param {Object} options - Optimization options
   */
  constructor(schedule, options = {}) {
    // Basketball schedules may need more iterations for good results
    const maxIterations = options.maxIterations || 3000;
    super(schedule, maxIterations);
    
    // Basketball-specific optimization parameters
    this.conferenceWeight = options.conferenceWeight || 2.0;
    this.rivalryWeight = options.rivalryWeight || 1.5;
    this.restDaysRequired = options.restDaysRequired || 1;
    this.maxConsecutiveGames = options.maxConsecutiveGames || 4;
    
    // Conference and division setup
    this.conferences = options.conferences || {};
    this.divisions = options.divisions || {};
    
    // Rivalries
    this.rivalries = options.rivalries || [];
    
    // TV broadcasting requirements
    this.nationalTVGames = options.nationalTVGames || 0;
    this.regionalTVGames = options.regionalTVGames || 0;
    
    // Special scheduling requirements
    this.mustPlayDates = options.mustPlayDates || [];
    this.noPlayDates = options.noPlayDates || {};
    this.preferredDaysOfWeek = options.preferredDaysOfWeek || {};
    
    // Back-to-back game parameters
    this.maxBackToBackGames = options.maxBackToBackGames || 12;
    this.maxBackToBackAwayGames = options.maxBackToBackAwayGames || 4;
    
    // Data for first/last 4 games balance
    this.firstFourGamesMaxHome = options.firstFourGamesMaxHome || 3;
    this.lastFourGamesMaxHome = options.lastFourGamesMaxHome || 3;
    
    // Tournament brackets or phases if applicable
    this.tournamentBrackets = options.tournamentBrackets || null;
    
    logger.info('Basketball schedule optimizer initialized');
  }
  
  /**
   * Optimize a basketball schedule
   * @returns {Schedule} Optimized schedule
   */
  optimize() {
    logger.info(`Optimizing basketball schedule with ${this.schedule.games.length} games`);
    
    // Use base simulated annealing algorithm with basketball-specific evaluation
    // Create a deep copy of the schedule to work with
    let currentSchedule = this.schedule.clone();
    let bestSchedule = currentSchedule.clone();
    
    // Evaluate initial schedule
    let currentScore = this._evaluateSchedule(currentSchedule);
    let bestScore = currentScore;
    
    // Initialize temperature
    let temperature = this.initialTemperature || 100.0;
    let noImprovementCount = 0;
    
    // Main simulated annealing loop
    for (let i = 0; i < this.maxIterations; i++) {
      // Create a neighboring schedule by making a basketball-relevant change
      const neighborSchedule = this._createBasketballNeighbor(currentSchedule, temperature);
      
      // Evaluate the neighbor
      const neighborScore = this._evaluateSchedule(neighborSchedule);
      
      // Decide whether to accept the neighbor
      if (this._acceptNeighbor(currentScore, neighborScore, temperature)) {
        currentSchedule = neighborSchedule;
        currentScore = neighborScore;
        
        // Update best schedule if this is better
        if (neighborScore < bestScore) {
          bestSchedule = neighborSchedule.clone();
          bestScore = neighborScore;
          noImprovementCount = 0;
        } else {
          noImprovementCount++;
        }
      }
      
      // Early stopping if no improvement for a while
      if (noImprovementCount > this.maxIterations / 10) {
        logger.info(`Early stopping at iteration ${i} due to no improvement`);
        break;
      }
      
      // Cool down the temperature
      temperature *= 0.95;
    }
    
    // Apply final basketball-specific fixes
    bestSchedule = this._applyBasketballSpecificFixes(bestSchedule);
    
    logger.info(`Basketball schedule optimization complete. Final score: ${bestScore}`);
    return bestSchedule;
  }
  
  /**
   * Create a neighboring schedule with basketball-specific changes
   * @param {Schedule} schedule - Current schedule
   * @param {number} temperature - Current temperature
   * @returns {Schedule} Neighboring schedule
   * @private
   */
  _createBasketballNeighbor(schedule, temperature) {
    // Choose a modification strategy based on temperature
    const normalizedTemp = Math.min(1.0, temperature / 100.0);
    
    // At higher temperatures, make bigger changes
    if (normalizedTemp > 0.7) {
      // Major changes (swap multiple games)
      return this._swapMultipleGames(schedule);
    } else if (normalizedTemp > 0.4) {
      // Medium changes (conference-aware swaps)
      return this._swapConferenceGames(schedule);
    } else {
      // Minor tweaks (home/away balance, rest days)
      const strategies = [
        this._swapHomeAway.bind(this),
        this._adjustRestDays.bind(this),
        this._optimizeRivalryGames.bind(this),
        this._balanceFirstLastGames.bind(this)
      ];
      
      const strategyIndex = Math.floor(Math.random() * strategies.length);
      return strategies[strategyIndex](schedule);
    }
  }
  
  /**
   * Swap multiple games to create a significant change
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _swapMultipleGames(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 4) {
      return newSchedule;
    }
    
    // Pick multiple games to swap dates
    const numGamesToSwap = 2 + Math.floor(Math.random() * 3); // 2-4 games
    const gameIndices = [];
    
    // Select random games
    for (let i = 0; i < numGamesToSwap; i++) {
      let index;
      do {
        index = Math.floor(Math.random() * newSchedule.games.length);
      } while (gameIndices.includes(index));
      
      gameIndices.push(index);
    }
    
    // Collect dates from these games
    const dates = gameIndices.map(idx => new Date(newSchedule.games[idx].date));
    
    // Shuffle dates
    this._shuffleArray(dates);
    
    // Assign shuffled dates back to games
    for (let i = 0; i < gameIndices.length; i++) {
      newSchedule.games[gameIndices[i]].date = dates[i];
    }
    
    // Invalidate caches
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }
  
  /**
   * Swap games within the same conference
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _swapConferenceGames(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 2 || Object.keys(this.conferences).length === 0) {
      return this._swapHomeAway(newSchedule);
    }
    
    // Group games by conference
    const conferenceGames = {};
    
    // Initialize conference game arrays
    for (const conference of Object.keys(this.conferences)) {
      conferenceGames[conference] = [];
    }
    
    // Add an "unknown" category for teams not in defined conferences
    conferenceGames["unknown"] = [];
    
    // Assign games to conferences
    for (let i = 0; i < newSchedule.games.length; i++) {
      const game = newSchedule.games[i];
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      
      // Find team conferences
      const homeConference = this._getTeamConference(homeTeamId);
      const awayConference = this._getTeamConference(awayTeamId);
      
      // If both teams are in the same conference, add to that conference's games
      if (homeConference && awayConference && homeConference === awayConference) {
        conferenceGames[homeConference].push(i);
      } else {
        // Otherwise, add to unknown
        conferenceGames["unknown"].push(i);
      }
    }
    
    // Pick a conference that has at least 2 games
    const conferencesWithGames = Object.keys(conferenceGames).filter(
      c => conferenceGames[c].length >= 2
    );
    
    if (conferencesWithGames.length === 0) {
      return this._swapHomeAway(newSchedule);
    }
    
    const conferenceIndex = Math.floor(Math.random() * conferencesWithGames.length);
    const selectedConference = conferencesWithGames[conferenceIndex];
    const conferenceGameIndices = conferenceGames[selectedConference];
    
    // Pick two different games from the conference
    const gameIndex1 = Math.floor(Math.random() * conferenceGameIndices.length);
    let gameIndex2 = Math.floor(Math.random() * conferenceGameIndices.length);
    
    // Ensure we pick two different games
    while (gameIndex2 === gameIndex1) {
      gameIndex2 = Math.floor(Math.random() * conferenceGameIndices.length);
    }
    
    const actualIndex1 = conferenceGameIndices[gameIndex1];
    const actualIndex2 = conferenceGameIndices[gameIndex2];
    
    // Swap dates
    const date1 = new Date(newSchedule.games[actualIndex1].date);
    const date2 = new Date(newSchedule.games[actualIndex2].date);
    
    newSchedule.games[actualIndex1].date = date2;
    newSchedule.games[actualIndex2].date = date1;
    
    // Invalidate caches
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }
  
  /**
   * Swap home and away teams for a game
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _swapHomeAway(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 1) {
      return newSchedule;
    }
    
    // Select a random game
    const gameIndex = Math.floor(Math.random() * newSchedule.games.length);
    const game = newSchedule.games[gameIndex];
    
    // Swap home and away teams
    const newGame = new Game(
      game.id,
      game.awayTeam, // Now home team
      game.homeTeam, // Now away team
      game.awayTeam.venues && game.awayTeam.venues.length > 0 
        ? game.awayTeam.venues[0] 
        : game.awayTeam.primaryVenue,
      game.date,
      game.sport,
      game.specialDesignation,
      game.tvNetwork
    );
    
    // Replace the game in the schedule
    newSchedule.games[gameIndex] = newGame;
    
    // Invalidate caches
    newSchedule._totalDistance = null;
    newSchedule._constraintViolations = null;
    
    return newSchedule;
  }
  
  /**
   * Adjust games to improve rest days
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _adjustRestDays(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 3) {
      return newSchedule;
    }
    
    // Group games by team
    const teamGames = {};
    
    for (const team of newSchedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (let i = 0; i < newSchedule.games.length; i++) {
      const game = newSchedule.games[i];
      teamGames[game.homeTeam.id].push({ index: i, home: true });
      teamGames[game.awayTeam.id].push({ index: i, home: false });
    }
    
    // Pick a random team
    const teamIds = Object.keys(teamGames);
    const teamId = teamIds[Math.floor(Math.random() * teamIds.length)];
    const teamGameRefs = teamGames[teamId];
    
    // Sort games by date
    teamGameRefs.sort((a, b) => {
      return newSchedule.games[a.index].date.getTime() - 
             newSchedule.games[b.index].date.getTime();
    });
    
    // Find back-to-back games or games with insufficient rest
    for (let i = 1; i < teamGameRefs.length; i++) {
      const prevGameRef = teamGameRefs[i - 1];
      const currGameRef = teamGameRefs[i];
      
      const prevGame = newSchedule.games[prevGameRef.index];
      const currGame = newSchedule.games[currGameRef.index];
      
      // Calculate days between games
      const daysBetween = Math.floor(
        (currGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysBetween < this.restDaysRequired) {
        // Try to fix by adjusting one game's date
        if (Math.random() < 0.5) {
          // Move earlier game back by 1 day
          const newDate = new Date(prevGame.date);
          newDate.setDate(newDate.getDate() - 1);
          newSchedule.games[prevGameRef.index].date = newDate;
        } else {
          // Move later game forward by 1 day
          const newDate = new Date(currGame.date);
          newDate.setDate(newDate.getDate() + 1);
          newSchedule.games[currGameRef.index].date = newDate;
        }
        
        // Invalidate caches
        newSchedule._constraintViolations = null;
        break;
      }
    }
    
    return newSchedule;
  }
  
  /**
   * Optimize rivalry games scheduling
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _optimizeRivalryGames(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 2 || this.rivalries.length === 0) {
      return newSchedule;
    }
    
    // Find games between rivalry teams
    const rivalryGameIndices = [];
    
    for (let i = 0; i < newSchedule.games.length; i++) {
      const game = newSchedule.games[i];
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      
      // Check if these teams are rivals
      const isRivalry = this.rivalries.some(rivalry => 
        (rivalry.team1 === homeTeamId && rivalry.team2 === awayTeamId) ||
        (rivalry.team1 === awayTeamId && rivalry.team2 === homeTeamId)
      );
      
      if (isRivalry) {
        rivalryGameIndices.push(i);
      }
    }
    
    if (rivalryGameIndices.length < 1) {
      return newSchedule;
    }
    
    // Pick a random rivalry game
    const gameIndex = rivalryGameIndices[Math.floor(Math.random() * rivalryGameIndices.length)];
    
    // Try to move it to a weekend if it's not already
    const game = newSchedule.games[gameIndex];
    const gameDate = new Date(game.date);
    const dayOfWeek = gameDate.getDay();
    
    // If not on weekend (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Find nearest weekend day
      const daysToSaturday = 6 - dayOfWeek;
      const daysToSunday = (7 - dayOfWeek) % 7;
      
      // Choose closer weekend day
      const daysToMove = daysToSaturday <= daysToSunday ? daysToSaturday : daysToSunday;
      
      const newDate = new Date(gameDate);
      newDate.setDate(newDate.getDate() + daysToMove);
      
      // Update the game date
      newSchedule.games[gameIndex].date = newDate;
      
      // Invalidate caches
      newSchedule._constraintViolations = null;
    }
    
    return newSchedule;
  }
  
  /**
   * Balance first and last few games of the season
   * @param {Schedule} schedule - Current schedule
   * @returns {Schedule} Modified schedule
   * @private
   */
  _balanceFirstLastGames(schedule) {
    const newSchedule = schedule.clone();
    
    if (newSchedule.games.length < 8) {
      return newSchedule;
    }
    
    // Group games by team and sort by date
    const teamGames = {};
    
    for (const team of newSchedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (let i = 0; i < newSchedule.games.length; i++) {
      const game = newSchedule.games[i];
      teamGames[game.homeTeam.id].push({ index: i, home: true });
      teamGames[game.awayTeam.id].push({ index: i, home: false });
    }
    
    // Sort each team's games by date
    for (const teamId of Object.keys(teamGames)) {
      teamGames[teamId].sort((a, b) => {
        return newSchedule.games[a.index].date.getTime() - 
               newSchedule.games[b.index].date.getTime();
      });
    }
    
    // Pick a random team
    const teamIds = Object.keys(teamGames);
    const teamId = teamIds[Math.floor(Math.random() * teamIds.length)];
    const teamGameRefs = teamGames[teamId];
    
    if (teamGameRefs.length < 8) {
      return newSchedule;
    }
    
    // Check first 4 games
    const firstFourGames = teamGameRefs.slice(0, 4);
    const homeGamesFirst = firstFourGames.filter(g => g.home).length;
    
    // Check last 4 games
    const lastFourGames = teamGameRefs.slice(-4);
    const homeGamesLast = lastFourGames.filter(g => g.home).length;
    
    // Fix imbalance if needed
    if (homeGamesFirst > this.firstFourGamesMaxHome) {
      // Too many home games at start, swap one with an away game later
      const homeGameRef = firstFourGames.find(g => g.home);
      const laterAwayGameRef = teamGameRefs.slice(4).find(g => !g.home);
      
      if (homeGameRef && laterAwayGameRef) {
        // Swap home/away designation
        const homeGame = newSchedule.games[homeGameRef.index];
        const awayGame = newSchedule.games[laterAwayGameRef.index];
        
        // Create new games with swapped teams
        newSchedule.games[homeGameRef.index] = new Game(
          homeGame.id,
          homeGame.awayTeam,
          homeGame.homeTeam,
          homeGame.awayTeam.venues && homeGame.awayTeam.venues.length > 0 
            ? homeGame.awayTeam.venues[0] 
            : homeGame.awayTeam.primaryVenue,
          homeGame.date,
          homeGame.sport,
          homeGame.specialDesignation,
          homeGame.tvNetwork
        );
        
        // Invalidate caches
        newSchedule._constraintViolations = null;
      }
    } else if (homeGamesLast > this.lastFourGamesMaxHome) {
      // Too many home games at end, swap one with an away game earlier
      const homeGameRef = lastFourGames.find(g => g.home);
      const earlierAwayGameRef = teamGameRefs.slice(0, -4).find(g => !g.home);
      
      if (homeGameRef && earlierAwayGameRef) {
        // Swap home/away designation
        const homeGame = newSchedule.games[homeGameRef.index];
        const awayGame = newSchedule.games[earlierAwayGameRef.index];
        
        // Create new games with swapped teams
        newSchedule.games[homeGameRef.index] = new Game(
          homeGame.id,
          homeGame.awayTeam,
          homeGame.homeTeam,
          homeGame.awayTeam.venues && homeGame.awayTeam.venues.length > 0 
            ? homeGame.awayTeam.venues[0] 
            : homeGame.awayTeam.primaryVenue,
          homeGame.date,
          homeGame.sport,
          homeGame.specialDesignation,
          homeGame.tvNetwork
        );
        
        // Invalidate caches
        newSchedule._constraintViolations = null;
      }
    }
    
    return newSchedule;
  }
  
  /**
   * Apply final basketball-specific fixes to a schedule
   * @param {Schedule} schedule - Optimized schedule
   * @returns {Schedule} Schedule with fixes applied
   * @private
   */
  _applyBasketballSpecificFixes(schedule) {
    let fixedSchedule = schedule.clone();
    
    // Fix nationally televised games
    fixedSchedule = this._fixNationalTVGames(fixedSchedule);
    
    // Fix must-play dates
    fixedSchedule = this._fixMustPlayDates(fixedSchedule);
    
    // Balance back-to-back games
    fixedSchedule = this._balanceBackToBackGames(fixedSchedule);
    
    return fixedSchedule;
  }
  
  /**
   * Fix nationally televised games to be on appropriate days
   * @param {Schedule} schedule - Schedule to fix
   * @returns {Schedule} Fixed schedule
   * @private
   */
  _fixNationalTVGames(schedule) {
    // Implementation depends on TV game requirements
    return schedule;
  }
  
  /**
   * Fix must-play dates
   * @param {Schedule} schedule - Schedule to fix
   * @returns {Schedule} Fixed schedule
   * @private
   */
  _fixMustPlayDates(schedule) {
    // Implementation depends on must-play date requirements
    return schedule;
  }
  
  /**
   * Balance back-to-back games
   * @param {Schedule} schedule - Schedule to fix
   * @returns {Schedule} Fixed schedule
   * @private
   */
  _balanceBackToBackGames(schedule) {
    // Implementation depends on back-to-back game requirements
    return schedule;
  }
  
  /**
   * Evaluate schedule quality with basketball-specific metrics
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Quality score (lower is better)
   * @private
   */
  _evaluateSchedule(schedule) {
    // Start with base evaluation
    let score = super._evaluateSchedule(schedule);
    
    // Add basketball-specific evaluations
    const conferenceBalanceScore = this._evaluateConferenceBalance(schedule);
    const rivalrySpacingScore = this._evaluateRivalrySpacing(schedule);
    const backToBackScore = this._evaluateBackToBackGames(schedule);
    const firstLastGamesScore = this._evaluateFirstLastGames(schedule);
    
    // Add weighted scores
    score += conferenceBalanceScore * this.conferenceWeight;
    score += rivalrySpacingScore * this.rivalryWeight;
    score += backToBackScore * 1.5;
    score += firstLastGamesScore * 1.2;
    
    return score;
  }
  
  /**
   * Evaluate conference balance
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Conference balance score
   * @private
   */
  _evaluateConferenceBalance(schedule) {
    // Simplified implementation
    if (Object.keys(this.conferences).length === 0) {
      return 0;
    }
    
    let score = 0;
    
    // Count in-conference and out-of-conference games
    const conferenceGameCounts = {};
    
    for (const team of schedule.teams) {
      conferenceGameCounts[team.id] = {
        inConference: 0,
        outOfConference: 0
      };
    }
    
    for (const game of schedule.games) {
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;
      
      const homeConference = this._getTeamConference(homeTeamId);
      const awayConference = this._getTeamConference(awayTeamId);
      
      // If both teams in same conference
      if (homeConference && awayConference && homeConference === awayConference) {
        conferenceGameCounts[homeTeamId].inConference++;
        conferenceGameCounts[awayTeamId].inConference++;
      } else {
        conferenceGameCounts[homeTeamId].outOfConference++;
        conferenceGameCounts[awayTeamId].outOfConference++;
      }
    }
    
    // Check balance
    for (const teamId of Object.keys(conferenceGameCounts)) {
      const counts = conferenceGameCounts[teamId];
      const totalGames = counts.inConference + counts.outOfConference;
      
      if (totalGames > 0) {
        // Conference games should be about 75% of total for typical basketball
        const targetInConferenceRatio = 0.75;
        const actualRatio = counts.inConference / totalGames;
        
        // Penalize deviation from target
        score += Math.abs(actualRatio - targetInConferenceRatio) * 10;
      }
    }
    
    return score;
  }
  
  /**
   * Evaluate rivalry game spacing
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Rivalry spacing score
   * @private
   */
  _evaluateRivalrySpacing(schedule) {
    if (this.rivalries.length === 0) {
      return 0;
    }
    
    let score = 0;
    
    // Find all games between rivalry teams
    for (const rivalry of this.rivalries) {
      const rivalryGames = schedule.games.filter(game => 
        (game.homeTeam.id === rivalry.team1 && game.awayTeam.id === rivalry.team2) ||
        (game.homeTeam.id === rivalry.team2 && game.awayTeam.id === rivalry.team1)
      );
      
      // Sort by date
      rivalryGames.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Check if rivalry games are spaced properly
      if (rivalryGames.length >= 2) {
        // Calculate days between games
        for (let i = 1; i < rivalryGames.length; i++) {
          const prevGame = rivalryGames[i - 1];
          const currGame = rivalryGames[i];
          
          const daysBetween = Math.floor(
            (currGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // For rivalries, games should be well-spaced (at least 30 days apart)
          const minDaysBetween = 30;
          
          if (daysBetween < minDaysBetween) {
            score += (minDaysBetween - daysBetween) * 0.5;
          }
        }
        
        // Check if rivalry games are on weekends (preferred)
        for (const game of rivalryGames) {
          const dayOfWeek = new Date(game.date).getDay();
          // If not weekend (0 = Sunday, 6 = Saturday)
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            score += 2;
          }
        }
      }
    }
    
    return score;
  }
  
  /**
   * Evaluate back-to-back games
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} Back-to-back games score
   * @private
   */
  _evaluateBackToBackGames(schedule) {
    let score = 0;
    
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push({
        date: new Date(game.date),
        isHome: true
      });
      
      teamGames[game.awayTeam.id].push({
        date: new Date(game.date),
        isHome: false
      });
    }
    
    // Analyze each team's schedule
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let backToBackCount = 0;
      let backToBackAwayCount = 0;
      
      // Find back-to-back games
      for (let i = 1; i < games.length; i++) {
        const prevGame = games[i - 1];
        const currGame = games[i];
        
        // Calculate days between games
        const daysBetween = Math.floor(
          (currGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysBetween <= 1) {
          backToBackCount++;
          
          // Count back-to-back away games
          if (!prevGame.isHome && !currGame.isHome) {
            backToBackAwayCount++;
          }
        }
      }
      
      // Penalize excess back-to-back games
      if (backToBackCount > this.maxBackToBackGames) {
        score += (backToBackCount - this.maxBackToBackGames) * 3;
      }
      
      // Penalize excess back-to-back away games
      if (backToBackAwayCount > this.maxBackToBackAwayGames) {
        score += (backToBackAwayCount - this.maxBackToBackAwayGames) * 5;
      }
    }
    
    return score;
  }
  
  /**
   * Evaluate first and last games balance
   * @param {Schedule} schedule - Schedule to evaluate
   * @returns {number} First/last games balance score
   * @private
   */
  _evaluateFirstLastGames(schedule) {
    let score = 0;
    
    // Group games by team
    const teamGames = {};
    
    for (const team of schedule.teams) {
      teamGames[team.id] = [];
    }
    
    for (const game of schedule.games) {
      teamGames[game.homeTeam.id].push({
        date: new Date(game.date),
        isHome: true
      });
      
      teamGames[game.awayTeam.id].push({
        date: new Date(game.date),
        isHome: false
      });
    }
    
    // Analyze each team's schedule
    for (const [teamId, games] of Object.entries(teamGames)) {
      // Sort games by date
      games.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      if (games.length < 8) continue;
      
      // Check first 4 games
      const firstFourGames = games.slice(0, 4);
      const homeGamesFirst = firstFourGames.filter(g => g.isHome).length;
      
      // Check last 4 games
      const lastFourGames = games.slice(-4);
      const homeGamesLast = lastFourGames.filter(g => g.isHome).length;
      
      // Penalize imbalance
      if (homeGamesFirst > this.firstFourGamesMaxHome) {
        score += (homeGamesFirst - this.firstFourGamesMaxHome) * 4;
      }
      
      if (homeGamesLast > this.lastFourGamesMaxHome) {
        score += (homeGamesLast - this.lastFourGamesMaxHome) * 4;
      }
    }
    
    return score;
  }
  
  /**
   * Get the conference for a team
   * @param {string} teamId - Team ID
   * @returns {string|null} Conference name
   * @private
   */
  _getTeamConference(teamId) {
    for (const [conference, teams] of Object.entries(this.conferences)) {
      if (teams.includes(teamId)) {
        return conference;
      }
    }
    
    return null;
  }
  
  /**
   * Get the division for a team
   * @param {string} teamId - Team ID
   * @returns {string|null} Division name
   * @private
   */
  _getTeamDivision(teamId) {
    for (const [division, teams] of Object.entries(this.divisions)) {
      if (teams.includes(teamId)) {
        return division;
      }
    }
    
    return null;
  }
  
  /**
   * Shuffle an array in place
   * @param {Array} array - Array to shuffle
   * @private
   */
  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

module.exports = BasketballScheduleOptimizer;