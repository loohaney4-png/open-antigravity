const logger = require('../../lib/logger');
const axios = require('axios');

const agents = new Map();
const taskQueue = [];

class AgentOrchestrator {
  static async getAllAgents() {
    return Array.from(agents.values());
  }

  static async getAgent(agentId) {
    return agents.get(agentId);
  }

  static async createAgent(agentConfig) {
    const agent = {
      ...agentConfig,
      tasks: [],
      status: 'idle',
      lastActivity: new Date().toISOString()
    };
    agents.set(agentConfig.id, agent);
    logger.info(`Agent created: ${agentConfig.id} (${agentConfig.name})`);
    return agent;
  }

  static async executeTask(agentId, taskConfig) {
    const agent = agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    logger.info(`Executing task on agent ${agentId}:`, taskConfig.task);

    // Update agent status
    agent.status = 'executing';
    agent.currentTask = taskConfig.taskId;
    agent.lastActivity = new Date().toISOString();

    // Queue the task
    const task = {
      ...taskConfig,
      agentId,
      status: 'queued',
      retries: 0,
      maxRetries: 3
    };
    taskQueue.push(task);

    // Process task asynchronously
    setImmediate(() => {
      this.processTask(agentId, task);
    });

    return {
      taskId: taskConfig.taskId,
      agentId,
      status: 'queued',
      message: 'Task queued for execution'
    };
  }

  static async processTask(agentId, task) {
    try {
      task.status = 'processing';
      logger.info(`Processing task ${task.taskId} on agent ${agentId}`);

      // Simulate task processing with a simple example
      // In production, this would call the model gateway and process the output
      const duration = Math.random() * 5000 + 1000; // 1-6 seconds
      await new Promise(resolve => setTimeout(resolve, duration));

      const agent = agents.get(agentId);
      task.status = 'completed';
      task.result = {
        success: true,
        message: 'Task completed successfully',
        output: `Processed: ${task.task}`
      };
      task.completedAt = new Date().toISOString();
      agent.tasks.push(task);
      agent.status = 'idle';

      logger.info(`Task ${task.taskId} completed on agent ${agentId}`);
    } catch (error) {
      logger.error(`Error processing task ${task.taskId}:`, error);
      task.status = 'failed';
      task.error = error.message;
      
      const agent = agents.get(agentId);
      if (task.retries < task.maxRetries) {
        task.retries++;
        logger.info(`Retrying task ${task.taskId} (attempt ${task.retries})`);
        setTimeout(() => this.processTask(agentId, task), 2000);
      } else {
        agent.status = 'idle';
      }
    }
  }

  static async stopAgent(agentId) {
    const agent = agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = 'stopped';
    agent.lastActivity = new Date().toISOString();
    logger.info(`Agent ${agentId} stopped`);
    return agent;
  }

  static async deleteAgent(agentId) {
    agents.delete(agentId);
    logger.info(`Agent ${agentId} deleted`);
  }

  static async monitorAgents() {
    // Periodic monitoring of agent health
    setInterval(() => {
      agents.forEach((agent, id) => {
        const lastActivityTime = new Date(agent.lastActivity).getTime();
        const now = new Date().getTime();
        const inactiveTime = (now - lastActivityTime) / 1000; // seconds

        // Mark as idle if no activity for 30+ seconds
        if (inactiveTime > 30 && agent.status === 'executing') {
          logger.warn(`Agent ${id} appears to be stuck, marking as idle`);
          agent.status = 'idle';
        }
      });
    }, 10000); // Check every 10 seconds
  }
}

// Start monitoring agents
AgentOrchestrator.monitorAgents();

module.exports = AgentOrchestrator;
