-- Add public mode support for courses
-- This allows courses to be marked as "public" for restricted student access

-- Add course_mode field to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_mode TEXT DEFAULT 'normal';

-- Add comment to explain the field
COMMENT ON COLUMN courses.course_mode IS 'Course access mode: normal (full LMS features) or public (restricted student experience)';

-- Create certificates table for course completion certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_path TEXT NOT NULL,
  student_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  completion_date TIMESTAMPTZ NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_email, course_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_certificates_student_course ON certificates(student_email, course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);

-- Add comment to explain the table
COMMENT ON TABLE certificates IS 'Stores generated course completion certificates for students';

-- Note: RLS is not enabled for certificates table since we use custom JWT authentication
-- Access control is handled at the application level in the backend routes

-- Add course completion tracking
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Add comment to explain the new fields
COMMENT ON COLUMN enrollments.completed_at IS 'Timestamp when student completed the course';
COMMENT ON COLUMN enrollments.completion_percentage IS 'Percentage of course content completed by student';
