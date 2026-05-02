import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'status is 200': (r) => r.status === 200,
    'db is connected': (r) => r.json().database === 'connected',
  });

  // 2. Simulate user activity (fetching history)
  // Note: In a real test, you'd provide valid JWT tokens
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TEST_TOKEN',
    },
  };
  
  // const historyRes = http.get(`${BASE_URL}/transaction/history`, params);
  // check(historyRes, { 'history fetched': (r) => r.status === 200 });

  sleep(1);
}
