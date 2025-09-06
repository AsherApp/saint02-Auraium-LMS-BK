-- Forum Tables Migration
-- This migration creates the necessary tables for forum functionality

-- Forum Categories Table
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts Table
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Replies Table
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_category_id ON forum_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_email ON forum_posts(author_email);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_pinned ON forum_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON forum_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_email ON forum_replies(author_email);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);

-- RLS Policies for forum_categories
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_categories_select_policy" ON forum_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "forum_categories_insert_policy" ON forum_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "forum_categories_update_policy" ON forum_categories
    FOR UPDATE USING (true);

CREATE POLICY "forum_categories_delete_policy" ON forum_categories
    FOR DELETE USING (true);

-- RLS Policies for forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_posts_select_policy" ON forum_posts
    FOR SELECT USING (true);

CREATE POLICY "forum_posts_insert_policy" ON forum_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "forum_posts_update_policy" ON forum_posts
    FOR UPDATE USING (true);

CREATE POLICY "forum_posts_delete_policy" ON forum_posts
    FOR DELETE USING (true);

-- RLS Policies for forum_replies
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_replies_select_policy" ON forum_replies
    FOR SELECT USING (true);

CREATE POLICY "forum_replies_insert_policy" ON forum_replies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "forum_replies_update_policy" ON forum_replies
    FOR UPDATE USING (true);

CREATE POLICY "forum_replies_delete_policy" ON forum_replies
    FOR DELETE USING (true);

-- Insert some default forum categories
INSERT INTO forum_categories (name, description, created_by) VALUES
    ('General Discussion', 'General topics and discussions', 'system'),
    ('Course Help', 'Questions and help related to courses', 'system'),
    ('Technical Support', 'Technical issues and support', 'system'),
    ('Announcements', 'Important announcements and updates', 'system'),
    ('Student Life', 'Student-related discussions and activities', 'system')
ON CONFLICT (name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_forum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_forum_categories_updated_at
    BEFORE UPDATE ON forum_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_updated_at();

CREATE TRIGGER update_forum_posts_updated_at
    BEFORE UPDATE ON forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_updated_at();

CREATE TRIGGER update_forum_replies_updated_at
    BEFORE UPDATE ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_updated_at();
