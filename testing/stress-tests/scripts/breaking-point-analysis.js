import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics for breaking point analysis
const systemBreakingPoint = new Gauge('system_breaking_point_vus');
const errorThresholdBreached = new Counter('error_threshold_breaches');
const responseTimeDegradation = new Trend('response_time_degradation');
const resourceExhaustion = new Rate('resource_exhaustion_rate');
const systemRecoveryTime = new Trend('system_recovery_time');

export const options = {
  scenarios: {
    breaking_point_discovery: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 1000,
      stages: [
        { target: 50, duration: '2m' },    // Gradual increase
        { target: 100, duration: '3m' },   // Medium load
        { target: 200, duration: '3m' },   // High load
        { target: 400, duration: '3m' },   // Very high load
        { target: 800, duration: '2m' },   // Extreme load
        { target: 1200, duration: '2m' },  // Breaking point search
        { target: 0, duration: '2m' },     // Recovery testing
      ],
    },
    circuit_breaker_test: {
      executor: 'constant-arrival-rate',
      rate: 1000, // High constant rate to trigger circuit breakers
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 100,
      maxVUs: 200,
      startTime: '15m', // Run after main breaking point test
    },
  },
  thresholds: {
    http_req_duration: [
      'p(95)<5000', // Lenient threshold for stress testing
      'p(99)<10000'
    ],
    http_req_failed: ['rate<0.50'], // Allow higher error rates during stress
    error_threshold_breaches: ['count<10'], // Limited threshold breaches
    resource_exhaustion_rate: ['rate<0.80'], // Resource exhaustion detection
  },
  ext: {
    loadimpact: {
      projectID: process.env.K6_PROJECT_ID,
      name: 'Flextime Breaking Point Analysis'
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';
const BREAKING_POINT_ERROR_THRESHOLD = parseFloat(__ENV.ERROR_THRESHOLD || '0.20'); // 20% error rate
const RESPONSE_TIME_THRESHOLD = parseInt(__ENV.RESPONSE_TIME_THRESHOLD || '5000'); // 5 seconds

// System state tracking
let currentVUs = 0;
let consecutiveErrorRateBreaches = 0;
let breakingPointDetected = false;
let breakingPointVUs = 0;
let systemHealthy = true;

export function setup() {
  console.log('=== Breaking Point Analysis Setup ===');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Error threshold: ${BREAKING_POINT_ERROR_THRESHOLD * 100}%`);
  console.log(`Response time threshold: ${RESPONSE_TIME_THRESHOLD}ms`);
  
  // Validate system health before stress testing
  const healthCheck = http.get(`${BASE_URL}/health`);
  const healthy = check(healthCheck, {
    'pre-stress health check': (r) => r.status === 200,
    'pre-stress response time': (r) => r.timings.duration < 1000,
  });
  
  if (!healthy) {
    throw new Error('System not healthy before stress testing. Aborting.');
  }
  
  return {
    baseUrl: BASE_URL,
    startTime: Date.now(),
    testId: `stress_test_${Date.now()}`
  };
}

export default function(data) {
  currentVUs = __VU;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-Test-ID': data.testId,
    'X-Stress-Test': 'true'
  };

  // Weighted test scenarios simulating real usage under stress
  const testScenarios = [
    { weight: 40, fn: () => stressScheduleGeneration(data, headers) },
    { weight: 25, fn: () => stressDataRetrieval(data, headers) },
    { weight: 15, fn: () => stressConcurrentUpdates(data, headers) },
    { weight: 10, fn: () => stressAnalytics(data, headers) },
    { weight: 10, fn: () => stressSystemResources(data, headers) },
  ];

  // Select scenario based on weight
  const randomValue = Math.random() * 100;
  let cumulativeWeight = 0;
  let selectedScenario = testScenarios[0];

  for (const scenario of testScenarios) {
    cumulativeWeight += scenario.weight;
    if (randomValue <= cumulativeWeight) {
      selectedScenario = scenario;
      break;
    }
  }

  // Execute selected scenario with error tracking
  const startTime = Date.now();
  let success = false;
  
  try {
    success = selectedScenario.fn();
  } catch (error) {
    console.error(`Scenario execution failed: ${error.message}`);
    success = false;
  }
  
  const executionTime = Date.now() - startTime;
  
  // Track response time degradation
  responseTimeDegradation.add(executionTime);
  
  // Check for breaking point indicators
  if (!success || executionTime > RESPONSE_TIME_THRESHOLD) {
    consecutiveErrorRateBreaches++;
    errorThresholdBreached.add(1);
    
    // Detect breaking point
    if (consecutiveErrorRateBreaches >= 5 && !breakingPointDetected) {
      breakingPointDetected = true;
      breakingPointVUs = currentVUs;
      systemBreakingPoint.add(currentVUs);
      console.log(`🚨 BREAKING POINT DETECTED at ${currentVUs} VUs`);
    }
  } else {
    consecutiveErrorRateBreaches = Math.max(0, consecutiveErrorRateBreaches - 1);
  }
  
  // Resource exhaustion detection
  if (executionTime > RESPONSE_TIME_THRESHOLD * 2) {
    resourceExhaustion.add(1);
  }

  // Minimal sleep to maintain high stress
  sleep(0.1 + Math.random() * 0.2);
}

function stressScheduleGeneration(data, headers) {
  const complexPayload = {
    sport: 'Football',
    season: '2025',
    teams: 16 + Math.floor(Math.random() * 16), // Variable complexity
    constraints: {
      maxGamesPerWeek: 1,
      minRestDays: 6,
      homeAwayBalance: true,
      regionalConstraints: true,
      broadcastWindows: generateBroadcastWindows(),
      rivalryGames: generateRivalryConstraints(),
      venueAvailability: generateVenueConstraints(),
    },
    optimizationLevel: 'maximum',
    includeAnalytics: true,
    parallelProcessing: true,
  };

  const response = http.post(
    `${data.baseUrl}/api/schedules/generate`,
    JSON.stringify(complexPayload),
    { 
      headers,
      timeout: '30s' // Shorter timeout for stress testing
    }
  );

  return check(response, {
    'schedule generation - not server error': (r) => r.status < 500,
    'schedule generation - reasonable response time': (r) => r.timings.duration < 15000,
  });
}

function stressDataRetrieval(data, headers) {
  // Complex query that stress tests database
  const queryParams = new URLSearchParams({
    season: '2025',
    limit: '1000',
    includeStats: 'true',
    includeAnalytics: 'true',
    includeProjections: 'true',
    sortBy: 'performance',
    filters: JSON.stringify({
      sports: ['Football', 'Basketball', 'Baseball'],
      regions: ['Southwest', 'Central', 'Mountain'],
      metrics: ['efficiency', 'travel', 'balance']
    })
  });

  const response = http.get(
    `${data.baseUrl}/api/schedules/comprehensive?${queryParams}`,
    { headers, timeout: '20s' }
  );

  return check(response, {
    'data retrieval - not server error': (r) => r.status < 500,
    'data retrieval - has content': (r) => r.body.length > 0,
  });
}

function stressConcurrentUpdates(data, headers) {
  // Simulate concurrent updates that might cause conflicts
  const updatePayload = {
    scheduleId: `test_schedule_${Math.floor(Math.random() * 100)}`,
    updates: [
      {
        gameId: `game_${Math.floor(Math.random() * 1000)}`,
        newDate: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        newVenue: `venue_${Math.floor(Math.random() * 50)}`,
        reason: 'stress_test_concurrent_update'
      }
    ],
    optimizeAfterUpdate: true,
    validateConstraints: true,
  };

  const response = http.patch(
    `${data.baseUrl}/api/schedules/bulk-update`,
    JSON.stringify(updatePayload),
    { headers, timeout: '15s' }
  );

  return check(response, {
    'concurrent update - not server error': (r) => r.status < 500,
    'concurrent update - not deadlock': (r) => r.status !== 423, // Locked
  });
}

function stressAnalytics(data, headers) {
  const analyticsPayload = {
    analysisType: 'real_time_comprehensive',
    timeframe: 'all',
    metrics: [
      'performance_optimization',
      'travel_efficiency',
      'constraint_satisfaction',
      'resource_utilization',
      'predictive_modeling'
    ],
    includeProjections: true,
    includeComparisons: true,
    granularity: 'detailed',
  };

  const response = http.post(
    `${data.baseUrl}/api/analytics/comprehensive`,
    JSON.stringify(analyticsPayload),
    { headers, timeout: '25s' }
  );

  return check(response, {
    'analytics - not server error': (r) => r.status < 500,
    'analytics - processing completed': (r) => r.status !== 202, // Not still processing
  });
}

function stressSystemResources(data, headers) {
  // Test that creates resource pressure
  const resourcePayload = {
    operation: 'stress_test_bulk_operation',
    batchSize: 500,
    operations: Array.from({ length: 100 }, (_, i) => ({
      type: 'schedule_validation',
      data: {
        scheduleId: `stress_schedule_${i}`,
        validateAll: true,
        includeProjections: true,
      }
    })),
    parallel: true,
    timeoutMs: 20000,
  };

  const response = http.post(
    `${data.baseUrl}/api/system/bulk-operations`,
    JSON.stringify(resourcePayload),
    { headers, timeout: '25s' }
  );

  return check(response, {
    'resource stress - not server error': (r) => r.status < 500,
    'resource stress - not timeout': (r) => r.status !== 408,
    'resource stress - not service unavailable': (r) => r.status !== 503,
  });
}

// Helper functions for generating complex test data
function generateBroadcastWindows() {
  return Array.from({ length: 5 }, (_, i) => ({
    network: `Network${i + 1}`,
    preferredTimeSlots: [
      { dayOfWeek: 6, startHour: 12, endHour: 18 },
      { dayOfWeek: 0, startHour: 13, endHour: 17 }
    ],
    blackoutDates: [
      '2025-11-27', '2025-12-24', '2025-12-31'
    ],
    priority: Math.floor(Math.random() * 10) + 1
  }));
}

function generateRivalryConstraints() {
  return Array.from({ length: 8 }, (_, i) => ({
    team1: `team_${i * 2}`,
    team2: `team_${i * 2 + 1}`,
    preferredWeek: Math.floor(Math.random() * 12) + 1,
    mustBeHomeGame: Math.random() > 0.5,
    importance: Math.floor(Math.random() * 5) + 1
  }));
}

function generateVenueConstraints() {
  return Array.from({ length: 20 }, (_, i) => ({
    venueId: `venue_${i}`,
    unavailableDates: Array.from({ length: 10 }, () => 
      `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    ),
    capacity: 20000 + Math.floor(Math.random() * 80000),
    surfaceType: Math.random() > 0.5 ? 'natural' : 'artificial'
  }));
}

