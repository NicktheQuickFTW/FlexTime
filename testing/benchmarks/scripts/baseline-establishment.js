import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics for baseline establishment
const baselineMetrics = new Trend('baseline_metrics');
const endpointStability = new Rate('endpoint_stability');
const performanceVariance = new Trend('performance_variance');
const baselineConfidence = new Gauge('baseline_confidence_score');

export const options = {
  scenarios: {
    warm_up: {
      executor: 'constant-vus',
      vus: 5,
      duration: '5m',
    },
    baseline_measurement: {
      executor: 'constant-vus',
      vus: 10,
      duration: '20m',
      startTime: '5m',
    },
    stability_validation: {
      executor: 'constant-vus',
      vus: 15,
      duration: '10m',
      startTime: '25m',
    },
    final_verification: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      startTime: '35m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Lenient threshold for baseline
    http_req_failed: ['rate<0.01'], // Very low error rate for baseline
    endpoint_stability: ['rate>0.95'], // 95% stability required
    performance_variance: ['p(95)<30'], // 95% of measurements within 30% variance
  },
  ext: {
    loadimpact: {
      projectID: process.env.K6_PROJECT_ID,
      name: 'Flextime Baseline Establishment'
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';
const ENVIRONMENT = __ENV.ENVIRONMENT || 'local';
const VERSION = __ENV.VERSION || 'development';
const WARMUP_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Endpoint configurations for baseline measurement
const BASELINE_ENDPOINTS = {
  'health_check': {
    method: 'GET',
    url: '/health',
    weight: 10,
    expectedResponseTime: 100,
    payload: null
  },
  'schedule_generation_simple': {
    method: 'POST',
    url: '/api/schedules/generate',
    weight: 15,
    expectedResponseTime: 2000,
    payload: {
      sport: 'Football',
      season: '2025',
      teams: 8,
      constraints: {
        maxGamesPerWeek: 1,
        minRestDays: 6,
        homeAwayBalance: true
      }
    }
  },
  'schedule_generation_complex': {
    method: 'POST',
    url: '/api/schedules/generate',
    weight: 10,
    expectedResponseTime: 5000,
    payload: {
      sport: 'Football',
      season: '2025',
      teams: 16,
      constraints: {
        maxGamesPerWeek: 1,
        minRestDays: 6,
        homeAwayBalance: true,
        regionalConstraints: true,
        rivalryGames: true
      }
    }
  },
  'schedule_retrieval': {
    method: 'GET',
    url: '/api/schedules?limit=50',
    weight: 20,
    expectedResponseTime: 500,
    payload: null
  },
  'schedule_detailed_retrieval': {
    method: 'GET',
    url: '/api/schedules?limit=10&include=stats,analytics',
    weight: 15,
    expectedResponseTime: 1000,
    payload: null
  },
  'team_list': {
    method: 'GET',
    url: '/api/teams?limit=100',
    weight: 15,
    expectedResponseTime: 300,
    payload: null
  },
  'team_detailed': {
    method: 'GET',
    url: '/api/teams?limit=50&include=schedule,stats',
    weight: 10,
    expectedResponseTime: 800,
    payload: null
  },
  'analytics_simple': {
    method: 'GET',
    url: '/api/analytics/dashboard?timeframe=7d',
    weight: 10,
    expectedResponseTime: 1500,
    payload: null
  },
  'analytics_complex': {
    method: 'GET',
    url: '/api/analytics/dashboard?timeframe=30d&metrics=performance,efficiency,satisfaction,travel',
    weight: 5,
    expectedResponseTime: 3000,
    payload: null
  }
};

// Data collection for baseline establishment
const baselineData = {};
let testStartTime = 0;
let isWarmupPhase = true;

export function setup() {
  console.log('=== Baseline Establishment Setup ===');
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Version: ${VERSION}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total test duration: 40 minutes (5m warmup + 35m measurement)`);
  
  // Validate system is ready for baseline establishment
  const healthResponse = http.get(`${BASE_URL}/health`);
  const systemReady = check(healthResponse, {
    'system health check': (r) => r.status === 200,
    'system responsive': (r) => r.timings.duration < 2000,
  });
  
  if (!systemReady) {
    throw new Error('System not ready for baseline establishment. Ensure clean, stable environment.');
  }
  
  // Initialize data collection structures
  Object.keys(BASELINE_ENDPOINTS).forEach(endpoint => {
    baselineData[endpoint] = {
      measurements: [],
      errors: 0,
      totalRequests: 0,
      isStable: true,
      variance: 0
    };
  });
  
  testStartTime = Date.now();
  
  console.log('✅ System validated and ready for baseline establishment');
  
  return {
    baseUrl: BASE_URL,
    testId: `baseline_${ENVIRONMENT}_${VERSION}_${Date.now()}`,
    startTime: testStartTime,
    environment: ENVIRONMENT,
    version: VERSION
  };
}

export default function(data) {
  const currentTime = Date.now();
  isWarmupPhase = (currentTime - data.startTime) < WARMUP_DURATION;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-Test-ID': data.testId,
    'X-Baseline-Test': 'true',
    'X-Phase': isWarmupPhase ? 'warmup' : 'measurement'
  };

  // Select endpoint based on weight distribution
  const endpointName = selectEndpointByWeight();
  const endpoint = BASELINE_ENDPOINTS[endpointName];
  
  // Execute request and measure performance
  const measurementResult = executeEndpointMeasurement(data.baseUrl, endpointName, endpoint, headers);
  
  // Record measurement only after warmup phase
  if (!isWarmupPhase) {
    recordBaselineMeasurement(endpointName, measurementResult);
  }
  
  // Realistic user think time
  sleep(1 + Math.random() * 2);
}

function selectEndpointByWeight() {
  const totalWeight = Object.values(BASELINE_ENDPOINTS).reduce((sum, endpoint) => sum + endpoint.weight, 0);
  const randomValue = Math.random() * totalWeight;
  
  let cumulativeWeight = 0;
  for (const [name, endpoint] of Object.entries(BASELINE_ENDPOINTS)) {
    cumulativeWeight += endpoint.weight;
    if (randomValue <= cumulativeWeight) {
      return name;
    }
  }
  
  return Object.keys(BASELINE_ENDPOINTS)[0]; // Fallback
}

function executeEndpointMeasurement(baseUrl, endpointName, endpoint, headers) {
  const startTime = Date.now();
  let response;
  let success = false;
  
  try {
    if (endpoint.method === 'GET') {
      response = http.get(`${baseUrl}${endpoint.url}`, { headers });
    } else if (endpoint.method === 'POST') {
      response = http.post(
        `${baseUrl}${endpoint.url}`,
        JSON.stringify(endpoint.payload),
        { headers }
      );
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    success = check(response, {
      [`${endpointName} - successful response`]: (r) => r.status >= 200 && r.status < 400,
      [`${endpointName} - reasonable response time`]: (r) => r.timings.duration < endpoint.expectedResponseTime * 3,
    });
    
    // Check endpoint-specific validations
    if (endpointName.includes('schedule_generation')) {
      check(response, {
        [`${endpointName} - has schedule data`]: (r) => r.json() && (r.json().schedule || r.json().scheduleId),
      });
    } else if (endpointName.includes('retrieval') || endpointName.includes('list')) {
      check(response, {
        [`${endpointName} - has data array`]: (r) => r.json() && Array.isArray(r.json()),
      });
    } else if (endpointName.includes('analytics')) {
      check(response, {
        [`${endpointName} - has metrics`]: (r) => r.json() && (r.json().metrics || r.json().data),
      });
    }
    
    return {
      responseTime: responseTime,
      httpStatus: response.status,
      success: success,
      bodySize: response.body ? response.body.length : 0,
      timings: response.timings
    };
    
  } catch (error) {
    console.error(`Error executing ${endpointName}: ${error.message}`);
    return {
      responseTime: Date.now() - startTime,
      httpStatus: 0,
      success: false,
      bodySize: 0,
      timings: null,
      error: error.message
    };
  }
}

function recordBaselineMeasurement(endpointName, measurementResult) {
  if (!baselineData[endpointName]) {
    baselineData[endpointName] = {
      measurements: [],
      errors: 0,
      totalRequests: 0,
      isStable: true,
      variance: 0
    };
  }
  
  const data = baselineData[endpointName];
  data.totalRequests++;
  
  if (measurementResult.success) {
    data.measurements.push(measurementResult.responseTime);
    baselineMetrics.add(measurementResult.responseTime, { endpoint: endpointName });
    
    // Calculate stability and variance
    if (data.measurements.length >= 10) {
      const recent10 = data.measurements.slice(-10);
      const mean = recent10.reduce((sum, val) => sum + val, 0) / recent10.length;
      const variance = recent10.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent10.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = (standardDeviation / mean) * 100;
      
      data.variance = coefficientOfVariation;
      performanceVariance.add(coefficientOfVariation, { endpoint: endpointName });
      
      // Endpoint is stable if coefficient of variation is less than 30%
      data.isStable = coefficientOfVariation < 30;
      endpointStability.add(data.isStable ? 1 : 0, { endpoint: endpointName });
    }
  } else {
    data.errors++;
  }
}

function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function generateBaselineReport(data) {
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      environment: data.environment,
      version: data.version,
      testDuration: (Date.now() - data.startTime) / 1000,
      testId: data.testId
    },
    baseline: {},
    summary: {
      totalEndpoints: 0,
      stableEndpoints: 0,
      averageVariance: 0,
      confidenceScore: 0,
      recommendations: []
    }
  };
  
  let totalVariance = 0;
  let stableCount = 0;
  let endpointCount = 0;
  
  Object.keys(baselineData).forEach(endpointName => {
    const data = baselineData[endpointName];
    
    if (data.measurements.length < 10) {
      console.log(`⚠️ Insufficient data for ${endpointName}: ${data.measurements.length} measurements`);
      return;
    }
    
    endpointCount++;
    
    const measurements = data.measurements;
    const errorRate = data.errors / data.totalRequests;
    
    // Calculate statistics
    const p50 = calculatePercentile(measurements, 50);
    const p75 = calculatePercentile(measurements, 75);
    const p90 = calculatePercentile(measurements, 90);
    const p95 = calculatePercentile(measurements, 95);
    const p99 = calculatePercentile(measurements, 99);
    const mean = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    // Calculate throughput (requests per second)
    const testDurationSeconds = (Date.now() - testStartTime) / 1000;
    const throughput = data.totalRequests / testDurationSeconds;
    
    report.baseline[endpointName] = {
      statistics: {
        min: Math.round(min),
        max: Math.round(max),
        mean: Math.round(mean),
        p50: Math.round(p50),
        p75: Math.round(p75),
        p90: Math.round(p90),
        p95: Math.round(p95),
        p99: Math.round(p99)
      },
      performance: {
        throughput: Math.round(throughput * 10) / 10,
        errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimals
        variance: Math.round(data.variance * 100) / 100,
        isStable: data.isStable
      },
      metadata: {
        totalRequests: data.totalRequests,
        successfulRequests: data.totalRequests - data.errors,
        measurementCount: measurements.length,
        expectedResponseTime: BASELINE_ENDPOINTS[endpointName].expectedResponseTime
      }
    };
    
    totalVariance += data.variance;
    if (data.isStable) stableCount++;
    
    // Log endpoint baseline summary
    console.log(`\n📊 ${endpointName} Baseline:`);
    console.log(`   Response Times: P50=${p50}ms, P95=${p95}ms, P99=${p99}ms`);
    console.log(`   Throughput: ${throughput.toFixed(1)} rps`);
    console.log(`   Error Rate: ${(errorRate * 100).toFixed(2)}%`);
    console.log(`   Stability: ${data.isStable ? '✅ Stable' : '❌ Unstable'} (variance: ${data.variance.toFixed(1)}%)`);
  });
  
  // Calculate summary statistics
  report.summary.totalEndpoints = endpointCount;
  report.summary.stableEndpoints = stableCount;
  report.summary.averageVariance = endpointCount > 0 ? totalVariance / endpointCount : 0;
  
  // Calculate confidence score (0-100)
  const stabilityScore = endpointCount > 0 ? (stableCount / endpointCount) * 100 : 0;
  const varianceScore = Math.max(0, 100 - report.summary.averageVariance);
  report.summary.confidenceScore = (stabilityScore + varianceScore) / 2;
  
  baselineConfidence.add(report.summary.confidenceScore);
  
  // Generate recommendations
  if (report.summary.confidenceScore >= 80) {
    report.summary.recommendations.push('Baseline establishment successful - high confidence');
    report.summary.recommendations.push('Baseline can be used for regression testing');
  } else if (report.summary.confidenceScore >= 60) {
    report.summary.recommendations.push('Baseline establishment moderately successful');
    report.summary.recommendations.push('Consider running additional measurements for unstable endpoints');
    report.summary.recommendations.push('Use baseline with caution for regression testing');
  } else {
    report.summary.recommendations.push('Baseline establishment failed - low confidence');
    report.summary.recommendations.push('System may be unstable or under load');
    report.summary.recommendations.push('Do not use for regression testing until improved');
  }
  
  if (stableCount < endpointCount) {
    report.summary.recommendations.push(`${endpointCount - stableCount} endpoints show high variance - investigate`);
  }
  
  if (report.summary.averageVariance > 25) {
    report.summary.recommendations.push('High average variance detected - check system stability');
  }
  
  return report;
}

export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = (endTime - data.startTime) / 1000;
  
  console.log('\n=== Baseline Establishment Results ===');
  console.log(`Total Duration: ${totalDuration.toFixed(2)} seconds`);
  console.log(`Environment: ${data.environment}`);
  console.log(`Version: ${data.version}`);
  
  const baselineReport = generateBaselineReport(data);
  
  console.log(`\n📈 Baseline Summary:`);
  console.log(`   Endpoints Measured: ${baselineReport.summary.totalEndpoints}`);
  console.log(`   Stable Endpoints: ${baselineReport.summary.stableEndpoints}`);
  console.log(`   Average Variance: ${baselineReport.summary.averageVariance.toFixed(1)}%`);
  console.log(`   Confidence Score: ${baselineReport.summary.confidenceScore.toFixed(1)}/100`);
  
  console.log('\n🎯 Recommendations:');
  baselineReport.summary.recommendations.forEach(rec => {
    console.log(`   • ${rec}`);
  });
  
  if (baselineReport.summary.confidenceScore >= 80) {
    console.log('\n✅ BASELINE ESTABLISHMENT SUCCESSFUL');
  } else if (baselineReport.summary.confidenceScore >= 60) {
    console.log('\n⚠️ BASELINE ESTABLISHMENT PARTIALLY SUCCESSFUL');
  } else {
    console.log('\n❌ BASELINE ESTABLISHMENT FAILED');
  }
  
  // Output baseline file content
  console.log('\n📄 Baseline Configuration (save to baselines/):');
  console.log(JSON.stringify(baselineReport.baseline, null, 2));
  
  return baselineReport;
}

export function handleSummary(data) {
  return {
    'baseline-establishment-results.json': JSON.stringify(data, null, 2),
    'baseline-summary.txt': textSummary(data, { indent: ' ', enableColors: false }),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}