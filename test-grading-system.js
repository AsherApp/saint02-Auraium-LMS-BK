import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

async function testGradingSystem() {
  console.log('🧪 Testing Grading System...\n');

  try {
    // 1. Login as teacher
    console.log('1. Logging in as teacher...');
    const teacherLoginResponse = await fetch(`${BASE_URL}/api/auth/teacher/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testteacher@example.com',
        password: 'password123'
      })
    });

    if (!teacherLoginResponse.ok) {
      throw new Error(`Teacher login failed: ${teacherLoginResponse.statusText}`);
    }

    const teacherData = await teacherLoginResponse.json();
    const teacherToken = teacherData.token;
    console.log('   ✅ Teacher login successful!\n');

    // 2. Login as student
    console.log('2. Logging in as student...');
    const studentLoginResponse = await fetch(`${BASE_URL}/api/auth/student/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teststudent@example.com',
        password: 'password123'
      })
    });

    if (!studentLoginResponse.ok) {
      throw new Error(`Student login failed: ${studentLoginResponse.statusText}`);
    }

    const studentData = await studentLoginResponse.json();
    const studentToken = studentData.token;
    console.log('   ✅ Student login successful!\n');

    // 3. Get teacher's assignments
    console.log('3. Getting teacher assignments...');
    const assignmentsResponse = await fetch(`${BASE_URL}/api/assignments`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });

    if (!assignmentsResponse.ok) {
      throw new Error(`Failed to get assignments: ${assignmentsResponse.statusText}`);
    }

    const assignmentsData = await assignmentsResponse.json();
    const assignments = assignmentsData.items || [];
    console.log(`   ✅ Found ${assignments.length} assignments\n`);

    if (assignments.length === 0) {
      console.log('   ⚠️  No assignments found. Creating a test assignment...');
      
      // Create a test assignment
      const createAssignmentResponse = await fetch(`${BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          course_id: '4d3d7e5d-2c8f-459f-9f31-b6e376027cee', // Test course ID
          title: 'Test Grading Assignment',
          description: 'This is a test assignment for grading',
          type: 'essay',
          points: 100,
          due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'active'
        })
      });

      if (createAssignmentResponse.ok) {
        const newAssignment = await createAssignmentResponse.json();
        assignments.push(newAssignment);
        console.log(`   ✅ Created test assignment: ${newAssignment.id}\n`);
      } else {
        console.log('   ❌ Failed to create test assignment\n');
      }
    }

    // 4. Get student's assignments
    console.log('4. Getting student assignments...');
    const studentAssignmentsResponse = await fetch(`${BASE_URL}/api/assignments/student`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    if (!studentAssignmentsResponse.ok) {
      throw new Error(`Failed to get student assignments: ${studentAssignmentsResponse.statusText}`);
    }

    const studentAssignmentsData = await studentAssignmentsResponse.json();
    const studentAssignments = studentAssignmentsData.items || [];
    console.log(`   ✅ Student can see ${studentAssignments.length} assignments\n`);

    // 5. Create a submission for the first assignment
    if (studentAssignments.length > 0) {
      const assignment = studentAssignments[0];
      console.log(`5. Creating submission for assignment: ${assignment.title}...`);
      
      const submissionResponse = await fetch(`${BASE_URL}/api/submissions/assignment/${assignment.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          content: {
            essay: 'This is a test submission for grading. The student has written a comprehensive essay about the topic.'
          },
          status: 'submitted',
          attempt_number: 1,
          time_spent_minutes: 45
        })
      });

      if (submissionResponse.ok) {
        const submission = await submissionResponse.json();
        console.log(`   ✅ Submission created: ${submission.id}\n`);

        // 6. Grade the submission
        console.log('6. Grading the submission...');
        const gradeResponse = await fetch(`${BASE_URL}/api/submissions/${submission.id}/grade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${teacherToken}`
          },
          body: JSON.stringify({
            grade: 85,
            feedback: 'Great work! Your essay demonstrates good understanding of the topic. Consider adding more examples in the next section.',
            rubric_scores: [
              { criterion_id: 'content', score: 8 },
              { criterion_id: 'organization', score: 7 },
              { criterion_id: 'grammar', score: 9 }
            ]
          })
        });

        if (gradeResponse.ok) {
          const gradedSubmission = await gradeResponse.json();
          console.log('   ✅ Submission graded successfully!');
          console.log(`   Grade: ${gradedSubmission.grade}/${assignment.points}`);
          console.log(`   Feedback: ${gradedSubmission.feedback}\n`);

          // 7. Test getting graded submission
          console.log('7. Testing graded submission retrieval...');
          const getSubmissionResponse = await fetch(`${BASE_URL}/api/submissions/${submission.id}`, {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
          });

          if (getSubmissionResponse.ok) {
            const retrievedSubmission = await getSubmissionResponse.json();
            console.log('   ✅ Graded submission retrieved successfully!');
            console.log(`   Status: ${retrievedSubmission.status}`);
            console.log(`   Grade: ${retrievedSubmission.grade}`);
            console.log(`   Graded at: ${retrievedSubmission.graded_at}\n`);
          } else {
            console.log('   ❌ Failed to retrieve graded submission\n');
          }

          // 8. Test student viewing graded submission
          console.log('8. Testing student viewing graded submission...');
          const studentViewResponse = await fetch(`${BASE_URL}/api/submissions/${submission.id}`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
          });

          if (studentViewResponse.ok) {
            const studentViewSubmission = await studentViewResponse.json();
            console.log('   ✅ Student can view graded submission!');
            console.log(`   Grade: ${studentViewSubmission.grade}`);
            console.log(`   Feedback: ${studentViewSubmission.feedback}\n`);
          } else {
            console.log('   ❌ Student cannot view graded submission\n');
          }

        } else {
          const errorData = await gradeResponse.json();
          console.log('   ❌ Failed to grade submission:');
          console.log(`   Error: ${errorData.error}\n`);
        }

      } else {
        const errorData = await submissionResponse.json();
        console.log('   ❌ Failed to create submission:');
        console.log(`   Error: ${errorData.error}\n`);
      }
    } else {
      console.log('   ⚠️  No assignments available for student to submit\n');
    }

    console.log('🎉 Grading System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait for backend to start
setTimeout(() => {
  testGradingSystem();
}, 3000);
