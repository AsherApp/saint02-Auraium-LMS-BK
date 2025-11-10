-- Migration: 038_fix_live_class_recordings_rls.sql
-- Description: Fixes RLS policies for live_class_recordings to work with teachers/students schema

-- Drop existing broken policies
DROP POLICY IF EXISTS teachers_manage_recordings ON live_class_recordings;
DROP POLICY IF EXISTS students_view_recordings ON live_class_recordings;
DROP POLICY IF EXISTS admins_view_all_recordings ON live_class_recordings;

-- RLS Policy for Teachers:
-- Teachers can view, insert, update, and delete recordings for their own live classes
CREATE POLICY "Teachers can manage their live class recordings" ON live_class_recordings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM live_classes lc
    INNER JOIN teachers t ON t.id = lc.teacher_id
    WHERE lc.id = live_class_id
    AND t.email = current_setting('request.jwt.claims', true)::json->>'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM live_classes lc
    INNER JOIN teachers t ON t.id = lc.teacher_id
    WHERE lc.id = live_class_id
    AND t.email = current_setting('request.jwt.claims', true)::json->>'email'
  )
);

-- RLS Policy for Students:
-- Students can view recordings for live classes they are enrolled in (through enrollments)
CREATE POLICY "Students can view recordings for enrolled courses" ON live_class_recordings
FOR SELECT
TO authenticated
USING (
  -- Students can see recordings if the live class is linked to a course they're enrolled in
  EXISTS (
    SELECT 1
    FROM live_classes lc
    INNER JOIN enrollments e ON lc.course_id = e.course_id
    INNER JOIN students s ON s.id = e.student_id
    WHERE lc.id = live_class_id
    AND s.email = current_setting('request.jwt.claims', true)::json->>'email'
    AND lc.status IN ('PAST', 'ONGOING')  -- Only show recordings for past or ongoing classes
    AND lc.recording_available_for_students = true
  )
  OR
  -- Also allow access to recordings for general classes (no specific course)
  -- For general classes, check if student exists in the system
  EXISTS (
    SELECT 1
    FROM live_classes lc
    WHERE lc.id = live_class_id
    AND lc.course_id IS NULL
    AND lc.status IN ('PAST', 'ONGOING')
    AND lc.recording_available_for_students = true
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  )
);
