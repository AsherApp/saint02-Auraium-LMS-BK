-- Add Zoom-like flow fields to live_sessions table
-- This implements the flow where teachers start classes and students can only join

-- Add new fields to track session state
ALTER TABLE live_sessions 
ADD COLUMN IF NOT EXISTS is_started BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_live_sessions_is_started ON live_sessions(is_started);
CREATE INDEX IF NOT EXISTS idx_live_sessions_started_at ON live_sessions(started_at);

-- Update existing sessions to have is_started = true if status is 'active'
UPDATE live_sessions 
SET is_started = TRUE, started_at = created_at 
WHERE status = 'active' AND is_started IS NULL;

-- Add comment to explain the new flow
COMMENT ON COLUMN live_sessions.is_started IS 'Whether the teacher has started the session (Zoom-like flow)';
COMMENT ON COLUMN live_sessions.started_at IS 'When the teacher actually started the session';
