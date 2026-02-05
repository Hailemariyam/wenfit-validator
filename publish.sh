#!/bin/bash

# Wenfit Validator - NPM Publishing Script
# This script automates the publishing process with safety checks

set -e  # Exit on error

echo "🚀 Wenfit Validator - NPM Publishing Script"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if logged in to NPM
echo "📝 Checking NPM authentication..."
if ! npm whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to NPM${NC}"
    echo "Please run: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✅ Logged in as: $NPM_USER${NC}"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
echo -e "${GREEN}✅ Cleaned${NC}"
echo ""

# Run tests
echo "🧪 Running tests..."
if npm test; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi
echo ""

# Build
echo "🔨 Building package..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Check bundle size
echo "📊 Checking bundle size..."
npm run build:check
echo ""

# Lint
echo "🔍 Linting code..."
if npm run lint; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi
echo ""

# Type check
echo "🔍 Type checking..."
if npm run typecheck; then
    echo -e "${GREEN}✅ Type check passed${NC}"
else
    echo -e "${RED}❌ Type check failed${NC}"
    exit 1
fi
echo ""

# Dry run
echo "🔍 Running publish dry-run..."
npm pack --dry-run
echo ""

# Confirmation
echo -e "${YELLOW}⚠️  Ready to publish version $CURRENT_VERSION${NC}"
echo ""
echo "This will:"
echo "  1. Publish to NPM registry"
echo "  2. Make the package publicly available"
echo "  3. Create a git tag"
echo ""
read -p "Are you sure you want to publish? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 1
fi

# Publish
echo "📦 Publishing to NPM..."
if npm publish; then
    echo -e "${GREEN}✅ Successfully published version $CURRENT_VERSION${NC}"
else
    echo -e "${RED}❌ Publishing failed${NC}"
    exit 1
fi
echo ""

# Create git tag
echo "🏷️  Creating git tag..."
if git tag -a "v$CURRENT_VERSION" -m "Release v$CURRENT_VERSION"; then
    echo -e "${GREEN}✅ Tag created${NC}"
    echo "Don't forget to push the tag: git push origin v$CURRENT_VERSION"
else
    echo -e "${YELLOW}⚠️  Tag might already exist${NC}"
fi
echo ""

# Success
echo "==========================================="
echo -e "${GREEN}🎉 Successfully published wenfit-validator@$CURRENT_VERSION${NC}"
echo "==========================================="
echo ""
echo "Next steps:"
echo "  1. Push git tag: git push origin v$CURRENT_VERSION"
echo "  2. Create GitHub release"
echo "  3. Verify on NPM: https://www.npmjs.com/package/wenfit-validator"
echo "  4. Test installation: npm install wenfit-validator@$CURRENT_VERSION"
echo ""
