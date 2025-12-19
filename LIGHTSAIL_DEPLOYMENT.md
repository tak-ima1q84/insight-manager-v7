# AWS Lightsail Deployment Guide

Complete guide for deploying Insight Manager v7 on AWS Lightsail with production-ready configuration.

## ✅ Prerequisites Verified

This deployment guide has been tested and verified with the latest fixes:
- ✅ Docker build issues resolved (bun.lock file generated)
- ✅ Static file serving fixed (React app loads properly)
- ✅ Database connection and seeding working
- ✅ All API endpoints functional

## Deployment Options

1. **Docker Instance** (Recommended) - $10-20/month
2. **Container Service** - $10+ managed containers
3. **Native Installation** - Direct installation without Docker

---

## Option 1: Docker Instance (Recommended)

### Prerequisites
- AWS account with Lightsail access
- Domain name (optional, for SSL)

### Step 1: Create Lightsail Instance

**Via AWS Console:**
1. Go to [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click "Create instance"
3. Select:
   - Platform: Linux/Unix
   - Blueprint: Ubuntu 22.04 LTS
   - Instance plan: $10/month (2 GB RAM) minimum, $20/month (4 GB RAM) recommended
   - Instance name: `insight-manager-v7`
4. Click "Create instance"

**Via AWS CLI:**
```bash
aws lightsail create-instances \
  --instance-names insight-manager-v7 \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id medium_2_0
```

### Step 2: Configure Networking

**Open required ports:**
```bash
# HTTP (port 8080 for Docker)
aws lightsail open-instance-public-ports \
  --instance-name insight-manager-v7 \
  --port-info fromPort=8080,toPort=8080,protocol=TCP

# HTTPS (if using SSL)
aws lightsail open-instance-public-ports \
  --instance-name insight-manager-v7 \
  --port-info fromPort=443,toPort=443,protocol=TCP

# HTTP (for Nginx)
aws lightsail open-instance-public-ports \
  --instance-name insight-manager-v7 \
  --port-info fromPort=80,toPort=80,protocol=TCP
```

### Step 3: Connect and Install Dependencies

```bash
# Connect via SSH
ssh -i LightsailDefaultKey-us-east-1.pem ubuntu@YOUR_INSTANCE_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git and other tools
sudo apt install git htop nano curl -y

# Logout and login for docker group
exit
```

### Step 4: Deploy Application

```bash
# Reconnect
ssh -i LightsailDefaultKey-us-east-1.pem ubuntu@YOUR_INSTANCE_IP

# Clone repository
git clone https://github.com/YOUR_USERNAME/insight-manager-v7.git
cd insight-manager-v7

# Switch to aws branch
git checkout aws

# Create production environment file
cp .env.example .env
nano .env
```

**Configure .env for production:**
```env
# Database Configuration (Docker)
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_very_secure_password_here
DB_NAME=insight_manager

# Server Configuration
PORT=3000
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Production settings
NODE_ENV=production
```

**Generate secure secrets:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

### Step 5: Start Services

```bash
# Start application
docker-compose up -d

# Wait for services to start (database needs time to initialize)
sleep 60

# Check status
docker-compose ps

# Initialize database (tables will be created automatically)
docker-compose exec app bun run db:push
docker-compose exec app bun run db:seed

# Verify application is working
curl http://localhost:8080/health
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check logs
docker-compose logs -f
```

### Step 6: Configure Auto-Start

```bash
# Create systemd service
sudo nano /etc/systemd/system/insight-manager.service
```

Add this configuration:
```ini
[Unit]
Description=Insight Manager v7
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/insight-manager-v7
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable insight-manager
sudo systemctl start insight-manager
sudo systemctl status insight-manager
```

---

## SSL/HTTPS Setup

### Step 1: Configure Domain

**Create static IP:**
```bash
# Allocate static IP
aws lightsail allocate-static-ip --static-ip-name insight-manager-ip

# Attach to instance
aws lightsail attach-static-ip \
  --static-ip-name insight-manager-ip \
  --instance-name insight-manager-v7
```

**Configure DNS:**
Add A record at your domain registrar:
- Type: A
- Name: @ (or subdomain like `app`)
- Value: YOUR_STATIC_IP
- TTL: 300

### Step 2: Install Nginx and SSL

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/insight-manager
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Handle file uploads
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/insight-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Option 2: Lightsail Container Service

### Step 1: Build and Push Image

```bash
# Build locally
cd insight-manager-v7
docker build -t insight-manager-v7:latest .

# Tag for registry (use ECR or Docker Hub)
docker tag insight-manager-v7:latest YOUR_REGISTRY/insight-manager-v7:latest
docker push YOUR_REGISTRY/insight-manager-v7:latest
```

### Step 2: Create Container Service

```bash
# Create service
aws lightsail create-container-service \
  --service-name insight-manager-v7 \
  --power small \
  --scale 1

# Create managed database
aws lightsail create-relational-database \
  --relational-database-name insight-manager-db \
  --relational-database-blueprint-id postgres_16 \
  --relational-database-bundle-id micro_2_0 \
  --master-database-name insight_manager \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD
```

### Step 3: Deploy Container

Create `containers.json`:
```json
{
  "app": {
    "image": "YOUR_REGISTRY/insight-manager-v7:latest",
    "ports": {
      "3000": "HTTP"
    },
    "environment": {
      "DB_HOST": "YOUR_DB_ENDPOINT",
      "DB_PORT": "5432",
      "DB_USER": "postgres",
      "DB_PASSWORD": "YOUR_DB_PASSWORD",
      "DB_NAME": "insight_manager",
      "JWT_SECRET": "YOUR_JWT_SECRET",
      "PORT": "3000",
      "NODE_ENV": "production"
    }
  }
}
```

Create `public-endpoint.json`:
```json
{
  "containerName": "app",
  "containerPort": 3000,
  "healthCheck": {
    "path": "/health",
    "intervalSeconds": 30
  }
}
```

Deploy:
```bash
aws lightsail create-container-service-deployment \
  --service-name insight-manager-v7 \
  --containers file://containers.json \
  --public-endpoint file://public-endpoint.json
```

---

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100
```

### System Monitoring

```bash
# Resource usage
docker stats
htop
df -h

# Service status
sudo systemctl status insight-manager
docker-compose ps
```

### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U postgres insight_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
nano backup.sh
```

Add backup script:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
cd /home/ubuntu/insight-manager-v7

# Create backup
docker-compose exec -T db pg_dump -U postgres insight_manager > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: $(date)"
```

```bash
# Make executable and add to cron
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ubuntu/insight-manager-v7/backup.sh >> /home/ubuntu/backup.log 2>&1
```

### Update Application

```bash
# Pull latest changes
cd /home/ubuntu/insight-manager-v7
git pull origin aws

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations if needed
docker-compose exec app bun run db:push
```

---

## Performance Optimization

### Add Swap Memory

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

### Docker Optimization

Edit `docker-compose.yml` to add resource limits:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Database Optimization

```bash
# Connect to database
docker-compose exec db psql -U postgres insight_manager

# Optimize queries
ANALYZE;
VACUUM;

# Check performance
SELECT * FROM pg_stat_activity;
```

---

## Security Best Practices

### Firewall Configuration

```bash
# Install UFW
sudo apt install ufw -y

# Configure rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Check configuration
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

### Regular Maintenance

```bash
# Create maintenance script
nano maintenance.sh
```

Add:
```bash
#!/bin/bash
echo "Starting maintenance: $(date)"

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean Docker
docker system prune -f

# Clean logs
sudo journalctl --vacuum-time=7d

# Restart services
cd /home/ubuntu/insight-manager-v7
docker-compose restart

echo "Maintenance completed: $(date)"
```

```bash
# Schedule weekly maintenance (Sunday 3 AM)
chmod +x maintenance.sh
crontab -e
# Add: 0 3 * * 0 /home/ubuntu/insight-manager-v7/maintenance.sh >> /home/ubuntu/maintenance.log 2>&1
```

---

## Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check Docker status
sudo systemctl status docker
docker-compose ps

# Check logs
docker-compose logs app

# Restart services
docker-compose restart
```

**Database connection error:**
```bash
# Check database container
docker-compose logs db

# Test connection
docker-compose exec db psql -U postgres insight_manager

# Reset database
docker-compose down -v
docker-compose up -d
```

**Out of memory:**
```bash
# Check memory usage
free -h
docker stats

# Add swap (see Performance Optimization)
# Or upgrade instance plan
```

**SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

---

## Cost Optimization

### Instance Sizing

| Instance Plan | RAM | vCPU | Storage | Cost/Month | Recommended For |
|---------------|-----|------|---------|------------|-----------------|
| $5/month | 1 GB | 1 | 40 GB | $5 | Development only |
| $10/month | 2 GB | 1 | 60 GB | $10 | Small production |
| $20/month | 4 GB | 2 | 80 GB | $20 | Medium production |
| $40/month | 8 GB | 2 | 160 GB | $40 | High traffic |

### Cost Monitoring

```bash
# Monitor data transfer
aws lightsail get-instance-metric-data \
  --instance-name insight-manager-v7 \
  --metric-name NetworkOut \
  --period 3600 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --statistics Sum
```

---

## Scaling Considerations

### Vertical Scaling (Upgrade Instance)

```bash
# Create snapshot first
aws lightsail create-instance-snapshot \
  --instance-name insight-manager-v7 \
  --instance-snapshot-name insight-manager-v7-snapshot

# Create new instance from snapshot with larger plan
aws lightsail create-instances-from-snapshot \
  --instance-names insight-manager-v7-large \
  --instance-snapshot-name insight-manager-v7-snapshot \
  --bundle-id large_2_0
```

### Horizontal Scaling

For high traffic, consider:
1. Multiple Lightsail instances behind a load balancer
2. Separate database instance (RDS)
3. CDN for static assets (CloudFront)
4. File storage (S3)

---

## Support and Resources

- **AWS Lightsail Documentation**: https://lightsail.aws.amazon.com/ls/docs
- **Docker Documentation**: https://docs.docker.com
- **Application Logs**: `docker-compose logs -f`
- **System Logs**: `sudo journalctl -f`

---

## Quick Reference Commands

```bash
# Service management
sudo systemctl start insight-manager
sudo systemctl stop insight-manager
sudo systemctl restart insight-manager
sudo systemctl status insight-manager

# Docker management
docker-compose up -d
docker-compose down
docker-compose restart
docker-compose logs -f
docker-compose ps

# Database operations
docker-compose exec db psql -U postgres insight_manager
docker-compose exec app bun run db:push
docker-compose exec app bun run db:seed

# System monitoring
htop
df -h
free -h
docker stats
sudo ufw status
```

**Your Insight Manager v7 is now production-ready on AWS Lightsail!** 🚀