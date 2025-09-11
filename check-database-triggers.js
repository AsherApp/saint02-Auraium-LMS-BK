// Check database triggers
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function checkDatabaseTriggers() {
  console.log('🔍 Checking Database Triggers...\n');

  try {
    // 1. Check triggers on submissions table
    console.log('1. Checking triggers on submissions table...');
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'submissions');

    if (triggersError) {
      console.log(`   ❌ Error getting triggers: ${triggersError.message}`);
    } else {
      console.log(`   ✅ Found ${triggers.length} triggers on submissions table:`);
      triggers.forEach(trigger => {
        console.log(`      - ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`);
        console.log(`        Action: ${trigger.action_statement}`);
      });
    }

    // 2. Check if there are any functions that might be causing the issue
    console.log('\n2. Checking functions that might reference course_id...');
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('*')
      .ilike('routine_definition', '%course_id%');

    if (functionsError) {
      console.log(`   ❌ Error getting functions: ${functionsError.message}`);
    } else {
      console.log(`   ✅ Found ${functions.length} functions that reference course_id:`);
      functions.forEach(func => {
        console.log(`      - ${func.routine_name}: ${func.routine_type}`);
      });
    }

    // 3. Check the actual submissions table structure
    console.log('\n3. Checking submissions table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'submissions')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.log(`   ❌ Error getting columns: ${columnsError.message}`);
    } else {
      console.log(`   ✅ Submissions table columns:`);
      columns.forEach(column => {
        console.log(`      - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
      });
    }

    // 4. Check if there are any constraints that might be causing issues
    console.log('\n4. Checking constraints on submissions table...');
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'submissions')
      .eq('table_schema', 'public');

    if (constraintsError) {
      console.log(`   ❌ Error getting constraints: ${constraintsError.message}`);
    } else {
      console.log(`   ✅ Found ${constraints.length} constraints on submissions table:`);
      constraints.forEach(constraint => {
        console.log(`      - ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`);
  }
}

checkDatabaseTriggers()
