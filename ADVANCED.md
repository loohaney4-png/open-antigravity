# Advanced Features Guide

Deep dive into advanced Open-Antigravity features for power users and enterprise deployments.

## Table of Contents

1. [Multi-Agent Coordination](#multi-agent-coordination)
2. [Agent Specialization](#agent-specialization)
3. [Human-in-the-Loop Workflows](#human-in-the-loop-workflows)
4. [Context Preservation](#context-preservation)
5. [Advanced Scheduling](#advanced-scheduling)
6. [Workflow Automation](#workflow-automation)

## Multi-Agent Coordination

Enable multiple agents to work together on complex tasks.

### Sequential Coordination

Agents execute one after another, passing results:

```bash
curl -X POST http://localhost:3000/api/advanced/coordinate \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "agents": ["code-generator", "tester", "reviewer"],
    "coordinationType": "sequential",
    "task": "Review and test generated code"
  }'
```

### Parallel Coordination

Agents execute simultaneously on independent subtasks:

```bash
curl -X POST http://localhost:3000/api/advanced/coordinate \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "agents": ["unit-tester", "security-scanner", "performance-analyzer"],
    "coordinationType": "parallel",
    "task": "Comprehensive code analysis"
  }'
```

### Hierarchical Coordination

Master agent orchestrates worker agents:

```bash
curl -X POST http://localhost:3000/api/advanced/coordinate \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "agents": {
      "master": "project-manager",
      "workers": ["code-generator", "tester", "documenter"]
    },
    "coordinationType": "hierarchical",
    "task": "Complete project development"
  }'
```

## Agent Specialization

Configure agents for specific domains and techniques.

### Built-in Specializations

```bash
# Code Generation
curl -X POST http://localhost:3000/api/advanced/specialize \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "agentId": "agent_123",
    "specialization": "code-generation"
  }'

# Debugging and Troubleshooting
curl -X POST http://localhost:3000/api/advanced/specialize \
  -d '{
    "agentId": "agent_456",
    "specialization": "debugging"
  }'

# Testing and Quality Assurance
curl -X POST http://localhost:3000/api/advanced/specialize \
  -d '{
    "agentId": "agent_789",
    "specialization": "testing"
  }'

# Security Analysis
curl -X POST http://localhost:3000/api/advanced/specialize \
  -d '{
    "agentId": "agent_012",
    "specialization": "security"
  }'

# Performance Optimization
curl -X POST http://localhost:3000/api/advanced/specialize \
  -d '{
    "agentId": "agent_345",
    "specialization": "performance"
  }'
```

### Custom Specialization

```javascript
const agentConfig = {
  specialization: 'custom',
  expertiseAreas: ['TypeScript', 'Node.js', 'REST APIs'],
  techniques: ['TDD', 'Clean Code', 'Design Patterns'],
  toolProficiency: ['Jest', 'ESLint', 'Docker'],
  preferredLibraries: ['Express', 'Axios', 'JSON Schema']
};

fetch('/api/agents/agent_123', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${jwt}` },
  body: JSON.stringify(agentConfig)
});
```

## Human-in-the-Loop Workflows

Implement approval gates and human oversight.

### Request Approval

```bash
curl -X POST http://localhost:3000/api/advanced/approval/request \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "taskId": "task_123",
    "approverIds": ["user_456", "user_789"],
    "requiredApprovals": 2,
    "context": {
      "changes": "Updated production configuration",
      "reason": "Security patch"
    }
  }'
```

### Submit Approval

```bash
curl -X POST http://localhost:3000/api/advanced/approval/appr_123/approve \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "approved": true,
    "comment": "Changes look good, approved for deployment"
  }'
```

### Approval Workflow Example

```javascript
async function deployWithApproval(changes) {
  // 1. Request approval
  const approval = await fetch('/api/advanced/approval/request', {
    method: 'POST',
    body: JSON.stringify({
      taskId: changes.taskId,
      approverIds: ['lead-engineer', 'devops-manager'],
      requiredApprovals: 2
    })
  }).then(r => r.json());

  // 2. Wait for approvals
  const approved = await waitForApprovals(approval.id, 2);

  if (!approved) {
    throw new Error('Approval denied');
  }

  // 3. Execute deployment
  await deployChanges(changes);
}
```

## Context Preservation

Maintain agent context across multiple task executions.

### Save Context

```bash
curl -X POST http://localhost:3000/api/advanced/context/save \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "agentId": "codebot_123",
    "contextData": {
      "projectType": "node-api",
      "dependencies": {
        "express": "^4.18.0",
        "typescript": "^5.0.0"
      },
      "conventions": {
        "naming": "camelCase",
        "indentation": 2,
        "quotes": "single"
      },
      "codeStyle": {
        "framework": "Express",
        "database": "PostgreSQL",
        "orm": "Sequelize"
      }
    }
  }'
