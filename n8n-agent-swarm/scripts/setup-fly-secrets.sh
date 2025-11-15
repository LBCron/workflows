#!/bin/bash
# Setup Fly.io secrets from .env file
# Usage: bash scripts/setup-fly-secrets.sh [app-name]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# App name
APP_NAME="${1:-n8n-agent-swarm}"

echo -e "${BLUE}🔐 Setting up Fly.io secrets for: $APP_NAME${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Source .env file
source .env

# Function to set secret if variable is defined
set_secret() {
    local KEY=$1
    local VALUE=$2
    local REQUIRED=$3

    if [ -n "$VALUE" ]; then
        echo -e "${YELLOW}Setting $KEY...${NC}"
        fly secrets set "$KEY=$VALUE" --app "$APP_NAME" 2>&1 | grep -v "Secrets are staged for the first deployment" || true
        echo -e "${GREEN}✅ $KEY configured${NC}"
        return 0
    else
        if [ "$REQUIRED" = "true" ]; then
            echo -e "${RED}⚠️  $KEY is not set in .env (REQUIRED)${NC}"
            return 1
        else
            echo -e "${YELLOW}ℹ️  $KEY is not set in .env (optional, skipping)${NC}"
            return 0
        fi
    fi
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Essential Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Essential secrets
MISSING_REQUIRED=0

set_secret "N8N_BASIC_AUTH_USER" "${N8N_USER:-admin}" "true" || MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
set_secret "N8N_BASIC_AUTH_PASSWORD" "$N8N_PASSWORD" "true" || MISSING_REQUIRED=$((MISSING_REQUIRED + 1))

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}AI API Keys${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

set_secret "TELEGRAM_BOT_TOKEN" "$TELEGRAM_BOT_TOKEN" "true" || MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
set_secret "OPENROUTER_API_KEY" "$OPENROUTER_API_KEY" "true" || MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY" "true" || MISSING_REQUIRED=$((MISSING_REQUIRED + 1))

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Google Services (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

set_secret "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" "false"
set_secret "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" "false"
set_secret "GOOGLE_SHEET_ID" "$GOOGLE_SHEET_ID" "false"
set_secret "YOUTUBE_API_KEY" "$YOUTUBE_API_KEY" "false"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Web Search APIs (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

set_secret "TAVILY_API_KEY" "$TAVILY_API_KEY" "false"
set_secret "PERPLEXITY_API_KEY" "$PERPLEXITY_API_KEY" "false"
set_secret "OPENWEATHERMAP_API_KEY" "$OPENWEATHERMAP_API_KEY" "false"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# List all secrets
echo -e "${YELLOW}📋 Configured secrets on Fly.io:${NC}\n"
fly secrets list --app "$APP_NAME"

echo ""

if [ $MISSING_REQUIRED -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_REQUIRED required secret(s) are missing!${NC}"
    echo -e "${YELLOW}Please update your .env file and run this script again.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All required secrets configured successfully!${NC}"
    echo ""
    echo -e "${BLUE}ℹ️  Note: Secrets are encrypted and not visible after being set.${NC}"
    echo -e "${BLUE}ℹ️  To update a secret, run: fly secrets set KEY=VALUE --app $APP_NAME${NC}"
    echo ""
fi
