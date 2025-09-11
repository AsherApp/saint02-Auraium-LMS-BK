import { supabaseAdmin } from './src/lib/supabase.ts'

async function createTestStudent() {
  try {
    // Create a test student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .upsert({
        email: 'student@test.com',
        name: 'Test Student',
        status: 'active'
      }, {
        onConflict: 'email'
      })
      .select()
      .single()
    
    if (studentError) {
      console.error('Error creating test student:', studentError)
      return
    }
    
    // Create a login code for the student
    const { data: loginCode, error: codeError } = await supabaseAdmin
      .from('student_login_codes')
      .upsert({
        email: 'student@test.com',
        code: '123456',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        used: false
      }, {
        onConflict: 'email,code'
      })
      .select()
      .single()
    
    if (codeError) {
      console.error('Error creating login code:', codeError)
      return
    }
    
    console.log('Test student created/updated successfully!')
    console.log('Email: student@test.com')
    console.log('Login Code: 123456')
  } catch (err) {
    console.error('Failed to create test student:', err)
  }
}

createTestStudent()
