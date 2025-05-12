FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV LOG_LEVEL=info
ENV ENABLE_CHAMPIONSHIP_CONSTRAINTS=true

# Database configuration
ENV DATABASE_URL=postgres://postgres:postgres@postgres:5432/flextime
ENV REDIS_URL=redis://redis:6379

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/status || exit 1

# Start the application
CMD ["node", "app.js"]
