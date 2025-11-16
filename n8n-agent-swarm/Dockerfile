# Dockerfile - Bot Telegram AI Agent Swarm
# Build: docker build -t ai-agent-swarm .
# Run: docker run -it --env-file .env ai-agent-swarm

FROM node:20-alpine

# Metadata
LABEL maintainer="AI Agent Swarm"
LABEL description="Bot Telegram avec agents AI sophistiqués"

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Copy application files
COPY scripts/ ./scripts/
COPY .env.example .env.example

# Create cache directory
RUN mkdir -p .cache

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port (optional, for API server)
EXPOSE 3000

# Start bot
CMD ["node", "scripts/telegram-bot.js"]
