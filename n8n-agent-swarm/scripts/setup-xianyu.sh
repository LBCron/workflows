#!/bin/bash
#
# Xianyu Auto-Scraper Setup Script
# Automates installation of ai-goofish-monitor and dependencies
#

set -e  # Exit on error

echo "======================================"
echo "🔥 Xianyu Auto-Scraper Setup"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRAPER_DIR="${PROJECT_ROOT}/../ai-goofish-monitor"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Scraper will be installed at: $SCRAPER_DIR"
echo ""

# Step 1: Check Prerequisites
echo "🔍 Step 1: Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    echo "Install Python 3.8+ first: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo -e "${GREEN}✅ Python $PYTHON_VERSION found${NC}"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 not found${NC}"
    echo "Install pip3: sudo apt install python3-pip"
    exit 1
fi

echo -e "${GREEN}✅ pip3 found${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Install Node.js 18+: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js $NODE_VERSION found${NC}"

# Check git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git not found${NC}"
    echo "Install git: sudo apt install git"
    exit 1
fi

echo -e "${GREEN}✅ git found${NC}"
echo ""

# Step 2: Clone ai-goofish-monitor
echo "📦 Step 2: Cloning ai-goofish-monitor..."

if [ -d "$SCRAPER_DIR" ]; then
    echo -e "${YELLOW}⚠️  Directory already exists: $SCRAPER_DIR${NC}"
    read -p "Do you want to remove it and re-clone? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$SCRAPER_DIR"
        echo "🗑️  Removed existing directory"
    else
        echo "Skipping clone..."
    fi
fi

if [ ! -d "$SCRAPER_DIR" ]; then
    cd "$(dirname "$SCRAPER_DIR")"
    git clone https://github.com/Usagi-org/ai-goofish-monitor.git
    echo -e "${GREEN}✅ Cloned ai-goofish-monitor${NC}"
else
    echo -e "${YELLOW}⚠️  Using existing directory${NC}"
fi

cd "$SCRAPER_DIR"
echo ""

# Step 3: Create Virtual Environment
echo "🐍 Step 3: Creating Python virtual environment..."

if [ -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment already exists${NC}"
else
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Activate venv
source venv/bin/activate
echo -e "${GREEN}✅ Virtual environment activated${NC}"
echo ""

# Step 4: Install Python Dependencies
echo "📦 Step 4: Installing Python dependencies..."

pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✅ Python dependencies installed${NC}"
echo ""

# Step 5: Install Playwright Browsers
echo "🌐 Step 5: Installing Playwright browsers..."

playwright install chromium

echo -e "${GREEN}✅ Playwright chromium installed${NC}"
echo ""

# Step 6: Configure Environment
echo "⚙️  Step 6: Configuring environment..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env from .env.example${NC}"
    else
        # Create .env manually
        cat > .env << EOF
# OpenAI Configuration
OPENAI_API_KEY=""
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL_NAME="gpt-4o"

# Notification (optional - we use Telegram instead)
NTFY_TOPIC_URL=""

# Proxy (optional)
PROXY_URL=""

# Web Auth (optional)
WEB_USERNAME="admin"
WEB_PASSWORD="secure-password"
EOF
        echo -e "${GREEN}✅ Created .env template${NC}"
    fi

    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY${NC}"
    echo "   nano $SCRAPER_DIR/.env"
else
    echo -e "${YELLOW}⚠️  .env already exists${NC}"
fi

echo ""

# Step 7: Configure Manager Bot
echo "🤖 Step 7: Configuring Manager Bot..."

cd "$PROJECT_ROOT"

if ! grep -q "XIANYU_SCRAPER_PATH" .env 2>/dev/null; then
    echo "" >> .env
    echo "# Xianyu Scraper Configuration" >> .env
    echo "XIANYU_SCRAPER_PATH=\"$SCRAPER_DIR\"" >> .env
    echo "PYTHON_PATH=\"$SCRAPER_DIR/venv/bin/python\"" >> .env
    echo -e "${GREEN}✅ Added Xianyu config to Manager Bot .env${NC}"
else
    echo -e "${YELLOW}⚠️  Xianyu config already exists in .env${NC}"
fi

echo ""

# Step 8: Test Installation
echo "🧪 Step 8: Testing installation..."

cd "$SCRAPER_DIR"
source venv/bin/activate

# Test Python imports
python3 -c "import playwright; import openai; import fastapi; print('✅ All Python packages OK')" || {
    echo -e "${RED}❌ Python package test failed${NC}"
    exit 1
}

# Test Playwright
python3 -c "from playwright.sync_api import sync_playwright; print('✅ Playwright OK')" || {
    echo -e "${RED}❌ Playwright test failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ All tests passed${NC}"
echo ""

# Step 9: Summary
echo "======================================"
echo "✅ Installation Complete!"
echo "======================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure OpenAI API Key:"
echo "   nano $SCRAPER_DIR/.env"
echo "   (Add your OPENAI_API_KEY)"
echo ""
echo "2. Configure Manager Bot (if needed):"
echo "   nano $PROJECT_ROOT/.env"
echo "   (Verify XIANYU_SCRAPER_PATH and PYTHON_PATH)"
echo ""
echo "3. Start Manager Bot:"
echo "   cd $PROJECT_ROOT"
echo "   npm run manager"
echo ""
echo "4. Test Xianyu Integration:"
echo "   In Telegram:"
echo "   - /xianyu_status (check status)"
echo "   - /xianyu_login (QR code login)"
echo "   - /xianyu_scan VENDOR_ID (test scan)"
echo ""
echo "📖 Documentation:"
echo "   $PROJECT_ROOT/docs/XIANYU-INTEGRATION.md"
echo ""
echo "======================================"
echo "🔥 Happy deal hunting!"
echo "======================================"
