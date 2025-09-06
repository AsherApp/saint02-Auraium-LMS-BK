-- =====================================================
-- CREATE MISSING BACKEND TABLES
-- =====================================================
-- This migration creates all the tables that the backend is trying to use
-- but don't exist in the database.

-- Tables that exist in your DB but backend doesn't use (will be cleaned up later):
-- student_attendance, student_invites, messages, live_poll_options, live_poll_votes, 
-- live_polls, live_quiz_responses, live_quizzes, quiz_responses, forum_replies, 
-- forum_subscriptions, forum_tags, forum_topic_tags, forum_topics, forum_votes, 
-- event_participants, event_reminders, events, poll_options, poll_votes, polls

-- =====================================================
-- CREATE MISSING TABLES THAT BACKEND USES
-- =====================================================

-- 1. lesson_content table - REMOVED
-- The lessons table already has a content JSONB column, so we don't need a separate lesson_content table
-- This was creating confusion and duplication

-- 2. Files table (backend uses this for file storage)
CREATE TABLE IF NOT EXISTS Files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_by TEXT NOT NULL, -- email of uploader
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. live_attendance_records table (backend uses this heavily)
CREATE TABLE IF NOT EXISTS live_attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES live_sessions(session_id) ON DELETE CASCADE,
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'present', -- 'present', 'late', 'absent'
    participation_score INTEGER DEFAULT 0,
    engagement_score INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_email)
);

-- 4. live_attendance_reports table (backend uses this)
CREATE TABLE IF NOT EXISTS live_attendance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES live_sessions(session_id) ON DELETE CASCADE,
    total_participants INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    average_participation_score NUMERIC(5,2) DEFAULT 0,
    average_engagement_score NUMERIC(5,2) DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. live_attendance_settings table - MOVED to 014_fix_table_name_mismatches.sql
-- Backend actually uses this table, so it needs to be created

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- lesson_content indexes - REMOVED (table doesn't exist)

-- Files indexes
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON Files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_course_id ON Files(course_id);
CREATE INDEX IF NOT EXISTS idx_files_lesson_id ON Files(lesson_id);

-- live_attendance_records indexes
CREATE INDEX IF NOT EXISTS idx_live_attendance_records_session_id ON live_attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_live_attendance_records_student_email ON live_attendance_records(student_email);
CREATE INDEX IF NOT EXISTS idx_live_attendance_records_status ON live_attendance_records(status);

-- live_attendance_reports indexes
CREATE INDEX IF NOT EXISTS idx_live_attendance_reports_session_id ON live_attendance_reports(session_id);

-- live_attendance_settings indexes - MOVED to 014_fix_table_name_mismatches.sql

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- lesson_content table removed - lessons table already has content JSONB column
COMMENT ON TABLE Files IS 'File storage and management for courses and lessons';
COMMENT ON TABLE live_attendance_records IS 'Individual student attendance records for live sessions';
COMMENT ON TABLE live_attendance_reports IS 'Aggregated attendance reports for live sessions';
-- live_attendance_settings table moved to 014_fix_table_name_mismatches.sql

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates all the missing tables that the backend is trying to use:
-- 1. Files - For file storage and management
-- 2. live_attendance_records - For individual attendance tracking
-- 3. live_attendance_reports - For attendance summaries
--
-- MOVED to other migrations:
-- - live_attendance_settings: moved to 014_fix_table_name_mismatches.sql
-- 
-- REMOVED (to avoid confusion):
-- - lesson_content: lessons table already has content JSONB column
--
-- All tables include proper foreign key relationships, indexes, and documentation.
-- =====================================================
