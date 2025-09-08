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

async function debugStudentInvites() {
  try {
    console.log('🔍 Debugging student invites for MD25090701...')
    
    // First, find the student by student_code
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
    
    // Check for invites
    const { data: invites, error: inviteError } = await supabase
      .from('invites')
      .select(`
        *,
        courses(
          id,
          title,
          course_mode,
          status,
          teacher_email
        )
      `)
      .eq('student_email', student.email)
      .order('created_at', { ascending: false })
    
    if (inviteError) {
      console.error('❌ Error fetching invites:', inviteError)
      return
    }
    
    console.log('📧 Invites found:', invites?.length || 0)
    
    if (invites && invites.length > 0) {
      invites.forEach((invite, index) => {
        console.log(`\n📨 Invite ${index + 1}:`)
        console.log('  - Invite Code:', invite.invite_code)
        console.log('  - Course Title:', invite.courses?.title)
        console.log('  - Course Mode:', invite.courses?.course_mode)
        console.log('  - Course Status:', invite.courses?.status)
        console.log('  - Teacher Email:', invite.courses?.teacher_email)
        console.log('  - Used:', invite.used)
        console.log('  - Created At:', invite.created_at)
        console.log('  - Expires At:', invite.expires_at)
      })
    } else {
      console.log('❌ No invites found for this student')
    }
    
    // Also check if there are any public courses this student could be enrolled in
    console.log('\n🔍 Checking for public courses...')
    const { data: publicCourses, error: publicError } = await supabase
      .from('courses')
      .select('*')
      .eq('course_mode', 'public')
      .eq('status', 'published')
    
    if (publicError) {
      console.error('❌ Error fetching public courses:', publicError)
      return
    }
    
    console.log('🌐 Public courses available:', publicCourses?.length || 0)
    
    if (publicCourses && publicCourses.length > 0) {
      publicCourses.forEach((course, index) => {
        console.log(`\n📚 Public Course ${index + 1}:`)
        console.log('  - Course ID:', course.id)
        console.log('  - Course Title:', course.title)
        console.log('  - Teacher Email:', course.teacher_email)
        console.log('  - Status:', course.status)
      })
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugStudentInvites()
