#!/bin/bash

# Database Preparation Script for Neon Export
# This script prepares your database for production by cleaning up test data,
# optimizing performance, and ensuring data integrity
# Usage: ./prepare_db_for_neon.sh [cleanup_level]
# cleanup_level: minimal, standard, aggressive

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CLEANUP_LEVEL=${1:-"standard"}
DB_CONTAINER="Biwi_db"
DB_USER="Biwi_user"
DB_PASSWORD="Biwi_password"
DB_NAME="Biwi_db"

echo -e "${BLUE}🛠️  Database Preparation for Neon Export${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "Cleanup level: ${CLEANUP_LEVEL}"
echo ""

# Check if database container is running
echo -e "${YELLOW}🔍 Checking database container status...${NC}"
if ! docker ps --filter name=$DB_CONTAINER --format "table {{.Names}}" | grep -q $DB_CONTAINER; then
    echo -e "${RED}❌ Database container '$DB_CONTAINER' is not running.${NC}"
    echo -e "   Please start it with: ${YELLOW}docker-compose up -d db${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Database container is running${NC}"

# Function to run SQL commands
run_sql() {
    local sql="$1"
    local description="$2"
    
    echo -e "${YELLOW}📝 $description${NC}"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "$sql"
}

# Function to backup before cleanup
create_pre_cleanup_backup() {
    echo -e "${YELLOW}💾 Creating pre-cleanup backup...${NC}"
    local backup_file="./database_dumps/pre_cleanup_backup_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p ./database_dumps
    
    docker exec $DB_CONTAINER pg_dump \
        -U $DB_USER \
        -d $DB_NAME \
        --no-owner \
        --no-privileges \
        > "$backup_file"
    
    echo -e "${GREEN}✅ Pre-cleanup backup created: $backup_file${NC}"
}

# Function to analyze database
analyze_database() {
    echo -e "${YELLOW}📊 Analyzing database structure and content...${NC}"
    
    # Table sizes
    echo -e "\n${BLUE}📋 Table Sizes:${NC}"
    run_sql "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_stat_get_tuples_inserted(c.oid) as total_rows
        FROM pg_tables pt
        JOIN pg_class c ON c.relname = pt.tablename
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    " "Getting table sizes"
    
    # Check for test data patterns
    echo -e "\n${BLUE}🔍 Checking for test data patterns:${NC}"
    
    # Check for users with test-like emails
    run_sql "
        SELECT COUNT(*) as test_users 
        FROM users 
        WHERE email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%demo%';
    " "Counting test users"
    
    # Check for companies with test names
    run_sql "
        SELECT COUNT(*) as test_companies 
        FROM companies 
        WHERE name LIKE '%test%' OR name LIKE '%demo%' OR name LIKE '%sample%';
    " "Counting test companies"
}

# Function for minimal cleanup
minimal_cleanup() {
    echo -e "${YELLOW}🧹 Performing minimal cleanup...${NC}"
    
    # Remove obvious test users
    run_sql "
        DELETE FROM users 
        WHERE email IN ('test@test.com', 'admin@test.com', 'demo@demo.com')
        AND email != 'admin@platform.local';
    " "Removing obvious test users"
    
    # Clean up platform audit logs older than 30 days
    run_sql "
        DELETE FROM platform_audit_logs 
        WHERE created_at < NOW() - INTERVAL '30 days';
    " "Cleaning old audit logs"
}

# Function for standard cleanup
standard_cleanup() {
    echo -e "${YELLOW}🧹 Performing standard cleanup...${NC}"
    
    minimal_cleanup
    
    # Remove test companies (but keep system/platform company)
    run_sql "
        DELETE FROM companies 
        WHERE (name LIKE '%test%' OR name LIKE '%demo%' OR name LIKE '%sample%')
        AND name != 'Vinea Corp Default'
        AND id NOT IN (
            SELECT DISTINCT company_id 
            FROM users 
            WHERE user_type = 'platform_admin'
        );
    " "Removing test companies"
    
    # Remove orphaned records
    run_sql "
        DELETE FROM user_roles 
        WHERE user_id NOT IN (SELECT id FROM users)
        OR role_id NOT IN (SELECT id FROM roles);
    " "Removing orphaned user roles"
    
    # Clean up old sessions or temporary data
    run_sql "
        DELETE FROM platform_audit_logs 
        WHERE action_type = 'login' 
        AND created_at < NOW() - INTERVAL '7 days';
    " "Cleaning old login audit logs"
}

