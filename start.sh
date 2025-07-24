#!/bin/bash

# JASON - The Omnipotent AI Architect
# Production launch script

echo "🚀 Starting JASON - The Omnipotent AI Architect"
echo "💰 Trillion Dollar Launch Sequence Initiated"

# Kill any existing processes on port 3001
echo "🔄 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start the server
echo "🚀 Launching JASON server..."
node server/index.js