// Script to create certificates table using direct SQL
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://nasikwatndaxsgemnylp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2lrd2F0bmRheHNnZW1ueWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2NzgwNiwiZXhwIjoyMDcwMzQzODA2fQ.FnwWpdeUmWP8U2O1QA3cdav2I0SVN0BZDcBr82da4hs'

const supabase = createClient(supabaseUrl, supabaseKey)

const createCertificatesTable = async () => {
  console.log('=== Creating Certificates Table ===')
  
  try {
    // First, let's check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('certificates')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      console.log('✅ Certificates table already exists!')
      return
    }
    
    console.log('Table does not exist, creating...')
    
    // Since we can't use exec_sql, let's try to create a simple table structure
    // by inserting a test record and letting Supabase create the table
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        student_email: 'test@example.com',
        course_id: '00000000-0000-0000-0000-000000000000',
        student_name: 'Test Student',
        course_title: 'Test Course',
        completion_date: new Date().toISOString(),
        certificate_data: 'test-data'
      })
    
    if (error) {
      console.error('Error creating certificates table:', error)
      console.log('You may need to create the table manually in Supabase dashboard')
      console.log('SQL to run in Supabase SQL Editor:')
      console.log(`
        CREATE TABLE IF NOT EXISTS certificates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          student_email TEXT NOT NULL,
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          student_name TEXT NOT NULL,
          course_title TEXT NOT NULL,
          completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
          certificate_data TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(student_email, course_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_certificates_student_email ON certificates(student_email);
        CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
        
        ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Students can view own certificates" ON certificates
          FOR SELECT USING (student_email = auth.jwt() ->> 'email');
        
        CREATE POLICY "Students can create own certificates" ON certificates
          FOR INSERT WITH CHECK (student_email = auth.jwt() ->> 'email');
        
        CREATE POLICY "Teachers can view course certificates" ON certificates
          FOR SELECT USING (
            course_id IN (
              SELECT id FROM courses 
              WHERE teacher_email = auth.jwt() ->> 'email'
            )
          );
      `)
      return
    }
    
    console.log('✅ Certificates table created successfully!')
    
    // Clean up the test record
    await supabase
      .from('certificates')
      .delete()
      .eq('student_email', 'test@example.com')
    
    console.log('✅ Test record cleaned up')
    
  } catch (error) {
    console.error('Failed to create certificates table:', error)
  }
}

// Run the script
createCertificatesTable()
