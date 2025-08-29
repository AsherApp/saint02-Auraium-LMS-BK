const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://xyz.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runForumMigration() {
  try {
    console.log('Starting forum migration...')

    // Create forum_categories table
    console.log('Creating forum_categories table...')
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS forum_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (categoriesError) {
      console.error('Error creating forum_categories:', categoriesError)
      return
    }

    // Create forum_posts table
    console.log('Creating forum_posts table...')
    const { error: postsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS forum_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          author_email VARCHAR(255) NOT NULL,
          is_pinned BOOLEAN DEFAULT false,
          is_locked BOOLEAN DEFAULT false,
          view_count INTEGER DEFAULT 0,
          last_reply_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (postsError) {
      console.error('Error creating forum_posts:', postsError)
      return
    }

    // Create forum_replies table
    console.log('Creating forum_replies table...')
    const { error: repliesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS forum_replies (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          author_email VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (repliesError) {
      console.error('Error creating forum_replies:', repliesError)
      return
    }

    // Insert default categories
    console.log('Inserting default categories...')
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO forum_categories (name, description, created_by) VALUES
          ('General Discussion', 'General topics and discussions', 'system'),
          ('Course Help', 'Questions and help related to courses', 'system'),
          ('Technical Support', 'Technical issues and support', 'system'),
          ('Announcements', 'Important announcements and updates', 'system'),
          ('Student Life', 'Student-related discussions and activities', 'system')
        ON CONFLICT (name) DO NOTHING;
      `
    })

    if (insertError) {
      console.error('Error inserting default categories:', insertError)
      return
    }

    console.log('Forum migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runForumMigration()
