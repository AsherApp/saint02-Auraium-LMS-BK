-- =============================================================================
-- LIVE CLASS MESSAGES MIGRATION
-- =============================================================================
-- This migration creates the 'live_class_messages' table to store real-time
-- chat messages exchanged during live classes.
-- =============================================================================

-- Create the live_class_messages table
CREATE TABLE IF NOT EXISTS live_class_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    live_class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL, -- Assuming a generic 'users' table or similar for sender_id
    sender_email TEXT NOT NULL, -- For display and RLS policies
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_live_class_messages_live_class_id ON live_class_messages(live_class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_messages_sender_id ON live_class_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_live_class_messages_created_at ON live_class_messages(created_at);

-- Apply the existing trigger for automatically updating 'updated_at'
-- This assumes `update_updated_at_column()` function is already defined in the database
CREATE TRIGGER update_live_class_messages_updated_at BEFORE UPDATE ON live_class_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for live_class_messages
ALTER TABLE live_class_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for live_class_messages
-- Users can view messages in live classes they have access to
CREATE POLICY "Users can view live class messages" ON live_class_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM live_classes lc
            WHERE lc.id = live_class_id
            AND (
                lc.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
                OR EXISTS (
                    -- Placeholder for student enrollment check
                    -- This needs to be refined based on actual enrollment logic
                    SELECT 1 FROM students s
                    WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
                    -- AND s.id IS ENROLLED IN lc.course_id (if course-specific)
                )
            )
        )
    );

-- Users can insert messages into live classes they have access to
CREATE POLICY "Users can insert live class messages" ON live_class_messages
    FOR INSERT WITH CHECK (
        sender_email = current_setting('request.jwt.claims', true)::json->>'email'
        AND EXISTS (
            SELECT 1 FROM live_classes lc
            WHERE lc.id = live_class_id
            AND (
                lc.teacher_id = (SELECT id FROM teachers WHERE email = current_setting('request.jwt.claims', true)::json->>'email')
                OR EXISTS (
                    -- Placeholder for student enrollment check
                    SELECT 1 FROM students s
                    WHERE s.email = current_setting('request.jwt.claims', true)::json->>'email'
                )
            )
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT ON live_class_messages TO authenticated;
