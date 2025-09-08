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

async function testStudentAPI() {
  try {
    console.log('🧪 Testing student management API...')
    
    const teacherEmail = 'lxbrw23+3@gmail.com'
    
    // Test the exact same query as the /api/students/consolidated endpoint
    console.log('\n📊 Testing /api/students/consolidated endpoint logic...')
    
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
      console.error('❌ Error in enrolled students query:', enrolledError)
      return
    }
    
    console.log(`✅ Enrolled students query result: ${enrolledStudents?.length || 0} students`)
    
    if (enrolledStudents && enrolledStudents.length > 0) {
      enrolledStudents.forEach((student, index) => {
        console.log(`\n👤 Student ${index + 1}:`)
        console.log('  - Name:', student.name)
        console.log('  - Email:', student.email)
        console.log('  - Student Code:', student.student_code)
        console.log('  - Enrollments:', student.enrollments?.length || 0)
        
        if (student.enrollments) {
          student.enrollments.forEach((enrollment, eIndex) => {
            console.log(`    📚 Enrollment ${eIndex + 1}:`)
            console.log('      - Course:', enrollment.courses?.title)
            console.log('      - Course ID:', enrollment.course_id)
            console.log('      - Status:', enrollment.status)
            console.log('      - Teacher Email:', enrollment.courses?.teacher_email)
            console.log('      - Enrolled At:', enrollment.enrolled_at)
          })
        }
      })
    }
    
    // Test the invites query
    console.log('\n📧 Testing invites query...')
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select(`
        *,
        courses!inner(
          id,
          title,
          course_mode,
          status,
          teacher_email
        )
      `)
      .eq('courses.teacher_email', teacherEmail)
      .eq('used', false)
    
    if (invitesError) {
      console.error('❌ Error in invites query:', invitesError)
      return
    }
    
    console.log(`✅ Invites query result: ${invites?.length || 0} invites`)
    
    if (invites && invites.length > 0) {
      invites.forEach((invite, index) => {
        console.log(`\n📨 Invite ${index + 1}:`)
        console.log('  - Code:', invite.code)
        console.log('  - Student Email:', invite.email)
        console.log('  - Student Name:', invite.name)
        console.log('  - Course:', invite.courses?.title)
        console.log('  - Used:', invite.used)
        console.log('  - Expires At:', invite.expires_at)
      })
    }
    
    // Simulate the consolidated response
    console.log('\n🎯 Simulating consolidated API response...')
    const consolidatedStudents = enrolledStudents || []
    const invitedStudents = (invites || []).map(invite => ({
      id: `invite-${invite.id}`,
      name: invite.name,
      email: invite.email,
      student_code: `INV-${invite.code}`,
      status: 'invited',
      enrollment_status: 'invited',
      course_title: invite.courses?.title,
      enrolled_at: null,
      progress_percentage: 0,
      grade_percentage: 0,
      last_activity: null
    }))
    
    const allStudents = [...consolidatedStudents, ...invitedStudents]
    
    console.log(`✅ Total students (enrolled + invited): ${allStudents.length}`)
    console.log(`   - Enrolled: ${consolidatedStudents.length}`)
    console.log(`   - Invited: ${invitedStudents.length}`)
    
    if (allStudents.length > 0) {
      console.log('\n📋 Final consolidated list:')
      allStudents.forEach((student, index) => {
        console.log(`\n👤 Student ${index + 1}:`)
        console.log('  - Name:', student.name)
        console.log('  - Email:', student.email)
        console.log('  - Student Code:', student.student_code)
        console.log('  - Status:', student.status || 'enrolled')
        console.log('  - Enrollment Status:', student.enrollment_status || 'active')
        if (student.course_title) {
          console.log('  - Course:', student.course_title)
        }
      })
    }
    
    console.log('\n🎉 API Test Complete!')
    console.log('   If you see students here but not in the frontend,')
    console.log('   the issue is likely a frontend caching or API call problem.')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testStudentAPI()
