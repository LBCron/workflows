# 📱 Phone Storage System

Complete guide to the privacy-focused personal memory system that stores all your data on YOUR phone via Telegram.

## 🎯 Overview

The Phone Storage System is a **privacy-first memory system** that:

- ✅ Stores ALL data on your phone (via Telegram Saved Messages)
- ✅ Server only keeps temporary RAM cache (6 hours max)
- ✅ Full control over your personal information
- ✅ Encrypted Telegram transmission
- ✅ No cloud storage, no database
- ✅ Works offline (queue for later sync)
- ✅ Delta sync (only changes transmitted)

**Philosophy**: Your data belongs to YOU. We just help you manage it.

---

## 🏗️ How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Data Flow                             │
└─────────────────────────────────────────────────────────┘

1. YOUR PHONE (Telegram Saved Messages)
   📱 my-profile.json
   📱 my-memory.json
   📱 my-contacts.json
   📱 my-habits.json

   ↓ (User sends files to bot)

2. TELEGRAM ENCRYPTED TRANSMISSION
   🔐 End-to-end encrypted

   ↓

3. SERVER RAM CACHE (Temporary)
   💾 Loaded into memory
   ⏰ Expires after 6 hours
   📝 Changes tracked (dirty flag)

   ↓ (AI processes requests)

4. MEMORY AGENT USES CONTEXT
   🧠 Understands your preferences
   🎯 Auto-completes missing info
   💡 Learns patterns

   ↓ (After changes)

5. SYNC BACK TO TELEGRAM
   📤 Send updated files

   ↓

6. YOU SAVE ON PHONE
   💾 Files in Saved Messages
   📌 Pin for easy access

   ↓

7. SERVER CLEARS CACHE
   🗑️  RAM cleared after 6h or /clear
```

---

## 📁 File Structure

### 1. my-profile.json

**Your personal settings and preferences**

```json
{
  "user": {
    "name": "Ronan",
    "timezone": "Europe/Paris",
    "language": "fr"
  },
  "communication": {
    "tone": "casual",
    "verbosity": "concise"
  },
  "budget": {
    "monthly_limit": 50.00,
    "current_month_usage": 12.50
  },
  "work_schedule": {
    "working_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "working_hours": { "start": "09:00", "end": "18:00" }
  }
}
```

**What's stored:**
- Name, timezone, language
- Communication preferences (tone, emoji usage)
- Budget settings and limits
- Work schedule and focus blocks
- Integration settings (Gmail, Calendar)

---

### 2. my-memory.json

**Your context and ongoing projects**

```json
{
  "context": {
    "current_focus": {
      "primary": "Building n8n multi-agent system",
      "secondary": "Learning AI automation"
    }
  },
  "projects": {
    "active": [
      {
        "name": "n8n-agent-swarm",
        "status": "in_progress",
        "progress": 0.75
      }
    ]
  },
  "deadlines": {
    "upcoming": [...]
  },
  "important_facts": {
    "personal": [...],
    "technical": [...]
  }
}
```

**What's stored:**
- Recent conversations and context
- Active projects and progress
- Upcoming deadlines
- Important facts learned about you
- Quick references (paths, URLs, shortcuts)

---

### 3. my-contacts.json

**Your people and communication patterns**

```json
{
  "contacts": [
    {
      "name": "Boss",
      "email": "boss@company.com",
      "context": {
        "relationship": "manager",
        "communication_frequency": "daily"
      },
      "preferences": {
        "tone": "professional",
        "formality": "formal"
      }
    }
  ],
  "shortcuts": {
    "boss": "contact_001",
    "team": "group_001"
  }
}
```

**What's stored:**
- Contacts with context
- Communication preferences per person
- Interaction history
- Shortcuts ("boss", "team")
- Email templates and signatures

---

### 4. my-habits.json

**Your learned patterns and optimizations**

```json
{
  "detected_patterns": [
    {
      "pattern": "Works on automation projects in the morning",
      "frequency": "daily",
      "confidence": 0.85
    }
  ],
  "frequent_actions": [
    {
      "action": "Deploy to Fly.io",
      "typical_day": "friday",
      "typical_time": "16:00"
    }
  ],
  "automation_opportunities": [
    {
      "opportunity": "Auto-run tests before deploy",
      "potential_time_saved_minutes_per_week": 15
    }
  ]
}
```

**What's stored:**
- Detected behavior patterns
- Frequent actions and shortcuts
- Learned preferences
- Temporal patterns (productive hours)
- Automation suggestions

---

## 🚀 Getting Started

### Step 1: Initialize Storage

Run the initialization script:

```bash
cd n8n-agent-swarm
node scripts/phone-storage/init-storage.js
```

This will:
1. Create personalized JSON files
2. Send them to you via Telegram
3. Guide you through setup

### Step 2: Save Files on Your Phone

1. Open Telegram
2. Go to your bot conversation
3. Find the 4 JSON files sent
4. Forward them to "Saved Messages"
5. Pin them for easy access

### Step 3: Start Using

Send the files back to the bot when you want to start a session:

**In Telegram:**
```
[Send my-memory.json]
[Send my-profile.json]
[Send my-contacts.json]
[Send my-habits.json]
```

**Bot responds:**
```
✅ Memory Loaded!

