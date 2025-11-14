-- =====================================================
-- MIGRATION 04: Add student_email to live_class_attendance
-- =====================================================
-- Adds email column while keeping student_id for safety

-- Step 1: Add student_email column
ALTER TABLE live_class_attendance 
ADD COLUMN IF NOT EXISTS student_email TEXT;

-- Step 2: Populate student_email from student_id
-- Look up email from user_profiles using UUID
UPDATE live_class_attendance lca
SET student_email = up.email
FROM user_profiles up
WHERE lca.student_id = up.id
AND lca.student_email IS NULL
AND lca.student_id IS NOT NULL;

-- Step 3: Add index
CREATE INDEX IF NOT EXISTS idx_live_class_attendance_student_email ON live_class_attendance(student_email);

-- Verify migration
SELECT 
  COUNT(*) AS total_attendance_records,
  COUNT(student_id) AS has_student_id,
  COUNT(student_email) AS has_student_email,
  COUNT(*) FILTER (WHERE student_email IS NULL) AS missing_email
FROM live_class_attendance;

-- Show sample data
SELECT id, student_id, student_email, live_class_id, join_time, leave_time, duration_minutes
FROM live_class_attendance 
LIMIT 10;

