#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const enquirer = require('enquirer');

const execAsync = promisify(exec);

/**
 * Open-Antigravity CLI Tool
 */

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'init':
        await initProject();
        break;
      case 'start':
        await startServices();
        break;
      case 'stop':
        await stopServices();
        break;
      case 'logs':
        await viewLogs(args[1]);
        break;
      case 'create-agent':
        await createAgent();
        break;
      case 'list-agents':
        await listAgents();
        break;
      case 'test':
        await runTests();
        break;
      case 'help':
      case '-h':
      case '--help':
        showHelp();
        break;
      default:
        console.log('Unknown command. Run `ag help` for usage information.');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Initialize a new Open-Antigravity project
 */
async function initProject() {
  console.log('🚀 Initializing Open-Antigravity project...\n');

  const prompt = new enquirer.Input({
    name: 'projectName',
    message: 'Project name:'
  });

  const projectName = await prompt.run();

  const projectPath = path.join(process.cwd(), projectName);

  // Create project structure
  const dirs = [
    projectPath,
    path.join(projectPath, 'src'),
    path.join(projectPath, 'agents'),
    path.join(projectPath, '.antigravity')
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Create project config
  const config = {
    name: projectName,
    version: '1.0.0',
    description: 'An Open-Antigravity project',
    agents: [],
    defaultModel: 'gpt-4-turbo',
    workspace: {
      path: './src'
    }
  };

  fs.writeFileSync(
    path.join(projectPath, '.antigravity', 'config.json'),
    JSON.stringify(config, null, 2)
  );

  // Create README
  fs.writeFileSync(
    path.join(projectPath, 'README.md'),
    `# ${projectName}\n\nAn Open-Antigravity project.\n\n## Getting Started\n\n\`\`\`bash\nag start\n\`\`\`\n`
  );

  console.log(`✅ Project created at ${projectPath}`);
  console.log('📖 Next steps:');
  console.log(`   cd ${projectName}`);
  console.log('   ag create-agent');
  console.log('   ag start');
}

/**
 * Start services with Docker Compose
 */
async function startServices() {
  console.log('🚀 Starting Open-Antigravity services...\n');

  try {
    const { stdout } = await execAsync('docker-compose up -d', {
      cwd: process.cwd()
    });
    console.log(stdout);
    console.log('✅ Services started!');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend: http://localhost:5000');
    console.log('   Database: localhost:5432');
  } catch (error) {
    console.error('❌ Error starting services:', error.message);
  }
}

/**
 * Stop services
 */
async function stopServices() {
  console.log('🛑 Stopping Open-Antigravity services...\n');

  try {
    const { stdout } = await execAsync('docker-compose down', {
      cwd: process.cwd()
    });
    console.log(stdout);
    console.log('✅ Services stopped!');
  } catch (error) {
    console.error('❌ Error stopping services:', error.message);
  }
}

/**
 * View service logs
 */
async function viewLogs(serviceName) {
  console.log(`📋 Logs for ${serviceName || 'all services'}...\n`);

  try {
    const command = serviceName
      ? `docker-compose logs -f ${serviceName}`
      : 'docker-compose logs -f';

    await execAsync(command, {
      cwd: process.cwd(),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('❌ Error viewing logs:', error.message);
  }
}

/**
 * Create a new agent
 */
async function createAgent() {
  console.log('🤖 Creating a new agent...\n');

  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Agent name:'
    },
    {
      type: 'select',
      name: 'role',
      message: 'Agent role:',
      choices: ['general', 'code-generator', 'debugger', 'tester', 'writer']
    },
    {
      type: 'select',
      name: 'model',
      message: 'Model:',
      choices: ['gpt-4-turbo', 'claude-3-opus', 'gemini-2.0-flash']
    }
  ];

  const response = await enquirer.prompt(questions);

  const agentTemplate = {
    name: response.name,
    role: response.role,
    model: response.model,
    instructions: `You are a ${response.role} agent.`,
    enabled: true,
    created_at: new Date().toISOString()
  };

  const agentsPath = path.join(process.cwd(), 'agents');
  const agentFile = path.join(agentsPath, `${response.name}.json`);

  if (!fs.existsSync(agentsPath)) {
    fs.mkdirSync(agentsPath, { recursive: true });
  }

  fs.writeFileSync(agentFile, JSON.stringify(agentTemplate, null, 2));

  console.log(`\n✅ Agent created at ${agentFile}`);
}

/**
 * List all agents in project
 */
async function listAgents() {
  console.log('🤖 Agents in this project:\n');

  const agentsPath = path.join(process.cwd(), 'agents');

  if (!fs.existsSync(agentsPath)) {
    console.log('No agents found.');
    return;
  }

  const agents = fs.readdirSync(agentsPath).filter(f => f.endsWith('.json'));

  if (agents.length === 0) {
    console.log('No agents found.');
    return;
  }

  agents.forEach(agentFile => {
    const agent = JSON.parse(fs.readFileSync(path.join(agentsPath, agentFile)));
    console.log(`  📌 ${agent.name}`);
    console.log(`     Role: ${agent.role}`);
    console.log(`     Model: ${agent.model}`);
  });
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 Running tests...\n');

  try {
    const { stdout } = await execAsync('npm test', {
      cwd: process.cwd()
    });
    console.log(stdout);
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Open-Antigravity CLI

Usage: ag <command> [options]

Commands:
  init              Initialize a new project
  start             Start all services with Docker Compose
  stop              Stop all services
  logs [service]    View service logs
  create-agent      Create a new AI agent
  list-agents       List all agents in project
  test              Run tests
  help              Show this help message

Examples:
  ag init
  ag create-agent
  ag start
  ag logs backend

Documentation:
  Run 'ag help' for more information
  `);
}

// Run CLI
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
