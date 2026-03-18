# API Documentation

Complete API reference for Open-Antigravity.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Currently uses environment-based configuration. Future versions will support:
- JWT tokens
- API keys
- OAuth2

## Error Handling

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": "Additional context (development only)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `404` - Not found
- `500` - Server error

---

## Agents

### List Agents

```http
GET /agents
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Code Generator",
    "model": "gpt-4-turbo",
    "role": "code-generator",
    "status": "idle",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Agent

```http
GET /agents/{agentId}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Code Generator",
  "model": "gpt-4-turbo",
  "role": "code-generator",
  "instructions": "Generate clean code",
  "status": "idle",
  "tasks": [],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Create Agent

```http
POST /agents
Content-Type: application/json

{
  "name": "Code Generator",
  "model": "gpt-4-turbo",
  "role": "code-generator",
  "instructions": "Generate clean, well-documented code",
  "workspaceId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Code Generator",
  "model": "gpt-4-turbo",
  "role": "code-generator",
  "status": "idle",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Execute Task

```http
POST /agents/{agentId}/execute
Content-Type: application/json

{
  "task": "Implement user authentication system",
  "context": {
    "language": "JavaScript",
    "framework": "Express",
    "database": "PostgreSQL"
  }
}
```

**Response:** `202 Accepted`
```json
{
  "taskId": "uuid",
  "agentId": "uuid",
  "status": "queued",
  "message": "Task queued for execution"
}
```

### Stop Agent

```http
POST /agents/{agentId}/stop
```

**Response:**
```json
{
  "id": "uuid",
  "status": "stopped",
  "message": "Agent stopped"
}
```

### Delete Agent

```http
DELETE /agents/{agentId}
```

**Response:** `204 No Content`

---

## Models

### List Available Models

```http
GET /models
```

**Response:**
```json
[
  {
    "id": "gpt-4-turbo",
    "name": "GPT-4 Turbo",
    "provider": "openai",
    "description": "Latest GPT-4 model",
    "maxTokens": 128000,
    "costPer1kTokens": {
      "input": 0.01,
      "output": 0.03
    }
  }
]
```

### Get Model Details

```http
GET /models/{modelId}
```

**Response:**
```json
{
  "id": "gpt-4-turbo",
  "name": "GPT-4 Turbo",
  "provider": "openai",
  "description": "Latest GPT-4 model",
  "maxTokens": 128000,
  "costPer1kTokens": {
    "input": 0.01,
    "output": 0.03
  }
}
```

### List Providers

```http
GET /models/providers/list
```

**Response:**
```json
[
  {
    "name": "openai",
    "displayName": "OpenAI",
    "configured": true,
    "models": ["gpt-4-turbo", "gpt-4o"]
  }
]
```

### Configure Provider

```http
POST /models/providers/configure
Content-Type: application/json

{
  "provider": "openai",
  "apiKey": "sk-...",
  "apiEndpoint": "https://api.openai.com/v1"
}
```

**Response:**
```json
{
  "name": "openai",
  "displayName": "OpenAI",
  "configured": true,
  "message": "Provider configured successfully"
}
```

### Test Model

```http
POST /models/{modelId}/test
```

**Response:**
```json
{
  "status": "success",
  "message": "Model is working correctly",
  "testResponse": {
    "modelId": "gpt-4-turbo",
    "completion": "Hello! I'm working properly.",
    "tokensUsed": 5
  }
}
```

### Generate Completion

```http
POST /models/generate
Content-Type: application/json

{
  "modelId": "gpt-4-turbo",
  "prompt": "Write a Hello World function in Python",
  "systemPrompt": "You are an expert programmer",
  "maxTokens": 2048,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "modelId": "gpt-4-turbo",
  "prompt": "Write a Hello World function in Python",
  "completion": "def hello_world():\n    print('Hello, World!')",
  "tokensUsed": 25,
  "finishReason": "stop"
}
```

---

## Workspaces

### List Workspaces

```http
GET /workspaces
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My Project",
    "path": "/workspaces/my-project",
    "status": "ready",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Workspace

```http
GET /workspaces/{workspaceId}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Project",
  "description": "A demo project",
  "path": "/workspaces/my-project",
  "status": "ready",
  "agents": [],
  "files": [],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Create Workspace

```http
POST /workspaces
Content-Type: application/json

