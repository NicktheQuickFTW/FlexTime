/**
 * Travel Optimization Routes
 * 
 * API endpoints for travel cost optimization functionality including
 * comprehensive optimization, agent-specific optimization, and monitoring.
 */

const express = require('express');
const router = express.Router();

/**
 * Comprehensive Travel Optimization Endpoint
 * POST /api/travel-optimization/optimize
 * 
 * Executes full travel optimization using all available agents
 */
router.post('/optimize', async (req, res) => {
  try {
    const { schedule, constraints = {}, options = {} } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Valid schedule array is required'
      });
    }

    // Get agent system and travel optimization director
    const agentSystem = req.app.locals.agentSystem;
    if (!agentSystem) {
      return res.status(500).json({
        success: false,
        error: 'Agent system not available'
      });
    }

    const travelDirector = agentSystem.getAgent('travel_optimization_director');
    if (!travelDirector) {
      return res.status(500).json({
        success: false,
        error: 'Travel Optimization Director not available'
      });
    }

    // Execute comprehensive optimization
    const optimizationResult = await travelDirector.executeComprehensiveOptimization(
      schedule,
      constraints
    );

    res.json({
      success: true,
      data: optimizationResult,
      message: `Optimization complete. Estimated savings: $${optimizationResult.optimization_summary?.total_savings || 0}`
    });

  } catch (error) {
    console.error('Travel optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Travel optimization failed'
    });
  }
});

/**
 * Transport Mode Optimization Endpoint
 * POST /api/travel-optimization/transport-mode
 * 
 * Optimizes transport mode for a specific trip
 */
router.post('/transport-mode', async (req, res) => {
  try {
    const { origin, destination, teamSize, sport, date, constraints = {} } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination are required'
      });
    }

    const agentSystem = req.app.locals.agentSystem;
    const transportAgent = agentSystem?.getAgent('transport_mode_optimization');

    if (!transportAgent) {
      return res.status(500).json({
        success: false,
        error: 'Transport mode optimization agent not available'
      });
    }

    const travelRequest = {
      origin,
      destination,
      teamSize: teamSize || 35,
      sport: sport || 'basketball',
      date: date || new Date().toISOString().split('T')[0],
      constraints
    };

    const result = await transportAgent.optimizeTransportMode(travelRequest);

    res.json({
      success: true,
      data: result,
      message: `Transport mode optimized: ${result.recommendation?.mode} recommended`
    });

  } catch (error) {
    console.error('Transport mode optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Transport mode optimization failed'
    });
  }
});

/**
 * Travel Cost Calculation Endpoint
 * POST /api/travel-optimization/calculate-cost
 * 
 * Calculates comprehensive travel cost for a trip
 */
router.post('/calculate-cost', async (req, res) => {
  try {
    const { origin, destination, teamSize, sport, date, transportMode } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination are required'
      });
    }

    const agentSystem = req.app.locals.agentSystem;
    const costAgent = agentSystem?.getAgent('travel_cost_calculation');

    if (!costAgent) {
      return res.status(500).json({
        success: false,
        error: 'Travel cost calculation agent not available'
      });
    }

    const travelRequest = {
      origin,
      destination,
      teamSize: teamSize || 35,
      sport: sport || 'basketball',
      date: date || new Date().toISOString().split('T')[0],
      transportMode
    };

    const result = await costAgent.calculateTotalTravelCost(travelRequest);

    res.json({
      success: true,
      data: result,
      message: `Total travel cost: $${result.total}`
    });

  } catch (error) {
    console.error('Travel cost calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Travel cost calculation failed'
    });
  }
});

/**
 * Circuit Optimization Endpoint
 * POST /api/travel-optimization/optimize-circuits
 * 
 * Optimizes travel circuits for a schedule
 */
router.post('/optimize-circuits', async (req, res) => {
  try {
    const { schedule } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Valid schedule array is required'
      });
    }

    const agentSystem = req.app.locals.agentSystem;
    const circuitAgent = agentSystem?.getAgent('circuit_optimization');

    if (!circuitAgent) {
      return res.status(500).json({
        success: false,
        error: 'Circuit optimization agent not available'
      });
    }

    const result = await circuitAgent.optimizeScheduleCircuits(schedule);

    res.json({
      success: true,
      data: result,
      message: `Circuit optimization complete. Distance savings: ${result.savings?.distance || 0} miles`
    });

  } catch (error) {
    console.error('Circuit optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Circuit optimization failed'
    });
  }
});

/**
 * Seasonal Pricing Optimization Endpoint
 * POST /api/travel-optimization/seasonal-pricing
 * 
 * Optimizes schedule timing based on seasonal pricing
 */