export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = (endTime - data.startTime) / 1000;
  
  console.log('\n=== Breaking Point Analysis Results ===');
  console.log(`Total test duration: ${totalDuration.toFixed(2)} seconds`);
  console.log(`Breaking point detected: ${breakingPointDetected}`);
  
  if (breakingPointDetected) {
    console.log(`Breaking point VUs: ${breakingPointVUs}`);
    console.log(`🎯 System can handle approximately ${breakingPointVUs - 10} concurrent users safely`);
  } else {
    console.log(`✅ System handled maximum load of ${currentVUs} VUs without breaking`);
  }
  
  // Test system recovery
  console.log('\n--- Testing System Recovery ---');
  const recoveryStartTime = Date.now();
  
  // Wait a moment for system to recover
  sleep(5);
  
  // Test basic functionality recovery
  const recoveryResponse = http.get(`${data.baseUrl}/health`);
  const recovered = check(recoveryResponse, {
    'system recovery - health check': (r) => r.status === 200,
    'system recovery - response time': (r) => r.timings.duration < 2000,
  });
  
  const recoveryTime = Date.now() - recoveryStartTime;
  systemRecoveryTime.add(recoveryTime);
  
  if (recovered) {
    console.log(`✅ System recovered in ${recoveryTime}ms`);
  } else {
    console.log(`❌ System failed to recover properly`);
  }
  
  // Generate capacity planning recommendations
  generateCapacityPlanningReport(data);
}

