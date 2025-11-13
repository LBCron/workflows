#!/bin/bash

# Quick Import Script - Import workflow to n8n
# Run this on your machine with n8n running

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🚀 n8n Agent Swarm - Quick Import                         ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if n8n is running
echo "🔍 Checking if n8n is running..."
if curl -s http://localhost:5678 > /dev/null 2>&1; then
    echo "✅ n8n is running"
else
    echo "❌ n8n is not running!"
    echo ""
    echo "Please start n8n first:"
    echo "  docker-compose up -d"
    echo ""
    echo "Or on Windows/Mac:"
    echo "  npx n8n"
    exit 1
fi

echo ""
echo "📂 Workflow file: n8n-workflows/main-workflow.json"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 IMPORT INSTRUCTIONS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Manual Import (Recommended)"
echo "  1. Open http://localhost:5678"
echo "  2. Click '+' → 'Import from File'"
echo "  3. Select: n8n-workflows/main-workflow.json"
echo "  4. Click 'Import'"
echo ""
echo "Option 2: n8n CLI Import"
echo "  n8n import:workflow --input=n8n-workflows/main-workflow.json"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 CREDENTIALS TO CONFIGURE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After import, configure these credentials in n8n:"
echo ""
echo "  1. ✅ Telegram Bot (telegram-bot-credentials)"
echo "     → Get from @BotFather"
echo ""
echo "  2. ✅ OpenRouter API (openrouter-credentials)"
echo "     → Get from https://openrouter.ai/keys"
echo ""
echo "  3. ✅ OpenAI API (openai-credentials)"
echo "     → Get from https://platform.openai.com/api-keys"
echo ""
echo "  4. ✅ Google OAuth (for Gmail, Calendar, Contacts, Sheets)"
echo "     → Configure in Google Cloud Console"
echo ""
echo "  5. ⚠️  Optional APIs:"
echo "     • YouTube API"
echo "     • Tavily API"
echo "     • Perplexity API"
echo "     • OpenWeatherMap API"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 WORKFLOW CONTENTS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📍 19 nodes total"
echo "  📍 7 AI agents:"
echo "     • Main Executive Agent (orchestrator)"
echo "     • Email Agent (Gmail)"
echo "     • Calendar Agent (Google Calendar)"
echo "     • Contact Agent (Google Contacts)"
echo "     • YouTube Agent (video research)"
echo "     • Web Agent (search & weather)"
echo "     • 🔮 Meta Agent (self-evolution) ← NEW!"
echo ""
echo "  📍 Features:"
echo "     • Voice message support (Whisper STT)"
echo "     • Conversation memory"
echo "     • Google Sheets logging"
echo "     • Error handling"
echo "     • Multi-agent coordination"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TEST THE META AGENT:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Once imported and activated, try via Telegram:"
echo ""
echo "  \"Add a Snapchat agent\""
echo "  \"Create a Twitter integration\""
echo "  \"Build a Notion agent\""
echo "  \"Add Instagram agent\""
echo ""
echo "The Meta Agent will generate complete configurations!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Press Enter to open n8n in browser..."

# Try to open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5678
elif command -v open > /dev/null; then
    open http://localhost:5678
else
    echo "Please open: http://localhost:5678"
fi

echo ""
echo "✅ Ready to import!"
echo ""
