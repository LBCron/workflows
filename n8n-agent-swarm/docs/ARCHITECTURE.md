# 🏛️ Architecture - n8n Agent Swarm

Technical architecture and system design documentation.

## System Overview

The n8n Agent Swarm is a multi-agent system where a Main Executive Agent orchestrates specialized sub-agents to complete complex tasks.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Telegram User                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ Voice/Text Message
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     Telegram Trigger                         │
│                   (Webhook/Polling)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Voice Message?       │
         └──────┬──────────┬──────┘
                │ Yes      │ No
                ▼          ▼
         ┌──────────┐   ┌────────┐
         │ Whisper  │   │  Text  │
         │  (STT)   │   │        │
         └────┬─────┘   └────┬───┘
              │              │
              └──────┬───────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Main Executive Agent (GPT-4)                    │
│                                                              │
│  • Analyzes user intent                                     │
│  • Decides which agents to call                             │
│  • Coordinates multi-step workflows                         │
│  • Synthesizes results                                      │
└──────┬──────┬───────┬─────────┬──────────┬─────────────────┘
       │      │       │         │          │
       ▼      ▼       ▼         ▼          ▼
┌──────────┐┌─────────┐┌────────┐┌─────────┐┌──────────┐
│  Email   ││Calendar ││Contact ││YouTube  ││   Web    │
│  Agent   ││ Agent   ││ Agent  ││ Agent   ││  Agent   │
└────┬─────┘└────┬────┘└────┬───┘└────┬────┘└────┬─────┘
     │           │          │         │          │
     ▼           ▼          ▼         ▼          ▼
┌─────────┐┌──────────┐┌────────┐┌─────────┐┌─────────┐
│  Gmail  ││ Calendar ││Contacts││ YouTube ││Tavily/  │
│   API   ││   API    ││  API   ││   API   ││Weather  │
└─────────┘└──────────┘└────────┘└─────────┘└─────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ Google Sheets   │
           │    (Logging)    │
           └─────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │ Telegram Reply  │
           └─────────────────┘
```

## Component Architecture

### 1. Main Executive Agent

**Role**: Orchestrator and decision maker

**Responsibilities**:
- Parse and understand user requests
- Determine which specialized agents to invoke
- Handle multi-step workflows
- Synthesize results from multiple agents
- Maintain conversation context

**Technology**:
- LangChain Conversational Agent
- OpenRouter GPT-4 Turbo
- Window Buffer Memory (session-based)

**Decision Logic**:
```javascript
if (request.includes('email')) → EmailAgent
if (request.includes('calendar')) → CalendarAgent
if (request.includes('contact')) → ContactAgent
if (request.includes('youtube')) → YouTubeAgent
if (request.includes('weather|search')) → WebAgent
if (complex_request) → Multiple Agents
```

### 2. Specialized Agents

Each agent is a LangChain Tool Agent with:
- Specific system prompt
- Access to relevant APIs
- Domain expertise

#### Email Agent
```yaml
Model: GPT-4 Turbo
Temperature: 0.5
Tools:
  - Gmail Send
  - Gmail Get/Search
  - Gmail Reply
  - Gmail Labels
  - Gmail Draft
```

#### Calendar Agent
```yaml
Model: GPT-4 Turbo
Temperature: 0.3
Tools:
  - Google Calendar Create
  - Google Calendar Update
  - Google Calendar Delete
  - Google Calendar Query
```

#### Contact Agent
```yaml
Model: GPT-4 Turbo
Temperature: 0.3
Tools:
  - Google Contacts Get
  - Google Contacts Add
  - Google Contacts Update
```

#### YouTube Agent
```yaml
Model: GPT-4 Turbo
Temperature: 0.6
Tools:
  - YouTube Search
  - YouTube Stats
  - Video Ideas Database
```

#### Web Agent
```yaml
Model: GPT-4 Turbo
Temperature: 0.7
Tools:
  - Tavily Search
  - Perplexity API
  - OpenWeatherMap
```

## Data Flow

### Single Agent Flow

```
User → Telegram → Main Agent → Email Agent → Gmail API
                       ↓
                  Synthesize
                       ↓
                Google Sheets Log
                       ↓
                Telegram Response
```

### Multi-Agent Flow

```
User: "Find videos, email them, create meeting"

Main Agent analyzes → Needs 3 agents

    ┌─────────────┐
    │ Main Agent  │
    └──┬──┬───┬───┘
       │  │   │
       1  2   3
       │  │   │
