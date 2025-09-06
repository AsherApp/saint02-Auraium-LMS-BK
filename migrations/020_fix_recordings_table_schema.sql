-- =====================================================
-- FIX RECORDINGS TABLE SCHEMA
-- =====================================================
-- This migration adds missing columns to the recordings table
-- that the backend API expects but are missing from the current schema

-- Add missing columns to recordings table
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS teacher_email TEXT REFERENCES teachers(email) ON DELETE CASCADE;
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN recordings.course_id IS 'Course this recording belongs to';
COMMENT ON COLUMN recordings.teacher_email IS 'Email of the teacher who created this recording';
COMMENT ON COLUMN recordings.teacher_name IS 'Name of the teacher who created this recording';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This adds the missing columns that the backend API expects:
-- - course_id: Links recording to a specific course
-- - teacher_email: Links recording to the teacher who created it
-- - teacher_name: Cached teacher name for performance
-- =====================================================
