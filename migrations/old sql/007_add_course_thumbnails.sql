-- Add thumbnail support to courses table
-- This allows courses to have visual thumbnails for better UI

-- Add thumbnail_url field to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN courses.thumbnail_url IS 'URL to course thumbnail image for visual representation';

-- Add index for faster lookups (optional, for future queries)
CREATE INDEX IF NOT EXISTS idx_courses_thumbnail ON courses(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
