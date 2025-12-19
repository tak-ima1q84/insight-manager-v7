# Quick Start Guide

Get Insight Manager v7 running in under 5 minutes.

## ✅ Latest Updates (December 2024)

**All issues resolved!** This version includes:
- ✅ Fixed Docker build (bun.lock file generated)
- ✅ Fixed white screen issue (static file serving corrected)
- ✅ Database initialization working properly
- ✅ All API endpoints functional
- ✅ React frontend loading correctly

## Prerequisites

- Docker and Docker Compose installed
- OR Bun v1.x + PostgreSQL for local development

## Option 1: Docker (Recommended)

```bash
# Clone and navigate to the project
cd insight-manager-v7

# Start the application
docker-compose up -d

# Wait for containers to start (database needs time to initialize)
sleep 30

# Initialize database (creates tables and seed data)
docker-compose exec app bun run db:push
docker-compose exec app bun run db:seed

# Verify everything is working
curl http://localhost:8080/health
echo "✅ Application is healthy"

# Open in browser
open http://localhost:8080
```

## Option 2: Local Development

```bash
# Install dependencies
bun install

# Copy environment file and configure database
cp .env.example .env
# Edit .env with your PostgreSQL connection details

# Initialize database
bun run db:push
bun run db:seed

# Start backend server
bun run dev

# In another terminal, start frontend
bun run vite
# Then open http://localhost:5173
```

## Login Credentials

The application comes with three pre-configured accounts:

- **Admin** (Full access): username: `admin`, password: `admin123`
- **Manager** (Create/Edit): username: `manager`, password: `manager123`  
- **Viewer** (Read-only): username: `viewer`, password: `viewer123`

**🎉 Success!** You should see the Japanese login interface. Use admin credentials for full functionality.

## What's Next?

1. **Create Insights**: Click "新規登録" to add new insights
2. **Upload Images**: Use the image upload feature for teaser and story images
3. **Import Data**: Use "CSV インポート" to bulk import insights
4. **Manage Masters**: Access "マスタ管理" to configure dropdown options (Admin only)

## Troubleshooting

### White Screen or App Not Loading
```bash
# Check if containers are running
docker-compose ps

# Check application logs
docker-compose logs app

# Restart containers
docker-compose restart
```

### Database Connection Issues
```bash
# Check database container logs
docker-compose logs db

# Wait longer for database to initialize
sleep 60
docker-compose exec app bun run db:push

# Restart containers
docker-compose down
docker-compose up -d
```

### Port Already in Use
```bash
# Stop existing containers
docker-compose down

# Or change port in docker-compose.yml from 8080 to another port
```

### Reset Everything
```bash
# Complete reset (removes all data)
docker-compose down -v
docker-compose up -d
sleep 60  # Wait for database
docker-compose exec app bun run db:push
docker-compose exec app bun run db:seed
```

### Verify Installation
```bash
# Test health endpoint
curl http://localhost:8080/health

# Test login API
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Should return a JSON response with token
```

## API Endpoints

- `POST /api/auth/login` - Authentication
- `GET /api/insights` - List insights with search/filter
- `POST /api/insights` - Create insight (Admin/Manager)
- `PUT /api/insights/:id` - Update insight (Admin/Manager)
- `DELETE /api/insights/:id` - Delete insight (Admin/Manager)
- `POST /api/insights/upload` - Upload images
- `POST /api/insights/import/csv` - CSV import (Admin/Manager)
- `GET /api/insights/export/csv` - CSV export (Admin/Manager)
- `GET /api/masters` - List master data
- `POST /api/masters` - Create master data (Admin only)

That's it! You should now have a fully functional Insight Manager v7 running.