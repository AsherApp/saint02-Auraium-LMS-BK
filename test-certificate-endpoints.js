// Test script to verify certificate endpoints
const testCertificateEndpoints = async () => {
  console.log('=== Testing Certificate Endpoints ===')
  
  // Test student credentials
  const studentCode = 'MD25090701' // Mensa Dude's student code
  const password = 'Taptap123'
  
  try {
    // 1. Test student login
    console.log('1. Testing student login...')
    const loginResponse = await fetch('https://auraiumlmsbk.up.railway.app/api/auth/student/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_code: studentCode,
        password: password
      })
    })
    
    const loginData = await loginResponse.json()
    console.log('Login response status:', loginResponse.status)
    
    if (!loginData.token) {
      console.error('Login failed:', loginData)
      return
    }
    
    const token = loginData.token
    console.log('✅ Login successful')
    
    // 2. Test progress endpoint
    console.log('\n2. Testing /api/students/me/progress endpoint...')
    const progressResponse = await fetch('https://auraiumlmsbk.up.railway.app/api/students/me/progress', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
    
    const progressData = await progressResponse.json()
    console.log('Progress response status:', progressResponse.status)
    console.log('Progress data:', JSON.stringify(progressData, null, 2))
    
    if (progressResponse.ok) {
      console.log('✅ Progress endpoint working')
    } else {
      console.error('❌ Progress endpoint failed:', progressData)
    }
    
    // 3. Test certificate generation endpoint
    console.log('\n3. Testing /api/certificates/generate endpoint...')
    const generateResponse = await fetch('https://auraiumlmsbk.up.railway.app/api/certificates/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_id: 'ed43d452-ebfc-42a4-9478-56921123e696', // Introduction to Programming course
        student_email: 'lxbrw23+10@gmail.com',
        student_name: 'Mensa Dude',
        completion_date: new Date().toISOString()
      })
    })
    
    const generateData = await generateResponse.json()
    console.log('Generate response status:', generateResponse.status)
    console.log('Generate data:', JSON.stringify(generateData, null, 2))
    
    if (generateResponse.ok) {
      console.log('✅ Certificate generation endpoint working')
    } else {
      console.error('❌ Certificate generation endpoint failed:', generateData)
    }
    
    // 4. Test certificate list endpoint
    console.log('\n4. Testing /api/certificates endpoint...')
    const listResponse = await fetch('https://auraiumlmsbk.up.railway.app/api/certificates', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
    
    const listData = await listResponse.json()
    console.log('List response status:', listResponse.status)
    console.log('List data:', JSON.stringify(listData, null, 2))
    
    if (listResponse.ok) {
      console.log('✅ Certificate list endpoint working')
    } else {
      console.error('❌ Certificate list endpoint failed:', listData)
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testCertificateEndpoints()
