// Script to create certificates table
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://nasikwatndaxsgemnylp.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hc2lrd2F0bmRheHNnZW1ueWxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2NzgwNiwiZXhwIjoyMDcwMzQzODA2fQ.FnwWpdeUmWP8U2O1QA3cdav2I0SVN0BZDcBr82da4hs'

const supabase = createClient(supabaseUrl, supabaseKey)

const createCertificatesTable = async () => {
  console.log('=== Creating Certificates Table ===')
  
  try {
    // Create certificates table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS certificates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          student_email TEXT NOT NULL,
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          student_name TEXT NOT NULL,
          course_title TEXT NOT NULL,
          completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
          certificate_data TEXT NOT NULL, -- Base64 encoded PDF
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Ensure one certificate per student per course
          UNIQUE(student_email, course_id)
        );
        
        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_certificates_student_email ON certificates(student_email);
        CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
        
        -- Enable RLS
        ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies
        -- Students can only see their own certificates
        CREATE POLICY "Students can view own certificates" ON certificates
          FOR SELECT USING (student_email = auth.jwt() ->> 'email');
        
        -- Students can only insert their own certificates
        CREATE POLICY "Students can create own certificates" ON certificates
          FOR INSERT WITH CHECK (student_email = auth.jwt() ->> 'email');
        
        -- Teachers can view certificates for their courses
        CREATE POLICY "Teachers can view course certificates" ON certificates
          FOR SELECT USING (
            course_id IN (
              SELECT id FROM courses 
              WHERE teacher_email = auth.jwt() ->> 'email'
            )
          );
        
        -- Add updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_certificates_updated_at 
          BEFORE UPDATE ON certificates 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      `
    })
    
    if (error) {
      console.error('Error creating certificates table:', error)
      return
    }
    
    console.log('✅ Certificates table created successfully!')
    console.log('✅ RLS policies created')
    console.log('✅ Indexes created')
    console.log('✅ Triggers created')
    
  } catch (error) {
    console.error('Failed to create certificates table:', error)
  }
}

// Run the script
createCertificatesTable()
