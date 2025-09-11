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

async function createCorrectAssignmentSystem() {
  console.log('=== CREATING CORRECT ASSIGNMENT SYSTEM ===\n')
  
  try {
    // 1. Create grades table
    console.log('1. Creating grades table...')
    const createGradesTable = `
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
    
    const { error: gradesError } = await supabase.rpc('exec_sql', { sql: createGradesTable })
    if (gradesError) {
      console.log('Grades table creation result:', gradesError.message)
    } else {
      console.log('✅ Grades table created successfully')
    }
    
    // 2. Fix submissions table structure
    console.log('\n2. Fixing submissions table structure...')
    const fixSubmissionsTable = `
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS submission_id UUID DEFAULT gen_random_uuid(),
      ADD COLUMN IF NOT EXISTS assignment_id UUID,
      ADD COLUMN IF NOT EXISTS student_id UUID,
      ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS file_url TEXT,
      ADD COLUMN IF NOT EXISTS content TEXT
    `
    
    const { error: submissionsError } = await supabase.rpc('exec_sql', { sql: fixSubmissionsTable })
    if (submissionsError) {
      console.log('Submissions table fix result:', submissionsError.message)
    } else {
      console.log('✅ Submissions table structure fixed')
    }
    
    // 3. Create indexes
    console.log('\n3. Creating indexes...')
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
      CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON grades(submission_id);
    `
    
    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: createIndexes })
    if (indexesError) {
      console.log('Indexes creation result:', indexesError.message)
    } else {
      console.log('✅ Indexes created successfully')
    }
    
    // 4. Test the structure
    console.log('\n4. Testing new structure...')
    
    // Check grades table
    const { data: gradesTest, error: gradesTestError } = await supabase
      .from('grades')
      .select('*')
      .limit(1)
    
    if (gradesTestError) {
      console.log('❌ Grades table test failed:', gradesTestError.message)
    } else {
      console.log('✅ Grades table is accessible')
    }
    
    // Check submissions table structure
    const { data: submissionsTest, error: submissionsTestError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1)
    
    if (submissionsTestError) {
      console.log('❌ Submissions table test failed:', submissionsTestError.message)
    } else {
      console.log('✅ Submissions table is accessible')
      if (submissionsTest && submissionsTest.length > 0) {
        console.log('Submissions columns:', Object.keys(submissionsTest[0]))
      }
    }
    
    // 5. Create a test assignment with proper due date
    console.log('\n5. Creating test assignment with due date...')
    const { data: testAssignment, error: assignmentError } = await supabase
      .from('assignments')
      .upsert({
        id: '8c0032a6-c69a-4b6a-84d0-99edca559af6',
        course_id: '4d3d7e5d-2c8f-459f-9f31-b6e376027cee',
        title: 'SQL Joins Practice',
        description: 'Solve 10 SQL queries',
        type: 'essay',
        due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        points: 100,
        status: 'active'
      })
      .select()
    
    if (assignmentError) {
      console.log('❌ Test assignment creation failed:', assignmentError.message)
    } else {
      console.log('✅ Test assignment created successfully')
      console.log('Assignment:', testAssignment[0])
    }
    
    console.log('\n=== ASSIGNMENT SYSTEM SETUP COMPLETE ===')
    console.log('\nNext steps:')
    console.log('1. Create database triggers for the workflow')
    console.log('2. Update API endpoints to use the correct schema')
    console.log('3. Test the complete workflow')
    
  } catch (error) {
    console.error('Error creating assignment system:', error)
  }
}

createCorrectAssignmentSystem()
