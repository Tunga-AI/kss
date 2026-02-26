#!/bin/bash

# Test Docker build locally before deploying

set -e

echo "🐳 Testing Docker build locally..."
echo ""

# Build the image
echo "📦 Building Docker image..."
docker build -t sales-test .

echo ""
echo "✅ Build successful!"
echo ""
echo "To run locally:"
echo "  docker run -p 8080:8080 sales-test"
echo ""
echo "Then visit: http://localhost:8080"
echo ""
