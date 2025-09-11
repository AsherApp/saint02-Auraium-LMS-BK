// Debug the student assignment route
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

async function debugStudentRoute() {
  console.log('🔍 Debugging Student Assignment Route...\n');

  try {
    // 1. Test the exact query from the student route
    console.log('1. Testing the exact query from the student route...');
    
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        course_id,
        courses!inner(
          id,
          title,
          teacher_email
        )
      `)
      .eq('student_email', 'teststudent@example.com')
      .eq('status', 'active');

    if (enrollmentError) {
      console.log(`   ❌ Enrollment query error: ${enrollmentError.message}`);
      return;
    }

    console.log(`   ✅ Found ${enrollments.length} enrollments`);
    enrollments.forEach((enrollment, index) => {
      console.log(`      ${index + 1}. Course: ${enrollment.courses?.title} (ID: ${enrollment.course_id})`);
    });

    if (enrollments.length === 0) {
      console.log('   ❌ No enrollments found - this is the problem!');
      return;
    }

    const courseIds = enrollments.map(e => e.course_id);
    console.log(`   📋 Course IDs: ${courseIds.join(', ')}`);

    // 2. Test the assignments query
    console.log('\n2. Testing the assignments query...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        instructions,
        type,
        scope,
        points,
        due_at,
        available_from,
        available_until,
        allow_late_submissions,
        late_penalty_percent,
        max_attempts,
        time_limit_minutes,
        require_rubric,
        rubric,
        resources,
        settings,
        status,
        created_at,
        updated_at,
        courses!inner(
          id,
          title,
          teacher_email
        )
      `)
      .in('course_id', courseIds)
      .eq('status', 'active')
      .order('due_at', { ascending: true });

    if (assignmentsError) {
      console.log(`   ❌ Assignments query error: ${assignmentsError.message}`);
      return;
    }

    console.log(`   ✅ Found ${assignments.length} assignments`);
    assignments.forEach((assignment, index) => {
      console.log(`      ${index + 1}. ${assignment.title} (${assignment.type}) - Course: ${assignment.courses?.title}`);
    });

    // 3. Test the submissions query
    console.log('\n3. Testing the submissions query...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        assignment_id,
        status,
        grade,
        feedback,
        attempt_number,
        submitted_at,
        graded_at
      `)
      .eq('student_email', 'teststudent@example.com')
      .in('assignment_id', assignments?.map(a => a.id) || []);

    if (submissionsError) {
      console.log(`   ❌ Submissions query error: ${submissionsError.message}`);
    } else {
      console.log(`   ✅ Found ${submissions.length} submissions`);
      submissions.forEach((submission, index) => {
        console.log(`      ${index + 1}. Assignment: ${submission.assignment_id} - Status: ${submission.status}`);
      });
    }

    // 4. Test the combined result
    console.log('\n4. Testing the combined result...');
    const assignmentsWithSubmissions = (assignments || []).map(assignment => {
      const submission = submissions?.find(s => s.assignment_id === assignment.id);
      return {
        ...assignment,
        submission: submission || null,
        submission_status: submission?.status || 'not_started',
        grade: submission?.grade || null,
        feedback: submission?.feedback || null,
        attempt_number: submission?.attempt_number || 0,
        submitted_at: submission?.submitted_at || null,
        graded_at: submission?.graded_at || null
      };
    });

    console.log(`   ✅ Combined result: ${assignmentsWithSubmissions.length} assignments with submission data`);
    assignmentsWithSubmissions.forEach((assignment, index) => {
      console.log(`      ${index + 1}. ${assignment.title} - Submission Status: ${assignment.submission_status}`);
    });

    // 5. Test the API endpoint directly
    console.log('\n5. Testing the API endpoint directly...');
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

    // 6. Check if there's a route conflict
    console.log('\n6. Checking for route conflicts...');
    const regularAssignmentsResponse = await fetch(`${API_BASE}/assignments`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Regular assignments status: ${regularAssignmentsResponse.status}`);
    const regularResult = await regularAssignmentsResponse.text();
    console.log(`   Regular assignments response: ${regularResult}`);

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

debugStudentRoute()
