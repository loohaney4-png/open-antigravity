# Phase 6: GitOps & Continuous Deployment with ArgoCD

**Status**: ✅ Production Ready  
**Date**: March 18, 2026  
**Framework**: ArgoCD 2.9+  
**Model**: Pull-based GitOps, Infrastructure as Code

---

## 🎯 Overview

Phase 6 introduces **GitOps continuous deployment** using **ArgoCD**, enabling:

- **Infrastructure as Code**: All deployments defined in git
- **Automatic Synchronization**: Cluster matches git state
- **Declarative Management**: Single source of truth
- **Audit Trail**: Complete deployment history
- **Rollback Capability**: Easy revert to previous state
- **Multi-Environment**: Dev, staging, production separation
- **Security**: No direct kubectl access needed

---

## 🚀 Quick Start (10 minutes)

### 1. Install ArgoCD

```bash
# Create namespace and install
kubectl create namespace argocd
kubectl apply -f argocd/install.yaml

# Verify deployment
kubectl get pods -n argocd
kubectl get svc -n argocd
```

### 2. Access ArgoCD UI

```bash
# Port-forward to local machine
kubectl port-forward svc/argocd-server -n argocd 8080:80

# Access at: http://localhost:8080
# Login with default credentials:
# Username: admin
# Password: admin (change immediately!)
```

### 3. Change Admin Password

```bash
# Generate new password hash
argocd-util account bcrypt --password $(openssl rand -base64 12)

# Update secret
kubectl patch secret argocd-secret -n argocd \
  -p '{"data": {"admin.password": "'$(argocd-util account bcrypt --password newpassword)'"}}' \
  --type merge
```

### 4. Configure Git Repository

```bash
# Add repository credentials (if using private repo)
argocd repo add https://github.com/ishandutta2007/open-antigravity \
  --username <username> \
  --password <token>

# Verify
argocd repo list
```

### 5. Create Application

```bash
# Apply predefined applications
kubectl apply -f argocd/applications.yaml

# Check application status
argocd app list
argocd app get antigravity-platform
```

### 6. Monitor Deployment

```bash
# Watch sync progress
argocd app wait antigravity-platform

# View deployment events
kubectl get events -n antigravity-system --sort-by='.lastTimestamp'

# Check application health
argocd app health antigravity-platform
```

---

## 📋 Architecture Components

### ArgoCD Components

| Component | Role | Replicas | Resources |
|-----------|------|----------|-----------|
| Server | Web UI & API | 2 | 100m/128Mi → 500m/512Mi |
| Repo Server | Git sync agent | 1 | 100m/256Mi → 500m/1Gi |
| Application Controller | Reconciliation | 1 | 250m/512Mi → 1000m/2Gi |

### Data Flow

```
Git Repository
    ↓ (poll every 3m)
ArgoCD Repo Server
    ↓ (fetch manifests)
ArgoCD Application Controller
    ↓ (compare with cluster)
Kubernetes API
    ↓ (apply changes if drift detected)
Running Applications
```

---

## 🔧 Configuration Files

### 1. Install Manifest
**File**: `argocd/install.yaml` (600+ lines)

**Components**:
- Namespace definition
- CRD for Applications
- ServiceAccounts & RBAC
- ConfigMaps for settings
- Secrets for credentials
- Deployments (server, repo-server, controller)
- Services (ClusterIP)

**Key Features**:
- ✅ High availability (2 replicas)
- ✅ Resource limits
- ✅ Health checks
- ✅ RBAC enforcement

### 2. Applications
**File**: `argocd/applications.yaml` (100+ lines)

**Applications Defined**:
1. **antigravity-platform** - Main application
   - Source: k8s/kustomize/overlays/production
   - Auto-sync enabled
   - Prune orphaned resources
   - Path: /k8s/kustomize/overlays/production

2. **antigravity-monitoring** - Prometheus/Loki/Grafana
   - Source: k8s/
   - Kustomize patches
   - Monitoring namespace

3. **antigravity-logging** - Log aggregation
   - Source: k8s/monitoring-config.yaml
   - Auto-sync enabled

