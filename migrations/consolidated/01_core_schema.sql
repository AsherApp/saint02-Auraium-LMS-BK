-- =====================================================
-- CONSOLIDATED CORE SCHEMA MIGRATION
-- =====================================================
-- This file consolidates all the core database schema
-- including tables, indexes, and basic relationships
-- that are actually used in the system.

-- =====================================================
-- CORE TABLES (ACTUALLY USED BY BACKEND)
-- =====================================================

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    student_code TEXT UNIQUE,
    profile_picture_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    teacher_email TEXT NOT NULL REFERENCES teachers(email) ON DELETE CASCADE,
    thumbnail_url TEXT,
    visibility TEXT DEFAULT 'private',
    enrollment_policy TEXT DEFAULT 'invite_only',
    course_mode TEXT DEFAULT 'full', -- 'full' or 'public'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}',
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, student_email)
);

-- =====================================================
-- ASSIGNMENT & QUIZ TABLES
-- =====================================================

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    content TEXT,
    status TEXT DEFAULT 'submitted',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    questions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '{}',
    score NUMERIC(5,2),
    passed BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    score NUMERIC(5,2),
    passed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_email, quiz_id, attempt_number)
);

-- =====================================================
-- PROGRESS TRACKING TABLES
-- =====================================================

-- Student progress table
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    progress_type TEXT NOT NULL, -- lesson_completed, quiz_passed, assignment_submitted, etc.
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, failed
    score NUMERIC(5,2),
    time_spent_seconds INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_email, course_id, lesson_id, progress_type)
);

-- Course completions table
CREATE TABLE IF NOT EXISTS course_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_lessons INTEGER NOT NULL DEFAULT 0,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    total_assignments INTEGER NOT NULL DEFAULT 0,
    completed_assignments INTEGER NOT NULL DEFAULT 0,
    total_quizzes INTEGER NOT NULL DEFAULT 0,
    passed_quizzes INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_email, course_id)
);

-- Module completions table
CREATE TABLE IF NOT EXISTS module_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_email, course_id, module_id)
);

-- =====================================================
-- LIVE SESSION TABLES
-- =====================================================

-- Live sessions table
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_email TEXT NOT NULL REFERENCES teachers(email) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'scheduled', -- scheduled, active, ended
    room_id TEXT,
    allow_recording BOOLEAN DEFAULT TRUE,
    require_approval BOOLEAN DEFAULT FALSE,
    max_participants INTEGER DEFAULT 50,
    session_type TEXT DEFAULT 'general',
    is_started BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 60,
    host_email TEXT,
    end_at TIMESTAMPTZ,
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live participants table
CREATE TABLE IF NOT EXISTS live_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live attendance records table
CREATE TABLE IF NOT EXISTS live_attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'present', -- present, late, absent
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live attendance reports table
CREATE TABLE IF NOT EXISTS live_attendance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    total_participants INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    average_duration_minutes NUMERIC(5,2) DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live attendance settings table
CREATE TABLE IF NOT EXISTS live_attendance_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    late_threshold_minutes INTEGER DEFAULT 5,
    absence_threshold_minutes INTEGER DEFAULT 15,
    minimum_attendance_percentage NUMERIC(5,2) DEFAULT 80.00,
    require_checkout BOOLEAN DEFAULT FALSE,
    participation_tracking BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id)
);

-- Live messages table
CREATE TABLE IF NOT EXISTS live_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    sender_name TEXT,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- text, system, announcement
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live notes table
CREATE TABLE IF NOT EXISTS live_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live classwork table
CREATE TABLE IF NOT EXISTS live_classwork (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    due_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live classwork submissions table
CREATE TABLE IF NOT EXISTS live_classwork_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    classwork_id UUID NOT NULL REFERENCES live_classwork(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recordings table
CREATE TABLE IF NOT EXISTS recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_email TEXT REFERENCES teachers(email) ON DELETE CASCADE,
    teacher_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    file_size_bytes BIGINT DEFAULT 0,
    status TEXT DEFAULT 'processing', -- processing, ready, failed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DISCUSSION & COMMUNICATION TABLES
-- =====================================================

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_email TEXT NOT NULL REFERENCES teachers(email) ON DELETE CASCADE,
    is_important BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussions table
CREATE TABLE IF NOT EXISTS discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion posts table
CREATE TABLE IF NOT EXISTS discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by TEXT NOT NULL,
    parent_post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- POLL & ENGAGEMENT TABLES
-- =====================================================

-- Polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll options table
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Poll responses table
CREATE TABLE IF NOT EXISTS poll_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_email, poll_id)
);

-- =====================================================
-- STUDENT ACTIVITY & GRADES TABLES
-- =====================================================

-- Student activities table
CREATE TABLE IF NOT EXISTS student_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- login, lesson_view, assignment_submit, quiz_take, etc.
    activity_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student grades table
CREATE TABLE IF NOT EXISTS student_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    grade NUMERIC(5,2),
    feedback TEXT,
    graded_by TEXT,
    graded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTES & FILES TABLES
-- =====================================================

-- Notes table (general notes)
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student notes table (student-specific personal notes)
CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS Files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS & INVITES TABLES
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, success, error
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    invited_by TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD ALL INDEXES FOR PERFORMANCE
-- =====================================================

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);

