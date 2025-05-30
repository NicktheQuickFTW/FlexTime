import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { scenario } from 'k6/execution';

// Spike test metrics
const spikeResponseTime = new Trend('spike_response_time');
const preSpikResponseTime = new Trend('pre_spike_response_time');
const recoveryTime = new Gauge('recovery_time');
const droppedRequests = new Counter('dropped_requests');
const queueDepth = new Gauge('queue_depth');

// Configuration for spike testing
export const options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m', target: 50 },   // Normal load
        { duration: '30s', target: 500 },  // Spike
        { duration: '3m', target: 500 },   // Sustained spike
        { duration: '30s', target: 50 },   // Return to normal
        { duration: '2m', target: 50 },    // Recovery period
        { duration: '1m', target: 0 },     // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(99)<2000'],
    http_req_failed: ['rate<0.1'],
    dropped_requests: ['count<100'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://flextime.example.com';

// Track system state
let systemState = 'normal';
let spikeStartTime = 0;
let recoveryStartTime = 0;

export default function () {
  const currentVUs = scenario.activeVUs;
  
  // Detect spike phase
  if (currentVUs > 400 && systemState === 'normal') {
    systemState = 'spike';
    spikeStartTime = Date.now();
  } else if (currentVUs < 100 && systemState === 'spike') {
    systemState = 'recovery';
    recoveryStartTime = Date.now();
  }

  // Simple authentication
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: `user${scenario.iterationInTest}@test.com`,
    password: 'testpass123',
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '5s',
  });

  if (loginRes.status === 503 || loginRes.status === 0) {
    droppedRequests.add(1);
    return;
  }

  check(loginRes, {
    'login not rejected': (r) => r.status !== 503,
    'login not timed out': (r) => r.status !== 0,
  });

  if (loginRes.status !== 200) {
    return;
  }

  const token = loginRes.json('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Critical path testing during spike
  const criticalOps = [
    () => {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/api/dashboard/critical`, { headers, timeout: '3s' });
      const duration = Date.now() - start;
      
      if (systemState === 'spike') {
        spikeResponseTime.add(duration);
      } else {
        preSpikResponseTime.add(duration);
      }
      
      return res;
    },
    () => {
      return http.post(`${BASE_URL}/api/time-entries/quick`, JSON.stringify({
        hours: 2,
        projectId: 1,
        date: new Date().toISOString(),
      }), { headers, timeout: '3s' });
    },
    () => {
      return http.get(`${BASE_URL}/api/notifications/urgent`, { headers, timeout: '2s' });
    },
  ];

  // Execute critical operations
  criticalOps.forEach((op, index) => {
    const res = op();
    
    const checkResult = check(res, {
      [`critical op ${index} available`]: (r) => r.status !== 503,
      [`critical op ${index} successful`]: (r) => r.status === 200 || r.status === 201,
      [`critical op ${index} fast`]: (r) => r.timings.duration < 2000,
    });

    if (!checkResult && res.status === 503) {
      droppedRequests.add(1);
      
      // Check for queue depth in headers
      const queueHeader = res.headers['X-Queue-Depth'];
      if (queueHeader) {
        queueDepth.add(parseInt(queueHeader));
      }
    }
  });

  // Monitor recovery
  if (systemState === 'recovery' && recoveryStartTime > 0) {
    const recoveryRes = http.get(`${BASE_URL}/api/health/detailed`, { headers });
    
    if (recoveryRes.status === 200) {
      const health = recoveryRes.json();
      if (health.status === 'healthy' && health.responseTime < 100) {
        const recoveryDuration = Date.now() - recoveryStartTime;
        recoveryTime.add(recoveryDuration);
        systemState = 'recovered';
      }
    }
  }

  sleep(0.5);
}

export function handleSummary(data) {
  // Calculate spike impact
  const normalResponseTime = data.metrics.pre_spike_response_time?.values?.avg || 0;
  const spikeResponseTimeAvg = data.metrics.spike_response_time?.values?.avg || 0;
  const degradation = ((spikeResponseTimeAvg - normalResponseTime) / normalResponseTime) * 100;

  const summary = {
    ...data,
    spike_analysis: {
      response_time_degradation: `${degradation.toFixed(2)}%`,
      dropped_requests: data.metrics.dropped_requests?.values?.count || 0,
      max_queue_depth: data.metrics.queue_depth?.values?.max || 0,
      recovery_time_ms: data.metrics.recovery_time?.values?.value || 'Not recovered',
    },
  };

  return {
    'stdout': JSON.stringify(summary, null, 2),
    '/tmp/spike-test-results.json': JSON.stringify(summary, null, 2),
  };
}