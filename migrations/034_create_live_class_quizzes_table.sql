-- =============================================================================
-- LIVE CLASS QUIZZES MIGRATION
-- =============================================================================
-- This migration creates the 'live_class_quizzes' table to manage quizzes
-- conducted during live classes.
-- =============================================================================

-- Create the live_class_quizzes table
CREATE TABLE IF NOT EXISTS live_class_quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE, -- Only teacher can create/manage quizzes
    title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of objects: {questionText: string, options: string[], correctOptionIndex: number}
    is_active BOOLEAN DEFAULT FALSE, -- Whether the quiz is currently open for submissions
    show_results_after_submission BOOLEAN DEFAULT FALSE, -- Whether students see results immediately
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_quizzes_live_class_id ON live_class_quizzes(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_quizzes_teacher_id ON live_class_quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_class_quizzes_is_active ON live_class_quizzes(is_active);

-- Apply the existing trigger for automatically updating 'updated_at'
-- This assumes `update_updated_at_column()` function is already defined in the database
CREATE TRIGGER update_live_class_quizzes_updated_at BEFORE UPDATE ON live_class_quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for live_class_quizzes
ALTER TABLE live_class_quizzes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_class_quizzes
-- Teachers can manage their own quizzes for their live classes
CREATE POLICY "Teachers can manage their own live class quizzes" ON live_class_quizzes
    FOR ALL USING (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
    WITH CHECK (teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Students can view active quizzes in live classes they have access to
CREATE POLICY "Students can view active live class quizzes" ON live_class_quizzes
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
GRANT SELECT, INSERT, UPDATE, DELETE ON live_class_quizzes TO authenticated;
