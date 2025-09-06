-- =====================================================
-- FIX LIVE_PARTICIPANTS EMAIL COLUMN ERROR
-- =====================================================
-- This migration fixes the "column live_participants.email does not exist" error
-- by ensuring all RLS policies and functions use the correct column name 'student_email'

-- Drop any existing policies that might reference the wrong column
DROP POLICY IF EXISTS live_participants_rw ON live_participants;
DROP POLICY IF EXISTS "Students can manage their own participation" ON live_participants;
DROP POLICY IF EXISTS "Teachers can view participants for their live sessions" ON live_participants;

-- Recreate the policies with the correct column name
CREATE POLICY "Students can manage their own participation" ON live_participants
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Teachers can view participants for their live sessions" ON live_participants
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM live_sessions 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Also create a general policy for all operations
CREATE POLICY live_participants_rw ON live_participants FOR ALL USING (
  EXISTS(SELECT 1 FROM live_sessions s WHERE s.id = live_participants.session_id AND (is_course_teacher(s.course_id) OR lower(live_participants.student_email) = lower(auth.email())))
) WITH CHECK (
  EXISTS(SELECT 1 FROM live_sessions s WHERE s.id = live_participants.session_id AND (is_course_teacher(s.course_id) OR lower(live_participants.student_email) = lower(auth.email())))
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This fixes the "column live_participants.email does not exist" error
-- by updating all RLS policies to use the correct column name 'student_email'
-- =====================================================
