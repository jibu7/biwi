#!/bin/bash

# Database Dump Script for Neon PostgreSQL Export
# This script creates a comprehensive database dump that can be imported into Neon
# Usage: ./create_db_dump.sh [dump_type]
# dump_type options: full, schema_only, data_only

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default dump type
DUMP_TYPE=${1:-"full"}

# Database connection details from docker-compose
DB_CONTAINER="Biwi_db"
DB_USER="Biwi_user"
DB_PASSWORD="Biwi_password"
DB_NAME="Biwi_db"
DB_HOST="localhost"
DB_PORT="5432"

# Timestamp for backup files
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup directory
BACKUP_DIR="./database_dumps"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}🗄️  Biwi ERP Database Dump Creator${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Timestamp: ${TIMESTAMP}"
echo -e "Dump type: ${DUMP_TYPE}"
echo ""

# Check if database container is running
echo -e "${YELLOW}🔍 Checking database container status...${NC}"
if ! docker ps --filter name=$DB_CONTAINER --format "table {{.Names}}" | grep -q $DB_CONTAINER; then
    echo -e "${RED}❌ Database container '$DB_CONTAINER' is not running.${NC}"
    echo -e "   Please start it with: ${YELLOW}docker-compose up -d db${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database container is running${NC}"

# Function to create schema-only dump
create_schema_dump() {
    local output_file="$BACKUP_DIR/biwi_schema_${TIMESTAMP}.sql"
    echo -e "${YELLOW}📋 Creating schema-only dump...${NC}"
    
    docker exec $DB_CONTAINER pg_dump \
        -U $DB_USER \
        -d $DB_NAME \
        --schema-only \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$output_file"
    
    echo -e "${GREEN}✅ Schema dump created: ${output_file}${NC}"
    return 0
}

# Function to create data-only dump
create_data_dump() {
    local output_file="$BACKUP_DIR/biwi_data_${TIMESTAMP}.sql"
    echo -e "${YELLOW}📊 Creating data-only dump...${NC}"
    
    docker exec $DB_CONTAINER pg_dump \
        -U $DB_USER \
        -d $DB_NAME \
        --data-only \
        --no-owner \
        --no-privileges \
        --disable-triggers \
        --column-inserts \
        > "$output_file"
    
    echo -e "${GREEN}✅ Data dump created: ${output_file}${NC}"
    return 0
}

# Function to create full dump
create_full_dump() {
    local output_file="$BACKUP_DIR/biwi_full_${TIMESTAMP}.sql"
    echo -e "${YELLOW}🗃️  Creating full database dump...${NC}"
    
    docker exec $DB_CONTAINER pg_dump \
        -U $DB_USER \
        -d $DB_NAME \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --column-inserts \
        > "$output_file"
    
    echo -e "${GREEN}✅ Full dump created: ${output_file}${NC}"
    return 0
}

# Function to create custom format dump (for large databases)
create_custom_dump() {
    local output_file="$BACKUP_DIR/biwi_custom_${TIMESTAMP}.dump"
    echo -e "${YELLOW}🔧 Creating custom format dump (recommended for large databases)...${NC}"
    
    docker exec $DB_CONTAINER pg_dump \
        -U $DB_USER \
        -d $DB_NAME \
        --format=custom \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$output_file"
    
    echo -e "${GREEN}✅ Custom format dump created: ${output_file}${NC}"
    echo -e "${BLUE}💡 To restore this dump, use: pg_restore -d target_db ${output_file}${NC}"
    return 0
}

# Function to get database statistics
show_db_stats() {
    echo -e "${YELLOW}📊 Database Statistics:${NC}"
    echo "=================================="
    
    # Get table count and sizes
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_stat_get_tuples_inserted(c.oid) as inserts,
            pg_stat_get_tuples_updated(c.oid) as updates,
            pg_stat_get_tuples_deleted(c.oid) as deletes
        FROM pg_tables pt
        JOIN pg_class c ON c.relname = pt.tablename
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    "
    
    echo ""
    echo -e "${YELLOW}📈 Total Database Size:${NC}"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;
    "
}

# Main execution based on dump type
case $DUMP_TYPE in
    "schema_only"|"schema")
        show_db_stats
        create_schema_dump
        ;;
    "data_only"|"data")
        show_db_stats
        create_data_dump
        ;;
    "custom")
        show_db_stats
        create_custom_dump
        ;;
    "full"|*)
        show_db_stats
        create_full_dump
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Database dump completed successfully!${NC}"
echo -e "${BLUE}📁 Dumps are saved in: ${BACKUP_DIR}${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps for Neon Import:${NC}"
echo "=================================="
echo "1. Upload the dump file to your server or use it locally"
echo "2. Connect to your Neon database:"
echo "   psql 'postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require'"
echo "3. Import the dump:"
echo "   \\i /path/to/your/dump_file.sql"
echo ""
echo -e "${BLUE}💡 Pro Tips:${NC}"
echo "• For large databases, use the 'custom' format: ./create_db_dump.sh custom"
echo "• Test the import on a development Neon database first"
echo "• Make sure your Neon database has the same PostgreSQL version or newer"
echo ""
echo -e "${GREEN}✨ Happy migrating to Neon! ✨${NC}"
