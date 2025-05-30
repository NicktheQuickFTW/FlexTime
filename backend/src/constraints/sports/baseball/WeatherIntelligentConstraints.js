/**
 * Weather-Intelligent Baseball & Softball Scheduling Constraints
 * Enhanced Big 12 Conference scheduling with climate data integration
 * 
 * Features:
 * - Regional weather pattern analysis
 * - Climate-based scheduling optimization
 * - Dynamic weather risk assessment
 * - Seasonal precipitation forecasting
 */

class WeatherIntelligentConstraints {
  constructor() {
    this.initializeClimateData();
    this.setupWeatherPatterns();
  }

  /**
   * Initialize Big 12 regional climate data
   */
  initializeClimateData() {
    // Big 12 regional climate zones with historical weather patterns
    this.climateZones = {
      'Southwest': {
        teams: ['Arizona', 'Arizona State', 'Texas Tech', 'TCU'],
        characteristics: {
          springRainfall: 'low',
          windProbability: 'high',
          temperatureStability: 'high',
          playabilityRating: 0.9
        },
        monthlyRainDays: {
          'March': 3, 'April': 4, 'May': 5
        },
        optimalSchedulingMonths: ['March', 'April', 'early May']
      },
      'Mountain': {
        teams: ['Colorado', 'Utah', 'BYU'],
        characteristics: {
          springRainfall: 'moderate',
          snowRisk: 'high-early-season',
          temperatureStability: 'variable',
          playabilityRating: 0.7
        },
        monthlyRainDays: {
          'March': 8, 'April': 7, 'May': 8
        },
        optimalSchedulingMonths: ['late April', 'May']
      },
      'Plains': {
        teams: ['Kansas', 'Kansas State', 'Oklahoma State', 'Iowa State'],
        characteristics: {
          springRainfall: 'high',
          stormProbability: 'very-high',
          temperatureStability: 'moderate',
          playabilityRating: 0.6
        },
        monthlyRainDays: {
          'March': 7, 'April': 9, 'May': 11
        },
        optimalSchedulingMonths: ['March', 'late May']
      },
      'South-Central': {
        teams: ['Baylor', 'Houston'],
        characteristics: {
          springRainfall: 'very-high',
          stormProbability: 'extreme',
          humidityImpact: 'high',
          playabilityRating: 0.5
        },
        monthlyRainDays: {
          'March': 6, 'April': 7, 'May': 9
        },
        optimalSchedulingMonths: ['March', 'early April']
      },
      'Southeast': {
        teams: ['West Virginia', 'Cincinnati', 'UCF'],
        characteristics: {
          springRainfall: 'high',
          temperatureStability: 'high',
          stormProbability: 'moderate',
          playabilityRating: 0.75
        },
        monthlyRainDays: {
          'March': 10, 'April': 9, 'May': 10
        },
        optimalSchedulingMonths: ['March', 'April', 'May']
      }
    };

    // Historical cancellation data by region and month
    this.cancellationRates = {
      'Southwest': { 'March': 0.05, 'April': 0.03, 'May': 0.02 },
      'Mountain': { 'March': 0.15, 'April': 0.08, 'May': 0.05 },
      'Plains': { 'March': 0.12, 'April': 0.18, 'May': 0.20 },
      'South-Central': { 'March': 0.08, 'April': 0.15, 'May': 0.22 },
      'Southeast': { 'March': 0.10, 'April': 0.12, 'May': 0.14 }
    };
  }

  /**
   * Setup weather-based scheduling patterns
   */
  setupWeatherPatterns() {
    this.weatherOptimizationStrategies = {
      'early_season_warm_weather_priority': {
        description: 'Prioritize warm-weather venues for early season',
        implementation: 'Schedule southern/southwestern teams to host early',
        weight: 0.8
      },
      'storm_season_avoidance': {
        description: 'Minimize scheduling during peak storm seasons',
        implementation: 'Avoid Plains region during April-May peak',
        weight: 0.9
      },
      'backup_venue_coordination': {
        description: 'Coordinate backup venues for weather-prone regions',
        implementation: 'Pre-arrange indoor/covered facilities',
        weight: 0.7
      },
      'series_format_flexibility': {
        description: 'Adjust series formats based on weather risk',
        implementation: 'Allow Thu-Sat format for high-risk weekends',
        weight: 0.6
      }
    };
  }

  /**
   * Calculate weather risk score for a potential game/series
   */
  calculateWeatherRisk(hostTeam, date, seriesFormat = 'Fri-Sun') {
    const region = this.getTeamRegion(hostTeam);
    const month = new Date(date).toLocaleString('default', { month: 'long' });
    const zone = this.climateZones[region];
    
    if (!zone) return { risk: 0.5, confidence: 'low' };

    const baseRisk = this.cancellationRates[region][month] || 0.1;
    
    // Adjust risk based on series format
    let formatMultiplier = 1.0;
    if (seriesFormat === 'Thu-Sat') {
      formatMultiplier = 0.8; // Slightly better weather midweek
    }

    // Apply regional characteristics
    let riskMultiplier = 1.0;
    if (zone.characteristics.stormProbability === 'extreme') {
      riskMultiplier = 1.4;
    } else if (zone.characteristics.stormProbability === 'very-high') {
      riskMultiplier = 1.2;
    } else if (zone.characteristics.stormProbability === 'high') {
      riskMultiplier = 1.1;
    }

    const finalRisk = Math.min(baseRisk * formatMultiplier * riskMultiplier, 1.0);
    
    return {
      risk: finalRisk,
      confidence: finalRisk < 0.1 ? 'high' : finalRisk < 0.2 ? 'medium' : 'low',
      recommendations: this.generateWeatherRecommendations(region, month, finalRisk)
    };
  }

