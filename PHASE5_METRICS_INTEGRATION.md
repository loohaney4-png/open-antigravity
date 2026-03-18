# Phase 5: Metrics Integration Guide

**Purpose**: Integrate Prometheus metrics collection into your backend  
**Status**: ✅ Ready to integrate  
**Components**: Metrics middleware, Custom recorders, Prometheus endpoint

---

## 🚀 Integration Steps

### 1. Update Backend Package.json

Add Prometheus client:

```bash
npm install prom-client
```

Or add to `backend/package.json`:

```json
{
  "dependencies": {
    "prom-client": "^15.0.0"
  }
}
```

### 2. Integrate Metrics Middleware

**File**: `backend/api/server.js`

```javascript
const express = require('express');
const { metricsMiddleware } = require('../middleware/metrics');

const app = express();

// Initialize metrics middleware (must be early in middleware chain)
metricsMiddleware(app);

// Your other middleware and routes
app.use(express.json());

// ... routes ...

module.exports = app;
```

### 3. Record Task Metrics

**File**: `backend/api/routes/agents.js` or task execution service:

```javascript
const { recordTaskExecution, recordDatabaseMetrics } = require('../middleware/metrics');

// When task completes
async function executeTask(agentId, taskId) {
  const start = Date.now();
  let status = 'success';

  try {
    // Execute task...
    const result = await agent.execute(taskId);
    
    // Record success metrics
    const duration = (Date.now() - start) / 1000;
    recordTaskExecution({
      agentId,
      status: 'success',
      duration,
      queueDepth: queue.length
    });

    return result;
  } catch (error) {
    // Record failure metrics
    const duration = (Date.now() - start) / 1000;
    recordTaskExecution({
      agentId,
      status: 'failure',
      duration,
      queueDepth: queue.length
    });
    
    throw error;
  }
}
```

### 4. Record Database Metrics

**File**: `backend/db/postgres.js` or database connector:

```javascript
const { recordDatabaseMetrics } = require('../middleware/metrics');
const pg = require('pg');

const pool = new pg.Pool({ /* config */ });

// Record active connections
setInterval(() => {
  recordDatabaseMetrics({
    activeConnections: pool.totalCount,
    operation: 'queries'
  });
}, 30000); // Every 30 seconds

// Measure query duration
async function query(sql, values) {
  const start = Date.now();
  try {
    const result = await pool.query(sql, values);
    const duration = (Date.now() - start) / 1000;
    
    recordDatabaseMetrics({
      activeConnections: pool.totalCount,
      operation: 'select', // or 'insert', 'update', 'delete'
      duration
    });
    
    return result;
  } catch (error) {
    throw error;
  }
}
```

### 5. Record Cache Metrics

**File**: `backend/cache/redis.js` or cache service:

```javascript
const { recordCacheHit, recordCacheMiss } = require('../middleware/metrics');
const redis = require('redis');

const client = redis.createClient();

async function getCached(key) {
  const value = await client.get(key);
  
  if (value) {
    recordCacheHit('redis');
    return JSON.parse(value);
  } else {
    recordCacheMiss('redis');
    return null;
  }
}

async function setCached(key, value, ttl = 3600) {
  await client.set(key, JSON.stringify(value), 'EX', ttl);
}
```

### 6. Record LLM Metrics

**File**: `backend/services/ai-service/index.js`:

```javascript
const { recordLLMInference } = require('../../middleware/metrics');
const axios = require('axios');

async function generateCompletion(model, prompt, agentId) {
  const start = Date.now();

  try {
    const response = await axios.post(
      'http://ollama:11434/api/generate',
      {
        model,
        prompt,
        stream: false
      }
    );

    const duration = (Date.now() - start) / 1000;
    const tokensGenerated = response.data.response.split(/\s+/).length; // Approximate

    recordLLMInference({
      model,
      endpoint: 'generate',
      duration,
      tokensGenerated
    });

    return response.data.response;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    
    recordLLMInference({
      model,
      endpoint: 'generate',
      duration,
      error: error.code || 'unknown'
    });

    throw error;
  }
}
```

---

## 📊 Metrics Available

### HTTP Requests

```
http_request_duration_seconds     # Histogram (method, route, status)
http_requests_total               # Counter (method, route, status)
http_request_size_bytes           # Histogram (method, route)
http_response_size_bytes          # Histogram (method, route, status)
```

**Query Examples**:
```promql
# Avg response time per endpoint
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Tasks

```
task_executions_total             # Counter (status, agent_id)
task_execution_duration_seconds   # Histogram (agent_id)
task_queue_depth                  # Gauge (queue)
```

**Query Examples**:
```promql
# Task success rate
rate(task_executions_total{status="success"}[5m]) / rate(task_executions_total[5m])

# Avg task duration
rate(task_execution_duration_seconds_sum[5m]) / rate(task_execution_duration_seconds_count[5m])

# Max queue depth
max(task_queue_depth)
```

### Database

```
database_connections              # Gauge (pool)
database_query_duration_seconds   # Histogram (operation)
```

**Query Examples**:
```promql
# Active connections
database_connections

# Avg query time by operation
rate(database_query_duration_seconds_sum[5m]) by (operation) / 
  rate(database_query_duration_seconds_count[5m]) by (operation)
