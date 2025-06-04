// CopilotKit Routes for FlexTime AG-UI Integration
const express = require('express');
const { 
  copilotRuntimeNodeExpressEndpoint, 
  OpenAIAdapter,
  CopilotRuntime 
} = require('@copilotkit/runtime');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
});

// Create CopilotKit actions for FlexTime
const flexTimeActions = [
  {
    name: "generateSchedule",
    description: "Generate a new schedule for a specific sport",
    parameters: [
      {
        name: "sport",
        type: "string",
        description: "The sport to generate a schedule for (e.g., Basketball, Football)",
        required: true
      },
      {
        name: "teams",
        type: "array", 
        items: { type: "string" },
        description: "Array of team codes to include in the schedule"
      },
      {
        name: "constraints",
        type: "object",
        description: "Scheduling constraints like venue availability, rest days"
      }
    ]
  },
  {
    name: "optimizeTravel",
    description: "Optimize travel costs and distances for the current schedule",
    parameters: [
      {
        name: "scheduleId",
        type: "string",
        description: "The ID of the schedule to optimize",
        required: true
      },
      {
        name: "optimizationGoals",
        type: "array",
        items: { type: "string" },
        description: "Goals like 'minimize_cost', 'minimize_distance', 'balance_travel'"
      }
    ]
  },
  {
    name: "analyzeCompetitiveBalance",
    description: "Analyze competitive balance of the current schedule",
    parameters: [
      {
        name: "sport", 
        type: "string",
        description: "The sport to analyze",
        required: true
      },
      {
        name: "metrics",
        type: "array",
        items: { type: "string" },
        description: "Metrics to analyze like 'home_away_balance', 'rest_days', 'strength_of_schedule'"
      }
    ]
  },
  {
    name: "exportSchedule",
    description: "Export the schedule in various formats",
    parameters: [
      {
        name: "format",
        type: "string",
        enum: ["csv", "excel", "ical", "html", "json"],
        description: "Export format",
        required: true
      },
      {
        name: "scheduleId",
        type: "string", 
        description: "The ID of the schedule to export",
        required: true
      }
    ]
  },
  {
    name: "getTeamStats",
    description: "Get statistics for Big 12 teams",
    parameters: [
      {
        name: "teamCode",
        type: "string",
        description: "Team code (e.g., KU, OSU, BYU)"
      },
      {
        name: "sport",
        type: "string", 
        description: "Sport to get stats for"
      }
    ]
  },
  {
    name: "getScheduleMetrics",
    description: "Get comprehensive metrics for a schedule",
    parameters: [
      {
        name: "scheduleId",
        type: "string",
        description: "The schedule ID to analyze",
        required: true
      }
    ]
  }
];

