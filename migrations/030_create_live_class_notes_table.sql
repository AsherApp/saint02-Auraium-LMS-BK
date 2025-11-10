-- =============================================================================
-- LIVE CLASS NOTES MIGRATION
-- =============================================================================
-- This migration creates the 'live_class_notes' table to store collaborative
-- or personal notes taken during live classes.
-- =============================================================================

-- Create the live_class_notes table
CREATE TABLE IF NOT EXISTS live_class_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    author_id UUID NOT NULL, -- ID of the user who created/last edited the note
    author_email TEXT NOT NULL, -- Email of the user for RLS and display
    content TEXT NOT NULL, -- Store notes content (e.g., Markdown, plain text)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_notes_live_class_id ON live_class_notes(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_notes_author_id ON live_class_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_live_class_notes_created_at ON live_class_notes(created_at);

-- Apply the existing trigger for automatically updating 'updated_at'
-- This assumes `update_updated_at_column()` function is already defined in the database
CREATE TRIGGER update_live_class_notes_updated_at BEFORE UPDATE ON live_class_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for live_class_notes
ALTER TABLE live_class_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_class_notes
-- Users can view notes in live classes they have access to
CREATE POLICY "Users can view live class notes" ON live_class_notes
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

-- Users can insert notes into live classes they have access to
CREATE POLICY "Users can insert live class notes" ON live_class_notes
    FOR INSERT WITH CHECK (
        author_email = current_setting('request.jwt.claims', true)::json->>'email'
        AND EXISTS (
            SELECT 1 FROM live_classes lc
            WHERE lc.id = live_class_id
            AND (
                lc.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
                OR EXISTS (
                    -- Placeholder for student enrollment check
                    SELECT 1 FROM students s
                    WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
                )
            )
        )
    );

-- Users can update their own notes in live classes they have access to
CREATE POLICY "Users can update their own live class notes" ON live_class_notes
    FOR UPDATE USING (
        author_email = current_setting('request.jwt.claims', true)::json->>'email'
        AND EXISTS (
            SELECT 1 FROM live_classes lc
            WHERE lc.id = live_class_id
            AND (
                lc.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
                OR EXISTS (
                    -- Placeholder for student enrollment check
                    SELECT 1 FROM students s
                    WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
                )
            )
        )
    )
    WITH CHECK (
        author_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

-- Users can delete their own notes in live classes they have access to
CREATE POLICY "Users can delete their own live class notes" ON live_class_notes
    FOR DELETE USING (
        author_email = current_setting('request.jwt.claims', true)::json->>'email'
        AND EXISTS (
            SELECT 1 FROM live_classes lc
            WHERE lc.id = live_class_id
            AND (
                lc.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
                OR EXISTS (
                    -- Placeholder for student enrollment check
                    SELECT 1 FROM students s
                    WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
                )
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON live_class_notes TO authenticated;
