const logger = require('../lib/logger');

/**
 * Metrics collector for monitoring system performance
 */
class MetricsCollector {
  constructor() {
    this.metrics = {
      agents: new Map(),
      tasks: new Map(),
      workspaces: new Map(),
      api: {
        requests: 0,
        errors: 0,
        avgResponseTime: 0
      },
      models: {
        completions: 0,
        tokensUsed: 0,
        avgLatency: 0
      }
    };
    this.requestTimes = [];
  }

  /**
   * Record request timing
   */
  recordRequest(path, statusCode, duration) {
    this.metrics.api.requests++;
    if (statusCode >= 400) {
      this.metrics.api.errors++;
    }
    this.requestTimes.push(duration);
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }
    this.metrics.api.avgResponseTime = 
      this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;

    logger.debug(`API Request: ${path} ${statusCode} ${duration}ms`);
  }

  /**
   * Record agent creation
   */
  recordAgentCreated(agentId, agentName) {
    this.metrics.agents.set(agentId, {
      name: agentName,
      created_at: new Date(),
      tasks_executed: 0,
      total_duration: 0,
      errors: 0
    });

    logger.info(`Agent created: ${agentName}`);
  }

  /**
   * Record agent status change
   */
  recordAgentStatusChange(agentId, status) {
    const agent = this.metrics.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.last_status_change = new Date();
    }
  }

  /**
   * Record task execution
   */
  recordTaskExecution(agentId, taskId, duration, success) {
    const agent = this.metrics.agents.get(agentId);
    if (agent) {
      agent.tasks_executed++;
      agent.total_duration += duration;
      if (!success) {
        agent.errors++;
      }
    }

    logger.info(`Task executed: ${taskId} in ${duration}ms (${success ? 'success' : 'failed'})`);
  }

  /**
   * Record model completion
   */
  recordCompletion(modelId, tokensUsed, latency) {
    this.metrics.models.completions++;
    this.metrics.models.tokensUsed += tokensUsed;
    this.metrics.models.avgLatency = 
      (this.metrics.models.avgLatency * (this.metrics.models.completions - 1) + latency) /
      this.metrics.models.completions;

    logger.debug(`Completion: ${modelId} ${tokensUsed} tokens ${latency}ms`);
  }

  /**
   * Record workspace creation
   */
  recordWorkspaceCreated(workspaceId, workspaceName) {
    this.metrics.workspaces.set(workspaceId, {
      name: workspaceName,
      created_at: new Date(),
      files_count: 0,
      commands_executed: 0
    });

    logger.info(`Workspace created: ${workspaceName}`);
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      api: this.metrics.api,
      models: this.metrics.models,
      agents: {
        total: this.metrics.agents.size,
        agents: Array.from(this.metrics.agents.entries()).map(([id, data]) => ({
          id,
          ...data
        }))
      },
      workspaces: {
        total: this.metrics.workspaces.size,
        workspaces: Array.from(this.metrics.workspaces.entries()).map(([id, data]) => ({
          id,
          ...data
        }))
      }
    };
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics(agentId) {
    return this.metrics.agents.get(agentId);
  }

  /**
   * Get API metrics
   */
  getAPIMetrics() {
    return {
      ...this.metrics.api,
      requestsPerMinute: (this.metrics.api.requests / (Date.now() / 60000)).toFixed(2),
      errorRate: ((this.metrics.api.errors / this.metrics.api.requests) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      agents: new Map(),
      tasks: new Map(),
      workspaces: new Map(),
      api: {
        requests: 0,
        errors: 0,
        avgResponseTime: 0
      },
      models: {
        completions: 0,
        tokensUsed: 0,
        avgLatency: 0
      }
    };
    this.requestTimes = [];
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new MetricsCollector();
  }
  return instance;
}

module.exports = { MetricsCollector, getInstance };
