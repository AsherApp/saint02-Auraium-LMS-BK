-- Course Progress Integration and Enhancement
-- This migration integrates all existing progress tracking and adds missing functionality

-- 1. First, ensure all existing tables are properly set up
-- (The comprehensive tables should already exist from previous migrations)

-- 2. Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_progress_composite ON student_progress(student_email, course_id, progress_type);
CREATE INDEX IF NOT EXISTS idx_student_activities_composite ON student_activities(student_email, course_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_course_completions_composite ON course_completions(student_email, course_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_composite ON module_completions(student_email, course_id, module_id);

-- 3. Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add missing columns to student_progress if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_progress' AND column_name = 'progress_type') THEN
        ALTER TABLE student_progress ADD COLUMN progress_type TEXT NOT NULL DEFAULT 'lesson_completed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_progress' AND column_name = 'lesson_title') THEN
        ALTER TABLE student_progress ADD COLUMN lesson_title TEXT;
    END IF;

    -- Add missing columns to course_completions if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'course_completions' AND column_name = 'started_at') THEN
        ALTER TABLE course_completions ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'course_completions' AND column_name = 'completed_at') THEN
        ALTER TABLE course_completions ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    -- Add missing columns to module_completions if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'module_completions' AND column_name = 'started_at') THEN
        ALTER TABLE module_completions ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'module_completions' AND column_name = 'completed_at') THEN
        ALTER TABLE module_completions ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- 4. Create a view for easy progress querying
CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
    sp.student_email,
    sp.course_id,
    c.title as course_title,
    sp.module_id,
    m.title as module_title,
    sp.lesson_id,
    l.title as lesson_title,
    sp.progress_type,
    sp.status,
    sp.score,
    sp.time_spent_seconds,
    sp.created_at as completed_at,
    cc.completion_percentage as course_completion_percentage,
    mc.completion_percentage as module_completion_percentage
FROM student_progress sp
JOIN courses c ON c.id = sp.course_id
LEFT JOIN modules m ON m.id = sp.module_id
LEFT JOIN lessons l ON l.id = sp.lesson_id
LEFT JOIN course_completions cc ON cc.student_email = sp.student_email AND cc.course_id = sp.course_id
LEFT JOIN module_completions mc ON mc.student_email = sp.student_email AND mc.course_id = sp.course_id AND mc.module_id = sp.module_id;

-- 5. Create a function to automatically create course completion records when students enroll
CREATE OR REPLACE FUNCTION create_course_completion_on_enrollment()
RETURNS TRIGGER AS $$
BEGIN
    -- Create course completion record when student enrolls
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

-- Create trigger for automatic course completion creation
DROP TRIGGER IF EXISTS trigger_create_course_completion_on_enrollment ON enrollments;
CREATE TRIGGER trigger_create_course_completion_on_enrollment
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION create_course_completion_on_enrollment();

