-- Migration: 037_create_live_class_recordings_table.sql
-- Description: Creates the live_class_recordings table to store metadata about recorded live classes.

-- Create the live_class_recordings table
CREATE TABLE IF NOT EXISTS live_class_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  agora_sid TEXT UNIQUE NOT NULL, -- Agora Recording Session ID
  resource_id TEXT UNIQUE NOT NULL, -- Agora Recording Resource ID
  file_url TEXT, -- URL to the recorded file (e.g., S3, CDN)
  duration_seconds INTEGER, -- Duration of the recording in seconds
  size_bytes BIGINT, -- Size of the recording file in bytes
  status TEXT NOT NULL DEFAULT 'pending', -- e.g., 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_class_recordings_live_class_id ON live_class_recordings(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_recordings_agora_sid ON live_class_recordings(agora_sid);
CREATE INDEX IF NOT EXISTS idx_live_class_recordings_resource_id ON live_class_recordings(resource_id);

-- Enable Row Level Security (RLS)
ALTER TABLE live_class_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policy for Teachers:
-- Teachers can view, insert, update, and delete their own live class recordings.
CREATE POLICY teachers_manage_recordings ON live_class_recordings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM live_classes lc
    WHERE lc.id = live_class_id AND lc.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM live_classes lc
    WHERE lc.id = live_class_id AND lc.teacher_id = auth.uid()
  )
);

-- RLS Policy for Students:
-- Students can view recordings for live classes they are enrolled in.
CREATE POLICY students_view_recordings ON live_class_recordings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM live_classes lc
    JOIN course_enrollments ce ON lc.course_id = ce.course_id
    WHERE lc.id = live_class_id AND ce.student_id = auth.uid()
  )
);

-- RLS Policy for Admins (if applicable, assuming 'admin' role exists in public.users or similar)
-- Admins can view all recordings.
-- This policy assumes a 'role' column in the 'users' table or a similar mechanism.
-- If not, this policy might need adjustment or removal.
CREATE POLICY admins_view_all_recordings ON live_class_recordings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);
