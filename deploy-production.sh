#!/bin/bash

# JASON Production Deployment Script
echo "🚀 Starting JASON production deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build the application
echo "🔨 Building server and client..."
npm run build:all

# Verify client build exists
if [ -d "./client/build" ]; then
  echo "✅ Client build created successfully"
else
  echo "❌ Client build failed. Check for errors."
  exit 1
fi

# Start the production server
echo "🚀 Starting production server..."
npm run start:prod

# Note: For a real production environment, you might want to use:
# - PM2 for process management
# - NGINX as a reverse proxy
# - SSL certificates for HTTPS