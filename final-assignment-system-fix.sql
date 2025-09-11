-- =====================================================
-- FINAL ASSIGNMENT SYSTEM FIX
-- =====================================================
-- This script completely fixes the assignment system by:
-- 1. Removing problematic triggers
-- 2. Creating a proper trigger that works
-- 3. Ensuring the system works end-to-end

-- =====================================================
-- 1. REMOVE ALL EXISTING TRIGGERS ON SUBMISSIONS
-- =====================================================

-- Drop all existing triggers on submissions table
DROP TRIGGER IF EXISTS trigger_ensure_course_completion ON submissions;
DROP TRIGGER IF EXISTS trigger_prevent_late_submission ON submissions;
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_submission ON submissions;
DROP TRIGGER IF EXISTS trigger_after_submission_insert ON submissions;

-- =====================================================
-- 2. CREATE A SIMPLE, WORKING TRIGGER
-- =====================================================

-- Create a simple function that ensures course_completions record exists
CREATE OR REPLACE FUNCTION ensure_course_completion_on_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if this is a new submission (not an update)
    IF TG_OP = 'INSERT' THEN
        -- Check if course_completions record exists for this student and course
        IF NOT EXISTS (
            SELECT 1 FROM course_completions 
            WHERE student_id = NEW.student_id 
            AND course_id = NEW.course_id
        ) THEN
            -- Create the course_completions record with all required fields
            INSERT INTO course_completions (
                student_id,
                student_email,
                course_id,
                completion_percentage,
                total_lessons,
                completed_lessons,
                total_assignments,
                completed_assignments,
                total_quizzes,
                passed_quizzes,
                completed_at
            ) VALUES (
                NEW.student_id,
                NEW.student_email,
                NEW.course_id,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                NULL
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_ensure_course_completion_on_submission
    BEFORE INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION ensure_course_completion_on_submission();

-- =====================================================
-- 3. CREATE A FUNCTION TO UPDATE COURSE COMPLETION
-- =====================================================

-- Function to update course completion when assignment is graded
CREATE OR REPLACE FUNCTION update_course_completion_on_grade()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if grade is being set (not null)
    IF NEW.grade IS NOT NULL AND OLD.grade IS NULL THEN
        -- Update the course_completions record
        UPDATE course_completions 
        SET 
            completed_assignments = completed_assignments + 1,
            completion_percentage = LEAST(100, completion_percentage + 10)
        WHERE student_id = NEW.student_id 
        AND course_id = NEW.course_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for grading
CREATE TRIGGER trigger_update_course_completion_on_grade
    AFTER UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_course_completion_on_grade();

-- =====================================================
-- 4. CREATE A VIEW FOR EASY QUERYING
-- =====================================================

-- View to get submissions with assignment and course info
CREATE OR REPLACE VIEW submission_details AS
SELECT 
    s.id as submission_id,
    s.assignment_id,
    s.student_id,
    s.student_email,
    s.student_name,
    s.content,
    s.grade,
    s.feedback,
    s.status,
    s.submitted_at,
    s.late_submission,
    a.title as assignment_title,
    a.points as assignment_points,
    a.due_at as assignment_due_at,
    c.title as course_title,
    c.teacher_email
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN courses c ON a.course_id = c.id;

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on the view
GRANT SELECT ON submission_details TO authenticated;

-- =====================================================
-- 6. TEST DATA CLEANUP
-- =====================================================

-- Clean up any existing test submissions
DELETE FROM submissions WHERE student_email = 'teststudent@example.com';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
INSERT INTO migrations (version, description, applied_at) 
VALUES ('029', 'Final assignment system fix - working triggers and views', NOW())
ON CONFLICT (version) DO NOTHING;
