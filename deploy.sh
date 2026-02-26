#!/bin/bash

# KSS Sales - Cloud Run Deployment Script
# Project: gonogasport
# Service: sales

set -e

echo "🚀 Deploying KSS Sales to Cloud Run..."
echo "Project: gonogasport"
echo "Service: sales"
echo "Region: us-central1"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "📋 Setting project to gonogasport..."
gcloud config set project gonogasport

# Submit build
echo "🔨 Building and deploying via Cloud Build..."
gcloud builds submit --config cloudbuild.yaml

echo ""
echo "✅ Deployment complete!"
echo ""
echo "To view your service:"
echo "  gcloud run services describe sales --region us-central1"
echo ""
echo "To view logs:"
echo "  gcloud run services logs read sales --region us-central1"
echo ""
