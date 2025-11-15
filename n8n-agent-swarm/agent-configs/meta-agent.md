# Meta Agent Configuration - Self-Modifying System

## Role
**System Evolution & Code Generation Agent**

The Meta Agent is a revolutionary component that enables the system to **modify itself**. It can create new agents, update the workflow, and commit changes to GitHub - all through natural language commands via Telegram.

## System Prompt

```
You are the Meta Agent, a powerful system evolution specialist that can modify and extend the n8n Agent Swarm system itself.

Your unique capabilities:
- Generate new AI agents with complete configurations
- Modify the n8n workflow JSON to add new nodes
- Create API integration code
- Commit and push changes to GitHub
- Generate documentation for new agents
- Test new integrations

When a user requests a new agent or feature:
1. Analyze the request and determine what needs to be created
2. Generate the agent configuration file
3. Create necessary API integration code
4. Update the workflow JSON to include the new agent
5. Generate documentation
6. Commit changes to GitHub
7. Provide deployment instructions

Available Tools:
- agent_generator: Generate new agent configurations
- workflow_updater: Modify n8n workflow JSON
- github_commit: Commit and push changes
- code_generator: Generate integration code
- documentation_generator: Create docs for new features

Safety Guidelines:
- Always validate generated code
- Test integrations before deployment
- Never delete existing agents without confirmation
- Maintain system stability
- Follow security best practices
- Request user confirmation for major changes

Example Requests:
- "Add a Snapchat agent to manage my Snapchat account"
- "Create an agent for Twitter that can post tweets"
- "Add Notion integration to manage databases"
- "Build a Slack agent for team communication"
```

## Model Configuration

| Parameter | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model | `openai/gpt-4-turbo` |
| Temperature | 0.3 |
| Max Tokens | 6000 |
| Reasoning | Chain-of-Thought enabled |

## Available Tools

### 1. agent_generator
**Purpose**: Generate complete agent configuration

**Input:**
```json
{
  "agent_name": "snapchat_agent",
  "description": "Manages Snapchat account operations",
  "capabilities": [
    "Post snaps",
    "View stories",
    "Send messages",
    "Manage friends"
  ],
  "api_endpoint": "https://api.snapchat.com",
  "auth_method": "oauth2"
}
```

**Output:**
- Agent config file (`.md`)
- System prompt
- Tool definitions
- API integration code

### 2. workflow_updater
**Purpose**: Add new agent to n8n workflow

**Actions:**
- Insert new agent node
- Connect to Main Agent
- Add API nodes
- Update connections
- Validate JSON structure

### 3. github_commit
**Purpose**: Commit and push changes

**Actions:**
```bash
git checkout -b feature/add-snapchat-agent
git add agent-configs/snapchat-agent.md
git add n8n-workflows/main-workflow.json
git commit -m "Add Snapchat agent"
git push origin feature/add-snapchat-agent
```

### 4. code_generator
**Purpose**: Generate API integration code

**Generates:**
- API client wrappers
- Authentication handlers
- Request/response formatters
- Error handlers

### 5. documentation_generator
**Purpose**: Create documentation

**Creates:**
- Agent usage guide
- API setup instructions
- Example interactions
- Troubleshooting section

## Usage Examples

### Example 1: Add Snapchat Agent

**User Request:**
```
"Add a Snapchat agent so I can post stories and send snaps via Telegram"
```

**Meta Agent Process:**

1. **Analysis:**
   - New agent needed: Snapchat
   - Capabilities: Post stories, send snaps, view messages
   - API: Snapchat API (unofficial)

2. **Generation:**
   ```
   ✅ Generating Snapchat Agent configuration...
   ✅ Creating API integration code...
   ✅ Updating n8n workflow JSON...
   ✅ Generating documentation...
   ```

3. **GitHub Commit:**
   ```bash
   git checkout -b feature/snapchat-agent
   git add agent-configs/snapchat-agent.md
   git add n8n-workflows/main-workflow.json
   git add docs/agents/SNAPCHAT.md
   git commit -m "feat: Add Snapchat agent with story posting capabilities"
   git push origin feature/snapchat-agent
   ```

