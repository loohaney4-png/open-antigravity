# Operations Guide

Comprehensive guide for running and maintaining Open-Antigravity in production.

## Table of Contents

1. [Startup and Shutdown](#startup-and-shutdown)
2. [Monitoring](#monitoring)
3. [Troubleshooting](#troubleshooting)
4. [Performance Tuning](#performance-tuning)
5. [Security Operations](#security-operations)
6. [Backup and Recovery](#backup-and-recovery)

## Startup and Shutdown

### Development Mode

```bash
# Development with auto-reload
npm run dev

# Logs
tail -f logs/app.log

# Check health
curl http://localhost:3000/health
```

### Production Mode

```bash
# Using Node
npm start

# Using Docker
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Graceful Shutdown

```bash
# Docker Compose
docker-compose down

# Process manager (PM2)
pm2 stop app
pm2 delete app

# The application handles SIGTERM gracefully
kill -TERM <pid>
```

## Monitoring

### Health Status

```bash
# System health
curl http://localhost:3000/health

# Response format:
# {
#   "status": "healthy",
#   "checks": {
#     "memory": { "status": "healthy", ... },
#     "cpu": { "status": "healthy", ... },
#     "metrics": { "status": "healthy", ... }
#   }
# }
```

### API Metrics

```bash
# Get all metrics
curl http://localhost:3000/api/metrics

# Get API metrics only
curl http://localhost:3000/api/metrics/api

# Response includes:
# - Total requests
# - Error count
# - Average response time
# - Requests per minute
# - Error rate percentage
```

### Viewing Logs

```bash
# Application logs
tail -f logs/app.log

# Error logs
grep ERROR logs/app.log | tail -20

# Specific module logs
grep "Agent Orchestrator" logs/app.log

# Tail with grep filter
tail -f logs/app.log | grep "ERROR\|WARN"
```

### Admin Dashboard

Access the admin dashboard:
```
http://localhost:3000/admin
```

Features:
- Real-time metrics visualization
- System health overview
- Agent performance tracking
- User activity monitoring
- Security audit trail

### Setting Up Monitoring Tools

#### Prometheus

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'antigravity'
    static_configs:
      - targets: ['localhost:3000']
```

#### Grafana

```bash
# Start Grafana
docker run -d --name=grafana -p 3001:3000 grafana/grafana

# Access at http://localhost:3001
# Default: admin/admin
```

## Troubleshooting

### Service Won't Start

```bash
# Check port in use
lsof -i :3000

# Check service logs
docker logs <container_id>

# Check dependencies
curl http://postgres-host:5432  # Test DB connection
redis-cli -h redis-host ping    # Test Redis

# Start with debug logging
LOG_LEVEL=debug npm start
```

### High Memory Usage

```bash
# Check memory metrics
curl http://localhost:3000/api/metrics | jq '.api, .agents'

# Node.js heap dump
node --heap-prof server.js

# Analyze with clinic.js
npm install -g clinic
clinic doctor -- node server.js
```

### Database Connection Issues

```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check connection pool
curl http://localhost:3000/health | jq '.checks.database'

# View active connections
psql -h $DB_HOST -U postgres -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname"
```

### Agent Not Responding

```bash
# Check agent status
curl http://localhost:3000/api/agents/<agent-id>

# View agent logs
curl http://localhost:3000/api/agents/<agent-id>/logs

# Restart agent
curl -X POST http://localhost:3000/api/agents/<agent-id>/restart

# Check metrics for that agent
curl http://localhost:3000/api/metrics/agent/<agent-id>
```

### Rate Limiting Issues

```bash
# Check rate limit settings
curl http://localhost:3000/api/config | jq '.rateLimits'

# Current usage
curl http://localhost:3000/api/metrics/api | jq '.requestsPerMinute'

# Reset rate limit (admin only)
curl -X POST http://localhost:3000/api/rate-limit/reset \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## Performance Tuning

### Node.js Configuration

```bash
# Increase file descriptor limit
ulimit -n 65536

# Set node options
export NODE_OPTIONS="--max-old-space-size=2048 --expose-gc"

# Start with performance monitoring
node --prof server.js
# Analyze with: node --prof-process isolate-*.log > results.txt
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM agents WHERE user_id = 1;

-- Vacuum database
VACUUM ANALYZE;
```

### Redis Cache Configuration

```bash
# Enable persistence
redis-cli CONFIG SET appendonly yes

# Increase memory limit
redis-cli CONFIG SET maxmemory 2gb

# Monitor connections
redis-cli CLIENT LIST

# Check memory usage
redis-cli INFO memory
```

### Load Balancing

```nginx
# Nginx upstream configuration
upstream antigravity {
    least_conn;  # Use least connections algorithm
    
    server backend1:3000 weight=2;
    server backend2:3000 weight=2;
    server backend3:3000 weight=1 backup;
    
    keepalive 32;
}

server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://antigravity;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

## Security Operations

### Regular Security Tasks

```bash
# Monthly: Update dependencies
npm audit
npm audit fix
npm install

# Quarterly: Rotate secrets
./scripts/rotate-secrets.sh

# Weekly: Check security logs
curl http://localhost:3000/api/audit?type=AUTH \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Daily: Review failed logins
curl http://localhost:3000/api/audit?type=AUTH&action=login \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | select(.success == false)'
```

### Incident Response

```bash
# Disable compromised user
curl -X POST http://localhost:3000/api/admin/users/<user-id>/disable \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Reset user password
curl -X POST http://localhost:3000/api/admin/users/<user-id>/reset-password \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Revoke all sessions
curl -X POST http://localhost:3000/api/admin/users/<user-id>/revoke-sessions \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Export security logs
curl http://localhost:3000/api/audit/export?format=csv \
  -H "Authorization: Bearer $ADMIN_TOKEN" > audit.csv
```

### SSL/TLS Management

```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365

# Check certificate expiry
openssl x509 -in cert.pem -noout -dates

# Renew with Let's Encrypt
certbot renew --cert-name antigravity.example.com

# Update in application
export SSL_CERT_PATH=/path/to/cert.pem
export SSL_KEY_PATH=/path/to/key.pem
npm start
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/antigravity"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
  --exclude node_modules \
  --exclude logs \
  /app

# Backup Redis
redis-cli -h $REDIS_HOST --rdb /backups/dump.rdb

# Upload to S3
aws s3 sync $BACKUP_DIR s3://backup-bucket/antigravity/daily/

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Recovery Procedures

```bash
# Restore database
gunzip < /backups/antigravity/db_20240101_120000.sql.gz | \
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Restore application
tar -xzf /backups/antigravity/app_20240101_120000.tar.gz -C /

# Restore Redis
redis-cli -h $REDIS_HOST FLUSHALL
redis-cli -h $REDIS_HOST --pipe < /backups/dump.rdb

# Verify data integrity
curl http://localhost:3000/health
npm test

# Check data consistency
curl http://localhost:3000/api/agents | jq '.length'
```

## Maintenance Mode

### Enabling Maintenance Mode

```bash
# Set maintenance mode
export MAINTENANCE_MODE=true

# Deploy message
curl -X POST http://localhost:3000/api/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"message": "System maintenance in progress"}'

# Gracefully stop accepting new requests
npm run maintenance
```

### Performing Maintenance

```bash
# During maintenance:
# 1. Stop accepting new connections
# 2. Wait for in-flight requests to complete
# 3. Run database migrations
# 4. Update dependencies
# 5. Deploy code changes
# 6. Run tests
# 7. Restore service

# Run migrations
npm run migrate

# Run tests
npm test

# Check health
curl http://localhost:3000/health
```

### Resuming Service

```bash
# Disable maintenance mode
export MAINTENANCE_MODE=false

# Resuming service
curl -X POST http://localhost:3000/api/maintenance/resume \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Verify health
curl http://localhost:3000/health

# Monitor logs for errors
tail -f logs/app.log
```

## Runbooks

### Common Operational Procedures

#### Agent is Stuck

1. Check agent status: `curl http://localhost:3000/api/agents/<id>`
2. View recent logs: `curl http://localhost:3000/api/agents/<id>/logs`
3. Kill stuck task: `curl -X POST http://localhost:3000/api/agents/<id>/tasks/<task-id>/kill`
4. Force restart: `curl -X POST http://localhost:3000/api/agents/<id>/restart`
5. Monitor recovery: `tail -f logs/app.log`

#### Database Connection Pool Exhausted

1. View connections: `curl http://localhost:3000/health`
2. Identify slow queries: `psql -c "SELECT * FROM pg_stat_statements ORDER BY mean_time DESC"`
3. Kill stuck connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle'`
4. Restart service: `docker-compose restart backend`

#### Out of Disk Space

1. Check usage: `df -h`
2. Identify large files: `du -sh /var/log/* /backups/*`
3. Clean old logs: `find logs/ -mtime +30 -delete`
4. Clean old backups: `find /backups -mtime +7 -delete`
5. Monitor recovery: `df -h`

## Emergency Contacts

- Performance Issues: `devops@example.com`
- Database Issues: `dba@example.com`
- Security Issues: `security@example.com`
- General Support: `support@example.com`
