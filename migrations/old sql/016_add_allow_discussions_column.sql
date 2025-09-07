-- Add allow_discussions column to courses table
-- This fixes the error: "Could not find the 'allow_discussions' column of 'courses' in the schema cache"

-- Add the allow_discussions column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS allow_discussions BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN courses.allow_discussions IS 'Whether students can create discussions in this course';

-- Update existing courses to have allow_discussions set to true by default
UPDATE courses 
SET allow_discussions = true 
WHERE allow_discussions IS NULL;