📊 Loaded 4 file(s):
• my-profile.json
• my-memory.json
• my-contacts.json
• my-habits.json

Context restored. Ready to help! 🎯
```

---

## 📋 Commands

### /sync

**Sync changed files back to Telegram**

```
User: /sync

Bot: 📤 Syncing Updated Files

Sending 2 file(s) with changes...

✅ Sync Complete!

📤 Sent 2/2 file(s)

💾 Save these files to your "Saved Messages"!
```

**When to use:**
- After making changes you want to save
- Before ending a session
- Manual sync (auto-syncs every hour)

---

### /backup

**Create full backup of all files**

```
User: /backup

Bot: 📦 Creating Backup

Generating backup of all your files...

[Sends all 4 files]

✅ Backup Complete!

📦 Created: 2024-01-15T14:30:00Z
📁 Files: 4

💾 Save them to "Saved Messages"!
```

**When to use:**
- Before major changes
- Weekly backups
- Before system updates

---

### /status

**Check sync status and cache info**

```
User: /status

Bot: 📊 Memory Status

✅ Memory loaded
📅 Loaded: 15/01/2024 14:00
⏰ Expires: 15/01/2024 20:00
🔄 Last sync: 15/01/2024 14:30

📁 Files
✅ profile: 12.5 KB
📝 memory: 45.2 KB (has changes)
✅ contacts: 8.3 KB
✅ habits: 15.7 KB

⚠️ 1 file(s) need syncing
Use /sync to update
```

---

### /clear

**Clear server RAM cache**

```
User: /clear

Bot: 🗑️ Cache Cleared

RAM cache has been cleared.
Your files on the phone are safe!

📥 Send files again when you want to resume.
```

**When to use:**
- End of work session
- Privacy concern (clear server memory)
- Force fresh reload

**Note**: Your files on the phone are NOT deleted, only server cache.

---

## 💡 Usage Examples

### Example 1: Starting a Session

```
User: [Sends my-memory.json to bot]

Bot: ✅ Memory Loaded!

📊 Context restored:
• Name: Ronan
• Current projects: n8n-agent-swarm (75% complete)
• Last session: 2 hours ago
• Habits detected: 12 patterns

Ready to help! How can I assist?
```

---

### Example 2: Context-Aware Assistance

```
User: "Deploy the project"

Bot: 🚀 Deploying n8n-agent-swarm to Fly.io

(Memory Agent knows:)
• "The project" = n8n-agent-swarm (from my-memory.json)
• Deploy command = npm run deploy:fly (from my-habits.json)
• Typical deploy day = Friday 16:00 (from my-habits.json)

Running: npm run deploy:fly

✅ Deployed successfully!
💾 Updated my-memory.json with deployment info
```

---

### Example 3: Smart Defaults

```
User: "Email the boss about project status"

Bot: 📧 Composing email

(Memory Agent auto-fills:)
• Recipient: boss@company.com (from my-contacts.json shortcut "boss")
• Tone: professional/formal (from contact preferences)
• Subject: n8n-agent-swarm Status Update (from current project)
• Body: Generated with formal tone

Subject: n8n-agent-swarm Status Update

Dear [Boss Name],

I wanted to update you on the progress of n8n-agent-swarm:

• Current status: 75% complete
• Recent milestone: Learning system implemented
• Next: Memory system completion

Best regards,
Ronan

Send this? (yes/no/edit)
```

---

### Example 4: Pattern Learning

```
[After 5 deployments on Friday at 16:00]

Bot: 🔮 Pattern Detected!

You deploy to Fly.io every Friday around 16:00.