-- 6. Create a function to automatically create module completion records
CREATE OR REPLACE FUNCTION create_module_completion_on_first_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Create module completion record when student first interacts with a module
    IF NEW.module_id IS NOT NULL THEN
        INSERT INTO module_completions (
            student_email,
            course_id,
            module_id,
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
            NEW.module_id,
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
            FROM lessons l
            WHERE l.module_id = NEW.module_id
        ) lesson_count
        CROSS JOIN (
            SELECT COUNT(DISTINCT a.id) as total
            FROM assignments a
            WHERE a.course_id = NEW.course_id AND a.module_id = NEW.module_id
        ) assignment_count
        CROSS JOIN (
            SELECT COUNT(DISTINCT q.id) as total
            FROM quizzes q
            WHERE q.course_id = NEW.course_id AND q.module_id = NEW.module_id
        ) quiz_count
        ON CONFLICT (student_email, course_id, module_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic module completion creation
DROP TRIGGER IF EXISTS trigger_create_module_completion_on_first_activity ON student_progress;
CREATE TRIGGER trigger_create_module_completion_on_first_activity
    AFTER INSERT ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION create_module_completion_on_first_activity();

-- 7. Create a function to mark course as completed when all requirements are met
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
        AND sp.progress_type = 'lesson_completed'
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
        AND sp.progress_type = 'assignment_submitted'
    ) completed_assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quizzes q
        WHERE q.course_id = NEW.course_id
    ) quiz_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quiz_attempts qa
        JOIN quizzes q ON q.id = qa.quiz_id
        WHERE qa.student_email = NEW.student_email 
        AND q.course_id = NEW.course_id 
        AND qa.passed = true
    ) passed_quiz_count;

    -- Calculate completion percentage
    completion_percentage := CASE 
        WHEN (total_lessons + total_assignments + total_quizzes) > 0 THEN
            ROUND(((completed_lessons + completed_assignments + passed_quizzes)::DECIMAL / (total_lessons + total_assignments + total_quizzes)) * 100)
        ELSE 0
    END;

    -- Update course completion record
    UPDATE course_completions 
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

-- 8. Create a function to mark module as completed when all requirements are met
CREATE OR REPLACE FUNCTION check_module_completion()
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
    -- Only process if module_id is provided
    IF NEW.module_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get completion statistics for the module
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
        FROM lessons l
        WHERE l.module_id = NEW.module_id
    ) lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT l.id) as total
        FROM student_progress sp
        JOIN lessons l ON l.id = sp.lesson_id
        WHERE sp.student_email = NEW.student_email 
        AND sp.module_id = NEW.module_id 
        AND sp.status = 'completed'
        AND sp.progress_type = 'lesson_completed'
    ) completed_lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT a.id) as total
        FROM assignments a
        WHERE a.course_id = NEW.course_id AND a.module_id = NEW.module_id
    ) assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT a.id) as total
        FROM student_progress sp
        JOIN assignments a ON a.id = (sp.metadata->>'assignment_id')::UUID
        WHERE sp.student_email = NEW.student_email 
        AND sp.course_id = NEW.course_id 
        AND sp.module_id = NEW.module_id
        AND sp.status = 'completed'
        AND sp.progress_type = 'assignment_submitted'
    ) completed_assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quizzes q
        WHERE q.course_id = NEW.course_id AND q.module_id = NEW.module_id
    ) quiz_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quiz_attempts qa
        JOIN quizzes q ON q.id = qa.quiz_id
        WHERE qa.student_email = NEW.student_email 
        AND q.course_id = NEW.course_id 
        AND q.module_id = NEW.module_id
        AND qa.passed = true
    ) passed_quiz_count;

    -- Calculate completion percentage
    completion_percentage := CASE 
        WHEN (total_lessons + total_assignments + total_quizzes) > 0 THEN
            ROUND(((completed_lessons + completed_assignments + passed_quizzes)::DECIMAL / (total_lessons + total_assignments + total_quizzes)) * 100)
        ELSE 0
    END;

    -- Update module completion record
    UPDATE module_completions 
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
    WHERE student_email = NEW.student_email AND course_id = NEW.course_id AND module_id = NEW.module_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for module completion checking
DROP TRIGGER IF EXISTS trigger_check_module_completion ON student_progress;
CREATE TRIGGER trigger_check_module_completion
    AFTER INSERT OR UPDATE ON student_progress
    FOR EACH ROW
    EXECUTE FUNCTION check_module_completion();

