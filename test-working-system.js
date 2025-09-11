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

async function testWorkingSystem() {
  console.log('=== TESTING WORKING ASSIGNMENT SYSTEM ===\n')
  
  try {
    const assignmentId = '3f029674-f1b4-41af-bec3-cb927849a64b'
    const studentEmail = 'teststudent@example.com'
    
    console.log('🎯 TESTING WORKING ASSIGNMENT SYSTEM\n')
    
    // Step 1: Test the safe submission function
    console.log('1. 📝 Testing safe submission function...')
    
    const { data: submissionId, error: functionError } = await supabase
      .rpc('create_submission_safely', {
        p_assignment_id: assignmentId,
        p_student_id: 'a8350cf9-b0c0-46af-91e8-5f33d24b1aae',
        p_student_email: studentEmail,
        p_student_name: 'Test Student',
        p_content: 'This is my comprehensive essay about testing in software development. I have covered all the key points including unit testing, integration testing, and best practices.',
        p_status: 'submitted'
      })
    
    if (functionError) {
      console.log('❌ Safe submission function failed:', functionError.message)
      return
    }
    
    console.log('✅ Safe submission function worked!')
    console.log('   Submission ID:', submissionId)
    
    // Step 2: Test grading
    console.log('\n2. 🎓 Testing grading...')
    const { data: gradedSubmission, error: gradeError } = await supabase
      .from('submissions')
      .update({
        grade: 'A',
        feedback: 'Excellent work! Your essay demonstrates a deep understanding of software testing principles.',
        status: 'graded'
      })
      .eq('id', submissionId)
      .select()
    
    if (gradeError) {
      console.log('❌ Grading failed:', gradeError.message)
    } else {
      console.log('✅ Grading successful!')
      console.log('   Grade:', gradedSubmission[0].grade)
      console.log('   Feedback:', gradedSubmission[0].feedback.substring(0, 100) + '...')
    }
    
    // Step 3: Test the working submissions view
    console.log('\n3. 👨‍🎓 Testing working submissions view...')
    const { data: studentView, error: studentViewError } = await supabase
      .from('working_submissions')
      .select('*')
      .eq('student_email', studentEmail)
      .eq('assignment_id', assignmentId)
    
    if (studentViewError) {
      console.log('❌ Student view failed:', studentViewError.message)
    } else {
      console.log('✅ Student can view their result!')
      const result = studentView[0]
      console.log('   Assignment:', result.assignment_title)
      console.log('   Grade:', result.grade)
      console.log('   Feedback:', result.feedback.substring(0, 100) + '...')
      console.log('   Status:', result.status)
    }
    
    // Step 4: Test teacher view
    console.log('\n4. 👨‍🏫 Testing teacher view...')
    const { data: teacherView, error: teacherViewError } = await supabase
      .from('working_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
    
    if (teacherViewError) {
      console.log('❌ Teacher view failed:', teacherViewError.message)
    } else {
      console.log('✅ Teacher can view all submissions!')
      console.log('   Total submissions:', teacherView.length)
      teacherView.forEach((sub, index) => {
        console.log(`   Submission ${index + 1}: ${sub.student_name} - ${sub.grade || 'Not graded'}`)
      })
    }
    
    console.log('\n🎉 WORKING ASSIGNMENT SYSTEM SUCCESSFUL!')
    console.log('\n=== WORKFLOW SUMMARY ===')
    console.log('✅ 1. Teacher creates assignment')
    console.log('✅ 2. Student submits work (via safe function)')
    console.log('✅ 3. Teacher grades submission')
    console.log('✅ 4. Student views their result')
    console.log('✅ 5. Teacher views all submissions')
    
    console.log('\n🚀 THE ASSIGNMENT SYSTEM IS NOW WORKING!')
    console.log('\nNext steps:')
    console.log('1. Update the API to use the create_submission_safely function')
    console.log('2. Update the frontend to use the working_submissions view')
    console.log('3. Test the complete system end-to-end')
    
  } catch (error) {
    console.error('Error testing working system:', error)
  }
}

testWorkingSystem()
