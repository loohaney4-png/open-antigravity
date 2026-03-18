const TestHelper = require('./testHelper');
const AgentOrchestrator = require('../services/agent-orchestrator');

describe('Agent Orchestrator', () => {
  describe('createAgent', () => {
    it('should create a new agent', async () => {
      const mockAgent = TestHelper.createMockAgent({
        name: 'Code Generator',
        model: 'gpt-4-turbo'
      });

      const agent = await AgentOrchestrator.createAgent(mockAgent);

      TestHelper.assert(agent.name, 'Code Generator');
      TestHelper.assertHasProperty(agent, 'id');
      TestHelper.assertHasProperty(agent, 'status');
    });

    it('should set status to idle for new agent', async () => {
      const mockAgent = TestHelper.createMockAgent();
      const agent = await AgentOrchestrator.createAgent(mockAgent);

      TestHelper.assertEqual(agent.status, 'idle');
    });
  });

  describe('getAgent', () => {
    it('should return null for non-existent agent', async () => {
      const agent = await AgentOrchestrator.getAgent('non-existent-id');
      TestHelper.assertEqual(agent, null);
    });

    it('should return agent if it exists', async () => {
      const mockAgent = TestHelper.createMockAgent();
      const created = await AgentOrchestrator.createAgent(mockAgent);
      const retrieved = await AgentOrchestrator.getAgent(created.id);

      TestHelper.assertHasProperty(retrieved, 'id');
      TestHelper.assertEqual(retrieved.name, mockAgent.name);
    });
  });

  describe('executeTask', () => {
    it('should queue task for execution', async () => {
      const mockAgent = TestHelper.createMockAgent();
      const agent = await AgentOrchestrator.createAgent(mockAgent);

      const execution = await AgentOrchestrator.executeTask(agent.id, {
        taskId: 'test-task-1',
        task: 'Test task'
      });

      TestHelper.assertEqual(execution.status, 'queued');
      TestHelper.assertHasProperty(execution, 'taskId');
    });
  });

  describe('stopAgent', () => {
    it('should stop an agent', async () => {
      const mockAgent = TestHelper.createMockAgent();
      const agent = await AgentOrchestrator.createAgent(mockAgent);

      const stopped = await AgentOrchestrator.stopAgent(agent.id);

      TestHelper.assertEqual(stopped.status, 'stopped');
    });
  });

  describe('deleteAgent', () => {
    it('should delete an agent', async () => {
      const mockAgent = TestHelper.createMockAgent();
      const agent = await AgentOrchestrator.createAgent(mockAgent);

      await AgentOrchestrator.deleteAgent(agent.id);
      const retrieved = await AgentOrchestrator.getAgent(agent.id);

      TestHelper.assertEqual(retrieved, null);
    });
  });
});

// Export for running tests
module.exports = { describe, it };
