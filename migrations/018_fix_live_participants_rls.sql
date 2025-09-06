-- =====================================================
-- FIX LIVE_PARTICIPANTS RLS POLICY
-- =====================================================
-- This migration fixes the RLS policy for live_participants table
-- to use the correct column name 'student_email' instead of 'email'

-- Drop the existing policy
DROP POLICY IF EXISTS live_participants_rw ON live_participants;

-- Recreate the policy with the correct column name
CREATE POLICY live_participants_rw ON live_participants FOR ALL USING (
  EXISTS(SELECT 1 FROM live_sessions s WHERE s.id = live_participants.session_id AND (is_course_teacher(s.course_id) OR lower(live_participants.student_email) = lower(auth.email())))
) WITH CHECK (
  EXISTS(SELECT 1 FROM live_sessions s WHERE s.id = live_participants.session_id AND (is_course_teacher(s.course_id) OR lower(live_participants.student_email) = lower(auth.email())))
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This fixes the "column live_participants.email does not exist" error
-- by updating the RLS policy to use the correct column name 'student_email'
-- =====================================================
