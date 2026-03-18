# Phase 5: Advanced Monitoring & Observability

**Status**: ✅ 100% Complete  
**Last Updated**: March 18, 2026  
**Features**: Prometheus, Grafana, Loki, Alertmanager

---

## 📊 Overview

Phase 5 adds enterprise-grade observability to the Antigravity platform with:

| Component | Purpose | Port | Status |
|-----------|---------|------|--------|
| **Prometheus** | Metrics collection & storage | 9090 | ✅ Ready |
| **Grafana** | Visualization & dashboards | 3000 | ✅ Ready |
| **Loki** | Log aggregation | 3100 | ✅ Ready |
| **Alertmanager** | Alert routing & management | 9093 | ✅ Ready |

---

## 🚀 Quick Start (5 minutes)

### Deploy Monitoring Stack

```bash
# Deploy using kubectl
kubectl apply -f k8s/monitoring-config.yaml
kubectl apply -f k8s/monitoring-stack.yaml

# Verify deployment
kubectl get pods -n antigravity-system -l component=monitoring
kubectl get svc -n antigravity-system -l component=monitoring
```

### Access Monitoring Tools

```bash
# Forward Prometheus
kubectl port-forward -n antigravity-system svc/prometheus 9090:9090
# Visit: http://localhost:9090

# Forward Grafana
kubectl port-forward -n antigravity-system svc/grafana 3000:3000
# Visit: http://localhost:3000
# Login: admin / (use secret or change password)

# Forward Loki
kubectl port-forward -n antigravity-system svc/loki 3100:3100
# Visit: http://localhost:3100/metrics

# Forward Alertmanager
kubectl port-forward -n antigravity-system svc/alertmanager 9093:9093
# Visit: http://localhost:9093
```

### Set Grafana Admin Password

```bash
kubectl create secret generic grafana-secrets \
  -n antigravity-system \
  --from-literal=admin-password=$(openssl rand -base64 12)

# Or retrieve existing password
kubectl get secret grafana-secrets -n antigravity-system \
  -o jsonpath='{.data.admin-password}' | base64 -d
```

---

## 📈 Prometheus Configuration

### What's Being Scraped

| Job | Sources | Interval | Metrics |
|-----|---------|----------|---------|
| backend | HTTP API endpoints | 30s | Request rate, latency, errors |
| postgresql | Database connections | 30s | Connections, queries, uptime |
| redis | Cache statistics | 30s | Memory, evictions, hit rate |
| ollama | LLM performance | 30s | Inference time, model load |
| kubelet | Node metrics | 30s | CPU, memory, disk resources |
| node-exporter | Host metrics | 15s | System CPU, memory, network |

### Prometheus Queries (PromQL)

**Request Metrics**
```promql
# Requests per second
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Request count by endpoint
sum(rate(http_requests_total[5m])) by (endpoint)
```

**Database Metrics**
```promql
# Active connections
pg_stat_activity_count

# Database size
pg_database_size_bytes

# Cache hit ratio
rate(pg_stat_user_tables_seq_scan[5m]) / 
(rate(pg_stat_user_tables_seq_scan[5m]) + rate(pg_stat_user_tables_idx_scan[5m]))

# Query performance
pg_slow_queries_total
```

**System Metrics**
```promql
# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# CPU usage
rate(node_cpu_seconds_total[5m])

# Disk I/O
rate(node_disk_io_time_ms[5m])
```

**Task Execution Metrics**
```promql
# Tasks executed per minute
rate(task_executions_total[1m])

# Failure rate
rate(task_executions_failed_total[5m])

# Average execution time
task_execution_duration_seconds / task_executions_total

# Queue depth
task_queue_depth
```

---

## 📊 Grafana Dashboards

### Built-in Dashboards

#### 1. Main Metrics Dashboard
**File**: `monitoring/grafana-dashboard.json`

