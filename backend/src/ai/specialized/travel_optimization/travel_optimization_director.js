/**
 * Travel Optimization Director Agent
 * 
 * High-level coordinator for all travel cost optimization activities across
 * the Big 12 Conference. Orchestrates multiple specialized travel agents
 * to achieve maximum cost savings and efficiency.
 * 
 * Coordination Strategy:
 * 1. Circuit Optimization (structural changes)
 * 2. Seasonal Timing Optimization (temporal adjustments)
 * 3. Transport Mode Optimization (mode selection)
 * 4. Shared Charter Coordination (multi-team opportunities)
 * 5. Cost Calculation & Analysis (comprehensive costing)
 * 6. Budget Monitoring & Control (financial oversight)
 */

const { Agent } = require('../../agent');

class TravelOptimizationDirector extends Agent {
  constructor(options = {}) {
    super({
      name: 'TravelOptimizationDirector',
      role: 'travel_optimization_coordinator',
      capabilities: [
        'comprehensive_travel_optimization',
        'agent_coordination',
        'optimization_strategy_development',
        'savings_maximization',
        'cost_efficiency_analysis',
        'budget_compliance_monitoring'
      ],
      ...options
    });

    this.agentSystem = options.agentSystem;
    this.optimizationStrategy = {
      prioritization: [
        'circuit_optimization',      // Highest impact on total travel distance
        'seasonal_timing',          // High impact on cost multipliers
        'transport_mode',           // Medium impact on individual trip costs
        'shared_charter',           // Medium impact but coordination complexity
        'cost_calculation',         // Analysis and validation
        'budget_monitoring'         // Oversight and control
      ],
      convergence_criteria: {
        max_iterations: 3,
        min_improvement_threshold: 0.02,  // 2% minimum improvement to continue
        cost_stability_threshold: 0.01   // 1% cost variation = converged
      },
      performance_targets: {
        total_savings_percentage: 0.15,  // Target 15% total cost reduction
        circuit_efficiency: 0.85,        // Target 85% circuit efficiency
        budget_compliance: 0.95          // Target 95% budget compliance
      }
    };
  }

