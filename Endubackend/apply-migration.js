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

async function applyMigration() {
  try {
    console.log('Applying teacher authentication migration...')
    
    // Add missing columns to teachers table
    console.log('Adding first_name column...')
    let { error } = await supabase.rpc('sql', { 
      query: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS first_name text;' 
    })
    if (error) console.log('first_name column error (might already exist):', error.message)
    
    console.log('Adding last_name column...')
    error = await supabase.rpc('sql', { 
      query: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_name text;' 
    })
    if (error) console.log('last_name column error (might already exist):', error.message)
    
    console.log('Adding password_hash column...')
    error = await supabase.rpc('sql', { 
      query: 'ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password_hash text;' 
    })
    if (error) console.log('password_hash column error (might already exist):', error.message)
    
    console.log('Updating existing teachers...')
    error = await supabase.rpc('sql', { 
      query: `UPDATE teachers 
              SET first_name = COALESCE(first_name, 'Teacher'),
                  last_name = COALESCE(last_name, 'User')
              WHERE first_name IS NULL OR last_name IS NULL;` 
    })
    if (error) console.log('Update error:', error.message)
    
    console.log('Migration completed!')
  } catch (error) {
    console.error('Error applying migration:', error)
    process.exit(1)
  }
}

applyMigration()
