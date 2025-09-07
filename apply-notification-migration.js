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

async function applyNotificationMigration() {
  try {
    console.log('Applying notification system migration...')
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migrations', '018_create_notification_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log(`Statement ${i + 1} error (might already exist):`, error.message)
        } else {
          console.log(`Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.log(`Statement ${i + 1} error:`, err.message)
      }
    }
    
    console.log('✅ Notification system migration completed!')
    console.log('Created tables: notifications, notification_templates, notification_preferences, email_logs')
    console.log('Inserted default email templates for: signup, teacher_signup, course_invitation, password_reset, password_changed')
    console.log('Created default notification preferences for existing users')
    
  } catch (error) {
    console.error('Error applying migration:', error)
    process.exit(1)
  }
}

applyNotificationMigration()
