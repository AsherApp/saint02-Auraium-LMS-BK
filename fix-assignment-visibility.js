// Fix assignment visibility issues
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

const API_BASE = 'http://localhost:4000/api';

const TEST_STUDENT = {
  student_code: 'TEST123',
  password: 'password123'
};

const COURSE_ID = '4d3d7e5d-2c8f-459f-9f31-b6e376027cee';

async function fixAssignmentVisibility() {
  console.log('🔧 Fixing Assignment Visibility Issues...\n');

  try {
    // 1. Update course status to published
    console.log('1. Updating course status to published...');
    const { data: courseUpdate, error: courseError } = await supabase
      .from('courses')
      .update({ status: 'published' })
      .eq('id', COURSE_ID)
      .select();

    if (courseError) {
      console.log(`   ❌ Error updating course: ${courseError.message}`);
    } else {
      console.log(`   ✅ Course updated to published status`);
    }

    // 2. Check assignment status constraint
    console.log('\n2. Checking assignment status constraint...');
    const { data: constraintInfo, error: constraintError } = await supabase
      .rpc('get_table_constraints', { table_name: 'assignments' });

    if (constraintError) {
      console.log(`   ❌ Error getting constraints: ${constraintError.message}`);
    } else {
      console.log(`   📋 Assignment constraints:`, constraintInfo);
    }

    // 3. Try different status values
    console.log('\n3. Trying different assignment status values...');
    const statusValues = ['published', 'active', 'live', 'available'];
    
    for (const status of statusValues) {
      console.log(`   Testing status: ${status}`);
      const { data: testUpdate, error: testError } = await supabase
        .from('assignments')
        .update({ status: status })
        .eq('course_id', COURSE_ID)
        .limit(1)
        .select();

      if (testError) {
        console.log(`      ❌ ${status}: ${testError.message}`);
      } else {
        console.log(`      ✅ ${status}: Success!`);
        break;
      }
    }

    // 4. Update all assignments to working status
    console.log('\n4. Updating all assignments to working status...');
    const { data: assignmentUpdate, error: assignmentError } = await supabase
      .from('assignments')
      .update({ status: 'active' })
      .eq('course_id', COURSE_ID)
      .select();

    if (assignmentError) {
      console.log(`   ❌ Error updating assignments: ${assignmentError.message}`);
    } else {
      console.log(`   ✅ Updated ${assignmentUpdate.length} assignments to active status`);
    }

    // 5. Fix the student assignment route to accept 'active' status
    console.log('\n5. The student assignment route needs to be updated to accept "active" status instead of "published"');
    console.log('   This will be fixed in the backend code...');

    // 6. Test student API call
    console.log('\n6. Testing student API call...');
    const studentLoginResponse = await fetch(`${API_BASE}/auth/student/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_STUDENT)
    });

    if (!studentLoginResponse.ok) {
      console.log(`   ❌ Student login failed: ${studentLoginResponse.status}`);
      return;
    }

    const studentLoginData = await studentLoginResponse.json();
    const studentToken = studentLoginData.token;
    console.log('   ✅ Student login successful!');

    const studentAssignmentsResponse = await fetch(`${API_BASE}/assignments/student`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${studentAssignmentsResponse.status}`);
    const result = await studentAssignmentsResponse.text();
    console.log(`   Response: ${result}`);

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

fixAssignmentVisibility()