**Panels**:
- Request Rate (requests/sec)
- Memory Usage (%)
- Request Latency (P50, P95, P99)
- HTTP Status Distribution (2xx, 4xx, 5xx)
- Task Executions
- Database Connections

**Time Range**: Last 1 hour (auto-refresh 30s)

#### 2. Create Custom Dashboard

1. **Open Grafana**: http://localhost:3000
2. **Create Dashboard**: `+` → Dashboard
3. **Add Panel**: `Add Panel`
4. **Configure**:
   - Data source: `Prometheus`
   - Metrics: Use queries from above
   - Visualization: Graph, Gauge, Stat, etc.
5. **Save**: Press `Ctrl+S`

### Dashboard Templates

**Backend Performance**
```promql
# Request rate with endpoints
sum(rate(http_requests_total[1m])) by (endpoint)

# Error percentage
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# Latency percentiles
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

**Database Health**
```promql
# Connection pool usage
pg_stat_activity_count / 100 * 100

# Slow queries
increase(pg_slow_queries_total[5m])

# Database size growth
increase(pg_database_size_bytes[1h])
```

**Task Execution**
```promql
# Success rate
rate(task_executions_succeeded_total[5m]) / rate(task_executions_total[5m])

# Average duration
increase(task_execution_duration_sum[5m]) / increase(task_executions_total[5m])

# Queue status
min(task_queue_depth) ... max(task_queue_depth)
```

---

## 📝 Loki Log Aggregation

### What Logs Are Collected

| Source | Labels | Retention |
|--------|--------|-----------|
| Backend pods | `job=backend`, `pod`, `namespace` | 30 days |
| Database | `job=postgresql`, `instance` | 30 days |
| Loki itself | `job=loki` | 30 days |
| Kubernetes | `cluster`, `namespace`, `pod` | 30 days |

### Loki LogQL Queries

**Backend Logs**
```logql
# All backend logs
{job="backend"}

# Error logs only
{job="backend"} |= "error" or "ERROR"

# Specific pod
{pod="antigravity-backend-xyz"}

# Last 1 hour
{job="backend"} | range(1h)
```

**Database Logs**
```logql
# PostgreSQL slow queries
{job="postgresql"} |~ "duration.*ms"

# Connection errors
{job="postgresql"} |= "connection"

# Authentication failures
{job="postgresql"} |= "failed"
```

**Kubernetes Logs**
```logql
# All application logs
{namespace="antigravity-system"}

# Crashed pods
{namespace="antigravity-system"} |= "panic" or "FATAL"

# Deployment logs
{pod=~"antigravity-backend-.*"}
```

### View Logs in Grafana

1. **Open Grafana**
2. **Data source**: Select `Loki`
3. **Query**: Enter LogQL above
4. **Run**: Click `Run`
5. **Timeline**: Adjust time range as needed

---

## 🚨 Alerting System

### Alert Rules

**Critical Alerts** (immediate notification)
- Backend down (2 min)
- Node not ready (5 min)
- Pod crash looping (5 min)

**Warning Alerts** (monitoring)
- High error rate > 5% (5 min)
- Slow responses > 1s P95 (5 min)
- High memory usage > 85% (3 min)
- Database connections > 80 (5 min)

**Info Alerts** (tracking)
- Long running tasks > 1 hour
- Model loading failures

### Alert Configuration

**Alert Rules File**: `k8s/monitoring-config.yaml`

```yaml
alert: BackendDown
expr: up{job="antigravity-backend"} == 0
for: 2m
labels:
  severity: critical
annotations:
  summary: "Backend is down"
```

### Alertmanager Routing

**File**: `k8s/monitoring-config.yaml`

```yaml
route:
  group_by: ['alertname', 'cluster']
  routes:
    - match:
        severity: critical
      receiver: 'critical'
    - match:
        severity: warning
      receiver: 'warning'
