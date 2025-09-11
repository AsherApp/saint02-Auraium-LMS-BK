import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSubmissionsSchema() {
  console.log('=== CHECKING SUBMISSIONS TABLE SCHEMA ===\n')
  
  try {
    // Let's try to get the schema information by attempting different column names
    const testColumns = [
      'id', 'assignment_id', 'student_id', 'submitted_at', 'file_url', 'content',
      'submission_id', 'student_email', 'assignment', 'files', 'answer', 'response',
      'status', 'grade', 'feedback', 'created_at', 'updated_at'
    ]
    
    console.log('Testing which columns exist in submissions table...')
    
    for (const column of testColumns) {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select(column)
          .limit(1)
        
        if (error) {
          console.log(`❌ Column '${column}' does not exist: ${error.message}`)
        } else {
          console.log(`✅ Column '${column}' exists`)
        }
      } catch (err) {
        console.log(`❌ Column '${column}' error: ${err.message}`)
      }
    }
    
    // Let's also try to get all columns by selecting *
    console.log('\n=== ATTEMPTING TO GET ALL COLUMNS ===')
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .limit(1)
      
      if (error) {
        console.log('Error getting all columns:', error.message)
      } else {
        console.log('✅ Successfully queried all columns')
        if (data && data.length > 0) {
          console.log('Available columns:', Object.keys(data[0]))
        } else {
          console.log('Table is empty, but structure is accessible')
        }
      }
    } catch (err) {
      console.log('Error:', err.message)
    }
    
    // Let's try to insert with minimal data to see what's required
    console.log('\n=== TESTING MINIMAL SUBMISSION INSERT ===')
    
    const minimalSubmission = {
      assignment_id: '8c0032a6-c69a-4b6a-84d0-99edca559af6'
    }
    
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert(minimalSubmission)
        .select()
      
      if (error) {
        console.log('❌ Minimal submission failed:', error.message)
        console.log('This tells us what the required columns are')
      } else {
        console.log('✅ Minimal submission succeeded!')
        console.log('Result:', data)
      }
    } catch (err) {
      console.log('❌ Exception:', err.message)
    }
    
  } catch (error) {
    console.error('Error checking submissions schema:', error)
  }
}

checkSubmissionsSchema()