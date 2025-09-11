// Debug submission creation in detail
const API_BASE = 'http://localhost:4000/api';

const TEST_STUDENT = {
  student_code: 'TEST123',
  password: 'password123'
};

async function debugSubmissionCreationDetailed() {
  console.log('🔍 Debugging Submission Creation in Detail...\n');

  try {
    // 1. Login as student
    console.log('1. Logging in as student...');
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

    // 2. Get assignments
    console.log('\n2. Getting assignments...');
    const assignmentsResponse = await fetch(`${API_BASE}/assignments/student`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
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

    // 3. Test submission creation with minimal data
    console.log('\n3. Testing submission creation with minimal data...');
    const minimalSubmission = {
      assignment_id: testAssignment.id,
      content: {
        text: 'Minimal test submission'
      },
      status: 'submitted'
    };

    console.log('   📤 Sending submission data:', JSON.stringify(minimalSubmission, null, 2));

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

    // 4. Test with different endpoint
    console.log('\n4. Testing with different endpoint...');
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

    // 5. Test with complete data
    console.log('\n5. Testing with complete data...');
    const completeSubmission = {
      assignment_id: testAssignment.id,
      content: {
        essay: 'This is a complete test submission with detailed content.'
      },
      status: 'submitted',
      attempt_number: 1,
      time_spent_minutes: 30
    };

    console.log('   📤 Sending complete submission data:', JSON.stringify(completeSubmission, null, 2));

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

    // 6. Test with different assignment type
    console.log('\n6. Testing with different assignment type...');
    const quizAssignment = assignments.find(a => a.type === 'quiz');
    if (quizAssignment) {
      console.log(`   📝 Using quiz assignment: ${quizAssignment.title} (ID: ${quizAssignment.id})`);
      
      const quizSubmission = {
        assignment_id: quizAssignment.id,
        content: {
          quiz: {
            answers: [
              { question_id: 1, answer: 'A' },
              { question_id: 2, answer: 'B' }
            ]
          }
        },
        status: 'submitted',
        attempt_number: 1,
        time_spent_minutes: 15
      };

      console.log('   📤 Sending quiz submission data:', JSON.stringify(quizSubmission, null, 2));

      const quizResponse = await fetch(`${API_BASE}/submissions/assignment/${quizAssignment.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizSubmission)
      });

      console.log(`   Status: ${quizResponse.status}`);
      const quizResult = await quizResponse.text();
      console.log(`   Response: ${quizResult}`);
    } else {
      console.log('   📝 No quiz assignment found');
    }

    // 7. Check server logs
    console.log('\n7. The server logs should show the detailed error. Let me check the submission route...');

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

debugSubmissionCreationDetailed()
