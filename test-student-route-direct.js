// Test the student route directly
const API_BASE = 'http://localhost:4000/api';

const TEST_STUDENT = {
  student_code: 'TEST123',
  password: 'password123'
};

async function testStudentRouteDirect() {
  console.log('🧪 Testing Student Route Directly...\n');

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

    // 2. Test different route variations
    console.log('\n2. Testing different route variations...');
    
    const routes = [
      '/assignments/student',
      '/assignments/student/',
      '/assignments?student=true',
      '/assignments?role=student'
    ];

    for (const route of routes) {
      console.log(`\n   Testing route: ${route}`);
      const response = await fetch(`${API_BASE}${route}`, {
        headers: {
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status}`);
      const result = await response.text();
      console.log(`   Response: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
    }

    // 3. Test with different HTTP methods
    console.log('\n3. Testing with different HTTP methods...');
    
    const methods = ['GET', 'POST', 'PUT'];
    for (const method of methods) {
      console.log(`\n   Testing ${method} method:`);
      const response = await fetch(`${API_BASE}/assignments/student`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   Status: ${response.status}`);
      const result = await response.text();
      console.log(`   Response: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
    }

    // 4. Test the route with curl equivalent
    console.log('\n4. Testing with curl equivalent...');
    const curlCommand = `curl -X GET "${API_BASE}/assignments/student" -H "Authorization: Bearer ${studentToken}" -H "Content-Type: application/json"`;
    console.log(`   Command: ${curlCommand}`);

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

testStudentRouteDirect()
