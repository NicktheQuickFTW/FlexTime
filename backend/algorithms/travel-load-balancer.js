/**
 * FlexTime Scheduling System - Travel Load Balancer
 * 
 * Balances travel load across teams to ensure fairness.
 * Inspired by the TravelLoadBalancer from FlexTime v2.1.
 */

const TravelDistanceCalculator = require('./travel-distance-calculator');

/**
 * Balances travel load across teams to ensure fairness
 */
class TravelLoadBalancer {
  /**
   * Create a new TravelLoadBalancer
   * @param {Object} schedule - Schedule to balance
   * @param {TravelDistanceCalculator} distanceCalculator - Distance calculator
   */
  constructor(schedule, distanceCalculator) {
    this.schedule = schedule;
    this.distanceCalculator = distanceCalculator || new TravelDistanceCalculator(schedule.teams);
  }
  
  /**
   * Balance travel load across teams
   * @returns {Object} Balanced schedule
   */
  balance() {
    // Create a deep copy of the schedule to work with
    const newSchedule = this.schedule.clone();
    
    // Calculate total travel distance for each team
    const teamDistances = this._calculateTeamDistances();
    
    // Calculate statistics
    const distances = Object.values(teamDistances);
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    const minDistance = Math.min(...distances);
    
    // Identify teams with excessive or light travel
    const threshold = 0.2; // 20% above/below average
    const excessiveTeams = [];
    const lightTeams = [];
    
    for (const [teamId, distance] of Object.entries(teamDistances)) {
      if (distance > avgDistance * (1 + threshold)) {
        excessiveTeams.push(teamId);
      } else if (distance < avgDistance * (1 - threshold)) {
        lightTeams.push(teamId);
      }
    }
    
    // Balance by swapping home/away for some games
    if (excessiveTeams.length > 0 && lightTeams.length > 0) {
      this._balanceBySwapping(excessiveTeams, lightTeams, teamDistances, newSchedule);
    }
    
    // Store travel metrics in schedule metadata
    if (!newSchedule.metadata) newSchedule.metadata = {};
    newSchedule.metadata.travelMetrics = {
      avgDistance: Math.round(avgDistance),
      maxDistance: Math.round(maxDistance),
      minDistance: Math.round(minDistance),
      balancedTeams: excessiveTeams.length + lightTeams.length
    };
    
    return newSchedule;
  }
  
  /**
   * Calculate total travel distance for each team
   * @returns {Object} Map of team IDs to total travel distances
   * @private
   */
  _calculateTeamDistances() {
    const teamDistances = {};
    
    // Initialize distances
    for (const team of this.schedule.teams) {
      teamDistances[team.id] = 0;
    }
    
    // Calculate for each team
    for (const team of this.schedule.teams) {
      let currentLocation = team.location;
      let totalDistance = 0;
      
      // Get games for this team sorted by date
      const teamGames = this.schedule.games
        .filter(game => game.homeTeam.id === team.id || game.awayTeam.id === team.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      for (const game of teamGames) {
        const venue = game.venue;
        
        if (currentLocation && venue && venue.location) {
          // Calculate distance to venue
          const distance = this.distanceCalculator.getDistance(currentLocation, venue.location);
          totalDistance += distance;
          
          // Update current location
          currentLocation = venue.location;
        }
      }
      
      // Add final return trip home
      if (currentLocation && team.location) {
        const distance = this.distanceCalculator.getDistance(currentLocation, team.location);
        totalDistance += distance;
      }
      
      teamDistances[team.id] = totalDistance;
    }
    
    return teamDistances;
  }
  
  /**
   * Balance travel load by swapping home/away for some games
   * @param {Array} excessiveTeams - Teams with excessive travel
   * @param {Array} lightTeams - Teams with light travel
   * @param {Object} teamDistances - Current team distances
   * @param {Object} schedule - Schedule to modify
   * @private
   */
  _balanceBySwapping(excessiveTeams, lightTeams, teamDistances, schedule) {
    // For each excessive team, try to reduce travel by swapping games
    for (const excessiveTeamId of excessiveTeams) {
      const excessiveTeam = schedule.teams.find(t => t.id === excessiveTeamId);
      if (!excessiveTeam) continue;
      
      // Find games where this team is away and opponent is a light-travel team
      for (const lightTeamId of lightTeams) {
        const lightTeam = schedule.teams.find(t => t.id === lightTeamId);
        if (!lightTeam) continue;
        
        // Find games between these teams where excessive team is away
        const games = schedule.games.filter(game => 
          game.homeTeam.id === lightTeamId && game.awayTeam.id === excessiveTeamId
        );
        
        for (const game of games) {
          // Calculate impact of swapping
          const impact = this._calculateSwapImpact(game, teamDistances);
          
          // Swap if it improves balance
          if (impact.improves) {
            // Swap home and away teams
            const tempTeam = game.homeTeam;
            game.homeTeam = game.awayTeam;
            game.awayTeam = tempTeam;
            
            // Update venue
            if (game.homeTeam.primaryVenue) {
              game.venue = game.homeTeam.primaryVenue;
            }
            
            // Update distances
            teamDistances[excessiveTeamId] -= impact.excessiveTeamChange;
            teamDistances[lightTeamId] += impact.lightTeamChange;
            
            // Break after one successful swap per pair
            break;
          }
        }
      }
    }
  }
  
  /**
   * Calculate the impact of swapping home/away for a game on overall balance
   * @param {Object} game - Game to evaluate
   * @param {Object} teamDistances - Current team distances
   * @returns {Object} Impact assessment
   * @private
   */
  _calculateSwapImpact(game, teamDistances) {
    const homeTeam = game.homeTeam;
    const awayTeam = game.awayTeam;
    
    if (!homeTeam || !awayTeam || !homeTeam.location || !awayTeam.location || !game.venue || !game.venue.location) {
      return { improves: false };
    }
    
    // Current distances
    const homeTeamDistance = teamDistances[homeTeam.id] || 0;
    const awayTeamDistance = teamDistances[awayTeam.id] || 0;
    
    // Calculate current imbalance
    const currentImbalance = Math.abs(homeTeamDistance - awayTeamDistance);
    
    // Calculate distance changes if we swap
    const homeTeamChange = this.distanceCalculator.getDistance(homeTeam.location, awayTeam.primaryVenue.location) -
                          this.distanceCalculator.getDistance(homeTeam.location, game.venue.location);
                          
    const awayTeamChange = this.distanceCalculator.getDistance(awayTeam.location, homeTeam.primaryVenue.location) -
                          this.distanceCalculator.getDistance(awayTeam.location, game.venue.location);
    
    // New distances after swap
    const newHomeTeamDistance = homeTeamDistance + homeTeamChange;
    const newAwayTeamDistance = awayTeamDistance + awayTeamChange;
    
    // Calculate new imbalance
    const newImbalance = Math.abs(newHomeTeamDistance - newAwayTeamDistance);
    
    return {
      improves: newImbalance < currentImbalance,
      excessiveTeamChange: awayTeamChange,
      lightTeamChange: homeTeamChange
    };
  }
}

module.exports = TravelLoadBalancer;
