/**
 * Seasonal Pricing Agent
 * 
 * Specialized agent for timing-based travel cost optimization including
 * seasonal variations, booking windows, and temporal pricing strategies.
 * 
 * Embedded Knowledge:
 * - Seasonal pricing patterns and multipliers
 * - Optimal booking windows
 * - Holiday and peak period premiums
 * - Weather impact considerations
 */

const { Agent } = require('../../core/agent');

class SeasonalPricingAgent extends Agent {
  constructor(options = {}) {
    super({
      name: 'SeasonalPricingAgent',
      role: 'temporal_optimization',
      capabilities: [
        'seasonal_analysis',
        'booking_window_optimization',
        'price_timing_prediction',
        'schedule_flexibility_analysis',
        'weather_impact_assessment'
      ],
      ...options
    });

    // Embedded seasonal pricing knowledge from framework
    this.seasonalPeriods = {
      peak: {
        months: [3, 4, 5, 6], // March-June
        multiplier: { min: 1.2, max: 1.4, average: 1.3 },
        description: 'Spring sports championships, graduation travel',
        characteristics: ['High demand', 'Limited availability', 'Premium pricing']
      },
      regular: {
        months: [9, 10, 11, 12, 1, 2], // Sept-Feb
        multiplier: 1.0,
        description: 'Standard academic year travel',
        characteristics: ['Normal demand', 'Standard availability', 'Base pricing']
      },
      off: {
        months: [7, 8], // July-August
        multiplier: { min: 0.8, max: 0.9, average: 0.85 },
        description: 'Summer break, minimal athletic activity',
        characteristics: ['Low demand', 'High availability', 'Discount pricing']
      }
    };

    this.timingPremiums = {
      weekend: {
        multiplier: 0.20,
        description: 'Friday-Sunday travel premium',
        peak_days: ['Friday', 'Saturday', 'Sunday']
      },
      holiday: {
        multiplier: 0.375,
        description: 'Major holiday period premium',
        periods: [
          { name: 'Thanksgiving', dates: ['11-22', '11-29'] },
          { name: 'Christmas/New Year', dates: ['12-15', '01-05'] },
          { name: 'Spring Break', dates: ['03-15', '03-30'] },
          { name: 'Labor Day', dates: ['08-30', '09-05'] }
        ]
      },
      conference_tournament: {
        multiplier: 0.25,
        description: 'Conference championship premium',
        duration: '7-14 days',
        impact: 'Affects entire conference region'
      },
      last_minute: {
        threshold_days: 14,
        multiplier: 0.325,
        description: 'Booking within 14 days premium',
        escalation: {
          '7_days': 0.40,
          '3_days': 0.50,
          '24_hours': 0.65
        }
      }
    };

    this.bookingWindows = {
      optimal: {
        charter_flight: { min: 45, max: 90, description: 'Best rates and availability' },
        charter_bus: { min: 21, max: 60, description: 'Adequate availability, good rates' },
        accommodation: { min: 30, max: 75, description: 'Group rates and room blocks' }
      },
      acceptable: {
        charter_flight: { min: 21, max: 44, description: 'Higher rates, limited options' },
        charter_bus: { min: 14, max: 20, description: 'Standard rates, some availability' },
        accommodation: { min: 14, max: 29, description: 'Standard rates, limited blocks' }
      },
      emergency: {
        charter_flight: { min: 0, max: 13, description: 'Premium rates, very limited' },
        charter_bus: { min: 0, max: 13, description: 'Higher rates, availability dependent' },
        accommodation: { min: 0, max: 13, description: 'Premium rates, individual rooms' }
      }
    };

    this.weatherImpactFactors = {
      winter_weather: {
        months: [12, 1, 2, 3],
        regions: ['northeast', 'midwest', 'mountain'],
        impact: {
          flight_delays: 0.15,
          bus_delays: 0.25,
          contingency_buffer: 0.10
        }
      },
      severe_weather: {
        months: [4, 5, 6, 9, 10],
        regions: ['south_central', 'southeast'],
        impact: {
          flight_cancellations: 0.08,
          route_diversions: 0.12,
          emergency_rebooking: 25000
        }
      }
    };

    this.priceOptimizationStrategies = {
      flexible_dates: {
        search_window: 7, // ±7 days
        potential_savings: 0.15,
        requirements: ['Non-conference games', 'Venue availability', 'TV schedule flexibility']
      },
      off_peak_scheduling: {
        target_periods: ['Tuesday-Thursday', 'Non-holiday weeks'],
        potential_savings: 0.20,
        constraints: ['Academic calendar', 'Fan attendance', 'Media obligations']
      },
      advance_booking: {
        target_window: 60, // 60 days
        potential_savings: 0.25,
        dependencies: ['Schedule finalization', 'Venue confirmation', 'TV schedule']
      }
    };
  }

