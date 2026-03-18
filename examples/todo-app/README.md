# TODO Application Example

A task management application with AI-powered task organization and scheduling.

## Features

- Create, read, update, delete tasks
- Organize tasks with labels and priorities
- AI-powered task suggestions
- Smart scheduling
- Collaboration support

## Agents

### Task Organizer
- Categorizes tasks automatically
- Suggests priority levels
- Identifies dependencies
- Recommends optimal order

### Smart Scheduler
- Estimates task duration
- Schedules tasks efficiently
- Detects conflicts
- Suggests best times

## Getting Started

```bash
ag init todo-app
cd todo-app
ag create-agent
ag start
```

## API Endpoints

- `POST /api/todos` - Create task
- `GET /api/todos` - List tasks
- `PATCH /api/todos/:id` - Update task
- `DELETE /api/todos/:id` - Delete task
- `POST /api/todos/:id/complete` - Mark complete

## Running Tests

```bash
ag test
```

## Architecture

```
┌─────────────┐        ┌──────────────┐
│   Frontend  │◄──────►│   Backend    │
└─────────────┘        └──────┬───────┘
                               │
                        ┌──────┴───────┐
                        │              │
                   ┌────▼────┐   ┌─────▼─────┐
                   │ Database │   │  Agents   │
                   └──────────┘   └───────────┘
```

## Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

## Contributing

Contributions welcome! Please see CONTRIBUTING.md
