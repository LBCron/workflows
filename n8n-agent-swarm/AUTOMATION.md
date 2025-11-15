# 🤖 Automated Agent Creation & Deployment

Complete guide to the automated agent creation system that lets you create and deploy new AI agents directly from Telegram.

## 🎯 Overview

This system enables **fully automated agent creation** via Telegram messages. Say "Create a Twitter agent" and the system will:

1. ✅ Generate agent configuration
2. ✅ Update n8n workflow JSON
3. ✅ Commit changes to GitHub
4. ✅ Deploy to Fly.io
5. ✅ Notify you when ready

**Total time: 3-5 minutes** from Telegram message to live deployment.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Automation Flow                          │
└─────────────────────────────────────────────────────────────┘

1. Telegram Message
   ↓
   "Create a Twitter agent"

2. Meta Agent (n8n)
   ↓
   • Parses request
   • Extracts agent name & type
   • Calls GitHub API

3. GitHub API
   ↓
   POST /repos/LBCron/workflows/dispatches
   Event: create-agent

4. GitHub Actions
   ↓
   • Generate agent config
   • Update workflow JSON
   • Commit & push
   • Deploy to Fly.io

5. Telegram Notification
   ↓
   "✅ Twitter Agent deployed!"
```

---

## 🔧 Setup & Configuration

### Step 1: GitHub Personal Access Token

Create a token with **repo** scope:

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `n8n-agent-swarm-automation`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Generate token
6. Copy the token (starts with `ghp_...`)

### Step 2: Get Telegram Chat ID

```bash
# Send a message to your bot, then run:
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates

# Look for "chat":{"id":123456789}
# That's your TELEGRAM_CHAT_ID
```

### Step 3: Configure Environment Variables

**Local (.env file):**
```bash
# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPOSITORY=LBCron/workflows

# Telegram Notifications
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# Fly.io Deployment (optional)
FLY_API_TOKEN=fo1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**GitHub Secrets:**

Add these in: `https://github.com/LBCron/workflows/settings/secrets/actions`

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GITHUB_TOKEN` | `ghp_...` | Automatically provided by GitHub |
| `TELEGRAM_BOT_TOKEN` | `1234567890:ABC...` | Your Telegram bot token |
| `TELEGRAM_CHAT_ID` | `123456789` | Your Telegram chat ID |
| `FLY_API_TOKEN` | `fo1_...` | Fly.io API token (optional) |

**To add secrets:**
```bash
# Using GitHub CLI
gh secret set TELEGRAM_BOT_TOKEN
gh secret set TELEGRAM_CHAT_ID
gh secret set FLY_API_TOKEN

# Or manually via web interface
```

### Step 4: Get Fly.io API Token (Optional)

For automatic deployment to Fly.io:

```bash
# Login to Fly.io
fly auth login

# Get auth token
fly auth token

# Copy the token (starts with fo1_...)
```

---

## 🚀 Usage

### Via Telegram (Recommended)

Simply send a message to your Telegram bot:

**Examples:**

```
"Create a Twitter agent for posting tweets"

"Add a Snapchat agent"

"Build a Discord agent for managing servers"

"Create a Notion agent to manage databases"
```

**The Meta Agent will:**
1. Parse your request
2. Extract agent name (twitter, snapchat, etc.)
3. Trigger GitHub Actions
4. Send you updates

**Response:**
```
🔮 Meta Agent activated!

Creating Twitter Agent...

✅ Automation triggered
📊 GitHub Actions is processing your request
⏰ Expected completion: 3-5 minutes

You'll receive a notification when deployed.

Track: https://github.com/LBCron/workflows/actions
```

**After 3-5 minutes:**
```
✅ Twitter Agent Deployed!

🤖 Ready to use

📋 What was done:
• Created agent configuration
• Updated n8n workflow
• Deployed to Fly.io

🎯 Try: "Use Twitter to post a tweet"
```

### Via CLI (Manual/Testing)

```bash
# Trigger agent creation
node scripts/trigger-agent-creation.js twitter social

# Check workflow status
gh run list --workflow=auto-deploy-agent.yml

# View logs
gh run view --log

# Manual workflow dispatch (GitHub UI)
# Go to: Actions → Auto-Deploy Agent → Run workflow
```

---

## 📋 Workflow Details

### GitHub Actions Workflow

**File:** `.github/workflows/auto-deploy-agent.yml`

**Triggers:**
- `repository_dispatch` event with type `create-agent`
- Manual `workflow_dispatch`

**Steps:**

1. **Notify Start** - Telegram notification
2. **Checkout** - Clone repository
3. **Setup Node.js** - Install Node 18
4. **Generate Agent** - Run `scripts/generate-agent.js`
5. **Update Workflow** - Run `scripts/add-agent-to-workflow.js`
6. **Validate** - Check workflow JSON
7. **Commit** - Commit changes with descriptive message
8. **Push** - Push to GitHub
9. **Deploy** - Deploy to Fly.io (if token configured)
10. **Notify** - Send success/failure notification

**Expected Duration:** 2-4 minutes

### Scripts

**1. `scripts/generate-agent.js`**
- Generates agent configuration from templates
- Creates `agent-configs/{name}-agent.md`
- Supports pre-built templates for popular services

**2. `scripts/add-agent-to-workflow.js`**
- Reads `n8n-workflows/main-workflow.json`
- Creates new agent node + LLM node
- Connects to Main Agent
- Saves updated workflow
- Creates backup

**3. `scripts/trigger-agent-creation.js`**
- Calls GitHub API to trigger workflow
- Validates GitHub token
- Can be used from CLI or n8n

---

## 🔍 Monitoring & Debugging

### Check GitHub Actions

```bash
# List recent runs
gh run list --workflow=auto-deploy-agent.yml

