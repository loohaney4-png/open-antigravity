# Phase 4 Quick Start Guide

**Last Updated**: March 18, 2026  
**Phase**: Phase 4 Complete  
**Status**: ✅ Production Ready

---

## 🚀 Get Started in 5 Minutes

### Prerequisites
```bash
# Check requirements
docker --version       # Docker 20.10+
kubectl version        # Kubernetes 1.20+
helm version          # Helm 3.0+
node --version        # Node 16+
```

---

## 1️⃣ Browser Automation

### Quick Test
```bash
# Start backend (if not running in K8s)
cd backend && npm run dev

# Create browser session
curl -X POST http://localhost:5000/api/browser/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test1","options":{"browserType":"chromium"}}'

# Navigate to URL
curl -X POST http://localhost:5000/api/browser/sessions/test1/navigate \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Take screenshot
curl -X POST http://localhost:5000/api/browser/sessions/test1/screenshot

# Close session
curl -X DELETE http://localhost:5000/api/browser/sessions/test1
```

### Use in Agent Code
```javascript
// Browser automation from agent
const result = await fetch('http://localhost:5000/api/browser/sessions', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: 'agent-session-1',
    options: { browserType: 'chromium' }
  })
});

const { sessionId } = await result.json();

// Navigate and interact
await fetch(`http://localhost:5000/api/browser/sessions/${sessionId}/navigate`, {
  method: 'POST',
  body: JSON.stringify({ url: 'https://example.com' })
});
```

---

## 2️⃣ Monaco Editor

### In React Component
```jsx
import MonacoEditor from './components/CodeEditor/MonacoEditor';

function CodeEditor() {
  const [code, setCode] = useState('console.log("Hello");');

  return (
    <MonacoEditor
      value={code}
      onChange={setCode}
      language="javascript"
      theme="vs-dark"
      height="500px"
      showLineNumbers={true}
      minimap={true}
    />
  );
}
```

### Supported Languages
```
JavaScript, TypeScript, Python, Java, Go, Rust, SQL,
C++, C#, Bash, JSON, YAML, XML, HTML, CSS, SCSS,
Markdown, and 10+ others
```

### Props Reference
```javascript
{
  value: string,              // Code content
  onChange: (code) => void,   // Change handler
  language: 'javascript',     // Code language
  theme: 'vs-dark',          // 'vs' or 'vs-dark'
  height: '400px',           // Editor height
  readOnly: false,           // Read-only mode
  showLineNumbers: true,     // Show line numbers
  minimap: true              // Show minimap
}
```

---

## 3️⃣ Plugin Marketplace

### Browse Plugins
```jsx
import PluginMarketplace from './components/PluginMarketplace/PluginMarketplace';

function App() {
  return (
    <PluginMarketplace
      agentId="agent-123"
      onPluginInstall={(pluginId) => console.log('Installed:', pluginId)}
      onPluginRemove={(pluginId) => console.log('Removed:', pluginId)}
    />
  );
}
```

### API Examples

**Get Marketplace**
```bash
curl http://localhost:5000/api/plugins/marketplace
```

**Search Plugins**
```bash
curl "http://localhost:5000/api/plugins/search?q=email&sort=rating"
```

**Install Plugin**
```bash
curl -X POST http://localhost:5000/api/agents/agent-123/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"pluginId":"email-plugin"}'
```

**List Agent Plugins**
```bash
curl http://localhost:5000/api/agents/agent-123/plugins
```

**Remove Plugin**
```bash
curl -X DELETE http://localhost:5000/api/agents/agent-123/plugins/email-plugin
```

---

## 4️⃣ Kubernetes Deployment

### Option A: Helm (Fastest)
```bash
# Install
helm install open-antigravity ./helm \
  -n antigravity-system \
  --create-namespace

# Check status
kubectl get pods -n antigravity-system
kubectl get svc -n antigravity-system

# Access backend
kubectl port-forward -n antigravity-system svc/antigravity-backend 5000:5000

