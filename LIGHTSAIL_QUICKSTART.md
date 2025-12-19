# AWS Lightsail Quick Deploy Guide

Deploy Insight Manager v7 to AWS Lightsail in under 15 minutes.

## ✅ Deployment Verified

This guide has been tested and works with the latest fixes:
- ✅ Docker build process fixed
- ✅ Static file serving resolved  
- ✅ Database initialization working
- ✅ All features functional

## Prerequisites

- AWS account with Lightsail access
- Basic terminal knowledge

## Step 1: Create Lightsail Instance

1. **Go to AWS Lightsail Console**: https://lightsail.aws.amazon.com/
2. **Create Instance**:
   - Platform: Linux/Unix
   - Blueprint: Ubuntu 22.04 LTS
   - Instance plan: $10/month (2 GB RAM) or higher
   - Name: `insight-manager-v7`
3. **Wait for "Running" status** (1-2 minutes)

## Step 2: Connect and Setup

1. **Connect via SSH** (click "Connect using SSH" button)

2. **Install Docker & Docker Compose**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
sudo apt install git -y

# Logout and login for docker group
exit
```

3. **Reconnect and deploy**:
```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/insight-manager-v7.git
cd insight-manager-v7

# Switch to aws branch
git checkout aws

# Create environment file
cp .env.example .env
nano .env
```

4. **Configure .env file**:
```env
# Database Configuration (for Docker)
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=insight_manager

# Server Configuration
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this

# Production settings
NODE_ENV=production
```

## Step 3: Configure Firewall

1. **In Lightsail Console**:
   - Go to your instance → Networking tab
   - Add Custom rule: TCP, Port 8080, Source: Anywhere

## Step 4: Deploy Application

```bash
# Start the application
docker-compose up -d

# Wait for containers to start (database needs time to initialize)
sleep 60

# Initialize database (creates tables and seed data)
docker-compose exec app bun run db:push
docker-compose exec app bun run db:seed

# Verify everything is working
curl http://localhost:8080/health
echo "✅ Health check passed"

# Test login API
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -q "token"
echo "✅ Login API working"

# Check container status
docker-compose ps
```

## Step 5: Access Your Application

- **URL**: `http://YOUR_INSTANCE_PUBLIC_IP:8080`
- **Default Accounts**:
  - **Admin**: username: `admin`, password: `admin123`
  - **Manager**: username: `manager`, password: `manager123`
  - **Viewer**: username: `viewer`, password: `viewer123`

**🎉 Success!** You should see the login screen. Use admin credentials to access all features.

## Quick Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update application
git pull origin aws && docker-compose up -d --build
```

## Troubleshooting

**Can't access application?**
- Check firewall: Port 8080 open to 0.0.0.0/0
- Check containers: `docker-compose ps`
- Check logs: `docker-compose logs app`

**Database connection error?**
- Wait longer for DB to start: `docker-compose logs db`
- Restart: `docker-compose restart`

**Out of memory?**
- Upgrade to $20/month instance (4 GB RAM)
- Add swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`

## Production Setup (Optional)

**Add SSL with domain**:
```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx (replace your-domain.com)
sudo nano /etc/nginx/sites-available/insight-manager
```

Add this config:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site and get SSL
sudo ln -s /etc/nginx/sites-available/insight-manager /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
sudo certbot --nginx -d your-domain.com
```

## Auto-Start on Reboot

```bash
# Create systemd service
sudo nano /etc/systemd/system/insight-manager.service
```

Add:
```ini
[Unit]
Description=Insight Manager
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/insight-manager-v7
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
```

```bash
# Enable auto-start
sudo systemctl enable insight-manager
sudo systemctl start insight-manager
```

**That's it! Your Insight Manager v7 is now running on AWS Lightsail.** 🚀

**Cost**: ~$10-20/month depending on instance size