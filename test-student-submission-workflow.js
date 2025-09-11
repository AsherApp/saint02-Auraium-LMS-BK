// Test student submission workflow
const API_BASE = 'http://localhost:4000/api';

const TEST_STUDENT = {
  email: 'teststudent@example.com',
  password: 'password123'
};

const TEST_TEACHER = {
  email: 'testteacher@example.com',
  password: 'password123'
};

async function testStudentSubmissionWorkflow() {
  console.log('👨‍🎓 Testing Student Submission Workflow...\n');

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
    console.log(`   👨‍🎓 Student: ${studentLoginData.user.name}`);

    // 2. Get assignments for student
    console.log('\n2. Getting assignments for student...');
    const assignmentsResponse = await fetch(`${API_BASE}/assignments`, {
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
      console.log('   ❌ No assignments found for student');
      return;
    }

    // 3. Test submission for each assignment type
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      console.log(`\n${i + 3}. Testing submission for: ${assignment.title} (${assignment.type})...`);
      
      // Create submission based on assignment type
      let submissionData;
      
      switch (assignment.type) {
        case 'essay':
          submissionData = {
            assignment_id: assignment.id,
            content: {
              essay: 'This is a comprehensive essay on climate change. Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, since the 1800s human activities have been the main driver of climate change, primarily due to burning fossil fuels like coal, oil and gas. This essay explores the causes, effects, and potential solutions to climate change.'
            },
            status: 'submitted'
          };
          break;
          
        case 'quiz':
          submissionData = {
            assignment_id: assignment.id,
            content: {
              quiz: {
                answers: {
                  'q1': 'A',
                  'q2': 'B',
                  'q3': 'C',
                  'q4': 'A',
                  'q5': 'B'
                },
                time_spent: 25
              }
            },
            status: 'submitted'
          };
          break;
          
        case 'file_upload':
          submissionData = {
            assignment_id: assignment.id,
            content: {
              file_upload: [
                {
                  filename: 'project_report.pdf',
                  size: 1024000,
                  type: 'application/pdf',
                  url: 'https://example.com/project_report.pdf'
                }
              ]
            },
            status: 'submitted'
          };
          break;
          
        default:
          submissionData = {
            assignment_id: assignment.id,
            content: {
              text: 'Default submission content'
            },
            status: 'submitted'
          };
      }

      // Create submission
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
        console.log(`   ✅ Submission created successfully!`);
        console.log(`   🆔 Submission ID: ${submission.id}`);
        console.log(`   📊 Status: ${submission.status}`);
        console.log(`   📝 Type: ${assignment.type}`);
      } else {
        const error = await submissionResponse.text();
        console.log(`   ❌ Error creating submission: ${error}`);
      }
    }

    // 4. List student's submissions
    console.log('\n6. Listing student submissions...');
    const submissionsResponse = await fetch(`${API_BASE}/submissions`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (submissionsResponse.ok) {
      const submissions = await submissionsResponse.json();
      console.log(`   ✅ Found ${submissions.length} submissions`);
      submissions.forEach((submission, index) => {
        console.log(`   ${index + 1}. Assignment: ${submission.assignment?.title || 'Unknown'} - Status: ${submission.status}`);
      });
    } else {
      console.log(`   ❌ Error getting submissions: ${submissionsResponse.status}`);
    }

    console.log('\n🎉 Student Submission Workflow Test Complete!');

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

testStudentSubmissionWorkflow()