router.post('/seasonal-pricing', async (req, res) => {
  try {
    const { schedule, constraints = {} } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({
        success: false,
        error: 'Valid schedule array is required'
      });
    }

    const agentSystem = req.app.locals.agentSystem;
    const seasonalAgent = agentSystem?.getAgent('seasonal_pricing');

    if (!seasonalAgent) {
      return res.status(500).json({
        success: false,
        error: 'Seasonal pricing agent not available'
      });
    }

    const result = await seasonalAgent.optimizeScheduleTiming(schedule, constraints);

    res.json({
      success: true,
      data: result,
      message: `Seasonal optimization complete. Savings: $${result.savings?.totalSavings || 0}`
    });

  } catch (error) {
    console.error('Seasonal pricing optimization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Seasonal pricing optimization failed'
    });
  }
});

/**
 * Shared Charter Analysis Endpoint
 * POST /api/travel-optimization/shared-charter
 * 
 * Analyzes shared charter opportunities across multiple team schedules
 */
router.post('/shared-charter', async (req, res) => {
  try {
    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({
        success: false,
        error: 'Valid schedules array is required'
      });
    }

    const agentSystem = req.app.locals.agentSystem;
    const sharedCharterAgent = agentSystem?.getAgent('shared_charter');

    if (!sharedCharterAgent) {
      return res.status(500).json({
        success: false,
        error: 'Shared charter agent not available'
      });
    }

    const result = await sharedCharterAgent.identifySharedCharterOpportunities(schedules);

    res.json({
      success: true,
      data: result,
      message: `Found ${result.opportunities?.length || 0} shared charter opportunities`
    });

  } catch (error) {
    console.error('Shared charter analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Shared charter analysis failed'
    });
  }
});

/**
 * Budget Monitoring Endpoint
 * POST /api/travel-optimization/monitor-budget
 * 
 * Monitors travel budget status and generates alerts
 */
router.post('/monitor-budget', async (req, res) => {
  try {
    const { budgetData, currentSpending = {}, upcomingExpenses = [] } = req.body;

    if (!budgetData) {
      return res.status(400).json({
        success: false,
        error: 'Budget data is required'
      });
    }

    const agentSystem = req.app.locals.agentSystem;
    const budgetAgent = agentSystem?.getAgent('travel_budget_monitor');

    if (!budgetAgent) {
      return res.status(500).json({
        success: false,
        error: 'Travel budget monitor agent not available'
      });
    }

    const result = await budgetAgent.monitorTravelBudgets(
      budgetData,
      currentSpending,
      upcomingExpenses
    );

    res.json({
      success: true,
      data: result,
      message: `Budget status: ${result.analysis?.overall?.status?.status || 'unknown'}`
    });

  } catch (error) {
    console.error('Budget monitoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Budget monitoring failed'
    });
  }
});

/**
 * Agent Status Endpoint
 * GET /api/travel-optimization/status
 * 
 * Returns status of all travel optimization agents
 */
router.get('/status', async (req, res) => {
  try {
    const agentSystem = req.app.locals.agentSystem;
    
    if (!agentSystem) {
      return res.status(500).json({
        success: false,
        error: 'Agent system not available'
      });
    }

    const travelAgents = agentSystem.getTravelOptimizationAgents();
    const director = agentSystem.getAgent('travel_optimization_director');

    const status = {
      director: director ? director.getStatus() : null,
      agents: {}
    };

    for (const [id, agent] of travelAgents.entries()) {
      status.agents[id] = agent.getStatus ? agent.getStatus() : { status: 'unknown' };
    }

    res.json({
      success: true,
      data: status,
      message: `${Object.keys(status.agents).length} travel optimization agents active`
    });

  } catch (error) {
    console.error('Agent status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve agent status'
    });
  }
});

/**
 * Travel Optimization Capabilities Endpoint
 * GET /api/travel-optimization/capabilities
 * 
 * Returns available optimization capabilities and parameters
 */
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      comprehensive_optimization: {
        description: 'Full travel cost optimization using all agents',
        parameters: ['schedule', 'constraints', 'options'],
        estimated_savings: '10-25%'
      },
      transport_mode_optimization: {
        description: 'Optimize bus vs flight decisions',
        parameters: ['origin', 'destination', 'teamSize', 'sport', 'date'],
        estimated_savings: '5-15%'
      },
      circuit_optimization: {
        description: 'Optimize travel routes and circuits',
        parameters: ['schedule'],
        estimated_savings: '15-25%'
      },
      seasonal_pricing: {
        description: 'Optimize timing based on seasonal pricing',
        parameters: ['schedule', 'constraints'],
        estimated_savings: '5-12%'
      },
      shared_charter: {
        description: 'Multi-team charter coordination',
        parameters: ['schedules'],
        estimated_savings: '20-40%'
      },
      budget_monitoring: {
        description: 'Real-time budget tracking and alerts',
        parameters: ['budgetData', 'currentSpending', 'upcomingExpenses'],
        features: ['threshold_alerts', 'variance_analysis', 'recommendations']
      }
    };

    res.json({
      success: true,
      data: capabilities,
      message: 'Travel optimization capabilities available'
    });

  } catch (error) {
    console.error('Capabilities error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve capabilities'
    });
  }
});

module.exports = router;