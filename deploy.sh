#!/bin/bash

# Common Soul Production Deployment Script
echo "🚀 Starting Common Soul deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '#' | xargs)
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Copy frontend build to backend public directory
echo "📋 Copying frontend build..."
rm -rf backend/public
cp -r frontend/dist backend/public

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm ci --only=production

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🌟 Starting application..."
if command -v pm2 &> /dev/null; then
    echo "Using PM2 for process management..."
    npm run pm2:restart 2>/dev/null || npm run pm2:start
else
    echo "Starting with Node.js..."
    npm start
fi

echo "✅ Deployment complete!"
echo "🌐 Application should be running on port ${PORT:-3001}"