#!/bin/bash

# thecommonsoul.com Production Deployment
echo "🚀 Deploying Common Soul to thecommonsoul.com..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin master

# Build and deploy with Docker Compose
echo "🏗️ Building and starting containers..."
docker-compose up -d --build

# Check deployment status
echo "🔍 Checking deployment status..."
sleep 10
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 thecommonsoul.com is now live!"
    echo "📊 Health check: PASSED"
    echo "🔗 Local access: http://localhost:3001"
else
    echo "❌ Deployment failed - health check failed"
    echo "📋 Container logs:"
    docker-compose logs --tail=50
    exit 1
fi

# Show container status
echo "📦 Container status:"
docker-compose ps

echo "🎉 Deployment to thecommonsoul.com complete!"
echo "💡 Next steps:"
echo "   1. Configure your domain DNS to point to this server"
echo "   2. Set up SSL certificate (Let's Encrypt recommended)"
echo "   3. Configure reverse proxy (Nginx recommended)"
echo "   4. Update environment variables with production keys"