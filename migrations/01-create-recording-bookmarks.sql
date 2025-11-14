-- =====================================================
-- MIGRATION 01: Create recording_bookmarks table
-- =====================================================
-- Run this FIRST before any other migrations
-- This is a new table, no existing data to worry about

CREATE TABLE IF NOT EXISTS recording_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  recording_id UUID NOT NULL REFERENCES live_class_recordings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only bookmark a recording once
  UNIQUE(user_email, recording_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_recording_bookmarks_user_email ON recording_bookmarks(user_email);
CREATE INDEX IF NOT EXISTS idx_recording_bookmarks_recording_id ON recording_bookmarks(recording_id);

-- Optional: Add RLS (Row Level Security) policies
ALTER TABLE recording_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON recording_bookmarks FOR SELECT
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can only create their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
  ON recording_bookmarks FOR INSERT
  WITH CHECK (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Users can only delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON recording_bookmarks FOR DELETE
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Verify table was created
SELECT 'recording_bookmarks table created successfully' AS status;

