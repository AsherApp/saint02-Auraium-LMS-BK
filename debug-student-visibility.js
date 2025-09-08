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

async function debugStudentVisibility() {
  try {
    console.log('🔍 Debugging student visibility for teacher lxbrw23+3@gmail.com...')
    
    const teacherEmail = 'lxbrw23+3@gmail.com'
    
    // Check what the student management API should return
    console.log('\n👥 Checking student management API logic...')
    
    // This is the same logic as the /api/students/consolidated endpoint
    const { data: enrolledStudents, error: enrolledError } = await supabase
      .from('students')
      .select(`
        *,
        enrollments!inner(
          id,
          course_id,
          enrolled_at,
          progress_percentage,
          grade_percentage,
          last_activity,
          status,
          courses!inner(
            id,
            title,
            description,
            status,
            teacher_email
          )
        )
      `)
      .eq('enrollments.courses.teacher_email', teacherEmail)
    
    if (enrolledError) {
      console.error('❌ Error fetching enrolled students:', enrolledError)
      return
    }
    
    console.log(`✅ Enrolled students found: ${enrolledStudents?.length || 0}`)
    
    if (enrolledStudents && enrolledStudents.length > 0) {
      enrolledStudents.forEach((student, index) => {
        console.log(`\n👤 Enrolled Student ${index + 1}:`)
        console.log('  - Name:', student.name)
        console.log('  - Email:', student.email)
        console.log('  - Student Code:', student.student_code)
        console.log('  - Enrollments:', student.enrollments?.length || 0)
        
        if (student.enrollments) {
          student.enrollments.forEach((enrollment, eIndex) => {
            console.log(`    📚 Enrollment ${eIndex + 1}:`)
            console.log('      - Course:', enrollment.courses?.title)
            console.log('      - Status:', enrollment.status)
            console.log('      - Enrolled At:', enrollment.enrolled_at)
          })
        }
      })
    }
    
    // Check invites for this teacher
    console.log('\n📧 Checking invites for this teacher...')
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select(`
        *,
        courses(
          id,
          title,
          course_mode,
          status
        )
      `)
      .eq('created_by', teacherEmail)
      .eq('used', false)
    
    if (invitesError) {
      console.error('❌ Error fetching invites:', invitesError)
      return
    }
    
    console.log(`✅ Active invites found: ${invites?.length || 0}`)
    
    if (invites && invites.length > 0) {
      invites.forEach((invite, index) => {
        console.log(`\n📨 Active Invite ${index + 1}:`)
        console.log('  - Code:', invite.code)
        console.log('  - Student Email:', invite.email)
        console.log('  - Student Name:', invite.name)
        console.log('  - Course:', invite.courses?.title || 'No Course')
        console.log('  - Expires At:', invite.expires_at)
      })
    }
    
    // Check all students who might be related to this teacher
    console.log('\n🔍 Checking all students in system...')
    const { data: allStudents, error: allStudentsError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allStudentsError) {
      console.error('❌ Error fetching all students:', allStudentsError)
      return
    }
    
    console.log(`✅ Total students in system: ${allStudents?.length || 0}`)
    
    // Check which students have enrollments in this teacher's courses
    const studentsWithEnrollments = []
    for (const student of allStudents || []) {
      const { data: studentEnrollments } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(
            id,
            title,
            teacher_email
          )
        `)
        .eq('student_email', student.email)
        .eq('courses.teacher_email', teacherEmail)
      
      if (studentEnrollments && studentEnrollments.length > 0) {
        studentsWithEnrollments.push({
          student,
          enrollments: studentEnrollments
        })
      }
    }
    
    console.log(`\n🎯 Students with enrollments in teacher's courses: ${studentsWithEnrollments.length}`)
    
    studentsWithEnrollments.forEach((item, index) => {
      console.log(`\n👤 Student ${index + 1}:`)
      console.log('  - Name:', item.student.name)
      console.log('  - Email:', item.student.email)
      console.log('  - Student Code:', item.student.student_code)
      console.log('  - Enrollments:', item.enrollments.length)
      
      item.enrollments.forEach((enrollment, eIndex) => {
        console.log(`    📚 Enrollment ${eIndex + 1}:`)
        console.log('      - Course:', enrollment.courses?.title)
        console.log('      - Status:', enrollment.status)
        console.log('      - Enrolled At:', enrollment.enrolled_at)
      })
    })
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugStudentVisibility()
