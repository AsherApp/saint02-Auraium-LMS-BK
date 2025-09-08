import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function debugAllCourses() {
  try {
    console.log('🔍 Debugging all courses in the system...')
    
    // Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (coursesError) {
      console.error('❌ Error fetching courses:', coursesError)
      return
    }
    
    console.log('📚 Total courses found:', courses?.length || 0)
    
    if (courses && courses.length > 0) {
      courses.forEach((course, index) => {
        console.log(`\n📖 Course ${index + 1}:`)
        console.log('  - Course ID:', course.id)
        console.log('  - Course Title:', course.title)
        console.log('  - Course Mode:', course.course_mode || 'NULL')
        console.log('  - Status:', course.status)
        console.log('  - Teacher Email:', course.teacher_email)
        console.log('  - Visibility:', course.visibility)
        console.log('  - Enrollment Policy:', course.enrollment_policy)
        console.log('  - Created At:', course.created_at)
      })
      
      // Count by course mode
      const modeCounts = courses.reduce((acc, course) => {
        const mode = course.course_mode || 'NULL'
        acc[mode] = (acc[mode] || 0) + 1
        return acc
      }, {})
      
      console.log('\n📊 Course Mode Distribution:')
      Object.entries(modeCounts).forEach(([mode, count]) => {
        console.log(`  - ${mode}: ${count} courses`)
      })
      
      // Check if any courses are missing course_mode
      const nullModeCourses = courses.filter(course => !course.course_mode)
      if (nullModeCourses.length > 0) {
        console.log('\n⚠️  Courses with NULL course_mode:')
        nullModeCourses.forEach(course => {
          console.log(`  - ${course.title} (ID: ${course.id})`)
        })
      }
      
    } else {
      console.log('❌ No courses found in the system')
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugAllCourses()
