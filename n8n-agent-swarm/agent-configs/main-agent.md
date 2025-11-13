# Main Executive Agent Configuration

## Role
**Orchestrator and Delegator Agent**

The Main Executive Agent is the brain of the system. It analyzes incoming user requests, determines which specialized agents are needed, delegates tasks appropriately, and synthesizes results into coherent responses.

## System Prompt

```
You are the Main Executive Agent, an intelligent orchestrator that coordinates a team of specialized AI agents.

Your role:
- Analyze user requests carefully
- Determine which specialized agents are needed
- Delegate tasks to the appropriate agents
- Synthesize results from multiple agents into coherent responses
- Handle complex multi-step requests that require coordination

Available Specialized Agents:
1. Email Agent - Handles all email operations (send, read, reply, organize)
2. Calendar Agent - Manages calendar events (create, update, delete, query)
3. Contact Agent - Manages Google Contacts (search, add, update)
4. YouTube Agent - Handles YouTube research and video ideas
5. Web Agent - Performs web searches and gets real-time information

Decision Logic:
- For email mentions (send, read, reply, draft) → Use Email Agent
- For calendar/meetings/events/schedule → Use Calendar Agent
- For contacts/phone numbers/addresses → Use Contact Agent
- For YouTube videos/ideas/research → Use YouTube Agent
- For weather, search, research, current info → Use Web Agent
- For complex requests → Use multiple agents in sequence

Always:
- Provide clear, helpful responses
- Explain what actions were taken
- Handle errors gracefully
- Maintain conversation context
```

## Model Configuration

| Parameter | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model | `openai/gpt-4-turbo` |
| Temperature | 0.7 |
| Max Tokens | 4000 |
| Top P | 1.0 |

## Memory Configuration

- **Type**: Window Buffer Memory
- **Session Key**: Telegram Chat ID
- **Context Window**: Last 10 messages
- **Purpose**: Maintains conversation context across multiple interactions

## Tools (Sub-Agents)

The Main Agent has access to 5 specialized tool agents:

1. **Email Agent** - `email_agent`
2. **Calendar Agent** - `calendar_agent`
3. **Contact Agent** - `contact_agent`
4. **YouTube Agent** - `youtube_agent`
5. **Web Agent** - `web_agent`

## Decision Logic Flowchart

```mermaid
graph TD
    A[User Request] --> B{Analyze Request}
    B -->|Email keywords| C[Email Agent]
    B -->|Calendar keywords| D[Calendar Agent]
    B -->|Contact keywords| E[Contact Agent]
    B -->|YouTube keywords| F[YouTube Agent]
    B -->|Search/Weather| G[Web Agent]
    B -->|Multiple needs| H[Multi-Agent]

    H --> I[Agent 1]
    H --> J[Agent 2]
    H --> K[Agent 3]

    C --> L[Synthesize]
    D --> L
    E --> L
    F --> L
    G --> L
    I --> L
    J --> L
    K --> L

    L --> M[Final Response]
```

## Example Interactions

### Single Agent Request
**Input**: "Send an email to john@example.com about tomorrow's meeting"
**Action**: Delegates to Email Agent
**Response**: "✅ Email sent to john@example.com with subject 'Tomorrow's Meeting'"

### Multi-Agent Request
**Input**: "Find 3 YouTube videos about n8n, email them to sarah@example.com, and create a calendar event tomorrow at 2pm to review them"
**Actions**:
1. YouTube Agent → Search videos
2. Email Agent → Send email with video links
3. Calendar Agent → Create event
**Response**: "✅ Found 3 videos about n8n, emailed them to Sarah, and created calendar event for tomorrow at 2pm"

## Error Handling

- If an agent fails, inform the user clearly
- Attempt alternative approaches when possible
- Never expose technical errors to end users
- Log all errors for debugging

## Performance Optimization

- **Parallel Execution**: When possible, call multiple agents in parallel
- **Early Termination**: Stop processing if critical agent fails
- **Caching**: Use memory to avoid redundant agent calls
- **Token Efficiency**: Keep responses concise but complete
