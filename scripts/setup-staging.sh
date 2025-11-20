#!/bin/bash

# Setup script for staging environment
# This script helps set up a staging branch and configure Vercel

set -e

echo "🚀 Setting up staging environment..."

# Check if staging branch exists
if git show-ref --verify --quiet refs/heads/staging; then
    echo "⚠️  Staging branch already exists"
    read -p "Do you want to switch to it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout staging
    fi
else
    echo "📦 Creating staging branch..."
    git checkout -b staging
    git push -u origin staging
    echo "✅ Staging branch created and pushed"
fi

echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel Dashboard → Your Project → Settings → Git"
echo "2. Ensure 'staging' branch is configured for automatic deployments"
echo "3. Go to Settings → Environment Variables"
echo "4. Add/update variables for 'Preview' environment:"
echo "   - NEXTAUTH_URL=https://your-app-staging.vercel.app"
echo "   - DATABASE_URL=your-staging-database-url"
echo "   - NEXTAUTH_SECRET=your-staging-secret"
echo "   - SUPABASE_URL=your-staging-supabase-url"
echo "   - SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key"
echo ""
echo "5. Test by pushing to staging branch:"
echo "   git checkout staging"
echo "   git merge main  # or merge your feature branch"
echo "   git push origin staging"
echo ""
echo "✅ Staging environment setup complete!"

