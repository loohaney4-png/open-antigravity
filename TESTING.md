# Testing Guide

Comprehensive testing strategies and procedures for Open-Antigravity.

## Test Types

### 1. Unit Tests

Test individual functions and modules in isolation.

```javascript
// backend/tests/unit/models/agent.test.js
const { AgentOrchestrator } = require('../../../services/agent-orchestrator');

describe('Agent Orchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  describe('createAgent', () => {
    it('should create agent with valid configuration', async () => {
      const agent = await orchestrator.createAgent({
        name: 'Test Agent',
        role: 'tester',
        model: 'gpt-4-turbo'
      });

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('Test Agent');
      expect(agent.status).toBe('ready');
    });

    it('should throw error with invalid configuration', async () => {
      await expect(orchestrator.createAgent({}))
        .rejects.toThrow('Agent name is required');
    });
  });

  describe('executeTask', () => {
    it('should execute task and return result', async () => {
      const agent = await orchestrator.createAgent({
        name: 'Test Agent'
      });

      const result = await orchestrator.executeTask(agent.id, {
        input: 'test input'
      });

      expect(result.status).toBe('completed');
      expect(result.output).toBeDefined();
    });

    it('should handle task timeout', async () => {
      const agent = await orchestrator.createAgent({
        name: 'Test Agent'
      });

      await expect(
        orchestrator.executeTask(agent.id, 
          { input: 'test' },
          { timeout: 100 }
        )
      ).rejects.toThrow('Task timeout');
    });
  });
});
```

### 2. Integration Tests

Test interactions between components.

```javascript
// backend/tests/integration/api.test.js
const request = require('supertest');
const app = require('../../api/server');

describe('API Integration Tests', () => {
  let agent;
  let jwt;

  beforeAll(async () => {
    // Create test user and get JWT
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password'
      });
    jwt = res.body.token;
  });

  describe('Agent API', () => {
    it('should create agent via API', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${jwt}`)
        .send({
          name: 'Test Agent',
          role: 'test'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      agent = res.body;
    });

    it('should execute task via API', async () => {
      const res = await request(app)
        .post(`/api/agents/${agent.id}/execute`)
        .set('Authorization', `Bearer ${jwt}`)
        .send({ input: 'test' });

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
    });

    it('should get agent metrics', async () => {
      const res = await request(app)
        .get(`/api/metrics/agent/${agent.id}`)
        .set('Authorization', `Bearer ${jwt}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks_executed).toBe(1);
    });
  });
});
```

### 3. End-to-End Tests

Test complete user workflows.

```javascript
// frontend/tests/e2e/agent-workflow.test.js
import { test, expect } from '@playwright/test';

test.describe('Agent Workflow', () => {
  test('should create and execute agent', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000');

    // Login
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('**/dashboard');

    // Create agent
    await page.click('[data-testid="create-agent-btn"]');
    await page.fill('[name="agentName"]', 'Test Agent');
    await page.fill('[name="agentRole"]', 'test');
    await page.click('[type="submit"]');

    // Wait for agent to be created
    await expect(page.locator('text=Test Agent')).toBeVisible();

    // Execute task
    await page.click('[data-testid="execute-btn"]');
    await page.fill('[name="input"]', 'test input');
    await page.click('[type="submit"]');

    // Check result
    await expect(
      page.locator('[data-testid="task-result"]')
    ).toContainText('completed');
  });
});
```

### 4. Performance Tests

Load testing and performance benchmarks.

```javascript
// backend/tests/performance/load.test.js
const autocannon = require('autocannon');

describe('Load Tests', () => {
  it('should handle 100 requests per second', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/agents',
      connections: 10,
      duration: 10,
      requests: [
        {
          method: 'GET',
          path: '/api/agents',
          headers: {
            'Authorization': 'Bearer ' + jwt
          }
        }
      ]
    });

    expect(result.errors).toBe(0);
    expect(result.statusCodeStats['200']).toBeGreaterThan(900);
  });
});
```

### 5. Security Tests

Test security vulnerabilities and access control.

```javascript
// backend/tests/security/auth.test.js
const request = require('supertest');
const app = require('../../api/server');

describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/agents');

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/agents')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    it('should prevent accessing other users data', async () => {
      // Login as user 1
      const user1Token = await loginUser('user1@example.com');

      // Try to access user 2's agents
      const res = await request(app)
        .get('/api/agents?userId=2')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Input Validation', () => {
    it('should reject XSS attempts', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${jwt}`)
        .send({
          name: '<script>alert("xss")</script>'
        });

      expect(res.status).toBe(400);
    });

    it('should reject SQL injection attempts', async () => {
      const res = await request(app)
        .post('/api/agents')
        .set('Authorization', `Bearer ${jwt}`)
        .send({
          name: "'; DROP TABLE agents; --"
        });

      expect(res.status).toBe(400);
    });
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- agent.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test suite
npm test -- --testNamePattern="Agent Orchestrator"

# Run with verbose output
npm test -- --verbose

# Generate coverage report
npm test -- --coverage --collectCoverageFrom="src/**/*.js"
```

## Test Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ]
};
```

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test -- --coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2
      with:
        files: ./coverage/lcov.info
```

## Test Data and Fixtures

```javascript
// tests/fixtures/agents.js
const agents = {
  codeGenerator: {
    name: 'Code Generator',
    role: 'code-generator',
    model: 'gpt-4-turbo',
    instructions: 'Generate clean code...'
  },

  debugger: {
    name: 'Debugger',
    role: 'debugger',
    model: 'claude-3-opus',
    instructions: 'Debug and fix code...'
  }
};

module.exports = { agents };
```

## Debugging Tests

```bash
# Run single test file in debug mode
node --inspect-brk node_modules/.bin/jest agent.test.js

# Run with debug output
DEBUG=* npm test

# Chrome DevTools debugging
node --inspect-brk node_modules/.bin/jest --runInBand
# Then open chrome://inspect
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user workflows
- **Performance Tests**: Load and stress testing
- **Security Tests**: OWASP Top 10

## Best Practices

1. **Test Independence** - Tests should not depend on each other
2. **Clear Assertions** - Use descriptive assertion messages
3. **Mock External Services** - Don't rely on external APIs
4. **Test Cleanup** - Clean up database and files after tests
5. **Descriptive Names** - Test names should explain what is being tested
6. **Avoid Flakiness** - Use appropriate timeouts and retries
7. **Keep Tests Fast** - Slow tests discourage running them frequently

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled nightly runs
- Before deployments

Failed tests prevent merge and deployment.
