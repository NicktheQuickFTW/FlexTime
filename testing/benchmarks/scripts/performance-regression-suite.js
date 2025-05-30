import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics for regression detection
const regressionDetected = new Counter('performance_regressions_detected');
const baselineDeviation = new Trend('baseline_deviation_percentage');
const performanceScore = new Gauge('overall_performance_score');
const apiEndpointPerformance = new Trend('api_endpoint_performance_ms');
const throughputRegression = new Rate('throughput_regression_rate');

export const options = {
  scenarios: {
    benchmark_baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10m',
      gracefulRampDown: '30s',
    },
    benchmark_stress: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '5m', target: 50 },
        { duration: '10m', target: 50 },
        { duration: '5m', target: 10 },
      ],
      startTime: '12m',
    },
  },
  thresholds: {
    http_req_duration: [
      'p(50)<500',   // 50% of requests under 500ms
      'p(95)<2000',  // 95% of requests under 2s
      'p(99)<5000'   // 99% of requests under 5s
    ],
    http_req_failed: ['rate<0.01'], // Error rate under 1%
    performance_regressions_detected: ['count<3'], // Max 3 regressions acceptable
    baseline_deviation_percentage: ['p(95)<20'], // 95% within 20% of baseline
  },
  ext: {
    loadimpact: {
      projectID: process.env.K6_PROJECT_ID,
      name: 'Flextime Performance Regression Suite'
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';
const BASELINE_FILE = __ENV.BASELINE_FILE || './baselines/current/baseline.json';
const REGRESSION_THRESHOLD = parseFloat(__ENV.REGRESSION_THRESHOLD || '0.20'); // 20% degradation threshold
const ENVIRONMENT = __ENV.ENVIRONMENT || 'local';
const VERSION = __ENV.VERSION || 'development';

// Performance baselines (would typically be loaded from file)
const PERFORMANCE_BASELINES = {
  'health_check': { p50: 50, p95: 100, p99: 200, throughput: 1000 },
  'schedule_generation': { p50: 1200, p95: 3000, p99: 5000, throughput: 10 },
  'schedule_retrieval': { p50: 200, p95: 500, p99: 1000, throughput: 100 },
  'team_management': { p50: 150, p95: 400, p99: 800, throughput: 200 },
  'analytics_dashboard': { p50: 800, p95: 2000, p99: 4000, throughput: 50 },
  'bulk_operations': { p50: 2000, p95: 8000, p99: 15000, throughput: 5 },
};

// Current test measurements
const currentMeasurements = {};

export function setup() {
  console.log('=== Performance Regression Suite Setup ===');
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Version: ${VERSION}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Regression Threshold: ${REGRESSION_THRESHOLD * 100}%`);
  
  // Validate system health before benchmarking
  const healthResponse = http.get(`${BASE_URL}/health`);
  const healthy = check(healthResponse, {
    'pre-benchmark health check': (r) => r.status === 200,
    'pre-benchmark response time': (r) => r.timings.duration < 1000,
  });
  
  if (!healthy) {
    throw new Error('System not healthy for benchmarking. Aborting regression tests.');
  }
  
  // Initialize measurement tracking
  Object.keys(PERFORMANCE_BASELINES).forEach(endpoint => {
    currentMeasurements[endpoint] = {
      responseTimes: [],
      errorCount: 0,
      totalRequests: 0,
    };
  });
  
  return {
    baseUrl: BASE_URL,
    testId: `regression_test_${Date.now()}`,
    startTime: Date.now(),
    environment: ENVIRONMENT,
    version: VERSION
  };
}

export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-Test-ID': data.testId,
    'X-Benchmark-Test': 'true'
  };

  // Weighted endpoint testing based on typical usage patterns
  const endpointTests = [
    { weight: 30, fn: () => benchmarkHealthCheck(data, headers) },
    { weight: 20, fn: () => benchmarkScheduleRetrieval(data, headers) },
    { weight: 15, fn: () => benchmarkTeamManagement(data, headers) },
    { weight: 15, fn: () => benchmarkAnalyticsDashboard(data, headers) },
    { weight: 10, fn: () => benchmarkScheduleGeneration(data, headers) },
    { weight: 10, fn: () => benchmarkBulkOperations(data, headers) },
  ];

  // Select test based on weight distribution
  const randomValue = Math.random() * 100;
  let cumulativeWeight = 0;
  let selectedTest = endpointTests[0];

  for (const test of endpointTests) {
    cumulativeWeight += test.weight;
    if (randomValue <= cumulativeWeight) {
      selectedTest = test;
      break;
    }
  }

  selectedTest.fn();
  
  sleep(0.5 + Math.random() * 1); // Realistic think time
}

function benchmarkHealthCheck(data, headers) {
  const startTime = Date.now();
  
  const response = http.get(`${data.baseUrl}/health`, { headers });
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  recordMeasurement('health_check', responseTime, response.status >= 400);
  
  check(response, {
    'health check - status 200': (r) => r.status === 200,
    'health check - response time': (r) => r.timings.duration < PERFORMANCE_BASELINES.health_check.p95,
  });
  
  return response.status === 200;
}

function benchmarkScheduleGeneration(data, headers) {
  const startTime = Date.now();
  
  const payload = {
    sport: 'Football',
    season: '2025',
    teams: 16,
    constraints: {
      maxGamesPerWeek: 1,
      minRestDays: 6,
      homeAwayBalance: true
    },
    benchmarkTest: true
  };

  const response = http.post(
    `${data.baseUrl}/api/schedules/generate`,
    JSON.stringify(payload),
    { headers, timeout: '30s' }
  );
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  recordMeasurement('schedule_generation', responseTime, response.status >= 400);
  
  const success = check(response, {
    'schedule generation - success': (r) => r.status >= 200 && r.status < 300,
    'schedule generation - response time': (r) => r.timings.duration < PERFORMANCE_BASELINES.schedule_generation.p95,
    'schedule generation - has schedule': (r) => r.json() && r.json().schedule,
  });
  
  return success;
}

function benchmarkScheduleRetrieval(data, headers) {
  const startTime = Date.now();
  
  const response = http.get(
    `${data.baseUrl}/api/schedules?limit=50&include=stats`,
    { headers }
  );
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  recordMeasurement('schedule_retrieval', responseTime, response.status >= 400);
  
  check(response, {
    'schedule retrieval - status 200': (r) => r.status === 200,
    'schedule retrieval - response time': (r) => r.timings.duration < PERFORMANCE_BASELINES.schedule_retrieval.p95,
    'schedule retrieval - has data': (r) => r.json() && Array.isArray(r.json()),
  });
  
  return response.status === 200;
}

function benchmarkTeamManagement(data, headers) {
  const startTime = Date.now();
  
  const response = http.get(
    `${data.baseUrl}/api/teams?include=schedule,stats&limit=100`,
    { headers }
  );
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  recordMeasurement('team_management', responseTime, response.status >= 400);
  
  check(response, {
    'team management - status 200': (r) => r.status === 200,
    'team management - response time': (r) => r.timings.duration < PERFORMANCE_BASELINES.team_management.p95,
    'team management - has teams': (r) => r.json() && Array.isArray(r.json()),
  });
  
  return response.status === 200;
}

function benchmarkAnalyticsDashboard(data, headers) {
  const startTime = Date.now();
  
  const response = http.get(
    `${data.baseUrl}/api/analytics/dashboard?timeframe=30d&metrics=performance,efficiency,satisfaction`,
    { headers, timeout: '15s' }
  );
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  recordMeasurement('analytics_dashboard', responseTime, response.status >= 400);
  
  check(response, {
    'analytics dashboard - status 200': (r) => r.status === 200,
    'analytics dashboard - response time': (r) => r.timings.duration < PERFORMANCE_BASELINES.analytics_dashboard.p95,
    'analytics dashboard - has metrics': (r) => r.json() && r.json().metrics,
  });
  
  return response.status === 200;
}

function benchmarkBulkOperations(data, headers) {
  const startTime = Date.now();
  
  const payload = {
    operations: Array.from({ length: 10 }, (_, i) => ({
      type: 'schedule_validation',
      scheduleId: `benchmark_schedule_${i}`,
      options: { quick: true }
    })),
    batchSize: 5,
    benchmarkTest: true
  };

  const response = http.post(
    `${data.baseUrl}/api/bulk/operations`,
    JSON.stringify(payload),
    { headers, timeout: '45s' }
  );
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  recordMeasurement('bulk_operations', responseTime, response.status >= 400);
  
  check(response, {
    'bulk operations - success': (r) => r.status >= 200 && r.status < 300,
    'bulk operations - response time': (r) => r.timings.duration < PERFORMANCE_BASELINES.bulk_operations.p95,
    'bulk operations - processed': (r) => r.json() && r.json().processed,
  });
  
  return response.status >= 200 && response.status < 300;
}

function recordMeasurement(endpoint, responseTime, isError) {
  if (!currentMeasurements[endpoint]) {
    currentMeasurements[endpoint] = {
      responseTimes: [],
      errorCount: 0,
      totalRequests: 0,
    };
  }
  
  currentMeasurements[endpoint].responseTimes.push(responseTime);
  currentMeasurements[endpoint].totalRequests++;
  
  if (isError) {
    currentMeasurements[endpoint].errorCount++;
  }
  
  apiEndpointPerformance.add(responseTime, { endpoint: endpoint });
}

function calculatePercentile(values, percentile) {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function analyzeRegressions() {
  let totalScore = 0;
  let regressionCount = 0;
  const regressionDetails = [];
  
  Object.keys(PERFORMANCE_BASELINES).forEach(endpoint => {
    const baseline = PERFORMANCE_BASELINES[endpoint];
    const current = currentMeasurements[endpoint];
    
    if (!current || current.responseTimes.length === 0) {
      console.log(`⚠️ No measurements for endpoint: ${endpoint}`);
      return;
    }
    
    // Calculate current percentiles
    const currentP50 = calculatePercentile(current.responseTimes, 50);
    const currentP95 = calculatePercentile(current.responseTimes, 95);
    const currentP99 = calculatePercentile(current.responseTimes, 99);
    const currentThroughput = current.totalRequests / (10 * 60); // requests per second (10 minute test)
    const currentErrorRate = current.errorCount / current.totalRequests;
    
    // Calculate regression percentages
    const p50Regression = ((currentP50 - baseline.p50) / baseline.p50) * 100;
    const p95Regression = ((currentP95 - baseline.p95) / baseline.p95) * 100;
    const p99Regression = ((currentP99 - baseline.p99) / baseline.p99) * 100;
    const throughputRegression = ((baseline.throughput - currentThroughput) / baseline.throughput) * 100;
    
    // Record baseline deviations
    baselineDeviation.add(Math.abs(p95Regression), { endpoint: endpoint, metric: 'p95' });
    
    // Check for significant regressions
    let endpointRegressions = [];
    
    if (p50Regression > REGRESSION_THRESHOLD * 100) {
      endpointRegressions.push(`P50: ${p50Regression.toFixed(1)}% slower`);
    }
    if (p95Regression > REGRESSION_THRESHOLD * 100) {
      endpointRegressions.push(`P95: ${p95Regression.toFixed(1)}% slower`);
    }
    if (p99Regression > REGRESSION_THRESHOLD * 100) {
      endpointRegressions.push(`P99: ${p99Regression.toFixed(1)}% slower`);
    }
    if (throughputRegression > REGRESSION_THRESHOLD * 100) {
      endpointRegressions.push(`Throughput: ${throughputRegression.toFixed(1)}% lower`);
      throughputRegression.add(1);
    }
    if (currentErrorRate > 0.01) { // 1% error rate threshold
      endpointRegressions.push(`Error rate: ${(currentErrorRate * 100).toFixed(2)}%`);
    }
    
    if (endpointRegressions.length > 0) {
      regressionCount++;
      regressionDetected.add(1);
      regressionDetails.push({
        endpoint: endpoint,
        regressions: endpointRegressions,
        current: { p50: currentP50, p95: currentP95, p99: currentP99, throughput: currentThroughput },
        baseline: baseline
      });
      
      console.log(`🚨 REGRESSION DETECTED in ${endpoint}:`);
      endpointRegressions.forEach(regression => console.log(`   - ${regression}`));
    }
    
    // Calculate endpoint score (lower is better)
    const endpointScore = Math.max(
      Math.max(p50Regression, 0),
      Math.max(p95Regression, 0),
      Math.max(p99Regression, 0),
      Math.max(throughputRegression, 0)
    );
    
    totalScore += endpointScore;
    
    // Log endpoint performance summary
    console.log(`📊 ${endpoint} Performance:`);
    console.log(`   Current: P50=${currentP50}ms, P95=${currentP95}ms, P99=${currentP99}ms, Throughput=${currentThroughput.toFixed(1)}rps`);
    console.log(`   Baseline: P50=${baseline.p50}ms, P95=${baseline.p95}ms, P99=${baseline.p99}ms, Throughput=${baseline.throughput}rps`);
    console.log(`   Changes: P50=${p50Regression.toFixed(1)}%, P95=${p95Regression.toFixed(1)}%, P99=${p99Regression.toFixed(1)}%, Throughput=${throughputRegression.toFixed(1)}%`);
  });
  
  const averageScore = totalScore / Object.keys(PERFORMANCE_BASELINES).length;
  performanceScore.add(100 - Math.min(averageScore, 100)); // Score out of 100
  
  return {
    totalRegressions: regressionCount,
    averagePerformanceScore: 100 - Math.min(averageScore, 100),
    regressionDetails: regressionDetails
  };
}

export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = (endTime - data.startTime) / 1000;
  
  console.log('\n=== Performance Regression Analysis ===');
  console.log(`Test Duration: ${totalDuration.toFixed(2)} seconds`);
  console.log(`Environment: ${data.environment}`);
  console.log(`Version: ${data.version}`);
  
  const analysisResults = analyzeRegressions();
  
  console.log(`\n📈 Overall Performance Score: ${analysisResults.averagePerformanceScore.toFixed(1)}/100`);
  console.log(`🚨 Total Regressions Detected: ${analysisResults.totalRegressions}`);
  
  if (analysisResults.totalRegressions > 0) {
    console.log('\n🔍 Regression Details:');
    analysisResults.regressionDetails.forEach(detail => {
      console.log(`\n  ${detail.endpoint}:`);
      detail.regressions.forEach(regression => {
        console.log(`    ❌ ${regression}`);
      });
    });
    
    console.log('\n⚠️ PERFORMANCE REGRESSION DETECTED - REVIEW REQUIRED');
  } else {
    console.log('\n✅ No significant performance regressions detected');
  }
  
  // Generate regression report
  const regressionReport = {
    timestamp: new Date().toISOString(),
    environment: data.environment,
    version: data.version,
    testDuration: totalDuration,
    overallScore: analysisResults.averagePerformanceScore,
    regressionCount: analysisResults.totalRegressions,
    regressionThreshold: REGRESSION_THRESHOLD * 100,
    endpointResults: {},
    recommendations: generateRecommendations(analysisResults)
  };
  
  // Populate endpoint results
  Object.keys(currentMeasurements).forEach(endpoint => {
    const measurements = currentMeasurements[endpoint];
    if (measurements.responseTimes.length > 0) {
      regressionReport.endpointResults[endpoint] = {
        requests: measurements.totalRequests,
        errors: measurements.errorCount,
        errorRate: measurements.errorCount / measurements.totalRequests,
        p50: calculatePercentile(measurements.responseTimes, 50),
        p95: calculatePercentile(measurements.responseTimes, 95),
        p99: calculatePercentile(measurements.responseTimes, 99),
        baseline: PERFORMANCE_BASELINES[endpoint]
      };
    }
  });
  
  console.log('\n📄 Regression Report Generated');
  console.log(JSON.stringify(regressionReport, null, 2));
}

function generateRecommendations(analysisResults) {
  const recommendations = [];
  
  if (analysisResults.totalRegressions === 0) {
    recommendations.push('Performance is within acceptable thresholds');
    recommendations.push('Continue monitoring for any trends');
  } else {
    recommendations.push('Investigate performance regressions immediately');
    recommendations.push('Review recent code changes for performance impact');
    recommendations.push('Check system resource utilization');
    
    if (analysisResults.averagePerformanceScore < 70) {
      recommendations.push('Consider reverting recent changes');
      recommendations.push('Run detailed profiling on affected endpoints');
    }
    
    if (analysisResults.totalRegressions > 3) {
      recommendations.push('Systemic performance issue detected - halt deployment');
    }
  }
  
  return recommendations;
}

export function handleSummary(data) {
  const regressionSummary = {
    'regression-test-results.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
  
  return regressionSummary;
}