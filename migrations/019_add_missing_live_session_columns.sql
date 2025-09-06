-- =====================================================
-- ADD MISSING LIVE SESSION COLUMNS
-- =====================================================
-- This migration adds ALL missing columns to the live_sessions table
-- that the backend is trying to use but don't exist in the schema

-- Add missing columns to live_sessions table
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS allow_recording BOOLEAN DEFAULT TRUE;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 50;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'general';
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS is_started BOOLEAN DEFAULT FALSE;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS host_email TEXT;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id) ON DELETE CASCADE;

-- Create office_hours table if it doesn't exist
CREATE TABLE IF NOT EXISTS office_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_email TEXT NOT NULL REFERENCES teachers(email) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    is_virtual BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    max_students_per_slot INTEGER DEFAULT 1,
    slot_duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON COLUMN live_sessions.allow_recording IS 'Whether recording is allowed for this session';
COMMENT ON COLUMN live_sessions.require_approval IS 'Whether participants need approval to join';
COMMENT ON COLUMN live_sessions.max_participants IS 'Maximum number of participants allowed';
COMMENT ON COLUMN live_sessions.session_type IS 'Type of session (general, lecture, discussion, etc.)';
COMMENT ON COLUMN live_sessions.is_started IS 'Whether the teacher has started the session';
COMMENT ON COLUMN live_sessions.started_at IS 'When the teacher actually started the session';
COMMENT ON COLUMN live_sessions.duration_minutes IS 'Duration of the session in minutes';
COMMENT ON COLUMN live_sessions.host_email IS 'Email of the session host (usually same as teacher_email)';
COMMENT ON COLUMN live_sessions.end_at IS 'When the session ended (alternative to end_time)';
COMMENT ON COLUMN live_sessions.module_id IS 'Module this session belongs to (optional)';
COMMENT ON TABLE office_hours IS 'Teacher office hours schedule';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This adds the missing columns that the backend expects:
-- - allow_recording: Controls whether sessions can be recorded
-- - require_approval: Controls if participants need approval to join
-- - max_participants: Limits the number of participants
-- - session_type: Categorizes the type of session
-- - is_started: Tracks if teacher has started the session
-- - started_at: Timestamp when session was actually started
-- =====================================================
