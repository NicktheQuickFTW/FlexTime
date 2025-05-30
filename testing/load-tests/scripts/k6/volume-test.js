import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics for volume testing
const dataVolumeProcessed = new Counter('data_volume_processed');
const largeDatasetErrors = new Rate('large_dataset_errors');
const bulkOperationTime = new Trend('bulk_operation_duration');
const memoryUsageViolations = new Counter('memory_usage_violations');

export const options = {
  scenarios: {
    volume_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '5m', target: 10 },   // Ramp up
        { duration: '20m', target: 20 },  // Sustained volume load
        { duration: '5m', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Higher threshold for volume operations
    http_req_failed: ['rate<0.02'],
    large_dataset_errors: ['rate<0.01'],
    bulk_operation_duration: ['p(90)<30000'], // 30s for bulk operations
    memory_usage_violations: ['count<10'],
  },
  ext: {
    loadimpact: {
      projectID: process.env.K6_PROJECT_ID,
      name: 'Flextime Volume Test'
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';

// Large dataset configurations
const VOLUME_CONFIGS = {
  small: { teams: 16, games: 100, seasons: 1 },
  medium: { teams: 50, games: 500, seasons: 3 },
  large: { teams: 100, games: 1000, seasons: 5 },
  xlarge: { teams: 200, games: 2000, seasons: 10 },
};

export function setup() {
  console.log('Setting up volume test data...');
  
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'setup - service healthy': (r) => r.status === 200,
  });

  // Create test datasets
  return {
    baseUrl: BASE_URL,
    volumeConfig: VOLUME_CONFIGS[__ENV.VOLUME_SIZE || 'medium'],
    testId: `volume_test_${Date.now()}`
  };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };

  // Rotate through volume test scenarios
  const scenarios = [
    () => testBulkScheduleGeneration(data, headers),
    () => testLargeDatasetRetrieval(data, headers),
    () => testBulkTeamOperations(data, headers),
    () => testMassiveConstraintProcessing(data, headers),
    () => testConcurrentAnalytics(data, headers),
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(1 + Math.random() * 2); // 1-3 seconds between operations
}

function testBulkScheduleGeneration(data, headers) {
  const startTime = Date.now();
  
  const payload = {
    operation: 'bulk_generate',
    schedules: generateBulkScheduleData(data.volumeConfig),
    testId: data.testId,
    options: {
      parallel: true,
      batchSize: 50,
      timeout: 60000
    }
  };

  const response = http.post(
    `${data.baseUrl}/api/schedules/bulk`,
    JSON.stringify(payload),
    { 
      headers,
      timeout: '90s' // Extended timeout for volume operations
    }
  );

  const duration = Date.now() - startTime;
  bulkOperationTime.add(duration);
  dataVolumeProcessed.add(payload.schedules.length);

  const success = check(response, {
    'bulk schedule - status success': (r) => r.status >= 200 && r.status < 300,
    'bulk schedule - has results': (r) => r.json() && r.json().processed,
    'bulk schedule - memory efficient': (r) => r.headers['X-Memory-Usage'] ? 
      parseInt(r.headers['X-Memory-Usage']) < 1000000000 : true, // 1GB limit
  });

  if (!success) {
    largeDatasetErrors.add(1);
    if (response.headers['X-Memory-Usage'] && 
        parseInt(response.headers['X-Memory-Usage']) > 1000000000) {
      memoryUsageViolations.add(1);
    }
  }
}

function testLargeDatasetRetrieval(data, headers) {
  const params = {
    limit: 1000,
    includeDetails: true,
    season: '2025',
    format: 'detailed'
  };

  const queryString = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');

  const response = http.get(
    `${data.baseUrl}/api/schedules/export?${queryString}`,
    { headers, timeout: '60s' }
  );

  const success = check(response, {
    'large dataset - status 200': (r) => r.status === 200,
    'large dataset - has data': (r) => r.body.length > 1000,
    'large dataset - reasonable size': (r) => r.body.length < 50000000, // 50MB limit
  });

  if (response.body.length > 0) {
    dataVolumeProcessed.add(response.body.length);
  }

  if (!success) largeDatasetErrors.add(1);
}

function testBulkTeamOperations(data, headers) {
  const teams = generateBulkTeamData(data.volumeConfig.teams);
  
  const payload = {
    operation: 'bulk_upsert',
    teams: teams,
    testId: data.testId
  };

  const response = http.post(
    `${data.baseUrl}/api/teams/bulk`,
    JSON.stringify(payload),
    { headers, timeout: '30s' }
  );

  const success = check(response, {
    'bulk teams - status success': (r) => r.status >= 200 && r.status < 300,
    'bulk teams - processed count': (r) => {
      const result = r.json();
      return result && result.processed === teams.length;
    },
  });

  dataVolumeProcessed.add(teams.length);
  if (!success) largeDatasetErrors.add(1);
}

function testMassiveConstraintProcessing(data, headers) {
  const constraints = generateComplexConstraints(data.volumeConfig);
  
  const payload = {
    constraints: constraints,
    validateAll: true,
    testId: data.testId
  };

  const response = http.post(
    `${data.baseUrl}/api/constraints/validate-bulk`,
    JSON.stringify(payload),
    { headers, timeout: '45s' }
  );

  const success = check(response, {
    'constraint processing - status 200': (r) => r.status === 200,
    'constraint processing - validation results': (r) => {
      const result = r.json();
      return result && result.validationResults;
    },
  });

  dataVolumeProcessed.add(constraints.length);
  if (!success) largeDatasetErrors.add(1);
}

function testConcurrentAnalytics(data, headers) {
  const payload = {
    analysisType: 'comprehensive',
    dateRange: {
      start: '2025-01-01',
      end: '2025-12-31'
    },
    includeProjections: true,
    testId: data.testId
  };

  const response = http.post(
    `${data.baseUrl}/api/analytics/volume-analysis`,
    JSON.stringify(payload),
    { headers, timeout: '120s' }
  );

  check(response, {
    'analytics - status 200': (r) => r.status === 200,
    'analytics - has metrics': (r) => r.json() && r.json().metrics,
    'analytics - performance data': (r) => r.json() && r.json().performanceData,
  });
}

function generateBulkScheduleData(config) {
  const schedules = [];
  const sports = ['Football', 'Basketball', 'Baseball', 'Soccer', 'Volleyball'];
  
  for (let i = 0; i < config.seasons; i++) {
    for (const sport of sports) {
      schedules.push({
        sport: sport,
        season: `${2025 + i}`,
        teams: config.teams,
        expectedGames: Math.floor(config.games / sports.length),
        constraints: {
          maxGamesPerWeek: sport === 'Football' ? 1 : 3,
          minRestDays: sport === 'Football' ? 6 : 1,
          homeAwayBalance: true,
          regionalPreferences: true
        }
      });
    }
  }
  
  return schedules;
}

function generateBulkTeamData(teamCount) {
  const teams = [];
  const conferences = ['Big 12', 'SEC', 'Big Ten', 'ACC', 'Pac-12'];
  
  for (let i = 0; i < teamCount; i++) {
    teams.push({
      name: `Test Team ${i + 1}`,
      code: `TT${i + 1}`,
      conference: conferences[i % conferences.length],
      location: {
        city: `City ${i + 1}`,
        state: `State ${i % 50 + 1}`,
        coordinates: {
          lat: 30 + (i % 20),
          lng: -100 + (i % 40)
        }
      },
      metadata: {
        founded: 1900 + (i % 120),
        enrollment: 10000 + (i * 100),
        stadium: `Stadium ${i + 1}`,
        capacity: 20000 + (i * 1000)
      }
    });
  }
  
  return teams;
}

function generateComplexConstraints(config) {
  const constraints = [];
  const types = ['scheduling', 'travel', 'venue', 'broadcast', 'academic'];
  
  for (let i = 0; i < config.teams * 5; i++) {
    constraints.push({
      id: `constraint_${i}`,
      type: types[i % types.length],
      priority: Math.floor(Math.random() * 10) + 1,
      conditions: {
        teams: [`team_${i % config.teams}`, `team_${(i + 1) % config.teams}`],
        dateRange: {
          start: `2025-${String(Math.floor(i % 12) + 1).padStart(2, '0')}-01`,
          end: `2025-${String(Math.floor(i % 12) + 1).padStart(2, '0')}-28`
        },
        requirements: {
          minGap: Math.floor(Math.random() * 7) + 1,
          maxConsecutive: Math.floor(Math.random() * 3) + 1,
          homeAwayPattern: i % 2 === 0 ? 'home' : 'away'
        }
      }
    });
  }
  
  return constraints;
}

export function teardown(data) {
  console.log('Cleaning up volume test data...');
  
  const cleanupPayload = {
    testId: data.testId,
    cleanupLevel: 'complete'
  };

  http.post(
    `${data.baseUrl}/api/test/cleanup`,
    JSON.stringify(cleanupPayload),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s'
    }
  );
  
  console.log('Volume test teardown completed');
}