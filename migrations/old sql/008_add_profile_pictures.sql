-- Add profile picture support to students and teachers tables

-- Add profile picture URL to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
COMMENT ON COLUMN students.profile_picture_url IS 'URL to student profile picture';

-- Add profile picture URL to teachers table  
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
COMMENT ON COLUMN teachers.profile_picture_url IS 'URL to teacher profile picture';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_profile_picture ON students(profile_picture_url) WHERE profile_picture_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_profile_picture ON teachers(profile_picture_url) WHERE profile_picture_url IS NOT NULL;

-- Update RLS policies to allow users to update their own profile pictures
-- Students can update their own profile picture
CREATE POLICY "Students can update their own profile picture" ON students
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can update their own profile picture  
CREATE POLICY "Teachers can update their own profile picture" ON teachers
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');
