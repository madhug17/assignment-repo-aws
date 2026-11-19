#!/bin/bash
# =============================================================
# Deployment Script for College Appointment System
# Run this script from the project root directory
# Usage: bash deployment/deploy.sh
# =============================================================

set -e

echo "=========================================="
echo "College Appointment System - Deploy"
echo "=========================================="

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "Deploying from: $APP_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Install dependencies
echo "[1/4] Installing Node.js dependencies..."
npm install --production

# Verify critical files
echo "[2/4] Verifying project files..."
if [ ! -f "index.js" ]; then
    echo "ERROR: index.js not found!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    exit 1
fi

echo "Project files verified."

# Stop existing PM2 process if running
echo "[3/4] Managing PM2 process..."
pm2 stop unque-api 2>/dev/null || true
pm2 delete unque-api 2>/dev/null || true

# Start the application with PM2
echo "[4/4] Starting application with PM2..."
if [ -f "deployment/ecosystem.config.js" ]; then
    pm2 start deployment/ecosystem.config.js --env production
else
    pm2 start index.js --name "unque-api" --env production
fi

# Save PM2 process list for auto-restart on reboot
pm2 save

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Application status:"
pm2 status

echo ""
echo "Useful commands:"
echo "  pm2 logs unque-api     - View application logs"
echo "  pm2 restart unque-api  - Restart application"
echo "  pm2 stop unque-api     - Stop application"
echo "  pm2 monit              - Monitor application"
echo ""

# Quick health check
PORT=$(grep PORT .env | head -1 | cut -d'=' -f2 | tr -d ' ')
PORT=${PORT:-5001}
echo "Testing health endpoint..."
sleep 3
curl -s http://localhost:$PORT/health || echo "Health check pending - app may still be starting"
echo ""
