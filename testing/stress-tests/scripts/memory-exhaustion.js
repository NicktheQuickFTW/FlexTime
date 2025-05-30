import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// Custom metrics for memory exhaustion testing
const memoryUsageBytes = new Gauge('memory_usage_bytes');
const memoryLeakRate = new Trend('memory_leak_rate_mb_per_minute');
const garbageCollectionPressure = new Counter('gc_pressure_events');
const outOfMemoryErrors = new Counter('oom_errors');
const memoryAllocationFailures = new Rate('memory_allocation_failures');

export const options = {
  scenarios: {
    memory_stress_ramp: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '5m', target: 10 },   // Warm up
        { duration: '10m', target: 50 },  // Memory pressure build-up
        { duration: '15m', target: 100 }, // High memory usage
        { duration: '10m', target: 200 }, // Peak memory stress
        { duration: '5m', target: 0 },    // Memory release testing
      ],
      gracefulRampDown: '30s',
    },
    memory_leak_detection: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30m', // Long duration to detect leaks
      startTime: '45m', // Start after ramp test
    },
    large_payload_stress: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10m',
      startTime: '75m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000'], // Lenient for memory stress
    http_req_failed: ['rate<0.30'], // Allow higher failure rate
    memory_allocation_failures: ['rate<0.20'],
    oom_errors: ['count<5'], // Very few OOM errors acceptable
  },
  ext: {
    loadimpact: {
      projectID: process.env.K6_PROJECT_ID,
      name: 'Flextime Memory Exhaustion Test'
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';
const MEMORY_LIMIT_MB = parseInt(__ENV.MEMORY_LIMIT_MB || '2048'); // 2GB default limit
const LEAK_DETECTION_THRESHOLD = 50; // MB per minute

// Global state for memory tracking
let baselineMemoryUsage = 0;
let lastMemoryMeasurement = 0;
let memoryMeasurements = [];
let testStartTime = 0;

export function setup() {
  console.log('=== Memory Exhaustion Test Setup ===');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Memory limit: ${MEMORY_LIMIT_MB}MB`);
  console.log(`Leak detection threshold: ${LEAK_DETECTION_THRESHOLD}MB/min`);
  
  testStartTime = Date.now();
  
  // Get baseline memory usage
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.headers['X-Memory-Usage']) {
    baselineMemoryUsage = parseInt(healthResponse.headers['X-Memory-Usage']);
    console.log(`Baseline memory usage: ${(baselineMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
  }
  
  return {
    baseUrl: BASE_URL,
    testId: `memory_stress_${Date.now()}`,
    baselineMemory: baselineMemoryUsage,
    startTime: testStartTime
  };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-Test-ID': data.testId,
    'X-Memory-Test': 'true'
  };

  // Rotate through memory-intensive operations
  const scenario = Math.floor(Math.random() * 5);
  
  switch (scenario) {
    case 0:
      testLargeDatasetProcessing(data, headers);
      break;
    case 1:
      testMemoryIntensiveScheduleGeneration(data, headers);
      break;
    case 2:
      testBulkDataOperations(data, headers);
      break;
    case 3:
      testConcurrentAnalytics(data, headers);
      break;
    case 4:
      testCachingStress(data, headers);
      break;
  }

  // Monitor memory usage after each operation
  monitorMemoryUsage(data, headers);
  
  sleep(0.5 + Math.random() * 1); // Brief pause between memory-intensive operations
}

function testLargeDatasetProcessing(data, headers) {
  // Generate a large dataset that will consume significant memory
  const largePayload = {
    operation: 'bulk_schedule_analysis',
    datasets: generateLargeDataset(1000), // 1000 teams worth of data
    options: {
      includeDetailedAnalytics: true,
      includeProjections: true,
      includeComparisons: true,
      memoryOptimization: false, // Intentionally disable optimization
    },
    testId: data.testId
  };

  const response = http.post(
    `${data.baseUrl}/api/analytics/bulk-process`,
    JSON.stringify(largePayload),
    { 
      headers,
      timeout: '60s'
    }
  );

  const success = check(response, {
    'large dataset - not out of memory': (r) => r.status !== 507, // Insufficient Storage
    'large dataset - not internal error': (r) => r.status !== 500,
    'large dataset - processing attempted': (r) => r.status < 500 || r.status >= 600,
  });

  if (response.status === 507 || response.status === 500) {
    outOfMemoryErrors.add(1);
  }

  if (!success) {
    memoryAllocationFailures.add(1);
  }

  return success;
}

function testMemoryIntensiveScheduleGeneration(data, headers) {
  // Create a complex scheduling scenario that requires significant memory
  const complexPayload = {
    sport: 'Football',
    season: '2025',
    teams: 64, // Large number of teams
    games: 2000, // Many games
    constraints: generateComplexConstraints(100), // Many constraints
    optimizationSettings: {
      algorithmType: 'exhaustive_search', // Memory-intensive algorithm
      maxIterations: 50000,
      includeAllPermutations: true,
      cacheIntermediateResults: true, // Uses more memory
    },
    analytics: {
      includePathAnalysis: true,
      includePerformanceMetrics: true,
      includeProjections: true,
      memoryProfiling: true,
    }
  };

  const response = http.post(
    `${data.baseUrl}/api/schedules/generate-complex`,
    JSON.stringify(complexPayload),
    { 
      headers,
      timeout: '120s'
    }
  );

  return check(response, {
    'complex schedule - memory available': (r) => r.status !== 507,
    'complex schedule - not timeout': (r) => r.status !== 408,
    'complex schedule - processing started': (r) => r.status !== 503,
  });
}

function testBulkDataOperations(data, headers) {
  // Simulate bulk operations that accumulate memory usage
  const bulkOperations = Array.from({ length: 100 }, (_, i) => ({
    operation: 'schedule_validation',
    scheduleId: `memory_test_${i}`,
    data: generateLargeScheduleData(50), // 50 teams per schedule
    options: {
      validateAll: true,
      includeMetrics: true,
      cacheResults: true, // Memory accumulation
    }
  }));

  const payload = {
    operations: bulkOperations,
    batchProcessing: false, // Process all at once for memory stress
    memoryOptimization: false,
    testId: data.testId
  };

  const response = http.post(
    `${data.baseUrl}/api/bulk/operations`,
    JSON.stringify(payload),
    { 
      headers,
      timeout: '90s'
    }
  );

  return check(response, {
    'bulk operations - memory sufficient': (r) => r.status !== 507,
    'bulk operations - not server error': (r) => r.status < 500,
  });
}

function testConcurrentAnalytics(data, headers) {
  // Request multiple analytics reports that might not be cached
  const analyticsRequests = [
    'comprehensive-performance',
    'travel-optimization',
    'constraint-analysis',
    'predictive-modeling',
    'resource-utilization'
  ];

  const promises = analyticsRequests.map(type => {
    const payload = {
      analysisType: type,
      timeframe: 'all_seasons',
      includeRawData: true,
      includeProjections: true,
      granularity: 'maximum',
      testId: data.testId
    };

    return http.post(
      `${data.baseUrl}/api/analytics/${type}`,
      JSON.stringify(payload),
      { headers, timeout: '60s' }
    );
  });

  // Note: K6 doesn't support Promise.all, so we simulate concurrent requests
  let allSuccessful = true;
  promises.forEach(response => {
    const success = check(response, {
      'concurrent analytics - memory available': (r) => r.status !== 507,
      'concurrent analytics - not overloaded': (r) => r.status !== 503,
    });
    if (!success) allSuccessful = false;
  });

  return allSuccessful;
}

function testCachingStress(data, headers) {
  // Stress test caching mechanisms by requesting unique data
  const uniqueRequests = Array.from({ length: 50 }, (_, i) => {
    const uniqueParams = new URLSearchParams({
      season: `${2020 + i % 10}`,
      sport: ['Football', 'Basketball', 'Baseball'][i % 3],
      analysis_id: `cache_stress_${i}_${Date.now()}`,
      include_projections: 'true',
      cache_bypass: 'true' // Force cache misses
    });

    return http.get(
      `${data.baseUrl}/api/analytics/cached-analysis?${uniqueParams}`,
      { headers, timeout: '30s' }
    );
  });

  let cacheStressSuccess = true;
  requests.forEach(response => {
    const success = check(response, {
      'cache stress - memory for new entries': (r) => r.status !== 507,
      'cache stress - cache functioning': (r) => r.status !== 503,
    });
    if (!success) cacheStressSuccess = false;
  });

  return cacheStressSuccess;
}

function monitorMemoryUsage(data, headers) {
  // Request current memory usage from the system
  const monitoringResponse = http.get(
    `${data.baseUrl}/api/system/memory-status`,
    { headers, timeout: '5s' }
  );

  if (monitoringResponse.status === 200) {
    try {
      const memoryData = JSON.parse(monitoringResponse.body);
      const currentMemoryBytes = memoryData.used || 0;
      const currentMemoryMB = currentMemoryBytes / 1024 / 1024;
      
      memoryUsageBytes.add(currentMemoryBytes);
      
      // Track memory measurements for leak detection
      const now = Date.now();
      memoryMeasurements.push({
        timestamp: now,
        memoryMB: currentMemoryMB
      });
      
      // Keep only last 30 measurements
      if (memoryMeasurements.length > 30) {
        memoryMeasurements.shift();
      }
      
      // Calculate memory leak rate if we have enough data points
      if (memoryMeasurements.length >= 10) {
        const oldestMeasurement = memoryMeasurements[0];
        const newestMeasurement = memoryMeasurements[memoryMeasurements.length - 1];
        const timeElapsedMinutes = (newestMeasurement.timestamp - oldestMeasurement.timestamp) / 1000 / 60;
        const memoryChangeRateMB = (newestMeasurement.memoryMB - oldestMeasurement.memoryMB) / timeElapsedMinutes;
        
        memoryLeakRate.add(memoryChangeRateMB);
        
        // Check for potential memory leak
        if (memoryChangeRateMB > LEAK_DETECTION_THRESHOLD) {
          console.log(`⚠️ Potential memory leak detected: ${memoryChangeRateMB.toFixed(2)}MB/min`);
        }
      }
      
      // Check for GC pressure indicators
      if (memoryData.gcPressure) {
        garbageCollectionPressure.add(1);
      }
      
      // Check memory limit
      if (currentMemoryMB > MEMORY_LIMIT_MB) {
        console.log(`🚨 Memory limit exceeded: ${currentMemoryMB.toFixed(2)}MB > ${MEMORY_LIMIT_MB}MB`);
        outOfMemoryErrors.add(1);
      }
      
      lastMemoryMeasurement = currentMemoryMB;
      
    } catch (error) {
      console.error(`Error parsing memory data: ${error.message}`);
    }
  }
}

// Helper functions for generating large test data
function generateLargeDataset(teamCount) {
  return Array.from({ length: teamCount }, (_, i) => ({
    teamId: `memory_test_team_${i}`,
    schedule: generateLargeScheduleData(20), // 20 games per team
    analytics: generateAnalyticsData(),
    projections: generateProjectionData(),
    historicalData: generateHistoricalData(5), // 5 years of history
  }));
}

function generateLargeScheduleData(gameCount) {
  return Array.from({ length: gameCount }, (_, i) => ({
    gameId: `game_${i}`,
    homeTeam: `team_${Math.floor(Math.random() * 100)}`,
    awayTeam: `team_${Math.floor(Math.random() * 100)}`,
    date: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    venue: `venue_${Math.floor(Math.random() * 50)}`,
    constraints: generateComplexConstraints(10),
    metadata: {
      weatherForecast: generateWeatherData(),
      attendanceProjection: Math.floor(Math.random() * 80000),
      broadcastInfo: generateBroadcastData(),
      travelInfo: generateTravelData(),
    }
  }));
}

function generateComplexConstraints(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `constraint_${i}`,
    type: ['scheduling', 'travel', 'venue', 'broadcast', 'weather'][i % 5],
    priority: Math.floor(Math.random() * 10) + 1,
    conditions: {
      dateRange: {
        start: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`,
        end: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-28`
      },
      teams: [`team_${Math.floor(Math.random() * 100)}`, `team_${Math.floor(Math.random() * 100)}`],
      venues: [`venue_${Math.floor(Math.random() * 50)}`],
      requirements: {
        minGap: Math.floor(Math.random() * 7) + 1,
        maxConsecutive: Math.floor(Math.random() * 3) + 1,
        preferredTime: `${Math.floor(Math.random() * 24)}:00`,
      }
    },
    metadata: generateConstraintMetadata()
  }));
}