4. **Response:**
   ```
   ✅ Snapchat Agent created successfully!

   New capabilities:
   • Post stories to Snapchat
   • Send snaps to friends
   • View incoming snaps
   • Manage friend list

   Files created:
   • agent-configs/snapchat-agent.md
   • docs/agents/SNAPCHAT.md

   GitHub:
   • Branch: feature/snapchat-agent
   • Commit: a3f2b1c
   • PR: #12 (auto-created)

   Next steps:
   1. Review the pull request
   2. Merge to main
   3. Add Snapchat API credentials
   4. Try: "Post a story saying Hello World"
   ```

### Example 2: Add Twitter Agent

**User Request:**
```
"Create a Twitter agent that can tweet, read my timeline, and reply to mentions"
```

**Meta Agent Response:**
```
✅ Twitter Agent created!

Capabilities:
• Post tweets (text, images, videos)
• Read home timeline
• Reply to mentions
• Retweet and like
• Send DMs
• Search tweets

Files:
• agent-configs/twitter-agent.md
• scripts/integrations/twitter-api.js
• docs/agents/TWITTER.md

Setup required:
1. Get Twitter API keys from developer.twitter.com
2. Add to .env:
   TWITTER_API_KEY=...
   TWITTER_API_SECRET=...
   TWITTER_ACCESS_TOKEN=...
   TWITTER_ACCESS_SECRET=...
3. Configure in n8n credentials

Try it:
"Tweet: Just added a Twitter agent to my n8n swarm! 🤖"
```

### Example 3: Add Notion Integration

**User Request:**
```
"Integrate Notion so I can create pages, update databases, and search my workspace"
```

**Meta Agent Process:**
```
🔍 Analyzing request...
   → Service: Notion
   → Operations: Create pages, update DB, search
   → API: Notion API v1

🛠️ Generating agent...
   ✅ Created Notion Agent configuration
   ✅ Generated Notion API wrapper
   ✅ Added database query tools
   ✅ Created search functionality

📝 Documentation created:
   • Agent config: agent-configs/notion-agent.md
   • Setup guide: docs/agents/NOTION.md
   • Example queries included

🔄 Updating workflow...
   ✅ Added Notion Agent node
   ✅ Connected to Main Agent
   ✅ Added API nodes for CRUD operations

💾 Committing changes...
   Branch: feature/notion-integration
   Commit: "feat: Add Notion agent with database operations"
   PR: #13 (created)

✅ Notion Agent ready!

Usage examples:
• "Create a Notion page called 'Meeting Notes'"
• "Add task 'Review PR' to my Tasks database"
• "Search my Notion for 'budget 2024'"
```

## Agent Template Structure

When creating a new agent, the Meta Agent follows this template:

```markdown
# {Agent Name} Agent Configuration

## Role
{Agent purpose and specialty}

## System Prompt
```
You are the {Name} Agent, specialized in {domain}.

Capabilities:
- {Capability 1}
- {Capability 2}
- {Capability 3}

When handling requests:
1. {Instruction 1}
2. {Instruction 2}

Tools available:
- {tool_1}: {description}
- {tool_2}: {description}

Always {best practice}.
```

## Model Configuration
{Model settings}

## Available Tools
{Tool definitions}

## Examples
{Usage examples}
```

## Workflow Update Process

### Before:
```json
{
  "nodes": [
    {"id": "main-agent"},
    {"id": "email-agent"},
    {"id": "calendar-agent"}
  ]
}
```

### After Adding Snapchat Agent:
```json
{
  "nodes": [
    {"id": "main-agent"},
    {"id": "email-agent"},
    {"id": "calendar-agent"},
    {"id": "snapchat-agent", "type": "toolAgent", "new": true}
  ],
  "connections": {
    "Main Executive Agent": {
      "ai_tool": [
        [
          {"node": "Email Agent Tool"},
          {"node": "Calendar Agent Tool"},
          {"node": "Snapchat Agent Tool"}  // NEW
        ]
      ]
    }
  }
}
```

## Safety & Validation

### Pre-Deployment Checks

1. **Code Validation:**
   - Syntax check all generated code
   - Validate JSON structure
   - Test API endpoints

2. **Security Scan:**
   - Check for hardcoded credentials
   - Validate input sanitization
   - Review API permissions

3. **Integration Test:**
   - Test agent in isolation
   - Verify workflow connections
   - Check error handling

4. **User Confirmation:**
   - Show summary of changes
   - Request approval for deployment
   - Explain new capabilities

## Advanced Features

### 1. Agent Improvement
```
User: "Make the Email Agent better at understanding context"
Meta: Updates Email Agent prompt with enhanced instructions
```

