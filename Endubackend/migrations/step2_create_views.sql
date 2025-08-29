-- Step 2: Create database views for easy progress querying
-- This step creates views that make it easier to query progress data

-- 1. Create a view for easy progress querying using existing tables
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

-- 2. Create a view for teacher dashboard using existing tables
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

-- 3. Create a view for student dashboard using existing tables
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

-- 4. Note: Views don't need indexes - they use indexes from the underlying tables
-- The indexes we created in Step 1 will help with view performance

-- Success message
SELECT 'Step 2 completed: Database views created for progress querying' as status;
