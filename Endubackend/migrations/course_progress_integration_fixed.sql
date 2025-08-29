-- Course Progress Integration and Enhancement - FIXED VERSION
-- This migration integrates with the existing database schema

-- 1. First, ensure all existing tables are properly set up
-- (Using the actual table names from the user's database)

-- 2. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_progress_composite ON student_progress(student_email, course_id, type);
CREATE INDEX IF NOT EXISTS idx_student_activities_composite ON student_activities(student_email, course_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_student_course_progress_composite ON student_course_progress(student_email, course_id);

-- 3. Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add missing columns to student_progress if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_progress' AND column_name = 'lesson_title') THEN
        ALTER TABLE student_progress ADD COLUMN lesson_title TEXT;
    END IF;

    -- Add missing columns to student_course_progress if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_course_progress' AND column_name = 'started_at') THEN
        ALTER TABLE student_course_progress ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_course_progress' AND column_name = 'completed_at') THEN
        ALTER TABLE student_course_progress ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    -- Add missing columns to student_activities if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_activities' AND column_name = 'activity_type') THEN
        ALTER TABLE student_activities ADD COLUMN activity_type TEXT;
    END IF;
END $$;

-- 4. Create a view for easy progress querying using existing tables
CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
    sp.student_email,
    sp.course_id,
    c.title as course_title,
    sp.module_id,
    m.title as module_title,
    sp.lesson_id,
    l.title as lesson_title,
    sp.type as progress_type,
    sp.status,
    sp.score,
    sp.time_spent_seconds,
    sp.created_at as completed_at,
    scp.completion_percentage as course_completion_percentage
FROM student_progress sp
JOIN courses c ON c.id = sp.course_id
LEFT JOIN modules m ON m.id = sp.module_id
LEFT JOIN lessons l ON l.id = sp.lesson_id
LEFT JOIN student_course_progress scp ON scp.student_email = sp.student_email AND scp.course_id = sp.course_id;

-- 5. Create a function to automatically create course progress records when students enroll
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

-- 6. Create a function to mark course as completed when all requirements are met
CREATE OR REPLACE FUNCTION check_course_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    total_assignments INTEGER;
    completed_assignments INTEGER;
    total_quizzes INTEGER;
    passed_quizzes INTEGER;
    completion_percentage INTEGER;
BEGIN
    -- Get completion statistics
    SELECT 
        COALESCE(lesson_count.total, 0),
        COALESCE(completed_lesson_count.total, 0),
        COALESCE(assignment_count.total, 0),
        COALESCE(completed_assignment_count.total, 0),
        COALESCE(quiz_count.total, 0),
        COALESCE(passed_quiz_count.total, 0)
    INTO 
        total_lessons,
        completed_lessons,
        total_assignments,
        completed_assignments,
        total_quizzes,
        passed_quizzes
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
        AND sp.status = 'completed'
        AND sp.type = 'lesson_completed'
    ) completed_lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT a.id) as total
        FROM assignments a
        WHERE a.course_id = NEW.course_id
    ) assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT a.id) as total
        FROM student_progress sp
        JOIN assignments a ON a.id = (sp.metadata->>'assignment_id')::UUID
        WHERE sp.student_email = NEW.student_email 
        AND sp.course_id = NEW.course_id 
        AND sp.status = 'completed'
        AND sp.type = 'assignment_submitted'
    ) completed_assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quizzes q
        WHERE q.course_id = NEW.course_id
    ) quiz_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quiz_responses qr
        JOIN quizzes q ON q.id = qr.quiz_id
        WHERE qr.student_email = NEW.student_email 
        AND q.course_id = NEW.course_id 
        AND qr.passed = true
    ) passed_quiz_count;

    -- Calculate completion percentage
    completion_percentage := CASE 
        WHEN (total_lessons + total_assignments + total_quizzes) > 0 THEN
            ROUND(((completed_lessons + completed_assignments + passed_quizzes)::DECIMAL / (total_lessons + total_assignments + total_quizzes)) * 100)
        ELSE 0
    END;

    -- Update course progress record
    UPDATE student_course_progress 
    SET 
        completion_percentage = completion_percentage,
        total_lessons = total_lessons,
        completed_lessons = completed_lessons,
        total_assignments = total_assignments,
        completed_assignments = completed_assignments,
        total_quizzes = total_quizzes,
        passed_quizzes = passed_quizzes,
        last_activity_at = NOW(),
        completed_at = CASE WHEN completion_percentage = 100 THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE student_email = NEW.student_email AND course_id = NEW.course_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for course completion checking
