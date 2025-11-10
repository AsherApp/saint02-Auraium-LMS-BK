-- =============================================================================
-- LIVE CLASS QUIZ SUBMISSIONS MIGRATION
-- =============================================================================
-- This migration creates the 'live_class_quiz_submissions' table to store
-- student submissions for quizzes conducted during live classes.
-- =============================================================================

-- Create the live_class_quiz_submissions table
CREATE TABLE IF NOT EXISTS live_class_quiz_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES live_class_quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL, -- ID of the student who submitted
    answers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of integers (selected option index for each question)
    score INTEGER, -- Score for the submission
    submitted_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure a student can only submit once per quiz
    UNIQUE (quiz_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_quiz_submissions_quiz_id ON live_class_quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_live_class_quiz_submissions_student_id ON live_class_quiz_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_live_class_quiz_submissions_submitted_at ON live_class_quiz_submissions(submitted_at);

-- Enable Row Level Security (RLS) for live_class_quiz_submissions
ALTER TABLE live_class_quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_class_quiz_submissions
-- Students can view their own submissions
CREATE POLICY "Students can view their own live class quiz submissions" ON live_class_quiz_submissions
    FOR SELECT USING (student_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Students can insert a submission if the quiz is active and they haven't submitted yet
CREATE POLICY "Students can insert live class quiz submissions" ON live_class_quiz_submissions
    FOR INSERT WITH CHECK (
        student_id = (SELECT id FROM students WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
        AND EXISTS (
            SELECT 1 FROM live_class_quizzes lcq
            WHERE lcq.id = quiz_id
            AND lcq.is_active = TRUE
        )
    );

-- Teachers can view all submissions for their quizzes
CREATE POLICY "Teachers can view all submissions for their quizzes" ON live_class_quiz_submissions
    FOR SELECT TO teachers USING (
        EXISTS (
            SELECT 1 FROM live_class_quizzes lcq
            WHERE lcq.id = quiz_id
            AND lcq.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON live_class_quiz_submissions TO authenticated;