# View specific run
gh run view <run-id>

# Download logs
gh run download <run-id>

# Watch run in real-time
gh run watch <run-id>
```

### View in GitHub UI

1. Go to: https://github.com/LBCron/workflows/actions
2. Click on **"Auto-Deploy Agent"** workflow
3. See all runs and their status
4. Click on a run to see detailed logs

### Telegram Notifications

You'll receive notifications for:
- ✅ Deployment started
- ✅ Deployment succeeded
- ❌ Deployment failed (with error link)

### Common Issues

**Issue: "Workflow not triggered"**
- Check `GITHUB_TOKEN` is valid
- Verify token has `repo` and `workflow` scopes
- Check `GITHUB_REPOSITORY` format: `owner/repo`

**Issue: "Agent already exists"**
- The agent was already created
- Check `agent-configs/` directory
- Use a different name or delete existing agent

**Issue: "Deployment failed"**
- Check GitHub Actions logs
- Verify all secrets are configured
- Ensure Fly.io token is valid (if deploying)

**Issue: "Telegram notification not sent"**
- Verify `TELEGRAM_BOT_TOKEN` secret
- Check `TELEGRAM_CHAT_ID` is correct
- Test manually: `curl https://api.telegram.org/bot<TOKEN>/sendMessage -d chat_id=<ID> -d text=test`

---

## 🔐 Security

### Secrets Management

**Never commit secrets to Git:**
- ✅ Use `.env` file (in `.gitignore`)
- ✅ Use GitHub Secrets for Actions
- ✅ Use Fly.io secrets for deployment

**Token Security:**
- 🔒 GitHub tokens have repository access - keep them secret
- 🔒 Rotate tokens regularly
- 🔒 Use minimum required scopes
- 🔒 Revoke unused tokens

### GitHub Actions Security

**Best Practices:**
- ✅ Review workflow files before merging
- ✅ Limit who can trigger workflows
- ✅ Use environment protection rules
- ✅ Monitor Actions usage and logs

**Permissions:**

The workflow has these permissions:
```yaml
permissions:
  contents: write    # Push commits
  actions: write     # Trigger workflows
```

---

## 🎯 Advanced Usage

### Custom Agent Templates

Create custom templates in `scripts/generate-agent.js`:

```javascript
const serviceTemplates = {
  custom_service: {
    name: 'Custom Service',
    description: 'Custom agent for...',
    capabilities: [
      'Custom capability 1',
      'Custom capability 2'
    ],
    tools: [
      {
        name: 'custom_tool',
        description: 'Tool description',
        parameters: { /* ... */ }
      }
    ]
  }
};
```

### Manual Workflow Modification

Instead of fully automated, you can:

```bash
# 1. Generate agent config only
node scripts/generate-agent.js twitter

# 2. Review the generated config
cat agent-configs/twitter-agent.md

# 3. Manually edit if needed
nano agent-configs/twitter-agent.md

# 4. Add to workflow
node scripts/add-agent-to-workflow.js twitter

# 5. Commit manually
git add .
git commit -m "feat: Add Twitter agent"
git push

# 6. Deploy
fly deploy
```

### Batch Agent Creation

Create multiple agents at once:

```bash
#!/bin/bash
# create-agents.sh

agents=("twitter" "instagram" "tiktok" "linkedin")

for agent in "${agents[@]}"; do
  echo "Creating $agent agent..."
  node scripts/trigger-agent-creation.js "$agent" social
  sleep 10  # Wait between triggers
done
```

---

## 📊 Performance

### Timing Breakdown

| Step | Duration | Notes |
|------|----------|-------|
| GitHub Actions start | 10-20s | Queue time |
| Checkout & setup | 20-30s | Clone + Node install |
| Generate agent | 5-10s | Template processing |
| Update workflow | 5-10s | JSON modification |
| Commit & push | 10-15s | Git operations |
| Fly.io deploy | 2-3min | Container build + deploy |
| Telegram notify | 1-2s | API call |
| **Total** | **3-5 min** | End-to-end |

### Resource Usage

- **GitHub Actions minutes:** ~4 min per agent creation
- **Free tier:** 2,000 min/month = ~500 agents/month
- **Paid tier:** $0.008/min = ~$0.032 per agent