┌──────▼──▼───▼─────┐
│ YouTube │ Email  │
│         │ Calendar│
└─────────┴────────┘
       │
   Synthesize
       │
       ▼
    Response
```

## Memory & State Management

### Session Management

```javascript
{
  sessionKey: `telegram:${chatId}`,
  memory: {
    type: "WindowBufferMemory",
    size: 10,  // Last 10 messages
    contents: [
      {role: "user", content: "..."},
      {role: "assistant", content: "..."}
    ]
  }
}
```

### Conversation Context

The system maintains context across interactions using:
- Telegram Chat ID as session key
- Window Buffer Memory (last 10 exchanges)
- Workflow execution variables

## Error Handling

### Error Flow

```
Error Occurs
    ↓
Error Handler Node
    ↓
Log to Sheets (with error)
    ↓
Send User-Friendly Message
```

### Error Types

1. **API Errors**: Caught and retried (3 attempts)
2. **Invalid Input**: Validated before processing
3. **Rate Limits**: Handled with exponential backoff
4. **Timeout**: 5-minute execution limit

## Logging & Monitoring

### Google Sheets Logger

Every interaction is logged with:

| Field | Description |
|-------|-------------|
| Timestamp | ISO 8601 timestamp |
| User | Telegram user name |
| Input | User's original message |
| Output | Bot's response |
| Agents Called | List of agents used |
| Execution Time | Duration in ms |
| Success | Boolean success flag |
| Error | Error message if failed |

### Log Example

```csv
Timestamp,User,Input,Output,Agents Called,Success
2024-11-13T10:30:00Z,John,"Send email to...",✅ Email sent,Email Agent,true
```

## Security Architecture

### API Key Management

```
Environment Variables (.env)
    ↓
Docker Compose
    ↓
n8n Credentials Store (encrypted)
    ↓
Workflow Nodes
```

### OAuth Flow

```
User → n8n → Google OAuth → Authorization
                  ↓
              Access Token (stored encrypted)
                  ↓
              API Calls
```

## Performance Optimization

### Caching Strategy

- **Workflow Definition**: Cached in memory
- **Credentials**: Encrypted at rest
- **LLM Responses**: Not cached (dynamic)

### Concurrent Execution

- **Max Concurrent Workflows**: 10 (configurable)
- **Queue**: FIFO queue for overflow
- **Timeout**: 5 minutes per execution

### Cost Optimization

- **Model Selection**: GPT-4 Turbo (cost-effective)
- **Prompt Optimization**: Concise system prompts
- **Token Limits**: 4000 max tokens
- **Streaming**: Not used (complete responses)

## Scalability

### Horizontal Scaling

```
Load Balancer
    ↓
┌────────┬────────┬────────┐
│ n8n #1 │ n8n #2 │ n8n #3 │
└────┬───┴────┬───┴────┬───┘
     └────────┼────────┘
              ↓
        PostgreSQL
```

### Vertical Scaling

Recommended specs:
- **Development**: 2 CPU, 4GB RAM
- **Production**: 4 CPU, 8GB RAM
- **High Traffic**: 8 CPU, 16GB RAM

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Orchestration** | n8n |
| **AI Framework** | LangChain |
| **LLM** | GPT-4 Turbo (OpenRouter) |
| **Voice** | OpenAI Whisper |
| **Database** | PostgreSQL |
| **Container** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Google Sheets (basic) |

## Network Architecture

```
Internet
    ↓
Telegram API (incoming messages)
    ↓
n8n Webhook (port 5678)
    ↓
Agent Processing
    ↓
External APIs (Gmail, Calendar, etc.)
    ↓
Response to Telegram
```

### Port Configuration

- **5678**: n8n web interface & webhooks
- **5432**: PostgreSQL (internal only)

## Deployment Architecture

### Development

```
Local Machine
    ↓
Docker Compose
    ↓
n8n + PostgreSQL containers
```

### Production

```
Cloud Server (AWS/GCP/Azure)
    ↓
Reverse Proxy (Nginx + SSL)
    ↓
Docker Compose
    ↓
n8n + PostgreSQL + Backups
```

## Future Enhancements

1. **Redis Caching**: For high-traffic deployments
2. **Qdrant Vector DB**: For semantic search
3. **Prometheus Metrics**: Advanced monitoring
4. **Kubernetes**: For auto-scaling
5. **CDN**: Static asset delivery

---

**Questions?**

See [Installation Guide](INSTALLATION.md) or [Troubleshooting](TROUBLESHOOTING.md)
