/**
 * Travel Budget Monitor Agent
 * 
 * Specialized agent for real-time travel budget monitoring, threshold management,
 * and cost control across all Big 12 Conference athletic programs.
 * 
 * Embedded Knowledge:
 * - Budget tracking and threshold management
 * - Cost variance analysis and alerts
 * - Spending pattern recognition
 * - Budget optimization recommendations
 */

const { Agent } = require('../../agent');

class TravelBudgetMonitorAgent extends Agent {
  constructor(options = {}) {
    super({
      name: 'TravelBudgetMonitorAgent',
      role: 'budget_monitoring',
      capabilities: [
        'real_time_budget_tracking',
        'threshold_monitoring',
        'variance_analysis',
        'spending_pattern_analysis',
        'cost_alert_management',
        'budget_optimization_recommendations'
      ],
      ...options
    });

    // Embedded budget monitoring knowledge
    this.budgetCategories = {
      transportation: {
        weight: 0.65,  // 65% of total travel budget
        subcategories: ['charter_flights', 'charter_buses', 'commercial_flights', 'ground_transport']
      },
      accommodation: {
        weight: 0.20,  // 20% of total travel budget
        subcategories: ['team_hotels', 'staff_lodging', 'extended_stays']
      },
      meals: {
        weight: 0.10,  // 10% of total travel budget
        subcategories: ['team_meals', 'per_diem', 'special_dietary']
      },
      contingency: {
        weight: 0.05,  // 5% of total travel budget
        subcategories: ['weather_delays', 'emergency_rebooking', 'unexpected_costs']
      }
    };

    this.alertThresholds = {
      green: { min: 0, max: 60, status: 'normal', action: 'continue' },
      yellow: { min: 60, max: 80, status: 'caution', action: 'monitor_closely' },
      orange: { min: 80, max: 95, status: 'warning', action: 'cost_controls' },
      red: { min: 95, max: 100, status: 'critical', action: 'immediate_action' },
      over: { min: 100, max: Infinity, status: 'exceeded', action: 'emergency_measures' }
    };

    this.sportBudgetRanges = {
      football: { min: 800000, max: 1200000, average: 1000000 },
      mens_basketball: { min: 300000, max: 500000, average: 400000 },
      womens_basketball: { min: 250000, max: 450000, average: 350000 },
      baseball: { min: 200000, max: 400000, average: 300000 },
      softball: { min: 150000, max: 300000, average: 225000 },
      soccer: { min: 100000, max: 250000, average: 175000 },
      volleyball: { min: 100000, max: 200000, average: 150000 },
      tennis: { min: 75000, max: 150000, average: 112500 },
      golf: { min: 50000, max: 125000, average: 87500 },
      track_field: { min: 100000, max: 200000, average: 150000 },
      swimming_diving: { min: 75000, max: 175000, average: 125000 },
      wrestling: { min: 75000, max: 150000, average: 112500 },
      gymnastics: { min: 50000, max: 125000, average: 87500 }
    };

    this.costControlMeasures = {
      level_1: {
        threshold: 60,
        measures: ['Enhanced cost tracking', 'Weekly budget reviews', 'Vendor rate monitoring']
      },
      level_2: {
        threshold: 80,
        measures: ['Approval required for >$10k expenses', 'Alternative transport evaluation', 'Accommodation downgrades']
      },
      level_3: {
        threshold: 95,
        measures: ['Director approval for all travel', 'Mandatory cost alternatives', 'Schedule modification consideration']
      },
      level_4: {
        threshold: 100,
        measures: ['Emergency budget reallocation', 'Travel freeze except essentials', 'Immediate cost reduction plan']
      }
    };

    this.reportingFrequency = {
      real_time: ['Critical alerts', 'Budget overruns', 'Emergency situations'],
      daily: ['Spending summaries', 'Threshold updates', 'Upcoming expense alerts'],
      weekly: ['Variance analysis', 'Trend reports', 'Cost optimization opportunities'],
      monthly: ['Comprehensive budget review', 'Sport-by-sport analysis', 'Annual projection updates']
    };
  }

