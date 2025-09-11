// Check enrollments table schema
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function checkEnrollmentsSchema() {
  console.log('🔍 Checking Enrollments Table Schema...\n')
  
  try {
    // Get existing enrollments to see the structure
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ Error: ${error.message}`)
    } else if (enrollments.length > 0) {
      console.log('📋 Existing enrollment structure:')
      console.log(JSON.stringify(enrollments[0], null, 2))
    } else {
      console.log('📋 No enrollments found, checking table structure...')
      
      // Try to insert a minimal enrollment to see what's required
      const { data: testEnrollment, error: testError } = await supabase
        .from('enrollments')
        .insert({
          student_email: 'test@example.com',
          course_id: 'test-course-id'
        })
        .select()
      
      if (testError) {
        console.log(`❌ Test insert error: ${testError.message}`)
      } else {
        console.log('✅ Test enrollment created successfully')
        console.log(JSON.stringify(testEnrollment[0], null, 2))
        
        // Clean up
        await supabase
          .from('enrollments')
          .delete()
          .eq('id', testEnrollment[0].id)
      }
    }
    
  } catch (err) {
    console.log(`❌ Unexpected error: ${err.message}`)
  }
}

checkEnrollmentsSchema()
