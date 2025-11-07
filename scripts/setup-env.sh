#!/bin/bash

# Setup script for RenoTrack
# This script helps set up environment variables

echo "RenoTrack Environment Setup"
echo "============================"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to overwrite it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Generate NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env file
cat > .env << EOF
# Database
# For local development with SQLite: file:./dev.db
# For production with Supabase: postgresql://user:password@host:port/database?sslmode=require
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Node Environment
NODE_ENV="development"
EOF

echo "✅ .env file created successfully!"
echo ""
echo "Next steps:"
echo "1. Update DATABASE_URL if using PostgreSQL/Supabase"
echo "2. Update NEXTAUTH_URL for production deployment"
echo "3. Run: npm install"
echo "4. Run: npm run db:generate"
echo "5. Run: npm run db:push"
echo "6. Run: npm run dev"

