#!/bin/bash

# BIWI Database Complete Reset with Full Inventory Setup
# This script cleans the database and seeds all essential data for inventory management

set -e

echo "=== BIWI Database Complete Reset with Inventory Setup ==="
echo ""
echo "🚨 WARNING: This will permanently delete ALL business data!"
echo "After cleanup, the following will be seeded:"
echo "  • Units of Measure (24 common units)"
echo "  • GL Accounts (Inventory, COGS, Sales, Adjustments)"
echo "  • Inventory Transaction Types (8 types)"
echo "  • Default Warehouse"
echo "  • Inventory Configuration"
echo ""
echo "User authentication information will be preserved."
echo ""

read -p "Do you want to proceed with complete reset and setup? (type 'YES' to confirm): " confirm

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
echo "🔄 Step 2: Seeding Units of Measure..."

# Seed units of measure
if docker ps | grep -q "Biwi_db"; then
    docker exec -i Biwi_db psql -U Biwi_user -d Biwi_db < seed_uom.sql
else
    psql -h localhost -p 5432 -U Biwi_user -d Biwi_db < seed_uom.sql
fi

echo ""
echo "🔄 Step 3: Setting up Inventory System..."

# Seed inventory data (GL accounts, transaction types, warehouse, defaults)
if docker ps | grep -q "Biwi_db"; then
    docker exec -i Biwi_db psql -U Biwi_user -d Biwi_db < seed_inventory_data.sql
    docker exec -i Biwi_db psql -U Biwi_user -d Biwi_db < fix_inventory_defaults.sql
else
    psql -h localhost -p 5432 -U Biwi_user -d Biwi_db < seed_inventory_data.sql
    psql -h localhost -p 5432 -U Biwi_user -d Biwi_db < fix_inventory_defaults.sql
fi

echo ""
echo "✅ Complete reset and inventory setup finished successfully!"
echo ""
echo "📊 Your database now has:"
echo "  ✓ Clean business data (all transactions removed)"
echo "  ✓ User credentials preserved"
echo "  ✓ 24 essential units of measure"
echo "  ✓ 4 essential GL accounts (Inventory, COGS, Sales, Adjustments)"  
echo "  ✓ 8 inventory transaction types"
echo "  ✓ 1 default warehouse (Main Warehouse)"
echo "  ✓ Complete inventory system configuration"
echo ""
echo "🔗 You can now:"
echo "  • ✅ Create inventory items with proper units"
echo "  • ✅ Perform inventory adjustments with GL posting"
echo "  • ✅ Process stock increases/decreases"
echo "  • ✅ Track inventory movements with proper costing"
echo "  • ✅ Add customers, suppliers, etc."
echo ""
echo "🎯 Inventory Adjustment Process:"
echo "  1. Increase inventory quantity ✅"
echo "  2. Update weighted average cost ✅"  
echo "  3. Create GL entries: Debit Inventory, Credit Adjustment ✅"
echo ""
echo "Ready for testing! 🚀"
