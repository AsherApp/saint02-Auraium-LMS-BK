-- Update submissions table to support comprehensive assignment submission system
-- This migration adds all necessary fields for tracking submissions, grades, and feedback

-- First, let's check if we need to add columns to the existing submissions table
DO $$ 
BEGIN
    -- Add student_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'student_name') THEN
        ALTER TABLE submissions ADD COLUMN student_name text;
    END IF;

    -- Add attempt_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'attempt_number') THEN
        ALTER TABLE submissions ADD COLUMN attempt_number integer DEFAULT 1;
    END IF;

    -- Add content column if it doesn't exist (rename payload to content)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'content') THEN
        ALTER TABLE submissions ADD COLUMN content jsonb DEFAULT '{}';
        -- Copy data from payload to content if payload exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'payload') THEN
            UPDATE submissions SET content = payload WHERE content = '{}';
        END IF;
    END IF;

    -- Add attachments column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'attachments') THEN
        ALTER TABLE submissions ADD COLUMN attachments jsonb DEFAULT '[]';
    END IF;

    -- Add submitted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'submitted_at') THEN
        ALTER TABLE submissions ADD COLUMN submitted_at timestamptz;
    END IF;

    -- Add graded_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'graded_at') THEN
        ALTER TABLE submissions ADD COLUMN graded_at timestamptz;
    END IF;

    -- Add graded_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'graded_by') THEN
        ALTER TABLE submissions ADD COLUMN graded_by text;
    END IF;

    -- Add rubric_scores column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'rubric_scores') THEN
        ALTER TABLE submissions ADD COLUMN rubric_scores jsonb DEFAULT '{}';
    END IF;

    -- Add time_spent_minutes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'time_spent_minutes') THEN
        ALTER TABLE submissions ADD COLUMN time_spent_minutes integer DEFAULT 0;
    END IF;

    -- Add late_submission column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'late_submission') THEN
        ALTER TABLE submissions ADD COLUMN late_submission boolean DEFAULT false;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'submissions' AND column_name = 'created_at') THEN
        ALTER TABLE submissions ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;

END $$;

-- Update existing submissions to have proper data
UPDATE submissions 
SET 
    student_name = COALESCE(student_name, 'Unknown Student'),
    content = COALESCE(content, payload, '{}'),
    submitted_at = CASE 
        WHEN status = 'submitted' OR status = 'graded' THEN updated_at 
        ELSE NULL 
    END,
    created_at = COALESCE(created_at, updated_at)
WHERE student_name IS NULL OR content = '{}' OR created_at IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_email ON submissions(student_email);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

-- Add RLS policies for submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policy for students to view their own submissions
DROP POLICY IF EXISTS "Students can view own submissions" ON submissions;
CREATE POLICY "Students can view own submissions" ON submissions
    FOR SELECT USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy for students to insert their own submissions
DROP POLICY IF EXISTS "Students can insert own submissions" ON submissions;
CREATE POLICY "Students can insert own submissions" ON submissions
    FOR INSERT WITH CHECK (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy for students to update their own submissions
DROP POLICY IF EXISTS "Students can update own submissions" ON submissions;
CREATE POLICY "Students can update own submissions" ON submissions
    FOR UPDATE USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy for teachers to view submissions for their courses
DROP POLICY IF EXISTS "Teachers can view course submissions" ON submissions;
CREATE POLICY "Teachers can view course submissions" ON submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.id = submissions.assignment_id
            AND c.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Policy for teachers to update submissions for their courses
DROP POLICY IF EXISTS "Teachers can update course submissions" ON submissions;
CREATE POLICY "Teachers can update course submissions" ON submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.id = submissions.assignment_id
            AND c.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Remove the unique constraint on assignment_id and student_email since we now support multiple attempts
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_assignment_id_student_email_key;

-- Add a unique constraint for the latest submission per assignment per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_latest_per_assignment 
ON submissions(assignment_id, student_email, attempt_number);
