import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export let errorCount = new Counter('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const USERNAME = __ENV.USERNAME || 'user';
const PASSWORD = __ENV.PASSWORD || 'password';
const EMAIL = __ENV.EMAIL || 'user@example.com';

const MIN_USERS = Number(__ENV.MIN_USERS || 10);
const SPAWN_USERS = Number(__ENV.SPAWN_USERS || 100);
const TEST_DURATION = __ENV.TEST_DURATION || '3m';
const SUDDEN_USER_DOWN = Number(__ENV.SUDDEN_USER_DOWN || 2);

export let options = {
  stages: [
    { duration: '1m', target: MIN_USERS },
    { duration: '1m', target: SPAWN_USERS },
    { duration: TEST_DURATION, target: SPAWN_USERS },
    { duration: '30s', target: SUDDEN_USER_DOWN },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],      // Less than 1% errors
    http_req_duration: ['p(95)<1000'],   // 95% below 1s
  },
};


export default function () {
  let uniqueid, user, categories, category, products, product, cart, countries, country, locations, location, shipping;

  // 1. Get unique session ID
  try {
    let res = http.get(`${BASE_URL}/api/user/uniqueid`);
    check(res, { 'Got uniqueid': (r) => r.status === 200 });
    uniqueid = res.json('uuid');
    if (!uniqueid) throw new Error('Failed to get uniqueid: ' + res.body);
  } catch (err) {
    errorCount.add(1);
    console.error('❌ Uniqueid error:', err.message);
    return;
  }
  sleep(0.5);

  // 2. Register (optional, for new users)
  // Uncomment if you want to test registration
  /*
  try {
    let res = http.post(`${BASE_URL}/api/user/register`, JSON.stringify({
      name: USERNAME,
      email: EMAIL,
      password: PASSWORD,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'Registered user': (r) => r.status === 200 || r.status === 409 });
  } catch (err) {
    errorCount.add(1);
    console.error('❌ Registration error:', err.message);
    return;
  }
  sleep(0.5);
  */

  // 3. Login
  try {
    let res = http.post(`${BASE_URL}/api/user/login`, JSON.stringify({
      name: USERNAME,
      password: PASSWORD,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, { 'Login successful': (r) => r.status === 200 });
    user = res.json();
    if (!user || !user.name) throw new Error('Login failed: ' + res.body);
    // Migrate cart to logged-in user
    http.get(`${BASE_URL}/api/cart/rename/${uniqueid}/${user.name}`);
    uniqueid = user.name;
  } catch (err) {
    errorCount.add(1);
    console.error('❌ Login error:', err.message);
    return;
  }
  sleep(0.5);

  // 4. Get product categories
  try {
    let res = http.get(`${BASE_URL}/api/catalogue/categories`);
    check(res, { 'Got categories': (r) => r.status === 200 });
    categories = res.json();
    category = categories && categories.length ? categories[0] : null;
  } catch (err) {
    errorCount.add(1);
    console.error('❌ Categories error:', err.message);
    return;
  }
  sleep(0.5);

  // 5. Search products
  try {
    let searchText = 'robot';
    let res = http.get(`${BASE_URL}/api/catalogue/search/${searchText}`);
    check(res, { 'Search successful': (r) => r.status === 200 });
    products = res.json();
    product = products && products.length ? products[0] : null;
  } catch (err) {
    errorCount.add(1);
    console.error('❌ Search error:', err.message);
    return;
  }
  sleep(0.5);

  // 6. View product details
  if (product && product.sku) {
    try {
      let res = http.get(`${BASE_URL}/api/catalogue/product/${product.sku}`);
      check(res, { 'Product view successful': (r) => r.status === 200 });
    } catch (err) {
      errorCount.add(1);
      console.error('❌ Product view error:', err.message);
      return;
    }
    sleep(0.5);

    // 7. Add to cart
    try {
      let res = http.get(`${BASE_URL}/api/cart/add/${uniqueid}/${product.sku}/1`);
      check(res, { 'Added to cart': (r) => r.status === 200 });
      cart = res.json();
    } catch (err) {
      errorCount.add(1);
      console.error('❌ Add to cart error:', err.message);
      return;
    }
    sleep(0.5);

    // 8. Update cart (change quantity)
    try {
      let res = http.get(`${BASE_URL}/api/cart/update/${uniqueid}/${product.sku}/2`);
      check(res, { 'Updated cart': (r) => r.status === 200 });
      cart = res.json();
    } catch (err) {
      errorCount.add(1);
      console.error('❌ Update cart error:', err.message);
      return;
    }
    sleep(0.5);

    // 9. Load cart
    try {
      let res = http.get(`${BASE_URL}/api/cart/cart/${uniqueid}`);
      check(res, { 'Loaded cart': (r) => r.status === 200 });
      cart = res.json();
    } catch (err) {
      errorCount.add(1);
      console.error('❌ Load cart error:', err.message);
      return;
    }
    sleep(0.5);

    // 10. Get shipping codes
    try {
      let res = http.get(`${BASE_URL}/api/shipping/codes`);
      check(res, { 'Got shipping codes': (r) => r.status === 200 });
      countries = res.json();
      country = countries && countries.length ? countries[0] : null;
    } catch (err) {
      errorCount.add(1);
      console.error('❌ Shipping codes error:', err.message);
      return;
    }
    sleep(0.5);

    // 11. Shipping location autocomplete (simulate)
    try {
      let locationTerm = 'New';
      let res = http.get(`${BASE_URL}/api/shipping/match/${country.code}/${locationTerm}`);
      check(res, { 'Location autocomplete': (r) => r.status === 200 });
      locations = res.json();
      location = locations && locations.length ? locations[0] : null;
    } catch (err) {
      errorCount.add(1);
      console.error('❌ Location autocomplete error:', err.message);
      return;
    }
    sleep(0.5);

    // 12. Calculate shipping
    if (location && location.uuid) {
      try {
        let res = http.get(`${BASE_URL}/api/shipping/calc/${location.uuid}`);
        check(res, { 'Shipping calculated': (r) => r.status === 200 });
        shipping = res.json();
      } catch (err) {
        errorCount.add(1);
        console.error('❌ Shipping calculation error:', err.message);
        return;
      }
      sleep(0.5);

      // 13. Confirm shipping
      try {
        let res = http.post(`${BASE_URL}/api/shipping/confirm/${uniqueid}`, JSON.stringify(shipping), { headers: { 'Content-Type': 'application/json' } });
        check(res, { 'Shipping confirmed': (r) => r.status === 200 });
        cart = res.json();
      } catch (err) {
        errorCount.add(1);
        console.error('❌ Confirm shipping error:', err.message);
        return;
      }
      sleep(0.5);

      // 14. Payment
      try {
        let res = http.post(`${BASE_URL}/api/payment/pay/${uniqueid}`, JSON.stringify(cart), { headers: { 'Content-Type': 'application/json' } });
        check(res, { 'Payment processed': (r) => r.status === 200 });
      } catch (err) {
        errorCount.add(1);
        console.error('❌ Payment error:', err.message);
        return;
      }
      sleep(0.5);
    }
  }
}
