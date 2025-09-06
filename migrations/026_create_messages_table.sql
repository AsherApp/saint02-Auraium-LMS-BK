-- Create messages table for general messaging system
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    read BOOLEAN DEFAULT FALSE,
    starred BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    thread_id UUID,
    parent_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_from_email ON messages(from_email);
CREATE INDEX IF NOT EXISTS idx_messages_to_email ON messages(to_email);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_starred ON messages(starred);
CREATE INDEX IF NOT EXISTS idx_messages_archived ON messages(archived);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        from_email = current_setting('request.jwt.claims', true)::json->>'email' OR
        to_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (
        from_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (
        from_email = current_setting('request.jwt.claims', true)::json->>'email' OR
        to_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (
        from_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();