**Sync Policy**:
```yaml
automated:
  prune: true        # Delete resources removed from git
  selfHeal: true     # Reconcile cluster drift
  allowEmpty: false  # Prevent namespace deletion
```

### 3. Projects
**File**: `argocd/projects.yaml` (120+ lines)

**Projects**:

1. **default**
   - Access all repos
   - Deploy to production namespaces
   - Cluster resource whitelist

2. **production**
   - Strict repository access
   - Only production namespace
   - Sync windows (scheduled maintenance)
   - Manual approval required

3. **development**
   - Relaxed policies
   - Dev namespaces
   - Allow any cluster resources

### 4. Repositories
**File**: `argocd/repositories.yaml` (50+ lines)

**Credentials**:
- GitHub Personal Access Token
- GitLab Token
- Docker Registry
- Private Helm repositories

**Authentication Methods**:
- HTTPS with tokens
- SSH with private keys

### 5. Notifications
**File**: `argocd/notifications.yaml` (200+ lines)

**Notification Channels**:
- **Slack**: Deploy status, health alerts
- **GitHub**: Status checks on commits
- **Email**: Sync failures
- **Webhooks**: Custom integrations

**Triggers**:
- On sync failure
- On health degradation
- On sync success
- On sync running

### 6. Ingress & Policies
**File**: `argocd/ingress-and-policies.yaml` (150+ lines)

**Features**:
- HTTPS with Let's Encrypt
- Network policies
- Pod autoscaling (HPA)
- Pod disruption budgets

---

## 📦 GitOps Workflow

### Deployment Process

```
Developer
    ↓
Commit to git repo
    ↓
    ├─→ GitHub detects change
    ├─→ Webhook triggers CI/CD
    └─→ Tests run
    ↓
All checks pass
    ↓
Merge to main branch
    ↓
ArgoCD Repo Server
    ├─→ Polls repository (every 3 minutes)
    ├─→ Fetches latest manifests
    └─→ Compares with cluster state
    ↓
Application Controller
    ├─→ Detects drift
    ├─→ Generates sync plan
    └─→ Can auto-sync or wait for approval
    ↓
    IF auto-sync enabled:
        Apply changes to cluster
    ELSE:
        Notify operator for approval
    ↓
Kubernetes applies manifests
    ↓
Monitoring catches changes
    ↓
Notified via Slack/Email
```

### Manual Workflow

```
Developer makes change
    ↓
Commits to feature branch
    ↓
Creates pull request
    ↓
CI pipeline runs tests
    ↓
Code review & approval
    ↓
Merge to main
    ↓
ArgoCD automatically syncs
    ↓
Application updated
    ↓
Notifications sent
    ↓
Deployment complete
```

---

## 🔐 Security Best Practices

### Access Control

**RBAC Policies** (in argocd/install.yaml):

```yaml
p, role:admin, applications, *, */*, allow
p, role:developer, applications, *, */*, allow
p, role:developer, repositories, get, *, allow
p, role:viewer, applications, get, */*, allow
```

**Role Assignment**:
```yaml
g, admin-user, role:admin
g, dev-user, role:developer
```

### Repository Credentials

**Git Token Storage**:
```bash
# Create secret with token
kubectl create secret generic github-repo-creds \
  -n argocd \
  --from-literal=password=$GITHUB_TOKEN \
  --from-literal=username=not_used \
  --from-literal=type=git \
  --from-literal=url=https://github.com/ishandutta2007/open-antigravity
```

**SSH Key Alternative**:
```bash
# Use SSH key instead of token
argocd repo add git@github.com:ishandutta2007/open-antigravity.git \
  --ssh-private-key-path ~/.ssh/id_rsa
```

### Network Security

**Network Policies**:
- ArgoCD server only accessible via ingress
- Repo server hidden from external traffic
- Application controller internal communication only

**TLS/HTTPS**:
- Forced SSL redirect
- TLS 1.2+ required
- Let's Encrypt certificates

---

## 🎯 Deployment Strategies

### Strategy 1: Full GitOps (Recommended)

