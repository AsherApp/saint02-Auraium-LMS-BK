-- =====================================================
-- CONSOLIDATED VIEWS AND UTILITIES
-- =====================================================
-- This file consolidates all the database views and utility functions
-- that are actually used in the system.

-- =====================================================
-- UTILITY VIEWS FOR AUTHENTICATION
-- =====================================================

-- User roles view for easy role resolution
CREATE OR REPLACE VIEW user_roles AS
SELECT 
    email,
    'teacher' as role,
    'teachers' as table_name
FROM teachers
UNION ALL
SELECT 
    email,
    'student' as role,
    'students' as table_name
FROM students;

-- =====================================================
-- DASHBOARD VIEWS
-- =====================================================

-- Student progress summary view
CREATE OR REPLACE VIEW student_progress_summary AS
SELECT 
    sp.student_email,
    sp.course_id,
    c.title as course_title,
    COUNT(DISTINCT sp.lesson_id) as lessons_completed,
    COUNT(DISTINCT s.assignment_id) as assignments_submitted,
    COUNT(DISTINCT qr.quiz_id) as quizzes_passed,
    COALESCE(cc.completion_percentage, 0) as completion_percentage,
    COALESCE(cc.completed_at, NULL) as course_completed_at
FROM student_progress sp
LEFT JOIN courses c ON c.id = sp.course_id
LEFT JOIN submissions s ON s.student_email = sp.student_email AND s.course_id = sp.course_id
LEFT JOIN quiz_responses qr ON qr.student_email = sp.student_email AND qr.passed = true
LEFT JOIN course_completions cc ON cc.student_email = sp.student_email AND cc.course_id = sp.course_id
WHERE sp.progress_type = 'lesson_completed' AND sp.status = 'completed'
GROUP BY sp.student_email, sp.course_id, c.title, cc.completion_percentage, cc.completed_at;

-- Teacher student progress view
CREATE OR REPLACE VIEW teacher_student_progress AS
SELECT 
    c.teacher_email,
    c.id as course_id,
    c.title as course_title,
    e.student_email,
    s.name as student_name,
    COALESCE(cc.completion_percentage, 0) as completion_percentage,
    COUNT(DISTINCT sp.lesson_id) as lessons_completed,
    COUNT(DISTINCT sub.assignment_id) as assignments_submitted,
    COUNT(DISTINCT qr.quiz_id) as quizzes_passed,
    e.enrolled_at,
    COALESCE(cc.completed_at, NULL) as course_completed_at
FROM courses c
JOIN enrollments e ON e.course_id = c.id
LEFT JOIN students s ON s.email = e.student_email
LEFT JOIN student_progress sp ON sp.student_email = e.student_email AND sp.course_id = c.id
LEFT JOIN submissions sub ON sub.student_email = e.student_email AND sub.course_id = c.id
LEFT JOIN quiz_responses qr ON qr.student_email = e.student_email AND qr.passed = true
LEFT JOIN course_completions cc ON cc.student_email = e.student_email AND cc.course_id = c.id
GROUP BY c.teacher_email, c.id, c.title, e.student_email, s.name, cc.completion_percentage, e.enrolled_at, cc.completed_at;

-- Course roster view (combines pending invites vs active enrollments)
CREATE OR REPLACE VIEW course_roster AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.teacher_email,
    'enrolled' as status,
    e.student_email,
    s.name as student_name,
    e.enrolled_at as date_added,
    COALESCE(cc.completion_percentage, 0) as completion_percentage
FROM courses c
JOIN enrollments e ON e.course_id = c.id
LEFT JOIN students s ON s.email = e.student_email
LEFT JOIN course_completions cc ON cc.student_email = e.student_email AND cc.course_id = c.id
UNION ALL
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.teacher_email,
    'invited' as status,
    i.email as student_email,
    NULL as student_name,
    i.created_at as date_added,
    0 as completion_percentage
FROM courses c
JOIN invites i ON i.course_id = c.id
WHERE i.status = 'pending';

