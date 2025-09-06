-- Create recordings table for live session recordings
CREATE TABLE IF NOT EXISTS recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    session_id TEXT NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_email TEXT NOT NULL,
    teacher_name TEXT,
    duration INTEGER DEFAULT 0, -- Duration in seconds
    file_size BIGINT DEFAULT 0, -- File size in bytes
    file_url TEXT,
    thumbnail_url TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    view_count INTEGER DEFAULT 0,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    quality TEXT DEFAULT 'medium', -- low, medium, high, ultra
    format TEXT DEFAULT 'mp4' -- mp4, webm, etc.
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recordings_course_id ON recordings(course_id);
CREATE INDEX IF NOT EXISTS idx_recordings_teacher_email ON recordings(teacher_email);
CREATE INDEX IF NOT EXISTS idx_recordings_session_id ON recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_recordings_is_bookmarked ON recordings(is_bookmarked);

-- Create live_sessions table to store live session data
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL, -- The actual session ID used in LiveKit
    title TEXT NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_email TEXT NOT NULL,
    teacher_name TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration INTEGER DEFAULT 0, -- Duration in seconds
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
    max_participants INTEGER,
    recording_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for live_sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_teacher_email ON live_sessions(teacher_email);
CREATE INDEX IF NOT EXISTS idx_live_sessions_session_id ON live_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_start_time ON live_sessions(start_time);

-- Create live_session_participants table to track who attended
CREATE TABLE IF NOT EXISTS live_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES live_sessions(session_id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    student_name TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    duration INTEGER DEFAULT 0, -- How long they stayed in seconds
    is_present BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for live_session_participants
CREATE INDEX IF NOT EXISTS idx_live_session_participants_session_id ON live_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_live_session_participants_student_email ON live_session_participants(student_email);
CREATE INDEX IF NOT EXISTS idx_live_session_participants_is_present ON live_session_participants(is_present);

-- Create live_session_chat table to store chat messages
CREATE TABLE IF NOT EXISTS live_session_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES live_sessions(session_id) ON DELETE CASCADE,
    sender_email TEXT NOT NULL,
    sender_name TEXT,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for live_session_chat
CREATE INDEX IF NOT EXISTS idx_live_session_chat_session_id ON live_session_chat(session_id);
CREATE INDEX IF NOT EXISTS idx_live_session_chat_sender_email ON live_session_chat(sender_email);
CREATE INDEX IF NOT EXISTS idx_live_session_chat_timestamp ON live_session_chat(timestamp);

-- Create live_session_polls table to store polls
CREATE TABLE IF NOT EXISTS live_session_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES live_sessions(session_id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of {text, votes} objects
    total_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Create indexes for live_session_polls
CREATE INDEX IF NOT EXISTS idx_live_session_polls_session_id ON live_session_polls(session_id);
CREATE INDEX IF NOT EXISTS idx_live_session_polls_created_at ON live_session_polls(created_at);

-- Create live_session_resources table to store shared resources
CREATE TABLE IF NOT EXISTS live_session_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES live_sessions(session_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_type TEXT, -- pdf, image, document, etc.
    file_size BIGINT,
    shared_by TEXT NOT NULL, -- email of person who shared
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for live_session_resources
CREATE INDEX IF NOT EXISTS idx_live_session_resources_session_id ON live_session_resources(session_id);
CREATE INDEX IF NOT EXISTS idx_live_session_resources_shared_by ON live_session_resources(shared_by);
CREATE INDEX IF NOT EXISTS idx_live_session_resources_shared_at ON live_session_resources(shared_at);

-- Create live_session_notes table to store session notes
CREATE TABLE IF NOT EXISTS live_session_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES live_sessions(session_id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for live_session_notes
CREATE INDEX IF NOT EXISTS idx_live_session_notes_session_id ON live_session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_live_session_notes_student_email ON live_session_notes(student_email);
CREATE INDEX IF NOT EXISTS idx_live_session_notes_created_at ON live_session_notes(created_at);
