# Kubernetes Deployment Guide

This guide covers deploying Open-Antigravity on Kubernetes using CRDs, Helm, and Kustomize.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Configuration](#configuration)
4. [Custom Resources](#custom-resources)
5. [Troubleshooting](#troubleshooting)
6. [Production Recommendations](#production-recommendations)

---

## Prerequisites

### Cluster Requirements

- Kubernetes 1.20+
- Helm 3.0+
- Kustomize 4.0+
- kubectl configured with cluster access

### Disk & Memory

| Component | Min CPU | Min Memory | Recommended CPU | Recommended Memory |
|-----------|---------|------------|-----------------|-------------------|
| Backend (per replica) | 100m | 128Mi | 500m | 512Mi |
| Ollama | 1000m | 4Gi | 2000m | 8Gi |
| PostgreSQL | 100m | 256Mi | 500m | 1Gi |
| Redis | 50m | 128Mi | 200m | 512Mi |
| **Total (minimum)** | **1.25** | **4.5Gi** | **3.2** | **10Gi** |

### Storage Classes

Ensure your cluster has a StorageClass for persistent volumes:

```bash
kubectl get storageclasses
```

If none exists, create a default:

```bash
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml
```

---

## Installation Methods

### Method 1: Helm (Recommended for Production)

#### Step 1: Add Helm Repository

```bash
# If hosted on GitHub Pages or similar
helm repo add open-antigravity https://your-repo-url
helm repo update
```

Or use local chart:

```bash
cd helm/
```

#### Step 2: Create Values File

Copy and customize values:

```bash
cp helm/values.yaml my-values.yaml
```

Edit `my-values.yaml` with your settings:

```yaml
global:
  domain: your-domain.com
  environment: production

backend:
  replicaCount: 3
  
postgres:
  password: "your-secure-password"  # Change this!

ollama:
  models:
    - mistral
    - neural-chat

ingress:
  hosts:
    - host: antigravity.your-domain.com
```

#### Step 3: Install Release

```bash
helm install open-antigravity ./helm -f my-values.yaml -n antigravity-system --create-namespace
```

#### Step 4: Verify Installation

```bash
kubectl get all -n antigravity-system
kubectl get agents -A
kubectl get tasks -A
```

---

### Method 2: Kustomize (Recommended for GitOps)

#### Development Environment

```bash
# Apply development configuration
kubectl apply -k k8s/kustomize/overlays/dev

# Verify
kubectl get pods -n antigravity-system
kubectl logs -n antigravity-system -l app=antigravity -f
```

#### Staging Environment

```bash
# Update environment-specific secrets
cd k8s/kustomize/overlays/staging
cat > secrets.env <<EOF
JWT_SECRET=your-staging-secret
POSTGRES_PASSWORD=your-staging-password
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
EOF

# Apply staging configuration
kubectl apply -k .
```

#### Production Environment

```bash
# Update environment-specific secrets
cd k8s/kustomize/overlays/production
cat > secrets.env <<EOF
JWT_SECRET=your-production-secret
POSTGRES_PASSWORD=your-production-password
OPENAI_API_KEY="sk-..."  # Optional
ANTHROPIC_API_KEY="sk-..."  # Optional
EOF

# Apply production configuration
kubectl apply -k .

# Verify rollout
kubectl rollout status deployment/antigravity-backend -n antigravity-system
```

---

### Method 3: Manual YAML Files

```bash
# Create CRDs
kubectl apply -f k8s/crds/

# Create RBAC
kubectl apply -f k8s/rbac.yaml

# Create Database and Cache
kubectl apply -f k8s/database.yaml

# Deploy Backend and Ollama
kubectl apply -f k8s/deployment.yaml

# Verify all components
kubectl get crds | grep antigravity
kubectl get pods -n antigravity-system
```

---

## Configuration

### Custom Resource: Agent

Create an agent with the Agent CRD:

```yaml
apiVersion: antigravity.io/v1
kind: Agent
metadata:
  name: researcher-bot
  namespace: antigravity-system
spec:
  name: "Researcher Bot"
  role: researcher
  model: mistral
  replicas: 2
  instructions: "You are a research assistant specializing in technical analysis"
  resourceRequirements:
    requests:
      cpu: 250m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 80
```

Apply it:

```bash
kubectl apply -f agent.yaml

# View created agent
kubectl get agents
kubectl describe agent researcher-bot
```

### Custom Resource: Task

Add a task for an agent to execute:

```yaml
apiVersion: antigravity.io/v1
kind: Task
metadata:
  name: analyze-report
  namespace: antigravity-system
spec:
  agentId: researcher-bot
  description: "Analyze market trends in Q1 2026"
  priority: high
  timeout: 1800
  context:
    market: technology
    timeframe: Q1-2026
  retryPolicy:
    maxRetries: 3
    backoffSeconds: 5
    exponentialBackoff: true
```

Create it:

```bash
kubectl apply -f task.yaml

# Monitor task status
kubectl get tasks
kubectl describe task analyze-report
kubectl logs -n antigravity-system -l taskId=analyze-report
```

---

## Troubleshooting

### Check Pod Status

```bash
# All pods
kubectl get pods -n antigravity-system

# Detailed info
kubectl describe pod <pod-name> -n antigravity-system

# Check logs
kubectl logs <pod-name> -n antigravity-system
kubectl logs -n antigravity-system -l app=antigravity --tail=100 -f
```

### Database Connectivity

```bash
# Check postgres pod
kubectl get pods -n antigravity-system | grep postgres
kubectl logs -n antigravity-system postgres-0

# Connect to database
kubectl exec -it postgres-0 -n antigravity-system -- \
  psql -U antigravity -d antigravity

# Verify migrations ran
SELECT * FROM agents;
SELECT * FROM tasks;
```

### Ollama Status

```bash
# Check ollama pod
kubectl get pods -n antigravity-system | grep ollama
kubectl logs -n antigravity-system -l app=ollama -f

# Check available models
kubectl exec -it <ollama-pod> -n antigravity-system -- ollama list

# If models missing, pull them
kubectl exec -it <ollama-pod> -n antigravity-system -- ollama pull mistral
```

### Backend Health

```bash
# Port forward for testing
kubectl port-forward -n antigravity-system svc/antigravity-backend 5000:5000

# In another terminal
curl http://localhost:5000/health

# Check logs for errors
kubectl logs -n antigravity-system -l component=backend --tail=50 -f
```

### Persistent Volume Issues

```bash
# Check PVCs
kubectl get pvc -n antigravity-system

# Check if bound to PVs
kubectl describe pvc -n antigravity-system

# For stuck PVCs
kubectl delete pvc <pvc-name> -n antigravity-system --grace-period=0 --force
```

---

## Production Recommendations

### Security

```bash
# Enable Network Policies
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: antigravity-deny-all
  namespace: antigravity-system
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: antigravity-allow-internal
  namespace: antigravity-system
spec:
  podSelector:
    matchLabels:
      app: antigravity
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: antigravity-system
EOF
```

### Monitoring

```bash
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# Install Grafana dashboards
helm install grafana grafana/grafana

# Port forward Grafana
kubectl port-forward -n default svc/grafana 3000:80
```

### Backup & Restore

```bash
# Backup PostgreSQL
kubectl exec -it postgres-0 -n antigravity-system -- \
  pg_dump -U antigravity antigravity > backup.sql

# Restore PostgreSQL
kubectl exec -i postgres-0 -n antigravity-system -- \
  psql -U antigravity antigravity < backup.sql
```

### Auto-Scaling

Enable HPA for backend:

```bash
kubectl autoscale deployment antigravity-backend \
  --min=2 --max=10 \
  --cpu-percent=80 \
  -n antigravity-system
```

### SSL/TLS with Let's Encrypt

```bash
# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager --create-namespace

# Create issuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@your-domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

## Useful Commands

```bash
# View all resources
kubectl get all -n antigravity-system

# Watch deployments
kubectl rollout status deployment/antigravity-backend -n antigravity-system -w

# Scale deployment
kubectl scale deployment antigravity-backend --replicas=5 -n antigravity-system

# Update image
kubectl set image deployment/antigravity-backend \
  backend=open-antigravity/backend:v1.1.0 \
  -n antigravity-system

# Check resource usage
kubectl top nodes
kubectl top pods -n antigravity-system

# Delete everything
kubectl delete namespace antigravity-system
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Pods pending | Check `describe pod` for resource/scheduling issues |
| Backend can't reach Ollama | Check service DNS: `ollama:11434` |
| Database migration failed | Check postgres logs, ensure storage available |
| High Ollama memory usage | Reduce model size or number of replicas |
| StatefulSet not scaling | Check PVC availability and storage class |

---

## Next Steps

1. Set up monitoring with Prometheus & Grafana
2. Configure backup policies for PostgreSQL
3. Set up log aggregation (ELK, Loki)
4. Implement GitOps with ArgoCD
5. Create custom Ingress rules per environment

For more information, see [DEVELOPMENT.md](../../DEVELOPMENT.md) and [OPERATIONS.md](../../OPERATIONS.md).