# Access database
kubectl exec -it -n antigravity-system postgres-0 -- \
  psql -U antigravity -d antigravity
```

### Option B: Kustomize (GitOps)
```bash
# Development
kubectl apply -k k8s/kustomize/overlays/dev

# Staging
kubectl apply -k k8s/kustomize/overlays/staging

# Production
kubectl apply -k k8s/kustomize/overlays/production
```

### Option C: Direct YAML
```bash
# Create namespace and CRDs
kubectl apply -f k8s/crds/

# Setup RBAC
kubectl apply -f k8s/rbac.yaml

# Deploy database
kubectl apply -f k8s/database.yaml

# Deploy backend and Ollama
kubectl apply -f k8s/deployment.yaml
```

### Create Agents & Tasks
```bash
# Apply example resources
kubectl apply -f k8s/examples/agents-and-tasks.yaml

# List agents
kubectl get agents
kubectl get agents researcher-agent -o yaml

# List tasks
kubectl get tasks
kubectl describe task market-analysis-2026-q1

# View agent logs
kubectl logs -l agent.antigravity.io/name=researcher-agent -f

# Watch task execution
kubectl describe task analyze-market -w
```

---

## 🔍 Common Commands

### Browser Automation
```bash
# Test connectivity
curl http://localhost:5000/api/browser/sessions | jq '.'

# View active sessions
kubectl logs -l component=backend -f | grep "Browser session"
```

### Plugin Marketplace
```bash
# Get all plugins
curl http://localhost:5000/api/plugins/marketplace | jq '.data | length'

# Search by category
curl "http://localhost:5000/api/plugins/marketplace?category=Communication"

# Install specific plugin
curl -X POST http://localhost:5000/api/agents/my-agent/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"pluginId":"slack-plugin"}'
```

### Kubernetes
```bash
# Scale backend to 5 replicas
kubectl scale deployment antigravity-backend --replicas=5 -n antigravity-system

# View metrics
kubectl top pods -n antigravity-system
kubectl top nodes

# Check CRD definitions
kubectl get crd | grep antigravity

# Troubleshoot pod
kubectl describe pod <pod-name> -n antigravity-system
kubectl logs <pod-name> -n antigravity-system
```

---

## 📋 Checklist for Deployment

### Before Going to Production
- [ ] Set strong JWT secret in secrets
- [ ] Change database passwords
- [ ] Configure SSL/TLS certificates
- [ ] Set up ingress hostname
- [ ] Enable network policies
- [ ] Configure resource quotas
- [ ] Set up monitoring (Prometheus)
- [ ] Configure log aggregation
- [ ] Test backup procedures
- [ ] Run load tests

### Verification Steps
```bash
# 1. Check all pods are running
kubectl get pods -n antigravity-system

# 2. Verify health endpoints
kubectl port-forward -n antigravity-system svc/antigravity-backend 5000:5000
curl http://localhost:5000/health

# 3. Test database connection
kubectl exec -it postgres-0 -n antigravity-system -- \
  psql -U antigravity -d antigravity -c "SELECT 1"

# 4. Verify Ollama models
kubectl exec <ollama-pod> -n antigravity-system -- ollama list

# 5. Check resource usage
kubectl top nodes
kubectl top pods -n antigravity-system --sort-by=memory
```

---

## 🆘 Troubleshooting

### Backend not responding
```bash
# Check pod status
kubectl get pods -n antigravity-system | grep backend

# View logs
kubectl logs -l component=backend -n antigravity-system

# Check readiness
kubectl describe pod <backend-pod> -n antigravity-system
```

### Database connection issues
```bash
# Check postgres pod
kubectl get pods -n antigravity-system | grep postgres

# Connect and test
kubectl exec -it postgres-0 -n antigravity-system -- \
  psql -U antigravity -d antigravity -c "SELECT version()"
```

### Ollama models not available
```bash
# Check ollama pod
kubectl logs -l app=ollama -n antigravity-system

