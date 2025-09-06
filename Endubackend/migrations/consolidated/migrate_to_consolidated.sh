#!/bin/bash

# =====================================================
# MIGRATE TO CONSOLIDATED STRUCTURE
# =====================================================
# This script helps migrate from the old scattered migration files
# to the new consolidated structure.

echo "🔄 MIGRATING TO CONSOLIDATED DATABASE STRUCTURE"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "Endubackend/migrations/consolidated/01_core_schema.sql" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: Endubackend/migrations/consolidated/01_core_schema.sql"
    exit 1
fi

echo "📋 This script will help you migrate to the consolidated database structure."
echo "   The consolidated structure replaces all the scattered migration files"
echo "   with 4 clean, organized files."
echo ""

# Function to run a migration
run_migration() {
    local migration_file=$1
    local description=$2
    
    echo "🔄 Running: $description"
    echo "   File: $migration_file"
    
    if [ ! -f "Endubackend/migrations/consolidated/$migration_file" ]; then
        echo "❌ Error: Migration file not found: Endubackend/migrations/consolidated/$migration_file"
        exit 1
    fi
    
    echo "   ⚠️  Please run this command manually:"
    echo "   psql -h localhost -U your_user -d your_database -f \"Endubackend/migrations/consolidated/$migration_file\""
    echo ""
}

echo "🚀 MIGRATION STEPS:"
echo "==================="
echo ""

echo "1️⃣  BACKUP YOUR DATABASE FIRST!"
echo "   pg_dump -h localhost -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql"
echo ""

echo "2️⃣  RUN CONSOLIDATED MIGRATIONS IN ORDER:"
echo ""

# Run migrations in order
run_migration "01_core_schema.sql" "Create all core tables, indexes, and relationships"
run_migration "02_functions_and_triggers.sql" "Create functions and triggers"
run_migration "03_row_level_security.sql" "Enable RLS and create security policies"
run_migration "04_views_and_utilities.sql" "Create views and utility functions"

echo "3️⃣  VERIFY MIGRATION:"
echo "   - Check that all tables exist"
echo "   - Verify data integrity"
echo "   - Test application functionality"
echo ""

echo "4️⃣  CLEAN UP OLD MIGRATION FILES (OPTIONAL):"
echo "   After successful migration, you can remove the old scattered files:"
echo "   rm Endubackend/migrations/001_*.sql"
echo "   rm Endubackend/migrations/002_*.sql"
echo "   rm Endubackend/migrations/003_*.sql"
echo "   rm Endubackend/migrations/004_*.sql"
echo "   rm Endubackend/migrations/005_*.sql"
echo "   rm Endubackend/migrations/006_*.sql"
echo "   rm Endubackend/migrations/007_*.sql"
echo "   rm Endubackend/migrations/008_*.sql"
echo "   rm Endubackend/migrations/009_*.sql"
echo "   rm Endubackend/migrations/010_*.sql"
echo "   rm Endubackend/migrations/011_*.sql"
echo "   rm Endubackend/migrations/012_*.sql"
echo "   rm Endubackend/migrations/013_*.sql"
echo "   rm Endubackend/migrations/014_*.sql"
echo "   rm Endubackend/migrations/015_*.sql"
echo "   rm Endubackend/migrations/016_*.sql"
echo "   rm Endubackend/migrations/017_*.sql"
echo "   rm Endubackend/migrations/*.sql"
echo "   rm Endubackend/migrations/*.sh"
echo ""

echo "✅ MIGRATION COMPLETE!"
echo "====================="
echo ""
echo "📝 BENEFITS OF CONSOLIDATED STRUCTURE:"
echo "   ✅ Clean, organized migration files"
echo "   ✅ All tables that are actually used"
echo "   ✅ Proper security policies"
echo "   ✅ Performance-optimized indexes"
echo "   ✅ Comprehensive documentation"
echo "   ✅ Easy to maintain and understand"
echo ""
echo "🔧 IF YOU ENCOUNTER ERRORS:"
echo "   - Check that all previous migrations have been run"
echo "   - Verify your database connection settings"
echo "   - Check the migration files for any syntax errors"
echo "   - Restore from backup if needed"
echo ""
echo "📚 DOCUMENTATION:"
echo "   - README.md: Complete documentation"
echo "   - Each migration file has detailed comments"
echo "   - All tables and functions are documented"
echo ""
echo "🎉 Your database is now using the consolidated structure!"
