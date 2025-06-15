// test.js - k6 load test script for eCommerce website

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';



// Environment variables
const env = __ENV;
// Custom error counter
export let errorCount = new Counter('errors');
const MIN_USERS = Number(env.MIN_USERS || 10);
const SPAWN_USERS = Number(env.SPAWN_USERS || 100);
const TEST_DURATION = env.TEST_DURATION || '3m';
const SUDDEN_USER_DOWN = Number(env.SUDDEN_USER_DOWN || 2);
const BASE_URL = env.BASE_URL || 'http://localhost:8080';
const USERNAME = env.USERNAME || 'user';
const PASSWORD = env.PASSWORD || 'password';


export let options = {
  stages: [
    { duration: '1m', target: MIN_USERS },
    { duration: '1m', target: SPAWN_USERS },
    { duration: TEST_DURATION , target: SPAWN_USERS },
    { duration: '30s', target: SUDDEN_USER_DOWN},
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};
// // Constants
// const BASE_URL = env.BASE_URL || 'http://localhost:8080';
// const USERNAME = env.USERNAME || 'user';
// const PASSWORD = env.PASSWORD || 'password';

export default function () {
  try {
    let res = http.get(`${BASE_URL}/`);
    let ok = check(res, { 'homepage loaded': (r) => r.status === 200 });
    if (!ok) throw new Error('Homepage load failed');
    console.log('✅ Homepage loaded');
  } catch (err) {
    errorCount.add(1);
    console.error(`❌ Homepage error: ${err.message}`);
  }
  sleep(1);

  try {
    let res = http.post(`${BASE_URL}/login`, JSON.stringify({ username: USERNAME, password: PASSWORD }), {
      headers: { 'Content-Type': 'application/json' },
    });
    let ok = check(res, { 'login successful': (r) => r.status === 200 });
    if (!ok) throw new Error('Login failed');
    console.log('✅ Login successful');
  } catch (err) {
    errorCount.add(1);
    console.error(`❌ Login error: ${err.message}`);
  }
  sleep(1);

  try {
    let res = http.get(`${BASE_URL}/search/robot`);
    let ok = check(res, { 'search works': (r) => r.status === 200 });
    if (!ok) throw new Error('Search failed');
    console.log('✅ Search successful');
  } catch (err) {
    errorCount.add(1);
    console.error(`❌ Search error: ${err.message}`);
  }
  sleep(1);

  try {
    let res = http.get(`${BASE_URL}/product/12345`);
    let ok = check(res, { 'product view': (r) => r.status === 200 });
    if (!ok) throw new Error('Product view failed');
    console.log('✅ Product view successful');
  } catch (err) {
    errorCount.add(1);
    console.error(`❌ Product view error: ${err.message}`);
  }
  sleep(1);

  try {
    let res = http.post(`${BASE_URL}/cart`, JSON.stringify({ product_id: '12345', quantity: 1 }), {
      headers: { 'Content-Type': 'application/json' },
    });
    let ok = check(res, { 'added to cart': (r) => r.status === 200 });
    if (!ok) throw new Error('Add to cart failed');
    console.log('✅ Added to cart');
  } catch (err) {
    errorCount.add(1);
    console.error(`❌ Add to cart error: ${err.message}`);
  }
  sleep(1);

  try {
    let res = http.post(`${BASE_URL}/checkout`, JSON.stringify({ cart_id: 'abc123' }), {
      headers: { 'Content-Type': 'application/json' },
    });
    let ok = check(res, { 'checkout successful': (r) => r.status === 200 });
    if (!ok) throw new Error('Checkout failed');
    console.log('✅ Checkout successful');
  } catch (err) {
    errorCount.add(1);
    console.error(`❌ Checkout error: ${err.message}`);
  }
  sleep(1);

  try {
    let res = http.post(`${BASE_URL}/payment`, JSON.stringify({ method: 'creditcard', order_id: 'order123' }), {
      headers: { 'Content-Type': 'application/json' },
    });
    let ok = check(res, { 'payment processed': (r) => r.status === 200 });
    if (!ok) throw new Error('Payment failed');
    console.log('✅ Payment processed');
  } catch (err) {
    errorCount.add(1);
    console.error(`❌ Payment error: ${err.message}`);
  }
  sleep(1);
} 