  /**
   * Execute comprehensive travel optimization
   */
  async executeComprehensiveOptimization(scheduleData, constraints = {}) {
    try {
      this.log('info', 'Starting comprehensive travel optimization');

      const optimization = {
        iteration: 0,
        convergence: false,
        total_savings: 0,
        performance_metrics: {},
        optimization_history: [],
        final_recommendations: []
      };

      // Validate inputs
      if (!scheduleData || !Array.isArray(scheduleData)) {
        throw new Error('Invalid schedule data provided');
      }

      // Initialize optimization state
      let currentSchedule = [...scheduleData];
      let previousCost = await this.estimateScheduleCost(currentSchedule);
      
      this.log('info', `Initial schedule cost estimate: $${previousCost}`);

      // Iterative optimization loop
      while (!optimization.convergence && optimization.iteration < this.optimizationStrategy.convergence_criteria.max_iterations) {
        optimization.iteration++;
        this.log('info', `Starting optimization iteration ${optimization.iteration}`);

        const iterationResult = await this.executeOptimizationIteration(
          currentSchedule, 
          constraints, 
          optimization.iteration
        );

        // Update schedule and track improvements
        if (iterationResult.optimized_schedule) {
          currentSchedule = iterationResult.optimized_schedule;
        }

        const currentCost = iterationResult.total_cost || previousCost;
        const iterationSavings = previousCost - currentCost;
        const improvementPercentage = iterationSavings / previousCost;

        optimization.optimization_history.push({
          iteration: optimization.iteration,
          cost_before: previousCost,
          cost_after: currentCost,
          savings: iterationSavings,
          improvement_percentage: improvementPercentage,
          details: iterationResult
        });

        // Check convergence criteria
        if (improvementPercentage < this.optimizationStrategy.convergence_criteria.min_improvement_threshold) {
          optimization.convergence = true;
          this.log('info', `Optimization converged after ${optimization.iteration} iterations (improvement < ${this.optimizationStrategy.convergence_criteria.min_improvement_threshold * 100}%)`);
        }

        optimization.total_savings += iterationSavings;
        previousCost = currentCost;
      }

      // Generate final analysis and recommendations
      optimization.performance_metrics = await this.calculatePerformanceMetrics(
        scheduleData, 
        currentSchedule, 
        optimization
      );

      optimization.final_recommendations = await this.generateStrategicRecommendations(
        optimization.performance_metrics,
        optimization.optimization_history
      );

      this.log('info', `Travel optimization complete. Total savings: $${optimization.total_savings} (${(optimization.total_savings / (await this.estimateScheduleCost(scheduleData)) * 100).toFixed(1)}%)`);

      return {
        original_schedule: scheduleData,
        optimized_schedule: currentSchedule,
        optimization_summary: optimization,
        strategic_recommendations: optimization.final_recommendations,
        implementation_plan: await this.generateImplementationPlan(optimization)
      };

    } catch (error) {
      this.log('error', `Comprehensive travel optimization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute single optimization iteration
   */
  async executeOptimizationIteration(schedule, constraints, iteration) {
    try {
      this.log('info', `Executing optimization iteration ${iteration}`);

      const iterationResults = {
        iteration: iteration,
        optimized_schedule: [...schedule],
        agent_results: {},
        total_cost: 0,
        iteration_savings: 0
      };

      // 1. Circuit Optimization (if first iteration or significant schedule changes)
      if (iteration === 1 || this.shouldReoptimizeCircuits(schedule)) {
        const circuitAgent = this.agentSystem.getAgent('circuit_optimization');
        if (circuitAgent) {
          this.log('info', 'Applying circuit optimization');
          const circuitResult = await circuitAgent.optimizeScheduleCircuits(iterationResults.optimized_schedule);
          iterationResults.agent_results.circuit = circuitResult;
          
          if (circuitResult.optimizedSchedule) {
            iterationResults.optimized_schedule = circuitResult.optimizedSchedule;
            iterationResults.iteration_savings += circuitResult.savings?.cost || 0;
          }
        }
      }

      // 2. Seasonal Timing Optimization
      const seasonalAgent = this.agentSystem.getAgent('seasonal_pricing');
      if (seasonalAgent) {
        this.log('info', 'Applying seasonal timing optimization');
        const seasonalResult = await seasonalAgent.optimizeScheduleTiming(
          iterationResults.optimized_schedule,
          constraints
        );
        iterationResults.agent_results.seasonal = seasonalResult;
        
        if (seasonalResult.optimizedSchedule) {
          iterationResults.optimized_schedule = seasonalResult.optimizedSchedule;
          iterationResults.iteration_savings += seasonalResult.savings?.totalSavings || 0;
        }
      }

      // 3. Transport Mode Optimization
      const transportAgent = this.agentSystem.getAgent('transport_mode_optimization');
      if (transportAgent) {
        this.log('info', 'Applying transport mode optimization');
        const transportResults = await this.optimizeTransportModes(
          iterationResults.optimized_schedule,
          transportAgent,
          constraints
        );
        iterationResults.agent_results.transport = transportResults;
        iterationResults.iteration_savings += transportResults.total_savings || 0;
      }

      // 4. Comprehensive Cost Calculation
      const costAgent = this.agentSystem.getAgent('travel_cost_calculation');
      if (costAgent) {
        const totalCost = await this.calculateTotalScheduleCost(
          iterationResults.optimized_schedule,
          costAgent
        );
        iterationResults.total_cost = totalCost;
        iterationResults.agent_results.cost_analysis = { total_cost: totalCost };
      }

      // 5. Shared Charter Analysis (performed less frequently due to complexity)
      if (iteration === 1 || iteration % 2 === 0) {
        const sharedCharterAgent = this.agentSystem.getAgent('shared_charter');
        if (sharedCharterAgent) {
          this.log('info', 'Analyzing shared charter opportunities');
          const sharedResult = await this.analyzeSharedCharterOpportunities(
            iterationResults.optimized_schedule,
            sharedCharterAgent
          );
          iterationResults.agent_results.shared_charter = sharedResult;
          iterationResults.iteration_savings += sharedResult.estimated_savings || 0;
        }
      }

      this.log('info', `Iteration ${iteration} complete. Savings: $${iterationResults.iteration_savings}`);
      return iterationResults;

    } catch (error) {
      this.log('error', `Optimization iteration ${iteration} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Optimize transport modes for all games in schedule
   */
  async optimizeTransportModes(schedule, transportAgent, constraints) {
    const results = {
      optimized_games: [],
      total_savings: 0,
      mode_recommendations: []
    };

    for (const game of schedule) {
      if (!game.isHome) {
        try {
          const modeResult = await transportAgent.optimizeTransportMode({
            origin: game.homeTeam || 'kansas',
            destination: game.destination || game.awayTeam || 'texas',
            teamSize: game.teamSize || 35,
            sport: game.sport || 'basketball',
            date: game.date,
            constraints: constraints
          });

          results.mode_recommendations.push({
            gameId: game.id,
            recommended_mode: modeResult.recommendation?.mode,
            cost: modeResult.recommendation?.cost,
            savings: modeResult.analysis?.factors?.costComparison?.savings || 0,
            confidence: modeResult.confidence
          });

          results.total_savings += modeResult.analysis?.factors?.costComparison?.savings || 0;

        } catch (error) {
          this.log('warn', `Transport mode optimization failed for game ${game.id}: ${error.message}`);
        }
      }
    }

    return results;
  }

  /**
   * Calculate total cost for entire schedule
   */
  async calculateTotalScheduleCost(schedule, costAgent) {
    let totalCost = 0;

    for (const game of schedule) {
      if (!game.isHome) {
        try {
          const costResult = await costAgent.calculateTotalTravelCost({
            origin: game.homeTeam || 'kansas',
            destination: game.destination || game.awayTeam || 'texas',
            teamSize: game.teamSize || 35,
            sport: game.sport || 'basketball',
            date: game.date
          });

          totalCost += costResult.total;

        } catch (error) {
          this.log('warn', `Cost calculation failed for game ${game.id}: ${error.message}`);
          // Use fallback estimate
          totalCost += 50000; // Default game cost estimate
        }
      }
    }

    return totalCost;
  }

  /**
   * Analyze shared charter opportunities
   */
  async analyzeSharedCharterOpportunities(schedule, sharedCharterAgent) {
    try {
      // Create mock multi-team schedule for analysis
      const multiTeamSchedules = [
        {
          teamId: 'team_1',
          teamName: 'Primary Team',
          sport: schedule[0]?.sport || 'basketball',
          teamSize: 35,
          games: schedule
        }
        // In real implementation, this would include actual multiple team schedules
      ];

      const sharedResult = await sharedCharterAgent.identifySharedCharterOpportunities(multiTeamSchedules);
      
      return {
        opportunities_found: sharedResult.opportunities?.length || 0,
        estimated_savings: sharedResult.totalSavings?.total_savings || 0,
        implementation_complexity: this.assessSharedCharterComplexity(sharedResult),
        recommendations: sharedResult.summary
      };

    } catch (error) {
      this.log('warn', `Shared charter analysis failed: ${error.message}`);
      return { opportunities_found: 0, estimated_savings: 0 };
    }
  }

  /**
   * Calculate comprehensive performance metrics
   */
  async calculatePerformanceMetrics(originalSchedule, optimizedSchedule, optimization) {
    const originalCost = await this.estimateScheduleCost(originalSchedule);
    const optimizedCost = await this.estimateScheduleCost(optimizedSchedule);

    return {
      cost_reduction: {
        absolute: originalCost - optimizedCost,
        percentage: ((originalCost - optimizedCost) / originalCost) * 100,
        target_achievement: ((originalCost - optimizedCost) / originalCost) / this.optimizationStrategy.performance_targets.total_savings_percentage
      },
      optimization_efficiency: {
        iterations_used: optimization.iteration,
        convergence_achieved: optimization.convergence,
        improvement_per_iteration: optimization.total_savings / optimization.iteration
      },
      strategic_impact: {
        circuit_opportunities: this.countCircuitOpportunities(optimizedSchedule),
        seasonal_optimizations: this.countSeasonalOptimizations(optimization),
        transport_mode_improvements: this.countTransportModeImprovements(optimization)
      }
    };
  }

  /**
   * Generate strategic recommendations
   */
  async generateStrategicRecommendations(metrics, history) {
    const recommendations = [];

    // Cost reduction recommendations
    if (metrics.cost_reduction.percentage < this.optimizationStrategy.performance_targets.total_savings_percentage * 100) {
      recommendations.push({
        category: 'cost_optimization',
        priority: 'high',
        recommendation: 'Additional cost reduction opportunities exist',
        action: 'Implement advanced circuit optimization and explore non-traditional scheduling windows',
        potential_impact: 'Up to 10% additional savings'
      });
    }

    // Circuit optimization recommendations
    const circuitEfficiency = this.calculateCircuitEfficiency(history);
    if (circuitEfficiency < this.optimizationStrategy.performance_targets.circuit_efficiency) {
      recommendations.push({
        category: 'circuit_optimization',
        priority: 'medium',
        recommendation: 'Circuit routing can be further optimized',
        action: 'Implement flexible date scheduling for better geographic clustering',
        potential_impact: '5-8% travel distance reduction'
      });
    }

    // Operational recommendations
    recommendations.push({
      category: 'operational',
      priority: 'medium',
      recommendation: 'Establish travel optimization as ongoing process',
      action: 'Schedule quarterly optimization reviews and implement real-time monitoring',
      potential_impact: 'Sustained 10-15% cost efficiency gains'
    });

    return recommendations;
  }

  /**
   * Generate implementation plan
   */
  async generateImplementationPlan(optimization) {
    return {
      immediate_actions: [
        'Apply optimized schedule changes to current season',
        'Implement transport mode recommendations',
        'Establish budget monitoring thresholds'
      ],
      short_term: [
        'Develop shared charter coordination protocols',
        'Implement seasonal booking strategies',
        'Create travel cost tracking dashboard'
      ],
      long_term: [
        'Establish conference-wide travel optimization coordination',
        'Develop predictive cost modeling capabilities',
        'Implement automated optimization triggers'
      ],
      success_metrics: [
        `Target ${this.optimizationStrategy.performance_targets.total_savings_percentage * 100}% cost reduction`,
        'Achieve 95% budget compliance across all sports',
        'Maintain optimization efficiency above 80%'
      ],
      timeline: {
        implementation_start: 'Immediate',
        full_deployment: '6-8 weeks',
        optimization_review: 'Quarterly'
      }
    };
  }

  /**
   * Helper methods
   */
  async estimateScheduleCost(schedule) {
    // Simplified cost estimation for planning purposes
    const awayGames = schedule.filter(game => !game.isHome);
    return awayGames.length * 50000; // $50k average per away game
  }

  shouldReoptimizeCircuits(schedule) {
    // Heuristic: reoptimize if significant schedule changes detected
    return true; // Simplified - always reoptimize for now
  }

  countCircuitOpportunities(schedule) {
    const awayGames = schedule.filter(game => !game.isHome);
    return Math.floor(awayGames.length / 3); // Estimate circuit potential
  }

  countSeasonalOptimizations(optimization) {
    return optimization.optimization_history.reduce((count, iteration) => {
      return count + (iteration.details.agent_results?.seasonal?.savings?.gamesOptimized || 0);
    }, 0);
  }

  countTransportModeImprovements(optimization) {
    return optimization.optimization_history.reduce((count, iteration) => {
      return count + (iteration.details.agent_results?.transport?.mode_recommendations?.length || 0);
    }, 0);
  }

  calculateCircuitEfficiency(history) {
    // Simplified circuit efficiency calculation
    const latestIteration = history[history.length - 1];
    return latestIteration?.details?.agent_results?.circuit?.circuits?.reduce((avg, circuit) => {
      return avg + (circuit.efficiency || 0.8);
    }, 0) / (latestIteration?.details?.agent_results?.circuit?.circuits?.length || 1) || 0.8;
  }

  assessSharedCharterComplexity(sharedResult) {
    const opportunities = sharedResult.opportunities?.length || 0;
    if (opportunities === 0) return 'none';
    if (opportunities <= 2) return 'low';
    if (opportunities <= 5) return 'medium';
    return 'high';
  }

  /**
   * Agent lifecycle methods
   */
  async initialize() {
    this.log('info', 'Travel Optimization Director initialized');
    
    if (!this.agentSystem) {
      this.log('warn', 'No agent system provided - limited functionality available');
    }
    
    this.status = 'ready';
  }

  async shutdown() {
    this.log('info', 'Travel Optimization Director shutting down');
    this.status = 'inactive';
  }

  getStatus() {
    return {
      name: this.name,
      status: this.status,
      capabilities: this.capabilities,
      agentSystemConnected: !!this.agentSystem,
      lastActivity: this.lastActivity
    };
  }
}

module.exports = TravelOptimizationDirector;