-- =====================================================
-- QUICK FIX FOR check_course_completion FUNCTION
-- =====================================================
-- This is a quick fix for the immediate error you're experiencing
-- Run this first to fix the function, then run the other migrations

-- Drop the existing function
DROP FUNCTION IF EXISTS check_course_completion() CASCADE;

-- Create the corrected function
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

    -- Calculate completion percentage
    total_lessons := completion_data.total_lessons;
    completed_lessons := completion_data.completed_lessons;
    total_assignments := completion_data.total_assignments;
    completed_assignments := completion_data.completed_assignments;
    total_quizzes := completion_data.total_quizzes;
    passed_quizzes := completion_data.passed_quizzes;

    -- Calculate percentage (lessons + assignments + quizzes)
    IF (total_lessons + total_assignments + total_quizzes) > 0 THEN
        completion_percentage := (
            (completed_lessons + completed_assignments + passed_quizzes)::NUMERIC / 
            (total_lessons + total_assignments + total_quizzes)::NUMERIC
        ) * 100;
    ELSE
        completion_percentage := 0;
    END IF;

    -- Update or insert course completion record
    INSERT INTO course_completions (
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
        NEW.student_email,
        NEW.course_id,
        completion_percentage,
        total_lessons,
        completed_lessons,
        total_assignments,
        completed_assignments,
        total_quizzes,
        passed_quizzes,
        CASE WHEN completion_percentage >= 100 THEN NOW() ELSE NULL END
    )
    ON CONFLICT (student_email, course_id) 
    DO UPDATE SET
        completion_percentage = EXCLUDED.completion_percentage,
        total_lessons = EXCLUDED.total_lessons,
        completed_lessons = EXCLUDED.completed_lessons,
        total_assignments = EXCLUDED.total_assignments,
        completed_assignments = EXCLUDED.completed_assignments,
        total_quizzes = EXCLUDED.total_quizzes,
        passed_quizzes = EXCLUDED.passed_quizzes,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW();

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
-- QUICK FIX COMPLETE
-- =====================================================
-- This fixes the immediate error with the check_course_completion function
-- The function now uses the correct column names and table structure
-- =====================================================
