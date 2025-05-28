# FlexTime Production Deployment Guide

This guide provides step-by-step instructions for deploying FlexTime to production.

## Prerequisites

- **Server Requirements**:
  - Ubuntu 20.04+ or similar Linux distribution
  - 4GB RAM minimum (8GB recommended)
  - 20GB disk space minimum
  - Docker 20.10+
  - Docker Compose 2.0+
  - Node.js 16+ (for initial setup)

- **External Services**:
  - Neon DB account (PostgreSQL database)
  - SSL certificate (for HTTPS)
  - Domain name (optional but recommended)

## Local Development Deployment

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd FlexTime
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Production Deployment

### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Application Setup

```bash
# Clone repository
git clone <repository-url> /opt/flextime
cd /opt/flextime

# Create production environment file
cp backend/.env.example backend/.env
```

### 3. Configure Environment

Edit `/opt/flextime/backend/.env` with production values:

```env
# Server settings
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Neon DB (Production)
NEON_DB_CONNECTION_STRING=postgres://user:pass@your-neon-db.neon.tech/flextime?sslmode=require
ENABLE_NEON_MEMORY=true

# SSL Configuration
SSL_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/flextime.crt
SSL_KEY_PATH=/etc/ssl/private/flextime.key

# Frontend URL (update with your domain)
FRONTEND_URL=https://flextime.yourdomain.com

# API Settings
API_BASE_URL=https://api.flextime.yourdomain.com
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 4. SSL/TLS Setup

```bash
# Using Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d flextime.yourdomain.com -d api.flextime.yourdomain.com

# Update nginx configuration for SSL
```

### 5. Update Docker Compose for Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: flextime-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/data:/app/data
      - /etc/ssl:/etc/ssl:ro
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: flextime-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl.conf:/etc/nginx/conf.d/default.conf
      - /etc/ssl:/etc/ssl:ro
    restart: always
    depends_on:
      - backend

  # Remove postgres service in production (using Neon DB)
```

### 6. Nginx Configuration

Create `nginx/ssl.conf`:

```nginx
server {
    listen 80;
    server_name flextime.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name flextime.yourdomain.com;

    ssl_certificate /etc/ssl/certs/flextime.crt;
    ssl_certificate_key /etc/ssl/private/flextime.key;

    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. Deploy Application

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
docker exec flextime-backend node scripts/init-neon-db.js

# Seed Big 12 data
docker exec flextime-backend node scripts/seed-neon-big12-teams.js
```

### 8. Setup Monitoring

```bash
# Install monitoring tools
docker run -d --name portainer \
  -p 9000:9000 \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  portainer/portainer-ce

# Setup log rotation
sudo tee /etc/logrotate.d/flextime > /dev/null <<EOF
/opt/flextime/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
```

### 9. Setup Backup

Create `/opt/flextime/backup.sh`:

```bash
#!/bin/bash
# Backup script for FlexTime

BACKUP_DIR="/opt/flextime/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/flextime_data_$TIMESTAMP.tar.gz /opt/flextime/backend/data

# Backup logs
tar -czf $BACKUP_DIR/flextime_logs_$TIMESTAMP.tar.gz /opt/flextime/backend/logs

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /opt/flextime/backup.sh
```

## Security Checklist

- [ ] SSL/TLS configured
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Regular security updates scheduled

## Maintenance

### Regular Tasks

1. **Daily**:
   - Check application logs
   - Monitor resource usage
   - Verify backup completion

2. **Weekly**:
   - Update Big 12 data
   - Review error logs
   - Check disk space

3. **Monthly**:
   - Update Docker images
   - Review security patches
   - Performance optimization

### Useful Commands

```bash
# View logs
docker logs flextime-backend -f
docker logs flextime-frontend -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Database maintenance
docker exec flextime-backend node scripts/clean-db.js
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Verify Neon DB credentials
   - Check network connectivity
   - Ensure SSL mode is enabled

2. **Frontend Not Loading**:
   - Check nginx configuration
   - Verify SSL certificates
   - Check CORS settings

3. **API Errors**:
   - Review backend logs
   - Check environment variables
   - Verify API endpoints

## Support

For technical support:
- Email: support@flextime.com
- Documentation: https://docs.flextime.com
- GitHub Issues: <repository-url>/issues

## License

See LICENSE file in the repository.