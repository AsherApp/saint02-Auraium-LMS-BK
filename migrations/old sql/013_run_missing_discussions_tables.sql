-- =====================================================
-- RUN MISSING DISCUSSIONS TABLES
-- =====================================================
-- This migration runs the missing table definitions from discussions_tables.sql
-- that are needed by the backend but haven't been created yet.

-- =====================================================
-- CREATE MISSING TABLES FROM DISCUSSIONS_TABLES.SQL
-- =====================================================

-- Course completions table (needed by backend)
CREATE TABLE IF NOT EXISTS course_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_lessons INTEGER NOT NULL DEFAULT 0,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    total_assignments INTEGER NOT NULL DEFAULT 0,
    completed_assignments INTEGER NOT NULL DEFAULT 0,
    total_quizzes INTEGER NOT NULL DEFAULT 0,
    passed_quizzes INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_email, course_id)
);

-- Module completions table (needed by backend)
CREATE TABLE IF NOT EXISTS module_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_lessons INTEGER NOT NULL DEFAULT 0,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_email, course_id, module_id)
);

-- Quiz attempts table (needed by backend)
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    score NUMERIC(5,2),
    passed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_email, quiz_id, attempt_number)
);

-- Poll responses table (needed by backend)
CREATE TABLE IF NOT EXISTS poll_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL,
    response_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_email, poll_id)
);

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_course_completions_student_email ON course_completions(student_email);
CREATE INDEX IF NOT EXISTS idx_course_completions_course_id ON course_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_student_email ON module_completions(student_email);
CREATE INDEX IF NOT EXISTS idx_module_completions_course_id ON module_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON module_completions(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_email ON quiz_attempts(student_email);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_passed ON quiz_attempts(passed);
CREATE INDEX IF NOT EXISTS idx_poll_responses_student_email ON poll_responses(student_email);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE course_completions IS 'Course completion tracking for students';
COMMENT ON TABLE module_completions IS 'Module completion tracking for students';
COMMENT ON TABLE quiz_attempts IS 'Quiz attempt tracking for students';
COMMENT ON TABLE poll_responses IS 'Poll response tracking for students';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates the missing tables from discussions_tables.sql:
-- 1. course_completions - Course completion tracking
-- 2. module_completions - Module completion tracking  
-- 3. quiz_attempts - Quiz attempt tracking
-- 4. poll_responses - Poll response tracking
--
-- These tables are needed by the backend but weren't created yet.
-- =====================================================
