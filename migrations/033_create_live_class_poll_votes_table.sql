-- =============================================================================
-- LIVE CLASS POLL VOTES MIGRATION
-- =============================================================================
-- This migration creates the 'live_class_poll_votes' table to store votes
-- for polls conducted during live classes.
-- =============================================================================

-- Create the live_class_poll_votes table
CREATE TABLE IF NOT EXISTS live_class_poll_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID NOT NULL REFERENCES live_class_polls(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL, -- ID of the user who voted
    option_index INTEGER NOT NULL, -- Index of the chosen option (0-based)
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure a user can only vote once per poll
    UNIQUE (poll_id, voter_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_poll_votes_poll_id ON live_class_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_live_class_poll_votes_voter_id ON live_class_poll_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_live_class_poll_votes_created_at ON live_class_poll_votes(created_at);

-- Enable Row Level Security (RLS) for live_class_poll_votes
ALTER TABLE live_class_poll_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_class_poll_votes
-- Users can view their own votes
CREATE POLICY "Users can view their own live class poll votes" ON live_class_poll_votes
    FOR SELECT USING (voter_id = (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Users can insert a vote if the poll is active and they haven't voted yet
CREATE POLICY "Users can insert live class poll votes" ON live_class_poll_votes
    FOR INSERT WITH CHECK (
        voter_id = (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
        AND EXISTS (
            SELECT 1 FROM live_class_polls lcp
            WHERE lcp.id = poll_id
            AND lcp.is_active = TRUE
        )
    );

-- Teachers can view all votes for their polls
CREATE POLICY "Teachers can view all votes for their polls" ON live_class_poll_votes
    FOR SELECT TO teachers USING (
        EXISTS (
            SELECT 1 FROM live_class_polls lcp
            WHERE lcp.id = poll_id
            AND lcp.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON live_class_poll_votes TO authenticated;
