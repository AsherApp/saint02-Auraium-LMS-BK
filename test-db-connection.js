// Simple database connection test
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function testDatabase() {
  console.log('🧪 Testing Database Connection...\n')

  try {
    // Test 1: Check if we can connect to the database
    console.log('1. Testing database connection...')
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`)
      return
    }
    console.log('   ✅ Database connection successful')

    // Test 2: Check if assignments table exists
    console.log('\n2. Testing assignments table...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id')
      .limit(1)

    if (assignmentsError) {
      console.log(`   ❌ Assignments table error: ${assignmentsError.message}`)
    } else {
      console.log('   ✅ Assignments table accessible')
    }

    // Test 3: Check if users table exists
    console.log('\n3. Testing users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5)

    if (usersError) {
      console.log(`   ❌ Users table error: ${usersError.message}`)
    } else {
      console.log(`   ✅ Users table accessible (${users.length} users found)`)
      if (users.length > 0) {
        console.log('   📋 Existing users:')
        users.forEach(user => {
          console.log(`      - ${user.email} (${user.role})`)
        })
      }
    }

    // Test 4: Check if courses table exists
    console.log('\n4. Testing courses table...')
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, teacher_email')
      .limit(5)

    if (coursesError) {
      console.log(`   ❌ Courses table error: ${coursesError.message}`)
    } else {
      console.log(`   ✅ Courses table accessible (${courses.length} courses found)`)
      if (courses.length > 0) {
        console.log('   📋 Existing courses:')
        courses.forEach(course => {
          console.log(`      - ${course.title} (${course.teacher_email})`)
        })
      }
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`)
  }
}

testDatabase()