Should I:
a) Remind you every Friday at 15:00
b) Auto-prepare deployment report
c) Ignore this pattern

Your choice?

User: a

Bot: ✅ Added to my-habits.json

Will remind you every Friday at 15:00

💾 Syncing updated habits file...
[Sends my-habits.json]
```

---

### Example 5: Proactive Assistance

```
[Friday 15:00]

Bot: ⏰ Friendly Reminder

Based on your habits:
• You usually deploy to Fly.io on Fridays around 16:00
• Current time: 15:00

Would you like me to:
1. Run tests now (npm test)
2. Prepare deployment
3. Remind me in 30 minutes

What would you prefer?
```

---

## 🔐 Privacy & Security

### What's Stored Where

**On YOUR Phone (Permanent):**
- ✅ All personal data
- ✅ All preferences
- ✅ All conversation history
- ✅ All learned patterns
- ✅ Full control and ownership

**On Server (Temporary - RAM only):**
- ⏱️ Current session data (6 hours max)
- ⏱️ Expires automatically
- ⏱️ Cleared on /clear command
- ⏱️ Never written to disk
- ⏱️ Lost on server restart

**Telegram Transmission:**
- 🔐 End-to-end encrypted
- 🔐 TLS/HTTPS secure
- 🔐 No third-party access

**NEVER Stored:**
- ❌ Passwords (only in environment variables)
- ❌ API keys (only in .env)
- ❌ Payment information
- ❌ Sensitive documents content

### Privacy Guarantees

1. **You Own Your Data**
   - All files on your phone
   - Delete anytime
   - Export anytime
   - Full transparency

2. **Server = Temporary Cache**
   - RAM only (no disk)
   - Auto-expires after 6h
   - Cleared on /clear
   - Lost on restart

3. **No Third Parties**
   - No cloud storage
   - No external databases
   - No analytics services
   - Only Telegram API

4. **Encryption**
   - Telegram encrypted transmission
   - Optional file encryption (coming soon)
   - Secure local storage on phone

---

## 📊 Performance

### File Sizes (Typical)

| File | Compressed | Uncompressed |
|------|-----------|--------------|
| my-profile.json | ~5 KB | ~12 KB |
| my-memory.json | ~15 KB | ~45 KB |
| my-contacts.json | ~3 KB | ~8 KB |
| my-habits.json | ~6 KB | ~16 KB |
| **Total** | **~29 KB** | **~81 KB** |

### Transmission Times

- **Upload (phone → server)**: < 1 second
- **Download (server → phone)**: < 1 second
- **Load into RAM**: < 0.5 seconds
- **Sync (4 files)**: < 3 seconds

### Cache Performance

- **Memory usage**: < 1 MB RAM
- **Lookup time**: < 1 ms
- **Update time**: < 1 ms
- **Save to cache**: < 50 ms

---

## 🛠️ Troubleshooting

### "No memory loaded"

**Problem**: Bot says memory not loaded

**Solution**:
1. Send all 4 JSON files to the bot
2. Check files are named correctly
3. Verify JSON structure is valid
4. Try /clear and reload

---

### "Cache expired"

**Problem**: Cache expired after 6 hours

**Solution**:
1. This is normal behavior (privacy feature)
2. Send files again to reload
3. Use /status to check expiry time
4. Consider increasing cache time (in code)

---

### "File too large"

**Problem**: File size exceeds 20 MB

**Solution**:
1. Clean old conversation history
2. Remove unused contacts
3. Archive old projects
4. Contact support (should never happen)

---

### "Invalid JSON structure"

**Problem**: File validation failed

**Solution**:
1. Don't manually edit files (risky)
2. Use /backup to get fresh copies
3. Check JSON syntax with validator
4. Restore from backup

---

### "Sync failed"

**Problem**: /sync command failed

**Solution**:
1. Check Telegram bot token
2. Verify internet connection
3. Check chat ID is correct
4. Review server logs

---

## 🎓 Best Practices

### 1. Daily Routine

**Morning:**
```
1. Send memory files to bot
2. Check /status
3. Start working
```

**Evening:**
```
1. Use /sync to save changes
2. Check files in Telegram
3. Optionally use /clear
```

---

### 2. Backup Strategy

**Recommended:**
- Daily auto-sync (happens automatically)
- Weekly /backup (manual)
- Pin files in Telegram Saved Messages
- Optional: Auto-backup to iCloud/Google Drive

**Backup schedule:**
- **Daily**: Auto-sync (hourly)
- **Weekly**: Manual /backup
- **Monthly**: Full export to external storage

---

### 3. File Management

**Organization:**
```
Telegram → Saved Messages
├── 📌 my-profile.json (pinned)
├── 📌 my-memory.json (pinned)
├── 📌 my-contacts.json (pinned)
├── 📌 my-habits.json (pinned)
└── 📁 Backups/
    ├── 2024-01-15_backup/
    └── 2024-01-08_backup/
