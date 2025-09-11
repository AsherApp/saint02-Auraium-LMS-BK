// Debug submission creation issue
const API_BASE = 'http://localhost:4000/api';

const TEST_TEACHER = {
  email: 'testteacher@example.com',
  password: 'password123'
};

const TEST_STUDENT = {
  student_code: 'TEST123',
  password: 'password123'
};

const COURSE_ID = '4d3d7e5d-2c8f-459f-9f31-b6e376027cee';

async function debugSubmissionCreation() {
  console.log('🔍 Debugging Submission Creation Issue...\n');

  try {
    // 1. Login as teacher and get assignments
    console.log('1. Getting assignments from teacher...');
    const teacherLoginResponse = await fetch(`${API_BASE}/auth/teacher/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_TEACHER)
    });

    if (!teacherLoginResponse.ok) {
      console.log(`   ❌ Teacher login failed: ${teacherLoginResponse.status}`);
      return;
    }

    const teacherLoginData = await teacherLoginResponse.json();
    const teacherToken = teacherLoginData.token;
    console.log('   ✅ Teacher login successful!');

    // Get assignments
    const assignmentsResponse = await fetch(`${API_BASE}/assignments`, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!assignmentsResponse.ok) {
      console.log(`   ❌ Error getting assignments: ${assignmentsResponse.status}`);
      return;
    }

    const assignments = await assignmentsResponse.json();
    console.log(`   ✅ Found ${assignments.length} assignments`);
    
    if (assignments.length === 0) {
      console.log('   ❌ No assignments found');
      return;
    }

    const testAssignment = assignments[0];
    console.log(`   📝 Using assignment: ${testAssignment.title} (ID: ${testAssignment.id})`);

    // 2. Login as student
    console.log('\n2. Logging in as student...');
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

    // 3. Test submission creation with minimal data
    console.log('\n3. Testing submission creation with minimal data...');
    const minimalSubmission = {
      assignment_id: testAssignment.id,
      content: {
        text: 'Minimal test submission'
      },
      status: 'submitted'
    };

    const minimalResponse = await fetch(`${API_BASE}/submissions/assignment/${testAssignment.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalSubmission)
    });

    console.log(`   Status: ${minimalResponse.status}`);
    const minimalResult = await minimalResponse.text();
    console.log(`   Response: ${minimalResult}`);

    // 4. Test submission creation with complete data
    console.log('\n4. Testing submission creation with complete data...');
    const completeSubmission = {
      assignment_id: testAssignment.id,
      content: {
        essay: 'This is a complete test submission with detailed content.'
      },
      status: 'submitted',
      attempt_number: 1,
      time_spent_minutes: 30
    };

    const completeResponse = await fetch(`${API_BASE}/submissions/assignment/${testAssignment.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(completeSubmission)
    });

    console.log(`   Status: ${completeResponse.status}`);
    const completeResult = await completeResponse.text();
    console.log(`   Response: ${completeResult}`);

    // 5. Test different submission endpoints
    console.log('\n5. Testing different submission endpoints...');
    
    // Test direct submission creation
    const directResponse = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assignment_id: testAssignment.id,
        content: { text: 'Direct submission test' },
        status: 'submitted'
      })
    });

    console.log(`   Direct submission status: ${directResponse.status}`);
    const directResult = await directResponse.text();
    console.log(`   Direct submission response: ${directResult}`);

    // 6. Check if student can see assignments
    console.log('\n6. Checking if student can see assignments...');
    const studentAssignmentsResponse = await fetch(`${API_BASE}/assignments`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (studentAssignmentsResponse.ok) {
      const studentAssignments = await studentAssignmentsResponse.json();
      console.log(`   ✅ Student can see ${studentAssignments.length} assignments`);
      if (studentAssignments.length > 0) {
        console.log(`   📝 First assignment: ${studentAssignments[0].title}`);
      }
    } else {
      const error = await studentAssignmentsResponse.text();
      console.log(`   ❌ Student cannot see assignments: ${error}`);
    }

    // 7. Check enrollment status
    console.log('\n7. Checking enrollment status...');
    const enrollmentResponse = await fetch(`${API_BASE}/courses/${COURSE_ID}`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (enrollmentResponse.ok) {
      const course = await enrollmentResponse.json();
      console.log(`   ✅ Student can access course: ${course.title}`);
    } else {
      const error = await enrollmentResponse.text();
      console.log(`   ❌ Student cannot access course: ${error}`);
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

debugSubmissionCreation()