// Action handlers
const actionHandlers = {
  generateSchedule: async (args) => {
    const { sport, teams, constraints } = args;
    
    try {
      // Call your existing schedule generation logic
      const scheduleService = require('../../services/scheduleService');
      
      const result = await scheduleService.generateSchedule({
        sport,
        teams: teams || [], // Default to empty array if not provided
        constraints: constraints || {}
      });
      
      return {
        success: true,
        message: `Successfully generated ${sport} schedule for ${teams?.length || 'all'} teams`,
        scheduleId: result.scheduleId,
        gameCount: result.gameCount,
        conflictCount: result.conflicts?.length || 0
      };
    } catch (error) {
      console.error('Error generating schedule:', error);
      return {
        success: false,
        message: `Failed to generate schedule: ${error.message}`
      };
    }
  },

  optimizeTravel: async (args) => {
    const { scheduleId, optimizationGoals } = args;
    
    try {
      // Call your travel optimization logic
      const result = await scheduleService.optimizeTravel(scheduleId, {
        goals: optimizationGoals || ['minimize_cost', 'minimize_distance']
      });
      
      return {
        success: true,
        message: `Travel optimization completed for schedule ${scheduleId}`,
        savings: result.estimatedSavings,
        improvements: result.improvements
      };
    } catch (error) {
      console.error('Error optimizing travel:', error);
      return {
        success: false,
        message: `Failed to optimize travel: ${error.message}`
      };
    }
  },

  analyzeCompetitiveBalance: async (args) => {
    const { sport, metrics } = args;
    
    try {
      // Call your competitive balance analysis
      const analysisMetrics = metrics || ['home_away_balance', 'rest_days', 'strength_of_schedule'];
      
      const result = await scheduleService.analyzeCompetitiveBalance(sport, analysisMetrics);
      
      return {
        success: true,
        message: `Competitive balance analysis completed for ${sport}`,
        metrics: result.metrics,
        score: result.overallScore,
        recommendations: result.recommendations
      };
    } catch (error) {
      console.error('Error analyzing competitive balance:', error);
      return {
        success: false,
        message: `Failed to analyze competitive balance: ${error.message}`
      };
    }
  },

  exportSchedule: async (args) => {
    const { format, scheduleId } = args;
    
    try {
      // Call your export logic
      const result = await scheduleService.exportSchedule(scheduleId, format);
      
      return {
        success: true,
        message: `Schedule ${scheduleId} exported as ${format}`,
        downloadUrl: result.downloadUrl,
        filename: result.filename
      };
    } catch (error) {
      console.error('Error exporting schedule:', error);
      return {
        success: false,
        message: `Failed to export schedule: ${error.message}`
      };
    }
  },

  getTeamStats: async (args) => {
    const { teamCode, sport } = args;
    
    try {
      const db = require('../models');
      
      let query = {};
      if (teamCode) query.code = teamCode;
      if (sport) query.sport = sport;
      
      const teams = await db.Team.findAll({ where: query });
      
      return {
        success: true,
        teams: teams.map(team => ({
          code: team.code,
          name: team.name,
          conference: team.conference,
          sport: team.sport
        }))
      };
    } catch (error) {
      console.error('Error getting team stats:', error);
      return {
        success: false,
        message: `Failed to get team stats: ${error.message}`
      };
    }
  },

  getScheduleMetrics: async (args) => {
    const { scheduleId } = args;
    
    try {
      const result = await scheduleService.getScheduleMetrics(scheduleId);
      
      return {
        success: true,
        metrics: result
      };
    } catch (error) {
      console.error('Error getting schedule metrics:', error);
      return {
        success: false,
        message: `Failed to get schedule metrics: ${error.message}`
      };
    }
  }
};

// Configure CopilotKit endpoint
router.use('/copilotkit', copilotRuntimeNodeExpressEndpoint({
  runtime: new CopilotRuntime({
    actions: flexTimeActions.map(action => ({
      ...action,
      handler: async (args) => {
        if (actionHandlers[action.name]) {
          return await actionHandlers[action.name](args);
        }
        return { success: false, message: `Handler not found for action: ${action.name}` };
      }
    }))
  }),
  serviceAdapter: new OpenAIAdapter({ 
    openai,
    model: "gpt-4o",
    systemMessage: `You are a FlexTime scheduling assistant for the Big 12 Conference. 
    
    You help with:
    - Sports scheduling for all Big 12 Conference teams
    - Travel optimization and cost analysis  
    - Competitive balance assessment
    - Schedule exports and reporting
    - Team statistics and analytics
    
    The Big 12 Conference has 16 member schools: Arizona, Arizona State, Baylor, BYU, Cincinnati, Colorado, Houston, Iowa State, Kansas, Kansas State, Oklahoma State, TCU, Texas Tech, UCF, Utah, and West Virginia.
    
    You have access to actions that can generate schedules, optimize travel, analyze competitive balance, export schedules, and get team statistics. Use these actions to help users accomplish their scheduling goals.
    
    Be helpful, concise, and focus on practical scheduling solutions.`
  })
}));

// Health check for CopilotKit
router.get('/copilotkit/health', (req, res) => {
  res.json({
    success: true,
    message: "FlexTime CopilotKit integration is healthy",
    actions: flexTimeActions.length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;