-- Student progress dashboard view
CREATE OR REPLACE VIEW student_progress_dashboard AS
SELECT 
    sp.student_email,
    sp.course_id,
    c.title as course_title,
    c.teacher_email,
    t.name as teacher_name,
    COUNT(DISTINCT m.id) as total_modules,
    COUNT(DISTINCT l.id) as total_lessons,
    COUNT(DISTINCT a.id) as total_assignments,
    COUNT(DISTINCT q.id) as total_quizzes,
    COUNT(DISTINCT CASE WHEN sp.progress_type = 'lesson_completed' AND sp.status = 'completed' THEN sp.lesson_id END) as completed_lessons,
    COUNT(DISTINCT s.assignment_id) as completed_assignments,
    COUNT(DISTINCT CASE WHEN qr.passed = true THEN qr.quiz_id END) as passed_quizzes,
    COALESCE(cc.completion_percentage, 0) as completion_percentage,
    COALESCE(cc.completed_at, NULL) as course_completed_at,
    e.enrolled_at
FROM student_progress sp
JOIN courses c ON c.id = sp.course_id
JOIN teachers t ON t.email = c.teacher_email
JOIN enrollments e ON e.student_email = sp.student_email AND e.course_id = sp.course_id
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
LEFT JOIN assignments a ON a.course_id = c.id
LEFT JOIN quizzes q ON q.course_id = c.id
LEFT JOIN submissions s ON s.student_email = sp.student_email AND s.course_id = c.id AND s.status = 'submitted'
LEFT JOIN quiz_responses qr ON qr.student_email = sp.student_email AND qr.passed = true
LEFT JOIN course_completions cc ON cc.student_email = sp.student_email AND cc.course_id = sp.course_id
GROUP BY sp.student_email, sp.course_id, c.title, c.teacher_email, t.name, cc.completion_percentage, cc.completed_at, e.enrolled_at;

-- =====================================================
-- COMMUNICATION VIEWS
-- =====================================================

CREATE OR REPLACE VIEW discussion_inbox_summary AS
SELECT 
    dp.user_email,
    d.id AS discussion_id,
    d.title,
    d.description,
    d.owner_email,
    d.discussion_type,
    d.visibility,
    d.context_type,
    d.context_id,
    d.last_activity_at,
    dp.participant_role,
    dp.status,
    dp.unread_count,
    d.metadata,
    (
        SELECT jsonb_build_object(
            'post_id', p.id,
            'author_email', p.author_email,
            'created_at', p.created_at,
            'content', p.content
        )
        FROM discussion_posts p
        WHERE p.discussion_id = d.id
          AND p.is_deleted = FALSE
        ORDER BY p.created_at DESC
        LIMIT 1
    ) AS last_post
FROM discussion_participants dp
JOIN discussions d ON d.id = dp.discussion_id;

CREATE OR REPLACE VIEW forum_recent_threads AS
SELECT 
    ft.id AS thread_id,
    ft.title,
    ft.category_id,
    fc.title AS category_title,
    ft.author_email,
    ft.context_type,
    ft.context_id,
    ft.is_pinned,
    ft.is_locked,
    ft.last_activity_at,
    COUNT(DISTINCT fp.id) AS total_posts,
    COUNT(DISTINCT fps.user_email) AS total_subscribers
FROM forum_threads ft
JOIN forum_categories fc ON fc.id = ft.category_id
LEFT JOIN forum_posts fp ON fp.thread_id = ft.id AND fp.is_deleted = FALSE
LEFT JOIN forum_thread_subscriptions fps ON fps.thread_id = ft.id
GROUP BY ft.id, ft.title, ft.category_id, fc.title, ft.author_email, ft.context_type, ft.context_id, ft.is_pinned, ft.is_locked, ft.last_activity_at;

CREATE OR REPLACE VIEW active_announcements AS
SELECT 
    a.id,
    a.title,
    a.content,
    a.rich_content,
    a.author_email,
    a.author_role,
    a.context_type,
    a.context_id,
    a.priority,
    a.display_type,
    a.starts_at,
    a.ends_at,
    a.published_at,
    a.metadata
FROM announcements a
WHERE a.status = 'published'
  AND (a.starts_at IS NULL OR a.starts_at <= NOW())
  AND (a.ends_at IS NULL OR a.ends_at >= NOW());

CREATE OR REPLACE VIEW announcement_audience_summary AS
SELECT 
    a.id AS announcement_id,
    a.title,
    a.author_email,
    a.priority,
    jsonb_agg(
        jsonb_build_object(
            'audience_type', aa.audience_type,
            'audience_id', aa.audience_id,
            'audience_value', aa.audience_value
        )
    ) FILTER (WHERE aa.id IS NOT NULL) AS audiences
FROM announcements a
LEFT JOIN announcement_audience aa ON aa.announcement_id = a.id
GROUP BY a.id, a.title, a.author_email, a.priority;

