#!/bin/bash

echo "🔍 Validating Insight Manager v7 Setup..."

# Check if required files exist
echo "📁 Checking required files..."
required_files=(
    "package.json"
    "docker-compose.yml" 
    "Dockerfile"
    "src/server.ts"
    "public/index.html"
    "QUICKSTART.md"
    "README.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check if directories exist
echo "📂 Checking required directories..."
required_dirs=(
    "src/db"
    "src/routes"
    "public"
    "uploads"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/ exists"
    else
        echo "❌ $dir/ missing"
        exit 1
    fi
done

echo ""
echo "🎉 All required files and directories are present!"
echo ""
echo "🚀 Ready to start! Run the following commands:"
echo "   docker-compose up -d"
echo "   sleep 10"
echo "   docker-compose exec app bun run db:push"
echo "   docker-compose exec app bun run db:seed"
echo "   open http://localhost:8080"
echo ""
echo "📖 For detailed instructions, see QUICKSTART.md"