```

### Cache

```
cache_hits_total                  # Counter (cache_name)
cache_misses_total                # Counter (cache_name)
```

**Query Examples**:
```promql
# Cache hit ratio
rate(cache_hits_total[5m]) / 
  (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

### LLM

```
llm_inference_duration_seconds    # Histogram (model, endpoint)
llm_tokens_generated_total        # Counter (model)
llm_errors_total                  # Counter (model, error_type)
```

**Query Examples**:
```promql
# LLM generation time
histogram_quantile(0.95, rate(llm_inference_duration_seconds_bucket[5m]))

# Tokens per minute
rate(llm_tokens_generated_total[1m])

# Error rate by model
rate(llm_errors_total[5m]) by (model)
```

---

## 🎯 Common Metrics Patterns

### Request Success Rate

```promql
sum(rate(http_requests_total{status=~"2.."|"3.."}[5m])) / 
  sum(rate(http_requests_total[5m]))
```

### P99 Latency

```promql
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### Task Throughput

```promql
rate(task_executions_total[1m])
```

### System Health

```promql
(
  count(up{job="antigravity-backend"} == 1) /
  count(up{job="antigravity-backend"})
) * 100
```

### Resource Usage

```promql
# Memory usage %
(sum(container_memory_usage_bytes) / sum(container_spec_memory_limit_bytes)) * 100

# CPU usage %
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod) * 100
```

---

## 🚨 Alert Examples

### Create Alert Rule

**File**: Update `k8s/monitoring-config.yaml`:

```yaml
- alert: HighLLMLatency
  expr: |
    histogram_quantile(0.95, rate(llm_inference_duration_seconds_bucket[5m])) > 30
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "LLM inference latency is high"
    description: "95th percentile latency is {{ $value }}s"
```

### Task Failure Alert

```yaml
- alert: HighTaskFailureRate
  expr: |
    rate(task_executions_total{status="failure"}[5m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Task failure rate is high"
    description: "{{ $value | humanizePercentage }}"
```

### Database Connection Exhaustion

```yaml
- alert: DatabaseConnectionLeak
  expr: |
    database_connections > 90
  for: 3m
  labels:
    severity: critical
  annotations:
    summary: "Database connections exhausted"
    description: "{{ $value }} connections in use, max 100"
```

---

## 📝 Testing Metrics Locally

### Start Backend with Metrics

```bash
cd backend
npm install prom-client
npm run dev
```

### Test Metrics Endpoint

```bash
# View raw metrics
curl http://localhost:5000/metrics | head -50

# Search for specific metric
curl http://localhost:5000/metrics | grep http_requests_total

# Count total metrics
curl http://localhost:5000/metrics | wc -l
```

### Generate Some Traffic

```bash
# Make requests to generate metrics
curl http://localhost:5000/api/agents -H "Authorization: Bearer TOKEN"
curl -X POST http://localhost:5000/api/agents/test/tasks \
  -H "Content-Type: application/json" \
  -d '{}'

# View updated metrics
curl http://localhost:5000/metrics | grep -E "(http_requests|task_executions)"
```

---

## 🔍 Prometheus Scrape Verification

### Check Targets

```bash
# Port forward Prometheus
kubectl port-forward -n antigravity-system svc/prometheus 9090:9090

# Visit: http://localhost:9090/targets
# Look for "antigravity-backend" job with status "UP"
```

### Manual Query

```bash
# In Prometheus web UI: http://localhost:9090

# View all metrics from backend
{job="antigravity-backend"}

# View request rate
rate(http_requests_total{job="antigravity-backend"}[5m])

# View error rate
rate(http_requests_total{job="antigravity-backend",status=~"5.."}[5m])
```

---

## 🛠️ Troubleshooting

### Metrics endpoint not working

```bash
# Check if metrics middleware is installed
curl http://localhost:5000/metrics

# Check backend logs
kubectl logs -l component=backend

# Verify prom-client is installed
npm list prom-client
```

### Prometheus not scraping backend

```bash
# Verify backend /metrics endpoint accessible
kubectl exec -it <backend-pod> -- curl http://localhost:5000/metrics

# Check Prometheus config
kubectl get configmap prometheus-config -o yaml

# Check scrape jobs
curl http://prometheus:9090/api/v1/targets
```

### Missing metrics in Grafana

```bash
# Verify metric is being recorded
curl http://localhost:5000/metrics | grep <metric_name>

# Check Prometheus query
# Visit http://localhost:9090, run query directly

# Reload Grafana dashboard
# In Grafana: Dashboard settings → Reload
```

---

## 📚 Additional Resources

| Resource | Purpose |
|----------|---------|
| `prom-client` docs | https://github.com/siimon/prom-client |
| PromQL tutorial | https://prometheus.io/docs/prometheus/latest/querying/basics/ |
| Metric types | https://prometheus.io/docs/concepts/metric_types/ |
| Recording rules | https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/ |

---

## ✅ Integration Checklist

- [ ] Install `prom-client` dependency
- [ ] Add metrics middleware to server.js
- [ ] Implement task execution metrics
- [ ] Implement database metrics
- [ ] Implement cache metrics
- [ ] Implement LLM metrics
- [ ] Test `/metrics` endpoint locally
- [ ] Deploy to K8s
- [ ] Verify Prometheus scraping targets
- [ ] Create Grafana dashboards
- [ ] Set up alerts
- [ ] Monitor in production

---

**Integration Ready!** 🎉

Your metrics infrastructure is complete. Now integrate these functions into your application to start collecting comprehensive telemetry data.