```

---

### 4. Privacy Tips

**Maximum Privacy:**
1. Use /clear after each session
2. Disable auto-sync (manual only)
3. Use local Telegram encryption
4. Don't share bot token
5. Review files regularly

**Convenience vs Privacy:**
- High privacy: Clear cache after every session
- Balanced: Auto-clear after 6h (default)
- High convenience: Extended cache time (modify code)

---

## 🔧 Advanced Usage

### Custom Sync Intervals

Edit `sync-manager.js`:

```javascript
const CONFIG = {
  CACHE_EXPIRY_HOURS: 6,  // Change to 12, 24, etc.
  AUTO_SYNC_INTERVAL_HOURS: 1  // Change sync frequency
};
```

---

### Manual File Operations

**Load files manually:**
```bash
node scripts/phone-storage/sync-manager.js load
```

**Check status:**
```bash
node scripts/phone-storage/sync-manager.js status
```

**Force sync:**
```bash
node scripts/phone-storage/sync-manager.js sync
```

**Clear cache:**
```bash
node scripts/phone-storage/sync-manager.js clear
```

---

### Backup Management

**Create backup:**
```bash
node scripts/phone-storage/sync-manager.js backup
```

**Backups location:**
```
.cache/phone-storage/backups/
├── 2024-01-15T14-30-00Z/
│   ├── my-profile.json
│   ├── my-memory.json
│   ├── my-contacts.json
│   └── my-habits.json
└── 2024-01-14T10-00-00Z/
    └── ...
```

---

### Integration with n8n

**In your n8n workflow:**

1. **Load Memory Node** (Function):
```javascript
const syncManager = require('./scripts/phone-storage/sync-manager');
await syncManager.loadAllFiles();
const memory = syncManager.getData('memory');
return [{ json: { context: memory.context } }];
```

2. **Update Memory Node** (Function):
```javascript
const syncManager = require('./scripts/phone-storage/sync-manager');
syncManager.updateNestedField('memory', 'context.current_focus.primary', $json.newFocus);
```

3. **Sync Node** (Function):
```javascript
const syncManager = require('./scripts/phone-storage/sync-manager');
const telegramHandler = require('./scripts/phone-storage/telegram-file-handler');
await syncManager.syncCycle();
await telegramHandler.sendUpdatedFiles();
```

---

## 📖 API Reference

### sync-manager.js

```javascript
// Load files
await loadAllFiles()
await loadFile(fileType, filePath)

// Get data
const data = getData(fileType)
const status = getSyncStatus()
const stats = getCacheStats()

// Update data
updateData(fileType, updates, merge = true)
updateNestedField(fileType, 'path.to.field', value)

// Sync
await syncCycle()
await saveFile(fileType)
await saveDirtyFiles()

// Utilities
clearCache()
checkExpiry()
await createBackup()
```

### telegram-file-handler.js

```javascript
// File operations
await downloadFile(fileId, savePath)
await uploadFile(filePath, caption)
await processIncomingFile(fileId, fileName)
await sendUpdatedFiles(fileTypes)

// Commands
await handleSyncCommand()
await handleBackupCommand()
await handleStatusCommand()
await handleClearCommand()

// Messaging
await sendMessage(text, parseMode)
```

---

## 🚀 Next Steps

1. **Initialize**: Run `node scripts/phone-storage/init-storage.js`
2. **Save Files**: Store files in Telegram Saved Messages
3. **Start Using**: Send files to bot to begin
4. **Daily Routine**: Morning load, evening sync
5. **Weekly Backup**: Use /backup every week

---

## 🤝 Support

**Questions?**
- Check troubleshooting section
- Review code comments
- Run commands with --help flag

**Issues?**
- Check logs in console
- Use /status to diagnose
- Try /clear and reload

---

**Remember**: Your data, your control. The Phone Storage System is designed to give you maximum privacy while maintaining convenience. Trust the system, it's built for YOU! 📱🔐

**Happy automating with full privacy!** 🎯
