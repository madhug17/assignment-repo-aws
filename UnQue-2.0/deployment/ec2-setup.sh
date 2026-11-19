#!/bin/bash
# =============================================================
# EC2 Instance Setup Script for College Appointment System
# Run this script on a fresh Ubuntu EC2 instance
# Usage: bash ec2-setup.sh
# =============================================================

set -e

echo "=========================================="
echo "College Appointment System - EC2 Setup"
echo "=========================================="

# Update system packages
echo "[1/6] Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js 20.x LTS
echo "[2/6] Installing Node.js 20.x LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed: $(node --version)"
fi

# Verify Node.js and npm
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install PM2 globally
echo "[3/6] Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 is already installed: $(pm2 --version)"
fi

# Install git
echo "[4/6] Installing git..."
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
else
    echo "Git is already installed: $(git --version)"
fi

# Create application directory
echo "[5/6] Setting up application directory..."
APP_DIR="/home/ubuntu/UnQue-2.0"
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    echo "Created application directory: $APP_DIR"
else
    echo "Application directory already exists: $APP_DIR"
fi

# Create certs directory for DocumentDB CA certificate
echo "[6/6] Setting up certificates directory..."
CERTS_DIR="$APP_DIR/certs"
if [ ! -d "$CERTS_DIR" ]; then
    mkdir -p "$CERTS_DIR"
fi

# Download AWS DocumentDB CA bundle if not present
if [ ! -f "$CERTS_DIR/global-bundle.pem" ]; then
    echo "Downloading AWS DocumentDB CA certificate bundle..."
    wget -q https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O "$CERTS_DIR/global-bundle.pem"
    echo "CA certificate downloaded to $CERTS_DIR/global-bundle.pem"
else
    echo "CA certificate already exists."
fi

# Configure PM2 startup
echo "Configuring PM2 startup on reboot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo ""
echo "=========================================="
echo "EC2 Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Clone or copy your project to $APP_DIR"
echo "  2. Create .env file in $APP_DIR (copy from .env.example)"
echo "  3. Run: cd $APP_DIR && bash deployment/deploy.sh"
echo ""
