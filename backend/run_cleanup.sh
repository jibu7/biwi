#!/bin/bash

# BIWI Database Cleanup Script
# This script provides multiple options to clean your database

set -e

echo "=== BIWI Database Cleanup Tool ==="
echo ""
echo "🚨 WARNING: This will permanently delete ALL business data!"
echo "Only user authentication information will be preserved."
echo ""
echo "Choose cleanup method:"
echo "1) Use Python script (recommended - with safety checks)"
echo "2) Use SQL script (direct SQL execution)"
echo "3) Manual Docker exec (for troubleshooting)"
echo "4) Cancel"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔄 Running Python cleanup script..."
        cd /home/ubuntu24/proj/biwi/backend
        python clean_database.py
        ;;
    2)
        echo ""
        echo "🚨 FINAL WARNING: This will immediately delete all business data!"
        read -p "Type 'YES' to confirm: " confirm
        if [ "$confirm" = "YES" ]; then
            echo "🔄 Running SQL cleanup script..."
            
            # Check if docker container is running
            if docker ps | grep -q "Biwi_db"; then
                echo "Using Docker container..."
                docker exec -i Biwi_db psql -U Biwi_user -d Biwi_db < cleanup_database.sql
            else
                echo "Docker container not found. Trying local PostgreSQL..."
                psql -h localhost -p 5432 -U Biwi_user -d Biwi_db < cleanup_database.sql
            fi
            echo "✅ Cleanup completed!"
        else
            echo "❌ Cleanup cancelled."
        fi
        ;;
    3)
        echo ""
        echo "Manual Docker exec commands:"
        echo ""
        echo "1) First, connect to the database container:"
        echo "   docker exec -it Biwi_db psql -U Biwi_user -d Biwi_db"
        echo ""
        echo "2) Then run this command to execute the cleanup:"
        echo "   \\i /app/cleanup_database.sql"
        echo ""
        echo "Or copy/paste the SQL commands from cleanup_database.sql"
        echo ""
        ;;
    4|*)
        echo "❌ Cleanup cancelled."
        exit 0
        ;;
esac
