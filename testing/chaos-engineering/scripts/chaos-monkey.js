import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics for chaos engineering
const chaosEventsTriggered = new Counter('chaos_events_triggered');
const systemRecoveryTime = new Trend('system_recovery_time_ms');
const chaosImpactSeverity = new Gauge('chaos_impact_severity');
const resilienceScore = new Gauge('system_resilience_score');
const failureDetectionTime = new Trend('failure_detection_time_ms');

export const options = {
  scenarios: {
    normal_operations: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30m',
    },
    chaos_injection: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 20, // 20 chaos events over 30 minutes
      maxDuration: '30m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000'], // Lenient during chaos
    http_req_failed: ['rate<0.30'], // Allow higher failure rate during chaos
    system_recovery_time_ms: ['p(95)<30000'], // 95% recover within 30s
    system_resilience_score: ['value>70'], // Minimum resilience score
  },
  ext: {
    loadimpact: {
      projectID: process.env.K6_PROJECT_ID,
      name: 'Flextime Chaos Monkey Experiment'
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';
const CHAOS_API_KEY = __ENV.CHAOS_API_KEY || API_KEY;
const ENVIRONMENT = __ENV.ENVIRONMENT || 'local';
const BLAST_RADIUS = __ENV.BLAST_RADIUS || 'small'; // small, medium, large

// Chaos experiment configurations
const CHAOS_EXPERIMENTS = {
  'service_unavailable': {
    severity: 8,
    duration: '30s',
    description: 'Make a critical service unavailable',
    implement: (baseUrl) => injectServiceUnavailability(baseUrl),
    recover: (baseUrl) => recoverServiceUnavailability(baseUrl)
  },
  'database_connection_failure': {
    severity: 9,
    duration: '60s',
    description: 'Simulate database connection failures',
    implement: (baseUrl) => injectDatabaseFailure(baseUrl),
    recover: (baseUrl) => recoverDatabaseFailure(baseUrl)
  },
  'high_latency': {
    severity: 5,
    duration: '120s',
    description: 'Inject network latency',
    implement: (baseUrl) => injectHighLatency(baseUrl),
    recover: (baseUrl) => recoverHighLatency(baseUrl)
  },
  'memory_pressure': {
    severity: 6,
    duration: '90s',
    description: 'Create memory pressure',
    implement: (baseUrl) => injectMemoryPressure(baseUrl),
    recover: (baseUrl) => recoverMemoryPressure(baseUrl)
  },
  'api_error_injection': {
    severity: 4,
    duration: '60s',
    description: 'Inject API errors randomly',
    implement: (baseUrl) => injectAPIErrors(baseUrl),
    recover: (baseUrl) => recoverAPIErrors(baseUrl)
  },
  'dependency_timeout': {
    severity: 7,
    duration: '45s',
    description: 'Simulate dependency timeouts',
    implement: (baseUrl) => injectDependencyTimeouts(baseUrl),
    recover: (baseUrl) => recoverDependencyTimeouts(baseUrl)
  },
  'cpu_spike': {
    severity: 5,
    duration: '30s',
    description: 'Create CPU load spikes',
    implement: (baseUrl) => injectCPUSpike(baseUrl),
    recover: (baseUrl) => recoverCPUSpike(baseUrl)
  },
  'configuration_chaos': {
    severity: 6,
    duration: '120s',
    description: 'Corrupt application configuration',
    implement: (baseUrl) => injectConfigurationChaos(baseUrl),
    recover: (baseUrl) => recoverConfigurationChaos(baseUrl)
  }
};

// Global state tracking
let activeChaosExperiments = new Map();
let baselinePerformance = null;
let experimentStartTime = 0;

export function setup() {
  console.log('=== Chaos Monkey Experiment Setup ===');
  console.log(`Environment: ${ENVIRONMENT}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Blast Radius: ${BLAST_RADIUS}`);
  console.log(`Available Experiments: ${Object.keys(CHAOS_EXPERIMENTS).length}`);
  
  // Establish baseline performance
  console.log('🔍 Establishing baseline performance...');
  baselinePerformance = measureBaselinePerformance();
  
  // Validate chaos control endpoints are available
  const chaosControlResponse = http.get(`${BASE_URL}/api/chaos/status`, {
    headers: { 'Authorization': `Bearer ${CHAOS_API_KEY}` }
  });
  
  if (chaosControlResponse.status !== 200) {
    console.log('⚠️ Chaos control API not available - using simulated chaos');
  }
  
  experimentStartTime = Date.now();
  
  return {
    baseUrl: BASE_URL,
    testId: `chaos_experiment_${Date.now()}`,
    startTime: experimentStartTime,
    baselinePerformance: baselinePerformance
  };
}

export default function(data) {
  if (__VU === 1 && __ITER < 20) {
    // Chaos injection VU - run chaos experiments
    executeChaosExperiment(data);
  } else {
    // Normal operations VU - simulate regular traffic
    executeNormalOperations(data);
  }
}

function executeChaosExperiment(data) {
  // Wait for some normal operations to establish baseline
  if (__ITER === 0) {
    sleep(60); // Wait 1 minute before first chaos
  }
  
  // Select chaos experiment based on blast radius
  const availableExperiments = filterExperimentsByBlastRadius();
  const experimentName = randomItem(availableExperiments);
  const experiment = CHAOS_EXPERIMENTS[experimentName];
  
  console.log(`🐒 Starting Chaos Experiment: ${experimentName}`);
  console.log(`   Description: ${experiment.description}`);
  console.log(`   Severity: ${experiment.severity}/10`);
  console.log(`   Duration: ${experiment.duration}`);
  
  const chaosStartTime = Date.now();
  
  // Record the chaos event
  chaosEventsTriggered.add(1, { 
    experiment: experimentName, 
    severity: experiment.severity 
  });
  chaosImpactSeverity.add(experiment.severity);
  
  try {
    // Implement the chaos
    const implementResult = experiment.implement(data.baseUrl);
    
    if (implementResult.success) {
      console.log(`✅ Chaos experiment ${experimentName} implemented successfully`);
      
      // Track active experiment
      activeChaosExperiments.set(experimentName, {
        startTime: chaosStartTime,
        severity: experiment.severity,
        expectedDuration: parseDuration(experiment.duration)
      });
      
      // Monitor system during chaos
      const monitoringResults = monitorSystemDuringChaos(data, experimentName, experiment.duration);
      
      // Wait for the chaos duration
      sleep(parseDuration(experiment.duration) / 1000);
      
      // Implement recovery
      console.log(`🔧 Recovering from chaos experiment: ${experimentName}`);
      const recoveryResult = experiment.recover(data.baseUrl);
      
      const recoveryTime = Date.now() - chaosStartTime;
      systemRecoveryTime.add(recoveryTime);
      
      if (recoveryResult.success) {
        console.log(`✅ Recovery from ${experimentName} successful in ${recoveryTime}ms`);
        
        // Validate system health post-recovery
        const healthValidation = validateSystemHealth(data);
        const resilienceCalculation = calculateResilienceScore(
          monitoringResults, 
          recoveryTime, 
          experiment.severity,
          healthValidation
        );
        
        resilienceScore.add(resilienceCalculation);
        
        console.log(`📊 Resilience Score: ${resilienceCalculation}/100`);
        
      } else {
        console.error(`❌ Recovery from ${experimentName} failed`);
        resilienceScore.add(0); // Failed recovery = 0 resilience
      }
      
      activeChaosExperiments.delete(experimentName);
      
    } else {
      console.error(`❌ Failed to implement chaos experiment ${experimentName}`);
    }
    
  } catch (error) {
    console.error(`💥 Chaos experiment ${experimentName} threw error: ${error.message}`);
    
    // Attempt emergency recovery
    try {
      experiment.recover(data.baseUrl);
    } catch (recoveryError) {
      console.error(`💥 Emergency recovery failed: ${recoveryError.message}`);
    }
  }
  
  // Wait before next chaos experiment (3-10 minutes)
  const waitTime = randomIntBetween(180, 600);
  console.log(`⏳ Waiting ${waitTime}s before next chaos experiment`);
  sleep(waitTime);
}

function executeNormalOperations(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-Test-ID': data.testId,
    'X-Normal-Operations': 'true'
  };

  // Simulate normal user operations
  const operations = [
    () => testScheduleRetrieval(data, headers),
    () => testHealthCheck(data, headers),
    () => testTeamManagement(data, headers),
    () => testAnalytics(data, headers),
    () => testScheduleGeneration(data, headers),
  ];
  
  const operation = randomItem(operations);
  const operationResult = operation();
  
  // Record operation result with chaos context
  const activeChaos = Array.from(activeChaosExperiments.keys());
  if (activeChaos.length > 0) {
    // Operation during chaos - check if failure detection is working
    if (!operationResult.success && operationResult.responseTime > 0) {
      failureDetectionTime.add(operationResult.responseTime, { 
        chaos_active: activeChaos.join(',') 
      });
    }
  }
  
  sleep(1 + Math.random() * 3); // Normal user think time
}

// Chaos implementation functions
function injectServiceUnavailability(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/inject`, JSON.stringify({
    type: 'service_unavailable',
    target: 'scheduler-service',
    duration: '30s'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function recoverServiceUnavailability(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/recover`, JSON.stringify({
    type: 'service_unavailable',
    target: 'scheduler-service'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function injectDatabaseFailure(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/inject`, JSON.stringify({
    type: 'database_failure',
    target: 'primary_db',
    failure_rate: 0.5, // 50% of connections fail
    duration: '60s'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function recoverDatabaseFailure(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/recover`, JSON.stringify({
    type: 'database_failure',
    target: 'primary_db'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function injectHighLatency(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/inject`, JSON.stringify({
    type: 'network_latency',
    target: 'all_endpoints',
    latency_ms: randomIntBetween(1000, 5000),
    duration: '120s'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function recoverHighLatency(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/recover`, JSON.stringify({
    type: 'network_latency',
    target: 'all_endpoints'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function injectMemoryPressure(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/inject`, JSON.stringify({
    type: 'memory_pressure',
    target: 'api_service',
    memory_percentage: 85, // Use 85% of available memory
    duration: '90s'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function recoverMemoryPressure(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/recover`, JSON.stringify({
    type: 'memory_pressure',
    target: 'api_service'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function injectAPIErrors(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/inject`, JSON.stringify({
    type: 'api_errors',
    target: 'random_endpoints',
    error_rate: 0.2, // 20% error rate
    error_types: ['500', '503', '429'],
    duration: '60s'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function recoverAPIErrors(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/recover`, JSON.stringify({
    type: 'api_errors',
    target: 'random_endpoints'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function injectDependencyTimeouts(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/inject`, JSON.stringify({
    type: 'dependency_timeout',
    target: 'external_apis',
    timeout_ms: randomIntBetween(30000, 60000),
    duration: '45s'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function recoverDependencyTimeouts(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/recover`, JSON.stringify({
    type: 'dependency_timeout',
    target: 'external_apis'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function injectCPUSpike(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/inject`, JSON.stringify({
    type: 'cpu_spike',
    target: 'scheduler_service',
    cpu_percentage: 95,
    duration: '30s'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function recoverCPUSpike(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/recover`, JSON.stringify({
    type: 'cpu_spike',
    target: 'scheduler_service'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function injectConfigurationChaos(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/inject`, JSON.stringify({
    type: 'configuration_chaos',
    target: 'environment_variables',
    chaos_type: randomItem(['missing_vars', 'wrong_values', 'corrupted_config']),
    duration: '120s'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

function recoverConfigurationChaos(baseUrl) {
  const response = http.post(`${baseUrl}/api/chaos/recover`, JSON.stringify({
    type: 'configuration_chaos',
    target: 'environment_variables'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHAOS_API_KEY}`
    }
  });
  
  return { success: response.status === 200 };
}

// Utility and monitoring functions
function measureBaselinePerformance() {
  console.log('📊 Measuring baseline performance...');
  
  const measurements = [];
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    const response = http.get(`${BASE_URL}/health`);
    const duration = Date.now() - start;
    
    if (response.status === 200) {
      measurements.push(duration);
    }
    
    sleep(1);
  }
  
  const avgResponseTime = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
  console.log(`✅ Baseline average response time: ${avgResponseTime.toFixed(2)}ms`);
  
  return {
    averageResponseTime: avgResponseTime,
    measurements: measurements
  };
}

function monitorSystemDuringChaos(data, experimentName, duration) {
  const monitoringResults = {
    errorCount: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    maxResponseTime: 0,
    systemAlerts: []
  };
  
  const durationMs = parseDuration(duration);
  const monitoringInterval = Math.min(durationMs / 10, 5000); // Monitor every 5s or 1/10th of duration
  const monitoringEnd = Date.now() + durationMs;
  
  console.log(`🔍 Monitoring system during ${experimentName} for ${duration}`);
  
  while (Date.now() < monitoringEnd) {
    const start = Date.now();
    const healthResponse = http.get(`${data.baseUrl}/health`);
    const responseTime = Date.now() - start;
    
    monitoringResults.totalRequests++;
    
    if (healthResponse.status !== 200) {
      monitoringResults.errorCount++;
    }
    
    monitoringResults.averageResponseTime = 
      (monitoringResults.averageResponseTime * (monitoringResults.totalRequests - 1) + responseTime) / 
      monitoringResults.totalRequests;
    
    monitoringResults.maxResponseTime = Math.max(monitoringResults.maxResponseTime, responseTime);
    
    // Check for system alerts
    if (responseTime > 10000) {
      monitoringResults.systemAlerts.push({
        timestamp: Date.now(),
        type: 'high_response_time',
        value: responseTime
      });
    }
    
    sleep(monitoringInterval / 1000);
  }
  
  console.log(`📊 Monitoring results: ${monitoringResults.errorCount}/${monitoringResults.totalRequests} errors, avg ${monitoringResults.averageResponseTime.toFixed(2)}ms`);
  
  return monitoringResults;
}

function validateSystemHealth(data) {
  console.log('🏥 Validating system health post-chaos...');
  
  const healthChecks = [
    () => http.get(`${data.baseUrl}/health`),
    () => http.get(`${data.baseUrl}/api/schedules?limit=1`),
    () => http.get(`${data.baseUrl}/api/teams?limit=1`),
  ];
  
  const results = healthChecks.map(check => {
    const start = Date.now();
    const response = check();
    const duration = Date.now() - start;
    
    return {
      success: response.status === 200,
      responseTime: duration,
      status: response.status
    };
  });
  
  const allHealthy = results.every(result => result.success);
  const avgResponseTime = results.reduce((sum, result) => sum + result.responseTime, 0) / results.length;
  
  console.log(`🏥 System health: ${allHealthy ? 'HEALTHY' : 'UNHEALTHY'}, avg response: ${avgResponseTime.toFixed(2)}ms`);
  
  return {
    isHealthy: allHealthy,
    averageResponseTime: avgResponseTime,
    individualResults: results
  };
}

function calculateResilienceScore(monitoringResults, recoveryTime, severity, healthValidation) {
  let score = 100;
  
  // Penalize for errors during chaos
  const errorRate = monitoringResults.errorCount / monitoringResults.totalRequests;
  score -= errorRate * 30; // Up to 30 points for errors
  
  // Penalize for slow recovery
  if (recoveryTime > 30000) score -= 20; // 20 points for slow recovery
  else if (recoveryTime > 10000) score -= 10; // 10 points for moderate recovery
  
  // Penalize for poor post-chaos health
  if (!healthValidation.isHealthy) score -= 25; // 25 points for unhealthy post-chaos
  
  // Penalize based on response time degradation
  if (baselinePerformance && monitoringResults.averageResponseTime > baselinePerformance.averageResponseTime * 3) {
    score -= 15; // 15 points for severe response time degradation
  }
  
  // Adjust score based on experiment severity
  const severityAdjustment = (10 - severity) * 2; // Easier experiments get bonus points
  score += severityAdjustment;
  
  return Math.max(0, Math.min(100, score));
}

function filterExperimentsByBlastRadius() {
  const allExperiments = Object.keys(CHAOS_EXPERIMENTS);
  
  if (BLAST_RADIUS === 'small') {
    return allExperiments.filter(name => 
      CHAOS_EXPERIMENTS[name].severity <= 5
    );
  } else if (BLAST_RADIUS === 'medium') {
    return allExperiments.filter(name => 
      CHAOS_EXPERIMENTS[name].severity <= 7
    );
  } else {
    return allExperiments; // large blast radius - all experiments
  }
}

function parseDuration(durationStr) {
  const match = durationStr.match(/(\d+)(s|m|h)/);
  if (!match) return 30000; // Default 30 seconds
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    default: return 30000;
  }
}

// Normal operation test functions
function testScheduleRetrieval(data, headers) {
  const start = Date.now();
  const response = http.get(`${data.baseUrl}/api/schedules?limit=10`, { headers });
  const duration = Date.now() - start;
  
  const success = check(response, {
    'schedule retrieval - status ok': (r) => r.status >= 200 && r.status < 400,
  });
  
  return { success, responseTime: duration, status: response.status };
}

function testHealthCheck(data, headers) {
  const start = Date.now();
  const response = http.get(`${data.baseUrl}/health`, { headers });
  const duration = Date.now() - start;
  
  const success = check(response, {
    'health check - status 200': (r) => r.status === 200,
  });
  
  return { success, responseTime: duration, status: response.status };
}

function testTeamManagement(data, headers) {
  const start = Date.now();
  const response = http.get(`${data.baseUrl}/api/teams?limit=10`, { headers });
  const duration = Date.now() - start;
  
  const success = check(response, {
    'team management - status ok': (r) => r.status >= 200 && r.status < 400,
  });
  
  return { success, responseTime: duration, status: response.status };
}

function testAnalytics(data, headers) {
  const start = Date.now();
  const response = http.get(`${data.baseUrl}/api/analytics/dashboard?timeframe=7d`, { headers });
  const duration = Date.now() - start;
  
  const success = check(response, {
    'analytics - status ok': (r) => r.status >= 200 && r.status < 400,
  });
  
  return { success, responseTime: duration, status: response.status };
}

function testScheduleGeneration(data, headers) {
  const start = Date.now();
  const payload = {
    sport: 'Football',
    season: '2025',
    teams: 8,
    constraints: { maxGamesPerWeek: 1, minRestDays: 6 }
  };
  
  const response = http.post(
    `${data.baseUrl}/api/schedules/generate`,
    JSON.stringify(payload),
    { headers, timeout: '30s' }
  );
  const duration = Date.now() - start;
  
  const success = check(response, {
    'schedule generation - status ok': (r) => r.status >= 200 && r.status < 400,
  });
  
  return { success, responseTime: duration, status: response.status };
}

export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = (endTime - data.startTime) / 1000 / 60; // minutes
  
  console.log('\n=== Chaos Monkey Experiment Results ===');
  console.log(`Total Duration: ${totalDuration.toFixed(2)} minutes`);
  console.log(`Environment: ${ENVIRONMENT}`);
  
  // Ensure all chaos experiments are recovered
  if (activeChaosExperiments.size > 0) {
    console.log('🧹 Cleaning up remaining chaos experiments...');
    
    for (const [experimentName, experimentData] of activeChaosExperiments.entries()) {
      try {
        const experiment = CHAOS_EXPERIMENTS[experimentName];
        experiment.recover(data.baseUrl);
        console.log(`✅ Recovered from ${experimentName}`);
      } catch (error) {
        console.error(`❌ Failed to recover from ${experimentName}: ${error.message}`);
      }
    }
  }
  
  // Final system health validation
  const finalHealthCheck = validateSystemHealth(data);
  
  if (finalHealthCheck.isHealthy) {
    console.log('✅ System is healthy after chaos experiments');
  } else {
    console.log('❌ System may need attention after chaos experiments');
  }
  
  console.log('\n🎯 Chaos Engineering Summary:');
  console.log('- Chaos experiments help identify system weaknesses');
  console.log('- Monitor resilience scores to track improvement over time');
  console.log('- Use findings to improve system reliability and monitoring');
}