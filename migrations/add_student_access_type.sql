-- Add access_type column to enrollments table
-- This allows per-student access control (full or simplified)

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'full' CHECK (access_type IN ('full', 'simplified'));

-- Add comment to document the field
COMMENT ON COLUMN enrollments.access_type IS 'Student access level: full (all features) or simplified (view only)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_enrollments_access_type ON enrollments(access_type);

