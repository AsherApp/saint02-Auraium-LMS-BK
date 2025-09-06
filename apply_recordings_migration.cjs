const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    const migrationSQL = fs.readFileSync('./migrations/006_create_recordings_table.sql', 'utf8');
    
    console.log('Applying recordings table migration...');
    const { data, error } = await supabase.rpc('sql', { query: migrationSQL });
    
    if (error) {
      console.error('Migration error:', error);
    } else {
      console.log('Migration applied successfully!');
    }
  } catch (err) {
    console.error('Error applying migration:', err);
  }
}

applyMigration();
