-- =====================================================
-- ADD PLATFORM AND ZOOM COLUMNS TO LIVE_SESSIONS
-- =====================================================
-- This migration adds Zoom integration columns to the live_sessions table

-- Add platform column to indicate which platform is used (livekit, zoom, etc.)
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'zoom';

-- Add Zoom-specific columns
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS zoom_meeting_id BIGINT;

ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS zoom_meeting_url TEXT;

ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS zoom_password TEXT;

ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS zoom_join_url TEXT;

ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS zoom_start_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN live_sessions.platform IS 'Platform used for live sessions (livekit, zoom, etc.)';
COMMENT ON COLUMN live_sessions.zoom_meeting_id IS 'Zoom meeting ID';
COMMENT ON COLUMN live_sessions.zoom_meeting_url IS 'Zoom meeting URL';
COMMENT ON COLUMN live_sessions.zoom_password IS 'Zoom meeting password';
COMMENT ON COLUMN live_sessions.zoom_join_url IS 'Zoom join URL for participants';
COMMENT ON COLUMN live_sessions.zoom_start_url IS 'Zoom start URL for host';

-- Create index on platform for faster queries
CREATE INDEX IF NOT EXISTS idx_live_sessions_platform ON live_sessions(platform);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
