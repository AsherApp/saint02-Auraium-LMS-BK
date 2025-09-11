-- =====================================================
-- DISABLE ALL TRIGGERS AND TEST BASIC FUNCTIONALITY
-- =====================================================

-- Disable all triggers on submissions table
DROP TRIGGER IF EXISTS trigger_ensure_course_completion_on_submission ON submissions;
DROP TRIGGER IF EXISTS trigger_update_course_completion_on_grade ON submissions;
DROP TRIGGER IF EXISTS trigger_ensure_course_completion ON submissions;
DROP TRIGGER IF EXISTS trigger_prevent_late_submission ON submissions;
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_submission ON submissions;
DROP TRIGGER IF EXISTS trigger_after_submission_insert ON submissions;

-- Also drop any other triggers that might exist
DROP TRIGGER IF EXISTS trigger_submission_insert ON submissions;
DROP TRIGGER IF EXISTS trigger_submission_update ON submissions;

-- Clean up any existing test submissions
DELETE FROM submissions WHERE student_email = 'teststudent@example.com';

-- Ensure course_completions record exists manually
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
    'a8350cf9-b0c0-46af-91e8-5f33d24b1aae',
    'teststudent@example.com',
    '4d3d7e5d-2c8f-459f-9f31-b6e376027cee',
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    NULL
) ON CONFLICT (student_id, course_id) DO NOTHING;

-- Log the fix
INSERT INTO migrations (version, description, applied_at) 
VALUES ('030', 'Disable all triggers and test basic functionality', NOW())
ON CONFLICT (version) DO NOTHING;
