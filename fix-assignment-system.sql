-- =====================================================
-- FIX ASSIGNMENT SYSTEM TO MATCH CORRECT SCHEMA
-- =====================================================
-- This script fixes the assignment system to match the correct workflow:
-- 1. Teacher creates assignment
-- 2. Student submits work
-- 3. Triggers enforce rules and create placeholder grade
-- 4. Teacher grades the submission
-- 5. Student views result

-- =====================================================
-- 1. CREATE GRADES TABLE (MISSING)
-- =====================================================

CREATE TABLE IF NOT EXISTS grades (
    grade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL,
    teacher_id UUID,
    grade TEXT,
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. FIX SUBMISSIONS TABLE STRUCTURE
-- =====================================================

-- First, let's see what columns exist in submissions
-- Then we'll add the missing ones and remove unnecessary ones

-- Add missing columns to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS submission_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS assignment_id UUID,
ADD COLUMN IF NOT EXISTS student_id UUID,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS content TEXT;

-- =====================================================
-- 3. CREATE DATABASE TRIGGERS
-- =====================================================

-- Function to prevent late submissions
CREATE OR REPLACE FUNCTION prevent_late_submission()
RETURNS TRIGGER AS $$
DECLARE
    assignment_due_date TIMESTAMPTZ;
BEGIN
    -- Get the due date for this assignment
    SELECT due_at INTO assignment_due_date
    FROM assignments
    WHERE id = NEW.assignment_id;
    
    -- Check if submission is late
    IF assignment_due_date IS NOT NULL AND NEW.submitted_at > assignment_due_date THEN
        RAISE EXCEPTION 'Submission is late. Due date: %, Submitted: %', assignment_due_date, NEW.submitted_at;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent duplicate submissions
CREATE OR REPLACE FUNCTION prevent_duplicate_submission()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Check if student already submitted for this assignment
    SELECT COUNT(*) INTO existing_count
    FROM submissions
    WHERE assignment_id = NEW.assignment_id
    AND student_id = NEW.student_id;
    
    -- If submission already exists, reject
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Student has already submitted for this assignment';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create placeholder grade after submission
CREATE OR REPLACE FUNCTION after_submission_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a placeholder grade entry
    INSERT INTO grades (submission_id, teacher_id, grade, feedback, graded_at)
    VALUES (NEW.submission_id, NULL, NULL, NULL, NULL);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update grade timestamp
CREATE OR REPLACE FUNCTION update_grade_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Update graded_at when grade is set
    IF NEW.grade IS NOT NULL AND OLD.grade IS NULL THEN
        NEW.graded_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_prevent_late_submission ON submissions;
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_submission ON submissions;
DROP TRIGGER IF EXISTS trigger_after_submission_insert ON submissions;
DROP TRIGGER IF EXISTS trigger_update_grade_timestamp ON grades;

-- Create triggers
CREATE TRIGGER trigger_prevent_late_submission
    BEFORE INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_late_submission();

CREATE TRIGGER trigger_prevent_duplicate_submission
    BEFORE INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_submission();

CREATE TRIGGER trigger_after_submission_insert
    AFTER INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION after_submission_insert();

CREATE TRIGGER trigger_update_grade_timestamp
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_grade_timestamp();

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON grades(teacher_id);

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON grades TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 7. CREATE VIEWS FOR EASY QUERYING
-- =====================================================

-- View to get assignment with submission and grade info
CREATE OR REPLACE VIEW assignment_submissions_with_grades AS
SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    a.due_at,
    s.submission_id,
    s.student_id,
    s.submitted_at,
    s.file_url,
    s.content,
    g.grade_id,
    g.teacher_id,
    g.grade,
    g.feedback,
    g.graded_at,
    CASE 
        WHEN s.submitted_at > a.due_at THEN true
        ELSE false
    END as is_late
FROM assignments a
LEFT JOIN submissions s ON a.id = s.assignment_id
LEFT JOIN grades g ON s.submission_id = g.submission_id;

-- =====================================================
-- 8. INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert a sample assignment if it doesn't exist
INSERT INTO assignments (id, course_id, title, description, type, due_at, points)
VALUES (
    '8c0032a6-c69a-4b6a-84d0-99edca559af6',
    '4d3d7e5d-2c8f-459f-9f31-b6e376027cee',
    'SQL Joins Practice',
    'Solve 10 SQL queries',
    'essay',
    NOW() + INTERVAL '7 days',
    100
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    due_at = EXCLUDED.due_at,
    points = EXCLUDED.points;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
INSERT INTO migrations (version, description, applied_at) 
VALUES ('028', 'Fix assignment system to match correct schema and workflow', NOW())
ON CONFLICT (version) DO NOTHING;