```

### Receive Alerts

**Webhook Integration**
```bash
# Alerts sent to your webhook
POST /alerts
{
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "BackendDown",
        "severity": "critical"
      },
      "annotations": {
        "summary": "Backend is down",
        "description": "Backend pod xyz unavailable"
      }
    }
  ]
}
```

**Add Custom Receiver**
```yaml
receivers:
  - name: slack
    slack_configs:
      - api_url: https://hooks.slack.com/services/YOUR/WEBHOOK
        channel: #alerts
        title: "Alert: {{ .GroupLabels.alertname }}"
```

---

## 🔧 Advanced Configuration

### Enable Metrics Scraping

**Backend Application** (`backend/api/server.js`):
```javascript
const prometheus = require('prom-client');

// Default metrics
prometheus.collectDefaultMetrics();

// Custom metrics
const httpDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpDuration.observe(duration);
  });
  next();
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

### PostgreSQL Monitoring

**Install PG Exporter**:
```bash
# Run in K8s
kubectl create secret generic postgres-creds \
  -n antigravity-system \
  --from-literal=user=monitoring \
  --from-literal=password=$(openssl rand -base64 12)
```

**Add Service Monitor**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-exporter
  annotations:
    prometheus.io/scrape: 'true'
    prometheus.io/port: '9187'
spec:
  ports:
  - port: 9187
    targetPort: 9187
  selector:
    app: postgres-exporter
```

### Retention Policies

**Prometheus** (30 days):
```bash
--storage.tsdb.retention.time=30d
```

**Loki** (30 days):
```yaml
retention_enabled: true
retention_period: 720h
```

**Grafana** (no limit, depends on backend):
- Provisioned dashboards: persisted
- User dashboards: stored in DB

---

## 📊 Performance Tuning

### Prometheus Optimization

**Reduce cardinality**:
```promql
# Bad: High cardinality labels
http_requests_total{path="/api/agents/123/tasks/456..."}

# Good: Aggregated
http_requests_total{endpoint="/api/agents/:id/tasks/:id"}
```

**Storage optimization**:
```bash
# Adjust scrape intervals for less critical jobs
- job_name: 'low-priority'
  scrape_interval: 5m  # Default 30s
```

### Grafana Performance

**Dashboard optimization**:
- Limit panels to 10-15 per dashboard
- Use sampling for large datasets: `$__interval`
- Cache query results: 1m minimum

**Example**:
```promql
# Sampled data
avg(rate(http_requests_total[$__interval])) by (instance)
```

### Loki Optimization

**Log label tuning**:
```yaml
# Too many labels = high cardinality
{job, pod, container, stream, level, format}

# Better: Few static labels
{job, namespace, level}
```

**Query optimization**:
```logql
# Slow: Parsing every log
{job="backend"} | json | level="error"

# Fast: Pre-filtering with labels
{job="backend", level="error"}
```

---

## 🛠️ Troubleshooting

### Prometheus not scraping

```bash
# Check targets
curl http://prometheus:9090/api/v1/targets

# View scrape config
kubectl get configmap prometheus-config -o yaml

# Check metrics
curl http://<backend-pod>:5000/metrics | head -20
```

### Grafana dashboards empty

```bash
# Verify Prometheus datasource
curl http://prometheus:9090/api/v1/query?query=up

# Check query in Grafana
- Go to Dashboard → Edit Panel → Edit Panel
- Check "Datasource" is "Prometheus"
- Run query manually in Prometheus web UI
```

### Loki not receiving logs

```bash
# Check Loki status
kubectl logs -n antigravity-system -l app=loki

# Test log ingestion
curl -X POST http://loki:3100/loki/api/v1/push \
  -H "Content-Type: application/json" \
  -d '{
    "streams": [{
      "stream": {"job":"test"},
      "values": [["'$(date +%s%N)'", "test message"]]
    }]
  }'
```

### Alerts not firing

```bash
# Check Prometheus rule evaluation
curl http://prometheus:9090/api/v1/rules

# Check alert status
curl http://prometheus:9090/api/v1/alerts