-- Teachers indexes
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_teacher_email ON courses(teacher_email);
CREATE INDEX IF NOT EXISTS idx_courses_course_mode ON courses(course_mode);

-- Modules indexes
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order_index ON modules(order_index);

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_email ON enrollments(student_email);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_student_email ON submissions(student_email);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_course_id ON submissions(course_id);

-- Quizzes indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes(course_id);

-- Quiz responses indexes
CREATE INDEX IF NOT EXISTS idx_quiz_responses_student_email ON quiz_responses(student_email);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON quiz_responses(quiz_id);

-- Quiz attempts indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_email ON quiz_attempts(student_email);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_passed ON quiz_attempts(passed);

-- Student progress indexes
CREATE INDEX IF NOT EXISTS idx_student_progress_student_email ON student_progress(student_email);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_course_id ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_lesson_id ON student_progress(lesson_id);

-- Course completions indexes
CREATE INDEX IF NOT EXISTS idx_course_completions_student_email ON course_completions(student_email);
CREATE INDEX IF NOT EXISTS idx_course_completions_student_id ON course_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_course_id ON course_completions(course_id);

-- Module completions indexes
CREATE INDEX IF NOT EXISTS idx_module_completions_student_email ON module_completions(student_email);
CREATE INDEX IF NOT EXISTS idx_module_completions_student_id ON module_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_course_id ON module_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON module_completions(module_id);

-- Live sessions indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_teacher_email ON live_sessions(teacher_email);
CREATE INDEX IF NOT EXISTS idx_live_sessions_start_time ON live_sessions(start_time);

-- Live participants indexes
CREATE INDEX IF NOT EXISTS idx_live_participants_student_email ON live_participants(student_email);
CREATE INDEX IF NOT EXISTS idx_live_participants_student_id ON live_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_live_participants_session_id ON live_participants(session_id);

-- Live attendance records indexes
CREATE INDEX IF NOT EXISTS idx_live_attendance_records_student_email ON live_attendance_records(student_email);
CREATE INDEX IF NOT EXISTS idx_live_attendance_records_student_id ON live_attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_live_attendance_records_session_id ON live_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_live_attendance_records_status ON live_attendance_records(status);

-- Live attendance reports indexes
CREATE INDEX IF NOT EXISTS idx_live_attendance_reports_session_id ON live_attendance_reports(session_id);

-- Live attendance settings indexes
CREATE INDEX IF NOT EXISTS idx_live_attendance_settings_course_id ON live_attendance_settings(course_id);

-- Live messages indexes
CREATE INDEX IF NOT EXISTS idx_live_messages_session_id ON live_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_live_messages_created_at ON live_messages(created_at);

-- Live notes indexes
CREATE INDEX IF NOT EXISTS idx_live_notes_student_email ON live_notes(student_email);
CREATE INDEX IF NOT EXISTS idx_live_notes_student_id ON live_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_live_notes_session_id ON live_notes(session_id);

-- Live classwork indexes
CREATE INDEX IF NOT EXISTS idx_live_classwork_session_id ON live_classwork(session_id);

-- Live classwork submissions indexes
CREATE INDEX IF NOT EXISTS idx_live_classwork_submissions_student_email ON live_classwork_submissions(student_email);
CREATE INDEX IF NOT EXISTS idx_live_classwork_submissions_student_id ON live_classwork_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_live_classwork_submissions_classwork_id ON live_classwork_submissions(classwork_id);

-- Recordings indexes
CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_course_id ON announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher_email ON announcements(teacher_email);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);

-- Discussions indexes
CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created_by ON discussions(created_by);

-- Discussion posts indexes
CREATE INDEX IF NOT EXISTS idx_discussion_posts_discussion_id ON discussion_posts(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_created_by ON discussion_posts(created_by);

-- Polls indexes
CREATE INDEX IF NOT EXISTS idx_polls_course_id ON polls(course_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);

-- Poll options indexes
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);

-- Poll responses indexes
CREATE INDEX IF NOT EXISTS idx_poll_responses_student_email ON poll_responses(student_email);
CREATE INDEX IF NOT EXISTS idx_poll_responses_student_id ON poll_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);

-- Student activities indexes
CREATE INDEX IF NOT EXISTS idx_student_activities_student_email ON student_activities(student_email);
CREATE INDEX IF NOT EXISTS idx_student_activities_student_id ON student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_course_id ON student_activities(course_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_activity_type ON student_activities(activity_type);

-- Student grades indexes
CREATE INDEX IF NOT EXISTS idx_student_grades_student_email ON student_grades(student_email);
CREATE INDEX IF NOT EXISTS idx_student_grades_student_id ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_course_id ON student_grades(course_id);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_course_id ON notes(course_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);

-- Student notes indexes
CREATE INDEX IF NOT EXISTS idx_student_notes_student_email ON student_notes(student_email);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_course_id ON student_notes(course_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_lesson_id ON student_notes(lesson_id);

-- Files indexes
CREATE INDEX IF NOT EXISTS idx_files_course_id ON Files(course_id);
CREATE INDEX IF NOT EXISTS idx_files_lesson_id ON Files(lesson_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON Files(uploaded_by);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(user_email);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Invites indexes
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_course_id ON invites(course_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This consolidated migration creates all the core tables
-- that are actually used by the backend system.
-- All tables include proper foreign key relationships,
-- indexes for performance, and follow consistent naming conventions.
-- =====================================================
