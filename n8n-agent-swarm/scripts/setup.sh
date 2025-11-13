#!/bin/bash

#############################################
# n8n Agent Swarm - Automated Setup Script
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logo
echo -e "${BLUE}"
echo "╔══════════════════════════════════════╗"
echo "║   n8n Agent Swarm Setup              ║"
echo "║   Multi-Agent Automation System      ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# Function for colored output
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo ""
log_info "Step 1/7: Checking prerequisites..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    log_success "Node.js $NODE_VERSION installed"
else
    log_error "Node.js is not installed!"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    log_success "npm $NPM_VERSION installed"
else
    log_error "npm is not installed!"
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker -v | cut -d ' ' -f3 | tr -d ',')
    log_success "Docker $DOCKER_VERSION installed"
else
    log_warning "Docker is not installed. You'll need it to run n8n easily."
    echo "Install from: https://docs.docker.com/get-docker/"
fi

# Check docker-compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    log_success "Docker Compose installed"
    COMPOSE_CMD="docker compose"
    if command_exists docker-compose; then
        COMPOSE_CMD="docker-compose"
    fi
else
    log_warning "Docker Compose not found"
fi

echo ""
log_info "Step 2/7: Setting up project directory..."
echo ""

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

log_success "Project directory: $PROJECT_DIR"

echo ""
log_info "Step 3/7: Installing Node.js dependencies..."
echo ""

if [ -f "package.json" ]; then
    npm install
    log_success "Dependencies installed"
else
    log_warning "No package.json found, skipping npm install"
fi

echo ""
log_info "Step 4/7: Setting up environment variables..."
echo ""

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_success "Created .env file from .env.example"
        log_warning "⚠️  IMPORTANT: Edit .env file with your API keys before continuing!"
        echo ""
        echo "Required API keys:"
        echo "  - Telegram Bot Token"
        echo "  - OpenRouter API Key"
        echo "  - OpenAI API Key (for Whisper)"
        echo "  - Google OAuth credentials"
        echo "  - YouTube API Key"
        echo "  - Tavily API Key"
        echo "  - Perplexity API Key"
        echo "  - OpenWeatherMap API Key"
        echo ""
        read -p "Press Enter when you've configured .env file..."
    else
        log_error ".env.example not found!"
        exit 1
    fi
else
    log_info ".env file already exists"
fi

echo ""
log_info "Step 5/7: Starting n8n with Docker..."
echo ""

if command_exists docker; then
    if [ -f "docker-compose.yml" ]; then
        log_info "Starting containers..."
        $COMPOSE_CMD up -d
        log_success "n8n is starting!"

        # Wait for n8n to be ready
        log_info "Waiting for n8n to be ready (this may take 30 seconds)..."
        sleep 10

        MAX_RETRIES=30
        RETRY_COUNT=0
        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 | grep -q "200\|401"; then
                log_success "n8n is ready!"
                break
            fi
            echo -n "."
            sleep 1
            RETRY_COUNT=$((RETRY_COUNT + 1))
        done
        echo ""

        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            log_warning "n8n might not be ready yet, but continuing..."
        fi
    else
        log_error "docker-compose.yml not found!"
        exit 1
    fi
else
    log_warning "Docker not available, skipping container startup"
    echo "You'll need to run n8n manually: npx n8n start"
fi

echo ""
log_info "Step 6/7: Importing workflow..."
echo ""

if [ -f "scripts/import-workflow.js" ] && [ -f "n8n-workflows/main-workflow.json" ]; then
    node scripts/import-workflow.js
    log_success "Workflow imported"
else
    log_warning "Workflow import script not found, you'll need to import manually"
fi

echo ""
log_info "Step 7/7: Final setup..."
echo ""

# Create logs directory
mkdir -p logs
log_success "Created logs directory"

# Check Google Sheet template
if [ -f "templates/google-sheet-template.xlsx" ]; then
    log_success "Google Sheet template available"
else
    log_warning "Google Sheet template not found"
fi

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════╗"
echo "║   🎉 Setup Complete!                 ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"
echo ""

log_info "Next steps:"
echo ""
echo "1. Open n8n in your browser:"
echo -e "   ${BLUE}http://localhost:5678${NC}"
echo ""
echo "2. Configure credentials in n8n:"
echo "   - Telegram Bot"
echo "   - OpenRouter API"
echo "   - Gmail OAuth"
echo "   - Google Calendar OAuth"
echo "   - Google Contacts OAuth"
echo "   - Google Sheets OAuth"
echo "   - YouTube API"
echo "   - Tavily API"
echo "   - Perplexity API"
echo "   - OpenWeatherMap API"
echo ""
echo "3. Activate the workflow in n8n"
echo ""
echo "4. Start chatting with your Telegram bot!"
echo ""
echo "📚 Documentation: see docs/INSTALLATION.md"
echo "🐛 Troubleshooting: see docs/TROUBLESHOOTING.md"
echo "💡 Examples: see DEMO.md"
echo ""

# Offer to open browser
if command_exists xdg-open; then
    read -p "Open n8n in browser now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:5678 2>/dev/null || true
    fi
elif command_exists open; then
    read -p "Open n8n in browser now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:5678 2>/dev/null || true
    fi
fi

log_success "Setup complete! Happy automating! 🚀"