{
  "name": "My Project",
  "description": "A new project",
  "path": "/workspaces/my-project"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "My Project",
  "path": "/workspaces/my-project",
  "status": "ready",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### List Workspace Files

```http
GET /workspaces/{workspaceId}/files?path=src
```

**Response:**
```json
[
  {
    "name": "index.js",
    "path": "src/index.js",
    "isDirectory": false,
    "size": 1024,
    "modified": "2024-01-01T00:00:00Z"
  }
]
```

### Read File

```http
GET /workspaces/{workspaceId}/files/src/index.js
```

**Response:**
```json
{
  "path": "src/index.js",
  "content": "console.log('Hello');"
}
```

### Write File

```http
POST /workspaces/{workspaceId}/files/src/newFile.js
Content-Type: application/json

{
  "content": "console.log('New file');"
}
```

**Response:**
```json
{
  "path": "src/newFile.js",
  "size": 25,
  "created": "2024-01-01T00:00:00Z"
}
```

### Execute Command

```http
POST /workspaces/{workspaceId}/execute
Content-Type: application/json

{
  "command": "npm test",
  "cwd": "."
}
```

**Response:**
```json
{
  "command": "npm test",
  "status": "success",
  "stdout": "Test results...",
  "stderr": "",
  "exitCode": 0,
  "executedAt": "2024-01-01T00:00:00Z"
}
```

### Delete Workspace

```http
DELETE /workspaces/{workspaceId}
```

**Response:** `204 No Content`

---

## Tasks

### List Tasks

```http
GET /tasks
```

**Response:**
```json
[
  {
    "id": "uuid",
    "agentId": "uuid",
    "title": "Implement Auth",
    "status": "completed",
    "priority": "high",
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T01:00:00Z"
  }
]
```

### Get Task

```http
GET /tasks/{taskId}
```

**Response:**
```json
{
  "id": "uuid",
  "agentId": "uuid",
  "title": "Implement Auth",
  "description": "Add JWT authentication",
  "status": "completed",
  "priority": "high",
  "createdAt": "2024-01-01T00:00:00Z",
  "startedAt": "2024-01-01T00:05:00Z",
  "completedAt": "2024-01-01T01:00:00Z"
}
```

### Create Task

```http
POST /tasks
Content-Type: application/json

{
  "agentId": "uuid",
  "title": "Implement Auth",
  "description": "Add JWT authentication",
  "priority": "high"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "agentId": "uuid",
  "title": "Implement Auth",
  "status": "pending",
  "priority": "high",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Update Task

```http
PATCH /tasks/{taskId}
Content-Type: application/json

{
  "status": "completed",
  "priority": "medium"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "completed",
  "priority": "medium",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Delete Task

```http
DELETE /tasks/{taskId}
```

**Response:** `204 No Content`

---

## Artifacts

### List Artifacts for Task

```http
GET /artifacts/task/{taskId}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "taskId": "uuid",
    "type": "plan",
    "title": "Implementation Plan",
    "content": "1. Create models\n2. Add routes...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### Get Artifact

```http
GET /artifacts/{artifactId}
```

**Response:**
```json
{
  "id": "uuid",
  "taskId": "uuid",
  "type": "diff",
  "title": "Code Changes",
  "content": "diff --git a/file.js...",
  "metadata": {
    "linesAdded": 50,
    "linesRemoved": 10
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Create Artifact

```http
POST /artifacts
Content-Type: application/json

{
  "taskId": "uuid",
  "type": "plan",
  "title": "Implementation Plan",
  "content": "Step-by-step plan...",
  "metadata": {
    "priority": "high"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "taskId": "uuid",
  "type": "plan",
  "title": "Implementation Plan",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Update Artifact

```http
PATCH /artifacts/{artifactId}
Content-Type: application/json

{
  "content": "Updated content...",
  "metadata": { "reviewed": true }
}
```

**Response:**
```json
{
  "id": "uuid",
  "content": "Updated content...",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Delete Artifact

```http
DELETE /artifacts/{artifactId}
```

**Response:** `204 No Content`

---

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## WebSocket (ws://localhost:5000)

### Subscribe to Agent Updates

```json
{
  "type": "subscribe-agent",
  "payload": {
    "agentId": "uuid"
  }
}
```

### Send Command to Agent

```json
{
  "type": "agent-command",
  "payload": {
    "agentId": "uuid",
    "command": "python script.py",
    "commandId": "uuid"
  }
}
```

### Receive Updates

```json
{
  "type": "agent-status",
  "payload": {
    "agentId": "uuid",
    "status": "executing",
    "message": "Running task..."
  }
}
```

---

## Rate Limiting

Current implementation has no rate limiting. Future versions will include:
- 100 requests per minute per IP
- 1000 requests per hour per API key
- Streaming endpoints: 10 concurrent connections

---

## Changelog

### v0.1.0
- Initial implementation
- Agent management
- Model gateway
- Workspace management
- Task & artifact system
