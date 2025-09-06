#!/bin/bash

echo "🚀 Running Settings Migration..."
echo "This will create the missing teacher_settings and student_settings tables"

# Check if we're in the right directory
if [ ! -f "Endubackend/migrations/002_create_settings_tables.sql" ]; then
    echo "❌ Error: Migration file not found!"
    echo "Make sure you're in the project root directory"
    exit 1
fi

echo "📋 Migration file found: Endubackend/migrations/002_create_settings_tables.sql"
echo ""
echo "📝 To apply this migration:"
echo "1. Copy the SQL content from the migration file"
echo "2. Go to your Supabase dashboard"
echo "3. Navigate to SQL Editor"
echo "4. Paste and run the SQL"
echo ""
echo "🔗 Or run this command in your Supabase SQL Editor:"
echo "cat Endubackend/migrations/002_create_settings_tables.sql"
echo ""
echo "✅ After running the migration, restart your backend server"
echo "   The settings pages should now work properly!"