function generateAnalyticsData() {
  return {
    performance: Array.from({ length: 50 }, () => Math.random()),
    efficiency: Array.from({ length: 50 }, () => Math.random()),
    satisfaction: Array.from({ length: 50 }, () => Math.random()),
    metrics: generateMetricsData(100),
  };
}

function generateProjectionData() {
  return {
    nextSeason: generateLargeScheduleData(30),
    performancePredictions: Array.from({ length: 100 }, () => Math.random()),
    travelEstimates: Array.from({ length: 100 }, () => Math.random() * 1000),
    revenueProjections: Array.from({ length: 100 }, () => Math.random() * 1000000),
  };
}

function generateHistoricalData(years) {
  return Array.from({ length: years }, (_, year) => ({
    year: 2020 + year,
    schedules: generateLargeScheduleData(100),
    analytics: generateAnalyticsData(),
    performance: generatePerformanceData(),
  }));
}

function generateWeatherData() {
  return {
    temperature: Math.floor(Math.random() * 40) + 20,
    humidity: Math.floor(Math.random() * 100),
    precipitation: Math.random(),
    windSpeed: Math.floor(Math.random() * 30),
    conditions: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
    forecast: Array.from({ length: 7 }, () => ({
      day: Math.floor(Math.random() * 7),
      high: Math.floor(Math.random() * 40) + 20,
      low: Math.floor(Math.random() * 40) + 10,
      conditions: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)]
    }))
  };
}

