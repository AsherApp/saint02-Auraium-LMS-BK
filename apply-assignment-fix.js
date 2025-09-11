import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyAssignmentFix() {
  console.log('=== APPLYING ASSIGNMENT SYSTEM FIX ===\n')
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync('fix-assignment-system.sql', 'utf8')
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute\n`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        console.log(`SQL: ${statement.substring(0, 100)}...`)
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error)
            // Continue with next statement
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.error(`Exception in statement ${i + 1}:`, err.message)
          // Continue with next statement
        }
        console.log('')
      }
    }
    
    console.log('=== MIGRATION COMPLETE ===')
    
    // Test the new structure
    console.log('\n=== TESTING NEW STRUCTURE ===')
    
    // Check if grades table exists
    const { data: gradesTest, error: gradesError } = await supabase
      .from('grades')
      .select('*')
      .limit(1)
    
    if (gradesError) {
      console.log('❌ Grades table not accessible:', gradesError.message)
    } else {
      console.log('✅ Grades table is accessible')
    }
    
    // Check if triggers exist by testing submission
    console.log('\n=== TESTING TRIGGERS ===')
    console.log('Note: Triggers will be tested when we create a test submission')
    
  } catch (error) {
    console.error('Error applying assignment fix:', error)
  }
}

applyAssignmentFix()