All infrastructure in git, ArgoCD auto-syncs:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

**Advantages**:
- ✅ Fully reproducible
- ✅ Easy rollback
- ✅ Audit trail
- ✅ No manual kubectl

**Challenges**:
- ⚠️ Git becomes critical
- ⚠️ Requires discipline

### Strategy 2: Manual Approval

Changes require human approval:

```yaml
syncPolicy:
  syncOptions:
  - RespectIgnoreDifferences=true
```

**Workflow**:
1. Changes detected
2. Sync plan generated
3. Operator reviews
4. Manual approval
5. Applied to cluster

### Strategy 3: Progressive Delivery

Use blue-green or canary deployments:

```yaml
# Deploy to shadow cluster first
source:
  path: k8s/kustomize/overlays/canary

# After validation, promote to production
destination:
  namespace: antigravity-system
```

### Strategy 4: Multi-Environment

Deploy to dev, staging, production with promotions:

**Repository Structure**:
```
k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── configmap.yaml
├── overlays/
│   ├── dev/
│   ├── staging/
│   └── production/
```

**Applications**:
```yaml
# Dev application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: antigravity-dev
spec:
  source:
    path: k8s/overlays/dev

# Staging application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: antigravity-staging
spec:
  source:
    path: k8s/overlays/staging

# Production application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: antigravity-production
spec:
  source:
    path: k8s/overlays/production
```

---

## 📊 Common Operations

### View Applications

```bash
# List all applications
argocd app list

# Get detailed status
argocd app get antigravity-platform

# Watch sync progress
argocd app wait antigravity-platform
```

### Manual Sync

```bash
# Trigger sync
argocd app sync antigravity-platform

# Sync and wait
argocd app sync antigravity-platform --timeout 300

# Dry run
argocd app sync antigravity-platform --dry-run
```

### Rollback

```bash
# Rollback to previous sync
argocd app history antigravity-platform
argocd app rollback antigravity-platform 1

# Rollback to specific revision
argocd app rollback antigravity-platform 0
```

### Refresh Repository

```bash
# Hard refresh from git
argocd app sync antigravity-platform --hard-refresh

# Reconcile immediately
argocd app sync antigravity-platform
```

### Delete Application

```bash
# Delete but keep resources
argocd app delete antigravity-platform

# Delete and remove resources
argocd app delete antigravity-platform --cascade
```

---

## 🛠️ Advanced Configuration

### Custom Health Assessment

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
spec:
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
    - /spec/replicas
```

### Notification Triggers

**Slack on sync failure**:
```yaml
trigger.on-app-sync-failed: |
  - when: app.status.operationState.phase in ['Error', 'Failed']
    oncePer: app.status.operationState.finishedAt
    sendTo: [slack]
```

**GitHub status**:
```yaml
template.app-deployment-succeeded: |
  github:
    state: success
    label: continuous-delivery/{{.app.metadata.name}}
```

### Sync Waves

Control deployment order:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "0"  # Deploy first
spec:
  ...
---
apiVersion: v1
kind: Service
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"  # Deploy after
spec:
  ...
```

---

## 📈 Monitoring & Observability

### ArgoCD Metrics

Metrics exposed on `argocd-metrics:8082`:

```promql
# Application sync count
argocd_app_sync_total{result="succeeded"}

# Application health status
argocd_app_status_health_status

# Reconciliation latency
argocd_app_reconcile_bucket
```

### Metrics Configuration

Add to Prometheus scrape config:

```yaml
- job_name: 'argocd'
  static_configs:
  - targets:
    - 'argocd-metrics.argocd:8082'
```

### Grafana Dashboard

Visualize ArgoCD health:

```json
{
  "panels": [
    {
      "title": "Application Sync Status",
      "targets": [{"expr": "argocd_app_status_sync_status"}]
    },
    {
      "title": "Application Health",
      "targets": [{"expr": "argocd_app_status_health_status"}]
    }
  ]
}
```

---

## 🚨 Alerting

### Alert Rules