```

### Load and Use Context

```javascript
async function executeWithContext(agentId, contextId, task) {
  // 1. Load context
  const context = await fetch(`/api/advanced/context/${contextId}`)
    .then(r => r.json());

  // 2. Execute task with context
  const result = await fetch('/api/agents/agent_123/execute', {
    method: 'POST',
    body: JSON.stringify({
      task,
      context: context.data
    })
  }).then(r => r.json());

  return result;
}
```

### Multi-Step Development with Context

```javascript
// Example: Building a REST API

// Step 1: Generate base structure
const context1 = await executeAgent('architect', {
  task: 'Design project structure',
  projectType: 'rest-api'
});
await saveContext('architect_123', context1);

// Step 2: Generate code (with architecture context)
const context2 = await executeWithContext('code-gen', context1.id, {
  task: 'Generate API endpoints'
});
await saveContext('code-gen_123', context2);

// Step 3: Generate tests (with existing code context)
const context3 = await executeWithContext('tester', context2.id, {
  task: 'Write unit tests'
});
await saveContext('tester_123', context3);
```

## Advanced Scheduling

Schedule agents to run at specific times and intervals.

### One-Time Execution

```bash
curl -X POST http://localhost:3000/api/advanced/schedule \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "agentId": "backup_agent",
    "task": {
      "action": "backup-database"
    },
    "schedule": {
      "type": "once",
      "time": "2024-03-15T02:00:00Z"
    }
  }'
```

### Interval-Based Scheduling

```bash
# Run every hour
curl -X POST http://localhost:3000/api/advanced/schedule \
  -d '{
    "agentId": "monitor_agent",
    "task": {
      "action": "health-check"
    },
    "schedule": {
      "type": "interval",
      "intervalMs": 3600000
    }
  }'

# Run every 6 hours
curl -X POST http://localhost:3000/api/advanced/schedule \
  -d '{
    "agentId": "cleaner_agent",
    "task": {
      "action": "clean-old-logs"
    },
    "schedule": {
      "type": "interval",
      "intervalMs": 21600000
    }
  }'
```

### Cron-Style Scheduling

```bash
# Run daily at 2 AM
curl -X POST http://localhost:3000/api/advanced/schedule \
  -d '{
    "agentId": "backup_agent",
    "task": {
      "action": "full-backup"
    },
    "schedule": {
      "type": "cron",
      "expression": "0 2 * * *"
    }
  }'

# Run every Monday at 9 AM
curl -X POST http://localhost:3000/api/advanced/schedule \
  -d '{
    "agentId": "report_agent",
    "task": {
      "action": "weekly-report"
    },
    "schedule": {
      "type": "cron",
      "expression": "0 9 * * MON"
    }
  }'
```

## Workflow Automation

Create and execute complex multi-step workflows.

### Available Workflows

```bash
# List available workflows
curl http://localhost:3000/api/advanced/workflows \
  -H "Authorization: Bearer $JWT"
```

Response:
```json
[
  {
    "id": "code-review-workflow",
    "name": "Code Review Workflow",
    "agents": ["code-generator", "tester", "code-reviewer"],
    "steps": [
      { "name": "Generate Code", "agent": "code-generator" },
      { "name": "Create Tests", "agent": "tester" },
      { "name": "Review Code", "agent": "code-reviewer" },
      { "name": "Await Approval", "type": "approval" }
    ]
  }
]
```

### Execute Workflow

```bash
curl -X POST http://localhost:3000/api/advanced/workflows/code-review-workflow/execute \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "input": {
      "requirement": "Extract user profile from API response",
      "context": {
        "language": "TypeScript",
        "framework": "Express"
      }
    }
  }'
