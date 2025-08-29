import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function applyInviteFix() {
  try {
    console.log('Applying invite system fixes...')
    
    // Add missing columns to invites table
    console.log('Adding created_by column...')
    let { error } = await supabase.rpc('sql', { 
      query: 'ALTER TABLE invites ADD COLUMN IF NOT EXISTS created_by text REFERENCES teachers(email) ON DELETE CASCADE;' 
    })
    if (error) console.log('created_by column error (might already exist):', error.message)
    
    console.log('Adding expires_at column...')
    error = await supabase.rpc('sql', { 
      query: 'ALTER TABLE invites ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval \'7 days\');' 
    })
    if (error) console.log('expires_at column error (might already exist):', error.message)
    
    console.log('Updating existing invites...')
    error = await supabase.rpc('sql', { 
      query: `UPDATE invites 
              SET 
                created_by = COALESCE(created_by, 'teacher@school.edu'),
                expires_at = COALESCE(expires_at, created_at + interval '7 days')
              WHERE created_by IS NULL OR expires_at IS NULL;` 
    })
    if (error) console.log('Update error:', error.message)
    
    console.log('Making created_by required...')
    error = await supabase.rpc('sql', { 
      query: 'ALTER TABLE invites ALTER COLUMN created_by SET NOT NULL;' 
    })
    if (error) console.log('Required constraint error:', error.message)
    
    console.log('Creating indexes...')
    error = await supabase.rpc('sql', { 
      query: 'CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);' 
    })
    if (error) console.log('Index creation error:', error.message)
    
    console.log('Invite system fixes completed!')
  } catch (error) {
    console.error('Error applying invite fixes:', error)
    process.exit(1)
  }
}

applyInviteFix()