-- 9. Create a function to automatically log activities when progress is recorded
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
        CASE NEW.progress_type
            WHEN 'lesson_completed' THEN 'lesson_completed'
            WHEN 'quiz_passed' THEN 'quiz_completed'
            WHEN 'assignment_submitted' THEN 'assignment_submitted'
            WHEN 'discussion_participated' THEN 'discussion_posted'
            WHEN 'poll_responded' THEN 'poll_responded'
            ELSE 'lesson_completed'
        END,
        CASE NEW.progress_type
            WHEN 'lesson_completed' THEN 'Completed lesson'
            WHEN 'quiz_passed' THEN 'Completed quiz'
            WHEN 'assignment_submitted' THEN 'Submitted assignment'
            WHEN 'discussion_participated' THEN 'Participated in discussion'
            WHEN 'poll_responded' THEN 'Responded to poll'
            ELSE 'Completed activity'
        END,
        jsonb_build_object(
            'progress_type', NEW.progress_type,
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

-- 10. Create a view for teacher dashboard
CREATE OR REPLACE VIEW teacher_student_progress AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.teacher_email,
    e.student_email,
    s.name as student_name,
    cc.completion_percentage as course_completion_percentage,
    cc.total_lessons,
    cc.completed_lessons,
    cc.total_assignments,
    cc.completed_assignments,
    cc.total_quizzes,
    cc.passed_quizzes,
    cc.average_grade,
    cc.last_activity_at,
    cc.started_at,
    cc.completed_at,
    COUNT(sa.id) as total_activities,
    MAX(sa.created_at) as last_activity
FROM courses c
JOIN enrollments e ON e.course_id = c.id
JOIN students s ON s.email = e.student_email
LEFT JOIN course_completions cc ON cc.student_email = e.student_email AND cc.course_id = c.id
LEFT JOIN student_activities sa ON sa.student_email = e.student_email AND sa.course_id = c.id
GROUP BY 
    c.id, c.title, c.teacher_email, e.student_email, s.name,
    cc.completion_percentage, cc.total_lessons, cc.completed_lessons,
    cc.total_assignments, cc.completed_assignments, cc.total_quizzes,
    cc.passed_quizzes, cc.average_grade, cc.last_activity_at,
    cc.started_at, cc.completed_at;

-- 11. Create a view for student dashboard
CREATE OR REPLACE VIEW student_progress_dashboard AS
SELECT 
    sp.student_email,
    c.id as course_id,
    c.title as course_title,
    m.id as module_id,
    m.title as module_title,
    l.id as lesson_id,
    l.title as lesson_title,
    sp.progress_type,
    sp.status,
    sp.score,
    sp.time_spent_seconds,
    sp.created_at as completed_at,
    cc.completion_percentage as course_completion_percentage,
    mc.completion_percentage as module_completion_percentage,
    ROW_NUMBER() OVER (PARTITION BY sp.student_email, sp.course_id ORDER BY sp.created_at DESC) as activity_rank
FROM student_progress sp
JOIN courses c ON c.id = sp.course_id
LEFT JOIN modules m ON m.id = sp.module_id
LEFT JOIN lessons l ON l.id = sp.lesson_id
LEFT JOIN course_completions cc ON cc.student_email = sp.student_email AND cc.course_id = sp.course_id
LEFT JOIN module_completions mc ON mc.student_email = sp.student_email AND mc.course_id = sp.course_id AND mc.module_id = sp.module_id;

-- 12. Add RLS policies for the new views
CREATE POLICY "Teachers can view student progress dashboard" ON teacher_student_progress
    FOR SELECT USING (teacher_email = current_user);

CREATE POLICY "Students can view their own progress dashboard" ON student_progress_dashboard
    FOR SELECT USING (student_email = current_user);

-- 13. Create indexes for the views
CREATE INDEX IF NOT EXISTS idx_teacher_student_progress_teacher ON teacher_student_progress(teacher_email);
CREATE INDEX IF NOT EXISTS idx_teacher_student_progress_course ON teacher_student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_dashboard_student ON student_progress_dashboard(student_email);
CREATE INDEX IF NOT EXISTS idx_student_progress_dashboard_course ON student_progress_dashboard(course_id);

-- 14. Insert sample progress data for testing (if needed)
-- This will be handled by the application when students actually interact with content
