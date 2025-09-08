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

async function debugInvitesSchema() {
  try {
    console.log('🔍 Debugging invites table schema...')
    
    // Get the actual invites data to see what columns exist
    const { data: invites, error } = await supabase
      .from('invites')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error fetching invites:', error)
      return
    }
    
    if (invites && invites.length > 0) {
      console.log('📋 Invites table columns (from actual data):')
      const invite = invites[0]
      Object.keys(invite).forEach(key => {
        console.log(`  - ${key}: ${typeof invite[key]} = ${invite[key]}`)
      })
    } else {
      console.log('❌ No invites found to check schema')
    }
    
    // Also check the actual invites we found earlier
    console.log('\n🔍 Checking the broken invites...')
    const { data: allInvites } = await supabase
      .from('invites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (allInvites && allInvites.length > 0) {
      allInvites.forEach((invite, index) => {
        console.log(`\n📨 Invite ${index + 1}:`)
        Object.keys(invite).forEach(key => {
          console.log(`  - ${key}: ${invite[key]}`)
        })
      })
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugInvitesSchema()
