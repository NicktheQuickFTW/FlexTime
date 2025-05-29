/**
 * FlexTime Simulated Annealing Worker Thread
 * 
 * Worker thread for parallel simulated annealing optimization
 * Handles individual optimization chains in separate processes
 */

const { parentPort, workerData } = require('worker_threads');

// Worker-specific classes and utilities
class WorkerSchedule {
  constructor(data) {
    this.id = data.id;
    this.sport = data.sport;
    this.season = data.season;
    this.teams = data.teams;
    this.games = data.games.map(game => ({
      ...game,
      date: new Date(game.date)
    }));
    this.constraints = data.constraints;
    this.metadata = data.metadata;
  }
  
  clone() {
    return new WorkerSchedule({
      id: this.id,
      sport: this.sport,
      season: this.season,
      teams: this.teams,
      games: this.games.map(game => ({
        ...game,
        date: new Date(game.date)
      })),
      constraints: this.constraints,
      metadata: this.metadata
    });
  }
}

class WorkerOptimizer {
  constructor(config) {
    this.config = config;
    this.iterationsPerformed = 0;
    this.improvements = 0;
    this.constraintWeights = config.constraintWeights;
    this.big12Config = config.big12Config;
    this.adaptiveCooling = config.adaptiveCooling;
  }
  
  optimize(scheduleData) {
    const schedule = new WorkerSchedule(scheduleData);
    
    let currentSchedule = schedule.clone();
    let currentScore = this.calculateScore(currentSchedule);
    
    let bestSchedule = currentSchedule;
    let bestScore = currentScore;
    
    let temperature = this.config.initialTemperature;
    let iteration = 0;
    
    // Main optimization loop
    while (temperature > 0.1 && iteration < this.config.maxIterations) {
      // Generate neighbor
      const neighborSchedule = this.generateNeighbor(currentSchedule);
      const neighborScore = this.calculateScore(neighborSchedule);
      
      // Accept or reject neighbor
      if (this.acceptNeighbor(currentScore, neighborScore, temperature)) {
        currentSchedule = neighborSchedule;
        currentScore = neighborScore;
        
        if (currentScore < bestScore) {
          bestSchedule = currentSchedule.clone();
          bestScore = currentScore;
          this.improvements++;
        }
      }
      
      // Adaptive cooling
      if (this.adaptiveCooling && iteration % 50 === 0) {
        const coolingFactor = this.calculateAdaptiveCooling(iteration, bestScore, currentScore);
        temperature *= coolingFactor;
      } else if (iteration % 100 === 0) {
        temperature *= this.config.coolingRate;
      }
      
      iteration++;
      this.iterationsPerformed++;
      
      // Progress reporting
      if (iteration % 1000 === 0) {
        parentPort.postMessage({
          type: 'progress',
          chainId: this.config.chainId,
          iteration,
          score: currentScore,
          bestScore,
          temperature
        });
      }
    }
    
    return {
      schedule: this.serializeSchedule(bestSchedule),
      score: bestScore,
      iterations: this.iterationsPerformed,
      improvements: this.improvements,
      chainId: this.config.chainId
    };
  }
  
  generateNeighbor(schedule) {
    const neighbor = schedule.clone();
    
    const strategies = [
      () => this.swapGameDates(neighbor),
      () => this.swapHomeAway(neighbor),
      () => this.moveGameToNewDate(neighbor),
      () => this.swapGameVenues(neighbor),
      () => this.optimizeGameClusters(neighbor)
    ];
    
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    strategy();
    
    return neighbor;
  }
  
  swapGameDates(schedule) {
    if (schedule.games.length < 2) return;
    
    const index1 = Math.floor(Math.random() * schedule.games.length);
    let index2 = Math.floor(Math.random() * schedule.games.length);
    
    while (index2 === index1) {
      index2 = Math.floor(Math.random() * schedule.games.length);
    }
    
    const tempDate = new Date(schedule.games[index1].date);
    schedule.games[index1].date = new Date(schedule.games[index2].date);
    schedule.games[index2].date = tempDate;
  }
  
