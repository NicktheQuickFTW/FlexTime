import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const loginSuccess = new Rate('login_success');
const timeEntryDuration = new Trend('time_entry_duration');
const dashboardLoadTime = new Trend('dashboard_load_time');

// Test data
const users = new SharedArray('users', function () {
  return JSON.parse(open('./test-data/users.json'));
});

// Configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    http_reqs: ['rate>50'],
    login_success: ['rate>0.95'],
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'https://flextime.example.com';

// Helper functions
function randomUser() {
  return users[Math.floor(Math.random() * users.length)];
}

// Main test scenario
export default function () {
  const user = randomUser();
  let authToken = '';

  // Login flow
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginCheckResult = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'auth token received': (r) => r.json('token') !== '',
  });

  loginSuccess.add(loginCheckResult);

  if (loginCheckResult) {
    authToken = loginRes.json('token');
  } else {
    console.error(`Login failed for user ${user.email}`);
    return;
  }

  // Common headers with auth
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  // Dashboard load
  const dashboardStart = Date.now();
  const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, {
    headers: authHeaders,
  });
  dashboardLoadTime.add(Date.now() - dashboardStart);

  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
    'dashboard has data': (r) => r.json('projects') !== undefined,
  });

  sleep(1);

  // Create time entry
  const timeEntryStart = Date.now();
  const timeEntryRes = http.post(`${BASE_URL}/api/time-entries`, JSON.stringify({
    projectId: Math.floor(Math.random() * 100) + 1,
    description: 'Automated test entry',
    hours: Math.random() * 8 + 1,
    date: new Date().toISOString().split('T')[0],
  }), {
    headers: authHeaders,
  });
  timeEntryDuration.add(Date.now() - timeEntryStart);

  check(timeEntryRes, {
    'time entry created': (r) => r.status === 201,
    'time entry has id': (r) => r.json('id') !== undefined,
  });

  sleep(2);

  // View reports
  const reportsRes = http.get(`${BASE_URL}/api/reports/weekly`, {
    headers: authHeaders,
  });

  check(reportsRes, {
    'reports loaded': (r) => r.status === 200,
    'reports have data': (r) => r.json('entries') !== undefined,
  });

  sleep(1);

  // Search projects
  const searchRes = http.get(`${BASE_URL}/api/projects/search?q=test`, {
    headers: authHeaders,
  });

  check(searchRes, {
    'search completed': (r) => r.status === 200,
    'search returns results': (r) => Array.isArray(r.json('results')),
  });

  sleep(Math.random() * 3 + 1);
}

// Teardown
export function teardown(data) {
  console.log('Test completed');
}