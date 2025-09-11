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

async function checkCourseCompletionsSchema() {
  console.log('=== CHECKING COURSE_COMPLETIONS TABLE SCHEMA ===\n')
  
  try {
    // Check what columns exist in course_completions table
    const testColumns = [
      'id', 'student_id', 'course_id', 'completion_percentage', 'completed_at', 
      'status', 'created_at', 'updated_at', 'progress', 'grade_percentage'
    ]
    
    console.log('Testing which columns exist in course_completions table...')
    
    for (const column of testColumns) {
      try {
        const { data, error } = await supabase
          .from('course_completions')
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
    
    // Try to get all columns
    console.log('\n=== ATTEMPTING TO GET ALL COLUMNS ===')
    try {
      const { data, error } = await supabase
        .from('course_completions')
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
    
    // Try to create a minimal course_completions record
    console.log('\n=== TESTING MINIMAL COURSE_COMPLETIONS INSERT ===')
    
    const minimalCompletion = {
      student_id: 'a8350cf9-b0c0-46af-91e8-5f33d24b1aae',
      course_id: '4d3d7e5d-2c8f-459f-9f31-b6e376027cee'
    }
    
    try {
      const { data, error } = await supabase
        .from('course_completions')
        .insert(minimalCompletion)
        .select()
      
      if (error) {
        console.log('❌ Minimal course_completions failed:', error.message)
        console.log('This tells us what the required columns are')
      } else {
        console.log('✅ Minimal course_completions succeeded!')
        console.log('Result:', data)
      }
    } catch (err) {
      console.log('❌ Exception:', err.message)
    }
    
  } catch (error) {
    console.error('Error checking course_completions schema:', error)
  }
}

checkCourseCompletionsSchema()