  swapHomeAway(schedule) {
    if (schedule.games.length === 0) return;
    
    const index = Math.floor(Math.random() * schedule.games.length);
    const game = schedule.games[index];
    
    const tempTeam = game.homeTeam;
    game.homeTeam = game.awayTeam;
    game.awayTeam = tempTeam;
    
    if (game.homeTeam && game.homeTeam.primaryVenue) {
      game.venue = game.homeTeam.primaryVenue;
    }
  }
  
  moveGameToNewDate(schedule) {
    if (schedule.games.length === 0) return;
    
    const index = Math.floor(Math.random() * schedule.games.length);
    const game = schedule.games[index];
    
    const dates = schedule.games.map(g => new Date(g.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const range = maxDate.getTime() - minDate.getTime();
    const newDate = new Date(minDate.getTime() + Math.random() * range);
    
    game.date = newDate;
  }
  
  swapGameVenues(schedule) {
    if (schedule.games.length < 2) return;
    
    const index1 = Math.floor(Math.random() * schedule.games.length);
    let index2 = Math.floor(Math.random() * schedule.games.length);
    
    while (index2 === index1) {
      index2 = Math.floor(Math.random() * schedule.games.length);
    }
    
    const tempVenue = schedule.games[index1].venue;
    schedule.games[index1].venue = schedule.games[index2].venue;
    schedule.games[index2].venue = tempVenue;
  }
  
  optimizeGameClusters(schedule) {
    // Try to cluster games by geographic region for travel optimization
    if (!this.big12Config || !this.big12Config.travelZones) return;
    
    const zones = this.big12Config.travelZones;
    const game = schedule.games[Math.floor(Math.random() * schedule.games.length)];
    
    // Find other games in the same travel zone
    const homeTeamZone = this.getTeamZone(game.homeTeam.name, zones);
    const awayTeamZone = this.getTeamZone(game.awayTeam.name, zones);
    
    if (homeTeamZone && awayTeamZone && homeTeamZone !== awayTeamZone) {
      // Try to cluster this game with other inter-zone games
      const interZoneGames = schedule.games.filter(g => {
        const hZone = this.getTeamZone(g.homeTeam.name, zones);
        const aZone = this.getTeamZone(g.awayTeam.name, zones);
        return hZone && aZone && hZone !== aZone;
      });
      
      if (interZoneGames.length > 1) {
        // Adjust date to cluster with other inter-zone games
        const targetGame = interZoneGames[Math.floor(Math.random() * interZoneGames.length)];
        const timeDiff = Math.abs(game.date.getTime() - targetGame.date.getTime());
        const maxClusterDistance = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (timeDiff > maxClusterDistance) {
          const direction = Math.random() > 0.5 ? 1 : -1;
          const adjustment = Math.random() * 3 * 24 * 60 * 60 * 1000; // 0-3 days
          game.date = new Date(targetGame.date.getTime() + direction * adjustment);
        }
      }
    }
  }
  
  getTeamZone(teamName, zones) {
    for (const [zone, teams] of Object.entries(zones)) {
      if (teams.some(team => teamName.toLowerCase().includes(team.toLowerCase()))) {
        return zone;
      }
    }
    return null;
  }
  
  calculateScore(schedule) {
    let totalScore = 0;
    
    // Travel distance component
    totalScore += this.calculateTravelScore(schedule) * 
                 (this.constraintWeights.TRAVEL_DISTANCE || 5.0);
    
    // Home/away balance component
    totalScore += this.calculateHomeAwayBalanceScore(schedule) * 
                 (this.constraintWeights.HOME_AWAY_BALANCE || 3.0);
    
    // Team rest component
    totalScore += this.calculateTeamRestScore(schedule) * 
                 (this.constraintWeights.TEAM_REST || 10.0);
    
    // Consecutive games component
    totalScore += this.calculateConsecutiveGamesScore(schedule) * 
                 ((this.constraintWeights.CONSECUTIVE_HOME_GAMES || 2.0) + 
                  (this.constraintWeights.CONSECUTIVE_AWAY_GAMES || 2.0)) / 2;
    
    // Big 12 specific constraints
    if (this.big12Config) {
      totalScore += this.calculateBig12Score(schedule);
    }
    
    return totalScore;
  }
  
  calculateTravelScore(schedule) {
    let totalDistance = 0;
    const teamDistances = {};
    
    for (const team of schedule.teams) {
      teamDistances[team.id] = 0;
      let currentLocation = team.location;
      
      const teamGames = schedule.games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      for (const game of teamGames) {
        const gameLocation = game.venue.location;
        
        if (currentLocation && gameLocation) {
          const distance = this.calculateDistance(currentLocation, gameLocation);
          teamDistances[team.id] += distance;
        }
        
        currentLocation = gameLocation;
      }
      
      if (currentLocation && team.location) {
        const distance = this.calculateDistance(currentLocation, team.location);
        teamDistances[team.id] += distance;
      }
      
      totalDistance += teamDistances[team.id];
    }
    
    return totalDistance / (schedule.teams.length || 1);
  }
  
  calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2) return 0;
    
    const lat1 = loc1.latitude || 0;
    const lon1 = loc1.longitude || 0;
    const lat2 = loc2.latitude || 0;
    const lon2 = loc2.longitude || 0;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  calculateHomeAwayBalanceScore(schedule) {
    let totalImbalance = 0;
    
    for (const team of schedule.teams) {
      let homeGames = 0;
      let awayGames = 0;
      
      for (const game of schedule.games) {
        if (game.homeTeam.id === team.id) {
          homeGames++;
        } else if (game.awayTeam.id === team.id) {
          awayGames++;
        }
      }
      
      const totalGames = homeGames + awayGames;
      if (totalGames > 0) {
        const expectedHome = totalGames / 2;
        const imbalance = Math.abs(homeGames - expectedHome) / totalGames;
        totalImbalance += imbalance;
      }
    }
    
    return totalImbalance / (schedule.teams.length || 1) * 100;
  }
  
  calculateTeamRestScore(schedule) {
    let totalRestViolations = 0;
    
    for (const team of schedule.teams) {
      const teamGames = schedule.games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      for (let i = 1; i < teamGames.length; i++) {
        const prevGame = teamGames[i - 1];
        const currGame = teamGames[i];
        
        const restDays = (currGame.date.getTime() - prevGame.date.getTime()) / (1000 * 60 * 60 * 24);
        
        if (restDays < 1) {
          totalRestViolations += (1 - restDays) * 10;
        }
      }
    }
    
    return totalRestViolations;
  }
  
  calculateConsecutiveGamesScore(schedule) {
    let totalViolations = 0;
    
    for (const team of schedule.teams) {
      const teamGames = schedule.games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let consecutiveHome = 0;
      let consecutiveAway = 0;
      
      for (const game of teamGames) {
        if (game.homeTeam.id === team.id) {
          consecutiveHome++;
          consecutiveAway = 0;
          
          if (consecutiveHome > 3) {
            totalViolations += consecutiveHome - 3;
          }
        } else {
          consecutiveAway++;
          consecutiveHome = 0;
          
          if (consecutiveAway > 3) {
            totalViolations += consecutiveAway - 3;
          }
        }
      }
    }
    
    return totalViolations;
  }
  
  calculateBig12Score(schedule) {
    let score = 0;
    
    // BYU Sunday restriction
    if (this.big12Config.byuSundayRestriction) {
      score += this.calculateBYUSundayViolations(schedule);
    }
    
    // Travel zone optimization
    score += this.calculateTravelZoneScore(schedule);
    
    // Venue sharing optimization
    score += this.calculateVenueSharingScore(schedule);
    
    return score;
  }
  
  calculateBYUSundayViolations(schedule) {
    let violations = 0;
    
    for (const game of schedule.games) {
      const gameDate = game.date;
      const isSunday = gameDate.getDay() === 0;
      
      if (isSunday && (game.homeTeam.name.toLowerCase().includes('byu') || 
                       game.awayTeam.name.toLowerCase().includes('byu'))) {
        violations += (this.constraintWeights.BYU_SUNDAY_RESTRICTION || 12.0);
      }
    }
    
    return violations;
  }
  
  calculateTravelZoneScore(schedule) {
    if (!this.big12Config.travelZones) return 0;
    
    let zoneViolations = 0;
    const zones = this.big12Config.travelZones;
    
    // Prefer games within same travel zone when possible
    for (const game of schedule.games) {
      const homeZone = this.getTeamZone(game.homeTeam.name, zones);
      const awayZone = this.getTeamZone(game.awayTeam.name, zones);
      
      if (homeZone && awayZone && homeZone !== awayZone) {
        // Inter-zone game - slightly higher cost
        zoneViolations += 0.5;
      }
    }
    
    return zoneViolations;
  }
  
  calculateVenueSharingScore(schedule) {
    if (!this.big12Config.venueSharing) return 0;
    
    let sharingViolations = 0;
    const venueSharing = this.big12Config.venueSharing;
    
    // Check for venue conflicts
    for (const [venue, sports] of Object.entries(venueSharing)) {
      const venueGames = schedule.games.filter(game => 
        game.venue.name && game.venue.name.includes(venue)
      );
      
      // Check for date conflicts
      for (let i = 0; i < venueGames.length; i++) {
        for (let j = i + 1; j < venueGames.length; j++) {
          const game1 = venueGames[i];
          const game2 = venueGames[j];
          
          const timeDiff = Math.abs(game1.date.getTime() - game2.date.getTime());
          const sameDay = timeDiff < 24 * 60 * 60 * 1000;
          
          if (sameDay) {
            sharingViolations += (this.constraintWeights.ARENA_SHARING || 10.0);
          }
        }
      }
    }
    
    return sharingViolations;
  }
  
  calculateAdaptiveCooling(iteration, bestScore, currentScore) {
    // Adaptive cooling based on optimization progress
    const improvementRatio = bestScore / currentScore;
    const progressRatio = iteration / this.config.maxIterations;
    
    if (improvementRatio > 0.95) { // Good improvement
      return this.config.coolingRate * 0.98; // Cool slower
    } else if (improvementRatio < 0.8) { // Poor improvement
      return this.config.coolingRate * 1.05; // Cool faster
    } else {
      return this.config.coolingRate; // Normal cooling
    }
  }
  
  acceptNeighbor(currentScore, neighborScore, temperature) {
    if (neighborScore < currentScore) {
      return true;
    }
    
    const delta = neighborScore - currentScore;
    const acceptanceProbability = Math.exp(-delta / temperature);
    
    return Math.random() < acceptanceProbability;
  }
  
  serializeSchedule(schedule) {
    return {
      id: schedule.id,
      sport: schedule.sport,
      season: schedule.season,
      teams: schedule.teams,
      games: schedule.games.map(game => ({
        ...game,
        date: game.date.toISOString()
      })),
      constraints: schedule.constraints,
      metadata: schedule.metadata
    };
  }
}

// Message handler
parentPort.on('message', (message) => {
  try {
    if (message.type === 'optimize') {
      const optimizer = new WorkerOptimizer(message.config);
      const result = optimizer.optimize(message.config.scheduleData);
      
      parentPort.postMessage({
        type: 'result',
        ...result
      });
    }
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      error: error.message,
      stack: error.stack
    });
  }
});