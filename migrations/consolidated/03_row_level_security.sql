-- =====================================================
-- CONSOLIDATED ROW LEVEL SECURITY (RLS)
-- =====================================================
-- This file consolidates all the Row Level Security policies
-- that are actually used in the system.

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

-- Core tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Assignment & Quiz tables
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Progress tracking tables
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;

-- Live session tables
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classwork ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classwork_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Discussion & Communication tables
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- Poll & Engagement tables
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Student Activity & Grades tables
ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;

-- Notes & Files tables
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE Files ENABLE ROW LEVEL SECURITY;

-- Notifications & Invites tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR STUDENTS
-- =====================================================

-- Students can view their own profile
CREATE POLICY "Students can view their own profile" ON students
    FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Students can update their own profile
CREATE POLICY "Students can update their own profile" ON students
    FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- RLS POLICIES FOR TEACHERS
-- =====================================================

-- Teachers can view their own profile
CREATE POLICY "Teachers can view their own profile" ON teachers
    FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can update their own profile
CREATE POLICY "Teachers can update their own profile" ON teachers
    FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- RLS POLICIES FOR COURSES
-- =====================================================

-- Teachers can manage their own courses
CREATE POLICY "Teachers can manage their own courses" ON courses
    FOR ALL USING (teacher_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Students can view courses they're enrolled in
CREATE POLICY "Students can view enrolled courses" ON courses
    FOR SELECT USING (
        id IN (
            SELECT course_id FROM enrollments 
            WHERE student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR MODULES
-- =====================================================

-- Teachers can manage modules for their courses
CREATE POLICY "Teachers can manage modules for their courses" ON modules
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view modules for courses they're enrolled in
CREATE POLICY "Students can view modules for enrolled courses" ON modules
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LESSONS
-- =====================================================

-- Teachers can manage lessons for their courses
CREATE POLICY "Teachers can manage lessons for their courses" ON lessons
    FOR ALL USING (
        module_id IN (
            SELECT m.id FROM modules m
            JOIN courses c ON c.id = m.course_id
            WHERE c.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view lessons for courses they're enrolled in
CREATE POLICY "Students can view lessons for enrolled courses" ON lessons
    FOR SELECT USING (
        module_id IN (
            SELECT m.id FROM modules m
            JOIN enrollments e ON e.course_id = m.course_id
            WHERE e.student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR ENROLLMENTS
-- =====================================================

-- Teachers can manage enrollments for their courses
CREATE POLICY "Teachers can manage enrollments for their courses" ON enrollments
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view their own enrollments
CREATE POLICY "Students can view their own enrollments" ON enrollments
    FOR SELECT USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- RLS POLICIES FOR ASSIGNMENTS
-- =====================================================

-- Teachers can manage assignments for their courses
CREATE POLICY "Teachers can manage assignments for their courses" ON assignments
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view assignments for courses they're enrolled in
CREATE POLICY "Students can view assignments for enrolled courses" ON assignments
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR SUBMISSIONS
-- =====================================================

-- Students can manage their own submissions
CREATE POLICY "Students can manage their own submissions" ON submissions
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view submissions for their courses
CREATE POLICY "Teachers can view submissions for their courses" ON submissions
    FOR SELECT USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR QUIZZES
-- =====================================================

-- Teachers can manage quizzes for their courses
CREATE POLICY "Teachers can manage quizzes for their courses" ON quizzes
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view quizzes for courses they're enrolled in
CREATE POLICY "Students can view quizzes for enrolled courses" ON quizzes
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR QUIZ RESPONSES
-- =====================================================

-- Students can manage their own quiz responses
CREATE POLICY "Students can manage their own quiz responses" ON quiz_responses
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view quiz responses for their courses
CREATE POLICY "Teachers can view quiz responses for their courses" ON quiz_responses
    FOR SELECT USING (
        quiz_id IN (
            SELECT q.id FROM quizzes q
            JOIN courses c ON c.id = q.course_id
            WHERE c.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR QUIZ ATTEMPTS
-- =====================================================

-- Students can manage their own quiz attempts
CREATE POLICY "Students can manage their own quiz attempts" ON quiz_attempts
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view quiz attempts for their courses
CREATE POLICY "Teachers can view quiz attempts for their courses" ON quiz_attempts
    FOR SELECT USING (
        quiz_id IN (
            SELECT q.id FROM quizzes q
            JOIN courses c ON c.id = q.course_id
            WHERE c.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR STUDENT PROGRESS
-- =====================================================

-- Students can view their own progress
CREATE POLICY "Students can view their own progress" ON student_progress
    FOR SELECT USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view progress for their students
CREATE POLICY "Teachers can view progress for their students" ON student_progress
    FOR SELECT USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR COURSE COMPLETIONS
-- =====================================================

-- Students can view their own course completions
CREATE POLICY "Students can view their own course completions" ON course_completions
    FOR SELECT USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view course completions for their students
CREATE POLICY "Teachers can view course completions for their students" ON course_completions
    FOR SELECT USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR MODULE COMPLETIONS
-- =====================================================

-- Students can view their own module completions
CREATE POLICY "Students can view their own module completions" ON module_completions
    FOR SELECT USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view module completions for their students
CREATE POLICY "Teachers can view module completions for their students" ON module_completions
    FOR SELECT USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE SESSIONS
-- =====================================================

-- Teachers can manage their own live sessions
CREATE POLICY "Teachers can manage their own live sessions" ON live_sessions
    FOR ALL USING (teacher_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Students can view live sessions for courses they're enrolled in
CREATE POLICY "Students can view live sessions for enrolled courses" ON live_sessions
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE PARTICIPANTS
-- =====================================================

-- Students can manage their own participation
CREATE POLICY "Students can manage their own participation" ON live_participants
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view participants for their live sessions
CREATE POLICY "Teachers can view participants for their live sessions" ON live_participants
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM live_sessions 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE ATTENDANCE RECORDS
-- =====================================================

-- Students can view their own attendance records
CREATE POLICY "Students can view their own attendance records" ON live_attendance_records
    FOR SELECT USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view attendance records for their live sessions
CREATE POLICY "Teachers can view attendance records for their live sessions" ON live_attendance_records
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM live_sessions 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE ATTENDANCE REPORTS
-- =====================================================

-- Teachers can view attendance reports for their live sessions
CREATE POLICY "Teachers can view attendance reports for their live sessions" ON live_attendance_reports
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM live_sessions 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE ATTENDANCE SETTINGS
-- =====================================================

-- Teachers can manage attendance settings for their courses
CREATE POLICY "Teachers can manage attendance settings for their courses" ON live_attendance_settings
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE MESSAGES
-- =====================================================

-- Users can view messages for live sessions they have access to
CREATE POLICY "Users can view messages for accessible live sessions" ON live_messages
    FOR SELECT USING (
        session_id IN (
            SELECT ls.id FROM live_sessions ls
            LEFT JOIN enrollments e ON e.course_id = ls.course_id
            WHERE ls.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
            OR e.student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Users can insert messages for live sessions they have access to
CREATE POLICY "Users can insert messages for accessible live sessions" ON live_messages
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT ls.id FROM live_sessions ls
            LEFT JOIN enrollments e ON e.course_id = ls.course_id
            WHERE ls.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
            OR e.student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE NOTES
-- =====================================================

-- Students can manage their own live notes
CREATE POLICY "Students can manage their own live notes" ON live_notes
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view live notes for their live sessions
CREATE POLICY "Teachers can view live notes for their live sessions" ON live_notes
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM live_sessions 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE CLASSWORK
-- =====================================================

-- Teachers can manage classwork for their live sessions
CREATE POLICY "Teachers can manage classwork for their live sessions" ON live_classwork
    FOR ALL USING (
        session_id IN (
            SELECT id FROM live_sessions 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view classwork for live sessions they have access to
CREATE POLICY "Students can view classwork for accessible live sessions" ON live_classwork
    FOR SELECT USING (
        session_id IN (
            SELECT ls.id FROM live_sessions ls
            JOIN enrollments e ON e.course_id = ls.course_id
            WHERE e.student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR LIVE CLASSWORK SUBMISSIONS
-- =====================================================

-- Students can manage their own classwork submissions
CREATE POLICY "Students can manage their own classwork submissions" ON live_classwork_submissions
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view classwork submissions for their live sessions
CREATE POLICY "Teachers can view classwork submissions for their live sessions" ON live_classwork_submissions
    FOR SELECT USING (
        classwork_id IN (
            SELECT lc.id FROM live_classwork lc
            JOIN live_sessions ls ON ls.id = lc.session_id
            WHERE ls.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR RECORDINGS
-- =====================================================

-- Teachers can manage recordings for their live sessions
CREATE POLICY "Teachers can manage recordings for their live sessions" ON recordings
    FOR ALL USING (
        session_id IN (
            SELECT id FROM live_sessions 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view recordings for live sessions they have access to
CREATE POLICY "Students can view recordings for accessible live sessions" ON recordings
    FOR SELECT USING (
        session_id IN (
            SELECT ls.id FROM live_sessions ls
            JOIN enrollments e ON e.course_id = ls.course_id
            WHERE e.student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR ANNOUNCEMENTS
-- =====================================================

-- Teachers can manage announcements for their courses
CREATE POLICY "Teachers can manage announcements for their courses" ON announcements
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view announcements for courses they're enrolled in
CREATE POLICY "Students can view announcements for enrolled courses" ON announcements
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR DISCUSSIONS
-- =====================================================

-- Teachers can manage discussions for their courses
CREATE POLICY "Teachers can manage discussions for their courses" ON discussions
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view discussions for courses they're enrolled in
CREATE POLICY "Students can view discussions for enrolled courses" ON discussions
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR DISCUSSION POSTS
-- =====================================================

-- Users can manage their own discussion posts
CREATE POLICY "Users can manage their own discussion posts" ON discussion_posts
    FOR ALL USING (created_by = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can view discussion posts for discussions they have access to
CREATE POLICY "Users can view discussion posts for accessible discussions" ON discussion_posts
    FOR SELECT USING (
        discussion_id IN (
            SELECT d.id FROM discussions d
            LEFT JOIN courses c ON c.id = d.course_id
            LEFT JOIN enrollments e ON e.course_id = c.id
            WHERE c.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
            OR e.student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR POLLS
-- =====================================================

-- Teachers can manage polls for their courses
CREATE POLICY "Teachers can manage polls for their courses" ON polls
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Students can view polls for courses they're enrolled in
CREATE POLICY "Students can view polls for enrolled courses" ON polls
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR POLL OPTIONS
-- =====================================================

-- Users can view poll options for polls they have access to
CREATE POLICY "Users can view poll options for accessible polls" ON poll_options
    FOR SELECT USING (
        poll_id IN (
            SELECT p.id FROM polls p
            LEFT JOIN courses c ON c.id = p.course_id
            LEFT JOIN enrollments e ON e.course_id = c.id
            WHERE c.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
            OR e.student_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR POLL RESPONSES
-- =====================================================

-- Students can manage their own poll responses
CREATE POLICY "Students can manage their own poll responses" ON poll_responses
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view poll responses for their courses
CREATE POLICY "Teachers can view poll responses for their courses" ON poll_responses
    FOR SELECT USING (
        poll_id IN (
            SELECT p.id FROM polls p
            JOIN courses c ON c.id = p.course_id
            WHERE c.teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR STUDENT ACTIVITIES
-- =====================================================

-- Students can view their own activities
CREATE POLICY "Students can view their own activities" ON student_activities
    FOR SELECT USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can view activities for their students
CREATE POLICY "Teachers can view activities for their students" ON student_activities
    FOR SELECT USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR STUDENT GRADES
-- =====================================================

-- Students can view their own grades
CREATE POLICY "Students can view their own grades" ON student_grades
    FOR SELECT USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Teachers can manage grades for their students
CREATE POLICY "Teachers can manage grades for their students" ON student_grades
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- =====================================================
-- RLS POLICIES FOR NOTES
-- =====================================================

-- Users can manage their own notes
CREATE POLICY "Users can manage their own notes" ON notes
    FOR ALL USING (created_by = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- RLS POLICIES FOR STUDENT NOTES
-- =====================================================

-- Students can manage their own student notes
CREATE POLICY "Students can manage their own student notes" ON student_notes
    FOR ALL USING (student_email = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- RLS POLICIES FOR FILES
-- =====================================================

-- Users can manage files they uploaded
CREATE POLICY "Users can manage files they uploaded" ON Files
    FOR ALL USING (uploaded_by = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- RLS POLICIES FOR NOTIFICATIONS
-- =====================================================

-- Users can manage their own notifications
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- RLS POLICIES FOR INVITES
-- =====================================================

-- Teachers can manage invites for their courses
CREATE POLICY "Teachers can manage invites for their courses" ON invites
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses 
            WHERE teacher_email = current_setting('request.jwt.claims', true)::json->>'email'
        )
    );

-- Users can view invites sent to their email
CREATE POLICY "Users can view invites sent to their email" ON invites
    FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This consolidated migration enables Row Level Security
-- on all tables and creates comprehensive policies that:
-- 
-- 1. Ensure students can only access their own data
-- 2. Ensure teachers can only access data for their courses
-- 3. Prevent unauthorized access to sensitive information
-- 4. Maintain proper data isolation between users
-- 
-- All policies use JWT claims for authentication and
-- follow the principle of least privilege.
-- =====================================================