### Optimization Tips

1. **Skip Fly.io deploy** during testing (remove `FLY_API_TOKEN`)
2. **Use workflow caching** for faster Node.js setup
3. **Batch commits** if creating multiple agents
4. **Use workflow_dispatch** for immediate execution

---

## 🧪 Testing

### Test the Complete Flow

```bash
# 1. Test GitHub token
node scripts/trigger-agent-creation.js test-agent social

# 2. Check GitHub Actions
gh run list --workflow=auto-deploy-agent.yml

# 3. Verify agent created
ls -la agent-configs/test-agent-agent.md

# 4. Check workflow updated
grep -A 5 "test-agent" n8n-workflows/main-workflow.json

# 5. Clean up test agent
git rm agent-configs/test-agent-agent.md
node scripts/remove-agent-from-workflow.js test-agent  # (create this if needed)
```

### Test Individual Components

**Generate agent only:**
```bash
node scripts/generate-agent.js snapchat
```

**Add to workflow only:**
```bash
node scripts/add-agent-to-workflow.js snapchat
```

**Trigger GitHub only:**
```bash
node scripts/trigger-agent-creation.js snapchat social
```

---

## 📚 Examples

### Example 1: Social Media Agent

**Request:**
```
"Create an Instagram agent for posting photos"
```

**Result:**
- `agent-configs/instagram-agent.md` created
- Workflow updated with Instagram Agent node
- Deployed and ready in 4 minutes

**Usage:**
```
"Use Instagram to post this photo with caption..."
```

### Example 2: Productivity Agent

**Request:**
```
"Add a Notion agent to manage my databases"
```

**Result:**
- `agent-configs/notion-agent.md` created
- Notion API integration configured
- Ready to manage Notion databases

**Usage:**
```
"Use Notion to create a new task in my TODO database"
```

### Example 3: Communication Agent

**Request:**
```
"Build a Discord agent for server management"
```

**Result:**
- `agent-configs/discord-agent.md` created
- Discord bot integration ready
- Can manage channels, roles, messages

**Usage:**
```
"Use Discord to send a message to #general channel"
```

---

## 🎓 Best Practices

### 1. Naming Conventions

- **Agent names:** lowercase, no spaces (e.g., `twitter`, `google-drive`)
- **Commit messages:** Follow conventional commits
- **Branch names:** Use feature branches for major changes

### 2. Testing Strategy

1. Test in development first
2. Use manual workflow dispatch initially
3. Verify each component works
4. Enable automated triggers when confident

### 3. Deployment Strategy

1. **Development:** Skip Fly.io deploy, test locally
2. **Staging:** Deploy to staging environment
3. **Production:** Full automated deployment

### 4. Monitoring

- Set up GitHub Actions notifications
- Monitor Telegram for deployment updates
- Check Fly.io logs regularly
- Review commit history

---

## 🔄 Maintenance

### Regular Tasks

**Weekly:**
- Review created agents
- Check GitHub Actions usage
- Verify Fly.io deployment status
- Update agent templates

**Monthly:**
- Rotate GitHub tokens
- Review and clean up unused agents
- Update dependencies
- Optimize workflow performance

**As Needed:**
- Add new agent templates
- Update Meta Agent prompts
- Improve error handling
- Enhance notifications

---

## 🆘 Support & Troubleshooting

### Get Help

1. **Check logs:** GitHub Actions → Workflow run → View logs
2. **Test components:** Use CLI scripts individually
3. **Verify secrets:** GitHub Settings → Secrets
4. **Review commits:** Check what was changed
5. **Ask Meta Agent:** "Explain the automation system"

### Debug Mode

Enable verbose logging:

```bash
# In .env
DEBUG=true
GITHUB_ACTIONS_VERBOSE=true
```

### Rollback

If something goes wrong:

```bash
# Revert last commit
git revert HEAD
git push

# Or reset to previous commit
git reset --hard HEAD~1
git push --force  # ⚠️ Use with caution
```

---

## 📖 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [n8n Documentation](https://docs.n8n.io/)
- [Fly.io Documentation](https://fly.io/docs/)
- [Meta Agent Configuration](agent-configs/meta-agent.md)
- [Deployment Guide](DEPLOY-FLYIO.md)

---

## ✅ Checklist

Before using automated agent creation:

- [ ] GitHub Personal Access Token created
- [ ] Token added to GitHub Secrets
- [ ] Telegram Bot Token configured
- [ ] Telegram Chat ID obtained
- [ ] Fly.io API Token added (optional)
- [ ] Repository secrets configured
- [ ] Workflow file committed to repository
- [ ] GitHub Actions enabled
- [ ] Test run completed successfully
- [ ] Meta Agent configured in n8n
- [ ] Telegram notifications working

---

**Automated agent creation makes extending your AI system as easy as sending a message! 🚀**

**Questions? Check the [troubleshooting section](#-support--troubleshooting) or ask the Meta Agent!**
