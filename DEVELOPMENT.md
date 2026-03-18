# Development Guide

This document provides guidelines for developers contributing to Open-Antigravity.

## Code Structure

### Backend

The backend is organized by service:

- **api/server.js** - Express application and WebSocket setup
- **api/routes/** - API endpoint handlers
- **services/** - Business logic for each service
- **lib/** - Utilities (logger, etc.)
- **database/** - Database schema and migrations

### Frontend

The frontend uses React with component-based architecture:

- **components/** - React components
  - EditorView - Main code editor interface
  - ManagerView - Mission control
  - common - Reusable components
- **services/api.js** - API client layer
- **hooks/** - Custom React hooks
- **store/** - State management (Zustand)
- **styles/** - CSS stylesheets

## Database Schema

The database uses PostgreSQL with the following main tables:

- `agents` - AI agent configurations and status
- `tasks` - Task queue and execution records
- `artifacts` - Generated outputs (plans, logs, etc.)
- `workspaces` - Development environments
- `models` - Available LLM models
- `providers` - LLM provider configurations

## API Design

All API endpoints follow these patterns:

### Request Format
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Success Response (200-201)
```json
{
  "id": "uuid",
  "field1": "value1",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Error Response (400-500)
```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

## Service Layer Architecture

### AgentOrchestrator
Manages agent lifecycle:
- Create/delete agents
- Queue and execute tasks
- Monitor agent health
- Handle task retries

### ModelGateway
Interfaces with LLM providers:
- Provider configuration
- Model selection
- Completion generation
- Streaming support

### WorkspaceManager
Manages isolated environments:
- File operations
- Command execution
- Workspace cleanup
- Resource limits

## Frontend State Management

Using Zustand for state:

```javascript
import { useAppStore } from './store/appStore';

function MyComponent() {
  const { agents, setAgents } = useAppStore();
  // Use state and actions
}
```

## WebSocket Communication

Real-time updates via WebSocket:

```javascript
import { connectWebSocket, sendWebSocketMessage } from './services/api';

connectWebSocket(
  (data) => console.log('Received:', data),
  (error) => console.error('Error:', error)
);

sendWebSocketMessage({
  type: 'subscribe-agent',
  payload: { agentId: 'uuid' }
});
```

## Testing

### Backend Unit Tests
```bash
cd backend
npm test
```

### Frontend Component Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
npm run test:integration
```

## Performance Considerations

1. **Database Queries**: Add indexes for frequently queried fields
2. **API Responses**: Implement pagination for large datasets
3. **WebSocket**: Use selective subscriptions to reduce message volume
4. **Frontend**: Code split by routes, lazy load components

## Security Guidelines

1. **API Keys**: Never commit to repo, use environment variables
2. **Input Validation**: Validate all user inputs server-side
3. **CORS**: Configure appropriate CORS policies
4. **Authentication**: Implement JWT or session-based auth
5. **Database**: Use prepared statements to prevent SQL injection

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `api/routes/`
2. Add logic to service layer
3. Connect in `api/server.js`
4. Add client method in `frontend/services/api.js`
5. Create UI component to call it

### Adding a New Component

1. Create component file in `components/`
2. Import and use Zustand store if needed
3. Import API service for data
4. Add styling in `styles/`
5. Export from component index

### Adding Database Migration

1. Create `.sql` file in `database/migrations/`
2. Run migration in development
3. Test thoroughly
4. Include in version control

## Debugging

### Backend Logging
```javascript
const logger = require('../lib/logger');

logger.info('Message', { context });
logger.error('Error', error);
```

### Frontend Debugging
```javascript
// React DevTools browser extension
// Redux DevTools for store inspection
console.log('Debug info', variable);
```

### Docker Debugging
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute command in container
docker exec open-antigravity-backend npm test

# Interactive shell
docker exec -it open-antigravity-backend sh
```

## Deployment

### Staging Environment
```bash
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up
```

### Production Deployment
1. Build images with version tags
2. Push to registry
3. Update environment variables
4. Deploy with health checks
5. Monitor logs and metrics

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add feature description"

# Push and create PR
git push origin feature/feature-name

# Merge after approval
git checkout main
git merge feature/feature-name
```

## Code Quality

- Use ESLint: `npm run lint`
- Format code: `npm run format`
- Run tests: `npm test`
- Check types: `npm run type-check`

## Resources

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

For questions, open an issue or reach out to the team!
