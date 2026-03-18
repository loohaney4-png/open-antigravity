/**
 * Kubernetes Operator for Open-Antigravity
 * Watches Agent and Task CRDs and manages their lifecycle
 * 
 * This scaffold provides the foundation for a production-grade K8s operator
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../lib/logger');

const execAsync = promisify(exec);

class AntigravityOperator {
  constructor() {
    this.isRunning = false;
    this.watchers = new Map();
    this.reconcilers = {
      'Agent': this.reconcileAgent.bind(this),
      'Task': this.reconcileTask.bind(this)
    };
  }

  /**
   * Start the operator
   */
  async start() {
    this.isRunning = true;
    logger.info('Starting Antigravity Kubernetes Operator');

    // Watch Agent CRD
    await this.watchResource('agents', 'v1', 'antigravity.io', this.reconcileAgent.bind(this));

    // Watch Task CRD
    await this.watchResource('tasks', 'v1', 'antigravity.io', this.reconcileTask.bind(this));

    logger.info('Operator started successfully');
  }

  /**
   * Stop the operator
   */
  async stop() {
    this.isRunning = false;
    logger.info('Stopping Kubernetes Operator');

    // Stop all watchers
    for (const watcher of this.watchers.values()) {
      watcher.close?.();
    }

    this.watchers.clear();
  }

  /**
   * Watch a Kubernetes resource
   */
  async watchResource(resource, version, group, handler) {
    try {
      const client = require('@kubernetes/client-node');
      const kc = new client.KubeConfig();
      kc.loadFromDefault();

      const watch = new client.Watch(kc);
      const path = `/apis/${group}/${version}/watch/${resource}`;

      const watcher = watch.watch(
        path,
        {},
        (type, apiObj, watchObj) => {
          handler(type, apiObj, watchObj).catch(err => {
            logger.error(`Reconciliation error: ${err.message}`);
          });
        },
        (err) => {
          logger.error(`Watch error for ${resource}: ${err.message}`);
        }
      );

      this.watchers.set(resource, watcher);
      logger.info(`Watching ${group}/${version} ${resource}`);
    } catch (error) {
      logger.error(`Failed to watch ${resource}: ${error.message}`);
    }
  }

  /**
   * Reconcile Agent CRD
   */
  async reconcileAgent(type, agent, watchObj) {
    const name = agent.metadata.name;
    const namespace = agent.metadata.namespace;

    logger.info(`Reconciling Agent: ${type} ${namespace}/${name}`);

    try {
      switch (type) {
        case 'ADDED':
          await this.createAgentDeployment(agent);
          await this.updateAgentStatus(agent, 'Running', 'Agent created');
          break;

        case 'MODIFIED':
          await this.updateAgentDeployment(agent);
          await this.updateAgentStatus(agent, 'Running', 'Agent updated');
          break;

        case 'DELETED':
          await this.deleteAgentDeployment(agent);
          logger.info(`Agent deleted: ${namespace}/${name}`);
          break;

        default:
          logger.warn(`Unknown watch type: ${type}`);
      }
    } catch (error) {
      await this.updateAgentStatus(agent, 'Failed', `Error: ${error.message}`);
      logger.error(`Agent reconciliation failed: ${error.message}`);
    }
  }

  /**
   * Reconcile Task CRD
   */
  async reconcileTask(type, task, watchObj) {
    const name = task.metadata.name;
    const namespace = task.metadata.namespace;

    logger.info(`Reconciling Task: ${type} ${namespace}/${name}`);

    try {
      switch (type) {
        case 'ADDED':
          await this.createTaskExecution(task);
          await this.updateTaskStatus(task, 'Running', 'Task execution started');
          break;

        case 'MODIFIED':
          // Handle task updates (e.g., priority changes)
          await this.updateTaskExecution(task);
          break;

        case 'DELETED':
          await this.stopTaskExecution(task);
          logger.info(`Task deleted: ${namespace}/${name}`);
          break;

        default:
          logger.warn(`Unknown watch type: ${type}`);
      }
    } catch (error) {
      await this.updateTaskStatus(task, 'Failed', `Error: ${error.message}`);
      logger.error(`Task reconciliation failed: ${error.message}`);
    }
  }

  /**
   * Create a Kubernetes Deployment for an Agent
   */
  async createAgentDeployment(agent) {
    const { name, namespace } = agent.metadata;
    const { model, instructions, replicas = 1 } = agent.spec;

    logger.info(`Creating deployment for agent: ${namespace}/${name}`);

    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: `agent-${name}`,
        namespace: namespace,
        ownerReferences: [{
          apiVersion: 'antigravity.io/v1',
          kind: 'Agent',
          name: name,
          uid: agent.metadata.uid
        }]
      },
      spec: {
        replicas,
        selector: {
          matchLabels: {
            'agent.antigravity.io/name': name
          }
        },
        template: {
          metadata: {
            labels: {
              'agent.antigravity.io/name': name
            }
          },
          spec: {
            containers: [{
              name: 'agent',
              image: 'open-antigravity/agent:latest',
              env: [
                { name: 'AGENT_NAME', value: name },
                { name: 'AGENT_MODEL', value: model },
                { name: 'AGENT_INSTRUCTIONS', value: instructions || '' }
              ],
              resources: agent.spec.resourceRequirements || {
                requests: { cpu: '100m', memory: '128Mi' },
                limits: { cpu: '500m', memory: '512Mi' }
              }
            }]
          }
        }
      }
    };

    // Create deployment in cluster
    await this.applyKubernetesObject(deployment);
  }

  /**
   * Update an Agent Deployment
   */
  async updateAgentDeployment(agent) {
    const { name, namespace } = agent.metadata;
    const { replicas = 1 } = agent.spec;

    logger.info(`Updating deployment for agent: ${namespace}/${name}`);

    await execAsync(
      `kubectl scale deployment agent-${name} --replicas=${replicas} -n ${namespace}`
    );
  }

  /**
   * Delete an Agent Deployment
   */
  async deleteAgentDeployment(agent) {
    const { name, namespace } = agent.metadata;

    logger.info(`Deleting deployment for agent: ${namespace}/${name}`);

    await execAsync(`kubectl delete deployment agent-${name} -n ${namespace}`);
  }

  /**
   * Create a Task Execution (Pod or Job)
   */
  async createTaskExecution(task) {
    const { name, namespace } = task.metadata;
    const { agentId, description, timeout = 3600 } = task.spec;

    logger.info(`Creating execution for task: ${namespace}/${name}`);

    const job = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name: `task-${name}`,
        namespace: namespace,
        ownerReferences: [{
          apiVersion: 'antigravity.io/v1',
          kind: 'Task',
          name: name,
          uid: task.metadata.uid
        }]
      },
      spec: {
        ttlSecondsAfterFinished: 3600,
        activeDeadlineSeconds: timeout,
        backoffLimit: task.spec.retryPolicy?.maxRetries || 3,
        template: {
          metadata: {
            labels: {
              'task.antigravity.io/name': name,
              'task.antigravity.io/agent': agentId
            }
          },
          spec: {
            serviceAccountName: 'antigravity-agent',
            containers: [{
              name: 'task-executor',
              image: 'open-antigravity/executor:latest',
              env: [
                { name: 'TASK_ID', value: name },
                { name: 'AGENT_ID', value: agentId },
                { name: 'TASK_DESCRIPTION', value: description }
              ]
            }],
            restartPolicy: 'OnFailure'
          }
        }
      }
    };

    await this.applyKubernetesObject(job);
  }

  /**
   * Update a Task Execution
   */
  async updateTaskExecution(task) {
    // Handle task updates (e.g., priority changes may require requeue)
    logger.debug(`Updating task: ${task.metadata.namespace}/${task.metadata.name}`);
  }

  /**
   * Stop a Task Execution
   */
  async stopTaskExecution(task) {
    const { name, namespace } = task.metadata;

    logger.info(`Stopping execution for task: ${namespace}/${name}`);

    await execAsync(`kubectl delete job task-${name} -n ${namespace}`);
  }

  /**
   * Update Agent Status
   */
  async updateAgentStatus(agent, phase, message) {
    const { name, namespace } = agent.metadata;

    logger.debug(`Updating agent status: ${name} -> ${phase}`);

    const patchBody = {
      status: {
        phase,
        conditions: [{
          type: 'Ready',
          status: phase === 'Running' ? 'True' : 'False',
          lastTransitionTime: new Date().toISOString(),
          message
        }],
        lastUpdateTime: new Date().toISOString()
      }
    };

    try {
      await execAsync(
        `kubectl patch agent ${name} -n ${namespace} --type merge -p '${JSON.stringify(patchBody)}'`
      );
    } catch (error) {
      logger.error(`Failed to update agent status: ${error.message}`);
    }
  }

  /**
   * Update Task Status
   */
  async updateTaskStatus(task, phase, message) {
    const { name, namespace } = task.metadata;

    logger.debug(`Updating task status: ${name} -> ${phase}`);

    const patchBody = {
      status: {
        phase,
        conditions: [{
          type: 'Ready',
          status: phase === 'Succeeded' ? 'True' : 'False',
          lastTransitionTime: new Date().toISOString(),
          message
        }],
        lastUpdateTime: new Date().toISOString()
      }
    };

    try {
      await execAsync(
        `kubectl patch task ${name} -n ${namespace} --type merge -p '${JSON.stringify(patchBody)}'`
      );
    } catch (error) {
      logger.error(`Failed to update task status: ${error.message}`);
    }
  }

  /**
   * Apply a Kubernetes object to the cluster
   */
  async applyKubernetesObject(obj) {
    const yaml = require('js-yaml');
    const tempFile = `/tmp/k8s-obj-${Date.now()}.yaml`;
    const fs = require('fs').promises;

    try {
      const yamlStr = yaml.dump(obj);
      await fs.writeFile(tempFile, yamlStr);
      await execAsync(`kubectl apply -f ${tempFile}`);
      await fs.unlink(tempFile);
    } catch (error) {
      logger.error(`Failed to apply Kubernetes object: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get operator status
   */
  getStatus() {
    return {
      running: this.isRunning,
      watchers: Array.from(this.watchers.keys()),
      uptime: process.uptime()
    };
  }
}

module.exports = { AntigravityOperator };