### 2. Custom Tools
```
User: "Add a tool to the Web Agent for scraping websites"
Meta: Creates custom scraping tool and adds to Web Agent
```

### 3. Workflow Optimization
```
User: "Optimize the workflow for faster responses"
Meta: Analyzes and restructures workflow for efficiency
```

## 🤖 Automated Agent Creation (GitHub Actions)

### Overview

The Meta Agent can trigger **fully automated agent creation and deployment** via GitHub Actions. When you request a new agent through Telegram, the system automatically:

1. ✅ Generates agent configuration
2. ✅ Updates n8n workflow JSON
3. ✅ Commits changes to GitHub
4. ✅ Deploys to Fly.io
5. ✅ Sends Telegram notification when ready

### How It Works

**Step 1: User Request via Telegram**
```
"Create a Twitter agent for posting tweets"
```

**Step 2: Meta Agent Triggers GitHub API**
The Meta Agent calls the GitHub repository_dispatch API to trigger the automation workflow.

**GitHub API Call:**
```http
POST /repos/LBCron/workflows/dispatches
Authorization: Bearer $GITHUB_TOKEN

{
  "event_type": "create-agent",
  "client_payload": {
    "agent_name": "twitter",
    "agent_type": "social"
  }
}
```

**Step 3: GitHub Actions Executes**
- Creates `agent-configs/twitter-agent.md`
- Updates `n8n-workflows/main-workflow.json`
- Commits and pushes changes
- Deploys to Fly.io
- Sends success notification

**Step 4: Ready to Use**
```
Bot: "✅ Twitter Agent deployed and ready!
     Try: 'Use Twitter to post a tweet'"
```

### Implementation in n8n Workflow

**HTTP Request Node Configuration:**

```json
{
  "method": "POST",
  "url": "https://api.github.com/repos/{{ $env.GITHUB_REPOSITORY }}/dispatches",
  "authentication": "genericCredentialType",
  "genericAuthType": "httpHeaderAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "Bearer {{ $env.GITHUB_TOKEN }}"
      },
      {
        "name": "Accept",
        "value": "application/vnd.github+json"
      },
      {
        "name": "X-GitHub-Api-Version",
        "value": "2022-11-28"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "event_type",
        "value": "create-agent"
      },
      {
        "name": "client_payload",
        "value": {
          "agent_name": "={{ $json.agent_name }}",
          "agent_type": "={{ $json.agent_type }}"
        }
      }
    ]
  }
}
```

### Response Templates

**When automation is triggered:**
```
🔮 Meta Agent activated!

Creating {{ agent_name }} Agent...

✅ Automation triggered
📊 GitHub Actions is processing your request
⏰ Expected completion: 3-5 minutes

You'll receive a notification when the agent is deployed and ready to use.

Track progress: https://github.com/LBCron/workflows/actions
```

**After successful deployment:**
```
✅ {{ agent_name }} Agent Deployed!

🤖 Agent created and deployed successfully

📋 What was done:
• Created agent configuration
• Updated n8n workflow
• Deployed to Fly.io
• Ready to use!

🎯 Try it now:
"Use {{ agent_name }} to..."
```

### Required Environment Variables

In n8n (or .env):
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPOSITORY=LBCron/workflows
TELEGRAM_BOT_TOKEN=1234567890:ABCdef...
TELEGRAM_CHAT_ID=123456789
```

### CLI Alternative

For manual/testing use:
```bash
# Trigger via script
node scripts/trigger-agent-creation.js twitter social

# Check status
gh workflow list
gh run list --workflow=auto-deploy-agent.yml
```

## Limitations

- Cannot modify core n8n infrastructure
- Requires API access for new services
- Must maintain workflow compatibility
- Limited to supported n8n node types
- GitHub Actions deployment takes 3-5 minutes

## Best Practices

1. **Start Simple:** Create basic agent first, enhance later
2. **Test Thoroughly:** Validate before deployment
3. **Document Well:** Generate comprehensive docs
4. **Version Control:** Always commit changes
5. **User Feedback:** Iterate based on usage
6. **Monitor Actions:** Check GitHub Actions logs for issues
7. **Rate Limits:** Be mindful of GitHub API rate limits

---

**The Meta Agent makes the system truly intelligent and adaptive! 🧠✨**

**With automated deployment, creating new agents is as simple as sending a Telegram message! 🚀**
