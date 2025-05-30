import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTimeThreshold = new Counter('response_time_violations');
const scheduleGenerationTime = new Trend('schedule_generation_duration');

export const options = {
  scenarios: {
    soak_test: {
      executor: 'constant-vus',
      vus: 50, // Sustained load
      duration: '2h', // Long duration soak test
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'], // Error rate under 5%
    errors: ['rate<0.05'],
    response_time_violations: ['count<100'], // Less than 100 violations
  },
  ext: {
    loadimpact: {
      projectID: process.env.K6_PROJECT_ID,
      name: 'Flextime Soak Test'
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';

export function setup() {
  // Pre-test setup
  console.log('Starting soak test setup...');
  const setupResponse = http.get(`${BASE_URL}/health`);
  check(setupResponse, {
    'setup - service is healthy': (r) => r.status === 200,
  });
  
  return { 
    baseUrl: BASE_URL,
    startTime: Date.now() 
  };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };

  // Test various endpoints throughout the soak test
  const testScenarios = [
    () => testScheduleGeneration(data.baseUrl, headers),
    () => testScheduleRetrieval(data.baseUrl, headers),
    () => testConstraintManagement(data.baseUrl, headers),
    () => testTeamManagement(data.baseUrl, headers),
    () => testAnalytics(data.baseUrl, headers),
  ];

  // Random scenario selection to simulate real usage
  const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
  scenario();

  // Realistic think time
  sleep(Math.random() * 3 + 2); // 2-5 seconds
}

function testScheduleGeneration(baseUrl, headers) {
  const startTime = Date.now();
  
  const payload = {
    sport: 'Football',
    season: '2025',
    constraints: {
      maxGamesPerWeek: 1,
      minRestDays: 6,
      homeAwayBalance: true
    }
  };

  const response = http.post(`${baseUrl}/api/schedules/generate`, 
    JSON.stringify(payload), 
    { headers }
  );

  const duration = Date.now() - startTime;
  scheduleGenerationTime.add(duration);

  const success = check(response, {
    'schedule generation - status 200': (r) => r.status === 200,
    'schedule generation - has schedule': (r) => r.json() && r.json().schedule,
    'schedule generation - under 10s': (r) => duration < 10000,
  });

  if (!success) {
    errorRate.add(1);
    if (duration > 5000) {
      responseTimeThreshold.add(1);
    }
  }
}

function testScheduleRetrieval(baseUrl, headers) {
  const response = http.get(`${baseUrl}/api/schedules`, { headers });
  
  const success = check(response, {
    'schedule retrieval - status 200': (r) => r.status === 200,
    'schedule retrieval - has data': (r) => r.json() && Array.isArray(r.json()),
    'schedule retrieval - fast response': (r) => r.timings.duration < 1000,
  });

  if (!success) errorRate.add(1);
}

function testConstraintManagement(baseUrl, headers) {
  const response = http.get(`${baseUrl}/api/constraints`, { headers });
  
  const success = check(response, {
    'constraints - status 200': (r) => r.status === 200,
    'constraints - valid structure': (r) => r.json() && typeof r.json() === 'object',
  });

  if (!success) errorRate.add(1);
}

function testTeamManagement(baseUrl, headers) {
  const response = http.get(`${baseUrl}/api/teams`, { headers });
  
  const success = check(response, {
    'teams - status 200': (r) => r.status === 200,
    'teams - has teams': (r) => r.json() && Array.isArray(r.json()),
  });

  if (!success) errorRate.add(1);
}

function testAnalytics(baseUrl, headers) {
  const response = http.get(`${baseUrl}/api/analytics/performance`, { headers });
  
  const success = check(response, {
    'analytics - status 200': (r) => r.status === 200,
    'analytics - has metrics': (r) => r.json() && r.json().metrics,
  });

  if (!success) errorRate.add(1);
}

export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = (endTime - data.startTime) / 1000 / 60; // minutes
  
  console.log(`Soak test completed. Duration: ${totalDuration.toFixed(2)} minutes`);
  
  // Cleanup any test data
  http.post(`${data.baseUrl}/api/test/cleanup`, '{}', {
    headers: { 'Content-Type': 'application/json' }
  });
}