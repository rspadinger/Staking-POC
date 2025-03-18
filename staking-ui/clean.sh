#!/bin/bash

# Clean script for the staking-ui project

echo "Cleaning project..."

# Stop any running processes on ports 3000-3002
echo "Stopping any processes on ports 3000-3002..."
lsof -ti:3000-3002 | xargs kill -9 2>/dev/null || echo "No processes found"

# Remove build and cache directories
echo "Removing build and cache directories..."
rm -rf .next
rm -rf node_modules/.cache

# Clear Next.js cache
echo "Clearing Next.js cache..."
npx next telemetry disable
npx next clean

# Rebuild the project
echo "Rebuilding the project..."
npm run build

echo "Done! You can now run: npm run run-port-3001" 