# Pull models manually
kubectl exec -it <ollama-pod> -n antigravity-system -- \
  ollama pull mistral

# List available models
kubectl exec -it <ollama-pod> -n antigravity-system -- ollama list
```

### Browser automation fails
```bash
# Check playwright installation
cd backend && npm list playwright

# Install if missing
npm install playwright

# Verify browser binaries
npx playwright install chromium
```

---

## 📚 Documentation Links

| Feature | Guide |
|---------|-------|
| Browser Automation | See code examples above |
| Monaco Editor | `/frontend/src/components/CodeEditor/` |
| Plugin Marketplace | `/frontend/src/components/PluginMarketplace/` |
| **Kubernetes** | **[KUBERNETES.md](./KUBERNETES.md)** |
| K8s Summary | **[K8S_SUMMARY.md](./K8S_SUMMARY.md)** |
| Full Completion | **[PHASE4_COMPLETION.md](./PHASE4_COMPLETION.md)** |

---

## 🎯 Next Steps

### Try Browser Automation
1. Start backend: `npm run dev`
2. Create a session (see examples above)
3. Automate interaction with a website
4. Capture screenshots

### Use Monaco Editor
1. Add to component
2. Try different languages
3. Test light/dark themes
4. Check fallback (without Monaco package)

### Explore Plugin Marketplace
1. Browse available plugins
2. Filter by category
3. Search for specific plugins
4. Install and use in agents

### Deploy to Kubernetes
1. Choose installation method (Helm/Kustomize/YAML)
2. Customize configuration
3. Deploy to cluster
4. Verify all components
5. Create example agents and tasks

---

## 💡 Tips & Tricks

### Performance Optimization
- Use lightweight models (mistral, neural-chat)
- Set appropriate resource requests/limits
- Enable autoscaling for variable loads
- Use Redis caching for frequently accessed data

### Security
- Change all default passwords before production
- Use strong JWT secrets
- Enable RBAC and network policies
- Regularly backup PostgreSQL

### Monitoring
- Enable Prometheus metrics (`/metrics` endpoint)
- Use Grafana for dashboards
- Set up alerts for failures
- Monitor resource usage

### Development
- Use `npm run dev` for local development
- Use Docker Compose for local database/redis
- Test browser automation with real websites
- Use k8s kustomize/dev for local K8s testing

---

## 🎓 Learning Resources

### Browser Automation
- Playwright docs: https://playwright.dev
- Example usage in `/backend/services/browser-automation/`

### Monaco Editor
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- React wrapper: https://www.npmjs.com/package/@monaco-editor/react

### Plugin System
- Browse plugins in marketplace UI
- Plugin metadata in mock database
- Example plugins show different functionality

### Kubernetes
- CRD schema in `k8s/crds/`
- Helm templates in `helm/templates/`
- K8s examples in `k8s/examples/`
- Full guide in `KUBERNETES.md`

---

## ❓ FAQ

**Q: Do I need Kubernetes?**  
A: No, all features work with local/Docker deployment. K8s is for production scaling.

**Q: Can I use paid AI models?**  
A: Yes, Ollama is default and free, but you can add OpenAI/Claude API keys.

**Q: Is Monaco Editor required?**  
A: No, it gracefully falls back to textarea if not installed.

**Q: How do I scale the backend?**  
A: Use `kubectl scale` or enable HPA for automatic scaling.

**Q: Where are my agent sessions stored?**  
A: In PostgreSQL with Redis caching for performance.

---

## 📞 Support

For issues or questions:
1. Check [KUBERNETES.md](./KUBERNETES.md) for K8s issues
2. Review [K8S_SUMMARY.md](./K8S_SUMMARY.md) for component details
3. See [PHASE4_COMPLETION.md](./PHASE4_COMPLETION.md) for full feature list
4. Check logs: `kubectl logs -l app=antigravity`

---

**Happy deploying! 🚀**
