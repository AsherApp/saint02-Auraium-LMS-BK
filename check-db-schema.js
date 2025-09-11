import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseSchema() {
  console.log('=== CHECKING CURRENT DATABASE SCHEMA ===\n')
  
  try {
    // Check assignments table structure
    console.log('1. ASSIGNMENTS TABLE STRUCTURE:')
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1)
    
    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
    } else {
      console.log('Assignments columns:', Object.keys(assignmentsData[0] || {}))
      if (assignmentsData[0]) {
        console.log('Sample assignment data:', JSON.stringify(assignmentsData[0], null, 2))
      }
    }
    
    console.log('\n2. SUBMISSIONS TABLE STRUCTURE:')
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .limit(1)
    
    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError)
    } else {
      console.log('Submissions columns:', Object.keys(submissionsData[0] || {}))
      if (submissionsData[0]) {
        console.log('Sample submission data:', JSON.stringify(submissionsData[0], null, 2))
      }
    }
    
    console.log('\n3. CHECKING FOR GRADES TABLE:')
    const { data: gradesData, error: gradesError } = await supabase
      .from('grades')
      .select('*')
      .limit(1)
    
    if (gradesError) {
      console.log('Grades table does not exist or has no data:', gradesError.message)
    } else {
      console.log('Grades columns:', Object.keys(gradesData[0] || {}))
      if (gradesData[0]) {
        console.log('Sample grade data:', JSON.stringify(gradesData[0], null, 2))
      }
    }
    
    console.log('\n4. CHECKING FOR ASSIGNMENT TYPES TABLE:')
    const { data: typesData, error: typesError } = await supabase
      .from('assignment_types')
      .select('*')
      .limit(5)
    
    if (typesError) {
      console.log('Assignment types table does not exist or has no data:', typesError.message)
    } else {
      console.log('Assignment types:', typesData)
    }
    
    console.log('\n5. CHECKING FOR TRIGGERS:')
    const { data: triggersData, error: triggersError } = await supabase
      .rpc('get_triggers')
      .catch(() => ({ data: null, error: { message: 'Function not available' } }))
    
    if (triggersError) {
      console.log('Cannot check triggers:', triggersError.message)
    } else {
      console.log('Database triggers:', triggersData)
    }
    
  } catch (error) {
    console.error('Error checking database schema:', error)
  }
}

checkDatabaseSchema()
