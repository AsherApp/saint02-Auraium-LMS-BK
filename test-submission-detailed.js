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

async function testSubmissionDetailed() {
  console.log('=== TESTING SUBMISSION CREATION WITH DETAILED LOGGING ===\n')
  
  try {
    const assignmentId = '3f029674-f1b4-41af-bec3-cb927849a64b'
    const studentEmail = 'teststudent@example.com'
    
    console.log('1. Checking assignment exists...')
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()
    
    if (assignmentError) {
      console.log('❌ Assignment error:', assignmentError)
      return
    }
    console.log('✅ Assignment found:', assignment.title)
    
    console.log('\n2. Checking student exists...')
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('email', studentEmail)
      .single()
    
    if (studentError) {
      console.log('❌ Student error:', studentError)
      return
    }
    console.log('✅ Student found:', student.first_name, student.last_name)
    
    console.log('\n3. Checking enrollment...')
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_email', studentEmail)
      .eq('course_id', assignment.course_id)
      .single()
    
    if (enrollmentError) {
      console.log('❌ Enrollment error:', enrollmentError)
      return
    }
    console.log('✅ Enrollment found:', enrollment.id)
    
    console.log('\n4. Checking course_completions record...')
    const { data: completion, error: completionError } = await supabase
      .from('course_completions')
      .select('*')
      .eq('student_id', student.id)
      .eq('course_id', assignment.course_id)
      .single()
    
    if (completionError) {
      console.log('❌ Course completion error:', completionError)
      console.log('Creating course_completions record...')
      
      const { data: newCompletion, error: createError } = await supabase
        .from('course_completions')
        .insert({
          student_id: student.id,
          student_email: studentEmail,
          course_id: assignment.course_id,
          completion_percentage: 0,
          completed_at: null
        })
        .select()
      
      if (createError) {
        console.log('❌ Failed to create course_completions:', createError)
        return
      }
      console.log('✅ Course_completions record created:', newCompletion[0].id)
    } else {
      console.log('✅ Course_completions record exists:', completion.id)
    }
    
    console.log('\n5. Attempting submission creation...')
    const submissionData = {
      assignment_id: assignmentId,
      course_id: assignment.course_id,
      student_id: student.id,
      student_email: studentEmail,
      student_name: `${student.first_name} ${student.last_name}`,
      attempt_number: 1,
      status: 'submitted',
      content: 'This is my test submission for the Complete Flow Test Assignment.',
      attachments: [],
      time_spent_minutes: 0,
      late_submission: false,
      submitted_at: new Date().toISOString()
    }
    
    console.log('Submission data:', JSON.stringify(submissionData, null, 2))
    
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select()
    
    if (submissionError) {
      console.log('❌ Submission creation failed:', submissionError)
      console.log('Error details:', JSON.stringify(submissionError, null, 2))
    } else {
      console.log('✅ Submission created successfully!')
      console.log('Submission ID:', submission[0].id)
      
      // Test grading
      console.log('\n6. Testing grading...')
      const { data: gradedSubmission, error: gradeError } = await supabase
        .from('submissions')
        .update({
          grade: 'A',
          feedback: 'Excellent work!',
          status: 'graded'
        })
        .eq('id', submission[0].id)
        .select()
      
      if (gradeError) {
        console.log('❌ Grading failed:', gradeError)
      } else {
        console.log('✅ Grading successful!')
        console.log('Graded submission:', gradedSubmission[0])
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testSubmissionDetailed()