```

### Custom Workflow Example

```javascript
class CustomWorkflow {
  constructor() {
    this.steps = [];
  }

  addCodeGeneration() {
    this.steps.push({
      name: 'Generate Implementation',
      agent: 'code-generator',
      input: (prev) => ({
        task: prev.requirement,
        context: prev.context
      })
    });
    return this;
  }

  addUnitTests() {
    this.steps.push({
      name: 'Generate Tests',
      agent: 'test-generator',
      input: (prev) => ({
        code: prev.output,
        codeType: 'implementation'
      })
    });
    return this;
  }

  addIntegrationTests() {
    this.steps.push({
      name: 'Generate Integration Tests',
      agent: 'test-generator',
      input: (prev) => ({
        code: prev.output,
        codeType: 'integration'
      })
    });
    return this;
  }

  addSecurityReview() {
    this.steps.push({
      name: 'Security Review',
      agent: 'security-reviewer',
      input: (prev) => ({
        code: prev.code,
        dependencies: prev.dependencies
      })
    });
    return this;
  }

  addApprovalGate(approvers) {
    this.steps.push({
      name: 'Await Approval',
      type: 'approval',
      approvers,
      requiredApprovals: approvers.length
    });
    return this;
  }

  async execute(initialInput) {
    let context = initialInput;
    
    for (const step of this.steps) {
      if (step.type === 'approval') {
        // Request approval
        const approval = await requestApproval(step);
        context.approval = approval;
      } else {
        // Execute agent
        const result = await executeAgent(step.agent, step.input(context));
        context.output = result.output;
      }
    }

    return context;
  }
}

// Usage
const workflow = new CustomWorkflow()
  .addCodeGeneration()
  .addUnitTests()
  .addIntegrationTests()
  .addSecurityReview()
  .addApprovalGate(['lead-engineer', 'devops-manager']);

const result = await workflow.execute({
  requirement: 'Create user authentication endpoint',
  context: { language: 'TypeScript', framework: 'Express' }
});
```

## Advanced Examples

### Auto-Generate and Deploy Project

```javascript
async function autoGenerateProject(specifications) {
  // 1. Coordination: Multiple agents working together
  const coordination = await coordinate({
    agents: ['architect', 'code-generator', 'test-generator'],
    type: 'sequential'
  });

  // 2. Specialization: Each agent has specific domain knowledge
  const architecture = await specializeAndExecute('architect', 'architecture-design', {
    requirements: specifications
  });

  const code = await specializeAndExecute('code-gen', 'code-generation', {
    architecture: architecture.output,
    language: 'TypeScript'
  });

  const tests = await specializeAndExecute('test-gen', 'testing', {
    implementation: code.output
  });

  // 3. Context preservation: Share context across generations
  const codeContext = await saveContext('code-gen', { code, tests });
  const security = await executeWithContext('security', codeContext.id, {
    task: 'Security review'
  });

  // 4. Approval workflow
  const approval = await requestApproval({
    artifacts: [code.output, tests.output],
    approverIds: ['tech-lead', 'devops']
  });

  // 5. Scheduling: Deploy at designated time
  const deployment = await schedule({
    agentId: 'deployer',
    task: { action: 'deploy', artifacts: [code, tests] },
    schedule: { type: 'once', time: specifications.deploymentTime }
  });

  return { architecture, code, tests, security, deployment };
}
```

## Best Practices

1. **Pipeline Design** - Order agents for maximum efficiency
2. **Context Management** - Preserve critical information between steps
3. **Error Handling** - Implement fallbacks and retries
4. **Approval Gates** - Require review for critical changes
5. **Audit Trail** - Track all decisions and approvals
6. **Performance** - Use parallelization where appropriate
7. **Monitoring** - Track workflow execution and metrics

## Troubleshooting

See [OPERATIONS.md](./OPERATIONS.md) for troubleshooting complex workflows and multi-agent coordination issues.