  /**
   * Main seasonal pricing optimization method
   */
  async optimizeScheduleTiming(schedule, constraints = {}) {
    try {
      this.log('info', `Optimizing seasonal timing for ${schedule.length} games`);

      const analysis = await this.analyzeSeasonalImpact(schedule);
      const recommendations = await this.generateTimingRecommendations(schedule, analysis, constraints);
      const optimizedSchedule = await this.applyTimingOptimizations(schedule, recommendations);
      const savings = await this.calculateTimingSavings(schedule, optimizedSchedule);

      return {
        originalSchedule: schedule,
        optimizedSchedule: optimizedSchedule,
        seasonalAnalysis: analysis,
        recommendations: recommendations,
        savings: savings,
        summary: await this.generateOptimizationSummary(analysis, savings)
      };

    } catch (error) {
      this.log('error', `Seasonal pricing optimization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze seasonal impact on current schedule
   */
  async analyzeSeasonalImpact(schedule) {
    const analysis = {
      seasonalBreakdown: { peak: 0, regular: 0, off: 0 },
      timingIssues: [],
      costMultipliers: [],
      weatherRisks: [],
      bookingWindows: []
    };

    schedule.forEach((game, index) => {
      const gameDate = new Date(game.date);
      const month = gameDate.getMonth() + 1;
      const seasonalInfo = this.getSeasonalInfo(month);
      const timingPremiums = this.calculateTimingPremiums(gameDate, game);
      const weatherRisk = this.assessWeatherRisk(gameDate, game.destination);
      const bookingWindow = this.analyzeBookingWindow(gameDate, game);

      // Seasonal breakdown
      analysis.seasonalBreakdown[seasonalInfo.period]++;

      // Cost multipliers
      const totalMultiplier = seasonalInfo.multiplier * (1 + timingPremiums.total);
      analysis.costMultipliers.push({
        gameId: game.id,
        date: game.date,
        seasonal: seasonalInfo.multiplier,
        timing: timingPremiums.total,
        total: totalMultiplier,
        factors: timingPremiums.factors
      });

      // Timing issues
      if (totalMultiplier > 1.3) {
        analysis.timingIssues.push({
          gameId: game.id,
          issue: 'High cost multiplier',
          multiplier: totalMultiplier,
          recommendation: 'Consider date flexibility'
        });
      }

      // Weather risks
      if (weatherRisk.risk > 0.2) {
        analysis.weatherRisks.push({
          gameId: game.id,
          risk: weatherRisk.risk,
          factors: weatherRisk.factors,
          recommendation: weatherRisk.recommendation
        });
      }

      // Booking window analysis
      analysis.bookingWindows.push(bookingWindow);
    });

    return analysis;
  }

  /**
   * Generate timing optimization recommendations
   */
  async generateTimingRecommendations(schedule, analysis, constraints) {
    const recommendations = {
      dateAdjustments: [],
      bookingStrategy: [],
      seasonalStrategy: [],
      riskMitigation: []
    };

    // Date adjustment recommendations
    analysis.timingIssues.forEach(issue => {
      const game = schedule.find(g => g.id === issue.gameId);
      if (this.canAdjustDate(game, constraints)) {
        const alternatives = this.generateDateAlternatives(game, 7);
        const bestAlternative = this.selectBestDateAlternative(alternatives);
        
        if (bestAlternative.savings > 0.1) {
          recommendations.dateAdjustments.push({
            gameId: game.id,
            originalDate: game.date,
            recommendedDate: bestAlternative.date,
            savings: bestAlternative.savings,
            reasoning: bestAlternative.reasoning
          });
        }
      }
    });

    // Booking strategy recommendations
    analysis.bookingWindows.forEach(window => {
      if (window.category === 'emergency' || window.category === 'late') {
        recommendations.bookingStrategy.push({
          gameId: window.gameId,
          currentWindow: window.daysAhead,
          recommendation: 'Accelerate booking process',
          urgency: 'high',
          cost_impact: 'Potential 25-40% premium'
        });
      }
    });

    // Seasonal strategy recommendations
    const peakGames = analysis.seasonalBreakdown.peak;
    const totalGames = schedule.length;
    if (peakGames / totalGames > 0.4) {
      recommendations.seasonalStrategy.push({
        strategy: 'peak_reduction',
        description: 'High concentration of peak season games',
        recommendation: 'Shift non-critical games to regular or off-season',
        potential_savings: '15-25% on affected games'
      });
    }

    // Risk mitigation recommendations
    analysis.weatherRisks.forEach(risk => {
      recommendations.riskMitigation.push({
        gameId: risk.gameId,
        risk_type: 'weather',
        mitigation: this.generateWeatherMitigation(risk),
        cost_buffer: '8-15% contingency recommended'
      });
    });

    return recommendations;
  }

  /**
   * Apply timing optimizations to schedule
   */
  async applyTimingOptimizations(schedule, recommendations) {
    const optimizedSchedule = [...schedule];

    // Apply date adjustments
    recommendations.dateAdjustments.forEach(adjustment => {
      const gameIndex = optimizedSchedule.findIndex(g => g.id === adjustment.gameId);
      if (gameIndex !== -1) {
        optimizedSchedule[gameIndex] = {
          ...optimizedSchedule[gameIndex],
          date: adjustment.recommendedDate,
          originalDate: adjustment.originalDate,
          timingOptimization: {
            applied: true,
            savings: adjustment.savings,
            reasoning: adjustment.reasoning
          }
        };
      }
    });

    // Apply booking urgency flags
    recommendations.bookingStrategy.forEach(booking => {
      const gameIndex = optimizedSchedule.findIndex(g => g.id === booking.gameId);
      if (gameIndex !== -1) {
        optimizedSchedule[gameIndex] = {
          ...optimizedSchedule[gameIndex],
          bookingUrgency: booking.urgency,
          bookingRecommendation: booking.recommendation
        };
      }
    });

    return optimizedSchedule;
  }

  /**
   * Calculate timing-based savings
   */
  async calculateTimingSavings(originalSchedule, optimizedSchedule) {
    let originalCost = 0;
    let optimizedCost = 0;

    for (let i = 0; i < originalSchedule.length; i++) {
      const originalGame = originalSchedule[i];
      const optimizedGame = optimizedSchedule[i];

      const originalMultiplier = this.calculateTotalMultiplier(originalGame);
      const optimizedMultiplier = this.calculateTotalMultiplier(optimizedGame);

      const baseCost = 50000; // Estimate base cost
      originalCost += baseCost * originalMultiplier;
      optimizedCost += baseCost * optimizedMultiplier;
    }

    const savings = originalCost - optimizedCost;
    const percentage = originalCost > 0 ? (savings / originalCost) * 100 : 0;

    return {
      totalSavings: Math.round(savings),
      percentageSavings: Math.round(percentage * 10) / 10,
      originalCost: Math.round(originalCost),
      optimizedCost: Math.round(optimizedCost),
      gamesOptimized: optimizedSchedule.filter(g => g.timingOptimization?.applied).length
    };
  }

  /**
   * Helper methods for seasonal analysis
   */
  getSeasonalInfo(month) {
    for (const [period, info] of Object.entries(this.seasonalPeriods)) {
      if (info.months && info.months.includes(month)) {
        return {
          period: period,
          multiplier: typeof info.multiplier === 'object' ? info.multiplier.average : info.multiplier,
          description: info.description
        };
      }
    }
    return { period: 'regular', multiplier: 1.0, description: 'Standard period' };
  }

  calculateTimingPremiums(gameDate, game) {
    const premiums = { factors: [], total: 0 };
    
    // Weekend premium
    const dayOfWeek = gameDate.getDay();
    if ([0, 5, 6].includes(dayOfWeek)) { // Sunday, Friday, Saturday
      premiums.factors.push('weekend');
      premiums.total += this.timingPremiums.weekend.multiplier;
    }

    // Holiday premium
    if (this.isHolidayPeriod(gameDate)) {
      premiums.factors.push('holiday');
      premiums.total += this.timingPremiums.holiday.multiplier;
    }

    // Conference tournament premium
    if (game.isConferenceTournament) {
      premiums.factors.push('conference_tournament');
      premiums.total += this.timingPremiums.conference_tournament.multiplier;
    }

    // Last minute booking premium
    const daysAhead = (gameDate - new Date()) / (1000 * 60 * 60 * 24);
    if (daysAhead < this.timingPremiums.last_minute.threshold_days) {
      premiums.factors.push('last_minute');
      const multiplier = this.getLastMinuteMultiplier(daysAhead);
      premiums.total += multiplier;
    }

    return premiums;
  }

  assessWeatherRisk(gameDate, destination) {
    const month = gameDate.getMonth() + 1;
    const region = this.getRegionForVenue(destination);
    let risk = 0;
    const factors = [];

    // Winter weather risk
    if (this.weatherImpactFactors.winter_weather.months.includes(month) &&
        this.weatherImpactFactors.winter_weather.regions.includes(region)) {
      risk += 0.2;
      factors.push('winter_weather');
    }

    // Severe weather risk
    if (this.weatherImpactFactors.severe_weather.months.includes(month) &&
        this.weatherImpactFactors.severe_weather.regions.includes(region)) {
      risk += 0.15;
      factors.push('severe_weather');
    }

    return {
      risk: risk,
      factors: factors,
      recommendation: this.getWeatherRecommendation(risk, factors)
    };
  }

  analyzeBookingWindow(gameDate, game) {
    const daysAhead = Math.ceil((gameDate - new Date()) / (1000 * 60 * 60 * 24));
    const transport = game.transportMode || 'charter_flight';
    
    let category = 'emergency';
    if (daysAhead >= this.bookingWindows.optimal[transport].min) {
      category = 'optimal';
    } else if (daysAhead >= this.bookingWindows.acceptable[transport].min) {
      category = 'acceptable';
    }

    return {
      gameId: game.id,
      daysAhead: daysAhead,
      category: category,
      window: this.bookingWindows[category][transport],
      urgency: category === 'emergency' ? 'critical' : category === 'acceptable' ? 'high' : 'normal'
    };
  }

  canAdjustDate(game, constraints) {
    if (constraints.fixedDates?.includes(game.id)) return false;
    if (game.isTVGame && !constraints.allowTVChanges) return false;
    if (game.isConferenceTournament) return false;
    return game.dateFlexibility !== false;
  }

  generateDateAlternatives(game, dayRange) {
    const alternatives = [];
    const originalDate = new Date(game.date);
    
    for (let i = -dayRange; i <= dayRange; i++) {
      if (i === 0) continue; // Skip original date
      
      const altDate = new Date(originalDate);
      altDate.setDate(altDate.getDate() + i);
      
      const multiplier = this.calculateTotalMultiplier({ ...game, date: altDate.toISOString().split('T')[0] });
      const originalMultiplier = this.calculateTotalMultiplier(game);
      const savings = (originalMultiplier - multiplier) / originalMultiplier;
      
      alternatives.push({
        date: altDate.toISOString().split('T')[0],
        multiplier: multiplier,
        savings: savings,
        reasoning: this.generateSavingsReasoning(originalMultiplier, multiplier)
      });
    }
    
    return alternatives.sort((a, b) => b.savings - a.savings);
  }

  selectBestDateAlternative(alternatives) {
    return alternatives.length > 0 ? alternatives[0] : null;
  }

  calculateTotalMultiplier(game) {
    const gameDate = new Date(game.date);
    const month = gameDate.getMonth() + 1;
    const seasonalInfo = this.getSeasonalInfo(month);
    const timingPremiums = this.calculateTimingPremiums(gameDate, game);
    
    return seasonalInfo.multiplier * (1 + timingPremiums.total);
  }

  isHolidayPeriod(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    return this.timingPremiums.holiday.periods.some(period => {
      return period.dates.some(periodDate => {
        const [startMonth, startDay] = periodDate.split('-').map(Number);
        return month === startMonth && Math.abs(day - startDay) <= 7;
      });
    });
  }

  getLastMinuteMultiplier(daysAhead) {
    if (daysAhead <= 1) return this.timingPremiums.last_minute.escalation['24_hours'];
    if (daysAhead <= 3) return this.timingPremiums.last_minute.escalation['3_days'];
    if (daysAhead <= 7) return this.timingPremiums.last_minute.escalation['7_days'];
    return this.timingPremiums.last_minute.multiplier;
  }

  getRegionForVenue(venue) {
    const regions = {
      arizona: 'southwest', arizona_state: 'southwest',
      byu: 'mountain', colorado: 'mountain', utah: 'mountain',
      baylor: 'south_central', houston: 'south_central', tcu: 'south_central', texas_tech: 'south_central',
      kansas: 'central', kansas_state: 'central', oklahoma_state: 'central',
      cincinnati: 'midwest', iowa_state: 'midwest',
      ucf: 'southeast',
      west_virginia: 'northeast'
    };
    return regions[venue.toLowerCase().replace(/\s+/g, '_')] || 'unknown';
  }

  getWeatherRecommendation(risk, factors) {
    if (risk > 0.3) return 'High weather risk - consider backup transportation';
    if (risk > 0.2) return 'Moderate weather risk - add contingency buffer';
    return 'Low weather risk - standard planning';
  }

  generateWeatherMitigation(risk) {
    const strategies = [];
    if (risk.factors.includes('winter_weather')) {
      strategies.push('Book backup ground transportation');
      strategies.push('Add 24-hour weather monitoring');
    }
    if (risk.factors.includes('severe_weather')) {
      strategies.push('Secure alternate routing options');
      strategies.push('Consider earlier departure times');
    }
    return strategies;
  }

  generateSavingsReasoning(originalMultiplier, newMultiplier) {
    if (newMultiplier < originalMultiplier) {
      const improvement = ((originalMultiplier - newMultiplier) / originalMultiplier * 100).toFixed(1);
      return `${improvement}% cost reduction through timing optimization`;
    }
    return 'No significant timing advantage';
  }

  async generateOptimizationSummary(analysis, savings) {
    return {
      totalGamesAnalyzed: analysis.costMultipliers.length,
      highRiskGames: analysis.timingIssues.length,
      weatherRisks: analysis.weatherRisks.length,
      potentialSavings: savings.totalSavings,
      recommendedActions: [
        analysis.timingIssues.length > 0 ? 'Optimize high-cost game timing' : null,
        analysis.weatherRisks.length > 0 ? 'Implement weather contingency plans' : null,
        savings.gamesOptimized > 0 ? `${savings.gamesOptimized} games optimized for timing` : null
      ].filter(Boolean),
      seasonalDistribution: analysis.seasonalBreakdown
    };
  }

  /**
   * Agent lifecycle methods
   */
  async initialize() {
    this.log('info', 'Seasonal Pricing Agent initialized');
    this.status = 'ready';
  }

  async shutdown() {
    this.log('info', 'Seasonal Pricing Agent shutting down');
    this.status = 'inactive';
  }

  getStatus() {
    return {
      name: this.name,
      status: this.status,
      capabilities: this.capabilities,
      lastActivity: this.lastActivity
    };
  }
}

module.exports = SeasonalPricingAgent;