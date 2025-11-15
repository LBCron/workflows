#!/bin/bash
# Deploy n8n Agent Swarm to Fly.io - Complete Automation Script
# Usage: bash scripts/deploy-fly.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="n8n-agent-swarm"
POSTGRES_APP="n8n-postgres"
REGION="cdg"  # Paris
VOLUME_NAME="n8n_data"
VOLUME_SIZE="10"
POSTGRES_SIZE="10"

# Emojis
ROCKET="🚀"
CHECK="✅"
CROSS="❌"
INFO="ℹ️"
WARNING="⚠️"
GEAR="⚙️"

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Fly.io Deployment Automation for n8n Agent Swarm    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_step() {
    echo -e "\n${CYAN}${GEAR} $1${NC}"
}

# Check if Fly CLI is installed
check_fly_cli() {
    print_step "Checking Fly CLI installation..."

    if ! command -v fly &> /dev/null; then
        print_error "Fly CLI is not installed!"
        echo ""
        echo "Install it with:"
        echo "  macOS/Linux: curl -L https://fly.io/install.sh | sh"
        echo "  Windows: iwr https://fly.io/install.ps1 -useb | iex"
        echo ""
        exit 1
    fi

    FLY_VERSION=$(fly version | head -n 1)
    print_success "Fly CLI installed: $FLY_VERSION"
}

# Check if user is logged in
check_fly_auth() {
    print_step "Checking Fly.io authentication..."

    if ! fly auth whoami &> /dev/null; then
        print_warning "Not logged in to Fly.io"
        print_info "Opening login page..."
        fly auth login
    fi

    FLY_USER=$(fly auth whoami 2>/dev/null | head -n 1 || echo "Unknown")
    print_success "Logged in as: $FLY_USER"
}

# Check if .env file exists
check_env_file() {
    print_step "Checking .env file..."

    if [ ! -f .env ]; then
        print_error ".env file not found!"
        print_info "Creating from .env.example..."

        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Please edit .env and add your API keys"
            print_info "Then run this script again"
            exit 1
        else
            print_error ".env.example not found!"
            exit 1
        fi
    fi

    print_success ".env file found"
}

# Create Fly.io app if it doesn't exist
create_app() {
    print_step "Checking if app exists..."

    if fly apps list | grep -q "$APP_NAME"; then
        print_success "App '$APP_NAME' already exists"
        APP_EXISTS=true
    else
        print_warning "App '$APP_NAME' does not exist"
        print_info "Creating app..."

        fly apps create "$APP_NAME" --org personal || {
            print_error "Failed to create app"
            print_info "Try a different name or run: fly apps create $APP_NAME-yourname"
            exit 1
        }

        print_success "App created: $APP_NAME"
        APP_EXISTS=false
    fi
}

# Create PostgreSQL database
create_postgres() {
    print_step "Checking PostgreSQL database..."

    if fly apps list | grep -q "$POSTGRES_APP"; then
        print_success "PostgreSQL app '$POSTGRES_APP' already exists"
    else
        print_warning "Creating PostgreSQL database..."
        print_info "This may take 2-3 minutes..."

        fly postgres create \
            --name "$POSTGRES_APP" \
            --region "$REGION" \
            --initial-cluster-size 1 \
            --vm-size shared-cpu-1x \
            --volume-size "$POSTGRES_SIZE" || {
            print_error "Failed to create PostgreSQL"
            exit 1
        }

        print_success "PostgreSQL created"
    fi

    # Attach PostgreSQL to app
    print_info "Attaching PostgreSQL to app..."
    fly postgres attach "$POSTGRES_APP" --app "$APP_NAME" || {
        print_warning "PostgreSQL might already be attached"
    }
    print_success "PostgreSQL attached"
}

# Create volume for n8n data
create_volume() {
    print_step "Checking storage volume..."

    if fly volumes list --app "$APP_NAME" | grep -q "$VOLUME_NAME"; then
        print_success "Volume '$VOLUME_NAME' already exists"
    else
        print_warning "Creating storage volume..."

        fly volumes create "$VOLUME_NAME" \
            --size "$VOLUME_SIZE" \
            --region "$REGION" \
            --app "$APP_NAME" || {
            print_error "Failed to create volume"
            exit 1
        }

        print_success "Volume created: ${VOLUME_SIZE}GB"
    fi
}

