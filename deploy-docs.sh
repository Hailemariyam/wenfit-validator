#!/bin/bash

# Wenfit Validator Documentation Deployment Script

echo "🚀 Wenfit Validator Documentation Deployment"
echo "=============================================="
echo ""

# Check if docs-site exists
if [ ! -d "docs-site" ]; then
    echo "❌ Error: docs-site directory not found"
    exit 1
fi

cd docs-site

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Build the documentation
echo "🔨 Building documentation..."
npm run docs:build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📁 Built files are in: docs-site/docs/.vitepress/dist/"
    echo ""
    echo "🌐 Deployment Options:"
    echo ""
    echo "1. Vercel (Recommended):"
    echo "   npm i -g vercel"
    echo "   vercel"
    echo ""
    echo "2. Netlify:"
    echo "   npm i -g netlify-cli"
    echo "   netlify deploy --prod"
    echo ""
    echo "3. GitHub Pages:"
    echo "   - Push to GitHub"
    echo "   - Enable GitHub Pages in repository settings"
    echo "   - Auto-deploys via GitHub Actions"
    echo ""
    echo "4. Preview locally:"
    echo "   npm run docs:preview"
    echo ""
else
    echo "❌ Build failed"
    exit 1
fi
