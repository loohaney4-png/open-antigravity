# Agent Templates

Pre-configured agent templates for common use cases.

## Available Templates

### Code Generator
Creates and implements new features based on specifications.

```json
{
  "name": "Code Generator",
  "role": "code-generator",
  "model": "gpt-4-turbo",
  "instructions": "Generate clean, well-documented code following best practices..."
}
```

**Capabilities:**
- Code generation
- Implementation of new features
- Code translation between languages
- Boilerplate creation

---

### Debugger
Diagnoses and fixes bugs in code.

```json
{
  "name": "Debugger",
  "role": "debugger",
  "model": "claude-3-opus",
  "instructions": "You are an expert debugger. Analyze code for bugs and provide fixes..."
}
```

**Capabilities:**
- Bug identification
- Root cause analysis
- Fix suggestions
- Error reproduction

---

### Test Writer
Creates comprehensive test suites.

```json
{
  "name": "Test Writer",
  "role": "tester",
  "model": "gpt-4-turbo",
  "instructions": "Write comprehensive test cases covering edge cases..."
}
```

**Capabilities:**
- Unit test creation
- Integration test design
- Test coverage analysis
- Mock data generation

---

### Documentation Writer
Generates technical documentation.

```json
{
  "name": "Documentation Writer",
  "role": "writer",
  "model": "claude-3-opus",
  "instructions": "Write clear, comprehensive documentation..."
}
```

**Capabilities:**
- API documentation
- Code documentation
- User guides
- Architecture diagrams

---

### Code Reviewer
Reviews code for quality and best practices.

```json
{
  "name": "Code Reviewer",
  "role": "reviewer",
  "model": "gpt-4-turbo",
  "instructions": "Review code for quality, performance, and security issues..."
}
```

**Capabilities:**
- Code quality review
- Performance optimization suggestions
- Security vulnerability detection
- Best practice enforcement

---

### DevOps Engineer
Manages deployment and infrastructure.

```json
{
  "name": "DevOps Engineer",
  "role": "devops",
  "model": "Claude-3-Opus",
  "instructions": "You are a DevOps engineer. Help with deployment, infrastructure..."
}
```

**Capabilities:**
- Deployment configuration
- Infrastructure setup
- CI/CD pipeline creation
- Monitoring setup

---

## Using Templates

### Via CLI

```bash
# Create agent from template
ag create-agent --template code-generator --name "My Generator"

# List available templates
ag list-templates
```

### Via API

```javascript
POST /api/agents/from-template
{
  "templateName": "code-generator",
  "agentName": "My Generator",
  "customizations": {
    "model": "claude-3-opus"
  }
}
```

### Programmatically

```javascript
const AgentTemplate = require('./agent-templates');
const agent = new AgentTemplate('code-generator');
agent.customize({
  additionalInstructions: 'Follow our company style guide...'
});
const created = await agent.create();
```

## Creating Custom Templates

```javascript
// templates/my-template.js
module.exports = {
  name: 'my-custom-agent',
  baseRole: 'general',
  defaultModel: 'gpt-4-turbo',
  instructions: `You are a specialized agent...`,
  capabilities: ['feature1', 'feature2'],
  examples: [
    {
      input: 'Example input',
      expectedOutput: 'Expected output'
    }
  ]
};
```

## Best Practices

1. **Clear Instructions** - Provide specific, detailed instructions
2. **Role Definition** - Define clear responsibilities
3. **Model Selection** - Choose appropriate model for the task
4. **Testing** - Test agents with sample inputs before deployment
5. **Documentation** - Document capabilities and limitations

## Advanced Configuration

Customize templates with:

```javascript
const template = AgentTemplate.get('code-generator');
template.configure({
  temperature: 0.8,
  maxTokens: 4096,
  systemPrompt: 'Custom system prompt...',
  plugins: ['formatter', 'linter']
});
```

## Contributing

Submit new templates via pull request to `templates/` directory.

Template requirements:
- Clear documentation
- Usage examples
- Test cases
- Performance benchmarks
