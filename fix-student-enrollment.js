import { createClient } from '@supabase/supabase-js'
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

async function fixStudentEnrollment() {
  try {
    console.log('🔧 Fixing student enrollment for MD25090701...')
    
    const publicCourseId = 'ed43d452-ebfc-42a4-9478-56921123e696'
    
    // Step 1: Publish the public course
    console.log('📚 Publishing public course...')
    const { error: publishError } = await supabase
      .from('courses')
      .update({ status: 'published' })
      .eq('id', publicCourseId)
    
    if (publishError) {
      console.error('❌ Error publishing course:', publishError)
      return
    }
    
    console.log('✅ Course published successfully')
    
    // Step 2: Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('student_code', 'MD25090701')
      .single()
    
    if (studentError || !student) {
      console.error('❌ Student MD25090701 not found')
      return
    }
    
    console.log('✅ Student found:', student.email)
    
    // Step 3: Enroll student in the public course
    console.log('📝 Enrolling student in public course...')
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id: student.id,
        student_email: student.email,
        course_id: publicCourseId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
        grade_percentage: 0
      })
    
    if (enrollError) {
      console.error('❌ Error enrolling student:', enrollError)
      return
    }
    
    console.log('✅ Student enrolled successfully')
    
    // Step 4: Verify the enrollment
    const { data: enrollment, error: verifyError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses(
          id,
          title,
          course_mode,
          status
        )
      `)
      .eq('student_email', student.email)
      .eq('course_id', publicCourseId)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying enrollment:', verifyError)
      return
    }
    
    console.log('🎯 Enrollment verified:')
    console.log('  - Course:', enrollment.courses?.title)
    console.log('  - Course Mode:', enrollment.courses?.course_mode)
    console.log('  - Course Status:', enrollment.courses?.status)
    console.log('  - Enrollment Status:', enrollment.status)
    
    console.log('\n🎉 SUCCESS! Student MD25090701 should now see the public dashboard!')
    console.log('   The student can logout and login again to see the changes.')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixStudentEnrollment()