function generateBroadcastData() {
  return {
    network: `Network${Math.floor(Math.random() * 10)}`,
    timeSlot: `${Math.floor(Math.random() * 24)}:00`,
    rating: Math.random() * 10,
    viewership: Math.floor(Math.random() * 10000000),
    revenue: Math.floor(Math.random() * 1000000),
  };
}

function generateTravelData() {
  return {
    distance: Math.floor(Math.random() * 2000),
    duration: Math.floor(Math.random() * 480), // minutes
    cost: Math.floor(Math.random() * 50000),
    method: ['flight', 'bus', 'train'][Math.floor(Math.random() * 3)],
    routes: Array.from({ length: 5 }, () => ({
      option: Math.floor(Math.random() * 5),
      duration: Math.floor(Math.random() * 480),
      cost: Math.floor(Math.random() * 50000)
    }))
  };
}

function generateConstraintMetadata() {
  return {
    source: 'memory_stress_test',
    created: new Date().toISOString(),
    importance: Math.floor(Math.random() * 10) + 1,
    flexibility: Math.random(),
    cost: Math.floor(Math.random() * 10000),
    stakeholders: Array.from({ length: 5 }, (_, i) => `stakeholder_${i}`),
    history: Array.from({ length: 10 }, () => ({
      timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      change: `change_${Math.floor(Math.random() * 100)}`,
      reason: `reason_${Math.floor(Math.random() * 50)}`
    }))
  };
}

