-- =============================================================================
-- LIVE CLASSES SYSTEM MIGRATION
-- =============================================================================
-- This migration creates the 'live_classes' table as part of the real-time
-- live class feature, integrating with Agora.io.
-- =============================================================================

-- Create the live_classes table
CREATE TABLE IF NOT EXISTS live_classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL, -- Optional: Can be a general class not tied to a specific course
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_classes_teacher_id ON live_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_course_id ON live_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_status ON live_classes(status);
CREATE INDEX IF NOT EXISTS idx_live_classes_start_time ON live_classes(start_time);
CREATE INDEX IF NOT EXISTS idx_live_classes_agora_channel_name ON live_classes(agora_channel_name);

-- Apply the existing trigger for automatically updating 'updated_at'
-- This assumes `update_updated_at_column()` function is already defined in the database
CREATE TRIGGER update_live_classes_updated_at BEFORE UPDATE ON live_classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for live_classes
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_classes
-- Teachers can view and manage their own live classes
CREATE POLICY "Teachers can view their own live classes" ON live_classes
    FOR SELECT USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Teachers can insert their own live classes" ON live_classes
    FOR INSERT WITH CHECK (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Teachers can update their own live classes" ON live_classes
    FOR UPDATE USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
    WITH CHECK (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Teachers can delete their own live classes" ON live_classes
    FOR DELETE USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Students can view live classes based on enrollment or if public.
-- This current policy allows students to view any active, scheduled, or past class.
-- Refinement for specific student enrollment checks (e.g., through a 'student_enrollments' table)
-- should be implemented in application logic or further RLS policies if needed.
CREATE POLICY "Students can view live classes" ON live_classes
    FOR SELECT USING (
        status IN ('SCHEDULED', 'ONGOING', 'PAST')
        -- Add more specific enrollment checks here if a student_enrollments table exists, e.g.:
        -- AND EXISTS (SELECT 1 FROM student_enrollments se WHERE se.student_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email') AND se.course_id = live_classes.course_id)
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON live_classes TO authenticated;
