#!/bin/bash

# AWS Lightsail Deployment Script for Insight Manager v7
# This script automates the deployment process on a fresh Lightsail instance

set -e  # Exit on any error

echo "🚀 AWS Lightsail Deployment Script for Insight Manager v7"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root. Run as ubuntu user."
    exit 1
fi

# Check if we're on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu. Please use Ubuntu 22.04 LTS."
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated successfully"

# Step 2: Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    rm get-docker.sh
    print_success "Docker installed successfully"
else
    print_warning "Docker is already installed"
fi

# Step 3: Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_warning "Docker Compose is already installed"
fi

# Step 4: Install additional tools
print_status "Installing additional tools..."
sudo apt install -y git htop nano curl ufw
print_success "Additional tools installed"

# Step 5: Configure firewall
print_status "Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable
print_success "Firewall configured"

# Step 6: Clone repository (if not already present)
if [ ! -d "insight-manager-v7" ]; then
    print_status "Please provide your GitHub repository URL:"
    read -p "Repository URL (e.g., https://github.com/username/insight-manager-v7.git): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        print_error "Repository URL is required"
        exit 1
    fi
    
    print_status "Cloning repository..."
    git clone "$REPO_URL"
    print_success "Repository cloned"
else
    print_warning "Repository directory already exists"
fi

cd insight-manager-v7

# Switch to aws branch if it exists
if git branch -r | grep -q "origin/aws"; then
    print_status "Switching to aws branch..."
    git checkout aws
    print_success "Switched to aws branch"
fi

# Step 7: Configure environment
print_status "Configuring environment..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
    else
        print_status "Creating .env file..."
        cat > .env << EOF
# Database Configuration (Docker)
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=$(openssl rand -base64 24)
DB_NAME=insight_manager

# Server Configuration
PORT=3000
JWT_SECRET=$(openssl rand -base64 32)

# Production settings
NODE_ENV=production
EOF
        print_success "Created .env file with secure defaults"
    fi
else
    print_warning ".env file already exists"
fi

# Step 8: Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/insight-manager.service > /dev/null << EOF
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
EOF

sudo systemctl enable insight-manager
print_success "Systemd service created and enabled"

# Step 9: Add swap if needed (for low memory instances)
MEMORY_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEMORY_GB=$((MEMORY_KB / 1024 / 1024))

if [ $MEMORY_GB -lt 4 ]; then
    print_status "Adding swap file (detected ${MEMORY_GB}GB RAM)..."
    if [ ! -f /swapfile ]; then
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        print_success "2GB swap file created"
    else
        print_warning "Swap file already exists"
    fi
fi

# Step 10: Start application
print_status "Starting application..."

# Check if user is in docker group (requires logout/login)
if ! groups | grep -q docker; then
    print_warning "User needs to be in docker group. Logging out and back in..."
    print_status "Please run the following commands after reconnecting:"
    echo "cd insight-manager-v7"
    echo "docker-compose up -d"
    echo "sleep 30"
    echo "docker-compose exec app bun run db:push"
    echo "docker-compose exec app bun run db:seed"
    exit 0
fi

docker-compose up -d
print_success "Application started"

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "Services are running"
    
    # Initialize database
    print_status "Initializing database..."
    docker-compose exec app bun run db:push
    docker-compose exec app bun run db:seed
    print_success "Database initialized"
    
    # Show status
    print_status "Service status:"
    docker-compose ps
    
    # Get instance IP
    INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "=================================================="
    echo "Application URL: http://${INSTANCE_IP}:8080"
    echo "Default login: admin / admin123"
    echo ""
    echo "Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Restart: docker-compose restart"
    echo "  Stop: docker-compose down"
    echo "  Status: docker-compose ps"
    echo ""
    echo "Next steps:"
    echo "1. Configure your domain DNS to point to: ${INSTANCE_IP}"
    echo "2. Run SSL setup if you have a domain"
    echo "3. Change default passwords in the application"
    echo ""
else
    print_error "Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

# Create backup script
print_status "Creating backup script..."
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
cd /home/ubuntu/insight-manager-v7

# Create backup
docker-compose exec -T db pg_dump -U postgres insight_manager > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: $(date)"
EOF

chmod +x backup.sh
print_success "Backup script created"

# Create update script
print_status "Creating update script..."
cat > update.sh << 'EOF'
#!/bin/bash
echo "Updating Insight Manager v7..."

# Pull latest changes
git pull origin aws

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services
sleep 30

# Run migrations
docker-compose exec app bun run db:push

echo "Update completed: $(date)"
EOF

chmod +x update.sh
print_success "Update script created"

print_success "All scripts created successfully!"
print_status "You can now set up automated backups with: crontab -e"
print_status "Add this line for daily backups at 2 AM:"
print_status "0 2 * * * /home/ubuntu/insight-manager-v7/backup.sh >> /home/ubuntu/backup.log 2>&1"