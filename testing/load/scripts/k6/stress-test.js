import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate, Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';

// Custom metrics
const errorRate = new Rate('errors');
const dbResponseTime = new Trend('db_response_time');
const concurrentUsers = new Counter('concurrent_users');
const systemOverload = new Rate('system_overload');

// Test data
const users = new SharedArray('users', function () {
  return JSON.parse(open('./test-data/users.json'));
});

// Stress test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
    system_overload: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://flextime.example.com';

// Complex user behavior under stress
export default function () {
  concurrentUsers.add(1);
  const user = users[exec.scenario.iterationInTest % users.length];
  let authToken = '';

  // Aggressive login attempts
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });

  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'no rate limiting': (r) => r.status !== 429,
    'no server error': (r) => r.status < 500,
  });

  if (!loginSuccess) {
    errorRate.add(1);
    if (loginRes.status >= 500) {
      systemOverload.add(1);
    }
    return;
  }

  authToken = loginRes.json('token');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  // Parallel requests to stress the system
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/dashboard`, null, { headers: authHeaders }],
    ['GET', `${BASE_URL}/api/projects`, null, { headers: authHeaders }],
    ['GET', `${BASE_URL}/api/time-entries/recent`, null, { headers: authHeaders }],
    ['GET', `${BASE_URL}/api/users/profile`, null, { headers: authHeaders }],
  ]);

  responses.forEach((res, index) => {
    const checkResult = check(res, {
      [`request ${index} successful`]: (r) => r.status === 200,
      [`request ${index} fast`]: (r) => r.timings.duration < 1000,
    });

    if (!checkResult) {
      errorRate.add(1);
    }

    if (res.timings.duration > 2000) {
      systemOverload.add(1);
    }
  });

  // Heavy database operations
  const dbStart = Date.now();
  const reportRes = http.post(`${BASE_URL}/api/reports/generate`, JSON.stringify({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    includeAllProjects: true,
    detailed: true,
  }), {
    headers: authHeaders,
    timeout: '30s',
  });
  dbResponseTime.add(Date.now() - dbStart);

  check(reportRes, {
    'report generated': (r) => r.status === 200 || r.status === 202,
    'no timeout': (r) => r.status !== 408,
  });

  // Rapid fire requests
  for (let i = 0; i < 5; i++) {
    const quickRes = http.get(`${BASE_URL}/api/time-entries/${Math.floor(Math.random() * 1000)}`, {
      headers: authHeaders,
    });

    if (quickRes.status >= 500) {
      systemOverload.add(1);
    }
  }

  sleep(Math.random() * 2);
}

// Monitor system health during test
export function handleSummary(data) {
  const errorThreshold = 0.05;
  const overloadThreshold = 0.1;

  if (data.metrics.errors && data.metrics.errors.rate > errorThreshold) {
    console.error(`Error rate exceeded threshold: ${data.metrics.errors.rate}`);
  }

  if (data.metrics.system_overload && data.metrics.system_overload.rate > overloadThreshold) {
    console.error(`System overload detected: ${data.metrics.system_overload.rate}`);
  }

  return {
    'stdout': JSON.stringify(data, null, 2),
    '/tmp/stress-test-results.json': JSON.stringify(data, null, 2),
  };
}