CREATE OR REPLACE VIEW announcement_delivery_matrix AS
SELECT 
    a.id AS announcement_id,
    a.title,
    a.priority,
    a.starts_at,
    a.ends_at,
    ar.user_email,
    ar.read_at,
    ar.dismissed_at
FROM announcements a
JOIN announcement_reads ar ON ar.announcement_id = a.id;

-- =====================================================
-- LIVE SESSION VIEWS
-- =====================================================

-- Live session summary view
CREATE OR REPLACE VIEW live_session_summary AS
SELECT 
    ls.id as session_id,
    ls.title as session_title,
    ls.course_id,
    c.title as course_title,
    ls.teacher_email,
    t.name as teacher_name,
    ls.start_time,
    ls.end_time,
    ls.status,
    COUNT(DISTINCT lp.student_email) as total_participants,
    COUNT(DISTINCT lar.student_email) as attendance_count,
    COUNT(DISTINCT lm.id) as message_count,
    COUNT(DISTINCT ln.id) as note_count,
    COUNT(DISTINCT r.id) as recording_count
FROM live_sessions ls
JOIN courses c ON c.id = ls.course_id
JOIN teachers t ON t.email = ls.teacher_email
LEFT JOIN live_participants lp ON lp.session_id = ls.id
LEFT JOIN live_attendance_records lar ON lar.session_id = ls.id
LEFT JOIN live_messages lm ON lm.session_id = ls.id
LEFT JOIN live_notes ln ON ln.session_id = ls.id
LEFT JOIN recordings r ON r.session_id = ls.id
GROUP BY ls.id, ls.title, ls.course_id, c.title, ls.teacher_email, t.name, ls.start_time, ls.end_time, ls.status;

-- Live attendance summary view
CREATE OR REPLACE VIEW live_attendance_summary AS
SELECT 
    lar.session_id,
    ls.title as session_title,
    ls.course_id,
    c.title as course_title,
    lar.student_email,
    s.name as student_name,
    lar.joined_at,
    lar.left_at,
    lar.duration_minutes,
    lar.status,
    CASE 
        WHEN lar.left_at IS NULL THEN 'still_present'
        WHEN lar.duration_minutes >= 30 THEN 'full_attendance'
        WHEN lar.duration_minutes >= 15 THEN 'partial_attendance'
        ELSE 'minimal_attendance'
    END as attendance_quality
FROM live_attendance_records lar
JOIN live_sessions ls ON ls.id = lar.session_id
JOIN courses c ON c.id = ls.course_id
LEFT JOIN students s ON s.email = lar.student_email;

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- Course analytics view
CREATE OR REPLACE VIEW course_analytics AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    c.teacher_email,
    t.name as teacher_name,
    COUNT(DISTINCT e.student_email) as total_students,
    COUNT(DISTINCT m.id) as total_modules,
    COUNT(DISTINCT l.id) as total_lessons,
    COUNT(DISTINCT a.id) as total_assignments,
    COUNT(DISTINCT q.id) as total_quizzes,
    COUNT(DISTINCT ls.id) as total_live_sessions,
    COUNT(DISTINCT CASE WHEN cc.completion_percentage >= 100 THEN cc.student_email END) as completed_students,
    AVG(cc.completion_percentage) as average_completion_percentage
FROM courses c
JOIN teachers t ON t.email = c.teacher_email
LEFT JOIN enrollments e ON e.course_id = c.id
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN lessons l ON l.module_id = m.id
LEFT JOIN assignments a ON a.course_id = c.id
LEFT JOIN quizzes q ON q.course_id = c.id
LEFT JOIN live_sessions ls ON ls.course_id = c.id
LEFT JOIN course_completions cc ON cc.course_id = c.id
GROUP BY c.id, c.title, c.teacher_email, t.name;

-- Student engagement view
CREATE OR REPLACE VIEW student_engagement AS
SELECT 
    sa.student_email,
    s.name as student_name,
    sa.course_id,
    c.title as course_title,
    COUNT(DISTINCT sa.id) as total_activities,
    COUNT(DISTINCT CASE WHEN sa.activity_type = 'login' THEN sa.id END) as login_count,
    COUNT(DISTINCT CASE WHEN sa.activity_type = 'lesson_view' THEN sa.id END) as lesson_views,
    COUNT(DISTINCT CASE WHEN sa.activity_type = 'assignment_submit' THEN sa.id END) as assignment_submissions,
    COUNT(DISTINCT CASE WHEN sa.activity_type = 'quiz_take' THEN sa.id END) as quiz_attempts,
    MAX(sa.created_at) as last_activity,
    MIN(sa.created_at) as first_activity
