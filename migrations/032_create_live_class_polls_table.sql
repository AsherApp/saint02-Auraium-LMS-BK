-- =============================================================================
-- LIVE CLASS POLLS MIGRATION
-- =============================================================================
-- This migration creates the 'live_class_polls' table to manage polls
-- conducted during live classes.
-- =============================================================================

-- Create the live_class_polls table
CREATE TABLE IF NOT EXISTS live_class_polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE, -- Only teacher can create/manage polls
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings for poll options
    is_active BOOLEAN DEFAULT FALSE, -- Whether the poll is currently open for voting
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_polls_live_class_id ON live_class_polls(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_polls_teacher_id ON live_class_polls(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_class_polls_is_active ON live_class_polls(is_active);

-- Apply the existing trigger for automatically updating 'updated_at'
-- This assumes `update_updated_at_column()` function is already defined in the database
CREATE TRIGGER update_live_class_polls_updated_at BEFORE UPDATE ON live_class_polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for live_class_polls
ALTER TABLE live_class_polls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_class_polls
-- Teachers can manage their own polls for their live classes
CREATE POLICY "Teachers can manage their own live class polls" ON live_class_polls
    FOR ALL USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
    WITH CHECK (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Students can view active polls in live classes they have access to
CREATE POLICY "Students can view active live class polls" ON live_class_polls
    FOR SELECT USING (
        is_active = TRUE
        AND EXISTS (
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
GRANT SELECT, INSERT, UPDATE, DELETE ON live_class_polls TO authenticated;