# View Alertmanager
curl http://alertmanager:9093/api/v1/alerts
```

---

## 📈 Monitoring Best Practices

### What to Monitor

**System Level**:
- CPU and memory usage
- Disk space and I/O
- Network latency
- Pod restart count

**Application Level**:
- Request rate and error rate
- Response latency (p50, p95, p99)
- Queue depth and processing time
- Cache hit/miss ratio

**Business Level**:
- Task completion rate
- Agent success rate
- User/API key usage
- Cost (if cloud)

### Alert Best Practices

**DO**:
- ✅ Alert on symptoms, not causes
- ✅ Include actionable context
- ✅ Set appropriate thresholds
- ✅ Use runbooks for critical alerts
- ✅ Group related alerts

**DON'T**:
- ❌ Alert on every anomaly
- ❌ Alert below 15 minute threshold
- ❌ Use static thresholds for volatile metrics
- ❌ Alert on things you can't act on
- ❌ Ignore alerts ("alert fatigue")

### Example Runbook

**Alert**: BackendDown

**Steps**:
1. Check pod status: `kubectl describe pod <pod>`
2. View logs: `kubectl logs <pod> --tail=50`
3. Restart pod: `kubectl delete pod <pod>`
4. Verify: `curl http://localhost:5000/health`
5. If issue persists: Escalate to on-call engineer

---

## 📚 File Reference

| File | Purpose | Lines |
|------|---------|-------|
| `monitoring/prometheus-config.yaml` | Prometheus scrape jobs | 80+ |
| `monitoring/alert-rules.yaml` | Alert rule definitions | 200+ |
| `monitoring/grafana-dashboard.json` | Main dashboard | 400+ |
| `monitoring/loki-config.yaml` | Log aggregation config | 40+ |
| `k8s/monitoring-stack.yaml` | K8s deployments | 450+ |
| `k8s/monitoring-config.yaml` | ConfigMaps and rules | 250+ |

**Total Phase 5 Lines**: **1,500+ lines**

---

## 🎯 Next Steps

### Coming Soon (Phase 6+)

- **GitOps**: ArgoCD for continuous deployment
- **Service Mesh**: Istio for advanced networking
- **Security**: Falco for runtime security
- **Compliance**: Audit logging and RBAC enhancements
- **Performance**: APM (Application Performance Monitoring)

### Immediate Actions

1. ✅ Deploy monitoring stack
2. ✅ Configure Prometheus scraping
3. ✅ Access Grafana dashboards
4. ✅ Set up alert receivers (webhook/Slack)
5. ✅ Create custom dashboards for your needs
6. ✅ Test alert routing

---

## 📞 Support & Documentation

**Prometheus**:
- Main URL: `http://prometheus:9090`
- Docs: [prometheus.io](https://prometheus.io)
- PromQL Cheatsheet: [grafana.com](https://grafana.com/docs/grafana/latest/panels-visualizations/query-editor/prometheus/)

**Grafana**:
- Main URL: `http://localhost:3000`
- Documentation: [grafana.com/docs](https://grafana.com/docs/grafana/latest/)
- Dashboards: [grafana.com/grafana/dashboards](https://grafana.com/grafana/dashboards)

**Loki**:
- Documentation: [grafana.com/docs/loki](https://grafana.com/docs/loki/latest/)
- LogQL: [LogQL syntax guide](https://grafana.com/docs/loki/latest/logql/)

**Alertmanager**:
- Documentation: [prometheus.io/docs/alerting](https://prometheus.io/docs/alerting/latest/)

---

**Phase 5 Complete! 🎉**

Your platform now has enterprise-grade observability with:
- ✅ Metrics collection (Prometheus)
- ✅ Visualization (Grafana)
- ✅ Log aggregation (Loki)
- ✅ Alert management (Alertmanager)
- ✅ Custom dashboards
- ✅ Alert routing
- ✅ Performance tuning

**All files deployed and ready to monitor your platform!**
