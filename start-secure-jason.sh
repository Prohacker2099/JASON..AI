#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Build client
echo "Building client..."
cd client
npm install
npm run build
cd ..

# Start server
echo "Starting server..."
node --experimental-modules server/app.js
