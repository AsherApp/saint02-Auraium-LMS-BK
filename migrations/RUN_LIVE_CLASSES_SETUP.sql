-- =============================================================================
-- COMPLETE LIVE CLASSES SYSTEM SETUP
-- =============================================================================
-- Run this file in Supabase SQL Editor to set up the entire live classes system
-- Combines migrations 028-039
-- =============================================================================

-- Migration 028: Create live_classes table
CREATE TABLE IF NOT EXISTS live_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    agora_channel_name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'ONGOING', 'PAST', 'CANCELLED')),
    recording_url TEXT,
    is_recorded BOOLEAN DEFAULT FALSE,
    recording_available_for_students BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_classes_teacher_id ON live_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_course_id ON live_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_status ON live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_start_time ON live_classes(start_time);
CREATE INDEX IF NOT EXISTS idx_live_classes_agora_channel_name ON live_classes(agora_channel_name);

CREATE TRIGGER update_live_classes_updated_at BEFORE UPDATE ON live_classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view their own live classes" ON live_classes;
CREATE POLICY "Teachers can view their own live classes" ON live_classes
    FOR SELECT USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "Teachers can insert their own live classes" ON live_classes;
CREATE POLICY "Teachers can insert their own live classes" ON live_classes
    FOR INSERT WITH CHECK (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "Teachers can update their own live classes" ON live_classes;
CREATE POLICY "Teachers can update their own live classes" ON live_classes
    FOR UPDATE USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
    WITH CHECK (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "Teachers can delete their own live classes" ON live_classes;
CREATE POLICY "Teachers can delete their own live classes" ON live_classes
    FOR DELETE USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

DROP POLICY IF EXISTS "Students can view live classes" ON live_classes;
CREATE POLICY "Students can view live classes" ON live_classes
    FOR SELECT USING (status IN ('SCHEDULED', 'ONGOING', 'PAST'));

GRANT SELECT, INSERT, UPDATE, DELETE ON live_classes TO authenticated;

-- Migration 036: Create live_class_attendance table
CREATE TABLE IF NOT EXISTS live_class_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    join_time TIMESTAMPTZ NOT NULL,
    leave_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (live_class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_live_class_attendance_live_class_id ON live_class_attendance(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_attendance_student_id ON live_class_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_live_class_attendance_join_time ON live_class_attendance(join_time);

CREATE TRIGGER update_live_class_attendance_updated_at BEFORE UPDATE ON live_class_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE live_class_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view live class attendance" ON live_class_attendance;
CREATE POLICY "Teachers can view live class attendance" ON live_class_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM live_classes lc
            INNER JOIN teachers t ON t.id = lc.teacher_id
            WHERE lc.id = live_class_id
            AND t.email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

DROP POLICY IF EXISTS "Students can view their own live class attendance" ON live_class_attendance;
CREATE POLICY "Students can view their own live class attendance" ON live_class_attendance
    FOR SELECT USING (student_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

GRANT SELECT ON live_class_attendance TO authenticated;

-- Migration 037: Create live_class_recordings table
CREATE TABLE IF NOT EXISTS live_class_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  agora_sid TEXT UNIQUE NOT NULL,
  resource_id TEXT UNIQUE NOT NULL,
  file_url TEXT,
  duration_seconds INTEGER,
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_class_recordings_live_class_id ON live_class_recordings(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_recordings_agora_sid ON live_class_recordings(agora_sid);
CREATE INDEX IF NOT EXISTS idx_live_class_recordings_resource_id ON live_class_recordings(resource_id);

ALTER TABLE live_class_recordings ENABLE ROW LEVEL SECURITY;

-- Migration 038: Fix RLS policies for recordings
DROP POLICY IF EXISTS "Teachers can manage their live class recordings" ON live_class_recordings;
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

DROP POLICY IF EXISTS "Students can view recordings for enrolled courses" ON live_class_recordings;
CREATE POLICY "Students can view recordings for enrolled courses" ON live_class_recordings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM live_classes lc
    INNER JOIN enrollments e ON lc.course_id = e.course_id
    INNER JOIN students s ON s.id = e.student_id
    WHERE lc.id = live_class_id
    AND s.email = current_setting('request.jwt.claims', true)::json->>'email'
    AND lc.status IN ('PAST', 'ONGOING')
    AND lc.recording_available_for_students = true
  )
  OR
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

-- Migration 039: Create live_class_participants table
CREATE TABLE IF NOT EXISTS live_class_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'student')),
  email TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (live_class_id, user_id, user_type, left_at)
);

CREATE INDEX IF NOT EXISTS idx_live_class_participants_live_class_id ON live_class_participants(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_user_id ON live_class_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_user_type ON live_class_participants(user_type);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_is_active ON live_class_participants(is_active);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_joined_at ON live_class_participants(joined_at);

CREATE TRIGGER update_live_class_participants_updated_at BEFORE UPDATE ON live_class_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE live_class_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view participants in their live classes" ON live_class_participants;
CREATE POLICY "Teachers can view participants in their live classes" ON live_class_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM live_classes lc
    INNER JOIN teachers t ON t.id = lc.teacher_id
    WHERE lc.id = live_class_id
    AND t.email = current_setting('request.jwt.claims', true)::json->>'email'
  )
);

DROP POLICY IF EXISTS "Teachers can manage participants in their live classes" ON live_class_participants;
CREATE POLICY "Teachers can manage participants in their live classes" ON live_class_participants
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

DROP POLICY IF EXISTS "Students can view participants in their live classes" ON live_class_participants;
CREATE POLICY "Students can view participants in their live classes" ON live_class_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM live_classes lc
    WHERE lc.id = live_class_id
    AND lc.status IN ('SCHEDULED', 'ONGOING', 'PAST')
    AND (
      lc.course_id IN (
        SELECT e.course_id
        FROM enrollments e
        INNER JOIN students s ON s.id = e.student_id
        WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
      )
      OR
      lc.course_id IS NULL
    )
  )
);

DROP POLICY IF EXISTS "Students can join live classes" ON live_class_participants;
CREATE POLICY "Students can join live classes" ON live_class_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_type = 'student'
  AND user_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  AND email = current_setting('request.jwt.claims', true)::json->>'email'
);

DROP POLICY IF EXISTS "Students can leave live classes" ON live_class_participants;
CREATE POLICY "Students can leave live classes" ON live_class_participants
FOR UPDATE
TO authenticated
USING (
  user_type = 'student'
  AND user_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  AND email = current_setting('request.jwt.claims', true)::json->>'email'
)
WITH CHECK (
  user_type = 'student'
  AND user_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  AND email = current_setting('request.jwt.claims', true)::json->>'email'
);

GRANT SELECT, INSERT, UPDATE ON live_class_participants TO authenticated;

-- Helper function to get current active participants
CREATE OR REPLACE FUNCTION get_live_class_participants(p_live_class_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  user_type TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lcp.id,
    lcp.email,
    lcp.user_type as role,
    lcp.user_type,
    lcp.joined_at
  FROM live_class_participants lcp
  WHERE lcp.live_class_id = p_live_class_id
    AND lcp.is_active = true
    AND lcp.left_at IS NULL
  ORDER BY lcp.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_live_class_participants(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Live Classes System Setup Complete!';
  RAISE NOTICE 'Created tables: live_classes, live_class_attendance, live_class_recordings, live_class_participants';
  RAISE NOTICE 'All RLS policies and indexes are in place.';
END $$;
