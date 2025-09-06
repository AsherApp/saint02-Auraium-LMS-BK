const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Creating recordings table...');
    
    // Create recordings table
    const { data: recordingsTable, error: recordingsError } = await supabase
      .from('recordings')
      .select('id')
      .limit(1);
    
    if (recordingsError && recordingsError.code === 'PGRST116') {
      console.log('Recordings table does not exist, creating...');
      // Table doesn't exist, we need to create it manually
      console.log('Please run the following SQL in your Supabase dashboard:');
      console.log(`
CREATE TABLE IF NOT EXISTS recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    session_id TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_email TEXT NOT NULL,
    teacher_name TEXT,
    duration INTEGER DEFAULT 0,
    file_size BIGINT DEFAULT 0,
    file_url TEXT,
    thumbnail_url TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    view_count INTEGER DEFAULT 0,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    quality TEXT DEFAULT 'medium',
    format TEXT DEFAULT 'mp4'
);
      `);
    } else if (recordingsError) {
      console.error('Error checking recordings table:', recordingsError);
    } else {
      console.log('Recordings table already exists');
    }

    // Check live_sessions table
    const { data: liveSessionsTable, error: liveSessionsError } = await supabase
      .from('live_sessions')
      .select('id')
      .limit(1);
    
    if (liveSessionsError && liveSessionsError.code === 'PGRST116') {
      console.log('Live sessions table does not exist, creating...');
      console.log('Please run the following SQL in your Supabase dashboard:');
      console.log(`
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_email TEXT NOT NULL,
    teacher_name TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
    max_participants INTEGER,
    recording_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
      `);
    } else if (liveSessionsError) {
      console.error('Error checking live_sessions table:', liveSessionsError);
    } else {
      console.log('Live sessions table already exists');
    }

  } catch (err) {
    console.error('Error applying migration:', err);
  }
}

applyMigration();
