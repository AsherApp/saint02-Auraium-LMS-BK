import { supabaseAdmin } from './src/lib/supabase.js'
import bcrypt from 'bcrypt'

async function setupStudentPassword() {
  try {
    // Hash the password
    const password = 'password' // You can change this to any password you want
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Update the student's password
    const { data, error } = await supabaseAdmin
      .from('students')
      .update({ password_hash: passwordHash })
      .eq('student_code', 'DS25081701')
      .select()
    
    if (error) {
      console.error('Error updating student password:', error)
      return
    }
    
    console.log('Successfully set password for student:', data[0])
    console.log('Student can now login with:')
    console.log('- Student Code: DS25081701')
    console.log('- Password: password')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

setupStudentPassword()
