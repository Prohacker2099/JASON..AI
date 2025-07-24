#!/bin/bash

# JASON - The Omnipotent AI Architect
# Production launch script

echo "🚀 Starting JASON - The Omnipotent AI Architect"
echo "💰 Trillion Dollar Launch Sequence Initiated"

# Kill any existing processes on port 3001
echo "🔄 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Build the client
echo "🏗️ Building client..."
cd client
npm run build
cd ..

# Copy client build to server public directory
echo "📋 Copying client build to server..."
mkdir -p server/public
cp -r client/build/* server/public/

# Start the server
echo "🚀 Launching JASON server..."
node server/index.js