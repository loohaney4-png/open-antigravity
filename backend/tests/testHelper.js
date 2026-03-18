const logger = require('../../lib/logger');

/**
 * Test utilities for Open-Antigravity
 */

class TestHelper {
  /**
   * Create mock agent
   */
  static createMockAgent(overrides = {}) {
    return {
      id: 'test-agent-1',
      name: 'Test Agent',
      model: 'gpt-4-turbo',
      role: 'general',
      status: 'idle',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create mock task
   */
  static createMockTask(overrides = {}) {
    return {
      id: 'test-task-1',
      agentId: 'test-agent-1',
      title: 'Test Task',
      description: 'A test task',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create mock workspace
   */
  static createMockWorkspace(overrides = {}) {
    return {
      id: 'test-workspace-1',
      name: 'Test Workspace',
      path: '/tmp/test-workspace',
      status: 'ready',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create mock artifact
   */
  static createMockArtifact(overrides = {}) {
    return {
      id: 'test-artifact-1',
      taskId: 'test-task-1',
      type: 'log',
      title: 'Test Artifact',
      content: 'Test content',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Assert array contains item
   */
  static assertContains(array, item, message) {
    if (!array.includes(item)) {
      throw new Error(message || `Expected ${array} to contain ${item}`);
    }
  }

  /**
   * Assert object has property
   */
  static assertHasProperty(obj, prop, message) {
    if (!(prop in obj)) {
      throw new Error(message || `Expected object to have property ${prop}`);
    }
  }

  /**
   * Assert equal
   */
  static assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  /**
   * Assert throws
   */
  static async assertThrows(fn, message) {
    try {
      await fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      if (error.message === (message || 'Expected function to throw')) {
        throw error;
      }
      return error;
    }
  }

  /**
   * Sleep for milliseconds
   */
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Setup test environment
   */
  static setupTest() {
    logger.info('Setting up test environment');
    return {
      cleanup: () => {
        logger.info('Cleaning up test environment');
      }
    };
  }
}

module.exports = TestHelper;
