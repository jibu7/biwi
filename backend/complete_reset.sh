#!/bin/bash

# BIWI Database Complete Reset Script
# This script cleans the database and seeds essential master data

set -e

echo "=== BIWI Database Complete Reset Tool ==="
echo ""
echo "🚨 WARNING: This will permanently delete ALL business data!"
echo "After cleanup, essential master data will be seeded:"
echo "  • Units of Measure (24 common units)"
echo "  • Basic GL Account structure (if needed)"
echo ""
echo "User authentication information will be preserved."
echo ""

read -p "Do you want to proceed with complete reset? (type 'YES' to confirm): " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ Reset cancelled."
    exit 0
fi

echo ""
echo "🔄 Step 1: Cleaning database..."

# Run the cleanup
if docker ps | grep -q "Biwi_db"; then
    echo "Using Docker container..."
    docker exec -i Biwi_db psql -U Biwi_user -d Biwi_db < cleanup_database.sql
else
    echo "Docker container not found. Trying local PostgreSQL..."
    psql -h localhost -p 5432 -U Biwi_user -d Biwi_db < cleanup_database.sql
fi

echo ""
echo "🔄 Step 2: Seeding essential Units of Measure..."

# Seed units of measure
if docker ps | grep -q "Biwi_db"; then
    docker exec -i Biwi_db psql -U Biwi_user -d Biwi_db < seed_uom.sql
else
    psql -h localhost -p 5432 -U Biwi_user -d Biwi_db < seed_uom.sql
fi

echo ""
echo "✅ Complete reset finished successfully!"
echo ""
echo "📊 Your database now has:"
echo "  ✓ Clean business data (all transactions removed)"
echo "  ✓ User credentials preserved"
echo "  ✓ 24 essential units of measure available"
echo "  ✓ Ready for fresh testing"
echo ""
echo "🔗 You can now:"
echo "  • Create inventory items with proper units"
echo "  • Add customers, suppliers, etc."
echo "  • Set up your chart of accounts"
echo "  • Start testing your workflows"
echo ""
echo "Happy testing! 🚀"
