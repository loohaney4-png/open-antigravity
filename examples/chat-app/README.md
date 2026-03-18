# Chat Application Example

A real-time chat application built with Open-Antigravity agents.

## Features

- Real-time messaging between users
- Message history and persistence
- User authentication
- Typing indicators
- Read receipts

## Project Structure

```
.
├── agents/
│   ├── message-processor.json
│   └── recommendation-engine.json
├── src/
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Conversation.js
│   ├── services/
│   │   ├── ChatService.js
│   │   └── NotificationService.js
│   └── main.js
└── .antigravity/
    └── config.json
```

## Agents

### Message Processor
- Processes and validates incoming messages
- Detects spam and inappropriate content
- Routes messages to correct conversations

### Recommendation Engine
- Suggests conversation topics
- Recommends relevant users to chat with
- Provides smart replies

## Getting Started

```bash
# Initialize
ag init chat-app

# Configure agents
ag create-agent

# Start services
ag start

# View logs
ag logs
```

## API Endpoints

- `POST /api/messages` - Send message
- `GET /api/conversations` - List conversations
- `GET /api/messages/:id` - Get messages
- `DELETE /api/messages/:id` - Delete message

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(255)
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user1_id UUID,
  user2_id UUID
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMP
);
```

## Testing

```bash
ag test
```

## Deployment

```bash
ag start
# Services available at http://localhost:3000
```

## Next Steps

- Add end-to-end encryption
- Implement message reactions
- Add group chat support
- Deploy to production
