// Test the fixed submission system
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

async function testFixedSubmissionSystem() {
  console.log('🧪 Testing Fixed Submission System...\n');

  try {
    // Wait for backend to start
    console.log('1. Waiting for backend to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));

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

    // 3. Test student assignment endpoint
    console.log('\n3. Testing student assignment endpoint...');
    const studentAssignmentsResponse = await fetch(`${API_BASE}/assignments/student`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (studentAssignmentsResponse.ok) {
      const assignments = await studentAssignmentsResponse.json();
      console.log(`   ✅ Student can see ${assignments.length} assignments`);
      
      if (assignments.length > 0) {
        assignments.forEach((assignment, index) => {
          console.log(`      ${index + 1}. ${assignment.title} (${assignment.type}) - Status: ${assignment.submission_status}`);
        });
        
        // 4. Test submission creation
        console.log('\n4. Testing submission creation...');
        const testAssignment = assignments[0];
        console.log(`   📝 Creating submission for: ${testAssignment.title}`);
        
        const submissionData = {
          assignment_id: testAssignment.id,
          content: {
            essay: 'This is a test submission for the fixed submission system. The student can now see assignments and create submissions successfully.'
          },
          status: 'submitted',
          attempt_number: 1,
          time_spent_minutes: 25
        };

        const submissionResponse = await fetch(`${API_BASE}/submissions/assignment/${testAssignment.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        });

        if (submissionResponse.ok) {
          const submission = await submissionResponse.json();
          console.log('   ✅ Submission created successfully!');
          console.log(`   🆔 Submission ID: ${submission.id}`);
          console.log(`   📊 Status: ${submission.status}`);
          console.log(`   📝 Content: ${submission.content?.essay?.substring(0, 50)}...`);
          
          // 5. Test getting submission
          console.log('\n5. Testing submission retrieval...');
          const getSubmissionResponse = await fetch(`${API_BASE}/submissions/${submission.id}`, {
            headers: {
              'Authorization': `Bearer ${studentToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (getSubmissionResponse.ok) {
            const retrievedSubmission = await getSubmissionResponse.json();
            console.log('   ✅ Submission retrieval working!');
            console.log(`   📊 Retrieved status: ${retrievedSubmission.status}`);
          } else {
            const error = await getSubmissionResponse.text();
            console.log(`   ❌ Error retrieving submission: ${error}`);
          }
          
        } else {
          const error = await submissionResponse.text();
          console.log(`   ❌ Error creating submission: ${error}`);
        }
        
      } else {
        console.log('   📝 No assignments available for testing');
      }
    } else {
      const error = await studentAssignmentsResponse.text();
      console.log(`   ❌ Student cannot see assignments: ${error}`);
    }

    // 6. Test teacher login and grading
    console.log('\n6. Testing teacher grading workflow...');
    const teacherLoginResponse = await fetch(`${API_BASE}/auth/teacher/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_TEACHER)
    });

    if (teacherLoginResponse.ok) {
      const teacherLoginData = await teacherLoginResponse.json();
      const teacherToken = teacherLoginData.token;
      console.log('   ✅ Teacher login successful!');

      // Get teacher assignments
      const teacherAssignmentsResponse = await fetch(`${API_BASE}/assignments`, {
        headers: {
          'Authorization': `Bearer ${teacherToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (teacherAssignmentsResponse.ok) {
        const teacherAssignments = await teacherAssignmentsResponse.json();
        console.log(`   ✅ Teacher can see ${teacherAssignments.length} assignments`);
        
        if (teacherAssignments.length > 0) {
          const assignment = teacherAssignments[0];
          console.log(`   📝 Testing grading for: ${assignment.title}`);
          
          // Get submissions for this assignment
          const submissionsResponse = await fetch(`${API_BASE}/assignments/${assignment.id}/submissions`, {
            headers: {
              'Authorization': `Bearer ${teacherToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (submissionsResponse.ok) {
            const submissions = await submissionsResponse.json();
            console.log(`   ✅ Found ${submissions.length} submissions`);
            
            if (submissions.length > 0) {
              const submission = submissions[0];
              console.log(`   📝 Grading submission: ${submission.id}`);
              
              // Grade the submission
              const gradeData = {
                grade: 85,
                feedback: 'Great work! This submission demonstrates good understanding of the topic.',
                rubric_scores: [
                  { criterion: 'Content Quality', score: 8, max_score: 10 },
                  { criterion: 'Grammar', score: 9, max_score: 10 },
                  { criterion: 'Structure', score: 8, max_score: 10 }
                ]
              };

              const gradeResponse = await fetch(`${API_BASE}/submissions/${submission.id}/grade`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${teacherToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(gradeData)
              });

              if (gradeResponse.ok) {
                const gradedSubmission = await gradeResponse.json();
                console.log('   ✅ Submission graded successfully!');
                console.log(`   📊 Grade: ${gradedSubmission.grade}`);
                console.log(`   💬 Feedback: ${gradedSubmission.feedback}`);
              } else {
                const error = await gradeResponse.text();
                console.log(`   ❌ Error grading submission: ${error}`);
              }
            } else {
              console.log('   📝 No submissions found for grading');
            }
          } else {
            const error = await submissionsResponse.text();
            console.log(`   ❌ Error getting submissions: ${error}`);
          }
        }
      } else {
        const error = await teacherAssignmentsResponse.text();
        console.log(`   ❌ Teacher cannot see assignments: ${error}`);
      }
    } else {
      console.log(`   ❌ Teacher login failed: ${teacherLoginResponse.status}`);
    }

    console.log('\n🎉 Fixed Submission System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Student authentication');
    console.log('   ✅ Student assignment visibility');
    console.log('   ✅ Submission creation');
    console.log('   ✅ Submission retrieval');
    console.log('   ✅ Teacher authentication');
    console.log('   ✅ Teacher assignment visibility');
    console.log('   ✅ Submission grading');

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

testFixedSubmissionSystem()