  /**
   * Main budget monitoring method
   */
  async monitorTravelBudgets(budgetData, currentSpending, upcomingExpenses) {
    try {
      this.log('info', 'Performing comprehensive travel budget monitoring');

      const analysis = await this.analyzeBudgetStatus(budgetData, currentSpending, upcomingExpenses);
      const alerts = await this.generateBudgetAlerts(analysis);
      const recommendations = await this.generateBudgetRecommendations(analysis);
      const projections = await this.calculateBudgetProjections(analysis, upcomingExpenses);

      return {
        analysis: analysis,
        alerts: alerts,
        recommendations: recommendations,
        projections: projections,
        dashboard: await this.generateBudgetDashboard(analysis, alerts),
        actionItems: await this.generateActionItems(alerts, recommendations)
      };

    } catch (error) {
      this.log('error', `Budget monitoring failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze current budget status across all categories
   */
  async analyzeBudgetStatus(budgetData, currentSpending, upcomingExpenses) {
    const analysis = {
      overall: {},
      byCategory: {},
      bySport: {},
      variance: {},
      trends: {}
    };

    // Overall budget analysis
    const totalBudget = this.calculateTotalBudget(budgetData);
    const totalSpent = this.calculateTotalSpending(currentSpending);
    const totalCommitted = this.calculateTotalCommitted(upcomingExpenses);
    const totalProjected = totalSpent + totalCommitted;

    analysis.overall = {
      budget: totalBudget,
      spent: totalSpent,
      committed: totalCommitted,
      projected: totalProjected,
      remaining: totalBudget - totalProjected,
      utilization: (totalProjected / totalBudget) * 100,
      status: this.getBudgetStatus(totalProjected / totalBudget * 100)
    };

    // Category-level analysis
    for (const [category, config] of Object.entries(this.budgetCategories)) {
      const categoryBudget = totalBudget * config.weight;
      const categorySpent = this.getCategorySpending(currentSpending, category);
      const categoryCommitted = this.getCategoryCommitted(upcomingExpenses, category);
      const categoryProjected = categorySpent + categoryCommitted;

      analysis.byCategory[category] = {
        budget: categoryBudget,
        spent: categorySpent,
        committed: categoryCommitted,
        projected: categoryProjected,
        remaining: categoryBudget - categoryProjected,
        utilization: (categoryProjected / categoryBudget) * 100,
        status: this.getBudgetStatus(categoryProjected / categoryBudget * 100)
      };
    }

    // Sport-level analysis
    analysis.bySport = await this.analyzeSportBudgets(budgetData, currentSpending, upcomingExpenses);

    // Variance analysis
    analysis.variance = await this.calculateBudgetVariance(budgetData, currentSpending);

    // Trend analysis
    analysis.trends = await this.analyzeBudgetTrends(currentSpending);

    return analysis;
  }

  /**
   * Generate budget alerts based on thresholds
   */
  async generateBudgetAlerts(analysis) {
    const alerts = {
      critical: [],
      warning: [],
      caution: [],
      info: []
    };

    // Overall budget alerts
    const overallStatus = analysis.overall.status;
    if (overallStatus.level === 'red' || overallStatus.level === 'over') {
      alerts.critical.push({
        type: 'budget_exceeded',
        level: 'critical',
        message: `Overall travel budget ${overallStatus.level === 'over' ? 'exceeded' : 'critical'} (${analysis.overall.utilization.toFixed(1)}%)`,
        budget: analysis.overall.budget,
        projected: analysis.overall.projected,
        excess: analysis.overall.projected - analysis.overall.budget
      });
    } else if (overallStatus.level === 'orange') {
      alerts.warning.push({
        type: 'budget_warning',
        level: 'warning',
        message: `Overall travel budget approaching limit (${analysis.overall.utilization.toFixed(1)}%)`,
        remaining: analysis.overall.remaining
      });
    }

    // Category-level alerts
    for (const [category, categoryData] of Object.entries(analysis.byCategory)) {
      if (categoryData.status.level === 'red' || categoryData.status.level === 'over') {
        alerts.critical.push({
          type: 'category_exceeded',
          level: 'critical',
          category: category,
          message: `${category} budget ${categoryData.status.level === 'over' ? 'exceeded' : 'critical'} (${categoryData.utilization.toFixed(1)}%)`,
          budget: categoryData.budget,
          projected: categoryData.projected
        });
      } else if (categoryData.status.level === 'orange') {
        alerts.warning.push({
          type: 'category_warning',
          level: 'warning',
          category: category,
          message: `${category} budget approaching limit (${categoryData.utilization.toFixed(1)}%)`,
          remaining: categoryData.remaining
        });
      }
    }

    // Sport-level alerts
    for (const [sport, sportData] of Object.entries(analysis.bySport)) {
      if (sportData.status.level === 'red' || sportData.status.level === 'over') {
        alerts.critical.push({
          type: 'sport_exceeded',
          level: 'critical',
          sport: sport,
          message: `${sport} budget ${sportData.status.level === 'over' ? 'exceeded' : 'critical'} (${sportData.utilization.toFixed(1)}%)`,
          budget: sportData.budget,
          projected: sportData.projected
        });
      }
    }

    // Variance alerts
    const highVarianceSports = Object.entries(analysis.bySport).filter(([sport, data]) => 
      Math.abs(data.variance) > 0.2 // 20% variance threshold
    );

    highVarianceSports.forEach(([sport, data]) => {
      alerts.warning.push({
        type: 'variance_alert',
        level: 'warning',
        sport: sport,
        message: `${sport} showing high budget variance (${(data.variance * 100).toFixed(1)}%)`,
        variance: data.variance
      });
    });

    return alerts;
  }

  /**
   * Generate budget optimization recommendations
   */
  async generateBudgetRecommendations(analysis) {
    const recommendations = {
      immediate: [],
      short_term: [],
      strategic: []
    };

    // Immediate actions for critical situations
    if (analysis.overall.status.level === 'red' || analysis.overall.status.level === 'over') {
      recommendations.immediate.push({
        priority: 'critical',
        action: 'implement_travel_freeze',
        description: 'Implement immediate travel freeze for non-essential trips',
        estimated_savings: analysis.overall.projected * 0.1
      });

      recommendations.immediate.push({
        priority: 'critical',
        action: 'emergency_cost_controls',
        description: 'Activate Level 4 cost control measures',
        measures: this.costControlMeasures.level_4.measures
      });
    }

    // Short-term optimization opportunities
    const highCostCategories = Object.entries(analysis.byCategory)
      .filter(([category, data]) => data.utilization > 80)
      .sort((a, b) => b[1].utilization - a[1].utilization);

    highCostCategories.forEach(([category, data]) => {
      recommendations.short_term.push({
        priority: 'high',
        action: 'optimize_category',
        category: category,
        description: `Optimize ${category} spending - currently at ${data.utilization.toFixed(1)}% utilization`,
        specific_measures: this.getCategoryOptimizationMeasures(category)
      });
    });

    // Strategic recommendations
    const seasonalOptimization = await this.identifySeasonalOptimization(analysis);
    if (seasonalOptimization.potential_savings > 0) {
      recommendations.strategic.push({
        priority: 'medium',
        action: 'seasonal_optimization',
        description: 'Implement seasonal travel optimization strategies',
        potential_savings: seasonalOptimization.potential_savings,
        strategies: seasonalOptimization.strategies
      });
    }

    // Circuit optimization opportunities
    const circuitOptimization = await this.identifyCircuitOptimization(analysis);
    if (circuitOptimization.potential_savings > 0) {
      recommendations.strategic.push({
        priority: 'medium',
        action: 'circuit_optimization',
        description: 'Implement travel circuit optimization',
        potential_savings: circuitOptimization.potential_savings,
        opportunities: circuitOptimization.opportunities
      });
    }

    return recommendations;
  }

  /**
   * Calculate budget projections and forecasts
   */
  async calculateBudgetProjections(analysis, upcomingExpenses) {
    const projections = {
      end_of_season: {},
      monthly_forecast: [],
      risk_scenarios: {}
    };

    // End of season projections
    const seasonRemaining = this.calculateSeasonRemaining();
    const currentBurnRate = this.calculateBurnRate(analysis);
    
    projections.end_of_season = {
      projected_total: analysis.overall.projected + (currentBurnRate * seasonRemaining),
      budget_vs_projection: analysis.overall.budget - (analysis.overall.projected + (currentBurnRate * seasonRemaining)),
      confidence: this.calculateProjectionConfidence(analysis),
      assumptions: [
        'Current spending rate continues',
        'No major schedule changes',
        'Normal weather conditions'
      ]
    };

    // Monthly forecast
    for (let month = 1; month <= seasonRemaining; month++) {
      const monthlyProjection = this.calculateMonthlyProjection(analysis, month, currentBurnRate);
      projections.monthly_forecast.push(monthlyProjection);
    }

    // Risk scenarios
    projections.risk_scenarios = {
      optimistic: {
        description: '10% cost reduction through optimization',
        projected_total: projections.end_of_season.projected_total * 0.9,
        probability: 0.3
      },
      baseline: {
        description: 'Current trends continue',
        projected_total: projections.end_of_season.projected_total,
        probability: 0.5
      },
      pessimistic: {
        description: '15% cost increase due to unforeseen circumstances',
        projected_total: projections.end_of_season.projected_total * 1.15,
        probability: 0.2
      }
    };

    return projections;
  }

  /**
   * Helper methods for budget analysis
   */
  analyzeSportBudgets(budgetData, currentSpending, upcomingExpenses) {
    const sportAnalysis = {};

    for (const [sport, range] of Object.entries(this.sportBudgetRanges)) {
      const sportBudget = budgetData.sports?.[sport]?.budget || range.average;
      const sportSpent = this.getSportSpending(currentSpending, sport);
      const sportCommitted = this.getSportCommitted(upcomingExpenses, sport);
      const sportProjected = sportSpent + sportCommitted;

      sportAnalysis[sport] = {
        budget: sportBudget,
        spent: sportSpent,
        committed: sportCommitted,
        projected: sportProjected,
        remaining: sportBudget - sportProjected,
        utilization: (sportProjected / sportBudget) * 100,
        status: this.getBudgetStatus(sportProjected / sportBudget * 100),
        variance: (sportProjected - range.average) / range.average
      };
    }

    return sportAnalysis;
  }

  calculateBudgetVariance(budgetData, currentSpending) {
    // Calculate variance from expected spending patterns
    const expectedSpending = this.calculateExpectedSpending(budgetData);
    const actualSpending = this.calculateTotalSpending(currentSpending);
    
    return {
      absolute_variance: actualSpending - expectedSpending,
      percentage_variance: (actualSpending - expectedSpending) / expectedSpending,
      trend: actualSpending > expectedSpending ? 'over' : 'under'
    };
  }

  analyzeBudgetTrends(currentSpending) {
    // Analyze spending trends over time
    const monthlySpending = this.getMonthlySpending(currentSpending);
    const trend = this.calculateTrend(monthlySpending);
    
    return {
      monthly_spending: monthlySpending,
      trend_direction: trend.direction,
      trend_strength: trend.strength,
      acceleration: trend.acceleration
    };
  }

  getBudgetStatus(utilizationPercentage) {
    for (const [level, threshold] of Object.entries(this.alertThresholds)) {
      if (utilizationPercentage >= threshold.min && utilizationPercentage < threshold.max) {
        return {
          level: level,
          status: threshold.status,
          action: threshold.action,
          utilization: utilizationPercentage
        };
      }
    }
    return { level: 'unknown', status: 'unknown', action: 'review', utilization: utilizationPercentage };
  }

  getCategoryOptimizationMeasures(category) {
    const measures = {
      transportation: [
        'Evaluate charter vs commercial options',
        'Implement circuit scheduling',
        'Consider ground transport for <500 mile trips'
      ],
      accommodation: [
        'Negotiate group rates',
        'Consider alternative lodging options',
        'Optimize room allocation'
      ],
      meals: [
        'Review per diem rates',
        'Optimize team meal arrangements',
        'Consider catering alternatives'
      ],
      contingency: [
        'Review emergency procedures',
        'Implement better weather planning',
        'Negotiate better rebooking terms'
      ]
    };
    return measures[category] || ['Review and optimize spending'];
  }

  // Utility calculation methods
  calculateTotalBudget(budgetData) {
    return budgetData.total || Object.values(budgetData.sports || {}).reduce((sum, sport) => sum + (sport.budget || 0), 0);
  }

  calculateTotalSpending(currentSpending) {
    return Object.values(currentSpending).reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }

  calculateTotalCommitted(upcomingExpenses) {
    return Object.values(upcomingExpenses).reduce((sum, expense) => sum + (expense.estimated_cost || 0), 0);
  }

  getCategorySpending(currentSpending, category) {
    return Object.values(currentSpending)
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }

  getCategoryCommitted(upcomingExpenses, category) {
    return Object.values(upcomingExpenses)
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + (expense.estimated_cost || 0), 0);
  }

  getSportSpending(currentSpending, sport) {
    return Object.values(currentSpending)
      .filter(expense => expense.sport === sport)
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }

  getSportCommitted(upcomingExpenses, sport) {
    return Object.values(upcomingExpenses)
      .filter(expense => expense.sport === sport)
      .reduce((sum, expense) => sum + (expense.estimated_cost || 0), 0);
  }

  calculateSeasonRemaining() {
    // Simplified - calculate months remaining in athletic season
    const now = new Date();
    const seasonEnd = new Date(now.getFullYear(), 5, 30); // End of May
    if (now > seasonEnd) {
      seasonEnd.setFullYear(seasonEnd.getFullYear() + 1);
    }
    return Math.max(0, (seasonEnd - now) / (1000 * 60 * 60 * 24 * 30)); // Months
  }

  calculateBurnRate(analysis) {
    // Calculate monthly burn rate based on current spending
    const monthsElapsed = this.getMonthsElapsed();
    return monthsElapsed > 0 ? analysis.overall.spent / monthsElapsed : 0;
  }

  getMonthsElapsed() {
    // Calculate months since season start (simplified)
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1
    if (now < seasonStart) {
      seasonStart.setFullYear(seasonStart.getFullYear() - 1);
    }
    return Math.max(1, (now - seasonStart) / (1000 * 60 * 60 * 24 * 30));
  }

  calculateProjectionConfidence(analysis) {
    // Calculate confidence based on data quality and variance
    let confidence = 0.8; // Base confidence
    
    if (analysis.variance.percentage_variance < 0.1) confidence += 0.1; // Low variance increases confidence
    if (analysis.trends.trend_strength > 0.8) confidence += 0.05; // Strong trend increases confidence
    
    return Math.min(confidence, 0.95);
  }

  async generateBudgetDashboard(analysis, alerts) {
    return {
      summary: {
        overall_status: analysis.overall.status.level,
        utilization: analysis.overall.utilization,
        remaining_budget: analysis.overall.remaining,
        critical_alerts: alerts.critical.length,
        warning_alerts: alerts.warning.length
      },
      categories: Object.entries(analysis.byCategory).map(([category, data]) => ({
        name: category,
        utilization: data.utilization,
        status: data.status.level,
        remaining: data.remaining
      })),
      top_sports_by_utilization: Object.entries(analysis.bySport)
        .sort((a, b) => b[1].utilization - a[1].utilization)
        .slice(0, 5)
        .map(([sport, data]) => ({
          sport: sport,
          utilization: data.utilization,
          status: data.status.level
        }))
    };
  }

  async generateActionItems(alerts, recommendations) {
    const actionItems = [];

    // Critical alerts become immediate action items
    alerts.critical.forEach(alert => {
      actionItems.push({
        priority: 'critical',
        due_date: 'immediate',
        action: `Address ${alert.type}: ${alert.message}`,
        owner: 'Athletics Director',
        estimated_effort: 'high'
      });
    });

    // Warning alerts become high priority items
    alerts.warning.forEach(alert => {
      actionItems.push({
        priority: 'high',
        due_date: 'within_week',
        action: `Monitor and address ${alert.type}: ${alert.message}`,
        owner: 'Finance Manager',
        estimated_effort: 'medium'
      });
    });

    // Immediate recommendations become action items
    recommendations.immediate.forEach(rec => {
      actionItems.push({
        priority: rec.priority,
        due_date: 'immediate',
        action: rec.description,
        owner: 'Travel Coordinator',
        estimated_effort: 'high',
        estimated_savings: rec.estimated_savings
      });
    });

    return actionItems.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Agent lifecycle methods
   */
  async initialize() {
    this.log('info', 'Travel Budget Monitor Agent initialized');
    this.status = 'ready';
  }

  async shutdown() {
    this.log('info', 'Travel Budget Monitor Agent shutting down');
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

module.exports = TravelBudgetMonitorAgent;