#!/bin/bash

# BlindFold Shade Agent - Phala Cloud Deployment Script
# This script automates deployment to Phala Cloud TEE

set -e  # Exit on error

echo "🚀 BlindFold Shade Agent - Phala Cloud Deployment"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please create a .env file with your configuration."
    echo "   You can copy .env.example and fill in your values:"
    echo "   cp .env.example .env"
    exit 1
fi

echo "✅ Found .env file"

# Check if Phala CLI is installed
if ! command -v phala &> /dev/null; then
    echo "📦 Phala CLI not found. Installing..."
    npm install -g phala
else
    echo "✅ Phala CLI is installed"
fi

# Check authentication
echo ""
echo "🔐 Checking Phala Cloud authentication..."
if ! phala status &> /dev/null; then
    echo "🔑 Please login to Phala Cloud:"
    echo "   You'll need your API key from https://phala.network/dashboard"
    read -p "Enter your Phala API key: " API_KEY
    phala auth login $API_KEY
else
    echo "✅ Already authenticated"
fi

# Build version tag
VERSION=${1:-v1.0.0}
IMAGE_NAME="blindfold-shade-agent"

echo ""
echo "🏗️  Building Docker image: $IMAGE_NAME:$VERSION"
echo "   This may take a few minutes..."
phala docker build --image $IMAGE_NAME --tag $VERSION

echo ""
echo "✅ Docker image built successfully"

# Deploy to Phala Cloud
echo ""
echo "📤 Deploying to Phala Cloud TEE..."
echo "   Name: $IMAGE_NAME"
echo "   Version: $VERSION"

phala cvms create \
  --name $IMAGE_NAME \
  --compose ./docker-compose.yml

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📊 View deployment status:"
echo "   phala cvms get $IMAGE_NAME"
echo ""
echo "📜 View logs:"
echo "   phala cvms logs $IMAGE_NAME"
echo ""
echo "🔒 Verify TEE attestation:"
echo "   phala cvms attestation $IMAGE_NAME"
echo "   Or visit https://phala.network/dashboard"
echo ""
echo "🎉 Your Shade Agent is now running in a Trusted Execution Environment!"
