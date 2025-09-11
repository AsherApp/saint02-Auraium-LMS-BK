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

async function fixSubmissionCreation() {
  console.log('=== FIXING SUBMISSION CREATION ===\n')
  
  try {
    // Let's try to create a submission with ALL possible fields to satisfy any triggers
    console.log('Creating submission with all possible fields...')
    
    const completeSubmission = {
      assignment_id: '8c0032a6-c69a-4b6a-84d0-99edca559af6',
      student_id: 'a8350cf9-b0c0-46af-91e8-5f33d24b1aae',
      student_email: 'teststudent@example.com',
      course_id: '4d3d7e5d-2c8f-459f-9f31-b6e376027cee',
      submitted_at: new Date().toISOString(),
      content: 'This is my SQL assignment submission. I have completed all 10 queries.',
      status: 'submitted',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Complete submission data:', completeSubmission)
    
    const { data: submissionResult, error: submissionError } = await supabase
      .from('submissions')
      .insert(completeSubmission)
      .select()
    
    if (submissionError) {
      console.log('❌ Still failing:', submissionError.message)
      
      // Let's try a different approach - maybe we need to check what triggers exist
      console.log('\n=== CHECKING FOR TRIGGERS ===')
      console.log('The error suggests there\'s a trigger trying to insert into course_completions')
      console.log('Let\'s try to create the course_completions record first...')
      
      // Try to create a course_completions record manually
      try {
        const courseCompletion = {
          student_id: 'a8350cf9-b0c0-46af-91e8-5f33d24b1aae',
          course_id: '4d3d7e5d-2c8f-459f-9f31-b6e376027cee',
          completion_percentage: 0,
          completed_at: null,
          status: 'in_progress'
        }
        
        console.log('Creating course_completions record:', courseCompletion)
        
        const { data: completionResult, error: completionError } = await supabase
          .from('course_completions')
          .insert(courseCompletion)
          .select()
        
        if (completionError) {
          console.log('❌ Course completions creation failed:', completionError.message)
        } else {
          console.log('✅ Course completions record created:', completionResult)
          
          // Now try the submission again
          console.log('\n=== TRYING SUBMISSION AGAIN ===')
          const { data: submissionResult2, error: submissionError2 } = await supabase
            .from('submissions')
            .insert(completeSubmission)
            .select()
          
          if (submissionError2) {
            console.log('❌ Submission still failing:', submissionError2.message)
          } else {
            console.log('✅ Submission created successfully!')
            console.log('Submission result:', submissionResult2)
          }
        }
      } catch (err) {
        console.log('❌ Error with course_completions:', err.message)
      }
      
    } else {
      console.log('✅ Submission created successfully!')
      console.log('Submission result:', submissionResult)
      
      // Test the complete workflow
      console.log('\n=== TESTING COMPLETE WORKFLOW ===')
      
      const submissionId = submissionResult[0].id
      
      // Grade the submission
      const { data: gradeResult, error: gradeError } = await supabase
        .from('submissions')
        .update({
          grade: 'A',
          feedback: 'Excellent work!',
          status: 'graded'
        })
        .eq('id', submissionId)
        .select()
      
      if (gradeError) {
        console.log('❌ Grading failed:', gradeError.message)
      } else {
        console.log('✅ Grading successful!')
        console.log('Graded submission:', gradeResult)
      }
      
      console.log('\n🎉 ASSIGNMENT SYSTEM IS WORKING!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixSubmissionCreation()
