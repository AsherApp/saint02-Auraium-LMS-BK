-- =============================================================================
-- LIVE CLASS ATTENDANCE MIGRATION
-- =============================================================================
-- This migration creates the 'live_class_attendance' table to track student
-- attendance in live classes.
-- =============================================================================

-- Create the live_class_attendance table
CREATE TABLE IF NOT EXISTS live_class_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL, -- ID of the student
    join_time TIMESTAMPTZ NOT NULL,
    leave_time TIMESTAMPTZ, -- Nullable, set on disconnect
    duration_minutes INTEGER, -- Calculated on leave
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (live_class_id, student_id) -- A student can only have one attendance record per class
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_attendance_live_class_id ON live_class_attendance(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_attendance_student_id ON live_class_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_live_class_attendance_join_time ON live_class_attendance(join_time);

-- Apply the existing trigger for automatically updating 'updated_at'
-- This assumes `update_updated_at_column()` function is already defined in the database
CREATE TRIGGER update_live_class_attendance_updated_at BEFORE UPDATE ON live_class_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for live_class_attendance
ALTER TABLE live_class_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_class_attendance
-- Teachers can view attendance for their live classes
CREATE POLICY "Teachers can view live class attendance" ON live_class_attendance
    FOR SELECT TO teachers USING (
        EXISTS (
            SELECT 1 FROM live_classes lc
            WHERE lc.id = live_class_id
            AND lc.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
        )
    );

-- Students can view their own attendance records
CREATE POLICY "Students can view their own live class attendance" ON live_class_attendance
    FOR SELECT USING (student_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Attendance records are inserted/updated by the system (backend service), not directly by users.
-- Therefore, no INSERT/UPDATE/DELETE policies for authenticated users are needed here,
-- as these operations will be handled by a service account or a privileged backend function.
-- If direct user interaction is needed, these policies would need to be added.

-- Grant necessary permissions
GRANT SELECT ON live_class_attendance TO authenticated;
