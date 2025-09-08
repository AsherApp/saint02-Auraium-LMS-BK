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

async function debugCourseInvites() {
  try {
    console.log('🔍 Debugging invites for public course...')
    
    const publicCourseId = 'ed43d452-ebfc-42a4-9478-56921123e696'
    
    // Check invites for this specific course
    const { data: invites, error: inviteError } = await supabase
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
      .eq('course_id', publicCourseId)
      .order('created_at', { ascending: false })
    
    if (inviteError) {
      console.error('❌ Error fetching invites:', inviteError)
      return
    }
    
    console.log('📧 Invites for public course:', invites?.length || 0)
    
    if (invites && invites.length > 0) {
      invites.forEach((invite, index) => {
        console.log(`\n📨 Invite ${index + 1}:`)
        console.log('  - Invite Code:', invite.invite_code)
        console.log('  - Student Email:', invite.student_email)
        console.log('  - Used:', invite.used)
        console.log('  - Created At:', invite.created_at)
        console.log('  - Expires At:', invite.expires_at)
      })
    } else {
      console.log('❌ No invites found for the public course')
    }
    
    // Check if student MD25090701 should be enrolled
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('student_code', 'MD25090701')
      .single()
    
    if (student) {
      console.log('\n👤 Student MD25090701 email:', student.email)
      
      // Check if there are any invites for this student
      const { data: studentInvites } = await supabase
        .from('invites')
        .select('*')
        .eq('student_email', student.email)
      
      console.log('📧 Invites for this student:', studentInvites?.length || 0)
      
      if (studentInvites && studentInvites.length > 0) {
        studentInvites.forEach((invite, index) => {
          console.log(`\n📨 Student Invite ${index + 1}:`)
          console.log('  - Course ID:', invite.course_id)
          console.log('  - Used:', invite.used)
          console.log('  - Created At:', invite.created_at)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugCourseInvites()
