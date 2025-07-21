#!/bin/bash

# Neon PostgreSQL Import Script
# This script helps import your database dump to Neon PostgreSQL
# Usage: ./import_to_neon.sh "your_neon_connection_string" [dump_file]

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if connection string is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Neon connection string is required${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 'postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require' [dump_file]"
    echo ""
    echo -e "${BLUE}💡 Get your connection string from:${NC}"
    echo "  https://console.neon.tech/app/projects -> Your Project -> Connect"
    echo ""
    echo -e "${YELLOW}Example:${NC}"
    echo "  $0 'postgresql://user:pass@ep-xxx.us-east-1.neon.tech/biwi_db?sslmode=require'"
    echo "  $0 'postgresql://user:pass@ep-xxx.us-east-1.neon.tech/biwi_db?sslmode=require' ./database_dumps/biwi_full_20240121_143022.sql"
    exit 1
fi

NEON_CONNECTION_STRING="$1"
DUMP_FILE="$2"

echo -e "${BLUE}🚀 Neon PostgreSQL Import Tool${NC}"
echo -e "${BLUE}===============================${NC}"
echo ""

# If no dump file specified, show available dumps
if [ -z "$DUMP_FILE" ]; then
    echo -e "${YELLOW}📁 Available database dumps:${NC}"
    echo "================================"
    
    if [ -d "./database_dumps" ]; then
        ls -la ./database_dumps/*.sql ./database_dumps/*.dump 2>/dev/null | while read -r line; do
            echo "  $line"
        done
        echo ""
        echo -e "${YELLOW}💡 Please specify a dump file:${NC}"
        echo "  $0 '$NEON_CONNECTION_STRING' ./database_dumps/your_dump_file.sql"
    else
        echo -e "${RED}❌ No database_dumps directory found${NC}"
        echo -e "${YELLOW}💡 Run ./create_db_dump.sh first to create a dump${NC}"
    fi
    exit 1
fi

# Check if dump file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}❌ Error: Dump file '$DUMP_FILE' not found${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Import Details:${NC}"
echo "================================"
echo "Target: Neon PostgreSQL"
echo "Dump file: $DUMP_FILE"
echo "File size: $(du -h "$DUMP_FILE" | cut -f1)"
echo ""

# Test connection first
echo -e "${YELLOW}🔌 Testing Neon connection...${NC}"
if psql "$NEON_CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection to Neon successful${NC}"
else
    echo -e "${RED}❌ Failed to connect to Neon database${NC}"
    echo -e "${YELLOW}💡 Please check your connection string and ensure:${NC}"
    echo "  • Your IP is allowlisted in Neon (if IP restrictions are enabled)"
    echo "  • The database exists"
    echo "  • Credentials are correct"
    exit 1
fi

# Get PostgreSQL version from Neon
NEON_VERSION=$(psql "$NEON_CONNECTION_STRING" -t -c "SELECT version();" | head -1 | xargs)
echo -e "${BLUE}📋 Neon PostgreSQL Version:${NC} $NEON_VERSION"
echo ""

# Check if this is a custom format dump
if [[ "$DUMP_FILE" == *.dump ]]; then
    echo -e "${YELLOW}🔧 Detected custom format dump${NC}"
    echo -e "${YELLOW}📥 Importing using pg_restore...${NC}"
    
    # Use pg_restore for custom format
    pg_restore \
        --dbname="$NEON_CONNECTION_STRING" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --verbose \
        "$DUMP_FILE"
        
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Custom format dump imported successfully!${NC}"
    else
        echo -e "${RED}❌ Import failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}📥 Importing SQL dump...${NC}"
    
    # Import SQL dump
    psql "$NEON_CONNECTION_STRING" -f "$DUMP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ SQL dump imported successfully!${NC}"
    else
        echo -e "${RED}❌ Import failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}🔍 Verifying import...${NC}"

# Get table count and basic stats
TABLE_COUNT=$(psql "$NEON_CONNECTION_STRING" -t -c "
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
" | xargs)

echo -e "${GREEN}✅ Tables imported: $TABLE_COUNT${NC}"

# Show table list with row counts
echo ""
echo -e "${YELLOW}📊 Imported Tables Summary:${NC}"
echo "================================"

psql "$NEON_CONNECTION_STRING" -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10;
"

echo ""
echo -e "${GREEN}🎉 Database import to Neon completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "================================"
echo "1. Update your application's DATABASE_URL to point to Neon"
echo "2. Test your application connectivity"
echo "3. Run any post-import scripts if needed"
echo "4. Consider setting up automated backups in Neon"
echo ""
echo -e "${BLUE}💡 Neon Dashboard:${NC} https://console.neon.tech/app/projects"
echo -e "${GREEN}✨ Your Biwi ERP is now running on Neon PostgreSQL! ✨${NC}"
