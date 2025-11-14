-- =====================================================
-- MIGRATION 02: Add email columns to live class tables
-- =====================================================
-- This adds NEW columns alongside existing UUID columns
-- We keep both for now to avoid breaking anything

-- Step 1: Add teacher_email to live_classes
ALTER TABLE live_classes 
ADD COLUMN IF NOT EXISTS teacher_email TEXT;

-- Step 2: Populate teacher_email from existing teacher_id
-- This looks up the email from user_profiles using the UUID
UPDATE live_classes lc
SET teacher_email = up.email
FROM user_profiles up
WHERE lc.teacher_id = up.id
AND lc.teacher_email IS NULL;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_live_classes_teacher_email ON live_classes(teacher_email);

-- Verify migration
SELECT 
  COUNT(*) AS total_classes,
  COUNT(teacher_id) AS has_teacher_id,
  COUNT(teacher_email) AS has_teacher_email,
  COUNT(*) FILTER (WHERE teacher_email IS NULL) AS missing_email
FROM live_classes;

-- Show sample data
SELECT id, teacher_id, teacher_email, title 
FROM live_classes 
LIMIT 5;