DROP TRIGGER IF EXISTS trigger_check_course_completion ON student_progress;
CREATE TRIGGER trigger_check_course_completion
    AFTER INSERT OR UPDATE ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION check_course_completion();

-- 7. Create a function to automatically log activities when progress is recorded
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

-- 8. Create a view for teacher dashboard using existing tables
CREATE OR REPLACE VIEW teacher_student_progress AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.teacher_email,
    e.student_email,
    s.name as student_name,
    scp.completion_percentage as course_completion_percentage,
    scp.total_lessons,
    scp.completed_lessons,
    scp.total_assignments,
    scp.completed_assignments,
    scp.total_quizzes,
    scp.passed_quizzes,
    scp.average_grade,
    scp.last_activity_at,
    scp.started_at,
    scp.completed_at,
    COUNT(sa.id) as total_activities,
    MAX(sa.created_at) as last_activity
FROM courses c
JOIN enrollments e ON e.course_id = c.id
JOIN students s ON s.email = e.student_email
LEFT JOIN student_course_progress scp ON scp.student_email = e.student_email AND scp.course_id = c.id
LEFT JOIN student_activities sa ON sa.student_email = e.student_email AND sa.course_id = c.id
GROUP BY 
    c.id, c.title, c.teacher_email, e.student_email, s.name,
    scp.completion_percentage, scp.total_lessons, scp.completed_lessons,
    scp.total_assignments, scp.completed_assignments, scp.total_quizzes,
    scp.passed_quizzes, scp.average_grade, scp.last_activity_at,
    scp.started_at, scp.completed_at;

-- 9. Create a view for student dashboard using existing tables
CREATE OR REPLACE VIEW student_progress_dashboard AS
SELECT 
    sp.student_email,
    c.id as course_id,
    c.title as course_title,
    m.id as module_id,
    m.title as module_title,
    l.id as lesson_id,
    l.title as lesson_title,
    sp.type as progress_type,
    sp.status,
    sp.score,
    sp.time_spent_seconds,
    sp.created_at as completed_at,
    scp.completion_percentage as course_completion_percentage,
    ROW_NUMBER() OVER (PARTITION BY sp.student_email, sp.course_id ORDER BY sp.created_at DESC) as activity_rank
FROM student_progress sp
JOIN courses c ON c.id = sp.course_id
LEFT JOIN modules m ON m.id = sp.module_id
LEFT JOIN lessons l ON l.id = sp.lesson_id
LEFT JOIN student_course_progress scp ON scp.student_email = sp.student_email AND scp.course_id = sp.course_id;

-- 10. Add RLS policies for the new views
CREATE POLICY "Teachers can view student progress dashboard" ON teacher_student_progress
    FOR SELECT USING (teacher_email = current_user);

CREATE POLICY "Students can view their own progress dashboard" ON student_progress_dashboard
    FOR SELECT USING (student_email = current_user);

-- 11. Create indexes for the views
CREATE INDEX IF NOT EXISTS idx_teacher_student_progress_teacher ON teacher_student_progress(teacher_email);
CREATE INDEX IF NOT EXISTS idx_teacher_student_progress_course ON teacher_student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_dashboard_student ON student_progress_dashboard(student_email);
CREATE INDEX IF NOT EXISTS idx_student_progress_dashboard_course ON student_progress_dashboard(course_id);

-- 12. Update existing student_progress records to have proper type values if needed
UPDATE student_progress 
SET type = 'lesson_completed' 
WHERE type IS NULL OR type = '';

-- 13. Ensure student_activities table has proper structure
DO $$ 
BEGIN
    -- Add activity_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_activities' AND column_name = 'activity_type') THEN
        ALTER TABLE student_activities ADD COLUMN activity_type TEXT;
    END IF;
    
    -- Update existing activities to have proper activity_type
    UPDATE student_activities 
    SET activity_type = 'lesson_completed' 
    WHERE activity_type IS NULL OR activity_type = '';
END $$;
