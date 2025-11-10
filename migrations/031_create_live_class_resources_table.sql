-- =============================================================================
-- LIVE CLASS RESOURCES MIGRATION
-- =============================================================================
-- This migration creates the 'live_class_resources' table to store files
-- and links shared during live classes.
-- =============================================================================

-- Create the live_class_resources table
CREATE TABLE IF NOT EXISTS live_class_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE, -- Only teacher can manage resources
    title TEXT NOT NULL,
    url TEXT, -- For external links
    file_path TEXT, -- For uploaded files (relative path)
    file_name TEXT, -- Original file name for uploaded files
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_resources_live_class_id ON live_class_resources(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_resources_teacher_id ON live_class_resources(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_class_resources_created_at ON live_class_resources(created_at);

-- Apply the existing trigger for automatically updating 'updated_at'
-- This assumes `update_updated_at_column()` function is already defined in the database
CREATE TRIGGER update_live_class_resources_updated_at BEFORE UPDATE ON live_class_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for live_class_resources
ALTER TABLE live_class_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_class_resources
-- Teachers can view, insert, update, and delete their own resources for their live classes
CREATE POLICY "Teachers can manage their own live class resources" ON live_class_resources
    FOR ALL USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
    WITH CHECK (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Students can view resources for live classes they have access to
CREATE POLICY "Students can view live class resources" ON live_class_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM live_classes lc
            WHERE lc.id = live_class_id
            AND (
                lc.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
                OR EXISTS (
                    -- Placeholder for student enrollment check
                    SELECT 1 FROM students s
                    WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
                    -- AND s.id IS ENROLLED IN lc.course_id (if course-specific)
                )
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON live_class_resources TO authenticated;