function generateCapacityPlanningReport(data) {
  const report = {
    timestamp: new Date().toISOString(),
    testConfiguration: {
      baseUrl: data.baseUrl,
      testId: data.testId,
      maxVUsReached: currentVUs,
      breakingPointDetected: breakingPointDetected,
      breakingPointVUs: breakingPointVUs,
    },
    recommendations: {
      safeOperatingCapacity: breakingPointDetected ? Math.floor(breakingPointVUs * 0.7) : Math.floor(currentVUs * 0.8),
      emergencyCapacity: breakingPointDetected ? Math.floor(breakingPointVUs * 0.9) : currentVUs,
      recommendedScaling: breakingPointDetected ? 'Immediate attention required' : 'Current capacity adequate',
    },
    nextSteps: [
      'Review resource utilization metrics',
      'Identify bottleneck components',
      'Plan horizontal scaling if needed',
      'Implement circuit breakers for critical paths',
      'Set up monitoring alerts at 70% of breaking point',
    ]
  };
  
  console.log('\n=== Capacity Planning Report ===');
  console.log(JSON.stringify(report, null, 2));
}

export function handleSummary(data) {
  return {
    'stress-test-summary.html': htmlReport(data),
    'breaking-point-analysis.json': JSON.stringify(data, null, 2),
  };
}