function generateMetricsData(count) {
  return Array.from({ length: count }, (_, i) => ({
    metricId: `metric_${i}`,
    value: Math.random() * 100,
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    unit: ['percentage', 'count', 'duration', 'distance'][Math.floor(Math.random() * 4)],
    category: ['performance', 'efficiency', 'satisfaction'][Math.floor(Math.random() * 3)]
  }));
}

function generatePerformanceData() {
  return {
    wins: Math.floor(Math.random() * 20),
    losses: Math.floor(Math.random() * 20),
    efficiency: Math.random(),
    attendance: Array.from({ length: 20 }, () => Math.floor(Math.random() * 80000)),
    revenue: Array.from({ length: 20 }, () => Math.floor(Math.random() * 1000000)),
    metrics: generateMetricsData(50)
  };
}

export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = (endTime - data.startTime) / 1000 / 60; // minutes
  
  console.log('\n=== Memory Exhaustion Test Results ===');
  console.log(`Total test duration: ${totalDuration.toFixed(2)} minutes`);
  console.log(`Baseline memory: ${(data.baselineMemory / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Final memory: ${lastMemoryMeasurement.toFixed(2)}MB`);
  
  const memoryIncrease = lastMemoryMeasurement - (data.baselineMemory / 1024 / 1024);
  console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);
  
  if (memoryIncrease > 0) {
    const increaseRate = memoryIncrease / totalDuration;
    console.log(`Memory increase rate: ${increaseRate.toFixed(2)}MB/min`);
    
    if (increaseRate > LEAK_DETECTION_THRESHOLD) {
      console.log('🚨 POTENTIAL MEMORY LEAK DETECTED');
    } else {
      console.log('✅ No significant memory leak detected');
    }
  }
  
  // Trigger garbage collection test
  console.log('\n--- Testing Garbage Collection Recovery ---');
  const gcResponse = http.post(`${data.baseUrl}/api/system/gc-trigger`, '{}', {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s'
  });
  
  if (gcResponse.status === 200) {
    console.log('✅ Garbage collection triggered successfully');
  } else {
    console.log('⚠️ Could not trigger garbage collection');
  }
}