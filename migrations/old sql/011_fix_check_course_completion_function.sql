-- =====================================================
-- FIX CHECK_COURSE_COMPLETION FUNCTION
-- =====================================================
-- This migration fixes the check_course_completion function that's trying to access
-- a non-existent 'metadata' column in the student_progress table.

-- First, let's drop the existing function if it exists
DROP FUNCTION IF EXISTS check_course_completion() CASCADE;

-- Tables are now created in 013_run_missing_discussions_tables.sql
-- This avoids duplication and ensures proper migration order

-- Create the corrected function
-- The issue was that it was trying to access sp.metadata->>'assignment_id'
-- but student_progress table doesn't have a metadata column
-- We need to use a different approach to track assignment completions

CREATE OR REPLACE FUNCTION check_course_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion_data RECORD;
    total_lessons INTEGER;
    completed_lessons INTEGER;
    total_assignments INTEGER;
    completed_assignments INTEGER;
    total_quizzes INTEGER;
    passed_quizzes INTEGER;
    completion_percentage NUMERIC;
BEGIN
    -- Get completion statistics for the student and course
    SELECT 
        COALESCE(lesson_count.total, 0) as total_lessons,
        COALESCE(completed_lesson_count.total, 0) as completed_lessons,
        COALESCE(assignment_count.total, 0) as total_assignments,
        COALESCE(completed_assignment_count.total, 0) as completed_assignments,
        COALESCE(quiz_count.total, 0) as total_quizzes,
        COALESCE(passed_quiz_count.total, 0) as passed_quizzes
    INTO completion_data
    FROM (
        SELECT COUNT(DISTINCT l.id) as total
        FROM courses c
        LEFT JOIN modules m ON m.course_id = c.id
        LEFT JOIN lessons l ON l.module_id = m.id
        WHERE c.id = NEW.course_id
    ) lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT l.id) as total
        FROM student_progress sp
        JOIN lessons l ON l.id = sp.lesson_id
        JOIN modules m ON m.id = l.module_id
        WHERE sp.student_email = NEW.student_email 
        AND sp.course_id = NEW.course_id 
        AND sp.progress_type = 'lesson_completed'
        AND sp.status = 'completed'
    ) completed_lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT a.id) as total
        FROM assignments a
        WHERE a.course_id = NEW.course_id
    ) assignment_count
    CROSS JOIN (
        -- Fixed: Use submissions table instead of non-existent metadata column
        SELECT COUNT(DISTINCT s.assignment_id) as total
        FROM submissions s
        JOIN assignments a ON a.id = s.assignment_id
        WHERE s.student_email = NEW.student_email 
        AND a.course_id = NEW.course_id 
        AND s.status = 'submitted'
    ) completed_assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quizzes q
        WHERE q.course_id = NEW.course_id
    ) quiz_count
    CROSS JOIN (
        -- Fixed: Use quiz_attempts table (now created above)
        SELECT COUNT(DISTINCT qa.quiz_id) as total
        FROM quiz_attempts qa
        JOIN quizzes q ON q.id = qa.quiz_id
        WHERE qa.student_email = NEW.student_email 
        AND q.course_id = NEW.course_id 
        AND qa.passed = true
    ) passed_quiz_count;

    -- Extract values
    total_lessons := completion_data.total_lessons;
    completed_lessons := completion_data.completed_lessons;
    total_assignments := completion_data.total_assignments;
    completed_assignments := completion_data.completed_assignments;
    total_quizzes := completion_data.total_quizzes;
    passed_quizzes := completion_data.passed_quizzes;

    -- Calculate completion percentage
    -- Weight: 40% lessons, 30% assignments, 30% quizzes
    completion_percentage := 0;
    
    IF total_lessons > 0 THEN
        completion_percentage := completion_percentage + (completed_lessons::NUMERIC / total_lessons::NUMERIC) * 0.4;
    END IF;
    
    IF total_assignments > 0 THEN
        completion_percentage := completion_percentage + (completed_assignments::NUMERIC / total_assignments::NUMERIC) * 0.3;
    END IF;
    
    IF total_quizzes > 0 THEN
        completion_percentage := completion_percentage + (passed_quizzes::NUMERIC / total_quizzes::NUMERIC) * 0.3;
    END IF;

    -- Convert to percentage
    completion_percentage := completion_percentage * 100;

    -- Check if course is completed (80% or more)
    IF completion_percentage >= 80 THEN
        -- Insert or update course completion record
        INSERT INTO course_completions (
            student_email,
            course_id,
            completion_percentage,
            completed_at
        ) VALUES (
            NEW.student_email,
            NEW.course_id,
            completion_percentage,
            NOW()
        )
        ON CONFLICT (student_email, course_id) 
        DO UPDATE SET 
            completion_percentage = EXCLUDED.completion_percentage,
            completed_at = EXCLUDED.completed_at;
    ELSE
        -- Remove completion record if not completed
        DELETE FROM course_completions 
        WHERE student_email = NEW.student_email 
        AND course_id = NEW.course_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for student_progress table
DROP TRIGGER IF EXISTS trigger_check_course_completion ON student_progress;
CREATE TRIGGER trigger_check_course_completion
    AFTER INSERT OR UPDATE ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION check_course_completion();

-- Create trigger for submissions table (for assignment completions)
DROP TRIGGER IF EXISTS trigger_check_course_completion_submissions ON submissions;
CREATE TRIGGER trigger_check_course_completion_submissions
    AFTER INSERT OR UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION check_course_completion();

-- Create trigger for quiz_attempts table (for quiz completions)
DROP TRIGGER IF EXISTS trigger_check_course_completion_quiz_attempts ON quiz_attempts;
CREATE TRIGGER trigger_check_course_completion_quiz_attempts
    AFTER INSERT OR UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION check_course_completion();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration fixes the check_course_completion function by:
-- 1. Removing references to non-existent 'metadata' column
-- 2. Using proper table relationships (submissions, quiz_attempts)
-- 3. Adding triggers for all relevant tables
-- 4. Implementing proper completion percentage calculation
-- =====================================================
