/**
 * Script to update backend index.js to use enhanced schedule routes
 * 
 * This script shows what changes need to be made to the backend
 * to properly integrate the new scheduling services.
 */

const fs = require('fs');
const path = require('path');

console.log('Backend Route Update Instructions');
console.log('=================================\n');

console.log('1. In backend/index.js, update the route registration:\n');

console.log(`FIND this line:
  app.use('/api', scheduleRoutes);

REPLACE with:
  // Use enhanced schedule routes with data endpoints
  const enhancedScheduleRoutes = require('./routes/enhancedScheduleRoutes');
  app.use('/api', enhancedScheduleRoutes);
`);

console.log('\n2. Or if you want to keep both (recommended during transition):\n');

console.log(`ADD these lines after existing routes:
  // Enhanced routes with data access endpoints
  const enhancedScheduleRoutes = require('./routes/enhancedScheduleRoutes');
  app.use('/api/v2', enhancedScheduleRoutes); // Version 2 API
`);

console.log('\n3. Update the FT Builder endpoint registration:\n');

console.log(`ADD this endpoint for FT Builder:
  // FT Builder Engine endpoint
  app.post('/api/ft-builder/generate', async (req, res) => {
    try {
      const FTBuilderEngine = require('./services/FT_Builder_Engine');
      const ftBuilder = new FTBuilderEngine();
      await ftBuilder.initialize();
      
      const result = await ftBuilder.generateSchedule(req.body);
      res.json(result);
    } catch (error) {
      console.error('FT Builder error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
`);

console.log('\n4. Add health check endpoint for new services:\n');

console.log(`ADD this endpoint:
  // Health check for scheduling services
  app.get('/api/health/scheduling', (req, res) => {
    const Big12DataService = require('./services/big12DataService');
    
    try {
      const teams = Big12DataService.getTeams({ sport_id: 2 });
      const sports = Big12DataService.getSports();
      
      res.json({
        success: true,
        status: 'healthy',
        services: {
          big12DataService: 'operational',
          teamsLoaded: teams.length,
          sportsLoaded: Object.keys(sports).length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  });
`);

console.log('\n5. Example of complete integration:\n');

const exampleIntegration = `
// In backend/index.js

// Import enhanced routes
const enhancedScheduleRoutes = require('./routes/enhancedScheduleRoutes');
const FTBuilderEngine = require('./services/FT_Builder_Engine');

// Register routes
app.use('/api', enhancedScheduleRoutes); // All data and schedule endpoints

// FT Builder specific endpoint
app.post('/api/ft-builder/generate', async (req, res) => {
  try {
    const ftBuilder = new FTBuilderEngine({
      useHistoricalData: true,
      useLocalRecommendations: true
    });
    
    await ftBuilder.initialize();
    const result = await ftBuilder.generateSchedule(req.body);
    res.json(result);
  } catch (error) {
    console.error('FT Builder error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Quick test endpoint
app.get('/api/test/team-calculation', (req, res) => {
  const Big12DataService = require('./services/big12DataService');
  const { school_id, sport_id } = req.query;
  
  if (!school_id || !sport_id) {
    return res.status(400).json({
      error: 'school_id and sport_id are required query parameters'
    });
  }
  
  const teamId = Big12DataService.calculateTeamId(
    parseInt(school_id), 
    parseInt(sport_id)
  );
  
  const team = Big12DataService.getTeamById(teamId);
  
  res.json({
    school_id: parseInt(school_id),
    sport_id: parseInt(sport_id),
    calculated_team_id: teamId,
    team: team || null
  });
});
`;

console.log(exampleIntegration);

console.log('\n6. Frontend API updates needed:\n');

const frontendAPIExample = `
// In frontend/lib/api.ts

export const flexTimeAPI = {
  // Data endpoints
  async getTeams(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(\`\${API_BASE_URL}/api/teams?\${params}\`);
    return response.json();
  },
  
  async getVenues(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(\`\${API_BASE_URL}/api/venues?\${params}\`);
    return response.json();
  },
  
  async getSports() {
    const response = await fetch(\`\${API_BASE_URL}/api/sports\`);
    return response.json();
  },
  
  async getSchools(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(\`\${API_BASE_URL}/api/schools?\${params}\`);
    return response.json();
  },
  
  // FT Builder endpoint
  async generateSchedule(parameters) {
    const response = await fetch(\`\${API_BASE_URL}/api/ft-builder/generate\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parameters)
    });
    return response.json();
  }
};
`;

console.log(frontendAPIExample);

console.log('\n✅ Route update instructions complete!');
console.log('\nTo test after implementation:');
console.log('1. Run: node backend/scripts/test-scheduling-services.js');
console.log('2. Test endpoints: curl http://localhost:3005/api/teams?sport_id=2');
console.log('3. Check health: curl http://localhost:3005/api/health/scheduling');