  /**
   * Generate weather-based scheduling recommendations
   */
  generateWeatherRecommendations(region, month, riskLevel) {
    const recommendations = [];
    
    if (riskLevel > 0.15) {
      recommendations.push('Consider indoor or covered facility');
      recommendations.push('Schedule backup date within same week');
    }
    
    if (region === 'Plains' && ['April', 'May'].includes(month)) {
      recommendations.push('Monitor severe weather forecasts closely');
      recommendations.push('Consider Thursday-Saturday format');
    }
    
    if (region === 'Mountain' && month === 'March') {
      recommendations.push('Check elevation and snow conditions');
      recommendations.push('Prefer lower elevation venues');
    }
    
    return recommendations;
  }

  /**
   * Get the climate region for a team
   */
  getTeamRegion(teamName) {
    for (const [region, data] of Object.entries(this.climateZones)) {
      if (data.teams.includes(teamName)) {
        return region;
      }
    }
    return 'Unknown';
  }

  /**
   * Generate weather-optimized schedule preferences
   */
  generateWeatherOptimizedPreferences(sport = 'baseball') {
    const preferences = {
      hostingPreferences: {},
      monthlyAllocations: {},
      seriesFormatRecommendations: {}
    };

    // Generate hosting preferences based on weather reliability
    for (const [region, data] of Object.entries(this.climateZones)) {
      for (const team of data.teams) {
        preferences.hostingPreferences[team] = {
          preferredMonths: data.optimalSchedulingMonths,
          playabilityRating: data.characteristics.playabilityRating,
          weatherRisk: this.calculateAverageRisk(region)
        };
      }
    }

    // Generate monthly allocation strategy
    preferences.monthlyAllocations = {
      'March': {
        priorityRegions: ['Southwest', 'South-Central'],
        reasoning: 'Warmer temperatures, lower precipitation'
      },
      'April': {
        priorityRegions: ['Southwest', 'Southeast'],
        reasoning: 'Stable weather before storm season peaks'
      },
      'May': {
        priorityRegions: ['Southwest', 'Mountain'],
        reasoning: 'Avoid Plains storm season, Mountain snow clears'
      }
    };

    return preferences;
  }

  /**
   * Calculate average weather risk for a region
   */
  calculateAverageRisk(region) {
    const rates = this.cancellationRates[region];
    const average = Object.values(rates).reduce((sum, rate) => sum + rate, 0) / Object.values(rates).length;
    return Math.round(average * 100) / 100;
  }

  /**
   * Validate weather constraints for a proposed schedule
   */
  validateWeatherConstraints(schedule) {
    const violations = [];
    const recommendations = [];

    for (const game of schedule) {
      const weatherRisk = this.calculateWeatherRisk(
        game.hostTeam, 
        game.date, 
        game.seriesFormat
      );

      if (weatherRisk.risk > 0.2) {
        violations.push({
          game: game,
          issue: `High weather risk (${Math.round(weatherRisk.risk * 100)}%)`,
          severity: 'warning',
          recommendations: weatherRisk.recommendations
        });
      }
    }

    // Check for weather balance across regions
    const regionDistribution = this.analyzeRegionalDistribution(schedule);
    for (const [region, data] of Object.entries(regionDistribution)) {
      if (data.highRiskGames > data.totalGames * 0.3) {
        violations.push({
          issue: `Too many high-risk games in ${region}`,
          severity: 'error',
          recommendation: 'Redistribute games to more weather-stable regions'
        });
      }
    }

    return {
      isValid: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      recommendations,
      overallWeatherScore: this.calculateOverallWeatherScore(schedule)
    };
  }

  /**
   * Analyze regional distribution of games and weather risk
   */
  analyzeRegionalDistribution(schedule) {
    const distribution = {};
    
    for (const [region, data] of Object.entries(this.climateZones)) {
      distribution[region] = {
        totalGames: 0,
        highRiskGames: 0,
        averageRisk: 0
      };
    }

    for (const game of schedule) {
      const region = this.getTeamRegion(game.hostTeam);
      if (distribution[region]) {
        distribution[region].totalGames++;
        const weatherRisk = this.calculateWeatherRisk(game.hostTeam, game.date);
        distribution[region].averageRisk += weatherRisk.risk;
        if (weatherRisk.risk > 0.15) {
          distribution[region].highRiskGames++;
        }
      }
    }

    // Calculate averages
    for (const region of Object.keys(distribution)) {
      if (distribution[region].totalGames > 0) {
        distribution[region].averageRisk /= distribution[region].totalGames;
      }
    }

    return distribution;
  }

  /**
   * Calculate overall weather optimization score for schedule
   */
  calculateOverallWeatherScore(schedule) {
    let totalRisk = 0;
    let gameCount = 0;

    for (const game of schedule) {
      const weatherRisk = this.calculateWeatherRisk(game.hostTeam, game.date);
      totalRisk += weatherRisk.risk;
      gameCount++;
    }

    const averageRisk = gameCount > 0 ? totalRisk / gameCount : 0;
    const weatherScore = Math.max(0, Math.min(100, (1 - averageRisk) * 100));
    
    return {
      score: Math.round(weatherScore),
      averageRisk: Math.round(averageRisk * 100) / 100,
      rating: weatherScore >= 80 ? 'Excellent' : 
              weatherScore >= 70 ? 'Good' : 
              weatherScore >= 60 ? 'Fair' : 'Poor'
    };
  }
}

module.exports = WeatherIntelligentConstraints;