# Setup secrets from .env
setup_secrets() {
    print_step "Configuring secrets..."

    print_info "Running setup-fly-secrets.sh..."

    if [ -f "scripts/setup-fly-secrets.sh" ]; then
        bash scripts/setup-fly-secrets.sh
    else
        print_warning "setup-fly-secrets.sh not found, configuring essential secrets manually..."

        # Essential secrets
        source .env

        print_info "Setting essential secrets..."
        fly secrets set \
            N8N_BASIC_AUTH_USER="${N8N_USER:-admin}" \
            N8N_BASIC_AUTH_PASSWORD="${N8N_PASSWORD:-changeme}" \
            --app "$APP_NAME" 2>&1 | grep -v "Secrets are staged for the first deployment"

        if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
            fly secrets set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" --app "$APP_NAME"
        fi

        if [ -n "$OPENROUTER_API_KEY" ]; then
            fly secrets set OPENROUTER_API_KEY="$OPENROUTER_API_KEY" --app "$APP_NAME"
        fi

        if [ -n "$OPENAI_API_KEY" ]; then
            fly secrets set OPENAI_API_KEY="$OPENAI_API_KEY" --app "$APP_NAME"
        fi
    fi

    print_success "Secrets configured"
}

# Deploy the application
deploy_app() {
    print_step "Deploying application..."

    print_info "This may take 3-5 minutes..."
    echo ""

    fly deploy --app "$APP_NAME" || {
        print_error "Deployment failed!"
        print_info "Check logs with: fly logs --app $APP_NAME"
        exit 1
    }

    echo ""
    print_success "Application deployed successfully!"
}

# Wait for app to be healthy
wait_for_app() {
    print_step "Waiting for app to be healthy..."

    MAX_ATTEMPTS=30
    ATTEMPT=0

    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if fly status --app "$APP_NAME" | grep -q "healthy"; then
            print_success "App is healthy!"
            return 0
        fi

        ATTEMPT=$((ATTEMPT + 1))
        echo -n "."
        sleep 5
    done

    print_warning "App health check timeout, but deployment might still be successful"
}

# Get app URL
get_app_url() {
    print_step "Getting application URL..."

    APP_URL=$(fly info --app "$APP_NAME" | grep "Hostname" | awk '{print $3}')

    if [ -n "$APP_URL" ]; then
        APP_FULL_URL="https://$APP_URL"
        print_success "App URL: $APP_FULL_URL"

        # Update WEBHOOK_URL secret
        print_info "Updating WEBHOOK_URL..."
        fly secrets set WEBHOOK_URL="$APP_FULL_URL" --app "$APP_NAME" 2>&1 | grep -v "Secrets are staged"

        return 0
    else
        print_error "Could not retrieve app URL"
        return 1
    fi
}

# Display final information
show_final_info() {
    echo ""
    echo -e "${GREEN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            ✅ Deployment Complete!                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    echo -e "${CYAN}📋 Next Steps:${NC}"
    echo ""
    echo "  1. Open your n8n instance:"
    echo "     ${GREEN}$APP_FULL_URL${NC}"
    echo ""
    echo "  2. Login with:"
    echo "     Username: ${YELLOW}${N8N_USER:-admin}${NC}"
    echo "     Password: ${YELLOW}<your N8N_PASSWORD from .env>${NC}"
    echo ""
    echo "  3. Import the workflow:"
    echo "     Settings → Import from File → n8n-workflows/main-workflow.json"
    echo ""
    echo "  4. Configure credentials in n8n UI:"
    echo "     - Telegram Bot"
    echo "     - OpenRouter API"
    echo "     - OpenAI API"
    echo "     - Google OAuth (optional)"
    echo ""
    echo "  5. Activate the workflow"
    echo ""
    echo -e "${CYAN}🔧 Useful Commands:${NC}"
    echo ""
    echo "  View logs:          ${YELLOW}fly logs --app $APP_NAME${NC}"
    echo "  Check status:       ${YELLOW}fly status --app $APP_NAME${NC}"
    echo "  Open dashboard:     ${YELLOW}fly dashboard --app $APP_NAME${NC}"
    echo "  SSH into app:       ${YELLOW}fly ssh console --app $APP_NAME${NC}"
    echo "  Restart app:        ${YELLOW}fly apps restart $APP_NAME${NC}"
    echo ""

    # Ask to open browser
    read -p "Open n8n in browser now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Opening browser..."

        if command -v xdg-open &> /dev/null; then
            xdg-open "$APP_FULL_URL"
        elif command -v open &> /dev/null; then
            open "$APP_FULL_URL"
        elif command -v start &> /dev/null; then
            start "$APP_FULL_URL"
        else
            print_warning "Could not open browser automatically"
            echo "Please open: $APP_FULL_URL"
        fi
    fi
}

# Main execution
main() {
    # Check prerequisites
    check_fly_cli
    check_fly_auth
    check_env_file

    # Create infrastructure
    create_app
    create_postgres
    create_volume

    # Configure
    setup_secrets

    # Deploy
    deploy_app

    # Wait and verify
    wait_for_app

    # Get URL
    if get_app_url; then
        show_final_info
    else
        print_warning "Deployment completed but could not retrieve URL"
        print_info "Check with: fly info --app $APP_NAME"
    fi

    echo ""
    print_success "All done! Your n8n Agent Swarm is live on Fly.io! ${ROCKET}"
    echo ""
}

# Run main function
main
