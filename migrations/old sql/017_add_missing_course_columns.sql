-- Add missing columns to courses table
-- This fixes various database schema errors for course creation

-- Add allow_discussions column
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS allow_discussions BOOLEAN DEFAULT true;

-- Add default_duration column
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS default_duration INTEGER DEFAULT 60;

-- Add course_mode column
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS course_mode VARCHAR(50) DEFAULT 'normal';

-- Add thumbnail_url column
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add teacher_name column (used in public course endpoint)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN courses.allow_discussions IS 'Whether students can create discussions in this course';
COMMENT ON COLUMN courses.default_duration IS 'Default duration for course sessions in minutes';
COMMENT ON COLUMN courses.course_mode IS 'Course mode: normal, public, etc.';
COMMENT ON COLUMN courses.thumbnail_url IS 'URL for course thumbnail image';
COMMENT ON COLUMN courses.teacher_name IS 'Display name of the course teacher';

-- Update existing courses to have proper default values
UPDATE courses 
SET 
  allow_discussions = COALESCE(allow_discussions, true),
  default_duration = COALESCE(default_duration, 60),
  course_mode = COALESCE(course_mode, 'normal')
WHERE 
  allow_discussions IS NULL 
  OR default_duration IS NULL 
  OR course_mode IS NULL;

-- Update teacher_name from teachers table if not set
UPDATE courses 
SET teacher_name = CONCAT(t.first_name, ' ', t.last_name)
FROM teachers t
WHERE courses.teacher_email = t.email 
  AND courses.teacher_name IS NULL;