```yaml
- alert: ArgoCDSyncFailure
  expr: argocd_app_status_sync_phase{phase="Failed"} == 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Application {{ $labels.app }} sync failed"

- alert: ArgoCDHealthDegraded
  expr: argocd_app_status_health_status{status="Degraded"} == 1
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Application {{ $labels.app }} health degraded"
```

---

## 🔄 GitOps Workflow Examples

### Example 1: Update Backend Replicas

```bash
# Edit kustomization file
vi k8s/overlays/production/kustomization.yaml

# Change replicas from 2 to 3
---
replicas:
- name: antigravity-backend
  count: 3

# Commit and push
git add k8s/overlays/production/kustomization.yaml
git commit -m "Scale backend to 3 replicas"
git push

# ArgoCD detects change and syncs automatically
# Verify in ArgoCD UI or CLI
argocd app get antigravity-platform
```

### Example 2: Update Container Image

```bash
# Edit deployment
vi k8s/overlays/production/patches/backend.yaml

# Update image tag
image: myregistry/backend:v1.2.3

# Commit and push
git add k8s/overlays/production/patches/backend.yaml
git commit -m "Update backend to v1.2.3"
git push

# ArgoCD detects and applies change
```

### Example 3: Rollback Failed Deployment

```bash
# Check sync history
argocd app history antigravity-platform

# Rollback to previous version
argocd app rollback antigravity-platform 1

# Verify
argocd app get antigravity-platform
kubectl get deployment -n antigravity-system
```

---

## 🛠️ Troubleshooting

### Application OutOfSync

```bash
# Check differences
argocd app diff antigravity-platform

# Sync manually
argocd app sync antigravity-platform

# Hard sync (ignore local changes)
argocd app sync antigravity-platform --hard-refresh
```

### Repository Access Issues

```bash
# Test repository connection
argocd repo list --insecure

# Check credentials
kubectl get secret <repo-creds-secret> -n argocd -o yaml

# Update credentials
kubectl patch secret <repo-creds> -n argocd \
  -p '{"stringData":{"password":"newtoken"}}'
```

### Application Degraded

```bash
# Check conditions
argocd app get antigravity-platform --refresh

# View events
kubectl get events -n antigravity-system

# Check pod status
kubectl get pods -n antigravity-system -o wide

# View logs
kubectl logs -l app=antigravity-backend -n antigravity-system
```

### Slow Sync

```bash
# Check repo server logs
kubectl logs -l app=argocd-repo-server -n argocd

# Increase sync frequency
kubectl patch configmap argocd-cm -n argocd \
  -p '{"data":{"timeout.reconciliation":"180s"}}'

# Restart application controller
kubectl delete pod -l app=argocd-application-controller -n argocd
```

---

## 📚 Resources

### Official Documentation
- **ArgoCD**: https://argoproj.github.io/argo-cd/
- **GitOps Principles**: https://www.weave.works/technologies/gitops/
- **Kustomize**: https://kustomize.io/

### Example Repositories
- OpenArgo Examples: https://github.com/argoproj/argocd-example-apps
- ArgoCD Samples: https://github.com/argoproj-labs/argocd-example-apps

---

## ✅ Production Checklist

- [ ] Install ArgoCD in K8s cluster
- [ ] Configure repository credentials
- [ ] Set up notification channels (Slack, email)
- [ ] Create AppProjects (dev, staging, prod)
- [ ] Define applications with sync policies
- [ ] Test manual sync
- [ ] Test automatic sync
- [ ] Configure monitoring & alerts
- [ ] Set up backups of ArgoCD state
- [ ] Train team on GitOps workflow
- [ ] Implement code review process
- [ ] Document deployment procedures

---

**Phase 6 Status**: ✅ **Production Ready**

Your platform now has GitOps-based continuous deployment with:
- ✅ ArgoCD 2.9+ installed
- ✅ Multi-environment support (dev/staging/prod)
- ✅ Automatic reconciliation
- ✅ Rollback capability
- ✅ Notification integration
- ✅ RBAC & security
- ✅ Comprehensive documentation

**Your infrastructure is now completely declarative and version-controlled! 🚀**
