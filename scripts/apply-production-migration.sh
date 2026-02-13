#!/bin/bash

# Script to apply migrations to production database
# This uses the DATABASE_URL from .env.production

echo "🔄 Applying migrations to production database..."
echo ""
echo "⚠️  WARNING: This will modify your production database!"
echo "   Make sure you have a backup before proceeding."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Load production environment
    export $(cat .env.production | grep DATABASE_URL | xargs)

    # Apply migrations
    npx prisma migrate deploy

    echo ""
    echo "✅ Migrations applied successfully!"
    echo ""
    echo "📊 To verify, you can run:"
    echo "   npx prisma studio --browser none"
else
    echo "❌ Cancelled"
fi
