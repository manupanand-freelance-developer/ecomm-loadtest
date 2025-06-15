# 🚀 Load Testing with k6

This repository contains a customizable load testing setup using [k6](https://k6.io/) to test the performance and reliability of web applications. It supports local runs, Docker-based execution (ARM64-friendly), and integrates optional Node.js scripting.

---

## 📦 Features

- ✅ Load testing with [k6](https://k6.io/)
- ✅ Dockerized setup with support for **ARM64** (e.g., AWS Graviton, Raspberry Pi, Apple M1/M2)
- ✅ Pre/Post-test scripting support using Node.js (optional)
- ✅ Configurable via `.env` or environment variables
- ✅ Stage-based traffic ramping
- ✅ Basic test scenario included (login, browse, add to cart, checkout)

---

## 🛠️ Folder Structure

```bash
.
├── Dockerfile        # Container setup for ARM64 with k6 + Node.js
├── run.sh            # Entrypoint script to launch k6 tests
├── test.js           # Main k6 load testing script
├── package.json      # Optional Node.js dependencies (for setup tasks)
├── .env              # Optional environment variable file
└── README.md
```

# 🚀 Getting Started
1. Clone the repository
```
git clone https://github.com/your-org/load-test.git
cd load-test
```
##  Build the Docker image
```
docker build -t ecomm-loadtest:latest .
```

##  Run the load test
With environment variables:

```
docker run --rm \
  -e BASE_URL=http://localhost:8080 \
  -e MIN_USERS=10 \
  -e SPAWN_USERS=100 \
  -e TEST_DURATION=1m \
  k6-loadtest-arm
  ```

Or with .env file:

docker run --rm --env-file .env k6-loadtest-arm

## ⚙️ Environment Variables

You can set these directly or via .env:
Variable	Description	Default
BASE_URL	Target application base URL	http://localhost:8080
MIN_USERS	Initial virtual users during warm-up stage	10
SPAWN_USERS	Peak users during load stage	200
TEST_DURATION	Duration of the sustained test stage	5m
SUDDEN_USER_DOWN	Users at final cooldown stage	5
🧪 Example Load Test Flow

The test.js script simulates a basic user journey:

    Open homepage

    Login

    Search for product

    View product detail

    Add to cart

    Checkout

    Payment

Each step includes assertions and error tracking via k6 metrics.
🐳 Docker Image Info

    Base Image: grafana/k6:master-with-browser (includes browser support for advanced tests)

    Architecture: ARM64 compatible

    Node.js: Installed manually (v22.16.0) for pre-test scripting support

## 📈 Output & Metrics

Test results are shown in the console with:

    ✅ Request success/failure rates

    📊 Response times (avg, p95, etc.)

    ❌ Error counts

    ⏱️ Custom thresholds

Optional integrations with:

    k6 Cloud

    Grafana OSS via Prometheus

# 🧰 Development Scripts

# Run test directly (if running k6 locally)
```
k6 run test.js
```

# Using npm (if package.json is configured)
npm run test

# 📜 License

MIT License. See LICENSE file.