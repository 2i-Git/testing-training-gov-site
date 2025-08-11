#!/bin/bash

# Docker setup script for Alcohol License Training Application
echo "🐳 Building Alcohol License Training Application Docker Container"
echo "=============================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p database logs

# Set proper permissions
chmod 755 database logs

echo "🔨 Building Docker image..."
docker compose build --no-cache

echo "🚀 Starting the application..."
docker compose up -d

echo "⏳ Waiting for application to start..."
sleep 10

# Check if container is running
if docker compose ps | grep -q "Up"; then
    echo "✅ Application started successfully!"
    echo ""
    echo "🌐 Access the application at:"
    echo "   Main application: http://localhost:3000"
    echo "   Admin panel: http://localhost:3000/admin/login"
    echo ""
    echo "👤 Login credentials:"
    echo "   User: user@example.com / password123"
    echo "   Admin: admin@example.com / admin123"
    echo ""
    echo "📊 Useful commands:"
    echo "   View logs: docker compose logs -f"
    echo "   Stop app: docker compose down"
    echo "   Restart: docker compose restart"
else
    echo "❌ Failed to start application. Check logs:"
    docker compose logs
    exit 1
fi
