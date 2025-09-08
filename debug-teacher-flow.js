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

async function debugTeacherFlow() {
  try {
    console.log('🔍 Debugging teacher flow for lxbrw23+3@gmail.com...')
    
    const teacherEmail = 'lxbrw23+3@gmail.com'
    
    // Step 1: Check teacher's courses
    console.log('\n📚 Step 1: Checking teacher courses...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('teacher_email', teacherEmail)
      .order('created_at', { ascending: false })
    
    if (coursesError) {
      console.error('❌ Error fetching courses:', coursesError)
      return
    }
    
    console.log(`✅ Found ${courses?.length || 0} courses for teacher`)
    
    if (courses && courses.length > 0) {
      courses.forEach((course, index) => {
        console.log(`\n📖 Course ${index + 1}:`)
        console.log('  - ID:', course.id)
        console.log('  - Title:', course.title)
        console.log('  - Course Mode:', course.course_mode)
        console.log('  - Status:', course.status)
        console.log('  - Visibility:', course.visibility)
        console.log('  - Created At:', course.created_at)
      })
    }
    
    // Step 2: Check invites for this teacher
    console.log('\n📧 Step 2: Checking teacher invites...')
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
      .order('created_at', { ascending: false })
    
    if (invitesError) {
      console.error('❌ Error fetching invites:', invitesError)
      return
    }
    
    console.log(`✅ Found ${invites?.length || 0} invites created by teacher`)
    
    if (invites && invites.length > 0) {
      invites.forEach((invite, index) => {
        console.log(`\n📨 Invite ${index + 1}:`)
        console.log('  - Invite Code:', invite.invite_code)
        console.log('  - Student Email:', invite.student_email)
        console.log('  - Course:', invite.courses?.title)
        console.log('  - Course Mode:', invite.courses?.course_mode)
        console.log('  - Used:', invite.used)
        console.log('  - Created At:', invite.created_at)
        console.log('  - Expires At:', invite.expires_at)
      })
    }
    
    // Step 3: Check enrollments for this teacher's courses
    console.log('\n👥 Step 3: Checking enrollments for teacher courses...')
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses!inner(
          id,
          title,
          course_mode,
          status,
          teacher_email
        ),
        students(
          id,
          name,
          email,
          student_code
        )
      `)
      .eq('courses.teacher_email', teacherEmail)
      .order('enrolled_at', { ascending: false })
    
    if (enrollmentsError) {
      console.error('❌ Error fetching enrollments:', enrollmentsError)
      return
    }
    
    console.log(`✅ Found ${enrollments?.length || 0} enrollments for teacher courses`)
    
    if (enrollments && enrollments.length > 0) {
      enrollments.forEach((enrollment, index) => {
        console.log(`\n👤 Enrollment ${index + 1}:`)
        console.log('  - Student:', enrollment.students?.name || 'Unknown')
        console.log('  - Student Email:', enrollment.student_email)
        console.log('  - Student Code:', enrollment.students?.student_code || 'N/A')
        console.log('  - Course:', enrollment.courses?.title)
        console.log('  - Course Mode:', enrollment.courses?.course_mode)
        console.log('  - Enrollment Status:', enrollment.status)
        console.log('  - Enrolled At:', enrollment.enrolled_at)
      })
    } else {
      console.log('❌ No enrollments found - this explains why no students are visible!')
    }
    
    // Step 4: Check students table for any students
    console.log('\n👥 Step 4: Checking all students in system...')
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError)
      return
    }
    
    console.log(`✅ Found ${allStudents?.length || 0} students in system`)
    
    if (allStudents && allStudents.length > 0) {
      allStudents.forEach((student, index) => {
        console.log(`\n👤 Student ${index + 1}:`)
        console.log('  - Name:', student.name)
        console.log('  - Email:', student.email)
        console.log('  - Student Code:', student.student_code)
        console.log('  - Created At:', student.created_at)
      })
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugTeacherFlow()
