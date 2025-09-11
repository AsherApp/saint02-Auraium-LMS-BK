// Create complete test user setup
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function createTestUsers() {
  console.log('👥 Creating Complete Test User Setup...\n')
  
  try {
    // 1. Create Test Teacher
    console.log('1. Creating Test Teacher...')
    const teacherEmail = 'testteacher@example.com'
    const teacherPassword = 'password123'
    const hashedTeacherPassword = await bcrypt.hash(teacherPassword, 10)
    
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .upsert({
        email: teacherEmail,
        first_name: 'Test',
        last_name: 'Teacher',
        password_hash: hashedTeacherPassword,
        subscription_status: 'active',
        max_students_allowed: 100,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
    
    if (teacherError) {
      console.log(`   ❌ Error creating teacher: ${teacherError.message}`)
      return
    }
    
    console.log('   ✅ Test teacher created successfully!')
    console.log(`   📧 Email: ${teacherEmail}`)
    console.log(`   🔑 Password: ${teacherPassword}`)
    
    // 2. Create Test Course
    console.log('\n2. Creating Test Course...')
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: 'Test Course for Assignments',
        description: 'A test course to demonstrate assignment functionality',
        teacher_email: teacherEmail,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
    
    if (courseError) {
      console.log(`   ❌ Error creating course: ${courseError.message}`)
    } else {
      console.log('   ✅ Test course created successfully!')
      console.log(`   📚 Course: ${course[0].title}`)
      console.log(`   🆔 Course ID: ${course[0].id}`)
      
      // 3. Create Test Student
      console.log('\n3. Creating Test Student...')
      const studentEmail = 'teststudent@example.com'
      const studentPassword = 'password123'
      const hashedStudentPassword = await bcrypt.hash(studentPassword, 10)
      
      const { data: student, error: studentError } = await supabase
        .from('students')
        .upsert({
          email: studentEmail,
          first_name: 'Test',
          last_name: 'Student',
          password_hash: hashedStudentPassword,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })
        .select()
      
      if (studentError) {
        console.log(`   ❌ Error creating student: ${studentError.message}`)
      } else {
        console.log('   ✅ Test student created successfully!')
        console.log(`   📧 Email: ${studentEmail}`)
        console.log(`   🔑 Password: ${studentPassword}`)
        
        // 4. Enroll Student in Course
        console.log('\n4. Enrolling Student in Course...')
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            student_email: studentEmail,
            course_id: course[0].id,
            enrollment_date: new Date().toISOString(),
            status: 'active'
          })
          .select()
        
        if (enrollmentError) {
          console.log(`   ❌ Error enrolling student: ${enrollmentError.message}`)
        } else {
          console.log('   ✅ Student enrolled successfully!')
        }
      }
    }
    
    console.log('\n🎉 Complete Test Setup Created!')
    console.log('\n📋 Test Credentials:')
    console.log('   👨‍🏫 Teacher:')
    console.log(`      Email: ${teacherEmail}`)
    console.log(`      Password: ${teacherPassword}`)
    console.log('   👨‍🎓 Student:')
    console.log(`      Email: ${studentEmail}`)
    console.log(`      Password: ${studentPassword}`)
    
  } catch (err) {
    console.log(`❌ Failed to create test users: ${err.message}`)
  }
}

createTestUsers()
