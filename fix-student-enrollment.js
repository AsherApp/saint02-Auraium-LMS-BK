// Fix script to manually enroll student and set up password
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

const supabaseUrl = 'https://nasikwatndaxsgemnylp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2lrd2F0bmRheHNnZW1ueWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2NzgwNiwiZXhwIjoyMDcwMzQzODA2fQ.FnwWpdeUmWP8U2O1QA3cdav2I0SVN0BZDcBr82da4hs'

const supabase = createClient(supabaseUrl, supabaseKey)

const fixStudentEnrollment = async () => {
  console.log('🔧 === FIXING STUDENT ENROLLMENT ===')
  
  const studentCode = 'AA25090801'
  const studentEmail = 'adedapoademola004@gmail.com'
  const courseId = '30c9039e-5282-4914-92e1-04f7096a97b4' // Introduction to Programming
  
  try {
    // 1. Set up student password
    console.log('\n1. 🔐 SETTING UP STUDENT PASSWORD...')
    const password = 'Taptap123'
    const passwordHash = await bcrypt.hash(password, 10)
    
    const { data: studentUpdate, error: passwordError } = await supabase
      .from('students')
      .update({ password_hash: passwordHash })
      .eq('student_code', studentCode)
      .select()
    
    if (passwordError) {
      console.error('❌ Error setting password:', passwordError)
      return
    }
    
    console.log('✅ Password set successfully')
    console.log('Student can now login with:')
    console.log(`- Student Code: ${studentCode}`)
    console.log(`- Password: ${password}`)
    
    // 2. Create enrollment record
    console.log('\n2. 🎓 CREATING ENROLLMENT RECORD...')
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_email: studentEmail,
        student_id: studentUpdate[0].id, // Include the student_id
        enrolled_at: new Date().toISOString(),
        status: 'active',
        progress_percentage: 0
      })
      .select()
    
    if (enrollmentError) {
      console.error('❌ Error creating enrollment:', enrollmentError)
      
      // Check if enrollment already exists
      const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_email', studentEmail)
        .single()
      
      if (existingEnrollment) {
        console.log('✅ Enrollment already exists:', existingEnrollment)
      } else {
        console.log('❌ Failed to create enrollment and none exists')
        return
      }
    } else {
      console.log('✅ Enrollment created successfully:', enrollment)
    }
    
    // 3. Test the fix
    console.log('\n3. 🧪 TESTING THE FIX...')
    
    // Test login
    const loginResponse = await fetch('https://auraiumlmsbk.up.railway.app/api/auth/student/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_code: studentCode,
        password: password
      })
    })
    
    const loginData = await loginResponse.json()
    console.log('🔐 Login test:', loginResponse.status, loginData)
    
    if (!loginData.token) {
      console.log('❌ Login still failing')
      return
    }
    
    const token = loginData.token
    
    // Test enrollments endpoint
    const enrollmentsResponse = await fetch('https://auraiumlmsbk.up.railway.app/api/students/me/enrollments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const enrollmentsData = await enrollmentsResponse.json()
    console.log('🎓 Enrollments test:', enrollmentsResponse.status, enrollmentsData)
    
    if (enrollmentsResponse.ok && enrollmentsData.items?.length > 0) {
      console.log('✅ SUCCESS! Student can now see their course!')
      console.log('Courses found:', enrollmentsData.items.map(item => ({
        course_title: item.course?.title,
        course_id: item.course_id,
        enrolled_at: item.enrolled_at
      })))
    } else {
      console.log('❌ Student still cannot see courses')
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

// Run the fix
fixStudentEnrollment()