import { supabaseAdmin } from './src/lib/supabase.ts'
import bcrypt from 'bcrypt'

async function createTestTeacher() {
  try {
    const hashedPassword = await bcrypt.hash('test', 10)
    
    const { data, error } = await supabaseAdmin
      .from('teachers')
      .upsert({
        email: 'mecki@test.com',
        first_name: 'Test',
        last_name: 'Teacher',
        password_hash: hashedPassword,
        subscription_status: 'active',
        max_students_allowed: 100
      }, {
        onConflict: 'email'
      })
    
    if (error) {
      console.error('Error creating test teacher:', error)
      return
    }
    
    console.log('Test teacher created/updated successfully!')
    console.log('Email: mecki@test.com')
    console.log('Password: test')
  } catch (err) {
    console.error('Failed to create test teacher:', err)
  }
}

createTestTeacher()
