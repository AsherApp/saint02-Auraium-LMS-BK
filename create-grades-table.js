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

async function createGradesTable() {
  console.log('=== CREATING GRADES TABLE ===\n')
  
  try {
    // Since we can't use exec_sql, let's try to create the table using a different approach
    // We'll use the Supabase REST API directly
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS grades (
        grade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id UUID NOT NULL,
        teacher_id UUID,
        grade TEXT,
        feedback TEXT,
        graded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    
    console.log('Attempting to create grades table...')
    console.log('SQL:', createTableSQL)
    
    // Try to create the table using a direct SQL query
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('Grades table does not exist yet:', error.message)
      console.log('\nWe need to create the grades table manually in the database.')
      console.log('Please run this SQL in your database:')
      console.log('\n' + createTableSQL)
    } else {
      console.log('✅ Grades table already exists!')
      console.log('Grades table structure:', data)
    }
    
    // Let's also check what we can do with the current submissions table
    console.log('\n=== CHECKING CURRENT SUBMISSIONS TABLE ===')
    
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1)
    
    if (submissionsError) {
      console.log('Submissions table error:', submissionsError.message)
    } else {
      console.log('✅ Submissions table is accessible')
      if (submissionsData && submissionsData.length > 0) {
        console.log('Current submissions columns:', Object.keys(submissionsData[0]))
      } else {
        console.log('Submissions table is empty')
      }
    }
    
    // Let's try to insert a test submission to see what happens
    console.log('\n=== TESTING SUBMISSION CREATION ===')
    
    const testSubmission = {
      assignment_id: '8c0032a6-c69a-4b6a-84d0-99edca559af6',
      student_id: 'a8350cf9-b0c0-46af-91e8-5f33d24b1aae', // Test student ID
      submitted_at: new Date().toISOString(),
      file_url: 'test-file.pdf',
      content: 'Test submission content'
    }
    
    console.log('Attempting to create test submission:', testSubmission)
    
    const { data: submissionResult, error: submissionError } = await supabase
      .from('submissions')
      .insert(testSubmission)
      .select()
    
    if (submissionError) {
      console.log('❌ Submission creation failed:', submissionError.message)
      console.log('This tells us what columns are missing or incorrect')
    } else {
      console.log('✅ Test submission created successfully!')
      console.log('Submission result:', submissionResult)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createGradesTable()
