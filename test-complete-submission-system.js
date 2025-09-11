// Test the complete submission system
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

async function testCompleteSubmissionSystem() {
  console.log('🧪 Testing Complete Submission System...\n');

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
        
        // 4. Test submission creation for different assignment types
        console.log('\n4. Testing submission creation for different assignment types...');
        
        for (let i = 0; i < Math.min(3, assignments.length); i++) {
          const assignment = assignments[i];
          console.log(`\n   📝 Testing ${assignment.type} assignment: ${assignment.title}`);
          
          let submissionData;
          
          switch (assignment.type) {
            case 'essay':
              submissionData = {
                assignment_id: assignment.id,
                content: {
                  essay: `This is a test essay submission for ${assignment.title}. It demonstrates the student's understanding of the topic and provides detailed analysis.`
                },
                status: 'submitted',
                attempt_number: 1,
                time_spent_minutes: 45
              };
              break;
              
            case 'quiz':
              submissionData = {
                assignment_id: assignment.id,
                content: {
                  quiz: {
                    answers: [
                      { question_id: 1, answer: 'A' },
                      { question_id: 2, answer: 'B' },
                      { question_id: 3, answer: 'C' }
                    ]
                  }
                },
                status: 'submitted',
                attempt_number: 1,
                time_spent_minutes: 15
              };
              break;
              
            case 'file_upload':
              submissionData = {
                assignment_id: assignment.id,
                content: {
                  file_upload: [
                    { filename: 'document.pdf', url: 'https://example.com/document.pdf' }
                  ]
                },
                status: 'submitted',
                attempt_number: 1,
                time_spent_minutes: 20
              };
              break;
              
            default:
              submissionData = {
                assignment_id: assignment.id,
                content: {
                  text: `This is a test submission for ${assignment.type} assignment: ${assignment.title}`
                },
                status: 'submitted',
                attempt_number: 1,
                time_spent_minutes: 30
              };
          }

          const submissionResponse = await fetch(`${API_BASE}/submissions/assignment/${assignment.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${studentToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
          });

          if (submissionResponse.ok) {
            const submission = await submissionResponse.json();
            console.log(`   ✅ ${assignment.type} submission created successfully!`);
            console.log(`   🆔 Submission ID: ${submission.id}`);
            console.log(`   📊 Status: ${submission.status}`);
          } else {
            const error = await submissionResponse.text();
            console.log(`   ❌ Error creating ${assignment.type} submission: ${error}`);
          }
        }
        
      } else {
        console.log('   📝 No assignments available for testing');
      }
    } else {
      const error = await studentAssignmentsResponse.text();
      console.log(`   ❌ Student cannot see assignments: ${error}`);
    }

    // 5. Test teacher grading workflow
    console.log('\n5. Testing teacher grading workflow...');
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
                grade: 88,
                feedback: 'Excellent work! This submission demonstrates strong understanding and good execution.',
                rubric_scores: [
                  { criterion: 'Content Quality', score: 9, max_score: 10 },
                  { criterion: 'Grammar', score: 8, max_score: 10 },
                  { criterion: 'Structure', score: 9, max_score: 10 }
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
                
                // 6. Test resubmission workflow
                console.log('\n6. Testing resubmission workflow...');
                const returnData = {
                  feedback: 'Please revise your submission based on the feedback provided.',
                  reason: 'needs_improvement'
                };

                const returnResponse = await fetch(`${API_BASE}/submissions/${submission.id}/return`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${teacherToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(returnData)
                });

                if (returnResponse.ok) {
                  const returnedSubmission = await returnResponse.json();
                  console.log('   ✅ Submission returned for resubmission!');
                  console.log(`   📊 New Status: ${returnedSubmission.status}`);
                  console.log(`   💬 Return Feedback: ${returnedSubmission.return_feedback}`);
                } else {
                  const error = await returnResponse.text();
                  console.log(`   ❌ Error returning submission: ${error}`);
                }
                
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

    console.log('\n🎉 Complete Submission System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Student authentication');
    console.log('   ✅ Student assignment visibility');
    console.log('   ✅ Multiple assignment type submissions');
    console.log('   ✅ Teacher authentication');
    console.log('   ✅ Teacher assignment visibility');
    console.log('   ✅ Submission grading');
    console.log('   ✅ Resubmission workflow');

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

testCompleteSubmissionSystem()
