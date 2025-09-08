import { supabaseAdmin } from './src/lib/supabase.ts'

async function fixTeacherNames() {
  try {
    console.log('🔍 Checking current teacher names...')
    
    // Get all teachers
    const { data: teachers, error: fetchError } = await supabaseAdmin
      .from('teachers')
      .select('id, email, first_name, last_name')
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      console.error('Error fetching teachers:', fetchError)
      return
    }
    
    console.log(`Found ${teachers.length} teachers:`)
    teachers.forEach(teacher => {
      console.log(`- ${teacher.email}: "${teacher.first_name}" "${teacher.last_name}"`)
    })
    
    // Fix teachers with incorrect names
    const teachersToFix = teachers.filter(teacher => {
      // Check if first_name looks like an email prefix (contains numbers/random chars)
      const hasRandomFirstName = teacher.first_name && /^[a-z0-9]+$/.test(teacher.first_name) && teacher.first_name.length < 10
      const hasDefaultLastName = teacher.last_name === 'User'
      const hasEmptyNames = !teacher.first_name || !teacher.last_name
      
      return hasRandomFirstName || hasDefaultLastName || hasEmptyNames
    })
    
    if (teachersToFix.length === 0) {
      console.log('✅ All teacher names look correct!')
      return
    }
    
    console.log(`\n🔧 Found ${teachersToFix.length} teachers with incorrect names:`)
    teachersToFix.forEach(teacher => {
      console.log(`- ${teacher.email}: "${teacher.first_name}" "${teacher.last_name}"`)
    })
    
    // Update teachers with proper names
    for (const teacher of teachersToFix) {
      const emailPrefix = teacher.email.split('@')[0]
      const newFirstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
      const newLastName = 'Teacher'
      
      console.log(`\n📝 Updating ${teacher.email}:`)
      console.log(`  From: "${teacher.first_name}" "${teacher.last_name}"`)
      console.log(`  To: "${newFirstName}" "${newLastName}"`)
      
      const { error: updateError } = await supabaseAdmin
        .from('teachers')
        .update({
          first_name: newFirstName,
          last_name: newLastName
        })
        .eq('id', teacher.id)
      
      if (updateError) {
        console.error(`❌ Error updating ${teacher.email}:`, updateError)
      } else {
        console.log(`✅ Successfully updated ${teacher.email}`)
      }
    }
    
    console.log('\n🎉 Teacher name fix completed!')
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...')
    const { data: updatedTeachers, error: verifyError } = await supabaseAdmin
      .from('teachers')
      .select('id, email, first_name, last_name')
      .order('created_at', { ascending: true })
    
    if (verifyError) {
      console.error('Error verifying teachers:', verifyError)
      return
    }
    
    console.log('Updated teacher names:')
    updatedTeachers.forEach(teacher => {
      console.log(`- ${teacher.email}: "${teacher.first_name}" "${teacher.last_name}"`)
    })
    
  } catch (error) {
    console.error('Error fixing teacher names:', error)
  }
}

fixTeacherNames()
