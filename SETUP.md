# Getting Started with Open-Antigravity

Welcome to Open-Antigravity! This guide will help you set up and run the complete development environment.

## 🎉 Free AI Agent Included!

**Open-Antigravity now comes with free AI built-in!**

By default, it uses **Ollama** - a completely free, open-source, local AI engine. No API keys, no costs, no privacy concerns.

**Quick start:** Just install Ollama and you're ready to go!
- Download: https://ollama.ai
- Setup: `ollama pull mistral && ollama serve`
- More details: See [OLLAMA_SETUP.md](./OLLAMA_SETUP.md)

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([download](https://www.docker.com/products/docker-desktop))
- **Git** ([download](https://git-scm.com/))
- **Ollama** (Free, for AI) - [Download here](https://ollama.ai)

## Quick Start with Docker Compose

The easiest way to get everything running is with Docker Compose:

```bash
# 1. Install Ollama (for free AI)
# Download from https://ollama.ai and run: ollama pull mistral && ollama serve

# 2. Clone the repository
git clone https://github.com/ishandutta2007/open-antigravity.git
cd open-antigravity

# 3. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Start all services
docker-compose up -d

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Ollama (Free AI): localhost:11434
```

## Manual Setup (Local Development)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings (Ollama is pre-configured!)
nano .env

# Start the backend server
npm run dev
```

Backend will be available at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start the development server
npm start
```

Frontend will be available at `http://localhost:3000`

## Architecture Overview

```
┌──────────────────────────┐
│   Frontend (React)       │
│  Editor & Manager Views  │
└────────────┬─────────────┘
             │ (WebSocket/REST)
┌────────────▼──────────────────┐
│   Backend API Server (Node.js) │
│   Gateway & Routes             │
└──┬────────────┬─────────────┬──┘
   │            │             │
   │            │             │
┌──▼──┐  ┌─────▼────┐  ┌─────▼──────┐
│Agent │  │  Model   │  │ Workspace  │
│Orch. │  │ Gateway  │  │ Manager    │
└──────┘  └──────────┘  └────────────┘
   │            │             │
   └────────┬───┴─────────┬───┘
            │             │
        ┌───▼──┐  ┌──────▼──┐
        │  DB  │  │  Redis  │
        └──────┘  └─────────┘
```

## Project Structure

```
open-antigravity/
├── backend/
│   ├── api/
│   │   ├── server.js          # Main Express server
│   │   └── routes/            # API endpoint routes
│   ├── services/
│   │   ├── agent-orchestrator/
│   │   ├── model-gateway/
│   │   └── workspace-manager/
│   ├── database/
│   │   └── init.sql           # Database schema
│   ├── lib/
│   │   └── logger.js          # Logging utility
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EditorView/    # Code editor interface
│   │   │   ├── ManagerView/   # Mission control dashboard
│   │   │   └── common/        # Shared components
│   │   ├── services/
│   │   │   └── api.js         # API client
│   │   ├── hooks/
│   │   │   └── useApi.js      # React hooks for API
│   │   ├── store/
│   │   │   └── appStore.js    # State management
│   │   ├── styles/            # CSS modules
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── mitmserver/                # Man-in-the-middle proxy
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml         # Multi-container orchestration
└── SETUP.md                   # This file
```

## Key Features Implemented

### Backend Services

#### Agent Orchestrator (`backend/services/agent-orchestrator`)
- Create and manage autonomous AI agents
- Handle task execution and queuing
- Monitor agent health and status
- Support multi-agent coordination

#### Model Gateway (`backend/services/model-gateway`)
- Unified interface for multiple LLM providers
- Support for OpenAI, Anthropic, Google, Meta models
- Provider configuration and switching
- Streaming and non-streaming completions

#### Workspace Manager (`backend/services/workspace-manager`)
- Manage isolated development workspaces
- File system operations (read/write)
- Command execution in workspaces
- Workspace isolation and cleanup

### Frontend Features

#### Editor View
- Agent selection and creation
- File explorer
- Code editor integration
- Real-time task execution
- Output display

#### Manager View
- Agent monitoring dashboard
- Task queue visualization
- Artifact viewer (plans, logs, diffs, screenshots)
- Real-time status updates

## API Endpoints

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create new agent
- `POST /api/agents/:id/execute` - Execute task
- `POST /api/agents/:id/stop` - Stop agent
- `DELETE /api/agents/:id` - Delete agent

### Models
- `GET /api/models` - List available models
- `GET /api/models/providers/list` - List providers
- `POST /api/models/providers/configure` - Configure provider
- `POST /api/models/generate` - Generate completion

### Workspaces
- `GET /api/workspaces` - List workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id/files` - Get files
- `POST /api/workspaces/:id/execute` - Execute command

### Tasks & Artifacts
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/artifacts` - List artifacts
- `POST /api/artifacts` - Create artifact

## Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=antigravity
DB_PASSWORD=changeme
OPENAI_API_KEY=your_key_here
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
```

## Development Workflow

1. **Start backend**: `cd backend && npm run dev`
2. **Start frontend**: `cd frontend && npm start`
3. **Backend watches** for changes and auto-restarts
4. **Frontend** has hot module reloading (HMR)
5. **Check health**: Visit `http://localhost:5000/health`

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Building for Production

### Backend Build
```bash
cd backend
npm run build
```

### Frontend Build
```bash
cd frontend
npm run build
```

### Docker Production Build
```bash
docker-compose build
docker-compose -f docker-compose.yml up -d
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :5000    # Backend
lsof -i :3000    # Frontend
lsof -i :5432    # PostgreSQL

# Kill process
kill -9 <PID>
```

### Database Connection Errors
```bash
# Check PostgreSQL status
docker-compose ps
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up
```

### WebSocket Connection Issues
- Check browser console for errors
- Verify backend is running: `curl http://localhost:5000/health`
- Check firewall settings

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Support

- 📖 Check [DESIGN.md](./DESIGN.md) for architecture details
- 🗺️ See [ROADMAP.md](./ROADMAP.md) for future features
- 💬 Join our Discord community
- 📝 File issues on GitHub

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

**Ready to get started?** Run `docker-compose up -d` and visit http://localhost:3000!
