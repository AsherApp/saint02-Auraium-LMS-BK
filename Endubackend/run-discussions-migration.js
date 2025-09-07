import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting discussions schema migration...');
  
  try {
    // Migration 1: Fix discussions table schema
    console.log('📋 Step 1: Adding missing columns to discussions table...');
    
    const migration1 = `
      -- Add missing columns to discussions table
      ALTER TABLE discussions 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS allow_student_posts BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE;
    `;
    
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    if (error1) {
      console.error('❌ Error in migration 1:', error1);
    } else {
      console.log('✅ Step 1 completed: Added missing columns to discussions table');
    }
    
    // Migration 2: Fix discussion_posts table schema
    console.log('📋 Step 2: Adding missing columns to discussion_posts table...');
    
    const migration2 = `
      -- Add missing columns to discussion_posts table
      ALTER TABLE discussion_posts 
      ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'student',
      ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
    `;
    
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    if (error2) {
      console.error('❌ Error in migration 2:', error2);
    } else {
      console.log('✅ Step 2 completed: Added missing columns to discussion_posts table');
    }
    
    // Migration 3: Update existing records
    console.log('📋 Step 3: Updating existing records with default values...');
    
    const { error: error3 } = await supabase
      .from('discussions')
      .update({
        description: '',
        allow_student_posts: true,
        require_approval: false,
        is_active: true
      })
      .is('description', null);
    
    if (error3) {
      console.error('❌ Error in migration 3:', error3);
    } else {
      console.log('✅ Step 3 completed: Updated existing discussions records');
    }
    
    // Migration 4: Create forum_categories table
    console.log('📋 Step 4: Creating forum_categories table...');
    
    const migration4 = `
      -- Create forum_categories table if it doesn't exist
      CREATE TABLE IF NOT EXISTS forum_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: error4 } = await supabase.rpc('exec_sql', { sql: migration4 });
    if (error4) {
      console.error('❌ Error in migration 4:', error4);
    } else {
      console.log('✅ Step 4 completed: Created forum_categories table');
    }
    
    // Migration 5: Insert default forum categories
    console.log('📋 Step 5: Inserting default forum categories...');
    
    const defaultCategories = [
      { name: 'General Discussion', description: 'General topics and discussions about the course', created_by: 'system' },
      { name: 'Course Help', description: 'Questions and help related to course content', created_by: 'system' },
      { name: 'Technical Support', description: 'Technical issues and support requests', created_by: 'system' },
      { name: 'Announcements', description: 'Important announcements and updates', created_by: 'system' },
      { name: 'Student Life', description: 'Student-related discussions and activities', created_by: 'system' }
    ];
    
    for (const category of defaultCategories) {
      const { error: insertError } = await supabase
        .from('forum_categories')
        .upsert(category, { onConflict: 'name' });
      
      if (insertError) {
        console.error(`❌ Error inserting category ${category.name}:`, insertError);
      }
    }
    
    console.log('✅ Step 5 completed: Inserted default forum categories');
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('  - Added missing columns to discussions table');
    console.log('  - Added missing columns to discussion_posts table');
    console.log('  - Updated existing records with default values');
    console.log('  - Created forum_categories table');
    console.log('  - Inserted default forum categories');
    console.log('');
    console.log('✅ Discussions and forum functionality should now work properly!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
