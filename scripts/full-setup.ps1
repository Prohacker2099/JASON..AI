# JASON AI Architect - Full Setup Script

# Ensure running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
    Write-Warning "Please run this script as an Administrator!"
    exit
}

# Set strict error handling
$ErrorActionPreference = 'Stop'

# Function to log messages
function Write-ColorOutput($Message, $Color = 'Green') {
    Write-Host $Message -ForegroundColor $Color
}

# Cleanup and Preparation
Write-ColorOutput "Cleaning up previous installations..." Yellow
npm cache clean --force
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }

# Install Dependencies
Write-ColorOutput "Installing project dependencies..." Cyan
npm install

# Install Development Tools
Write-ColorOutput "Installing development tools..." Magenta
npm install -g prisma tsx typescript

# PostgreSQL Setup
Write-ColorOutput "Setting up PostgreSQL..." Blue
& "$PSScriptRoot\setup-postgres.ps1"

# Generate Environment Configuration
Write-ColorOutput "Generating secure environment configuration..." Green
node scripts/generate-env.js

# Remove Mock Logic
Write-ColorOutput "Removing mock and simulated logic..." Red
tsx scripts/remove-mock-logic.ts

# Prisma Database Setup
Write-ColorOutput "Initializing database..." Cyan
npx prisma generate
npx prisma migrate dev --name init

# Build Application
Write-ColorOutput "Building application..." Green
npm run build

# Run Comprehensive Tests
Write-ColorOutput "Running comprehensive tests..." Yellow
npm test

# Start Application
Write-ColorOutput "Starting JASON AI Architect..." Blue
npm run dev
