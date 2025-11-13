# 🤖 Telegram Bot Setup Guide

Step-by-step guide to create and configure your Telegram bot.

## Step 1: Create Bot with BotFather

1. Open Telegram and search for **@BotFather**
2. Start a chat and send: `/newbot`
3. Follow the prompts:
   - **Bot name**: "My n8n Agent" (can be anything)
   - **Bot username**: Must end with "bot", e.g., `my_n8n_agent_bot`

4. BotFather will give you a token like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
   **Save this token!** You'll need it for the `.env` file.

## Step 2: Configure Bot Settings

### Set Bot Description
```
/setdescription @your_bot_username
```
Then send:
```
Multi-agent AI assistant powered by n8n. Send commands to automate your workflows!
```

### Set Bot Commands
```
/setcommands @your_bot_username
```
Then send:
```
help - Show available commands
status - Check bot status
weather - Get weather information
email - Email operations help
calendar - Calendar operations help
```

### Set Bot Profile Picture (Optional)
```
/setuserpic @your_bot_username
```
Then upload an image.

## Step 3: Add Bot Token to .env

Edit your `.env` file:
```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

## Step 4: Configure in n8n

1. Open n8n: `http://localhost:5678`
2. Go to **Settings** → **Credentials**
3. Click **Add Credential**
4. Select **Telegram API**
5. Enter:
   - **Name**: Telegram Bot
   - **Access Token**: Your bot token

## Step 5: Test Your Bot

1. Start n8n: `npm start`
2. Activate your workflow in n8n
3. Find your bot in Telegram
4. Send: `/start`
5. Try: `"What's the weather in New York?"`

## Common Issues

### Bot doesn't respond
- Check bot token is correct
- Ensure workflow is activated in n8n
- Check n8n logs: `npm run logs`

### "Unauthorized" error
- Token is incorrect
- Regenerate token with BotFather: `/token`

## Security Best Practices

1. **Never share your bot token**
2. **Don't commit token to git**
3. **Regenerate token if leaked**
4. **Restrict bot access** (optional):
   ```
   /setjoingroups @your_bot_username
   ```
   Choose "Disable"

## Advanced Configuration

### Set Bot Privacy Mode
```
/setprivacy @your_bot_username
```
- **Enabled**: Bot only sees messages starting with /
- **Disabled**: Bot sees all messages (recommended for this use case)

### Set Bot Inline Mode (Optional)
```
/setinline @your_bot_username
```
Allows using bot in any chat with `@your_bot query`

## Testing Commands

Try these commands to test your bot:

```
Hello!
```
```
Send an email to test@example.com
```
```
What's the weather today?
```
```
Create a meeting tomorrow at 2pm
```

## Webhook Configuration (Advanced)

If you're deploying to production with a public URL:

1. Set `WEBHOOK_URL` in `.env`:
   ```
   WEBHOOK_URL=https://your-domain.com
   ```

2. n8n will automatically register the webhook

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [n8n Telegram Node](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.telegramtrigger/)

---

**Your bot is ready! 🎉**

Next: [Return to Installation Guide](../docs/INSTALLATION.md)