# Function for aggressive cleanup
aggressive_cleanup() {
    echo -e "${YELLOW}🧹 Performing aggressive cleanup...${NC}"
    
    standard_cleanup
    
    # Remove all test/demo data
    run_sql "
        DELETE FROM users 
        WHERE email LIKE '%test%' 
        OR email LIKE '%demo%' 
        OR email LIKE '%example%'
        OR email LIKE '%localhost%'
        AND user_type != 'platform_admin';
    " "Removing all test users"
    
    # Reset sequences to optimize space
    echo -e "${YELLOW}🔄 Resetting sequences...${NC}"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
        SELECT 'SELECT SETVAL(' ||
               quote_literal(quote_ident(PGT.schemaname)||'.'||quote_ident(S.relname)) ||
               ', COALESCE(MAX(' ||quote_ident(C.attname)|| '), 1) ) FROM ' ||
               quote_ident(PGT.schemaname)||'.'||quote_ident(T.relname)|| ';'
        FROM pg_class AS S,
             pg_depend AS D,
             pg_class AS T,
             pg_attribute AS C,
             pg_tables AS PGT
        WHERE S.relkind = 'S'
            AND S.oid = D.objid
            AND D.refobjid = T.oid
            AND D.refobjid = C.attrelid
            AND D.refobjsubid = C.attnum
            AND T.relname = PGT.tablename
        ORDER BY S.relname;
    "
}

# Function to optimize database
optimize_database() {
    echo -e "${YELLOW}⚡ Optimizing database for production...${NC}"
    
    # Update statistics
    run_sql "ANALYZE;" "Updating table statistics"
    
    # Vacuum to reclaim space
    echo -e "${YELLOW}🧽 Vacuuming database...${NC}"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "VACUUM FULL;"
    
    # Reindex for better performance
    echo -e "${YELLOW}📇 Reindexing database...${NC}"
    docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "REINDEX DATABASE $DB_NAME;"
}

# Function to validate data integrity
validate_integrity() {
    echo -e "${YELLOW}🔍 Validating data integrity...${NC}"
    
    # Check for orphaned foreign keys
    echo -e "\n${BLUE}🔗 Checking foreign key integrity:${NC}"
    
    # Check users -> companies
    run_sql "
        SELECT COUNT(*) as orphaned_users
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE c.id IS NULL AND u.user_type != 'platform_admin';
    " "Checking user-company relationships"
    
    # Check roles -> companies
    run_sql "
        SELECT COUNT(*) as orphaned_roles
        FROM roles r
        LEFT JOIN companies c ON r.company_id = c.id
        WHERE c.id IS NULL;
    " "Checking role-company relationships"
    
    # Ensure platform admin exists
    run_sql "
        SELECT COUNT(*) as platform_admins
        FROM users
        WHERE user_type = 'platform_admin';
    " "Verifying platform admin exists"
}

# Function to create production-ready indexes
create_production_indexes() {
    echo -e "${YELLOW}📇 Creating production-ready indexes...${NC}"
    
    # Commonly queried fields
    run_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
        ON users(email) WHERE is_active = true;
    " "Creating user email index"
    
    run_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_company_active 
        ON users(company_id) WHERE is_active = true;
    " "Creating user company index"
    
    run_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_company_date 
        ON platform_audit_logs(company_id, created_at);
    " "Creating audit log index"
}

# Main execution
echo -e "${YELLOW}⚠️  This will modify your database. Continue? (y/N)${NC}"
read -r confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation cancelled${NC}"
    exit 0
fi

# Create backup first
create_pre_cleanup_backup

# Analyze current state
analyze_database

# Perform cleanup based on level
case $CLEANUP_LEVEL in
    "minimal")
        minimal_cleanup
        ;;
    "aggressive")
        aggressive_cleanup
        ;;
    "standard"|*)
        standard_cleanup
        ;;
esac

# Always do these optimizations
validate_integrity
create_production_indexes
optimize_database

# Final analysis
echo -e "\n${GREEN}✅ Database preparation completed!${NC}"
echo ""
echo -e "${YELLOW}📊 Final Database Statistics:${NC}"
analyze_database

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "================================"
echo "1. Review the cleanup results above"
echo "2. Test your application to ensure everything works"
echo "3. Create a final dump: ./create_db_dump.sh full"
echo "4. Import to Neon: ./import_to_neon.sh 'your_neon_connection'"
echo ""
echo -e "${GREEN}🎉 Your database is now ready for production on Neon!${NC}"