FROM student_activities sa
JOIN students s ON s.email = sa.student_email
JOIN courses c ON c.id = sa.course_id
GROUP BY sa.student_email, s.name, sa.course_id, c.title;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM user_roles
    WHERE email = user_email;
    
    RETURN COALESCE(user_role, 'unknown');
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is enrolled in course
CREATE OR REPLACE FUNCTION is_user_enrolled(user_email TEXT, course_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    enrollment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO enrollment_count
    FROM enrollments
    WHERE student_email = user_email AND course_id = course_uuid;
    
    RETURN enrollment_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is teacher of course
CREATE OR REPLACE FUNCTION is_user_teacher_of_course(user_email TEXT, course_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    teacher_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO teacher_count
    FROM courses
    WHERE teacher_email = user_email AND id = course_uuid;
    
    RETURN teacher_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get course completion percentage
CREATE OR REPLACE FUNCTION get_course_completion_percentage(student_email TEXT, course_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    completion_percentage NUMERIC;
BEGIN
    SELECT COALESCE(completion_percentage, 0) INTO completion_percentage
    FROM course_completions
    WHERE student_email = student_email AND course_id = course_uuid;
    
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to get student progress summary
CREATE OR REPLACE FUNCTION get_student_progress_summary(student_email TEXT, course_uuid UUID)
RETURNS TABLE(
    total_lessons INTEGER,
    completed_lessons INTEGER,
    total_assignments INTEGER,
    completed_assignments INTEGER,
    total_quizzes INTEGER,
    passed_quizzes INTEGER,
    completion_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(lesson_count.total, 0)::INTEGER as total_lessons,
        COALESCE(completed_lesson_count.total, 0)::INTEGER as completed_lessons,
        COALESCE(assignment_count.total, 0)::INTEGER as total_assignments,
        COALESCE(completed_assignment_count.total, 0)::INTEGER as completed_assignments,
        COALESCE(quiz_count.total, 0)::INTEGER as total_quizzes,
        COALESCE(passed_quiz_count.total, 0)::INTEGER as passed_quizzes,
        COALESCE(cc.completion_percentage, 0) as completion_percentage
    FROM (
        SELECT COUNT(DISTINCT l.id) as total
        FROM courses c
        LEFT JOIN modules m ON m.course_id = c.id
        LEFT JOIN lessons l ON l.module_id = m.id
        WHERE c.id = course_uuid
    ) lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT sp.lesson_id) as total
        FROM student_progress sp
        WHERE sp.student_email = student_email 
        AND sp.course_id = course_uuid 
        AND sp.lesson_id IS NOT NULL
        AND sp.progress_type = 'lesson_completed'
        AND sp.status = 'completed'
    ) completed_lesson_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT a.id) as total
        FROM assignments a
        WHERE a.course_id = course_uuid
    ) assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT s.assignment_id) as total
        FROM submissions s
        WHERE s.student_email = student_email 
        AND s.course_id = course_uuid 
        AND s.status = 'submitted'
    ) completed_assignment_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT q.id) as total
        FROM quizzes q
        WHERE q.course_id = course_uuid
    ) quiz_count
    CROSS JOIN (
        SELECT COUNT(DISTINCT qr.quiz_id) as total
        FROM quiz_responses qr
        WHERE qr.student_email = student_email 
        AND qr.passed = true
    ) passed_quiz_count
    LEFT JOIN course_completions cc ON cc.student_email = student_email AND cc.course_id = course_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This consolidated migration creates all the views and utility functions
-- that are actually used in the system.
-- 
-- Views:
-- - user_roles: For authentication and role resolution
-- - student_progress_summary: Student progress overview
-- - teacher_student_progress: Teacher's view of student progress
-- - course_roster: Course enrollment and invite status
-- - student_progress_dashboard: Comprehensive student dashboard
-- - live_session_summary: Live session statistics
-- - live_attendance_summary: Attendance tracking
-- - course_analytics: Course performance metrics
-- - student_engagement: Student activity tracking
-- 
-- Functions:
-- - get_user_role(): Get user role by email
-- - is_user_enrolled(): Check course enrollment
-- - is_user_teacher_of_course(): Check if user teaches course
-- - get_course_completion_percentage(): Get completion percentage
-- - get_student_progress_summary(): Get detailed progress summary
-- =====================================================
