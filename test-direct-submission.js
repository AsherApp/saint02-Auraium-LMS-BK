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

async function testDirectSubmission() {
  console.log('=== TESTING DIRECT SUBMISSION (BYPASSING TRIGGERS) ===\n')
  
  try {
    const assignmentId = '3f029674-f1b4-41af-bec3-cb927849a64b'
    const studentEmail = 'teststudent@example.com'
    
    console.log('🎯 TESTING DIRECT SUBMISSION APPROACH\n')
    
    // Step 1: Ensure course_completions record exists first
    console.log('1. 📊 Ensuring course_completions record exists...')
    const { data: existingCompletion, error: completionError } = await supabase
      .from('course_completions')
      .select('id')
      .eq('student_id', 'a8350cf9-b0c0-46af-91e8-5f33d24b1aae')
      .eq('course_id', '4d3d7e5d-2c8f-459f-9f31-b6e376027cee')
      .single()
    
    if (completionError && completionError.code === 'PGRST116') {
      console.log('Creating course_completions record...')
      const { data: newCompletion, error: createError } = await supabase
        .from('course_completions')
        .insert({
          student_id: 'a8350cf9-b0c0-46af-91e8-5f33d24b1aae',
          student_email: studentEmail,
          course_id: '4d3d7e5d-2c8f-459f-9f31-b6e376027cee',
          completion_percentage: 0,
          total_lessons: 0,
          completed_lessons: 0,
          total_assignments: 0,
          completed_assignments: 0,
          total_quizzes: 0,
          passed_quizzes: 0,
          completed_at: null
        })
        .select()
      
      if (createError) {
        console.log('❌ Failed to create course_completions:', createError.message)
        return
      }
      console.log('✅ Course_completions record created:', newCompletion[0].id)
    } else if (completionError) {
      console.log('❌ Error checking course_completions:', completionError.message)
      return
    } else {
      console.log('✅ Course_completions record already exists:', existingCompletion.id)
    }
    
    // Step 2: Try to create submission with minimal data
    console.log('\n2. 📝 Creating submission with minimal data...')
    const minimalSubmission = {
      assignment_id: assignmentId,
      course_id: '4d3d7e5d-2c8f-459f-9f31-b6e376027cee',
      student_id: 'a8350cf9-b0c0-46af-91e8-5f33d24b1aae',
      student_email: studentEmail,
      student_name: 'Test Student',
      status: 'submitted',
      content: 'Test submission content',
      submitted_at: new Date().toISOString()
    }
    
    console.log('Minimal submission data:', JSON.stringify(minimalSubmission, null, 2))
    
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert(minimalSubmission)
      .select()
    
    if (submissionError) {
      console.log('❌ Submission creation failed:', submissionError.message)
      console.log('Error details:', JSON.stringify(submissionError, null, 2))
      
      // Try to understand what's happening
      console.log('\n🔍 DEBUGGING: Let\'s check what triggers exist...')
      
      // Check if there are any hidden triggers
      const { data: triggers, error: triggerError } = await supabase
        .rpc('get_triggers')
        .catch(() => ({ data: null, error: { message: 'Function not available' } }))
      
      if (triggerError) {
        console.log('Cannot check triggers:', triggerError.message)
      } else {
        console.log('Database triggers:', triggers)
      }
      
      return
    }
    
    console.log('✅ Submission created successfully!')
    console.log('   Submission ID:', submission[0].id)
    
    // Step 3: Test grading
    console.log('\n3. 🎓 Testing grading...')
    const { data: gradedSubmission, error: gradeError } = await supabase
      .from('submissions')
      .update({
        grade: 'A',
        feedback: 'Great work!',
        status: 'graded'
      })
      .eq('id', submission[0].id)
      .select()
    
    if (gradeError) {
      console.log('❌ Grading failed:', gradeError.message)
    } else {
      console.log('✅ Grading successful!')
      console.log('   Grade:', gradedSubmission[0].grade)
    }
    
    console.log('\n🎉 DIRECT SUBMISSION APPROACH WORKING!')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testDirectSubmission()
