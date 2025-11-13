# 📘 Installation Guide - n8n Agent Swarm

Complete step-by-step installation guide.

## Prerequisites

Before starting, ensure you have:

- ✅ **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- ✅ **Node.js 18+** - [Install Node.js](https://nodejs.org/)
- ✅ **Git** - [Install Git](https://git-scm.com/)
- ✅ **Telegram Account**
- ✅ **Google Cloud Account** (free tier works)

## Quick Installation (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/n8n-agent-swarm.git
cd n8n-agent-swarm

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with your API keys

# 3. Run automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# 4. Open n8n
open http://localhost:5678
```

## Detailed Installation

### Step 1: Get Required API Keys

#### 1.1 Telegram Bot Token
1. Open Telegram, search for `@BotFather`
2. Send `/newbot` and follow instructions
3. Save your bot token

See [Telegram Bot Setup](../templates/telegram-bot-setup.md) for details.

#### 1.2 OpenRouter API (GPT-4 Access)
1. Go to [OpenRouter](https://openrouter.ai/keys)
2. Sign up and create API key
3. Add credits ($5 minimum recommended)

#### 1.3 OpenAI API (Whisper)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create API key
3. Add payment method

#### 1.4 Google Cloud Setup

**Enable Required APIs:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable these APIs:
   - Gmail API
   - Google Calendar API
   - Google People API (Contacts)
   - Google Sheets API
   - YouTube Data API v3

**Create OAuth Credentials:**
1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Authorized redirect URIs:
   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```
5. Save Client ID and Client Secret

### Step 2: Configure Environment

Edit `.env` file with your API keys:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_telegram_token
OPENROUTER_API_KEY=sk-or-your_key
OPENAI_API_KEY=sk-your_openai_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SHEET_ID=your_sheet_id

# Optional (but recommended)
YOUTUBE_API_KEY=your_youtube_key
TAVILY_API_KEY=tvly-your_key
PERPLEXITY_API_KEY=pplx-your_key
OPENWEATHERMAP_API_KEY=your_weather_key
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Services

```bash
# Start n8n with Docker
docker-compose up -d

# Check logs
docker-compose logs -f
```

Wait 30 seconds for n8n to start, then open: http://localhost:5678

### Step 5: Configure n8n Credentials

1. **Open n8n** at http://localhost:5678
2. **Create account** (first-time setup)
3. **Go to Settings > Credentials**
4. **Add each credential:**

#### Telegram Bot
- Type: Telegram API
- Access Token: Your bot token

#### OpenRouter
- Type: HTTP Request (custom)
- Or configure in nodes directly

#### Gmail
- Type: Gmail OAuth2
- Use Google Client ID/Secret
- Authorize access

#### Google Calendar
- Type: Google Calendar OAuth2
- Use same Client ID/Secret

#### Google Contacts
- Type: Google Contacts OAuth2

#### Google Sheets
- Type: Google Sheets OAuth2

### Step 6: Import Workflow

**Option A: Automated**
```bash
npm run import-workflow
```

**Option B: Manual**
1. In n8n, click "+" > "Import from File"
2. Select `n8n-workflows/main-workflow.json`
3. Click "Import"

### Step 7: Activate Workflow

1. Open the imported workflow
2. Click the toggle to "Active"
3. Workflow is now running!

### Step 8: Test the Bot

1. Open Telegram
2. Find your bot
3. Send: `/start`
4. Try: `"What's the weather in New York?"`

## Troubleshooting Installation

### Docker Issues

**Problem**: `Cannot connect to Docker daemon`
```bash
# Start Docker
sudo systemctl start docker

# Or on Mac
open -a Docker
```

**Problem**: Port 5678 already in use
```bash
# Change port in .env
N8N_PORT=5679

# Restart
docker-compose down && docker-compose up -d
```

### n8n Won't Start

```bash
# View logs
docker-compose logs n8n

# Clean restart
docker-compose down -v
docker-compose up -d
```

### Workflow Import Fails

```bash
# Validate workflow
npm run validate

# Check n8n logs
npm run logs
```

### Credentials Not Working

1. Check API keys in `.env`
2. Verify Google OAuth consent screen
3. Ensure all APIs are enabled in Google Cloud
4. Re-authorize credentials in n8n

## Advanced Configuration

### Use PostgreSQL (Recommended for Production)

Already configured in `docker-compose.yml`! Data persists in Docker volumes.

### Enable HTTPS

Use reverse proxy (Nginx or Traefik):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Set Up Backups

```bash
# Backup volumes
docker run --rm \
  -v n8n_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/n8n-backup.tar.gz -C /data .
```

## Next Steps

- ✅ Read [Architecture](ARCHITECTURE.md) to understand the system
- ✅ Check [Demo Examples](../DEMO.md) for usage ideas
- ✅ Configure additional APIs as needed
- ✅ Set up monitoring and logging

## Support

If you encounter issues:

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review [API Keys Setup](API-KEYS.md)
3. Check Docker logs: `docker-compose logs`
4. Open an issue on GitHub

---

**Installation complete! 🎉**

Your multi-agent automation system is ready to use!
