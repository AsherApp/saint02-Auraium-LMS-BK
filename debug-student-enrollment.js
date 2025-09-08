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

async function debugStudentEnrollment() {
  try {
    console.log('🔍 Debugging student enrollment for MD25090701...')
    
    // First, find the student by student_code
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('student_code', 'MD25090701')
      .single()
    
    if (studentError) {
      console.error('❌ Error finding student:', studentError)
      return
    }
    
    if (!student) {
      console.error('❌ Student MD25090701 not found')
      return
    }
    
    console.log('✅ Student found:', {
      id: student.id,
      email: student.email,
      name: student.name,
      student_code: student.student_code
    })
    
    // Now get their enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses(
          id,
          title,
          description,
          status,
          teacher_email,
          course_mode,
          visibility,
          enrollment_policy
        )
      `)
      .eq('student_email', student.email)
      .order('enrolled_at', { ascending: false })
    
    if (enrollmentError) {
      console.error('❌ Error fetching enrollments:', enrollmentError)
      return
    }
    
    console.log('📚 Enrollments found:', enrollments?.length || 0)
    
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach((enrollment, index) => {
        console.log(`\n📖 Enrollment ${index + 1}:`)
        console.log('  - Course ID:', enrollment.course_id)
        console.log('  - Course Title:', enrollment.courses?.title)
        console.log('  - Course Mode:', enrollment.courses?.course_mode)
        console.log('  - Course Status:', enrollment.courses?.status)
        console.log('  - Teacher Email:', enrollment.courses?.teacher_email)
        console.log('  - Enrollment Status:', enrollment.status)
        console.log('  - Enrolled At:', enrollment.enrolled_at)
      })
      
      // Check if any course is in public mode
      const hasPublicCourses = enrollments.some(enrollment => 
        enrollment.courses?.course_mode === 'public'
      )
      
      console.log('\n🎯 Public Course Detection:')
      console.log('  - Has Public Courses:', hasPublicCourses)
      
      if (hasPublicCourses) {
        console.log('  ✅ Student should be redirected to public dashboard')
      } else {
        console.log('  ❌ Student should see full dashboard')
      }
    } else {
      console.log('❌ No enrollments found for this student')
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugStudentEnrollment()
