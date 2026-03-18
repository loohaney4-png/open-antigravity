# Production Deployment Guide

This guide covers deploying Open-Antigravity to production environments.

## Table of Contents

1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Monitoring and Alerts](#monitoring-and-alerts)
7. [Scaling](#scaling)
8. [Backup and Recovery](#backup-and-recovery)

## Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates obtained
- [ ] Rate limits configured for your scale
- [ ] Monitoring and alerting setup
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Disaster recovery plan in place
- [ ] Team trained on operations

## Environment Configuration

### Essential Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DB_HOST=postgres.example.com
DB_PORT=5432
DB_NAME=antigravity_prod
DB_USER=app_user
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Authentication
JWT_SECRET=generate_secure_random_secret
REFRESH_TOKEN_SECRET=generate_another_secret
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# API Configuration
ALLOWED_ORIGINS=https://app.example.com
CORS_CREDENTIALS=true

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Security
ENCRYPTION_KEY=generate_32_byte_key
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
DATADOG_API_KEY=...
```

### Securing Secrets

**Do NOT commit secrets to version control.**

Use a secret management solution:

```bash
# AWS Secrets Manager
aws secretsmanager create-secret --name antigravity/prod \
  --secret-string file://secrets.json

# HashiCorp Vault
vault kv put secret/antigravity/prod @secrets.json

# Docker Secrets (Swarm)
docker secret create antigravity_jwt_secret jwt_secret.txt

# Kubernetes Secrets
kubectl create secret generic antigravity-secrets \
  --from-literal=jwt-secret=... \
  --from-literal=db-password=...
```

## Database Setup

### PostgreSQL Initialization

```bash
# Connect to PostgreSQL
psql -h postgres.example.com -U postgres

# Create database and user
CREATE DATABASE antigravity_prod;
CREATE USER app_user WITH PASSWORD 'secure_password';
ALTER ROLE app_user SET client_encoding TO 'utf8';
ALTER ROLE app_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE app_user SET default_transaction_deferrable TO on;
ALTER ROLE app_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE antigravity_prod TO app_user;
\c antigravity_prod
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO app_user;
```

### Run Migrations

```bash
# From application directory
npm run migrate:prod

# Or manually
psql -h postgres.example.com -U app_user -d antigravity_prod -f migrations/*.sql
```

### Backup Strategy

```bash
# Daily automated backup
0 2 * * * pg_dump -h postgres.example.com -U app_user antigravity_prod | \
  gzip > /backups/antigravity_$(date +\%Y\%m\%d).sql.gz

# Upload to S3
0 3 * * * aws s3 sync /backups/ s3://backup-bucket/antigravity/
```

## Docker Deployment

### Build Production Image

```bash
# Build image
docker build -f Dockerfile.prod -t antigravity:latest .

# Tag and push
docker tag antigravity:latest registry.example.com/antigravity:latest
docker push registry.example.com/antigravity:latest
```

### Run with Docker Compose

```yaml
version: '3.8'
services:
  backend:
    image: registry.example.com/antigravity:latest
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - REDIS_HOST=redis
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - antigravity-net

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: antigravity_prod
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - antigravity-net

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - antigravity-net

volumes:
  db_data:
  redis_data:

networks:
  antigravity-net:
    driver: bridge
```

## Kubernetes Deployment

### Prerequisites

```bash
# Create namespace
kubectl create namespace antigravity

# Create secrets
kubectl create secret generic antigravity-secrets \
  -n antigravity \
  --from-literal=jwt-secret=... \
  --from-literal=db-password=...
```

### Deploy Application

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: antigravity-config
  namespace: antigravity
data:
  LOG_LEVEL: "info"
  NODE_ENV: "production"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: antigravity-backend
  namespace: antigravity
spec:
  replicas: 3
  selector:
    matchLabels:
      app: antigravity-backend
  template:
    metadata:
      labels:
        app: antigravity-backend
    spec:
      containers:
      - name: backend
        image: registry.example.com/antigravity:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "postgres.default.svc.cluster.local"
        - name: REDIS_HOST
          value: "redis.default.svc.cluster.local"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: antigravity-secrets
              key: jwt-secret
        envFrom:
        - configMapRef:
            name: antigravity-config
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: antigravity-backend
  namespace: antigravity
spec:
  selector:
    app: antigravity-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Deploy Postgres

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: antigravity
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: antigravity
type: Opaque
data:
  password: $(echo -n 'password' | base64)
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: antigravity
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "antigravity_prod"
        - name: POSTGRES_USER
          value: "app_user"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

## Monitoring and Alerts

### Health Checks

API provides health endpoints:

```bash
# Check service health
curl http://localhost:3000/health

# Get health history
curl http://localhost:3000/health/history

# Get metrics
curl http://localhost:3000/api/metrics
```

### Prometheus Setup

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'antigravity'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### Alert Rules

```yaml
groups:
  - name: antigravity
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: |
        (increase(http_requests_total{status=~"5.."}[5m]) / 
         increase(http_requests_total[5m])) > 0.05
      annotations:
        summary: "High error rate detected"

    - alert: HighResponseTime
      expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
      annotations:
        summary: "High response time detected"

    - alert: LowDiskSpace
      expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
      annotations:
        summary: "Low disk space warning"
```

## Scaling

### Horizontal Scaling

```bash
# Increase replicas
kubectl scale deployment antigravity-backend \
  -n antigravity \
  --replicas=5

# Auto-scaling based on CPU
kubectl autoscale deployment antigravity-backend \
  -n antigravity \
  --min=3 --max=10 \
  --cpu-percent=80
```

### Load Balancing

Use cloud provider load balancer or setup with Nginx:

```nginx
upstream antigravity {
    server backend1.example.com:3000;
    server backend2.example.com:3000;
    server backend3.example.com:3000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://antigravity;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/antigravity"

# Backup database
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /app

# Upload to S3
aws s3 sync $BACKUP_DIR s3://backup-bucket/antigravity/
```

### Recovery Procedures

```bash
# Restore database
gunzip < $BACKUP_DIR/db_$DATE.sql.gz | \
  psql -h $DB_HOST -U $DB_USER $DB_NAME

# Restore application
tar -xzf $BACKUP_DIR/app_$DATE.tar.gz -C /
```

## Maintenance

### Regular Tasks

- Monitor logs and metrics daily
- Update dependencies monthly
- Rotate secrets quarterly
- Review and optimize queries
- Audit access logs
- Test backup/restore procedures

### Version Updates

```bash
# Tag current state
git tag -a v1.0.0 -m "Production release 1.0.0"

# Deploy new version
docker build -t antigravity:v1.0.1 .
docker push registry.example.com/antigravity:v1.0.1

# Rolling update in Kubernetes
kubectl set image deployment/antigravity-backend \
  antigravity=registry.example.com/antigravity:v1.0.1 \
  -n antigravity

# Check rollout status
kubectl rollout status deployment/antigravity-backend -n antigravity
```

## Support and Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker logs <container_id>

# Check resource usage
kubectl top pods -n antigravity

# Describe pod for events
kubectl describe pod <pod_name> -n antigravity
```

**High memory usage:**
```bash
# Get metrics
curl http://localhost:3000/api/metrics | jq .

# Check Node.js memory
ps aux | grep node
```

**Database connection issues:**
```bash
# Test database connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check connection pool
curl http://localhost:3000/health | jq .
```

## Further Reading

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [12 Factor App](https://12factor.net/)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Production Readiness](https://kubernetes.io/docs/setup/production-environment/)
