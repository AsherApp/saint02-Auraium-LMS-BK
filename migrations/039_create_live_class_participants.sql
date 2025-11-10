-- Migration: 039_create_live_class_participants.sql
-- Description: Creates the live_class_participants table to track active participants in live classes

-- Create the live_class_participants table
CREATE TABLE IF NOT EXISTS live_class_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Can be either teacher_id or student_id from respective tables
  user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'student')),
  email TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ, -- NULL while active, set when user leaves
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique constraint: one active session per user per live class
  UNIQUE NULLS NOT DISTINCT (live_class_id, user_id, user_type, left_at)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_participants_live_class_id ON live_class_participants(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_user_id ON live_class_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_user_type ON live_class_participants(user_type);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_is_active ON live_class_participants(is_active);
CREATE INDEX IF NOT EXISTS idx_live_class_participants_joined_at ON live_class_participants(joined_at);

-- Apply the existing trigger for automatically updating 'updated_at'
CREATE TRIGGER update_live_class_participants_updated_at BEFORE UPDATE ON live_class_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE live_class_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policy for Teachers:
-- Teachers can view participants in their own live classes
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

-- Teachers can insert/update/delete participant records for their live classes
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

-- RLS Policy for Students:
-- Students can view participants in live classes they're part of
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
      -- Student is enrolled in the course
      lc.course_id IN (
        SELECT e.course_id
        FROM enrollments e
        INNER JOIN students s ON s.id = e.student_id
        WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
      )
      OR
      -- Or it's a general class (no specific course)
      lc.course_id IS NULL
    )
  )
);

-- Students can insert their own participation record when joining
CREATE POLICY "Students can join live classes" ON live_class_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_type = 'student'
  AND user_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
  AND email = current_setting('request.jwt.claims', true)::json->>'email'
);

-- Students can update only their own participation record (to mark as left)
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON live_class_participants TO authenticated;

-- Function to get current active participants for a live class
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_live_class_participants(UUID) TO authenticated;
