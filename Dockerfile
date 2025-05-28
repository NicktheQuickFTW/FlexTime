# Multi-stage Dockerfile for FlexTime Platform

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ .

# Build frontend
RUN npm run build || echo "No build script, using source files"

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ .

# Stage 3: Production Image
FROM node:18-alpine AS production

# Install necessary tools
RUN apk add --no-cache \
    curl \
    bash \
    postgresql-client

# Create app user
RUN addgroup -g 1001 -S flextime && \
    adduser -S flextime -u 1001

WORKDIR /app

# Copy built frontend from stage 1
COPY --from=frontend-builder --chown=flextime:flextime /app/frontend ./frontend

# Copy backend with dependencies from stage 2
COPY --from=backend-builder --chown=flextime:flextime /app/backend ./backend

# Copy scripts and configuration
COPY --chown=flextime:flextime scripts/ ./scripts/
COPY --chown=flextime:flextime package.json ./

# Make scripts executable
RUN chmod +x scripts/*.sh

# Create necessary directories
RUN mkdir -p \
    backend/logs \
    backend/data/exports \
    backend/data/results \
    backend/data/compass/models \
    backend/data/compass/training_history \
    && chown -R flextime:flextime backend/logs backend/data

# Switch to non-root user
USER flextime

# Environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    FRONTEND_PORT=3000

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/status || exit 1

# Default command - start both services
CMD ["sh", "-c", "cd backend && npm start & cd frontend && npm start"]

# Stage 4: Development Image (optional)
FROM node:18-alpine AS development

# Install development tools
RUN apk add --no-cache \
    curl \
    bash \
    git \
    postgresql-client \
    python3 \
    py3-pip

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies (including devDependencies)
RUN cd backend && npm install && \
    cd ../frontend && npm install

# Create directories
RUN mkdir -p \
    backend/logs \
    backend/data/exports \
    backend/data/results \
    backend/data/compass/models \
    backend/data/compass/training_history

# Environment variables
ENV NODE_ENV=development \
    PORT=3001 \
    FRONTEND_PORT=3000

# Expose ports
EXPOSE 3000 3001

# Development command with hot reload
CMD ["sh", "-c", "cd backend && npm run dev & cd frontend && npm start"]