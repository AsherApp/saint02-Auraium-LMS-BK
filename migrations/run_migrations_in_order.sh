#!/bin/bash

# =====================================================
# RUN MIGRATIONS IN CORRECT ORDER
# =====================================================
# This script runs all the migrations in the correct order
# to fix all the database issues

echo "🚀 Starting database migration process..."
echo ""

# Check if we're in the right directory
if [ ! -f "Endubackend/migrations/013_run_missing_discussions_tables.sql" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: Endubackend/migrations/013_run_missing_discussions_tables.sql"
    exit 1
fi

echo "📋 Migration order:"
echo "1. 013_run_missing_discussions_tables.sql - Creates core tables"
echo "2. 014_fix_table_name_mismatches.sql - Fixes name mismatches"
echo "3. 015_fix_student_id_migration.sql - Safely handles student_id migration"
echo "4. 011_fix_check_course_completion_function.sql - Fixes function"
echo "5. 012_create_missing_backend_tables.sql - Creates remaining tables"
echo "6. 009_comprehensive_schema_cleanup.sql - Final cleanup"
echo ""

# Function to run a migration
run_migration() {
    local migration_file=$1
    local description=$2
    
    echo "🔄 Running: $description"
    echo "   File: $migration_file"
    
    if [ ! -f "Endubackend/migrations/$migration_file" ]; then
        echo "❌ Error: Migration file not found: Endubackend/migrations/$migration_file"
        exit 1
    fi
    
    echo "   Executing migration..."
    # Note: You'll need to replace this with your actual database connection command
    # For example: psql -h localhost -U your_user -d your_database -f "Endubackend/migrations/$migration_file"
    echo "   ⚠️  Please run this command manually:"
    echo "   psql -h localhost -U your_user -d your_database -f \"Endubackend/migrations/$migration_file\""
    echo ""
}

# Run migrations in order
run_migration "013_run_missing_discussions_tables.sql" "Create core tables (course_completions, quiz_attempts, etc.)"
run_migration "014_fix_table_name_mismatches.sql" "Fix table name mismatches (student_notes, live_attendance_settings)"
run_migration "015_fix_student_id_migration.sql" "Safely add student_id columns and migrate data"
run_migration "011_fix_check_course_completion_function.sql" "Fix check_course_completion function"
run_migration "012_create_missing_backend_tables.sql" "Create remaining backend tables"
run_migration "009_comprehensive_schema_cleanup.sql" "Final cleanup and optimization"

echo "✅ Migration process complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run each migration manually using your database connection"
echo "2. Check for any errors and resolve them"
echo "3. Test your application to ensure everything works"
echo ""
echo "🔧 If you encounter errors:"
echo "- Check that all previous migrations have been run"
echo "- Verify your database connection settings"
echo "- Check the migration files for any syntax errors"
echo ""
echo "📚 Migration files are located in: Endubackend/migrations/"
