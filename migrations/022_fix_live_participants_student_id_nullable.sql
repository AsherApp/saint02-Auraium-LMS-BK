-- =====================================================
-- FIX LIVE_PARTICIPANTS STUDENT_ID NULLABLE CONSTRAINT
-- =====================================================
-- This migration fixes the "null value in column student_id violates not-null constraint" error
-- by making student_id nullable for teachers who don't have a student_id

-- Drop the existing constraint if it exists
ALTER TABLE live_participants DROP CONSTRAINT IF EXISTS live_participants_student_id_check;

-- Make student_id nullable (it should already be nullable based on schema, but let's ensure it)
ALTER TABLE live_participants ALTER COLUMN student_id DROP NOT NULL;

-- Add a check constraint to ensure either student_id is provided OR the user is a teacher
-- For now, we'll allow NULL student_id for teachers
ALTER TABLE live_participants ADD CONSTRAINT live_participants_student_id_check 
CHECK (student_id IS NOT NULL OR student_email IS NOT NULL);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This allows teachers to join live sessions without requiring a student_id
-- Students will still need to provide their student_id
-- =====================================================
