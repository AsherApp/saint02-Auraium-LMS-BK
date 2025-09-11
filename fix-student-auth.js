// Fix student authentication by setting password
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function fixStudentAuth() {
  console.log('🔧 Fixing Student Authentication...\n');

  try {
    const studentEmail = 'teststudent@example.com';
    const studentPassword = 'password123';
    
    // 1. Check current student
    console.log('1. Checking current student...');
    const { data: currentStudent, error: currentError } = await supabase
      .from('students')
      .select('*')
      .eq('email', studentEmail)
      .single();

    if (currentError) {
      console.log(`   ❌ Student not found: ${currentError.message}`);
      return;
    }

    console.log(`   ✅ Student found: ${currentStudent.email}`);
    console.log(`   🔑 Current password hash: ${currentStudent.password_hash ? 'Exists' : 'Missing'}`);

    // 2. Update student with password
    console.log('\n2. Setting password for student...');
    const hashedPassword = await bcrypt.hash(studentPassword, 10);
    
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', studentEmail)
      .select()
      .single();

    if (updateError) {
      console.log(`   ❌ Error updating student: ${updateError.message}`);
      return;
    }

    console.log('   ✅ Student password updated successfully!');

    // 3. Test student authentication
    console.log('\n3. Testing student authentication...');
    const API_BASE = 'http://localhost:4000/api';
    
    const authResponse = await fetch(`${API_BASE}/auth/student/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: studentEmail,
        password: studentPassword
      })
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('   ✅ Student authentication successful!');
      console.log(`   👨‍🎓 Student: ${authData.user.name}`);
      console.log(`   🎫 Token: ${authData.token.substring(0, 20)}...`);
    } else {
      const error = await authResponse.text();
      console.log(`   ❌ Authentication failed: ${error}`);
    }

    console.log('\n🎉 Student Authentication Fixed!');
    console.log('\n📋 Student Credentials:');
    console.log(`   Email: ${studentEmail}`);
    console.log(`   Password: ${studentPassword}`);

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

fixStudentAuth()
