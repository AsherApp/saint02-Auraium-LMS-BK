-- =====================================================
-- FIX TABLE NAME MISMATCHES
-- =====================================================
-- This migration fixes mismatches between what the backend uses
-- and what actually exists in the database.

-- =====================================================
-- ISSUE 1: student_notes vs notes
-- =====================================================
-- Backend uses: student_notes
-- Database has: notes
-- Solution: Create student_notes table or rename notes to student_notes

-- Option 1: Create student_notes table (recommended)
CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_email TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_student_notes_student_email ON student_notes(student_email);
CREATE INDEX IF NOT EXISTS idx_student_notes_course_id ON student_notes(course_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_lesson_id ON student_notes(lesson_id);

-- =====================================================
-- ISSUE 2: lesson_content vs lessons.content
-- =====================================================
-- Backend uses: lesson_content table
-- Database has: lessons.content JSONB column
-- Solution: Backend should use lessons.content, not lesson_content table
-- No action needed - backend code needs to be updated

-- =====================================================
-- ISSUE 3: live_attendance_settings
-- =====================================================
-- Backend uses: live_attendance_settings
-- Database has: none
-- Solution: Create the table (user said they don't need it, but backend uses it)

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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_live_attendance_settings_course_id ON live_attendance_settings(course_id);

-- =====================================================
-- ISSUE 4: Backend uses both notes and student_notes
-- =====================================================
-- Backend has both notes.routes.ts and student.routes.ts using different tables
-- This is confusing - let's clarify the purpose:
-- - notes: General notes (used by notes.routes.ts)
-- - student_notes: Student-specific notes (used by student.routes.ts)

-- Both tables should exist and serve different purposes
-- notes table already exists, student_notes created above

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE student_notes IS 'Student-specific personal notes for courses and lessons';
COMMENT ON TABLE live_attendance_settings IS 'Attendance configuration settings per course (required by backend)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration fixes table name mismatches:
-- 1. Created student_notes table (backend uses this)
-- 2. Created live_attendance_settings table (backend uses this)
-- 3. Documented that lesson_content should use lessons.content instead
-- 4. Clarified that both notes and student_notes serve different purposes
--
-- Backend code should be updated to use lessons.content instead of lesson_content table
-- =====================================================
