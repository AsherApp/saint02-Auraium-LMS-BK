-- Step 3: Create automatic triggers for progress tracking
-- This step creates functions and triggers that automatically track progress

-- 1. Create a function to automatically create course progress records when students enroll
CREATE OR REPLACE FUNCTION create_course_progress_on_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- Create course progress record when student enrolls
    INSERT INTO student_course_progress (
        student_email,
        course_id,
        completion_percentage,
        total_lessons,
        completed_lessons,
        total_assignments,
        completed_assignments,
        total_quizzes,
        passed_quizzes,
        started_at
    )
    SELECT 
        NEW.student_email,
        NEW.course_id,
        0,
        COALESCE(lesson_count.total, 0),
        0,
        COALESCE(assignment_count.total, 0),
        0,
        COALESCE(quiz_count.total, 0),
        0,
        NOW()
    FROM (
        SELECT COUNT(DISTINCT l.id) as total
        FROM courses c
        LEFT JOIN modules m ON m.course_id = c.id
        LEFT JOIN lessons l ON l.module_id = m.id
        WHERE c.id = NEW.course_id
    ) lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT a.id) as total
        FROM assignments a
        WHERE a.course_id = NEW.course_id
    ) assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quizzes q
        WHERE q.course_id = NEW.course_id
    ) quiz_count
    ON CONFLICT (student_email, course_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic course progress creation
DROP TRIGGER IF EXISTS trigger_create_course_progress_on_enrollment ON enrollments;
CREATE TRIGGER trigger_create_course_progress_on_enrollment
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION create_course_progress_on_enrollment();

-- 2. Create a function to automatically log activities when progress is recorded
CREATE OR REPLACE FUNCTION log_activity_on_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Log activity when progress is recorded
    INSERT INTO student_activities (
        student_email,
        course_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        NEW.student_email,
        NEW.course_id,
        CASE NEW.type
            WHEN 'lesson_completed' THEN 'lesson_completed'
            WHEN 'quiz_passed' THEN 'quiz_completed'
            WHEN 'assignment_submitted' THEN 'assignment_submitted'
            WHEN 'discussion_participated' THEN 'discussion_posted'
            WHEN 'poll_responded' THEN 'poll_responded'
            ELSE 'lesson_completed'
        END,
        CASE NEW.type
            WHEN 'lesson_completed' THEN 'Completed lesson'
            WHEN 'quiz_passed' THEN 'Completed quiz'
            WHEN 'assignment_submitted' THEN 'Submitted assignment'
            WHEN 'discussion_participated' THEN 'Participated in discussion'
            WHEN 'poll_responded' THEN 'Responded to poll'
            ELSE 'Completed activity'
        END,
        jsonb_build_object(
            'progress_type', NEW.type,
            'lesson_id', NEW.lesson_id,
            'module_id', NEW.module_id,
            'status', NEW.status,
            'score', NEW.score,
            'time_spent_seconds', NEW.time_spent_seconds,
            'lesson_title', NEW.lesson_title
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic activity logging
DROP TRIGGER IF EXISTS trigger_log_activity_on_progress ON student_progress;
CREATE TRIGGER trigger_log_activity_on_progress
    AFTER INSERT ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION log_activity_on_progress();

-- Success message
SELECT 'Step 3 completed: Automatic triggers created for progress tracking' as status;
