// Debug student assignments endpoint
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

async function debugStudentAssignments() {
  console.log('🔍 Debugging Student Assignments...\n');

  try {
    // 1. Check student enrollment
    console.log('1. Checking student enrollment...');
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses!inner(
          id,
          title,
          teacher_email,
          status
        )
      `)
      .eq('student_email', 'teststudent@example.com')
      .eq('status', 'active');

    if (enrollmentError) {
      console.log(`   ❌ Error fetching enrollments: ${enrollmentError.message}`);
      return;
    }

    console.log(`   ✅ Found ${enrollments.length} enrollments`);
    enrollments.forEach((enrollment, index) => {
      console.log(`      ${index + 1}. Course: ${enrollment.courses?.title} - Status: ${enrollment.courses?.status}`);
    });

    // 2. Check assignments in enrolled courses
    console.log('\n2. Checking assignments in enrolled courses...');
    const courseIds = enrollments.map(e => e.course_id);
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        type,
        status,
        courses!inner(
          id,
          title,
          status
        )
      `)
      .in('course_id', courseIds)
      .eq('status', 'published');

    if (assignmentsError) {
      console.log(`   ❌ Error fetching assignments: ${assignmentsError.message}`);
      return;
    }

    console.log(`   ✅ Found ${assignments.length} published assignments`);
    assignments.forEach((assignment, index) => {
      console.log(`      ${index + 1}. ${assignment.title} (${assignment.type}) - Course: ${assignment.courses?.title}`);
    });

    // 3. Test student login and API call
    console.log('\n3. Testing student API call...');
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

    // Test the student assignments endpoint
    const studentAssignmentsResponse = await fetch(`${API_BASE}/assignments/student`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${studentAssignmentsResponse.status}`);
    const result = await studentAssignmentsResponse.text();
    console.log(`   Response: ${result}`);

    // 4. Check if assignments are published
    console.log('\n4. Checking assignment status...');
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        status,
        course_id,
        courses!inner(
          id,
          title,
          status
        )
      `)
      .in('course_id', courseIds);

    if (allAssignmentsError) {
      console.log(`   ❌ Error fetching all assignments: ${allAssignmentsError.message}`);
      return;
    }

    console.log(`   📊 Assignment status breakdown:`);
    const statusCounts = {};
    allAssignments.forEach(assignment => {
      statusCounts[assignment.status] = (statusCounts[assignment.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`      ${status}: ${count} assignments`);
    });

    // 5. Update assignments to published status
    console.log('\n5. Updating assignments to published status...');
    const { data: updateResult, error: updateError } = await supabase
      .from('assignments')
      .update({ status: 'published' })
      .in('course_id', courseIds)
      .select();

    if (updateError) {
      console.log(`   ❌ Error updating assignments: ${updateError.message}`);
    } else {
      console.log(`   ✅ Updated ${updateResult.length} assignments to published status`);
    }

    // 6. Test student API call again
    console.log('\n6. Testing student API call after update...');
    const studentAssignmentsResponse2 = await fetch(`${API_BASE}/assignments/student`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Status: ${studentAssignmentsResponse2.status}`);
    const result2 = await studentAssignmentsResponse2.text();
    console.log(`   Response: ${result2}`);

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

debugStudentAssignments()
