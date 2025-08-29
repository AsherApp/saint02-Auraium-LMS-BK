-- Step 4: Create course completion calculation function
-- This step creates a function that automatically updates course completion percentages

-- Create a function to mark course as completed when all requirements are met
CREATE OR REPLACE FUNCTION check_course_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    completion_percentage INTEGER;
BEGIN
    -- Get completion statistics
    SELECT 
        COALESCE(lesson_count.total, 0),
        COALESCE(completed_lesson_count.total, 0)
    INTO 
        total_lessons,
        completed_lessons
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
    ) completed_lesson_count;

    -- Calculate completion percentage
    completion_percentage := CASE 
        WHEN total_lessons > 0 THEN
            ROUND((completed_lessons::DECIMAL / total_lessons) * 100)
        ELSE 0
    END;

    -- Update course progress record
    UPDATE student_course_progress 
    SET 
        completion_percentage = completion_percentage,
        total_lessons = total_lessons,
        completed_lessons = completed_lessons,
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

-- Success message
SELECT 'Step 4 completed: Course completion calculation function created' as status;
